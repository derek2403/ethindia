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
import QRDisplay from '@/components/QRDisplay'
import SimpleQRDisplay from '@/components/SimpleQRDisplay'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js'
import { Pie } from 'react-chartjs-2'

ChartJS.register(ArcElement, Tooltip, Legend)

const MerchantPage = () => {
  const { address, isConnected } = useAccount()
  const [selectedChains, setSelectedChains] = useState({})
  const [currentChain, setCurrentChain] = useState('sepolia')
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [showTokenModal, setShowTokenModal] = useState(false)
  const [showQRModal, setShowQRModal] = useState(false)
  const [showSimpleQRModal, setShowSimpleQRModal] = useState(false)
  const [selectedToken, setSelectedToken] = useState('')
  const [tokenAllocation, setTokenAllocation] = useState(10)

  // Available chains with SVG icons
  const chains = [
    { id: 'sepolia', name: 'Sepolia', icon: '/icons/ethereum-eth-logo.svg' },
    { id: 'flow', name: 'Flow', icon: '/icons/flow-flow-logo.svg' },
    { id: 'hedera', name: 'Hedera', icon: '/icons/hedera-hbar-logo.svg' },
    { id: 'optimism', name: 'Optimism', icon: '/icons/optimism-ethereum-op-logo.svg' },
    { id: 'polygon', name: 'Polygon', icon: '/icons/polygon-matic-logo.svg' },
    { id: 'arbitrum', name: 'Arbitrum', icon: '/icons/arbitrum-arb-logo.svg' }
  ]

  // Common tokens for each chain with SVG icons and consistent styling
  const tokensByChain = {
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
    sepolia: [
      { name: 'ETH', fullName: 'Ethereum', icon: '/icons/ethereum-eth-logo.svg', chartColor: '#627EEA' },
      { name: 'PYUSD', fullName: 'PayPal USD', icon: '/icons/paypal-usd-pyusd-logo.svg', chartColor: '#0070BA' },
      { name: 'LINK', fullName: 'Chainlink', icon: '/icons/chainlink-link-logo.svg', chartColor: '#375BD2' }
    ],
    flow: [
      { name: 'FLOW', fullName: 'Flow', icon: '/icons/flow-flow-logo.svg', chartColor: '#00EF8B' }
    ],
    hedera: [
      { name: 'HBAR', fullName: 'Hedera Hashgraph', icon: '/icons/hedera-hbar-logo.svg', chartColor: '#82259D' },
      { name: 'USDC', fullName: 'USD Coin', icon: '/icons/usd-coin-usdc-logo.svg', chartColor: '#2775CA' }
    ]
  }

  // Calculate total payment preference percentage and prepare chart data
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
    
    // Add remaining preference if less than 100%
    if (totalAllocation < 100) {
      labels.push('No Preference')
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
    // Set allocation to remaining percentage or 10%, whichever is smaller
    const remainingPercentage = 100 - totalAllocation
    setTokenAllocation(Math.min(remainingPercentage, 10))
    setShowTokenModal(true)
  }

  const addPaymentPreference = () => {
    if (!currentChain || !selectedToken || !tokenAllocation) {
      alert('Please fill in all fields')
      return
    }

    // Check if adding this preference would exceed 100%
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
      setShowQRModal(true)
    } catch (error) {
      console.error('Error generating QR code:', error)
      alert('Error generating QR code')
    }
  }

  const generateSimpleQRCode = async () => {
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
      setShowSimpleQRModal(true)
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
    setCurrentChain('sepolia')
    setSelectedToken('')
    setTokenAllocation(10)
    setQrDataUrl('')
    setShowTokenModal(false)
    setShowQRModal(false)
    setShowSimpleQRModal(false)
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
              <p className="text-white/70">Please connect your wallet to set up payment claiming preferences</p>
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 h-full">
            {/* Left Panel - Payment Chain Selection */}
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
              
          {/* Center Panel - Payment Preferences */}
          <div className="lg:col-span-1 h-full">
            <PortfolioChart
              totalAllocation={totalAllocation}
              chartData={chartData}
              chartOptions={chartOptions}
              generateQRCode={generateSimpleQRCode}
              resetSelection={resetSelection}
              selectedChains={selectedChains}
            />
            </div>
            
          {/* Right Panel - Available Payment Tokens */}
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
        addTokenToPortfolio={addPaymentPreference}
      />
      
      <QRDisplay
        showQRModal={showQRModal}
        setShowQRModal={setShowQRModal}
        qrDataUrl={qrDataUrl}
        selectedChains={selectedChains}
        chains={chains}
        tokensByChain={tokensByChain}
        totalAllocation={totalAllocation}
        address={address}
        resetSelection={resetSelection}
      />
      
      <SimpleQRDisplay
        showSimpleQRModal={showSimpleQRModal}
        setShowSimpleQRModal={setShowSimpleQRModal}
        qrDataUrl={qrDataUrl}
      />
    </div>
  )
}

export default MerchantPage
