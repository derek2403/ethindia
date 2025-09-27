import React, { useState, useEffect, useMemo } from 'react'
import { useAccount } from 'wagmi'
import QRCode from 'qrcode'
import { Header } from '@/components/Header'

const QRPage = () => {
  const { address, isConnected } = useAccount()
  const [selectedChains, setSelectedChains] = useState({})
  const [currentChain, setCurrentChain] = useState('')
  const [currentToken, setCurrentToken] = useState('')
  const [currentAllocation, setCurrentAllocation] = useState(10)
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [isAddingTokens, setIsAddingTokens] = useState(true)

  // Available chains (matching your _app.js config)
  const chains = [
    { id: 'mainnet', name: 'Ethereum Mainnet' },
    { id: 'polygon', name: 'Polygon' },
    { id: 'optimism', name: 'Optimism' },
    { id: 'arbitrum', name: 'Arbitrum' },
    { id: 'base', name: 'Base' },
    { id: 'sepolia', name: 'Sepolia' }
  ]

  // Common tokens for each chain
  const tokensByChain = {
    mainnet: ['ETH', 'USDC', 'USDT', 'WBTC', 'DAI'],
    polygon: ['MATIC', 'USDC', 'USDT', 'WETH', 'DAI'],
    optimism: ['ETH', 'OP', 'USDC', 'USDT', 'WBTC'],
    arbitrum: ['ETH', 'ARB', 'USDC', 'USDT', 'WBTC'],
    base: ['ETH', 'USDC', 'CBETH'],
    sepolia: ['ETH', 'USDC', 'DAI']
  }

  // Calculate total allocation percentage
  const totalAllocation = useMemo(() => {
    return Object.values(selectedChains).reduce((total, chainTokens) => {
      return total + Object.values(chainTokens).reduce((chainTotal, allocation) => chainTotal + allocation, 0)
    }, 0)
  }, [selectedChains])

  const addTokenToChain = () => {
    if (!currentChain || !currentToken || !currentAllocation) {
      alert('Please fill in all fields')
      return
    }

    // Check if adding this allocation would exceed 100%
    if (totalAllocation + currentAllocation > 100) {
      alert(`Adding ${currentAllocation}% would exceed 100%. Current total: ${totalAllocation.toFixed(1)}%`)
      return
    }

    // Check if token already exists for this chain
    if (selectedChains[currentChain]?.[currentToken]) {
      alert(`${currentToken} already exists for ${currentChain}. Remove it first or choose a different token.`)
      return
    }

    setSelectedChains(prev => ({
      ...prev,
      [currentChain]: {
        ...prev[currentChain],
        [currentToken]: currentAllocation
      }
    }))

    // Reset current selections
    setCurrentToken('')
    setCurrentAllocation(10)
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
    setCurrentChain('')
    setCurrentToken('')
    setCurrentAllocation(10)
    setQrDataUrl('')
    setIsAddingTokens(true)
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
      <style jsx>{`
        .slider {
          background: linear-gradient(to right, #3b82f6 0%, #8b5cf6 100%);
        }
        
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 24px;
          width: 24px;
          border-radius: 50%;
          background: #ffffff;
          border: 3px solid #3b82f6;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
        }
        
        .slider::-moz-range-thumb {
          height: 24px;
          width: 24px;
          border-radius: 50%;
          background: #ffffff;
          border: 3px solid #3b82f6;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
        }
        
        .slider::-webkit-slider-track {
          height: 12px;
          border-radius: 6px;
        }
        
        .slider::-moz-range-track {
          height: 12px;
          border-radius: 6px;
        }
      `}</style>
      <Header />
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Portfolio QR Generator
        </h1>
        <p className="text-gray-600 mb-8 text-center">Connected Wallet: <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{address}</span></p>

        {isAddingTokens ? (
          <div className="space-y-6">
            {/* Current Portfolio Display */}
            {Object.keys(selectedChains).length > 0 && (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Current Portfolio</h3>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    totalAllocation === 100 ? 'bg-green-100 text-green-800' :
                    totalAllocation > 100 ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    Total: {totalAllocation.toFixed(1)}%
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full transition-all duration-300 ${
                        totalAllocation <= 100 ? 'bg-gradient-to-r from-blue-500 to-purple-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(totalAllocation, 100)}%` }}
                    ></div>
                  </div>
                </div>

                {Object.entries(selectedChains).map(([chain, tokens]) => (
                  <div key={chain} className="mb-4 last:mb-0">
                    <div className="flex items-center justify-between mb-2">
                      <strong className="text-blue-600 capitalize text-sm font-medium">
                        {chains.find(c => c.id === chain)?.name || chain}
                      </strong>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {Object.entries(tokens).map(([token, allocation]) => (
                        <div key={token} className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-gray-800">{token}</span>
                            <span className="text-sm text-gray-600">{allocation}%</span>
                          </div>
                          <button
                            onClick={() => removeToken(chain, token)}
                            className="text-red-500 hover:text-red-700 text-sm font-medium transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Chain Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">Select Chain:</label>
              <select
                value={currentChain}
                onChange={(e) => setCurrentChain(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Choose a chain...</option>
                {chains.map(chain => (
                  <option key={chain.id} value={chain.id}>{chain.name}</option>
                ))}
              </select>
            </div>

            {/* Token Selection */}
            {currentChain && (
              <div>
                <label className="block text-sm font-medium mb-2">Select Token:</label>
                <select
                  value={currentToken}
                  onChange={(e) => setCurrentToken(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Choose a token...</option>
                  {tokensByChain[currentChain]?.map(token => (
                    <option key={token} value={token}>{token}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Allocation Slider */}
            {currentToken && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-medium text-gray-700">Allocation</label>
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl font-bold text-blue-600">{currentAllocation}%</span>
                    {totalAllocation + currentAllocation > 100 && (
                      <span className="text-xs text-red-500 font-medium">
                        (Would exceed 100%)
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="relative">
                  <input
                    type="range"
                    min="1"
                    max={Math.min(100 - totalAllocation, 100)}
                    step="0.5"
                    value={currentAllocation}
                    onChange={(e) => setCurrentAllocation(parseFloat(e.target.value))}
                    className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>1%</span>
                    <span className="text-gray-400">
                      Max: {(100 - totalAllocation).toFixed(1)}%
                    </span>
                    <span>100%</span>
                  </div>
                </div>
                
                {/* Quick percentage buttons */}
                <div className="flex space-x-2">
                  {[5, 10, 25, 50].filter(val => val <= (100 - totalAllocation)).map(percentage => (
                    <button
                      key={percentage}
                      onClick={() => setCurrentAllocation(percentage)}
                      className="px-3 py-1 text-xs bg-gray-100 hover:bg-blue-100 text-gray-700 hover:text-blue-700 rounded-full transition-colors"
                    >
                      {percentage}%
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
              <button
                onClick={addTokenToChain}
                disabled={!currentChain || !currentToken || !currentAllocation || (totalAllocation + currentAllocation > 100)}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 font-medium"
              >
                + Add Token
              </button>
              <button
                onClick={generateQRCode}
                disabled={Object.keys(selectedChains).length === 0}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 font-medium flex items-center justify-center space-x-2"
              >
                <span>🎯</span>
                <span>Generate QR Code</span>
              </button>
              <button
                onClick={resetSelection}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-200 font-medium"
              >
                🗑️ Reset
              </button>
            </div>
            
            {/* Helpful Tips */}
            {totalAllocation > 0 && totalAllocation < 100 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <span className="text-blue-500 mt-0.5">💡</span>
                  <div className="text-sm text-blue-700">
                    <p className="font-medium">Tip:</p>
                    <p>You have {(100 - totalAllocation).toFixed(1)}% remaining to allocate. You can generate the QR code anytime, even with partial allocation.</p>
                  </div>
                </div>
              </div>
            )}
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
      </div>
    </div>
  )
}

export default QRPage