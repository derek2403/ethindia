// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.22;

import { OApp, Origin, MessagingFee } from "@layerzerolabs/oapp-evm/contracts/oapp/OApp.sol";
import { OAppOptionsType3 } from "@layerzerolabs/oapp-evm/contracts/oapp/libs/OAppOptionsType3.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { ECDSA } from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import { WalletFactory } from "./WalletFactory.sol";
import { SessionModule } from "./SessionModule.sol";

/// @title Coordinator - Sepolia OApp for cross-chain session installation
/// @notice Coordinates session key installation across multiple chains via LayerZero
contract Coordinator is OApp, OAppOptionsType3 {
    using ECDSA for bytes32;

    /// @notice Message type for session installation
    uint16 public constant INSTALL_SESSION = 1;

    /// @notice The wallet factory for creating minimal wallets
    WalletFactory public immutable walletFactory;

    /// @notice EIP-712 domain separator
    bytes32 public immutable DOMAIN_SEPARATOR;

    /// @notice EIP-712 typehash for SessionIntent
    bytes32 public constant SESSION_INTENT_TYPEHASH = keccak256(
        "SessionIntent(address user,address sessionPubKey,uint256 expiry,uint256 nonce,Destination[] destinations,TokenPolicy[] tokenPolicies)Destination(uint32 chainEid,address escrowAddr)TokenPolicy(address token,uint256 limit)"
    );

    /// @notice EIP-712 typehash for Destination
    bytes32 public constant DESTINATION_TYPEHASH = keccak256(
        "Destination(uint32 chainEid,address escrowAddr)"
    );

    /// @notice EIP-712 typehash for TokenPolicy
    bytes32 public constant TOKEN_POLICY_TYPEHASH = keccak256(
        "TokenPolicy(address token,uint256 limit)"
    );

    /// @notice Destination chain configuration
    struct Destination {
        uint32 chainEid;      // LayerZero endpoint ID
        address escrowAddr;   // Escrow contract address on destination
    }

    /// @notice Token spending policy
    struct TokenPolicy {
        address token;        // Token address (address(0) for native)
        uint256 limit;        // Spending limit
    }

    /// @notice Session installation intent (EIP-712)
    struct SessionIntent {
        address user;                    // User's EOA address
        address sessionPubKey;           // Session public key
        uint256 expiry;                  // Session expiration timestamp
        uint256 nonce;                   // Replay protection nonce
        Destination[] destinations;      // Target chains and escrows
        TokenPolicy[] tokenPolicies;     // Token spending policies
    }

    /// @notice User nonces for replay protection
    mapping(address => uint256) public userNonces;

    /// @notice Events
    event SessionInstallationInitiated(
        address indexed user,
        address indexed sessionPubKey,
        uint256 expiry,
        uint32[] chainEids
    );
    event SessionInstalledLocally(address indexed user, address indexed wallet);

    /// @notice Errors
    error InvalidSignature();
    error InvalidNonce();
    error SessionExpired();
    error EmptyDestinations();
    error InvalidDestination();

    /// @notice Initialize Coordinator
    /// @param _endpoint LayerZero endpoint address
    /// @param _owner Contract owner
    /// @param _walletFactory Wallet factory contract
    constructor(
        address _endpoint,
        address _owner,
        WalletFactory _walletFactory
    ) OApp(_endpoint, _owner) Ownable(_owner) {
        walletFactory = _walletFactory;
        
        // EIP-712 domain separator
        DOMAIN_SEPARATOR = keccak256(abi.encode(
            keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
            keccak256(bytes("SessionCoordinator")),
            keccak256(bytes("1")),
            block.chainid,
            address(this)
        ));
    }

    /// @notice Install sessions across multiple chains
    /// @param intent The session installation intent
    /// @param signature EIP-712 signature from user
    /// @param options LayerZero execution options for each destination
    function installSessions(
        SessionIntent calldata intent,
        bytes calldata signature,
        bytes[] calldata options
    ) external payable {
        // Verify destinations
        if (intent.destinations.length == 0) revert EmptyDestinations();
        require(intent.destinations.length == options.length, "Mismatched options length");

        // Verify signature
        _verifySessionIntent(intent, signature);

        // Verify session not expired
        if (intent.expiry <= block.timestamp) revert SessionExpired();

        // Verify and increment nonce
        if (intent.nonce != userNonces[intent.user]) revert InvalidNonce();
        userNonces[intent.user]++;

        // Install session locally on Sepolia (optional)
        _installLocalSession(intent);

        // Send cross-chain messages to install sessions
        _sendCrossChainInstallations(intent, options);

        // Emit event
        uint32[] memory chainEids = new uint32[](intent.destinations.length);
        for (uint256 i = 0; i < intent.destinations.length; i++) {
            chainEids[i] = intent.destinations[i].chainEid;
        }

        emit SessionInstallationInitiated(
            intent.user,
            intent.sessionPubKey,
            intent.expiry,
            chainEids
        );
    }

    /// @notice Quote the fee for session installation
    /// @param intent The session installation intent
    /// @param options LayerZero execution options for each destination
    /// @param payInLzToken Whether to pay in LZ token
    function quoteInstallSessions(
        SessionIntent calldata intent,
        bytes[] calldata options,
        bool payInLzToken
    ) external view returns (MessagingFee memory totalFee) {
        require(intent.destinations.length == options.length, "Mismatched options length");

        bytes memory message = _encodeSessionMessage(intent);

        for (uint256 i = 0; i < intent.destinations.length; i++) {
            Destination memory dest = intent.destinations[i];
            bytes memory combinedOptions = combineOptions(dest.chainEid, INSTALL_SESSION, options[i]);
            
            MessagingFee memory fee = _quote(dest.chainEid, message, combinedOptions, payInLzToken);
            totalFee.nativeFee += fee.nativeFee;
            totalFee.lzTokenFee += fee.lzTokenFee;
        }
    }

    /// @notice Verify EIP-712 signature
    /// @param intent The session intent
    /// @param signature The signature to verify
    function _verifySessionIntent(
        SessionIntent calldata intent,
        bytes calldata signature
    ) internal view {
        bytes32 structHash = _hashSessionIntent(intent);
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, structHash));
        
        address recoveredSigner = digest.recover(signature);
        if (recoveredSigner != intent.user) revert InvalidSignature();
    }

    /// @notice Hash SessionIntent struct
    /// @param intent The session intent
    function _hashSessionIntent(SessionIntent calldata intent) internal pure returns (bytes32) {
        bytes32[] memory destinationHashes = new bytes32[](intent.destinations.length);
        for (uint256 i = 0; i < intent.destinations.length; i++) {
            destinationHashes[i] = keccak256(abi.encode(
                DESTINATION_TYPEHASH,
                intent.destinations[i].chainEid,
                intent.destinations[i].escrowAddr
            ));
        }

        bytes32[] memory tokenPolicyHashes = new bytes32[](intent.tokenPolicies.length);
        for (uint256 i = 0; i < intent.tokenPolicies.length; i++) {
            tokenPolicyHashes[i] = keccak256(abi.encode(
                TOKEN_POLICY_TYPEHASH,
                intent.tokenPolicies[i].token,
                intent.tokenPolicies[i].limit
            ));
        }

        return keccak256(abi.encode(
            SESSION_INTENT_TYPEHASH,
            intent.user,
            intent.sessionPubKey,
            intent.expiry,
            intent.nonce,
            keccak256(abi.encodePacked(destinationHashes)),
            keccak256(abi.encodePacked(tokenPolicyHashes))
        ));
    }

    /// @notice Install session locally on Sepolia
    /// @param intent The session intent
    function _installLocalSession(SessionIntent calldata intent) internal {
        // Generate deterministic wallet
        bytes32 salt = walletFactory.generateSalt(intent.user, block.chainid);
        address wallet = walletFactory.deployIfNeeded(intent.user, salt);

        // Find Sepolia escrow in destinations
        address sepoliaEscrow = address(0);
        for (uint256 i = 0; i < intent.destinations.length; i++) {
            if (intent.destinations[i].chainEid == 40161) { // SEPOLIA_V2_TESTNET
                sepoliaEscrow = intent.destinations[i].escrowAddr;
                break;
            }
        }

        if (sepoliaEscrow != address(0)) {
            // Convert policies to session module format
            SessionModule.TokenLimit[] memory tokenLimits = new SessionModule.TokenLimit[](intent.tokenPolicies.length);
            for (uint256 i = 0; i < intent.tokenPolicies.length; i++) {
                tokenLimits[i] = SessionModule.TokenLimit({
                    token: intent.tokenPolicies[i].token,
                    limit: intent.tokenPolicies[i].limit
                });
            }

            SessionModule.EscrowPermission[] memory escrowPermissions = new SessionModule.EscrowPermission[](1);
            escrowPermissions[0] = SessionModule.EscrowPermission({
                escrow: sepoliaEscrow,
                allowed: true
            });

            // Install session via wallet
            SessionModule sessionModule = walletFactory.sessionModule();
            sessionModule.installSession(
                wallet,
                intent.sessionPubKey,
                intent.expiry,
                tokenLimits,
                escrowPermissions
            );

            emit SessionInstalledLocally(intent.user, wallet);
        }
    }

    /// @notice Send cross-chain session installations
    /// @param intent The session intent
    /// @param options Execution options for each destination
    function _sendCrossChainInstallations(
        SessionIntent calldata intent,
        bytes[] calldata options
    ) internal {
        bytes memory message = _encodeSessionMessage(intent);
        uint256 remainingValue = msg.value;

        for (uint256 i = 0; i < intent.destinations.length; i++) {
            Destination memory dest = intent.destinations[i];
            
            // Skip if destination is current chain (already handled locally)
            if (dest.chainEid == 40161) continue; // Skip SEPOLIA_V2_TESTNET

            bytes memory combinedOptions = combineOptions(dest.chainEid, INSTALL_SESSION, options[i]);
            MessagingFee memory fee = _quote(dest.chainEid, message, combinedOptions, false);
            
            require(remainingValue >= fee.nativeFee, "Insufficient fee");
            remainingValue -= fee.nativeFee;

            _lzSend(
                dest.chainEid,
                message,
                combinedOptions,
                fee,
                payable(msg.sender)
            );
        }
    }

    /// @notice Encode session message for cross-chain transmission
    /// @param intent The session intent
    function _encodeSessionMessage(SessionIntent calldata intent) internal pure returns (bytes memory) {
        return abi.encode(
            intent.user,
            intent.sessionPubKey,
            intent.expiry,
            intent.destinations,
            intent.tokenPolicies
        );
    }

    /// @notice Handle incoming cross-chain messages (not used in this architecture)
    /// @param _origin Message origin
    /// @param _message The message payload
    function _lzReceive(
        Origin calldata _origin,
        bytes32 /*_guid*/,
        bytes calldata _message,
        address /*_executor*/,
        bytes calldata /*_extraData*/
    ) internal override {
        // This coordinator only sends messages, doesn't receive them
        // Could be used for confirmations or callbacks in future versions
    }

    /// @notice Get user's current nonce
    /// @param user The user address
    function getUserNonce(address user) external view returns (uint256) {
        return userNonces[user];
    }
}
