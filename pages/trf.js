// pages/trf.js
import { useEffect, useMemo, useState } from 'react'
import { ethers } from 'ethers'
import { useAccount } from 'wagmi'
import { Header } from '../components/Header'

// --- CONFIG (fill RPCs & any missing token addresses in .env for the API side) ---
const CHAINS = {
  sepolia: {
    label: 'Ethereum Sepolia',
    key: 'sepolia',
    escrow: '0x610c598A1B4BF710a10934EA47E4992a9897fad1',
    explorer: 'https://sepolia.etherscan.io/tx/',
    native: { symbol: 'ETH', token: ethers.ZeroAddress, decimals: 18 },
    erc20s: [
      { symbol: 'PYUSD', token: '0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9', decimals: 6 },
      { symbol: 'LINK',  token: '0x779877A7B0D9E8603169DdbD7836e478b4624789', decimals: 18 },
    ],
  },
  flow: {
    label: 'Flow EVM Testnet',
    key: 'flow',
    escrow: '0x81aB919673b29B07AFC0191Cb9A4c2EE1b518fe3',
    explorer: 'https://evm-testnet.flowscan.io/tx/',
    native: { symbol: 'FLOW', token: ethers.ZeroAddress, decimals: 18 },
    erc20s: [
      // Add any ERC20s if you plan to pull them via allowance
    ],
  },
  hedera: {
    label: 'Hedera Testnet',
    key: 'hedera',
    escrow: '0x0772b7b4Dce613e75fde92e2bBfe351aE06ffc6b',
    explorer: 'https://hashscan.io/testnet/transaction/',
    native: { symbol: 'HBAR', token: ethers.ZeroAddress, decimals: 18 }, // NOTE: Hedera EVM has 8 on chain / 18 via RPC; amounts you input here should be wei (18)
    erc20s: [
      { symbol: 'USDC', token: '<<FILL_USDC_HEDERA_TESTNET_ADDRESS>>', decimals: 6 }, // ← fill this
    ],
  },
  // You also deployed to Arbitrum Sepolia; include if you want:
  // arbsep: {
  //   label: 'Arbitrum Sepolia',
  //   key: 'arbsep',
  //   escrow: '0xc26929EB0dA2f219f625d6A44570cb98301465b5',
  //   native: { symbol: 'ETH', token: ethers.constants.AddressZero, decimals: 18 },
  //   erc20s: [],
  // },
}

// Simple EIP-712 domain (off-chain verification only)
const EIP712_DOMAIN_NAME = 'EscrowIntent'
const EIP712_DOMAIN_VERSION = '1'

// Typed data
const types = {
  Leg: [
    { name: 'chainKey', type: 'string' },   // 'sepolia' | 'flow' | 'hedera' | ...
    { name: 'escrow',   type: 'address' },
    { name: 'merchant', type: 'address' },
    { name: 'token',    type: 'address' },  // address(0) for native
    { name: 'amount',   type: 'uint256' },  // in token decimals
  ],
  PaymentIntent: [
    { name: 'from',     type: 'address' },
    { name: 'nonce',    type: 'uint256' },
    { name: 'deadline', type: 'uint256' },  // unix seconds
    { name: 'legs',     type: 'Leg[]' },
  ],
}

export default function Trf() {
  const { address: account, isConnected, chainId } = useAccount()
  const [merchant, setMerchant] = useState('') // who receives escrow balance
  const [amounts, setAmounts] = useState({})   // { `${chainKey}:${symbol}`: stringNumber }
  const [status, setStatus] = useState('')
  const [txResults, setTxResults] = useState(null) // for storing transaction results with links

  // Helpers
  const setAmt = (chainKey, sym, val) => {
    setAmounts(prev => ({ ...prev, [`${chainKey}:${sym}`]: val }))
  }

  const buildLegs = () => {
    if (!merchant || !ethers.isAddress(merchant)) {
      throw new Error('Enter a valid merchant address')
    }
    const legs = []
    for (const [key, cfg] of Object.entries(CHAINS)) {
      // native
      const natKey = `${key}:${cfg.native.symbol}`
      const natVal = amounts[natKey]
      if (natVal && Number(natVal) > 0) {
        legs.push({
          chainKey: key,
          escrow: cfg.escrow,
          merchant,
          token: cfg.native.token,
          amount: ethers.parseUnits(natVal, cfg.native.decimals).toString(),
        })
      }
      // erc20s
      for (const t of (cfg.erc20s || [])) {
        const tk = `${key}:${t.symbol}`
        const tv = amounts[tk]
        if (tv && Number(tv) > 0) {
          legs.push({
            chainKey: key,
            escrow: cfg.escrow,
            merchant,
            token: t.token,
            amount: ethers.parseUnits(tv, t.decimals).toString(),
          })
        }
      }
    }
    if (legs.length === 0) throw new Error('No amounts entered')
    return legs
  }

  const signAndRelay = async () => {
    try {
      setStatus('Preparing intent...')
      setTxResults(null) // Clear previous results
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const from = await signer.getAddress()
      const net = await provider.getNetwork()

      const nonce = Date.now() // simple client nonce for replay protection
      const deadline = Math.floor(Date.now() / 1000) + 60 * 10 // 10 minutes

      const legs = buildLegs()

      const domain = {
        name: EIP712_DOMAIN_NAME,
        version: EIP712_DOMAIN_VERSION,
        chainId: Number(net.chainId),  // sign on whatever chain user is on
        verifyingContract: '0x0000000000000000000000000000000000000000', // off-chain verify
      }

      const message = { from, nonce, deadline, legs }
      setStatus('Requesting signature...')
      const signature = await signer.signTypedData(domain, types, message)

      setStatus('Relaying...')
      const res = await fetch('/api/relay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain, types, message, signature }),
      })
      const out = await res.json()
      if (!res.ok) throw new Error(out.error || 'Relay failed')

      // Prepare transaction results with explorer links  
      const txData = Object.entries(out.txs || {}).map(([chainKey, txHash]) => {
        const chain = CHAINS[chainKey]
        const explorerUrl = chain ? `${chain.explorer}${txHash}` : null
        console.log(`Creating tx result: ${chainKey} -> ${txHash} -> ${explorerUrl}`) // Debug
        return {
          chainKey,
          chainLabel: chain?.label || chainKey,
          txHash,
          explorerUrl
        }
      })
      
      console.log('Setting txResults:', txData) // Debug
      setTxResults(txData)
      setStatus('✅ Transactions completed successfully!')
    } catch (e) {
      console.error(e)
      setStatus(`Error: ${e.message}`)
      setTxResults(null)
    }
  }


  return (
    <div style={{ maxWidth: 720, margin: '24px auto', fontFamily: 'Inter, sans-serif' }}>
      <Header />
      <h2>One-click Escrow Deposit (EIP-712 + Relayer)</h2>

      {isConnected && account && (
        <p>Connected: {account.slice(0, 6)}…{account.slice(-4)} (chainId {chainId})</p>
      )}

      <div style={{ marginTop: 16 }}>
        <label>Merchant address:&nbsp;</label>
        <input
          style={{ width: '100%' }}
          placeholder="0xMerchant..."
          value={merchant}
          onChange={e => setMerchant(e.target.value)}
        />
      </div>

      <div style={{ marginTop: 24 }}>
        {Object.values(CHAINS).map((c) => (
          <div key={c.key} style={{ border: '1px solid #eee', borderRadius: 8, padding: 16, marginBottom: 16 }}>
            <h3 style={{ marginTop: 0 }}>{c.label}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 12, alignItems: 'center' }}>
              <div>{c.native.symbol} (native)</div>
              <input
                placeholder="0.0"
                value={amounts[`${c.key}:${c.native.symbol}`] || ''}
                onChange={e => setAmt(c.key, c.native.symbol, e.target.value)}
              />
              {(c.erc20s || []).map(t => (
                <FragmentRow key={`${c.key}:${t.symbol}`}>
                  <div>{t.symbol}</div>
                  <input
                    placeholder="0.0"
                    value={amounts[`${c.key}:${t.symbol}`] || ''}
                    onChange={e => setAmt(c.key, t.symbol, e.target.value)}
                  />
                </FragmentRow>
              ))}
            </div>
            <p style={{ fontSize: 12, color: '#666', marginTop: 8 }}>
              Escrow: {c.escrow}
            </p>
          </div>
        ))}
      </div>

      <button disabled={!isConnected} onClick={signAndRelay} style={{ padding: '10px 16px', fontWeight: 600 }}>
        Sign & Relay
      </button>

      {status && (
        <div style={{ padding: 12, background: '#fafafa', borderRadius: 8, marginTop: 16 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>{status}</div>
        </div>
      )}

      {/* Debug Display */}
      {txResults && (
        <div style={{ marginTop: 16, padding: 12, background: '#fff3cd', borderRadius: 8, fontSize: '12px' }}>
          <strong>Debug - txResults:</strong> {JSON.stringify(txResults, null, 2)}
        </div>
      )}

      {txResults && txResults.length > 0 && (
        <div style={{ marginTop: 16, padding: 16, background: '#f0f9ff', borderRadius: 8, border: '1px solid #0ea5e9' }}>
          <h3 style={{ margin: '0 0 12px 0', color: '#0369a1' }}>Transaction Explorer Links:</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {txResults.map(({ chainKey, chainLabel, txHash, explorerUrl }) => (
              <div key={chainKey} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontWeight: 600, minWidth: 120 }}>{chainLabel}:</span>
                {explorerUrl ? (
                  <a 
                    href={explorerUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ 
                      color: '#0369a1', 
                      textDecoration: 'none',
                      padding: '4px 8px',
                      background: '#e0f2fe',
                      borderRadius: 4,
                      fontSize: '14px',
                      fontFamily: 'monospace'
                    }}
                  >
                    {txHash.slice(0, 8)}...{txHash.slice(-6)} ↗
                  </a>
                ) : (
                  <span style={{ fontFamily: 'monospace', fontSize: '14px', color: '#666' }}>
                    {txHash}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}


      <p style={{ fontSize: 12, color: '#666', marginTop: 16 }}>
        Notes: For ERC-20 legs, the user must have previously approved the <b>Escrow</b> as spender on that chain.<br />
        Native legs (ETH/FLOW/HBAR) send value from the relayer (it fronts the native funds).
      </p>
    </div>
  )
}

function FragmentRow({ children }) {
  return <>{children}</>
}