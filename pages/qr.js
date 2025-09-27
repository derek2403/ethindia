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

  // Available chains (matching your _app.js config)
  const chains = [
    { id: 'mainnet', name: 'Ethereum Mainnet' },
    { id: 'polygon', name: 'Polygon' },
    { id: 'optimism', name: 'Optimism' },
    { id: 'arbitrum', name: 'Arbitrum' },
    { id: 'base', name: 'Base' },
    { id: 'sepolia', name: 'Sepolia' }
  ]

  // Common tokens for each chain with colors and icons
  const tokensByChain = {
    mainnet: [
      { name: 'ETH', color: '#627EEA', icon: 'Ξ' },
      { name: 'USDC', color: '#2775CA', icon: '$' },
      { name: 'USDT', color: '#26A17B', icon: '₮' },
      { name: 'WBTC', color: '#F7931A', icon: '₿' },
      { name: 'DAI', color: '#F5AC37', icon: 'D' }
    ],
    polygon: [
      { name: 'MATIC', color: '#8247E5', icon: '⬟' },
      { name: 'USDC', color: '#2775CA', icon: '$' },
      { name: 'USDT', color: '#26A17B', icon: '₮' },
      { name: 'WETH', color: '#627EEA', icon: 'Ξ' },
      { name: 'DAI', color: '#F5AC37', icon: 'D' }
    ],
    optimism: [
      { name: 'ETH', color: '#627EEA', icon: 'Ξ' },
      { name: 'OP', color: '#FF0420', icon: 'O' },
      { name: 'USDC', color: '#2775CA', icon: '$' },
      { name: 'USDT', color: '#26A17B', icon: '₮' },
      { name: 'WBTC', color: '#F7931A', icon: '₿' }
    ],
    arbitrum: [
      { name: 'ETH', color: '#627EEA', icon: 'Ξ' },
      { name: 'ARB', color: '#28A0F0', icon: 'A' },
      { name: 'USDC', color: '#2775CA', icon: '$' },
      { name: 'USDT', color: '#26A17B', icon: '₮' },
      { name: 'WBTC', color: '#F7931A', icon: '₿' }
    ],
    base: [
      { name: 'ETH', color: '#627EEA', icon: 'Ξ' },
      { name: 'USDC', color: '#2775CA', icon: '$' },
      { name: 'CBETH', color: '#0052FF', icon: 'Ξ' }
    ],
    sepolia: [
      { name: 'ETH', color: '#627EEA', icon: 'Ξ' },
      { name: 'USDC', color: '#2775CA', icon: '$' },
      { name: 'DAI', color: '#F5AC37', icon: 'D' }
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
        colors.push(token?.color || '#6B7280')
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
          padding: 20,
          usePointStyle: true,
        }
      },
      tooltip: {
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
      <div>
        <Header />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Connect Your Wallet</h1>
            <p className="text-gray-600">Please connect your wallet to generate a portfolio QR code</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Header />
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-4xl font-bold mb-2 text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          🎯 Portfolio QR Generator
        </h1>
        <p className="text-gray-600 mb-8 text-center">
          Connected: <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
        </p>

        {isAddingTokens ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 min-h-[600px]">
            {/* Left Panel - Chain Selection */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                <h3 className="text-xl font-bold mb-4 text-gray-800">🔗 Select Blockchain</h3>
                <div className="space-y-3">
                  {chains.map(chain => (
                    <button
                      key={chain.id}
                      onClick={() => setCurrentChain(chain.id)}
                      className={`w-full p-4 rounded-xl text-left transition-all duration-200 ${
                        currentChain === chain.id
                          ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg transform scale-105'
                          : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200'
                      }`}
                    >
                      <div className="font-medium">{chain.name}</div>
                      {selectedChains[chain.id] && (
                        <div className="text-xs mt-1 opacity-90">
                          {Object.keys(selectedChains[chain.id]).length} token(s) selected
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Portfolio Summary */}
              {Object.keys(selectedChains).length > 0 && (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-bold mb-4 text-gray-800">📊 Portfolio Summary</h3>
                  <div className="space-y-3">
                    {Object.entries(selectedChains).map(([chainId, tokens]) => (
                      <div key={chainId} className="space-y-2">
                        <div className="text-sm font-medium text-blue-600">
                          {chains.find(c => c.id === chainId)?.name}
                        </div>
                        {Object.entries(tokens).map(([tokenName, allocation]) => (
                          <div key={tokenName} className="flex justify-between items-center bg-gray-50 p-2 rounded-lg">
                            <span className="text-sm font-medium">{tokenName}</span>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm">{allocation}%</span>
                              <button
                                onClick={() => removeToken(chainId, tokenName)}
                                className="text-red-500 hover:text-red-700 text-xs"
                              >
                                ×
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="font-bold">Total:</span>
                      <span className={`font-bold ${
                        totalAllocation === 100 ? 'text-green-600' : 
                        totalAllocation > 100 ? 'text-red-600' : 'text-blue-600'
                      }`}>
                        {totalAllocation.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Center Panel - Pie Chart */}
            <div className="lg:col-span-1 flex flex-col items-center justify-center">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 w-full max-w-md">
                <h3 className="text-xl font-bold mb-4 text-center text-gray-800">🥧 Portfolio Allocation</h3>
                <div className="h-80">
                  {totalAllocation > 0 ? (
                    <Pie data={chartData} options={chartOptions} />
                  ) : (
                    <div className="h-full flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
                      <div className="text-center text-gray-500">
                        <div className="text-4xl mb-2">📊</div>
                        <p className="text-sm">Select tokens to see your portfolio</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="mt-6 flex space-x-4">
                <button
                  onClick={generateQRCode}
                  disabled={Object.keys(selectedChains).length === 0}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 font-medium flex items-center space-x-2"
                >
                  <span>🎯</span>
                  <span>Generate QR</span>
                </button>
                <button
                  onClick={resetSelection}
                  className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-200 font-medium"
                >
                  🔄 Reset
                </button>
              </div>
            </div>

            {/* Right Panel - Token Selection */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 h-full">
                <h3 className="text-xl font-bold mb-4 text-gray-800">
                  🪙 Available Tokens - {chains.find(c => c.id === currentChain)?.name}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {tokensByChain[currentChain]?.map(token => {
                    const isSelected = selectedChains[currentChain]?.[token.name]
                    return (
                      <button
                        key={token.name}
                        onClick={() => handleTokenClick(token)}
                        disabled={isSelected}
                        className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                          isSelected
                            ? 'border-green-500 bg-green-50 cursor-not-allowed'
                            : 'border-gray-200 hover:border-blue-400 hover:shadow-md hover:scale-105 cursor-pointer'
                        }`}
                      >
                        <div 
                          className="w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center text-white text-lg font-bold"
                          style={{ backgroundColor: token.color }}
                        >
                          {token.icon}
                        </div>
                        <div className="text-sm font-medium text-gray-800">{token.name}</div>
                        {isSelected && (
                          <div className="text-xs text-green-600 mt-1">
                            ✓ {selectedChains[currentChain][token.name]}%
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
                
                {/* Progress indicator */}
                <div className="mt-6">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Portfolio Progress</span>
                    <span>{totalAllocation.toFixed(1)}% / 100%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        totalAllocation <= 100 ? 'bg-gradient-to-r from-blue-500 to-purple-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(totalAllocation, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* QR Code Display */
          <div className="text-center space-y-8">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                🎉 Your Portfolio QR Code
              </h2>
              <p className="text-gray-600">Scan this QR code to share your portfolio allocation</p>
            </div>
            
            {qrDataUrl && (
              <div className="flex flex-col items-center space-y-6">
                {/* QR Code with enhanced styling */}
                <div className="relative p-6 bg-white rounded-2xl shadow-2xl border border-gray-200">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl"></div>
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
                <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-6 rounded-xl border border-gray-200 max-w-2xl w-full">
                  <h3 className="font-semibold mb-4 text-lg text-gray-800">📊 Portfolio Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {Object.entries(selectedChains).map(([chain, tokens]) => (
                      <div key={chain} className="bg-white p-4 rounded-lg border border-gray-200">
                        <h4 className="font-medium text-blue-600 mb-2 capitalize">
                          {chains.find(c => c.id === chain)?.name || chain}
                        </h4>
                        <div className="space-y-1">
                          {Object.entries(tokens).map(([token, allocation]) => (
                            <div key={token} className="flex justify-between text-sm">
                              <span className="font-medium">{token}</span>
                              <span className="text-gray-600">{allocation}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                    <span className="font-semibold text-gray-800">Total Allocation:</span>
                    <span className={`font-bold text-lg ${
                      totalAllocation === 100 ? 'text-green-600' : 'text-blue-600'
                    }`}>
                      {totalAllocation.toFixed(1)}%
                    </span>
                  </div>
                </div>
                
                {/* JSON Data - Collapsible */}
                <details className="w-full max-w-2xl">
                  <summary className="cursor-pointer bg-gray-100 hover:bg-gray-200 p-3 rounded-lg font-medium text-gray-700 transition-colors">
                    🔧 View Raw JSON Data
                  </summary>
                  <div className="mt-3 bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-auto">
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                  Add {selectedToken} to Portfolio
                </h3>
                <p className="text-gray-600">
                  Allocate percentage for {selectedToken} on {chains.find(c => c.id === currentChain)?.name}
                </p>
              </div>

              <div className="space-y-6">
                {/* Current Allocation Display */}
                <div className="text-center">
                  <div className="text-5xl font-bold text-blue-600 mb-2">
                    {tokenAllocation}%
                  </div>
                  <div className="text-sm text-gray-500">
                    Remaining: {(100 - totalAllocation).toFixed(1)}%
                  </div>
                </div>

                {/* Allocation Slider */}
                <div className="space-y-4">
                  <div className="relative">
                    <input
                      type="range"
                      min="0.5"
                      max={Math.min(100 - totalAllocation, 100)}
                      step="0.5"
                      value={tokenAllocation}
                      onChange={(e) => setTokenAllocation(parseFloat(e.target.value))}
                      className="w-full h-3 bg-gradient-to-r from-blue-200 to-purple-200 rounded-lg appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, #3b82f6 0%, #8b5cf6 ${(tokenAllocation / Math.min(100 - totalAllocation, 100)) * 100}%, #e5e7eb ${(tokenAllocation / Math.min(100 - totalAllocation, 100)) * 100}%, #e5e7eb 100%)`
                      }}
                    />
                  </div>
                  
                  {/* Quick percentage buttons */}
                  <div className="flex justify-center space-x-2">
                    {[5, 10, 25, 50].filter(val => val <= (100 - totalAllocation)).map(percentage => (
                      <button
                        key={percentage}
                        onClick={() => setTokenAllocation(percentage)}
                        className="px-3 py-1 text-sm bg-gray-100 hover:bg-blue-100 text-gray-700 hover:text-blue-700 rounded-full transition-colors"
                      >
                        {percentage}%
                      </button>
                    ))}
                  </div>
                </div>

                {/* Modal Actions */}
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => setShowTokenModal(false)}
                    className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addTokenToPortfolio}
                    disabled={tokenAllocation <= 0 || (totalAllocation + tokenAllocation > 100)}
                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    Add to Portfolio
                  </button>
                </div>

                {/* Warning */}
                {totalAllocation + tokenAllocation > 100 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-red-500">⚠️</span>
                      <p className="text-sm text-red-700">
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