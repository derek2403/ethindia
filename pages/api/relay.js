// pages/api/relay.js
import { ethers } from 'ethers'

// --- ENV ---
// You MUST set these in your .env.local (or server env):
// RELAYER_PRIVKEY="0xabc..."      ← relayer key (fund with test gas on all chains you use)
// RPC_SEPOLIA="https://..."
// RPC_FLOW="https://testnet.evm.nodes.onflow.org"
// RPC_HEDERA="https://testnet.hashio.io/api"
// (optional) RPC_ARBSEPOLIA="https://arb-sepolia.g.alchemy.com/v2/...."

const ESCROWS = {
  sepolia:  '0x610c598A1B4BF710a10934EA47E4992a9897fad1',
  flow:     '0x81aB919673b29B07AFC0191Cb9A4c2EE1b518fe3',
  hedera:   '0x0772b7b4Dce613e75fde92e2bBfe351aE06ffc6b',
  // arbsep:   '0xc26929EB0dA2f219f625d6A44570cb98301465b5',
}

const RPCS = {
  sepolia: process.env.RPC_SEPOLIA,
  flow:    process.env.RPC_FLOW,
  hedera:  process.env.RPC_HEDERA,
  // arbsep:  process.env.RPC_ARBSEPOLIA,
}

// Minimal Escrow ABI (only what we call)
const ESCROW_ABI = [
  'function depositFor(address from, address[] merchants, address[] tokens, uint256[] amounts) external payable',
]

// EIP-712 types (must match front-end)
const types = {
  Leg: [
    { name: 'chainKey', type: 'string' },
    { name: 'escrow',   type: 'address' },
    { name: 'merchant', type: 'address' },
    { name: 'token',    type: 'address' },
    { name: 'amount',   type: 'uint256' },
  ],
  PaymentIntent: [
    { name: 'from',     type: 'address' },
    { name: 'nonce',    type: 'uint256' },
    { name: 'deadline', type: 'uint256' },
    { name: 'legs',     type: 'Leg[]' },
  ],
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { domain, types: typedTypes, message, signature } = req.body
    if (!domain || !typedTypes || !message || !signature) {
      return res.status(400).json({ error: 'Bad payload' })
    }

    // 1) Verify signature
    const signerAddr = ethers.verifyTypedData(domain, types, message, signature)
    if (signerAddr.toLowerCase() !== message.from.toLowerCase()) {
      return res.status(400).json({ error: 'Bad signature' })
    }

    // 2) Check deadline
    if (message.deadline < Math.floor(Date.now() / 1000)) {
      return res.status(400).json({ error: 'Intent expired' })
    }

    // 3) Group legs per chain
    const byChain = {}
    for (const leg of message.legs) {
      const key = leg.chainKey
      if (!ESCROWS[key] || !RPCS[key]) {
        return res.status(400).json({ error: `Unsupported chainKey ${key}` })
      }
      if (leg.escrow.toLowerCase() !== ESCROWS[key].toLowerCase()) {
        return res.status(400).json({ error: `Escrow mismatch for ${key}` })
      }
      byChain[key] ||= { nativeTotal: '0', erc20: [], native: [] }

      const isNative = leg.token === ethers.ZeroAddress

      if (isNative) {
        byChain[key].native.push(leg)
        byChain[key].nativeTotal = (BigInt(byChain[key].nativeTotal) + BigInt(leg.amount)).toString()
      } else {
        byChain[key].erc20.push(leg)
      }
    }

    // 4) Prepare relayer wallets per chain
    const relayerKey = process.env.RELAYER_PRIVKEY
    if (!relayerKey) return res.status(500).json({ error: 'RELAYER_PRIVKEY not set' })

    const providers = Object.fromEntries(
      Object.entries(RPCS).map(([k, url]) => [k, new ethers.JsonRpcProvider(url)])
    )
    const wallets = Object.fromEntries(
      Object.entries(providers).map(([k, p]) => [k, new ethers.Wallet(relayerKey, p)])
    )

    // 5) Fire transactions (one per chain; batch legs inside)
    const txs = {}

    console.log('🚀 Processing chains:', Object.keys(byChain)) // Keep this one for visibility

    for (const [chainKey, bucket] of Object.entries(byChain)) {
      const wallet = wallets[chainKey]
      const escrow = new ethers.Contract(ESCROWS[chainKey], ESCROW_ABI, wallet)

      const merchants = []
      const tokens = []
      const amounts = []
      let nativeValue = bucket.nativeTotal

      // pack native legs
      for (const leg of bucket.native) {
        merchants.push(leg.merchant)
        tokens.push(ethers.ZeroAddress)
        amounts.push(leg.amount)
      }
      // pack erc20 legs
      for (const leg of bucket.erc20) {
        merchants.push(leg.merchant)
        tokens.push(leg.token)
        amounts.push(leg.amount)
      }

      if (merchants.length === 0) continue

      // IMPORTANT: For ERC-20 legs, user MUST have approved Escrow on THAT chain:
      // IERC20(token).approve(escrow, amount)
      // Native legs send msg.value from relayer.

      console.log(`⚡ Executing ${chainKey} transaction...`)
      const tx = await escrow.depositFor(
        message.from,
        merchants,
        tokens,
        amounts,
        { value: nativeValue }
      )
      
      const receipt = await tx.wait()
      const txHash = receipt.hash || receipt.transactionHash
      txs[chainKey] = txHash
      console.log(`✅ ${chainKey} confirmed: ${txHash}`)
    }

    console.log('🎉 All transactions completed:', txs)

    return res.status(200).json({ ok: true, txs })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: e.message })
  }
}