# Cross-Chain Session Key Management System - Runbook

## Overview

This system enables users to sign **one MetaMask transaction on Sepolia** that installs session keys across multiple EVM testnets via LayerZero OApp generic messaging. After installation, a backend worker holding the session private key can submit local deposits on each destination chain.

### Architecture

- **Sepolia**: Coordinator contract (source) + optional local session + Escrow
- **Hedera EVM testnet**: Installer contract + session installation + Escrow  
- **Flow EVM testnet**: Installer contract + session installation + Escrow

### Token Support

- **Sepolia**: PYUSD (ERC-20), LINK (ERC-20)
- **Hedera**: HBAR (native), USDC (ERC-20)
- **Flow**: FLOW (native)

## Prerequisites

1. **RPC Endpoints** for all three testnets
2. **Test ETH** on Sepolia for deployment and transactions
3. **Test tokens** on each chain for testing deposits
4. **Private keys** for deployment and session operations

## Configuration

### 1. Environment Setup

Create `.env` file in the LayerZero project root:

```bash
# Deployment keys
PRIVATE_KEY="0x..." # Deployer private key
MNEMONIC="..." # Alternative to private key

# RPC URLs
RPC_URL_SEPOLIA="https://ethereum-sepolia.gateway.tenderly.co"
RPC_URL_HEDERA_TESTNET="https://testnet.hashio.io/api"
RPC_URL_FLOW_TESTNET="https://testnet.evm.nodes.onflow.org"

# TODO: Update with actual LayerZero Endpoint V2 addresses
SEPOLIA_ENDPOINT="0x..."
HEDERA_ENDPOINT="0x..."
FLOW_ENDPOINT="0x..."

# Session key for backend worker
SESSION_PRIVATE_KEY="0x..." # Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Network Configuration

Update `hardhat.config.ts` with correct endpoint IDs:

```typescript
// TODO: Replace with actual LayerZero V2 endpoint IDs
sepolia: {
    eid: EndpointId.SEPOLIA_V2_TESTNET, // Confirmed: 40161
    // ...
},
'hedera-testnet': {
    eid: 40230, // TODO: Verify correct EID
    // ...
},
'flow-testnet': {
    eid: 40231, // TODO: Verify correct EID  
    // ...
},
```

### 3. Contract Address Configuration

After deployment, update addresses in:
- `pages/session.js` (frontend)
- `.env` file
- Task scripts

## Deployment Sequence

### Step 1: Deploy Core Contracts

Deploy on all three chains:

```bash
cd /Users/derekliew/Developer/ethindia/zero/my-lz-oapp

# Deploy on Sepolia
npx hardhat lz:deploy --network sepolia --tags SessionModule,WalletFactory,Escrow,Coordinator

# Deploy on Hedera 
npx hardhat lz:deploy --network hedera-testnet --tags SessionModule,WalletFactory,Escrow,Installer

# Deploy on Flow
npx hardhat lz:deploy --network flow-testnet --tags SessionModule,WalletFactory,Escrow,Installer
```

**Expected Output:**
```
Deployed contract: SessionModule, network: sepolia, address: 0x...
Deployed contract: WalletFactory, network: sepolia, address: 0x...
Deployed contract: Escrow, network: sepolia, address: 0x...
Deployed contract: Coordinator, network: sepolia, address: 0x...
```

### Step 2: Wire LayerZero Connections

Configure the LayerZero messaging pathways:

```bash
# Wire all connections based on layerzero.config.ts
npx hardhat lz:oapp:wire --oapp-config layerzero.config.ts
```

This automatically:
- Sets send/receive libraries
- Configures DVNs and Executors  
- Sets up peers between Coordinator ↔ Installers
- Applies enforced options (250k gas for session installation)

### Step 3: Verify Wiring

Check peer connections:

```bash
# Check Coordinator peers
npx hardhat lz:oapp:peers --network sepolia

# Check Installer peers
npx hardhat lz:oapp:peers --network hedera-testnet
npx hardhat lz:oapp:peers --network flow-testnet
```

## Usage Flow

### Step 1: Frontend Session Installation

Navigate to the session management page:

```bash
cd /Users/derekliew/Developer/ethindia
npm run dev
# Visit http://localhost:3000/session
```

**User Actions:**
1. Connect MetaMask to Sepolia testnet
2. Review session configuration (24-hour expiry, token limits)
3. Click "Quote Installation Fees" to get LayerZero fees
4. Click "Authorize & Install Sessions" to sign and send transaction

**Behind the Scenes:**
- Generates session key pair (stores private key in localStorage)
- Creates EIP-712 SessionIntent signature
- Calls `Coordinator.installSessions()` with cross-chain fee payment
- LayerZero delivers messages to Hedera/Flow Installers
- Session keys installed on all chains with policy restrictions

### Step 2: Backend Worker Execution

After session installation, the backend worker can execute deposits:

```bash
# Execute on Sepolia (PYUSD deposit)
npx hardhat lz:session:execute \
  --network sepolia \
  --user-address 0x... \
  --escrow-address 0x... \
  --token-address 0x... \
  --amount 1000000 \
  --session-private-key $SESSION_PRIVATE_KEY

# Execute on Hedera (HBAR deposit)  
npx hardhat lz:session:execute \
  --network hedera-testnet \
  --user-address 0x... \
  --escrow-address 0x... \
  --token-address 0x0 \
  --amount 1000000000000000000 \
  --session-private-key $SESSION_PRIVATE_KEY

# Execute on Flow (FLOW deposit)
npx hardhat lz:session:execute \
  --network flow-testnet \
  --user-address 0x... \
  --escrow-address 0x... \
  --token-address 0x0 \
  --amount 1000000000000000000 \
  --session-private-key $SESSION_PRIVATE_KEY
```

## Testing

### Unit Tests

Run comprehensive contract tests:

```bash
cd /Users/derekliew/Developer/ethindia/zero/my-lz-oapp

# Run all tests
npx hardhat test

# Run specific test file
npx hardhat test test/hardhat/SessionManagement.test.ts
```

### Integration Test

Test the complete flow:

```bash
# 1. Deploy contracts (if not done)
npx hardhat lz:deploy --network sepolia
npx hardhat lz:deploy --network hedera-testnet  
npx hardhat lz:deploy --network flow-testnet

# 2. Wire connections
npx hardhat lz:oapp:wire --oapp-config layerzero.config.ts

# 3. Install sessions via frontend or CLI
npx hardhat lz:session:install \
  --network sepolia \
  --session-pub-key 0x... \
  --expiry 1700000000 \
  --hedera-escrow 0x... \
  --flow-escrow 0x...

# 4. Execute deposits via backend worker
npx hardhat lz:session:execute \
  --network sepolia \
  --user-address 0x... \
  --escrow-address 0x... \
  --token-address 0x0 \
  --amount 1000000000000000000
```

## Security Considerations

### Session Key Management

- **Generation**: Use cryptographically secure random generation
- **Storage**: Store session private keys in secure backend infrastructure
- **Rotation**: Implement automatic session key rotation before expiry
- **Revocation**: Users can revoke sessions via `MinimalWallet.revokeSession()`

### Policy Enforcement

- **Token Limits**: Per-token spending caps enforced by SessionModule
- **Escrow Allowlist**: Only designated escrow contracts can receive funds
- **Time Limits**: Sessions automatically expire after 24 hours
- **Chain Scoping**: Sessions are chain-specific with independent limits

### Access Control

- **Peer Verification**: Only trusted LayerZero peers can send messages
- **Signature Verification**: All session executions require valid ECDSA signatures
- **Owner Controls**: Only wallet owners can install/revoke sessions
- **Admin Functions**: Contract owners can emergency pause/upgrade

## Troubleshooting

### Common Issues

1. **"Insufficient fee" error**
   ```bash
   # Re-quote fees, LayerZero prices fluctuate
   npx hardhat lz:session:install --quote-only
   ```

2. **"Invalid signature" error**
   ```bash
   # Verify session private key matches installed public key
   # Check message hash construction in executeAsWallet()
   ```

3. **"SessionExpired" error**
   ```bash
   # Install new session or extend expiry
   # Sessions last 24 hours by default
   ```

4. **"EscrowNotAllowed" error**
   ```bash
   # Verify escrow address is in session allowlist
   # Check policy configuration during installation
   ```

### Debug Commands

```bash
# Check LayerZero message delivery
npx hardhat lz:oapp:send --network sepolia --dst-eid 40230 --string "test"

# Verify contract deployments
npx hardhat verify --network sepolia 0x... "constructor" "args"

# Check session status
npx hardhat console --network sepolia
> const session = await ethers.getContractAt('SessionModule', '0x...')
> await session.getSession('0x...') // user wallet address
```

## Monitoring

### LayerZero Message Tracking

- **LayerZero Scan**: https://testnet.layerzeroscan.com/tx/{txHash}
- **Block Explorers**: 
  - Sepolia: https://sepolia.etherscan.io
  - Hedera: https://hashscan.io/testnet  
  - Flow: https://evm-testnet.flowscan.org

### Key Metrics

- Session installation success rate
- Cross-chain message delivery time
- Session utilization vs. limits
- Gas costs per operation
- Failed transaction reasons

## Production Deployment

### Mainnet Configuration

1. **Update Network Configs**
   - Replace testnet RPC URLs with mainnet
   - Update LayerZero endpoint addresses
   - Verify correct endpoint IDs

2. **Token Address Updates**
   - Replace testnet token addresses with mainnet
   - Verify token decimals and contracts
   - Update spending limits appropriately

3. **Security Hardening**
   - Multi-sig wallet for contract ownership
   - Time delays for critical parameter changes
   - Comprehensive monitoring and alerting
   - Regular security audits

4. **Infrastructure**
   - Secure session key storage (HSM/KMS)
   - Redundant backend worker deployment
   - Load balancing for high availability
   - Backup and disaster recovery

## Cost Analysis

### LayerZero Fees

Typical cross-chain message costs:
- **Sepolia → Hedera**: ~0.001-0.005 ETH
- **Sepolia → Flow**: ~0.001-0.005 ETH
- **Total per installation**: ~0.002-0.01 ETH

### Gas Optimization

- Use enforced options to set optimal gas limits
- Batch multiple operations where possible
- Consider gas token payments on high-fee chains
- Monitor and adjust based on network conditions

## Support

### Documentation
- LayerZero V2 Docs: https://docs.layerzero.network/v2
- OApp Examples: https://github.com/LayerZero-Labs/devtools

### Community
- LayerZero Discord: https://discord.gg/layerzero
- GitHub Issues: Submit bugs and feature requests

---

**Last Updated**: September 27, 2025  
**Version**: 1.0.0  
**Compatibility**: LayerZero V2, Solidity ^0.8.22
