// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.22;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

/// @title Escrow - Receives token and native deposits from minimal wallets
/// @notice Holds user funds deposited via session keys for future use
contract Escrow is Ownable {
    /// @notice Deposit records
    struct Deposit {
        address user;
        address token; // address(0) for native currency
        uint256 amount;
        uint256 timestamp;
    }

    /// @notice Array of all deposits
    Deposit[] public deposits;

    /// @notice Mapping from user to their deposit indices
    mapping(address => uint256[]) public userDeposits;

    /// @notice Mapping from user to token to total deposited amount
    mapping(address => mapping(address => uint256)) public userTokenBalances;

    /// @notice Events
    event NativeDeposited(address indexed user, uint256 amount);
    event ERC20Deposited(address indexed user, address indexed token, uint256 amount);
    event Withdrawn(address indexed user, address indexed token, uint256 amount);

    /// @notice Errors
    error InsufficientBalance();
    error TransferFailed();
    error ZeroAmount();

    constructor() Ownable(msg.sender) {}

    /// @notice Deposit native currency (ETH/HBAR/FLOW)
    function depositNative() external payable {
        if (msg.value == 0) revert ZeroAmount();

        // Record deposit
        deposits.push(Deposit({
            user: msg.sender,
            token: address(0),
            amount: msg.value,
            timestamp: block.timestamp
        }));

        uint256 depositIndex = deposits.length - 1;
        userDeposits[msg.sender].push(depositIndex);
        userTokenBalances[msg.sender][address(0)] += msg.value;

        emit NativeDeposited(msg.sender, msg.value);
    }

    /// @notice Deposit ERC-20 tokens
    /// @param token The token contract address
    /// @param amount The amount to deposit
    function depositERC20(address token, uint256 amount) external {
        if (amount == 0) revert ZeroAmount();
        require(token != address(0), "Invalid token address");

        // Transfer tokens from sender to this contract
        IERC20 tokenContract = IERC20(token);
        if (!tokenContract.transferFrom(msg.sender, address(this), amount)) revert TransferFailed();

        // Record deposit
        deposits.push(Deposit({
            user: msg.sender,
            token: token,
            amount: amount,
            timestamp: block.timestamp
        }));

        uint256 depositIndex = deposits.length - 1;
        userDeposits[msg.sender].push(depositIndex);
        userTokenBalances[msg.sender][token] += amount;

        emit ERC20Deposited(msg.sender, token, amount);
    }

    /// @notice Withdraw native currency (owner only)
    /// @param user The user to withdraw for
    /// @param amount The amount to withdraw
    function withdrawNative(address user, uint256 amount) external onlyOwner {
        if (userTokenBalances[user][address(0)] < amount) revert InsufficientBalance();
        if (address(this).balance < amount) revert InsufficientBalance();

        userTokenBalances[user][address(0)] -= amount;

        (bool success,) = payable(user).call{value: amount}("");
        if (!success) revert TransferFailed();

        emit Withdrawn(user, address(0), amount);
    }

    /// @notice Withdraw ERC-20 tokens (owner only)
    /// @param user The user to withdraw for
    /// @param token The token contract address
    /// @param amount The amount to withdraw
    function withdrawERC20(address user, address token, uint256 amount) external onlyOwner {
        if (userTokenBalances[user][token] < amount) revert InsufficientBalance();

        userTokenBalances[user][token] -= amount;

        IERC20 tokenContract = IERC20(token);
        if (!tokenContract.transfer(user, amount)) revert TransferFailed();

        emit Withdrawn(user, token, amount);
    }

    /// @notice Get user's balance for a specific token
    /// @param user The user address
    /// @param token The token address (address(0) for native)
    function getUserBalance(address user, address token) external view returns (uint256) {
        return userTokenBalances[user][token];
    }

    /// @notice Get user's deposit count
    /// @param user The user address
    function getUserDepositCount(address user) external view returns (uint256) {
        return userDeposits[user].length;
    }

    /// @notice Get total deposit count
    function getTotalDepositCount() external view returns (uint256) {
        return deposits.length;
    }

    /// @notice Get deposit details by index
    /// @param index The deposit index
    function getDeposit(uint256 index) external view returns (Deposit memory) {
        require(index < deposits.length, "Invalid index");
        return deposits[index];
    }

    /// @notice Emergency withdrawal of all funds (owner only)
    /// @param token The token address (address(0) for native)
    /// @param to The recipient address
    function emergencyWithdraw(address token, address to) external onlyOwner {
        if (token == address(0)) {
            // Withdraw all native currency
            uint256 balance = address(this).balance;
            (bool success,) = payable(to).call{value: balance}("");
            if (!success) revert TransferFailed();
        } else {
            // Withdraw all tokens
            IERC20 tokenContract = IERC20(token);
            uint256 balance = tokenContract.balanceOf(address(this));
            if (!tokenContract.transfer(to, balance)) revert TransferFailed();
        }
    }

    /// @notice Receive native currency
    receive() external payable {
        if (msg.value == 0) revert ZeroAmount();

        // Record deposit
        deposits.push(Deposit({
            user: msg.sender,
            token: address(0),
            amount: msg.value,
            timestamp: block.timestamp
        }));

        uint256 depositIndex = deposits.length - 1;
        userDeposits[msg.sender].push(depositIndex);
        userTokenBalances[msg.sender][address(0)] += msg.value;

        emit NativeDeposited(msg.sender, msg.value);
    }
}
