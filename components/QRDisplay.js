import React from 'react'
import Image from 'next/image'
import { BarChart3, X, Download } from 'lucide-react'

// Token Icon with Chain overlay - optimized for QR modal
const TokenWithChain = ({ tokenSrc, chainSrc, tokenAlt, chainAlt }) => (
  <div className="relative w-8 h-8">
    <Image 
      src={tokenSrc} 
      alt={tokenAlt} 
      width={32} 
      height={32} 
      className="w-8 h-8 rounded-full"
    />
    {chainSrc && (
      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-black/80 rounded-full p-0.5 border border-white/20 shadow-lg">
        <Image 
          src={chainSrc} 
          alt={chainAlt} 
          width={12} 
          height={12} 
          className="w-3 h-3 rounded-full"
        />
      </div>
    )}
  </div>
)

const QRDisplay = ({ 
  showQRModal,
  setShowQRModal,
  qrDataUrl, 
  selectedChains, 
  chains, 
  tokensByChain,
  totalAllocation, 
  address, 
  resetSelection 
}) => {
  if (!showQRModal) return null


  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-6">
      <div className="glass-card max-w-4xl w-full max-h-[85vh] overflow-y-auto p-6">
        <div className="text-center space-y-6">
        <div className="space-y-2">
          <p className="text-lg text-white/80 font-medium">Scan this QR code to share your portfolio allocation</p>
        </div>
      
        {qrDataUrl && (
          <div className="flex flex-col items-center space-y-5">
            {/* QR Code with enhanced styling */}
            <div className="relative p-4 bg-white/5 border border-white/20 rounded-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl"></div>
              <div className="relative">
                <img 
                  src={qrDataUrl} 
                  alt="Portfolio QR Code" 
                  className="rounded-lg shadow-lg" 
                  style={{ width: '280px', height: '280px' }}
                />
              </div>
            </div>
          
            {/* Portfolio Summary */}
            <div className="bg-white/5 border border-white/20 rounded-lg p-4 max-w-2xl w-full">
              <div className="flex items-center space-x-2 mb-3">
                <div className="p-1.5 bg-white/10 border border-white/20 rounded-md">
                  <BarChart3 className="w-4 h-4 text-white/70" />
                </div>
                <h3 className="font-semibold text-base text-white/90">Portfolio Summary</h3>
              </div>
              <div className="space-y-3 mb-3">
                {Object.entries(selectedChains).map(([chain, tokens]) => {
                  const chainInfo = chains.find(c => c.id === chain)
                  const tokenCount = Object.keys(tokens).length
                  
                  return (
                    <div 
                      key={chain} 
                      className="bg-white/5 border border-white/20 p-2.5 rounded-lg backdrop-blur-sm transition-all duration-200 inline-block"
                    >
                      <div className="flex gap-2.5">
                        {Object.entries(tokens).map(([token, allocation]) => {
                          const tokenInfo = tokensByChain[chain]?.find(t => t.name === token)
                          return (
                            <div key={token} className="relative flex flex-col items-center">
                              <TokenWithChain 
                                tokenSrc={tokenInfo?.icon || '/icons/ethereum-eth-logo.svg'}
                                chainSrc={chainInfo?.icon || '/icons/ethereum-eth-logo.svg'}
                                tokenAlt={`${token} ${allocation}%`}
                                chainAlt={chainInfo?.name || chain}
                              />
                              <div className="mt-1 bg-black/80 rounded-full px-1.5 py-0.5 border border-white/20">
                                <span className="text-white text-[10px] font-medium">{allocation}%</span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-white/20">
                <span className="font-semibold text-white/90 text-sm">Total Allocation:</span>
                <span className={`font-bold text-lg ${
                  totalAllocation === 100 ? 'text-white/90' : 'text-white/70'
                }`}>
                  {totalAllocation.toFixed(1)}%
                </span>
              </div>
            </div>
          
          
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              <button
                onClick={() => setShowQRModal(false)}
                className="px-6 py-2.5 bg-white/10 text-white/80 rounded-lg hover:bg-white/20 transition-all duration-200 font-medium border border-white/20 hover:border-white/40 text-sm flex items-center justify-center space-x-2"
              >
                <X className="w-4 h-4" />
                <span>Close</span>
              </button>
              <button
                onClick={() => {
                  const link = document.createElement('a')
                  link.download = `portfolio-qr-${Date.now()}.png`
                  link.href = qrDataUrl
                  link.click()
                }}
                className="px-6 py-2.5 bg-white/20 border border-white/30 text-white rounded-lg hover:bg-white/30 transition-all duration-200 font-medium backdrop-blur-sm text-sm flex items-center justify-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Download QR</span>
              </button>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  )
}

export default QRDisplay
