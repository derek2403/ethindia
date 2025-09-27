import React from 'react'
import { X, Download } from 'lucide-react'

const SimpleQRDisplay = ({ 
  showSimpleQRModal,
  setShowSimpleQRModal,
  qrDataUrl
}) => {
  if (!showSimpleQRModal) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-6">
      <div className="glass-card max-w-md w-full p-6">
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-white/90">Payment QR Code</h3>
            <p className="text-sm text-white/70">Share this QR code for payments</p>
          </div>
      
          {qrDataUrl && (
            <div className="flex flex-col items-center space-y-4">
              {/* QR Code with enhanced styling */}
              <div className="relative p-4 bg-white/5 border border-white/20 rounded-xl">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl"></div>
                <div className="relative">
                  <img 
                    src={qrDataUrl} 
                    alt="Payment QR Code" 
                    className="rounded-lg shadow-lg" 
                    style={{ width: '400px', height: '400px' }}
                  />
                </div>
              </div>
          
              {/* Action Buttons */}
              <div className="flex space-x-3 w-full">
                <button
                  onClick={() => setShowSimpleQRModal(false)}
                  className="flex-1 px-4 py-2.5 bg-white/10 text-white/80 rounded-lg hover:bg-white/20 transition-all duration-200 font-medium border border-white/20 hover:border-white/40 text-sm flex items-center justify-center space-x-2"
                >
                  <X className="w-4 h-4" />
                  <span>Close</span>
                </button>
                <button
                  onClick={() => {
                    const link = document.createElement('a')
                    link.download = `payment-qr-${Date.now()}.png`
                    link.href = qrDataUrl
                    link.click()
                  }}
                  className="flex-1 px-4 py-2.5 bg-white/20 border border-white/30 text-white rounded-lg hover:bg-white/30 transition-all duration-200 font-medium backdrop-blur-sm text-sm flex items-center justify-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SimpleQRDisplay
