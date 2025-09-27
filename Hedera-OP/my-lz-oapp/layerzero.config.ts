import { EndpointId } from '@layerzerolabs/lz-definitions'
import { ExecutorOptionType } from '@layerzerolabs/lz-v2-utilities'
import { TwoWayConfig, generateConnectionsConfig } from '@layerzerolabs/metadata-tools'
import { OAppEnforcedOption } from '@layerzerolabs/toolbox-hardhat'

import type { OmniPointHardhat } from '@layerzerolabs/toolbox-hardhat'

const hederaTestnetContract: OmniPointHardhat = {
    eid: EndpointId.HEDERA_V2_TESTNET,
    contractName: 'MyOFT',
}

const sepoliaContract: OmniPointHardhat = {
    eid: EndpointId.SEPOLIA_V2_TESTNET,
    contractName: 'MyOFT',
}

// To connect all the above chains to each other, we need the following pathways:
// Ethereum Sepolia <-> Hedera Testnet
// Hedera Testnet   <-> Ethereum Sepolia

// For this example's simplicity, we will use the same enforced options values for sending to all chains
// For production, you should ensure `gas` is set to the correct value through profiling the gas usage of calling OFT._lzReceive(...) on the destination chain
// To learn more, read https://docs.layerzero.network/v2/concepts/applications/oapp-standard#execution-options-and-enforced-settings
const EVM_ENFORCED_OPTIONS: OAppEnforcedOption[] = [
    {
        msgType: 1,
        optionType: ExecutorOptionType.LZ_RECEIVE,
        gas: 80000,
        value: 0,
    },
]

// With the config generator, pathways declared are automatically bidirectional
// i.e. if you declare A,B there's no need to declare B,A
const pathways: TwoWayConfig[] = [
    [
        // 1) Chain B's contract (e.g. Ethereum Sepolia)
        sepoliaContract,
        // 2) Chain A's contract (e.g. Hedera Testnet)
        hederaTestnetContract,
        // 3) Channel security settings:
        //    • first array = "required" DVN names
        //    • second array = "optional" DVN names array + threshold
        //    • third value = threshold (i.e., number of optionalDVNs that must sign)
        //    [ requiredDVN[], [ optionalDVN[], threshold ] ]
        [['LayerZero Labs' /* ← add more DVN names here */], []],
        // 4) Block confirmations:
        //    [confirmations for Ethereum Sepolia → Hedera Testnet, confirmations for Hedera Testnet → Ethereum Sepolia]
        [1, 1],
        // 5) Enforced execution options:
        //    [options for Ethereum Sepolia → Hedera Testnet, options for Hedera Testnet → Ethereum Sepolia]
        [EVM_ENFORCED_OPTIONS, EVM_ENFORCED_OPTIONS],
    ],
]

export default async function () {
    // Generate the connections config based on the pathways
    const connections = await generateConnectionsConfig(pathways)
    return {
        contracts: [{ contract: sepoliaContract }, { contract: hederaTestnetContract }],
        connections,
    }
}
