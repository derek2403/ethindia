import React from 'react'
import { motion } from 'framer-motion'
import { X, Download } from 'lucide-react'

const SimpleQRDisplay = ({ 
  showSimpleQRModal,
  setShowSimpleQRModal,
  qrDataUrl
}) => {
  if (!showSimpleQRModal) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-6">
      <motion.div 
        className="glass-card max-w-md w-full p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        <div className="text-center space-y-6">
          <motion.div 
            className="space-y-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            <h3 className="text-xl font-bold text-white/90">Payment QR Code</h3>
            <p className="text-sm text-white/70">Share this QR code for payments</p>
          </motion.div>
      
          {qrDataUrl && (
            <motion.div 
              className="flex flex-col items-center space-y-4"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              {/* QR Code with enhanced styling */}
              <motion.div 
                className="relative p-4 bg-white/5 border border-white/20 rounded-xl"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.3 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl"></div>
                <div className="relative">
                  <img 
                    src={qrDataUrl} 
                    alt="Payment QR Code" 
                    className="rounded-lg shadow-lg" 
                    style={{ width: '400px', height: '400px' }}
                  />
                </div>
              </motion.div>
          
              {/* Action Buttons */}
              <motion.div 
                className="flex space-x-3 w-full"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.4 }}
              >
                <motion.button
                  onClick={() => setShowSimpleQRModal(false)}
                  className="flex-1 px-4 py-2.5 bg-white/10 text-white/80 rounded-lg hover:bg-white/20 transition-all duration-200 font-medium border border-white/20 hover:border-white/40 text-sm flex items-center justify-center space-x-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <X className="w-4 h-4" />
                  <span>Close</span>
                </motion.button>
                <motion.button
                  onClick={() => {
                    const link = document.createElement('a')
                    link.download = `payment-qr-${Date.now()}.png`
                    link.href = qrDataUrl
                    link.click()
                  }}
                  className="flex-1 px-4 py-2.5 bg-white/20 border border-white/30 text-white rounded-lg hover:bg-white/30 transition-all duration-200 font-medium backdrop-blur-sm text-sm flex items-center justify-center space-x-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

export default SimpleQRDisplay
