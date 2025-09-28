import React, { useState, useEffect, useMemo } from 'react'
import { useAccount } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import QRCode from 'qrcode'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { ethers } from 'ethers'
import { Spotlight } from '@/components/ui/spotlight-new'
import ChainSelector from '@/components/ChainSelector'
import PortfolioChart from '@/components/PortfolioChart'
import TokenGrid from '@/components/TokenGrid'
import PortfolioSummary from '@/components/PortfolioSummary'
import TokenModal from '@/components/TokenModal'
import QRDisplay from '@/components/QRDisplay'
import SimpleQRDisplay from '@/components/SimpleQRDisplay'
import SuccessClaimModal from '@/components/SuccessClaimModal'
import { useEscrowView } from '../hooks/useEscrowView'
import { useEscrowWithdraw } from '../hooks/useEscrowWithdraw'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js'
import { Pie } from 'react-chartjs-2'

ChartJS.register(ArcElement, Tooltip, Legend)

// Remove the default legend and create custom one
ChartJS.register({
  id: 'customTokenLegend',
  afterUpdate: (chart) => {
    chart.options.plugins.legend.display = false
  }
})

const MerchantPage = () => {
  const { address, isConnected } = useAccount()
  const [selectedChains, setSelectedChains] = useState({})
  const [currentChain, setCurrentChain] = useState('sepolia')
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [showTokenModal, setShowTokenModal] = useState(false)
  const [showQRModal, setShowQRModal] = useState(false)
  const [showSimpleQRModal, setShowSimpleQRModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [selectedToken, setSelectedToken] = useState('')
  const [tokenAllocation, setTokenAllocation] = useState(10)
  const [claimDetails, setClaimDetails] = useState({})

  // Available chains with SVG icons
  const chains = [
    { id: 'sepolia', name: 'Sepolia', icon: '/icons/ethereum-eth-logo.svg' },
    { id: 'flow', name: 'Flow', icon: '/icons/flow-flow-logo.svg' },
    { id: 'hedera', name: 'Hedera', icon: '/icons/hedera-hbar-logo.svg' },
    { id: 'optimism', name: 'Optimism', icon: '/icons/optimism-ethereum-op-logo.svg' },
    { id: 'polygon', name: 'Polygon', icon: '/icons/polygon-matic-logo.svg' },
    { id: 'arbitrum', name: 'Arbitrum', icon: '/icons/arbitrum-arb-logo.svg' }
  ]

  // Common tokens for each chain with SVG icons and dark theme colors
  const tokensByChain = {
    polygon: [
      { name: 'MATIC', fullName: 'Polygon', icon: '/icons/polygon-matic-logo.svg', chartColor: '#E5E7EB' },
      { name: 'USDC', fullName: 'USD Coin', icon: '/icons/usd-coin-usdc-logo.svg', chartColor: '#D1D5DB' },
      { name: 'USDT', fullName: 'Tether', icon: '/icons/tether-usdt-logo.svg', chartColor: '#9CA3AF' },
      { name: 'WETH', fullName: 'Wrapped Ethereum', icon: '/icons/ethereum-eth-logo.svg', chartColor: '#6B7280' },
      { name: 'DAI', fullName: 'Dai Stablecoin', icon: '/icons/multi-collateral-dai-dai-logo.svg', chartColor: '#4B5563' }
    ],
    optimism: [
      { name: 'ETH', fullName: 'Ethereum', icon: '/icons/ethereum-eth-logo.svg', chartColor: '#E5E7EB' },
      { name: 'USDC', fullName: 'USD Coin', icon: '/icons/usd-coin-usdc-logo.svg', chartColor: '#D1D5DB' },
      { name: 'USDT', fullName: 'Tether', icon: '/icons/tether-usdt-logo.svg', chartColor: '#9CA3AF' },
      { name: 'WBTC', fullName: 'Wrapped Bitcoin', icon: '/icons/bitcoin-btc-logo.svg', chartColor: '#6B7280' }
    ],
    arbitrum: [
      { name: 'ETH', fullName: 'Ethereum', icon: '/icons/ethereum-eth-logo.svg', chartColor: '#E5E7EB' },
      { name: 'PYUSD', fullName: 'PayPal USD', icon: '/icons/paypal-usd-pyusd-logo.svg', chartColor: '#D1D5DB' },
      { name: 'ARB', fullName: 'Arbitrum', icon: '/icons/arbitrum-arb-logo.svg', chartColor: '#9CA3AF' },
      { name: 'USDC', fullName: 'USD Coin', icon: '/icons/usd-coin-usdc-logo.svg', chartColor: '#6B7280' },
      { name: 'USDT', fullName: 'Tether', icon: '/icons/tether-usdt-logo.svg', chartColor: '#4B5563' },
      { name: 'WBTC', fullName: 'Wrapped Bitcoin', icon: '/icons/bitcoin-btc-logo.svg', chartColor: '#374151' }
    ],
    sepolia: [
      { name: 'ETH', fullName: 'Ethereum', icon: '/icons/ethereum-eth-logo.svg', chartColor: '#E5E7EB' },
      { name: 'PYUSD', fullName: 'PayPal USD', icon: '/icons/paypal-usd-pyusd-logo.svg', chartColor: '#D1D5DB' },
      { name: 'LINK', fullName: 'Chainlink', icon: '/icons/chainlink-link-logo.svg', chartColor: '#9CA3AF' }
    ],
    flow: [
      { name: 'FLOW', fullName: 'Flow', icon: '/icons/flow-flow-logo.svg', chartColor: '#6B7280' }
    ],
    hedera: [
      { name: 'HBAR', fullName: 'Hedera Hashgraph', icon: '/icons/hedera-hbar-logo.svg', chartColor: '#9CA3AF' },
      { name: 'USDC', fullName: 'USD Coin', icon: '/icons/usd-coin-usdc-logo.svg', chartColor: '#6B7280' }
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
    const tokenInfo = []
    
    Object.entries(selectedChains).forEach(([chainId, tokens]) => {
      Object.entries(tokens).forEach(([tokenName, allocation]) => {
        const token = tokensByChain[chainId]?.find(t => t.name === tokenName)
        labels.push(`${tokenName} (${chainId})`)
        data.push(allocation)
        colors.push(token?.chartColor || '#4B5563')
        tokenInfo.push({
          icon: token?.icon || '/icons/ethereum-eth-logo.svg',
          name: tokenName,
          chain: chainId
        })
      })
    })
    
    // Add remaining preference if less than 100%
    if (totalAllocation < 100) {
      labels.push('No Preference')
      data.push(100 - totalAllocation)
      colors.push('#374151')
      tokenInfo.push(null) // No icon for "No Preference"
    }
    
    return {
      labels,
      tokenInfo,
      datasets: [{
        data,
        backgroundColor: colors,
        borderColor: '#1F2937',
        borderWidth: 0,
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

    const portfolioData = {
      walletAddress: address,
      ...selectedChains
    }

    // Create URL that leads to transfer page with portfolio data
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
    const portfolioParam = encodeURIComponent(JSON.stringify(portfolioData))
    const transferUrl = `${baseUrl}/transfer?portfolio=${portfolioParam}`

    try {
      const qrCodeDataUrl = await QRCode.toDataURL(transferUrl)
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
    setShowSuccessModal(false)
    setClaimDetails({})
  }

  // Function to trigger success modal with claim details
  const showClaimSuccess = (details = {}) => {
    setClaimDetails({
      amount: details.amount || '',
      token: details.token || '',
      tokenIcon: details.tokenIcon || '',
      chain: details.chain || '',
      chainIcon: details.chainIcon || '',
      txHash: details.txHash || '',
      explorerUrl: details.explorerUrl || ''
    })
    setShowSuccessModal(true)
  }

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        titleColor: 'rgba(255, 255, 255, 0.9)',
        bodyColor: 'rgba(255, 255, 255, 0.7)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
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
    elements: {
      arc: {
        borderWidth: 0
      }
    }
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
          {/* Simple header with just connect button */}
          <div className="flex justify-end pt-8 pr-16">
            <div className="relative bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl shadow-2xl p-1">
              <ConnectButton.Custom>
                {({ account, chain, openAccountModal, openChainModal, openConnectModal, authenticationStatus, mounted }) => {
                  const ready = mounted && authenticationStatus !== 'loading';
                  const connected = ready && account && chain && (!authenticationStatus || authenticationStatus === 'authenticated');

                  return (
                    <div className="relative z-10">
                      {(() => {
                        if (!connected) {
                          return (
                            <button
                              onClick={openConnectModal}
                              type="button"
                              className="px-4 py-2 text-sm font-medium text-white/90 hover:text-white transition-colors rounded-lg hover:bg-white/10"
                            >
                              Connect Wallet
                            </button>
                          );
                        }

                        if (chain.unsupported) {
                          return (
                            <button
                              onClick={openChainModal}
                              type="button"
                              className="px-4 py-2 text-sm font-medium text-red-300 hover:text-red-200 transition-colors rounded-lg hover:bg-red-500/10"
                            >
                              Wrong network
                            </button>
                          );
                        }

                        return (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={openChainModal}
                              type="button"
                              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white/80 hover:text-white transition-colors rounded-lg hover:bg-white/10"
                            >
                              {chain.hasIcon && (
                                <div
                                  className="w-4 h-4 rounded-full overflow-hidden flex items-center justify-center"
                                  style={{ background: chain.iconBackground }}
                                >
                                  {chain.iconUrl && (
                                    <img
                                      alt={chain.name ?? 'Chain icon'}
                                      src={chain.iconUrl}
                                      className="w-4 h-4"
                                    />
                                  )}
                                </div>
                              )}
                              <span className="hidden sm:inline">{chain.name}</span>
                            </button>

                            <button
                              onClick={openAccountModal}
                              type="button"
                              className="px-3 py-2 text-sm font-medium text-white/80 hover:text-white transition-colors rounded-lg hover:bg-white/10"
                            >
                              {account.displayName}
                              {account.displayBalance && (
                                <span className="hidden sm:inline text-white/60 ml-1">
                                  ({account.displayBalance})
                                </span>
                              )}
                            </button>
                          </div>
                        );
                      })()}
                    </div>
                  );
                }}
              </ConnectButton.Custom>
            </div>
          </div>
          <div className="flex items-center justify-center h-[calc(100vh-120px)]">
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
        {/* Simple header with just connect button */}
        <div className="flex justify-end pt-8 pr-16 pb-4">
          <div className="relative bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl shadow-2xl p-1">
            <ConnectButton.Custom>
              {({ account, chain, openAccountModal, openChainModal, openConnectModal, authenticationStatus, mounted }) => {
                const ready = mounted && authenticationStatus !== 'loading';
                const connected = ready && account && chain && (!authenticationStatus || authenticationStatus === 'authenticated');

                return (
                  <div className="relative z-10">
                    {(() => {
                      if (!connected) {
                        return (
                          <button
                            onClick={openConnectModal}
                            type="button"
                            className="px-4 py-2 text-sm font-medium text-white/90 hover:text-white transition-colors rounded-lg hover:bg-white/10"
                          >
                            Connect Wallet
                          </button>
                        );
                      }

                      if (chain.unsupported) {
                        return (
                          <button
                            onClick={openChainModal}
                            type="button"
                            className="px-4 py-2 text-sm font-medium text-red-300 hover:text-red-200 transition-colors rounded-lg hover:bg-red-500/10"
                          >
                            Wrong network
                          </button>
                        );
                      }

                      return (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={openChainModal}
                            type="button"
                            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white/80 hover:text-white transition-colors rounded-lg hover:bg-white/10"
                          >
                            {chain.hasIcon && (
                              <div
                                className="w-4 h-4 rounded-full overflow-hidden flex items-center justify-center"
                                style={{ background: chain.iconBackground }}
                              >
                                {chain.iconUrl && (
                                  <img
                                    alt={chain.name ?? 'Chain icon'}
                                    src={chain.iconUrl}
                                    className="w-4 h-4"
                                  />
                                )}
                              </div>
                            )}
                            <span className="hidden sm:inline">{chain.name}</span>
                          </button>

                          <button
                            onClick={openAccountModal}
                            type="button"
                            className="px-3 py-2 text-sm font-medium text-white/80 hover:text-white transition-colors rounded-lg hover:bg-white/10"
                          >
                            {account.displayName}
                            {account.displayBalance && (
                              <span className="hidden sm:inline text-white/60 ml-1">
                                ({account.displayBalance})
                              </span>
                            )}
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                );
              }}
            </ConnectButton.Custom>
          </div>
        </div>
        <div className="max-w-7xl mx-auto p-3 h-[calc(100vh-120px)]">

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 h-full">
            {/* Left Panel - Payment Chain Selection */}
          <motion.div 
            className="lg:col-span-1 h-full flex flex-col"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div className="flex-1 min-h-0">
              <ChainSelector
                chains={chains}
                currentChain={currentChain}
                setCurrentChain={setCurrentChain}
                selectedChains={selectedChains}
              />
            </div>
            <AnimatePresence>
              {Object.keys(selectedChains).length > 0 && (
                <motion.div
                  className="flex-shrink-0 h-48"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 192 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <PortfolioSummary
                    selectedChains={selectedChains}
                    chains={chains}
                    tokensByChain={tokensByChain}
                    totalAllocation={totalAllocation}
                    removeToken={removeToken}
                  />
                </motion.div>
              )}
            </AnimatePresence>
              </motion.div>
              
          {/* Center Panel - Payment Preferences */}
          <motion.div 
            className="lg:col-span-1 h-full"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <PortfolioChart
              totalAllocation={totalAllocation}
              chartData={chartData}
              chartOptions={chartOptions}
              generateQRCode={generateSimpleQRCode}
              generateDetailedQRCode={generateQRCode}
              resetSelection={resetSelection}
              selectedChains={selectedChains}
            />
            </motion.div>
            
          {/* Right Panel - Available Payment Tokens */}
          <motion.div 
            className="lg:col-span-1 h-full"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <TokenGrid
              chains={chains}
              currentChain={currentChain}
              tokensByChain={tokensByChain}
              selectedChains={selectedChains}
              handleTokenClick={handleTokenClick}
              totalAllocation={totalAllocation}
                    />
                  </motion.div>
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
        showClaimSuccess={showClaimSuccess}
      />
      
      <SimpleQRDisplay
        showSimpleQRModal={showSimpleQRModal}
        setShowSimpleQRModal={setShowSimpleQRModal}
        qrDataUrl={qrDataUrl}
      />
      
      <SuccessClaimModal
        showSuccessModal={showSuccessModal}
        setShowSuccessModal={setShowSuccessModal}
        claimDetails={claimDetails}
        onClose={() => setClaimDetails({})}
      />
    </div>
  )
}

export default MerchantPage
