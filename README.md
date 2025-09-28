# Dhal Way

Accept payments in **any token on any chain** while merchants receive funds on **their preferred token and chain**—from **one user signature (EIP-712)**. A relayer fans out the transaction to the required chains, escrows funds per chain, then settles to the merchant’s target asset/network. 



---

## Features

- **Interactive “Pay Mix” slider:** Buyer can split a single checkout across multiple assets/chains (e.g., ETH, USDC, PYUSD on Sepolia/Arbitrum, FLOW EVM, Hedera).  
- **Live pricing with Pyth:** Real-time quotes show USD value contributed by each asset as the slider moves.  
- **One-signature checkout (EIP-712):** User signs once; the relayer fans out to all required chains.  
- **Smart routing:** Same-chain settlement first, only then external swap/bridge (e.g., LayerZero OFT).  
- **Cross-chain via LayerZero:** Demonstrated route (e.g., USDC Sepolia → USDC Hedera).  
- **PYUSD rails:** PYUSD on **Sepolia** & **Arbitrum** (pay on either, merchant can receive on either).

---

### Example: $100 checkout (with sliders)

**Scenario:** The product costs **$100**. The buyer wants to pay using a mix of assets across chains.

1. Buyer adjusts sliders to choose how much to contribute from each **asset and chain** (values update in real time using **Pyth** USD prices).  
   - The buyer can mix different networks and tokens (e.g., ETH on Ethereum Sepolia, PYUSD on Arbitrum Sepolia, USDC on Hedera Testnet, etc.).

2. The UI shows the running **Total = $100** and a per-asset breakdown.
**Example mix for a $100 checkout:**
- **$45** in **USDC** on **Ethereum Sepolia**
- **$35** in **PYUSD** on **Arbitrum Sepolia**
- **$15** in **ETH** on **Ethereum Sepolia**
- **$5** in **USDC** on **Hedera Testnet**
  
3. Buyer clicks **Pay** → signs **one EIP-712** typed data message (the intent).
4. The relayer verifies the intent and **fans out** transactions to the relevant chains.
5. Funds **escrow per chain**, then settlement routes so the merchant receives their **chosen token/chain**.
6. If a cross-chain move is needed (and internal paths aren’t available), the router uses **LayerZero OFT**.

---

## 🧩 Tech Stack

- **Frontend:** Next.js, shadcn/ui, Aceternity UI components, lucide-react, RainbowKit
- **Contracts/Tooling:** Solidity, **Hardhat**, **ethers.js**
- **Oracles:** **Pyth**
- **Interoperability:** **LayerZero (OFT)**
- **Networks:** Ethereum Sepolia, Arbitrum Sepolia, Flow EVM Testnet, Hedera Testnet
- **Languages:** JavaScript/TypeScript, Solidity, HTML/CSS

---

## 🏗 Architecture (high level)

1. **Client (Next.js):** Renders a summary and requests a **single EIP-712 signature**.
2. **Relayer (API routes):** Verifies the signed intent and **fans out** to the relevant chains.
3. **Escrow (Solidity):** Each leg deposits into a **chain-local escrow** contract.
4. **Settlement:** Merchant receives their chosen token/chain. Routing order:
   1) **Internal order-book/RFQ** (match against maker quotes/inventory)
   2) **Internal AMM (Uniswap v4-style pool/hooks)**
   3) **External DEX/bridge** only if needed (e.g., **LayerZero OFT** for cross-chain moves)
5. **Pricing:** **Pyth** feeds used to quote totals and perform basic price checks.

---

## 🚀 Getting Started

### Prerequisites
- Node.js ≥ 18
- npm or yarn
- Testnet wallets funded with test ETH/HBAR/etc.
- RPC endpoints for all target testnets

### 1) Clone & Install
```bash
git clone https://github.com/derek2403/ethindia
cd ethindia
npm install```
cd ethindia
npm install 
