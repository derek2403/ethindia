// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.22;

import { MinimalWallet } from "./MinimalWallet.sol";
import { SessionModule } from "./SessionModule.sol";

/// @title WalletFactory - Factory for deterministic minimal wallet deployment
/// @notice Creates minimal wallets with predictable addresses using CREATE2
contract WalletFactory {
    /// @notice The session module used by all wallets
    SessionModule public immutable sessionModule;

    /// @notice Mapping to track deployed wallets
    mapping(address => bool) public isWallet;

    /// @notice Events
    event WalletDeployed(address indexed owner, address indexed wallet, bytes32 salt);

    /// @notice Errors
    error WalletAlreadyExists();

    /// @notice Initialize the factory
    /// @param _sessionModule The session module contract
    constructor(SessionModule _sessionModule) {
        sessionModule = _sessionModule;
    }

    /// @notice Deploy a wallet if it doesn't exist
    /// @param owner The wallet owner
    /// @param salt The salt for CREATE2 deployment
    /// @return wallet The wallet address
    function deployIfNeeded(address owner, bytes32 salt) external returns (address wallet) {
        wallet = getWalletAddress(owner, salt);
        
        // If wallet doesn't exist, deploy it
        if (!isContract(wallet)) {
            MinimalWallet deployedWallet = new MinimalWallet{salt: salt}(owner, sessionModule);
            wallet = address(deployedWallet);
            isWallet[wallet] = true;
            
            emit WalletDeployed(owner, wallet, salt);
        }
        
        return wallet;
    }

    /// @notice Get the deterministic wallet address
    /// @param owner The wallet owner
    /// @param salt The salt for CREATE2
    /// @return wallet The predicted wallet address
    function getWalletAddress(address owner, bytes32 salt) public view returns (address wallet) {
        bytes32 hash = keccak256(
            abi.encodePacked(
                bytes1(0xff),
                address(this),
                salt,
                keccak256(abi.encodePacked(
                    type(MinimalWallet).creationCode,
                    abi.encode(owner, sessionModule)
                ))
            )
        );
        
        return address(uint160(uint256(hash)));
    }

    /// @notice Generate a salt based on owner and chain
    /// @param owner The wallet owner
    /// @param chainId The chain ID
    /// @return salt The generated salt
    function generateSalt(address owner, uint256 chainId) external pure returns (bytes32 salt) {
        return keccak256(abi.encodePacked(owner, chainId));
    }

    /// @notice Check if address is a contract
    /// @param account The address to check
    /// @return True if account is a contract
    function isContract(address account) internal view returns (bool) {
        uint256 size;
        assembly {
            size := extcodesize(account)
        }
        return size > 0;
    }
}
