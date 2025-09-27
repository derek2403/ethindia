// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.22;

import { OApp, Origin, MessagingFee } from "@layerzerolabs/oapp-evm/contracts/oapp/OApp.sol";
import { OAppOptionsType3 } from "@layerzerolabs/oapp-evm/contracts/oapp/libs/OAppOptionsType3.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { WalletFactory } from "./WalletFactory.sol";
import { SessionModule } from "./SessionModule.sol";

/// @title Installer - Receives cross-chain session installation messages
/// @notice Deployed on Hedera and Flow testnets to install session keys
contract Installer is OApp, OAppOptionsType3 {
    /// @notice The wallet factory for creating minimal wallets
    WalletFactory public immutable walletFactory;

    /// @notice Events
    event SessionInstalled(
        address indexed user,
        address indexed wallet,
        address indexed sessionPubKey,
        uint256 expiry,
        uint32 sourceChainEid
    );
    event MessageReceived(uint32 sourceChainEid, bytes32 sender, bytes message);

    /// @notice Errors
    error InvalidMessage();
    error SessionExpired();

    /// @notice Initialize Installer
    /// @param _endpoint LayerZero endpoint address
    /// @param _owner Contract owner
    /// @param _walletFactory Wallet factory contract
    constructor(
        address _endpoint,
        address _owner,
        WalletFactory _walletFactory
    ) OApp(_endpoint, _owner) Ownable(_owner) {
        walletFactory = _walletFactory;
    }

    /// @notice Handle incoming session installation messages
    /// @param _origin Message origin metadata
    /// @param _message The encoded session installation message
    function _lzReceive(
        Origin calldata _origin,
        bytes32 /*_guid*/,
        bytes calldata _message,
        address /*_executor*/,
        bytes calldata /*_extraData*/
    ) internal override {
        emit MessageReceived(_origin.srcEid, _origin.sender, _message);

        // Decode the session installation message
        (
            address user,
            address sessionPubKey,
            uint256 expiry,
            Destination[] memory destinations,
            TokenPolicy[] memory tokenPolicies
        ) = abi.decode(_message, (address, address, uint256, Destination[], TokenPolicy[]));

        // Verify session hasn't expired
        if (expiry <= block.timestamp) revert SessionExpired();

        // Install the session on this chain
        _installSession(
            user,
            sessionPubKey,
            expiry,
            destinations,
            tokenPolicies,
            _origin.srcEid
        );
    }

    /// @notice Install session on the current chain
    /// @param user The user address
    /// @param sessionPubKey The session public key
    /// @param expiry Session expiration timestamp
    /// @param destinations All destination configurations
    /// @param tokenPolicies Token spending policies
    /// @param sourceChainEid Source chain endpoint ID
    function _installSession(
        address user,
        address sessionPubKey,
        uint256 expiry,
        Destination[] memory destinations,
        TokenPolicy[] memory tokenPolicies,
        uint32 sourceChainEid
    ) internal {
        // Generate deterministic wallet address
        bytes32 salt = walletFactory.generateSalt(user, block.chainid);
        address wallet = walletFactory.deployIfNeeded(user, salt);

        // Find escrow address for current chain
        address escrowAddr = _findEscrowForCurrentChain(destinations);
        require(escrowAddr != address(0), "Escrow not found for current chain");

        // Convert token policies to session module format
        SessionModule.TokenLimit[] memory tokenLimits = new SessionModule.TokenLimit[](tokenPolicies.length);
        for (uint256 i = 0; i < tokenPolicies.length; i++) {
            tokenLimits[i] = SessionModule.TokenLimit({
                token: tokenPolicies[i].token,
                limit: tokenPolicies[i].limit
            });
        }

        // Set up escrow permissions (only the designated escrow is allowed)
        SessionModule.EscrowPermission[] memory escrowPermissions = new SessionModule.EscrowPermission[](1);
        escrowPermissions[0] = SessionModule.EscrowPermission({
            escrow: escrowAddr,
            allowed: true
        });

        // Install session via session module
        SessionModule sessionModule = walletFactory.sessionModule();
        sessionModule.installSession(
            wallet,
            sessionPubKey,
            expiry,
            tokenLimits,
            escrowPermissions
        );

        emit SessionInstalled(
            user,
            wallet,
            sessionPubKey,
            expiry,
            sourceChainEid
        );
    }

    /// @notice Find escrow address for the current chain
    /// @param destinations Array of destination configurations
    /// @return escrowAddr The escrow address for current chain
    function _findEscrowForCurrentChain(
        Destination[] memory destinations
    ) internal view returns (address escrowAddr) {
        uint32 currentEid = _getCurrentChainEid();
        
        for (uint256 i = 0; i < destinations.length; i++) {
            if (destinations[i].chainEid == currentEid) {
                return destinations[i].escrowAddr;
            }
        }
        
        return address(0);
    }

    /// @notice Get current chain's LayerZero endpoint ID
    /// @return The endpoint ID for current chain
    function _getCurrentChainEid() internal view returns (uint32) {
        // Map chain IDs to LayerZero V2 endpoint IDs
        if (block.chainid == 296) return 40285; // Hedera testnet
        if (block.chainid == 545) return 40351; // Flow testnet
        return 0; // Unknown chain
    }

    /// @notice Destination chain configuration (copied from Coordinator for decoding)
    struct Destination {
        uint32 chainEid;      // LayerZero endpoint ID
        address escrowAddr;   // Escrow contract address on destination
    }

    /// @notice Token spending policy (copied from Coordinator for decoding)
    struct TokenPolicy {
        address token;        // Token address (address(0) for native)
        uint256 limit;        // Spending limit
    }

    /// @notice Emergency function to manually install session (owner only)
    /// @param user The user address
    /// @param sessionPubKey The session public key
    /// @param expiry Session expiration timestamp
    /// @param escrowAddr The escrow address for this chain
    /// @param tokenLimits Token spending limits
    function emergencyInstallSession(
        address user,
        address sessionPubKey,
        uint256 expiry,
        address escrowAddr,
        SessionModule.TokenLimit[] calldata tokenLimits
    ) external onlyOwner {
        bytes32 salt = walletFactory.generateSalt(user, block.chainid);
        address wallet = walletFactory.deployIfNeeded(user, salt);

        SessionModule.EscrowPermission[] memory escrowPermissions = new SessionModule.EscrowPermission[](1);
        escrowPermissions[0] = SessionModule.EscrowPermission({
            escrow: escrowAddr,
            allowed: true
        });

        SessionModule sessionModule = walletFactory.sessionModule();
        sessionModule.installSession(
            wallet,
            sessionPubKey,
            expiry,
            tokenLimits,
            escrowPermissions
        );

        emit SessionInstalled(user, wallet, sessionPubKey, expiry, 0);
    }
}
