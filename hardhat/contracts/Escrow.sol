// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title Simple Escrow (Relayer-friendly)
 * @notice Minimal escrow with:
 *         - viewEscrow(merchant)
 *         - deposit(...)           // user-pays gas path (unchanged)
 *         - depositFor(from, ...)  // relayer path (Escrow is spender)
 *         - withdraw()             // merchant pulls all their balances
 * @dev Use address(0) to represent native token (ETH/FLOW/↯HBAR on EVM).
 */
contract Escrow is ReentrancyGuard {
    using SafeERC20 for IERC20;

    // merchant => token => balance
    mapping(address => mapping(address => uint256)) public merchantBalances;

    // track token list per merchant
    mapping(address => address[]) public merchantTokens;
    mapping(address => mapping(address => bool)) public merchantHasToken;

    event Deposited(address indexed payer, address indexed merchant, address indexed token, uint256 amount);
    event Withdrawn(address indexed merchant, address indexed token, uint256 amount);

    // ─────────────────────────────────────────────────────────────────────────────
    // Views
    // ─────────────────────────────────────────────────────────────────────────────

    function viewEscrow(address _merchant)
        external
        view
        returns (address[] memory tokens, uint256[] memory balances)
    {
        address[] memory list = merchantTokens[_merchant];
        uint256[] memory bals = new uint256[](list.length);
        for (uint256 i = 0; i < list.length; i++) {
            bals[i] = merchantBalances[_merchant][list[i]];
        }
        return (list, bals);
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Deposit (user calls directly; ERC20 pulled from msg.sender)
    // ─────────────────────────────────────────────────────────────────────────────

    function deposit(
        address[] calldata _merchants,
        address[] calldata _tokens,
        uint256[] calldata _amounts
    ) external payable nonReentrant {
        _validateArrays(_merchants, _tokens, _amounts);

        uint256 totalEth = _sumNative(_tokens, _amounts);
        require(msg.value == totalEth, "Escrow: bad native amount");

        for (uint256 i = 0; i < _merchants.length; i++) {
            _credit(_merchants[i], _tokens[i], _amounts[i], msg.sender);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // DepositFor (relayer calls; ERC20 pulled from `from`, Escrow must be spender)
    // ─────────────────────────────────────────────────────────────────────────────
    /**
     * @notice Relayer-friendly path. For ERC20, user must approve this Escrow as spender:
     *         IERC20(token).approve(address(this), amount)
     * @param _from      The token owner for ERC20 transferFrom (ignored for native legs)
     * @param _merchants Merchant list (same length as _tokens/_amounts)
     * @param _tokens    Token addresses (use address(0) for native)
     * @param _amounts   Amounts per leg
     */
    function depositFor(
        address _from,
        address[] calldata _merchants,
        address[] calldata _tokens,
        uint256[] calldata _amounts
    ) external payable nonReentrant {
        require(_from != address(0), "Escrow: from=0");
        _validateArrays(_merchants, _tokens, _amounts);

        uint256 totalEth = _sumNative(_tokens, _amounts);
        require(msg.value == totalEth, "Escrow: bad native amount");

        for (uint256 i = 0; i < _merchants.length; i++) {
            _creditFrom(_merchants[i], _tokens[i], _amounts[i], _from, msg.sender);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Withdraw (merchant pulls all)
    // ─────────────────────────────────────────────────────────────────────────────

    function withdraw() external nonReentrant {
        address merch = msg.sender;
        address[] memory tokens = merchantTokens[merch];
        bool any;

        for (uint256 i = 0; i < tokens.length; i++) {
            address token = tokens[i];
            uint256 bal = merchantBalances[merch][token];
            if (bal == 0) continue;

            merchantBalances[merch][token] = 0; // effects first
            any = true;

            if (token == address(0)) {
                (bool ok, ) = payable(merch).call{value: bal}("");
                require(ok, "Escrow: native xfer failed");
            } else {
                IERC20(token).safeTransfer(merch, bal);
            }

            emit Withdrawn(merch, token, bal);
        }

        require(any, "Escrow: nothing to withdraw");
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Internal helpers
    // ─────────────────────────────────────────────────────────────────────────────

    function _validateArrays(
        address[] calldata _merchants,
        address[] calldata _tokens,
        uint256[] calldata _amounts
    ) internal pure {
        require(
            _merchants.length == _tokens.length && _tokens.length == _amounts.length,
            "Escrow: length mismatch"
        );
        require(_merchants.length > 0, "Escrow: empty");
        for (uint256 i = 0; i < _merchants.length; i++) {
            require(_merchants[i] != address(0), "Escrow: merchant=0");
            require(_amounts[i] > 0, "Escrow: amount=0");
        }
    }

    function _sumNative(address[] calldata _tokens, uint256[] calldata _amounts) internal pure returns (uint256 s) {
        for (uint256 i = 0; i < _tokens.length; i++) {
            if (_tokens[i] == address(0)) s += _amounts[i];
        }
    }

    function _trackToken(address _merchant, address _token) internal {
        if (!merchantHasToken[_merchant][_token]) {
            merchantHasToken[_merchant][_token] = true;
            merchantTokens[_merchant].push(_token);
        }
    }

    // user-pays path: pull ERC20 from msg.sender
    function _credit(address _merchant, address _token, uint256 _amount, address _payer) internal {
        if (_token == address(0)) {
            merchantBalances[_merchant][_token] += _amount;
            _trackToken(_merchant, _token);
            emit Deposited(_payer, _merchant, _token, _amount);
        } else {
            IERC20(_token).safeTransferFrom(_payer, address(this), _amount);
            merchantBalances[_merchant][_token] += _amount;
            _trackToken(_merchant, _token);
            emit Deposited(_payer, _merchant, _token, _amount);
        }
    }

    // relayer path: pull ERC20 from _from (Escrow is approved spender)
    function _creditFrom(
        address _merchant,
        address _token,
        uint256 _amount,
        address _from,
        address _payer // msg.sender (relayer) for event clarity
    ) internal {
        if (_token == address(0)) {
            merchantBalances[_merchant][_token] += _amount;
            _trackToken(_merchant, _token);
            emit Deposited(_payer, _merchant, _token, _amount);
        } else {
            IERC20(_token).safeTransferFrom(_from, address(this), _amount);
            merchantBalances[_merchant][_token] += _amount;
            _trackToken(_merchant, _token);
            emit Deposited(_from, _merchant, _token, _amount);
        }
    }

    // Optional: accept stray native refunds
    receive() external payable {}
}