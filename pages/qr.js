import React, { useState, useEffect, useMemo } from 'react'
import { useAccount } from 'wagmi'
import QRCode from 'qrcode'
import Image from 'next/image'
import { Header } from '@/components/Header'
import { Spotlight } from '@/components/ui/spotlight-new'
import ChainSelector from '@/components/ChainSelector'
import PortfolioChart from '@/components/PortfolioChart'
import TokenGrid from '@/components/TokenGrid'
import PortfolioSummary from '@/components/PortfolioSummary'
import TokenModal from '@/components/TokenModal'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js'
import { Pie } from 'react-chartjs-2'

ChartJS.register(ArcElement, Tooltip, Legend)

const QRPage = () => {
  const { address, isConnected } = useAccount()
  const [selectedChains, setSelectedChains] = useState({})
  const [currentChain, setCurrentChain] = useState('mainnet')
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [isAddingTokens, setIsAddingTokens] = useState(true)
  const [showTokenModal, setShowTokenModal] = useState(false)
  const [selectedToken, setSelectedToken] = useState('')
  const [tokenAllocation, setTokenAllocation] = useState(10)

  // Available chains with SVG icons
  const chains = [
    { id: 'mainnet', name: 'Ethereum Mainnet', icon: '/icons/ethereum-eth-logo.svg' },
    { id: 'polygon', name: 'Polygon', icon: '/icons/polygon-matic-logo.svg' },
    { id: 'optimism', name: 'Optimism', icon: '/icons/ethereum-eth-logo.svg' },
    { id: 'arbitrum', name: 'Arbitrum', icon: '/icons/arbitrum-arb-logo.svg' },
    { id: 'base', name: 'Base', icon: '/icons/ethereum-eth-logo.svg' },
    { id: 'sepolia', name: 'Sepolia', icon: '/icons/ethereum-eth-logo.svg' },
    { id: 'flow', name: 'Flow', icon: '/icons/flow-flow-logo.svg' },
    { id: 'hedera', name: 'Hedera', icon: '/icons/hedera-hbar-logo.svg' }
  ]

  // Common tokens for each chain with SVG icons and consistent styling
  const tokensByChain = {
    mainnet: [
      { name: 'ETH', fullName: 'Ethereum', icon: '/icons/ethereum-eth-logo.svg', chartColor: '#627EEA' },
      { name: 'USDC', fullName: 'USD Coin', icon: '/icons/usd-coin-usdc-logo.svg', chartColor: '#2775CA' },
      { name: 'USDT', fullName: 'Tether', icon: '/icons/tether-usdt-logo.svg', chartColor: '#26A17B' },
      { name: 'WBTC', fullName: 'Wrapped Bitcoin', icon: '/icons/bitcoin-btc-logo.svg', chartColor: '#F7931A' },
      { name: 'DAI', fullName: 'Dai Stablecoin', icon: '/icons/multi-collateral-dai-dai-logo.svg', chartColor: '#F5AC37' }
    ],
    polygon: [
      { name: 'MATIC', fullName: 'Polygon', icon: '/icons/polygon-matic-logo.svg', chartColor: '#8247E5' },
      { name: 'USDC', fullName: 'USD Coin', icon: '/icons/usd-coin-usdc-logo.svg', chartColor: '#2775CA' },
      { name: 'USDT', fullName: 'Tether', icon: '/icons/tether-usdt-logo.svg', chartColor: '#26A17B' },
      { name: 'WETH', fullName: 'Wrapped Ethereum', icon: '/icons/ethereum-eth-logo.svg', chartColor: '#627EEA' },
      { name: 'DAI', fullName: 'Dai Stablecoin', icon: '/icons/multi-collateral-dai-dai-logo.svg', chartColor: '#F5AC37' }
    ],
    optimism: [
      { name: 'ETH', fullName: 'Ethereum', icon: '/icons/ethereum-eth-logo.svg', chartColor: '#627EEA' },
      { name: 'USDC', fullName: 'USD Coin', icon: '/icons/usd-coin-usdc-logo.svg', chartColor: '#2775CA' },
      { name: 'USDT', fullName: 'Tether', icon: '/icons/tether-usdt-logo.svg', chartColor: '#26A17B' },
      { name: 'WBTC', fullName: 'Wrapped Bitcoin', icon: '/icons/bitcoin-btc-logo.svg', chartColor: '#F7931A' }
    ],
    arbitrum: [
      { name: 'ETH', fullName: 'Ethereum', icon: '/icons/ethereum-eth-logo.svg', chartColor: '#627EEA' },
      { name: 'PYUSD', fullName: 'PayPal USD', icon: '/icons/paypal-usd-pyusd-logo.svg', chartColor: '#0070BA' },
      { name: 'ARB', fullName: 'Arbitrum', icon: '/icons/arbitrum-arb-logo.svg', chartColor: '#28A0F0' },
      { name: 'USDC', fullName: 'USD Coin', icon: '/icons/usd-coin-usdc-logo.svg', chartColor: '#2775CA' },
      { name: 'USDT', fullName: 'Tether', icon: '/icons/tether-usdt-logo.svg', chartColor: '#26A17B' },
      { name: 'WBTC', fullName: 'Wrapped Bitcoin', icon: '/icons/bitcoin-btc-logo.svg', chartColor: '#F7931A' }
    ],
    base: [
      { name: 'ETH', fullName: 'Ethereum', icon: '/icons/ethereum-eth-logo.svg', chartColor: '#627EEA' },
      { name: 'USDC', fullName: 'USD Coin', icon: '/icons/usd-coin-usdc-logo.svg', chartColor: '#2775CA' }
    ],
    sepolia: [
      { name: 'ETH', fullName: 'Ethereum', icon: '/icons/ethereum-eth-logo.svg', chartColor: '#627EEA' },
      { name: 'PYUSD', fullName: 'PayPal USD', icon: '/icons/paypal-usd-pyusd-logo.svg', chartColor: '#0070BA' },
      { name: 'LINK', fullName: 'Chainlink', icon: '/icons/ethereum-eth-logo.svg', chartColor: '#375BD2' }
    ],
    flow: [
      { name: 'FLOW', fullName: 'Flow', icon: '/icons/flow-flow-logo.svg', chartColor: '#00EF8B' }
    ],
    hedera: [
      { name: 'HBAR', fullName: 'Hedera Hashgraph', icon: '/icons/hedera-hbar-logo.svg', chartColor: '#82259D' },
      { name: 'USDC', fullName: 'USD Coin', icon: '/icons/usd-coin-usdc-logo.svg', chartColor: '#2775CA' }
    ]
  }

  // Calculate total allocation percentage and prepare chart data
  const totalAllocation = useMemo(() => {
    return Object.values(selectedChains).reduce((total, chainTokens) => {
      return total + Object.values(chainTokens).reduce((chainTotal, allocation) => chainTotal + allocation, 0)
    }, 0)
  }, [selectedChains])

  // Prepare pie chart data
  const chartData = useMemo(() => {
    const data = []
    const labels = []
    const colors = []
    
    Object.entries(selectedChains).forEach(([chainId, tokens]) => {
      Object.entries(tokens).forEach(([tokenName, allocation]) => {
        const token = tokensByChain[chainId]?.find(t => t.name === tokenName)
        labels.push(`${tokenName} (${chainId})`)
        data.push(allocation)
        colors.push(token?.chartColor || '#6B7280')
      })
    })
    
    // Add remaining allocation if less than 100%
    if (totalAllocation < 100) {
      labels.push('Unallocated')
      data.push(100 - totalAllocation)
      colors.push('#E5E7EB')
    }
    
    return {
      labels,
      datasets: [{
        data,
        backgroundColor: colors,
        borderColor: colors.map(color => color + '80'),
        borderWidth: 2,
      }]
    }
  }, [selectedChains, totalAllocation, tokensByChain])

  const handleTokenClick = (token) => {
    setSelectedToken(token.name)
    setShowTokenModal(true)
  }

  const addTokenToPortfolio = () => {
    if (!currentChain || !selectedToken || !tokenAllocation) {
      alert('Please fill in all fields')
      return
    }

    // Check if adding this allocation would exceed 100%
    if (totalAllocation + tokenAllocation > 100) {
      alert(`Adding ${tokenAllocation}% would exceed 100%. Current total: ${totalAllocation.toFixed(1)}%`)
      return
    }

    // Check if token already exists for this chain
    if (selectedChains[currentChain]?.[selectedToken]) {
      alert(`${selectedToken} already exists for ${currentChain}. Remove it first or choose a different token.`)
      return
    }

    setSelectedChains(prev => ({
      ...prev,
      [currentChain]: {
        ...prev[currentChain],
        [selectedToken]: tokenAllocation
      }
    }))

    // Reset and close modal
    setShowTokenModal(false)
    setSelectedToken('')
    setTokenAllocation(10)
  }

  const generateQRCode = async () => {
    if (!isConnected || !address) {
      alert('Please connect your wallet first')
      return
    }

    const qrData = {
      walletAddress: address,
      ...selectedChains
    }

    try {
      const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(qrData))
      setQrDataUrl(qrCodeDataUrl)
      setIsAddingTokens(false)
    } catch (error) {
      console.error('Error generating QR code:', error)
      alert('Error generating QR code')
    }
  }

  const removeToken = (chainId, tokenName) => {
    setSelectedChains(prev => {
      const newChains = { ...prev }
      delete newChains[chainId][tokenName]
      
      // Remove chain if no tokens left
      if (Object.keys(newChains[chainId]).length === 0) {
        delete newChains[chainId]
      }
      
      return newChains
    })
  }

  const resetSelection = () => {
    setSelectedChains({})
    setCurrentChain('mainnet')
    setSelectedToken('')
    setTokenAllocation(10)
    setQrDataUrl('')
    setIsAddingTokens(true)
    setShowTokenModal(false)
  }

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 16,
          usePointStyle: true,
          pointStyle: 'circle',
          color: 'rgba(255, 255, 255, 0.8)',
          font: {
            size: 12,
            weight: '500'
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'rgba(255, 255, 255, 0.9)',
        bodyColor: 'rgba(255, 255, 255, 0.8)',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          label: function(context) {
            const label = context.label || ''
            const value = context.parsed
            return `${label}: ${value.toFixed(1)}%`
          }
        }
      }
    },
    maintainAspectRatio: false,
  }

  if (!isConnected) {
    return (
      <div className="h-screen bg-black overflow-hidden relative">
        <Spotlight
          gradientFirst="radial-gradient(68.54% 68.72% at 55.02% 31.46%, hsla(0, 0%, 100%, .12) 0, hsla(0, 0%, 100%, .04) 50%, hsla(0, 0%, 100%, 0) 80%)"
          gradientSecond="radial-gradient(50% 50% at 50% 50%, hsla(0, 0%, 100%, .08) 0, hsla(0, 0%, 100%, .03) 80%, transparent 100%)"
          gradientThird="radial-gradient(50% 50% at 50% 50%, hsla(0, 0%, 100%, .06) 0, hsla(0, 0%, 100%, .02) 80%, transparent 100%)"
          translateY={-300}
          width={600}
          height={1200}
          smallWidth={300}
          duration={6}
          xOffset={120}
        />
        <div className="relative z-10">
          <Header />
          <div className="flex items-center justify-center h-[calc(100vh-80px)]">
            <div className="glass-card p-8 text-center">
              <h1 className="text-2xl font-bold mb-4 text-white/90">Connect Your Wallet</h1>
              <p className="text-white/70">Please connect your wallet to generate a portfolio QR code</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-black overflow-hidden relative">
      <div className="absolute inset-0 z-0">
        <Spotlight
          gradientFirst="radial-gradient(68.54% 68.72% at 55.02% 31.46%, hsla(0, 0%, 100%, .12) 0, hsla(0, 0%, 100%, .04) 50%, hsla(0, 0%, 100%, 0) 80%)"
          gradientSecond="radial-gradient(50% 50% at 50% 50%, hsla(0, 0%, 100%, .08) 0, hsla(0, 0%, 100%, .03) 80%, transparent 100%)"
          gradientThird="radial-gradient(50% 50% at 50% 50%, hsla(0, 0%, 100%, .06) 0, hsla(0, 0%, 100%, .02) 80%, transparent 100%)"
          translateY={-300}
          width={600}
          height={1200}
          smallWidth={300}
          duration={6}
          xOffset={120}
        />
      </div>
      <div className="relative z-10">
        <Header />
        <div className="max-w-7xl mx-auto p-3 h-[calc(100vh-70px)]">

        {isAddingTokens ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 h-full">
            {/* Left Panel - Chain Selection */}
            <div className="lg:col-span-1 h-full flex flex-col">
              <ChainSelector
                chains={chains}
                currentChain={currentChain}
                setCurrentChain={setCurrentChain}
                selectedChains={selectedChains}
              />
              <PortfolioSummary
                selectedChains={selectedChains}
                chains={chains}
                tokensByChain={tokensByChain}
                totalAllocation={totalAllocation}
                removeToken={removeToken}
              />
            </div>

            {/* Center Panel - Portfolio Allocation */}
            <div className="lg:col-span-1 h-full">
              <PortfolioChart
                totalAllocation={totalAllocation}
                chartData={chartData}
                chartOptions={chartOptions}
                generateQRCode={generateQRCode}
                resetSelection={resetSelection}
                selectedChains={selectedChains}
              />
            </div>

            {/* Right Panel - Available Tokens */}
            <div className="lg:col-span-1 h-full">
              <TokenGrid
                chains={chains}
                currentChain={currentChain}
                tokensByChain={tokensByChain}
                selectedChains={selectedChains}
                handleTokenClick={handleTokenClick}
                totalAllocation={totalAllocation}
              />
            </div>
          </div>
        ) : (
          /* QR Code Display */
              <div className="text-center space-y-8">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                🎉 Your Portfolio QR Code
              </h2>
              <p className="text-white/70">Scan this QR code to share your portfolio allocation</p>
            </div>
            
            {qrDataUrl && (
              <div className="flex flex-col items-center space-y-6">
                {/* QR Code with enhanced styling */}
                <div className="relative p-6 glass-card">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl"></div>
                  <div className="relative">
                    <img 
                      src={qrDataUrl} 
                      alt="Portfolio QR Code" 
                      className="rounded-xl shadow-lg" 
                      style={{ width: '300px', height: '300px' }}
                    />
                  </div>
                </div>
                
                {/* Portfolio Summary */}
                <div className="glass-card p-6 max-w-2xl w-full">
                  <h3 className="font-semibold mb-4 text-lg text-white/90">📊 Portfolio Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {Object.entries(selectedChains).map(([chain, tokens]) => (
                      <div key={chain} className="bg-white/5 border border-white/20 p-4 rounded-lg backdrop-blur-sm">
                        <h4 className="font-medium text-blue-400 mb-2 capitalize">
                          {chains.find(c => c.id === chain)?.name || chain}
                        </h4>
                        <div className="space-y-1">
                          {Object.entries(tokens).map(([token, allocation]) => (
                            <div key={token} className="flex justify-between text-sm">
                              <span className="font-medium text-white/90">{token}</span>
                              <span className="text-white/70">{allocation}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-white/20">
                    <span className="font-semibold text-white/90">Total Allocation:</span>
                    <span className={`font-bold text-lg ${
                      totalAllocation === 100 ? 'text-green-400' : 'text-blue-400'
                    }`}>
                      {totalAllocation.toFixed(1)}%
                    </span>
                  </div>
                </div>
                
                {/* JSON Data - Collapsible */}
                <details className="w-full max-w-2xl">
                  <summary className="cursor-pointer bg-white/10 hover:bg-white/20 border border-white/20 p-3 rounded-lg font-medium text-white/80 transition-colors backdrop-blur-sm">
                    🔧 View Raw JSON Data
                  </summary>
                  <div className="mt-3 bg-black/50 border border-white/20 text-green-400 p-4 rounded-lg font-mono text-sm overflow-auto backdrop-blur-sm">
                    <pre>
                      {JSON.stringify({
                        walletAddress: address,
                        ...selectedChains
                      }, null, 2)}
                    </pre>
                  </div>
                </details>
                
                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                  <button
                    onClick={resetSelection}
                    className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium flex items-center justify-center space-x-2"
                  >
                    <span>🔄</span>
                    <span>Create New Portfolio</span>
                  </button>
                  <button
                    onClick={() => {
                      const link = document.createElement('a')
                      link.download = `portfolio-qr-${Date.now()}.png`
                      link.href = qrDataUrl
                      link.click()
                    }}
                    className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 font-medium flex items-center justify-center space-x-2"
                  >
                    <span>💾</span>
                    <span>Download QR Code</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        </div>
      </div>
      
      <TokenModal
        showTokenModal={showTokenModal}
        setShowTokenModal={setShowTokenModal}
        selectedToken={selectedToken}
        chains={chains}
        currentChain={currentChain}
        tokensByChain={tokensByChain}
        tokenAllocation={tokenAllocation}
        setTokenAllocation={setTokenAllocation}
        totalAllocation={totalAllocation}
        addTokenToPortfolio={addTokenToPortfolio}
      />
    </div>
  )
}

export default QRPage