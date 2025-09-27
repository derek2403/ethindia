import { ContractTransaction } from 'ethers'
import { task, types } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

import { createLogger } from '@layerzerolabs/io-devtools'
import { endpointIdToNetwork } from '@layerzerolabs/lz-definitions'

const logger = createLogger()

enum KnownErrors {
    ERROR_GETTING_DEPLOYMENT = 'ERROR_GETTING_DEPLOYMENT',
    ERROR_QUOTING_GAS_COST = 'ERROR_QUOTING_GAS_COST',
    ERROR_SENDING_TRANSACTION = 'ERROR_SENDING_TRANSACTION',
    ERROR_INVALID_SIGNATURE = 'ERROR_INVALID_SIGNATURE',
}

enum KnownOutputs {
    SESSION_INSTALLATION_INITIATED = 'SESSION_INSTALLATION_INITIATED',
    TX_HASH = 'TX_HASH',
    EXPLORER_LINK = 'EXPLORER_LINK',
}

class DebugLogger {
    static printErrorAndFixSuggestion(errorType: KnownErrors, context: string) {
        logger.error(`❌ ${errorType}: ${context}`)
    }

    static printLayerZeroOutput(outputType: KnownOutputs, message: string) {
        logger.info(`✅ ${outputType}: ${message}`)
    }
}

function getLayerZeroScanLink(txHash: string, isTestnet = false): string {
    const baseUrl = isTestnet ? 'https://testnet.layerzeroscan.com' : 'https://layerzeroscan.com'
    return `${baseUrl}/tx/${txHash}`
}

async function getBlockExplorerLink(networkName: string, txHash: string): Promise<string | undefined> {
    const explorers: Record<string, string> = {
        'sepolia': 'https://sepolia.etherscan.io',
        'hedera-testnet': 'https://hashscan.io/testnet',
        'flow-testnet': 'https://evm-testnet.flowscan.org',
    }

    const explorer = explorers[networkName]
    return explorer ? `${explorer}/tx/${txHash}` : undefined
}

task('lz:session:install', 'Install session keys across multiple chains')
    .addParam('sessionPubKey', 'Session public key address', undefined, types.string)
    .addParam('expiry', 'Session expiration timestamp', undefined, types.int)
    .addParam('hederaEscrow', 'Hedera escrow contract address', undefined, types.string)
    .addParam('flowEscrow', 'Flow escrow contract address', undefined, types.string)
    .addOptionalParam('sepoliaEscrow', 'Sepolia escrow contract address (optional)', undefined, types.string)
    .addOptionalParam('pyusdLimit', 'PYUSD spending limit (in wei)', '1000000', types.string) // 1 PYUSD default
    .addOptionalParam('linkLimit', 'LINK spending limit (in wei)', '1000000000000000000', types.string) // 1 LINK default
    .addOptionalParam('hbarLimit', 'HBAR spending limit (in wei)', '10000000000000000000', types.string) // 10 HBAR default
    .addOptionalParam('usdcLimit', 'USDC spending limit (in wei)', '1000000', types.string) // 1 USDC default
    .addOptionalParam('flowLimit', 'FLOW spending limit (in wei)', '10000000000000000000', types.string) // 10 FLOW default
    .setAction(async (args: any, hre: HardhatRuntimeEnvironment) => {
        // Only run on Sepolia
        if (hre.network.name !== 'sepolia') {
            logger.error('This task should only be run on Sepolia network')
            return
        }

        logger.info('Initiating cross-chain session installation from Sepolia')
        logger.info(`Session public key: ${args.sessionPubKey}`)
        logger.info(`Session expiry: ${new Date(args.expiry * 1000).toISOString()}`)

        // Get the signer
        const [signer] = await hre.ethers.getSigners()
        logger.info(`Using signer: ${signer.address}`)

        // Get the deployed Coordinator contract
        let coordinatorContract
        let contractAddress: string
        try {
            const coordinatorDeployment = await hre.deployments.get('Coordinator')
            contractAddress = coordinatorDeployment.address
            coordinatorContract = await hre.ethers.getContractAt('Coordinator', contractAddress, signer)
            logger.info(`Coordinator contract found at: ${contractAddress}`)
        } catch (error) {
            DebugLogger.printErrorAndFixSuggestion(
                KnownErrors.ERROR_GETTING_DEPLOYMENT,
                `Failed to get Coordinator deployment on network: ${hre.network.name}`
            )
            throw error
        }

        // Prepare session intent
        const userNonce = await coordinatorContract.getUserNonce(signer.address)
        logger.info(`User nonce: ${userNonce}`)

    // LayerZero V2 endpoint IDs
    const destinations = [
        {
            chainEid: 40285, // HEDERA_V2_TESTNET
            escrowAddr: args.hederaEscrow
        },
        {
            chainEid: 40351, // FLOW_V2_TESTNET
            escrowAddr: args.flowEscrow
        }
    ]

    // Add Sepolia if escrow provided
    if (args.sepoliaEscrow) {
        destinations.push({
            chainEid: 40161, // SEPOLIA_V2_TESTNET
            escrowAddr: args.sepoliaEscrow
        })
    }

        // TODO: Replace with actual token addresses
        const tokenPolicies = [
            {
                token: '0x0000000000000000000000000000000000000000', // Native token placeholder
                limit: hre.ethers.utils.parseEther(args.hbarLimit)
            },
            {
                token: '0x0000000000000000000000000000000000000001', // PYUSD placeholder
                limit: hre.ethers.utils.parseUnits(args.pyusdLimit, 6)
            },
            {
                token: '0x0000000000000000000000000000000000000002', // LINK placeholder
                limit: hre.ethers.utils.parseEther(args.linkLimit)
            },
            {
                token: '0x0000000000000000000000000000000000000003', // USDC placeholder
                limit: hre.ethers.utils.parseUnits(args.usdcLimit, 6)
            },
            {
                token: '0x0000000000000000000000000000000000000004', // FLOW placeholder
                limit: hre.ethers.utils.parseEther(args.flowLimit)
            }
        ]

        const sessionIntent = {
            user: signer.address,
            sessionPubKey: args.sessionPubKey,
            expiry: args.expiry,
            nonce: userNonce,
            destinations: destinations,
            tokenPolicies: tokenPolicies
        }

        logger.info('Session intent prepared')
        logger.info(`Destinations: ${destinations.length} chains`)
        logger.info(`Token policies: ${tokenPolicies.length} tokens`)

        // Prepare options for each destination (basic options for now)
        const options = destinations.map(() => '0x') // Empty options, will use enforced options

        // 1️⃣ Quote the gas cost
        logger.info('Quoting gas cost for session installation...')
        let messagingFee
        try {
            messagingFee = await coordinatorContract.quoteInstallSessions(
                sessionIntent,
                options,
                false // payInLzToken = false
            )
            logger.info(`  Native fee: ${hre.ethers.utils.formatEther(messagingFee.nativeFee)} ETH`)
            logger.info(`  LZ token fee: ${messagingFee.lzTokenFee.toString()} LZ`)
        } catch (error) {
            DebugLogger.printErrorAndFixSuggestion(
                KnownErrors.ERROR_QUOTING_GAS_COST,
                `Failed to quote installation cost`
            )
            throw error
        }

        // 2️⃣ Create EIP-712 signature
        logger.info('Creating EIP-712 signature...')
        
        // TODO: Implement proper EIP-712 signing
        // For now, use a placeholder signature
        const signature = '0x' + '0'.repeat(130) // Placeholder signature
        logger.warn('Using placeholder signature - implement proper EIP-712 signing')

        // 3️⃣ Send the installation transaction
        logger.info('Sending session installation transaction...')
        let tx: ContractTransaction
        try {
            tx = await coordinatorContract.installSessions(
                sessionIntent,
                signature,
                options,
                {
                    value: messagingFee.nativeFee
                }
            )
            logger.info(`  Transaction hash: ${tx.hash}`)
        } catch (error) {
            DebugLogger.printErrorAndFixSuggestion(
                KnownErrors.ERROR_SENDING_TRANSACTION,
                `Failed to send installation transaction`
            )
            throw error
        }

        // 4️⃣ Wait for confirmation
        logger.info('Waiting for transaction confirmation...')
        const receipt = await tx.wait()
        logger.info(`  Gas used: ${receipt.gasUsed.toString()}`)
        logger.info(`  Block number: ${receipt.blockNumber}`)

        // 5️⃣ Success messaging and links
        const chainNames = destinations.map(d => endpointIdToNetwork(d.chainEid)).join(', ')
        DebugLogger.printLayerZeroOutput(
            KnownOutputs.SESSION_INSTALLATION_INITIATED,
            `Successfully initiated session installation across chains: ${chainNames}`
        )

        // Get and display block explorer link
        const explorerLink = await getBlockExplorerLink(hre.network.name, receipt.transactionHash)
        if (explorerLink) {
            DebugLogger.printLayerZeroOutput(
                KnownOutputs.TX_HASH,
                `Block explorer link: ${explorerLink}`
            )
        }

        // Get and display LayerZero scan link
        const scanLink = getLayerZeroScanLink(receipt.transactionHash, true) // testnet = true
        DebugLogger.printLayerZeroOutput(
            KnownOutputs.EXPLORER_LINK,
            `LayerZero Scan link for tracking delivery: ${scanLink}`
        )

        return {
            txHash: receipt.transactionHash,
            blockNumber: receipt.blockNumber,
            gasUsed: receipt.gasUsed.toString(),
            scanLink: scanLink,
            explorerLink: explorerLink,
            sessionPubKey: args.sessionPubKey,
            expiry: args.expiry,
            destinations: destinations.length
        }
    })
