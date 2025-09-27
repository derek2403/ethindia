import React from 'react'
import Image from 'next/image'

const QRDisplay = ({ 
  showQRModal,
  setShowQRModal,
  qrDataUrl, 
  selectedChains, 
  chains, 
  totalAllocation, 
  address, 
  resetSelection 
}) => {
  if (!showQRModal) return null

  const handleCreateNew = () => {
    setShowQRModal(false)
    resetSelection()
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="glass-card max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="text-center space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
            🎉 Your Portfolio QR Code
          </h2>
          <p className="text-white/70">Scan this QR code to share your portfolio allocation</p>
        </div>
      
        {qrDataUrl && (
          <div className="flex flex-col items-center space-y-4">
            {/* QR Code with enhanced styling */}
            <div className="relative p-4 bg-white/5 border border-white/20 rounded-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl"></div>
              <div className="relative">
                <img 
                  src={qrDataUrl} 
                  alt="Portfolio QR Code" 
                  className="rounded-lg shadow-lg" 
                  style={{ width: '250px', height: '250px' }}
                />
              </div>
            </div>
          
            {/* Portfolio Summary */}
            <div className="bg-white/5 border border-white/20 rounded-lg p-4 max-w-2xl w-full">
              <h3 className="font-semibold mb-3 text-base text-white/90">📊 Portfolio Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                {Object.entries(selectedChains).map(([chain, tokens]) => (
                  <div key={chain} className="bg-white/5 border border-white/20 p-3 rounded-lg backdrop-blur-sm">
                    <h4 className="font-medium text-blue-400 mb-2 capitalize text-sm">
                      {chains.find(c => c.id === chain)?.name || chain}
                    </h4>
                    <div className="space-y-1">
                      {Object.entries(tokens).map(([token, allocation]) => (
                        <div key={token} className="flex justify-between text-xs">
                          <span className="font-medium text-white/90">{token}</span>
                          <span className="text-white/70">{allocation}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-white/20">
                <span className="font-semibold text-white/90 text-sm">Total Allocation:</span>
                <span className={`font-bold text-base ${
                  totalAllocation === 100 ? 'text-green-400' : 'text-blue-400'
                }`}>
                  {totalAllocation.toFixed(1)}%
                </span>
              </div>
            </div>
          
            {/* JSON Data - Collapsible */}
            <details className="w-full max-w-2xl">
              <summary className="cursor-pointer bg-white/10 hover:bg-white/20 border border-white/20 p-2 rounded-lg font-medium text-white/80 transition-colors backdrop-blur-sm text-sm">
                🔧 View Raw JSON Data
              </summary>
              <div className="mt-2 bg-black/50 border border-white/20 text-green-400 p-3 rounded-lg font-mono text-xs overflow-auto backdrop-blur-sm max-h-32">
                <pre>
                  {JSON.stringify({
                    walletAddress: address,
                    ...selectedChains
                  }, null, 2)}
                </pre>
              </div>
            </details>
          
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              <button
                onClick={() => setShowQRModal(false)}
                className="px-6 py-2.5 bg-white/10 text-white/80 rounded-lg hover:bg-white/20 transition-all duration-200 font-medium border border-white/20 hover:border-white/40 text-sm"
              >
                Close
              </button>
              <button
                onClick={handleCreateNew}
                className="px-6 py-2.5 bg-white/20 border border-white/30 text-white rounded-lg hover:bg-white/30 transition-all duration-200 font-medium backdrop-blur-sm text-sm flex items-center justify-center space-x-2"
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
                className="px-6 py-2.5 bg-white/20 border border-white/30 text-white rounded-lg hover:bg-white/30 transition-all duration-200 font-medium backdrop-blur-sm text-sm flex items-center justify-center space-x-2"
              >
                <span>💾</span>
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
