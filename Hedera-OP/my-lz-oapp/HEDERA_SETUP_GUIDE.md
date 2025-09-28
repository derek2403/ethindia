# Hedera-Ethereum OFT Setup Guide

This project has been configured to work with **Hedera Testnet** and **Ethereum Sepolia Testnet** using LayerZero's Omnichain Fungible Token (OFT) standard.

## 🚀 Quick Start

### 1. Environment Setup

Your `.env` file is already configured. Make sure to update it with your private key:

```bash
# Update .env file with your private key
PRIVATE_KEY=your_actual_private_key_here
```

### 2. Get Testnet Tokens

**Hedera Testnet:**
- Get HBAR from: https://portal.hedera.com/faucet
- Network: Hedera Testnet
- RPC: https://testnet.hashio.io/api

**Ethereum Sepolia:**
- Get ETH from: https://faucets.chain.link/sepolia
- Alternative faucet: https://www.alchemy.com/faucets/ethereum-sepolia
- Network: Ethereum Sepolia
- RPC: https://ethereum-sepolia-rpc.publicnode.com

### 3. Deploy Your OFT

Deploy to Hedera Testnet:
```bash
npx hardhat lz:deploy --network hedera-testnet
```

Deploy to Ethereum Sepolia:
```bash
npx hardhat lz:deploy --network sepolia
```

### 4. Connect the Chains

Wire the contracts together:
```bash
npx hardhat lz:oapp:wire --oapp-config layerzero.config.ts
```

Verify the connection:
```bash
npx hardhat lz:oapp:peers:get --oapp-config layerzero.config.ts
```

### 5. Mint Some Test Tokens

After deployment, you can mint tokens for testing:

```bash
# Mint 1000 tokens on Hedera
npx hardhat --network hedera-testnet run -e "
const contract = await ethers.getContractAt('MyOFT', 'YOUR_DEPLOYED_ADDRESS');
await contract.mint('YOUR_WALLET_ADDRESS', ethers.utils.parseEther('1000'));
"
```

### 6. Transfer Tokens Cross-Chain

Send tokens from Hedera to Ethereum Sepolia:
```bash
npx hardhat lz:oft:send \
  --src-eid 40285 \
  --dst-eid 40161 \
  --amount 100 \
  --to YOUR_WALLET_ADDRESS \
  --network hedera-testnet
```

Send tokens from Ethereum Sepolia to Hedera:
```bash
npx hardhat lz:oft:send \
  --src-eid 40161 \
  --dst-eid 40285 \
  --amount 50 \
  --to YOUR_WALLET_ADDRESS \
  --network sepolia
```

## 📋 Network Details

| Network | Endpoint ID | RPC URL |
|---------|-------------|---------|
| Hedera Testnet | 40285 | https://testnet.hashio.io/api |
| Ethereum Sepolia | 40161 | https://ethereum-sepolia-rpc.publicnode.com |

## 🔧 Configuration Files

- **`hardhat.config.ts`**: Network configurations for Hedera and Ethereum Sepolia
- **`layerzero.config.ts`**: Cross-chain pathway configurations 
- **`contracts/MyOFT.sol`**: The OFT token contract with mint function
- **`deploy/MyOFT.ts`**: Deployment script

## 🔍 Monitoring

- Track transactions on [LayerZero Scan](https://layerzeroscan.com/)
- View Hedera transactions on [Hedera Explorer](https://hashscan.io/testnet)
- View Ethereum Sepolia transactions on [Sepolia Etherscan](https://sepolia.etherscan.io/)

## ⚠️ Important Notes

1. **Hedera EVM Decimals**: Hedera EVM uses 8 decimals while JSON RPC uses 18 decimals for `msg.value`
2. **Gas Settings**: The enforced options are set to 80,000 gas for lzReceive
3. **DVN Configuration**: Uses LayerZero Labs as the required DVN
4. **Block Confirmations**: Set to 1 confirmation for both directions (testnet setting)

## 🐛 Troubleshooting

If `quoteSend` reverts:
1. Check wiring configuration: `npx hardhat lz:oapp:config:get --oapp-config layerzero.config.ts`
2. Verify LayerZero Scan for any LzDeadDVN entries
3. Ensure both contracts are deployed and wired correctly

## 🚀 Next Steps

- Deploy to mainnet networks when ready
- Adjust DVN providers for production
- Customize gas limits based on actual usage
- Add more chains to the pathway configuration
