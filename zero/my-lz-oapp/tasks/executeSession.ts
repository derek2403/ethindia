import { task, types } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { createLogger } from '@layerzerolabs/io-devtools'

const logger = createLogger()

enum KnownErrors {
    ERROR_GETTING_DEPLOYMENT = 'ERROR_GETTING_DEPLOYMENT',
    ERROR_EXECUTING_SESSION = 'ERROR_EXECUTING_SESSION',
    ERROR_INVALID_WALLET = 'ERROR_INVALID_WALLET',
}

enum KnownOutputs {
    SESSION_EXECUTED = 'SESSION_EXECUTED',
    DEPOSIT_COMPLETED = 'DEPOSIT_COMPLETED',
}

class DebugLogger {
    static printErrorAndFixSuggestion(errorType: KnownErrors, context: string) {
        logger.error(`❌ ${errorType}: ${context}`)
    }

    static printLayerZeroOutput(outputType: KnownOutputs, message: string) {
        logger.info(`✅ ${outputType}: ${message}`)
    }
}

task('lz:session:execute', 'Execute session-signed transactions (backend worker)')
    .addParam('userAddress', 'User EOA address', undefined, types.string)
    .addParam('escrowAddress', 'Escrow contract address', undefined, types.string)
    .addParam('tokenAddress', 'Token contract address (0x0 for native)', undefined, types.string)
    .addParam('amount', 'Amount to deposit (in wei)', undefined, types.string)
    .addOptionalParam('sessionPrivateKey', 'Session private key for signing', undefined, types.string)
    .setAction(async (args: any, hre: HardhatRuntimeEnvironment) => {
        logger.info(`Executing session transaction on ${hre.network.name}`)
        logger.info(`User: ${args.userAddress}`)
        logger.info(`Escrow: ${args.escrowAddress}`)
        logger.info(`Token: ${args.tokenAddress === '0x0' ? 'Native' : args.tokenAddress}`)
        logger.info(`Amount: ${hre.ethers.utils.formatEther(args.amount)} (assuming 18 decimals)`)

        // Get session signer (backend worker)
        let sessionSigner
        if (args.sessionPrivateKey) {
            sessionSigner = new hre.ethers.Wallet(args.sessionPrivateKey, hre.ethers.provider)
            logger.info(`Using session signer: ${sessionSigner.address}`)
        } else {
            // Use default signer if no session key provided (for testing)
            [sessionSigner] = await hre.ethers.getSigners()
            logger.warn(`Using default signer (testing mode): ${sessionSigner.address}`)
        }

        // Get WalletFactory to derive user's wallet address
        let walletFactory
        try {
            const walletFactoryDeployment = await hre.deployments.get('WalletFactory')
            walletFactory = await hre.ethers.getContractAt('WalletFactory', walletFactoryDeployment.address)
        } catch (error) {
            DebugLogger.printErrorAndFixSuggestion(
                KnownErrors.ERROR_GETTING_DEPLOYMENT,
                `Failed to get WalletFactory deployment on ${hre.network.name}`
            )
            throw error
        }

        // Calculate user's wallet address
        const salt = await walletFactory.generateSalt(args.userAddress, hre.network.config.chainId || 1)
        const walletAddress = await walletFactory.getWalletAddress(args.userAddress, salt)
        
        logger.info(`User's wallet address: ${walletAddress}`)

        // Get the MinimalWallet contract
        let walletContract
        try {
            walletContract = await hre.ethers.getContractAt('MinimalWallet', walletAddress, sessionSigner)
            
            // Check if wallet is deployed
            const code = await hre.ethers.provider.getCode(walletAddress)
            if (code === '0x') {
                logger.warn('Wallet not deployed yet - it will be created on first session use')
            }
        } catch (error) {
            DebugLogger.printErrorAndFixSuggestion(
                KnownErrors.ERROR_INVALID_WALLET,
                `Failed to get wallet contract at ${walletAddress}`
            )
            throw error
        }

        // Prepare the deposit call data
        let callData: string
        const isNative = args.tokenAddress === '0x0' || args.tokenAddress === '0x0000000000000000000000000000000000000000'
        
        if (isNative) {
            // For native token deposits, call depositNative()
            const escrowInterface = new hre.ethers.utils.Interface([
                'function depositNative() payable'
            ])
            callData = escrowInterface.encodeFunctionData('depositNative', [])
        } else {
            // For ERC20 deposits, call depositERC20(token, amount)
            const escrowInterface = new hre.ethers.utils.Interface([
                'function depositERC20(address token, uint256 amount)'
            ])
            callData = escrowInterface.encodeFunctionData('depositERC20', [args.tokenAddress, args.amount])
        }

        // Create session signature
        logger.info('Creating session signature...')
        
        // TODO: Implement proper session signature
        // For now, create a placeholder signature
        const messageHash = hre.ethers.utils.keccak256(
            hre.ethers.utils.defaultAbiCoder.encode(
                ['address', 'address', 'address', 'uint256', 'bytes', 'uint256'],
                [walletAddress, args.escrowAddress, args.tokenAddress, args.amount, callData, hre.network.config.chainId || 1]
            )
        )
        
        let signature: string
        if (args.sessionPrivateKey) {
            // Sign with session private key
            const sessionWallet = new hre.ethers.Wallet(args.sessionPrivateKey)
            signature = await sessionWallet.signMessage(hre.ethers.utils.arrayify(messageHash))
        } else {
            // Placeholder signature for testing
            signature = '0x' + '0'.repeat(130)
            logger.warn('Using placeholder signature - implement proper session signing')
        }

        // Execute the session transaction
        logger.info('Executing session transaction...')
        try {
            const tx = await walletContract.executeAsWallet(
                args.escrowAddress,
                args.tokenAddress,
                args.amount,
                callData,
                signature,
                {
                    value: isNative ? args.amount : 0,
                    gasLimit: 300000 // Generous gas limit
                }
            )

            logger.info(`Transaction sent: ${tx.hash}`)
            
            // Wait for confirmation
            const receipt = await tx.wait()
            logger.info(`Transaction confirmed in block ${receipt.blockNumber}`)
            logger.info(`Gas used: ${receipt.gasUsed.toString()}`)

            DebugLogger.printLayerZeroOutput(
                KnownOutputs.SESSION_EXECUTED,
                `Session transaction executed successfully`
            )

            DebugLogger.printLayerZeroOutput(
                KnownOutputs.DEPOSIT_COMPLETED,
                `Deposited ${hre.ethers.utils.formatEther(args.amount)} ${isNative ? 'native tokens' : 'tokens'} to escrow`
            )

            return {
                txHash: receipt.transactionHash,
                blockNumber: receipt.blockNumber,
                gasUsed: receipt.gasUsed.toString(),
                walletAddress: walletAddress,
                escrowAddress: args.escrowAddress,
                amount: args.amount,
                tokenAddress: args.tokenAddress
            }

        } catch (error) {
            DebugLogger.printErrorAndFixSuggestion(
                KnownErrors.ERROR_EXECUTING_SESSION,
                `Failed to execute session transaction: ${error.message}`
            )
            throw error
        }
    })
