import React, { useState, useEffect, useMemo } from 'react'
import { useAccount } from 'wagmi'
import QRCode from 'qrcode'
import { Header } from '@/components/Header'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js'
import { Pie } from 'react-chartjs-2'
import { 
  Link, 
  PieChart, 
  Coins, 
  Layers3,
  Bitcoin,
  DollarSign,
  Banknote,
  TrendingUp,
  RotateCcw,
  Target,
  Plus,
  X,
  CheckCircle2,
  Circle
} from 'lucide-react'

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

  // Available chains with Lucide icons
  const chains = [
    { id: 'mainnet', name: 'Ethereum Mainnet', icon: Layers3, color: 'text-blue-400' },
    { id: 'polygon', name: 'Polygon', icon: Layers3, color: 'text-purple-400' },
    { id: 'optimism', name: 'Optimism', icon: Layers3, color: 'text-red-400' },
    { id: 'arbitrum', name: 'Arbitrum', icon: Layers3, color: 'text-blue-500' },
    { id: 'base', name: 'Base', icon: Layers3, color: 'text-indigo-400' },
    { id: 'sepolia', name: 'Sepolia', icon: Layers3, color: 'text-yellow-400' }
  ]

  // Common tokens for each chain with Lucide icons and theme colors
  const tokensByChain = {
    mainnet: [
      { name: 'ETH', fullName: 'Ethereum', icon: Layers3, color: 'text-blue-400', bgColor: 'bg-blue-500/20', chartColor: '#627EEA' },
      { name: 'USDC', fullName: 'USD Coin', icon: DollarSign, color: 'text-blue-300', bgColor: 'bg-blue-500/20', chartColor: '#2775CA' },
      { name: 'USDT', fullName: 'Tether', icon: Banknote, color: 'text-green-400', bgColor: 'bg-green-500/20', chartColor: '#26A17B' },
      { name: 'WBTC', fullName: 'Wrapped Bitcoin', icon: Bitcoin, color: 'text-orange-400', bgColor: 'bg-orange-500/20', chartColor: '#F7931A' },
      { name: 'DAI', fullName: 'Dai Stablecoin', icon: Coins, color: 'text-yellow-400', bgColor: 'bg-yellow-500/20', chartColor: '#F5AC37' }
    ],
    polygon: [
      { name: 'MATIC', fullName: 'Polygon', icon: Layers3, color: 'text-purple-400', bgColor: 'bg-purple-500/20', chartColor: '#8247E5' },
      { name: 'USDC', fullName: 'USD Coin', icon: DollarSign, color: 'text-blue-300', bgColor: 'bg-blue-500/20', chartColor: '#2775CA' },
      { name: 'USDT', fullName: 'Tether', icon: Banknote, color: 'text-green-400', bgColor: 'bg-green-500/20', chartColor: '#26A17B' },
      { name: 'WETH', fullName: 'Wrapped Ethereum', icon: Layers3, color: 'text-blue-400', bgColor: 'bg-blue-500/20', chartColor: '#627EEA' },
      { name: 'DAI', fullName: 'Dai Stablecoin', icon: Coins, color: 'text-yellow-400', bgColor: 'bg-yellow-500/20', chartColor: '#F5AC37' }
    ],
    optimism: [
      { name: 'ETH', fullName: 'Ethereum', icon: Layers3, color: 'text-blue-400', bgColor: 'bg-blue-500/20', chartColor: '#627EEA' },
      { name: 'USDC', fullName: 'USD Coin', icon: DollarSign, color: 'text-blue-300', bgColor: 'bg-blue-500/20', chartColor: '#2775CA' },
      { name: 'USDT', fullName: 'Tether', icon: Banknote, color: 'text-green-400', bgColor: 'bg-green-500/20', chartColor: '#26A17B' },
      { name: 'WBTC', fullName: 'Wrapped Bitcoin', icon: Bitcoin, color: 'text-orange-400', bgColor: 'bg-orange-500/20', chartColor: '#F7931A' }
    ],
    arbitrum: [
      { name: 'ETH', fullName: 'Ethereum', icon: Layers3, color: 'text-blue-400', bgColor: 'bg-blue-500/20', chartColor: '#627EEA' },
      { name: 'ARB', fullName: 'Arbitrum', icon: Layers3, color: 'text-blue-500', bgColor: 'bg-blue-600/20', chartColor: '#28A0F0' },
      { name: 'USDC', fullName: 'USD Coin', icon: DollarSign, color: 'text-blue-300', bgColor: 'bg-blue-500/20', chartColor: '#2775CA' },
      { name: 'USDT', fullName: 'Tether', icon: Banknote, color: 'text-green-400', bgColor: 'bg-green-500/20', chartColor: '#26A17B' },
      { name: 'WBTC', fullName: 'Wrapped Bitcoin', icon: Bitcoin, color: 'text-orange-400', bgColor: 'bg-orange-500/20', chartColor: '#F7931A' }
    ],
    base: [
      { name: 'ETH', fullName: 'Ethereum', icon: Layers3, color: 'text-blue-400', bgColor: 'bg-blue-500/20', chartColor: '#627EEA' },
      { name: 'USDC', fullName: 'USD Coin', icon: DollarSign, color: 'text-blue-300', bgColor: 'bg-blue-500/20', chartColor: '#2775CA' }
    ],
    sepolia: [
      { name: 'ETH', fullName: 'Ethereum', icon: Layers3, color: 'text-blue-400', bgColor: 'bg-blue-500/20', chartColor: '#627EEA' },
      { name: 'USDC', fullName: 'USD Coin', icon: DollarSign, color: 'text-blue-300', bgColor: 'bg-blue-500/20', chartColor: '#2775CA' },
      { name: 'DAI', fullName: 'Dai Stablecoin', icon: Coins, color: 'text-yellow-400', bgColor: 'bg-yellow-500/20', chartColor: '#F5AC37' }
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
      <div className="min-h-screen bg-black">
        <Header />
        <div className="flex items-center justify-center min-h-screen">
          <div className="glass-card p-6 text-center max-w-md">
            <h1 className="text-xl font-bold mb-3 text-white/90">Connect Your Wallet</h1>
            <p className="text-white/70 text-sm">Please connect your wallet to generate a portfolio QR code</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      <Header />
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-4xl font-bold mb-3 text-center bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          🎯 Portfolio QR Generator
        </h1>
        <p className="text-white/70 mb-8 text-center">
          Connected: <span className="font-mono text-sm bg-white/10 border border-white/20 backdrop-blur-sm px-2 py-1 rounded text-white/90">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
        </p>

        {isAddingTokens ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[600px]">
            {/* Left Panel - Chain Selection */}
            <div className="lg:col-span-1">
              <div className="glass-card p-6 h-fit">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                    <Link className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white/90">Select Blockchain</h3>
                </div>
                <div className="space-y-3">
                  {chains.map(chain => (
                    <button
                      key={chain.id}
                      onClick={() => setCurrentChain(chain.id)}
                      className={`w-full p-4 rounded-xl text-left transition-all duration-200 flex items-center gap-3 ${
                        currentChain === chain.id
                          ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-blue-400 border-2 text-white shadow-lg'
                          : 'bg-white/5 hover:bg-white/10 text-white/80 border border-white/20 backdrop-blur-sm hover:border-white/40'
                      }`}
                    >
                      <div className="relative w-8 h-8 flex-shrink-0 rounded-full bg-white/10 flex items-center justify-center">
                        <chain.icon className={`w-5 h-5 ${chain.color}`} />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{chain.name}</div>
                        {selectedChains[chain.id] && (
                          <div className="text-xs text-white/60">
                            {Object.keys(selectedChains[chain.id]).length} token(s) selected
                          </div>
                        )}
                      </div>
                      {currentChain === chain.id && (
                        <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              
              {/* Portfolio Summary */}
              {Object.keys(selectedChains).length > 0 && (
                <div className="glass-card p-4 mt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center">
                      <TrendingUp className="w-3 h-3 text-white" />
                    </div>
                    <h3 className="text-base font-bold text-white/90">Portfolio Summary</h3>
                  </div>
                  <div className="space-y-2">
                    {Object.entries(selectedChains).map(([chainId, tokens]) => (
                      <div key={chainId} className="space-y-1">
                        <div className="text-xs font-medium text-blue-400 flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-white/10 flex items-center justify-center">
                            <Layers3 className="w-2 h-2 text-blue-400" />
                          </div>
                          {chains.find(c => c.id === chainId)?.name}
                        </div>
                        {Object.entries(tokens).map(([tokenName, allocation]) => {
                          const token = tokensByChain[chainId]?.find(t => t.name === tokenName)
                          return (
                            <div key={tokenName} className="flex justify-between items-center bg-white/5 border border-white/10 p-2 rounded-lg">
                              <div className="flex items-center gap-2">
                                {token && (
                                  <div className={`w-4 h-4 rounded-full ${token.bgColor} flex items-center justify-center`}>
                                    <token.icon className={`w-2.5 h-2.5 ${token.color}`} />
                                  </div>
                                )}
                                <span className="text-xs font-medium text-white/90">{tokenName}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs text-white/80 font-medium">{allocation}%</span>
                                <button
                                  onClick={() => removeToken(chainId, tokenName)}
                                  className="text-red-400 hover:text-red-300 w-4 h-4 rounded-full hover:bg-red-400/10 flex items-center justify-center"
                                >
                                  <X className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-white/20">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-white/90 text-sm">Total:</span>
                      <span className={`font-bold text-base ${
                        totalAllocation === 100 ? 'text-green-400' : 
                        totalAllocation > 100 ? 'text-red-400' : 'text-blue-400'
                      }`}>
                        {totalAllocation.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Center Panel - Portfolio Allocation */}
            <div className="lg:col-span-1">
              <div className="glass-card p-4 h-fit">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-r from-orange-500 to-yellow-500 flex items-center justify-center">
                    <PieChart className="w-3 h-3 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-white/90">Portfolio Allocation</h3>
                </div>
                
                <div className="h-64 mb-4">
                  {totalAllocation > 0 ? (
                    <Pie data={chartData} options={chartOptions} />
                  ) : (
                    <div className="h-full flex items-center justify-center border-2 border-dashed border-white/30 rounded-xl bg-white/5">
                      <div className="text-center text-white/60">
                        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-white/10 flex items-center justify-center">
                          <PieChart className="w-6 h-6 text-white/40" />
                        </div>
                        <p className="text-sm font-medium">Select tokens to see your portfolio</p>
                        <p className="text-xs text-white/40 mt-1">Choose from available tokens on the right</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Action Buttons */}
                <div className="flex flex-col gap-2">
                  <button
                    onClick={generateQRCode}
                    disabled={Object.keys(selectedChains).length === 0}
                    className="w-full px-4 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed transition-all duration-200 font-medium flex items-center justify-center space-x-2 shadow-lg text-sm"
                  >
                    <Target className="w-4 h-4" />
                    <span>Generate QR</span>
                  </button>
                  <button
                    onClick={resetSelection}
                    className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white/80 rounded-lg hover:bg-white/20 hover:text-white transition-all duration-200 font-medium backdrop-blur-sm flex items-center justify-center space-x-2 text-sm"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Reset</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Panel - Available Tokens */}
            <div className="lg:col-span-1">
              <div className="glass-card p-4 h-fit">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                    <Coins className="w-3 h-3 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white/90">Available Tokens</h3>
                    <p className="text-xs text-white/60">{chains.find(c => c.id === currentChain)?.name}</p>
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  {tokensByChain[currentChain]?.map(token => {
                    const isSelected = selectedChains[currentChain]?.[token.name]
                    return (
                      <button
                        key={token.name}
                        onClick={() => handleTokenClick(token)}
                        disabled={isSelected}
                        className={`w-full p-3 rounded-lg border transition-all duration-200 flex items-center gap-3 text-left ${
                          isSelected
                            ? 'border-green-400/50 bg-green-400/10 cursor-not-allowed'
                            : 'border-white/20 hover:border-blue-400/50 hover:bg-white/10 cursor-pointer bg-white/5'
                        }`}
                      >
                        <div className="relative w-10 h-10 flex-shrink-0">
                          <div className={`w-10 h-10 rounded-full ${token.bgColor} border border-white/20 flex items-center justify-center`}>
                            <token.icon className={`w-5 h-5 ${token.color}`} />
                          </div>
                          {isSelected && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full flex items-center justify-center">
                              <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-base font-bold text-white/90">{token.name}</div>
                          <div className="text-xs text-white/60 truncate">{token.fullName}</div>
                          {isSelected && (
                            <div className="text-xs text-green-400 font-medium mt-0.5">
                              {selectedChains[currentChain][token.name]}% allocated
                            </div>
                          )}
                        </div>
                        {!isSelected && (
                          <Circle className="w-5 h-5 text-white/30 flex-shrink-0" />
                        )}
                      </button>
                    )
                  })}
                </div>
                
                {/* Progress indicator */}
                <div className="border-t border-white/20 pt-3">
                  <div className="flex justify-between text-xs text-white/70 mb-2">
                    <span className="font-medium">Portfolio Progress</span>
                    <span className="font-mono">{totalAllocation.toFixed(1)}% / 100%</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${
                        totalAllocation <= 100 ? 'bg-gradient-to-r from-blue-500 to-purple-500' : 'bg-gradient-to-r from-red-500 to-orange-500'
                      }`}
                      style={{ width: `${Math.min(totalAllocation, 100)}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-white/50 mt-1.5 text-center">
                    {totalAllocation === 0 && "Start by selecting tokens above"}
                    {totalAllocation > 0 && totalAllocation < 100 && `${(100 - totalAllocation).toFixed(1)}% remaining`}
                    {totalAllocation === 100 && "Portfolio complete! Ready to generate QR"}
                    {totalAllocation > 100 && "Over-allocated! Please reduce some percentages"}
                  </div>
                </div>
              </div>
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

        {/* Token Allocation Modal */}
        {showTokenModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="glass-card max-w-md w-full p-6">
              <div className="text-center mb-6">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                  <Plus className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white/90 mb-2">
                  Add {selectedToken} to Portfolio
                </h3>
                <p className="text-white/70 text-sm">
                  Set allocation percentage for {selectedToken} on {chains.find(c => c.id === currentChain)?.name}
                </p>
              </div>

              <div className="space-y-6">
                {/* Current Allocation Display */}
                <div className="text-center bg-white/5 border border-white/20 rounded-xl p-4">
                  <div className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
                    {tokenAllocation}%
                  </div>
                  <div className="text-sm text-white/60">
                    Remaining: <span className="font-medium text-white/80">{(100 - totalAllocation).toFixed(1)}%</span>
                  </div>
                </div>

                {/* Allocation Slider */}
                <div className="space-y-4">
                  <div className="space-y-4">
                    <label className="text-sm font-medium text-white/80">Allocation Percentage</label>
                    <div className="relative">
                      <input
                        type="range"
                        min="0.5"
                        max={Math.min(100 - totalAllocation, 100)}
                        step="0.5"
                        value={tokenAllocation}
                        onChange={(e) => setTokenAllocation(parseFloat(e.target.value))}
                        className="w-full h-3 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                        style={{
                          background: `linear-gradient(to right, #3b82f6 0%, #8b5cf6 ${(tokenAllocation / Math.min(100 - totalAllocation, 100)) * 100}%, rgba(255, 255, 255, 0.2) ${(tokenAllocation / Math.min(100 - totalAllocation, 100)) * 100}%, rgba(255, 255, 255, 0.2) 100%)`
                        }}
                      />
                      <div className="flex justify-between text-xs text-white/50 mt-2">
                        <span>0.5%</span>
                        <span>{Math.min(100 - totalAllocation, 100)}%</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Quick percentage buttons */}
                  <div>
                    <label className="text-sm font-medium text-white/80 block mb-3">Quick Select</label>
                    <div className="grid grid-cols-4 gap-2">
                      {[5, 10, 25, 50].filter(val => val <= (100 - totalAllocation)).map(percentage => (
                        <button
                          key={percentage}
                          onClick={() => setTokenAllocation(percentage)}
                          className={`px-3 py-2 text-sm rounded-lg transition-all duration-200 border font-medium ${
                            tokenAllocation === percentage
                              ? 'bg-blue-500 border-blue-400 text-white'
                              : 'bg-white/10 hover:bg-white/20 text-white/80 hover:text-white border-white/20 hover:border-white/40'
                          }`}
                        >
                          {percentage}%
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Modal Actions */}
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => setShowTokenModal(false)}
                    className="flex-1 px-6 py-3 bg-white/10 text-white/80 rounded-xl hover:bg-white/20 transition-all duration-200 font-medium border border-white/20 hover:border-white/40"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addTokenToPortfolio}
                    disabled={tokenAllocation <= 0 || (totalAllocation + tokenAllocation > 100)}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg"
                  >
                    Add to Portfolio
                  </button>
                </div>

                {/* Warning */}
                {totalAllocation + tokenAllocation > 100 && (
                  <div className="bg-red-500/10 border border-red-400/30 rounded-lg p-3 backdrop-blur-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                        <X className="w-3 h-3 text-red-400" />
                      </div>
                      <p className="text-sm text-red-300">
                        This allocation would exceed 100%. Please reduce the percentage.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default QRPage