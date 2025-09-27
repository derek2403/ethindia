// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.22;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SessionModule } from "./SessionModule.sol";

/// @title MinimalWallet - Simple smart account with session key support
/// @notice A minimal smart wallet that can be controlled by owner or authorized session keys
contract MinimalWallet {
    /// @notice The owner of this wallet
    address public immutable owner;
    
    /// @notice The session module managing session keys
    SessionModule public immutable sessionModule;

    /// @notice Events
    event Executed(address indexed target, uint256 value, bytes data, bool success);
    event SessionExecuted(address indexed target, address indexed token, uint256 amount, bool success);

    /// @notice Errors
    error OnlyOwnerOrSession();
    error ExecutionFailed();
    error InsufficientBalance();

    /// @notice Initialize the wallet
    /// @param _owner The wallet owner
    /// @param _sessionModule The session module contract
    constructor(address _owner, SessionModule _sessionModule) {
        owner = _owner;
        sessionModule = _sessionModule;
    }

    /// @notice Execute a transaction from this wallet (owner only)
    /// @param target The target contract
    /// @param value The ETH value to send
    /// @param data The call data
    function execute(
        address target,
        uint256 value,
        bytes calldata data
    ) external returns (bool success, bytes memory returnData) {
        if (msg.sender != owner) revert OnlyOwnerOrSession();
        
        (success, returnData) = target.call{value: value}(data);
        emit Executed(target, value, data, success);
        
        return (success, returnData);
    }

    /// @notice Execute a transaction via session key
    /// @param target The target contract (must be approved escrow)
    /// @param token The token being transferred (address(0) for native)
    /// @param amount The amount being transferred
    /// @param data The call data
    /// @param signature The session signature
    function executeAsWallet(
        address target,
        address token,
        uint256 amount,
        bytes calldata data,
        bytes calldata signature
    ) external payable returns (bool success, bytes memory returnData) {
        // Verify session through session module
        bool sessionValid = sessionModule.verifySession(
            address(this),
            target,
            token,
            amount,
            data,
            signature
        );

        require(sessionValid, "Session verification failed");

        // Execute the call from this wallet with proper value forwarding
        if (token == address(0) && amount > 0) {
            // For native token deposits, forward the received ETH
            require(msg.value >= amount, "Insufficient ETH sent");
            (success, returnData) = target.call{value: amount}(data);
        } else {
            // For ERC-20 or zero-value calls
            (success, returnData) = target.call(data);
        }

        emit SessionExecuted(target, token, amount, success);
        return (success, returnData);
    }

    /// @notice Transfer ERC-20 tokens (owner only)
    /// @param token The token contract
    /// @param to The recipient
    /// @param amount The amount to transfer
    function transferToken(
        IERC20 token,
        address to,
        uint256 amount
    ) external {
        if (msg.sender != owner) revert OnlyOwnerOrSession();
        require(token.transfer(to, amount), "Transfer failed");
    }

    /// @notice Transfer ETH (owner only)
    /// @param to The recipient
    /// @param amount The amount to transfer
    function transferETH(address payable to, uint256 amount) external {
        if (msg.sender != owner) revert OnlyOwnerOrSession();
        if (address(this).balance < amount) revert InsufficientBalance();
        
        (bool success,) = to.call{value: amount}("");
        require(success, "ETH transfer failed");
    }

    /// @notice Approve token spending (owner only)
    /// @param token The token contract
    /// @param spender The spender
    /// @param amount The amount to approve
    function approveToken(
        IERC20 token,
        address spender,
        uint256 amount
    ) external {
        if (msg.sender != owner) revert OnlyOwnerOrSession();
        require(token.approve(spender, amount), "Approval failed");
    }

    /// @notice Install a session key (owner only, delegates to session module)
    /// @param sessionPubKey The session public key
    /// @param expiry Session expiration timestamp
    /// @param tokenLimits Array of token spending limits
    /// @param escrowPermissions Array of allowed escrow contracts
    function installSession(
        address sessionPubKey,
        uint256 expiry,
        SessionModule.TokenLimit[] calldata tokenLimits,
        SessionModule.EscrowPermission[] calldata escrowPermissions
    ) external {
        if (msg.sender != owner) revert OnlyOwnerOrSession();
        
        sessionModule.installSession(
            address(this),
            sessionPubKey,
            expiry,
            tokenLimits,
            escrowPermissions
        );
    }

    /// @notice Revoke session key (owner only)
    function revokeSession() external {
        if (msg.sender != owner) revert OnlyOwnerOrSession();
        sessionModule.revokeSession(address(this));
    }

    /// @notice Get session info
    function getSession() external view returns (
        address sessionPubKey,
        uint256 expiry,
        bool isActive
    ) {
        return sessionModule.getSession(address(this));
    }

    /// @notice Receive ETH
    receive() external payable {}

    /// @notice Fallback function
    fallback() external payable {}
}
