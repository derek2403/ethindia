import { EndpointId } from '@layerzerolabs/lz-definitions'
import { ExecutorOptionType } from '@layerzerolabs/lz-v2-utilities'
import { TwoWayConfig, generateConnectionsConfig } from '@layerzerolabs/metadata-tools'
import { OAppEnforcedOption, OmniPointHardhat } from '@layerzerolabs/toolbox-hardhat'

const sepoliaCoordinator: OmniPointHardhat = {
    eid: EndpointId.SEPOLIA_V2_TESTNET,
    contractName: 'Coordinator',
}

const hederaInstaller: OmniPointHardhat = {
    eid: 40285, // HEDERA_V2_TESTNET
    contractName: 'Installer',
}

const flowInstaller: OmniPointHardhat = {
    eid: 40351, // FLOW_V2_TESTNET
    contractName: 'Installer',
}

// Session installation requires higher gas for wallet creation and module setup
const INSTALL_SESSION_OPTIONS: OAppEnforcedOption[] = [
    {
        msgType: 1, // INSTALL_SESSION message type
        optionType: ExecutorOptionType.LZ_RECEIVE,
        gas: 250000, // Higher gas for wallet creation and session setup
        value: 0,
    },
]

// Pathways for session installation:
// Sepolia Coordinator -> Hedera Installer (unidirectional)
// Sepolia Coordinator -> Flow Installer (unidirectional)
const pathways: TwoWayConfig[] = [
    [
        sepoliaCoordinator, // Sepolia Coordinator
        hederaInstaller, // Hedera Installer
        [['LayerZero Labs'], []], // [ requiredDVN[], [ optionalDVN[], threshold ] ]
        [1, 1], // [Sepolia to Hedera confirmations, Hedera to Sepolia confirmations]
        [INSTALL_SESSION_OPTIONS, INSTALL_SESSION_OPTIONS], // Hedera enforcedOptions, Sepolia enforcedOptions
    ],
    [
        sepoliaCoordinator, // Sepolia Coordinator  
        flowInstaller, // Flow Installer
        [['LayerZero Labs'], []], // [ requiredDVN[], [ optionalDVN[], threshold ] ]
        [1, 1], // [Sepolia to Flow confirmations, Flow to Sepolia confirmations]
        [INSTALL_SESSION_OPTIONS, INSTALL_SESSION_OPTIONS], // Flow enforcedOptions, Sepolia enforcedOptions
    ],
]

export default async function () {
    // Generate the connections config based on the pathways
    const connections = await generateConnectionsConfig(pathways)
    return {
        contracts: [
            { contract: sepoliaCoordinator },
            { contract: hederaInstaller },
            { contract: flowInstaller }
        ],
        connections,
    }
}
