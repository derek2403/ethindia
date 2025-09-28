require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  networks: {
    hedera_testnet: {
      url: process.env.HEDERA_RPC_URL || "https://testnet.hashio.io/api",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 296,
      gas: 2100000,
      gasPrice: 450000000000, // 450 gwei to meet minimum requirement
    },
    flow_evm_testnet: {
      url: process.env.FLOW_EVM_RPC_URL || "https://flow-testnet.g.alchemy.com/v2/FgSucpeM2ptJ9lxAtCUQ5AqtJl4W8kzN",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 545,
      gas: 2100000,
      gasPrice: 1000000000, // 1 gwei
    },
    ethereum_sepolia: {
      url: process.env.SEPOLIA_RPC_URL || `https://eth-sepolia.g.alchemy.com/v2/FgSucpeM2ptJ9lxAtCUQ5AqtJl4W8kzN`,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 11155111,
      gas: 2100000,
      gasPrice: 20000000000, // 20 gwei
    },
    arbitrum_sepolia: {
      url: process.env.ARBITRUM_SEPOLIA_RPC_URL || "https://arb-sepolia.g.alchemy.com/v2/FgSucpeM2ptJ9lxAtCUQ5AqtJl4W8kzN",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 421614,
      gas: 2100000,
      gasPrice: 1000000000, // 1 gwei
    },
  },
};
