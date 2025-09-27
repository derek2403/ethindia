// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.22;

import { ECDSA } from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import { MessageHashUtils } from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/// @title SessionModule - Manages session keys for minimal wallets
/// @notice Enables time-limited, policy-restricted execution via session keys
contract SessionModule {
    using ECDSA for bytes32;

    struct SessionPolicy {
        address sessionPubKey;     // Session public key for signature verification
        uint256 expiry;           // Timestamp when session expires
        mapping(address => uint256) tokenLimits; // Per-token spend caps
        mapping(address => bool) allowedEscrows;  // Allowed escrow contracts
        bool isActive;            // Session active status
    }

    struct TokenLimit {
        address token;
        uint256 limit;
    }

    struct EscrowPermission {
        address escrow;
        bool allowed;
    }

    /// @notice Mapping from wallet address to session policy
    mapping(address => SessionPolicy) public sessions;

    /// @notice Events
    event SessionInstalled(address indexed wallet, address indexed sessionPubKey, uint256 expiry);
    event SessionRevoked(address indexed wallet);
    event SessionUsed(address indexed wallet, address indexed token, uint256 amount);

    /// @notice Errors
    error SessionExpired();
    error SessionNotActive();
    error InvalidSignature();
    error TokenLimitExceeded();
    error EscrowNotAllowed();
    error OnlyWalletOwner();

    /// @notice Install a session key with policy restrictions
    /// @param wallet The wallet address this session controls
    /// @param sessionPubKey The session public key
    /// @param expiry Session expiration timestamp
    /// @param tokenLimits Array of token spending limits
    /// @param escrowPermissions Array of allowed escrow contracts
    function installSession(
        address wallet,
        address sessionPubKey,
        uint256 expiry,
        TokenLimit[] calldata tokenLimits,
        EscrowPermission[] calldata escrowPermissions
    ) external {
        // Only wallet itself can install sessions (called by Installer or wallet owner)
        if (msg.sender != wallet) revert OnlyWalletOwner();

        SessionPolicy storage policy = sessions[wallet];
        policy.sessionPubKey = sessionPubKey;
        policy.expiry = expiry;
        policy.isActive = true;

        // Set token limits
        for (uint256 i = 0; i < tokenLimits.length; i++) {
            policy.tokenLimits[tokenLimits[i].token] = tokenLimits[i].limit;
        }

        // Set escrow permissions
        for (uint256 i = 0; i < escrowPermissions.length; i++) {
            policy.allowedEscrows[escrowPermissions[i].escrow] = escrowPermissions[i].allowed;
        }

        emit SessionInstalled(wallet, sessionPubKey, expiry);
    }

    /// @notice Revoke an active session
    /// @param wallet The wallet address
    function revokeSession(address wallet) external {
        if (msg.sender != wallet) revert OnlyWalletOwner();
        sessions[wallet].isActive = false;
        emit SessionRevoked(wallet);
    }

    /// @notice Verify session signature and enforce policy (verification only)
    /// @param wallet The wallet address
    /// @param target The target contract address (must be allowed escrow)
    /// @param token The token being transferred (address(0) for native)
    /// @param amount The amount being transferred
    /// @param data The call data
    /// @param signature The session signature
    function verifySession(
        address wallet,
        address target,
        address token,
        uint256 amount,
        bytes calldata data,
        bytes calldata signature
    ) external returns (bool) {
        SessionPolicy storage policy = sessions[wallet];

        // Check session is active and not expired
        if (!policy.isActive) revert SessionNotActive();
        if (block.timestamp > policy.expiry) revert SessionExpired();

        // Check escrow is allowed
        if (!policy.allowedEscrows[target]) revert EscrowNotAllowed();

        // Check token limit
        if (amount > 0) {
            if (policy.tokenLimits[token] < amount) revert TokenLimitExceeded();
            // Decrease available limit
            policy.tokenLimits[token] -= amount;
        }

        // Verify signature
        bytes32 messageHash = keccak256(abi.encodePacked(
            wallet, target, token, amount, data, block.chainid
        ));
        bytes32 ethSignedMessageHash = MessageHashUtils.toEthSignedMessageHash(messageHash);
        address recoveredSigner = ethSignedMessageHash.recover(signature);
        if (recoveredSigner != policy.sessionPubKey) revert InvalidSignature();

        // Session verification successful - update limits
        if (amount > 0) {
            emit SessionUsed(wallet, token, amount);
        }

        return true;
    }

    /// @notice Get session info
    /// @param wallet The wallet address
    function getSession(address wallet) external view returns (
        address sessionPubKey,
        uint256 expiry,
        bool isActive
    ) {
        SessionPolicy storage policy = sessions[wallet];
        return (policy.sessionPubKey, policy.expiry, policy.isActive);
    }

    /// @notice Get token limit for a wallet
    /// @param wallet The wallet address
    /// @param token The token address
    function getTokenLimit(address wallet, address token) external view returns (uint256) {
        return sessions[wallet].tokenLimits[token];
    }

    /// @notice Check if escrow is allowed
    /// @param wallet The wallet address
    /// @param escrow The escrow address
    function isEscrowAllowed(address wallet, address escrow) external view returns (bool) {
        return sessions[wallet].allowedEscrows[escrow];
    }
}
