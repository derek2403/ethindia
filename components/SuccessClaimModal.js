import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'

const SuccessClaimModal = ({ 
  showSuccessModal, 
  setShowSuccessModal, 
  claimDetails = {},
  onClose 
}) => {
  const handleClose = () => {
    setShowSuccessModal(false)
    if (onClose) onClose()
  }

  return (
    <AnimatePresence>
      {showSuccessModal && (
        <motion.div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <motion.div
            className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-2xl max-w-md w-full p-6 text-white"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Success Icon */}
            <div className="flex justify-center mb-6">
              <motion.div
                className="w-20 h-20 rounded-full bg-green-500/20 border-2 border-green-400/30 flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, duration: 0.5, type: "spring", bounce: 0.4 }}
              >
                <motion.svg
                  className="w-10 h-10 text-green-400"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <motion.path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </motion.svg>
              </motion.div>
            </div>

            {/* Title and Description */}
            <motion.div 
              className="text-center mb-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              <h2 className="text-2xl font-bold mb-2 text-white/90">
                Payment Claim Successful!
              </h2>
              <p className="text-white/70 text-sm">
                Your funds have been successfully claimed and transferred to your wallet.
              </p>
            </motion.div>

            {/* Claim Details */}
            {(claimDetails.amount || claimDetails.token || claimDetails.chain) && (
              <motion.div
                className="bg-white/5 rounded-xl border border-white/10 p-4 mb-6"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.4 }}
              >
                <h3 className="text-sm font-semibold text-white/80 mb-3">Claim Details</h3>
                <div className="space-y-2">
                  {claimDetails.amount && (
                    <div className="flex justify-between items-center">
                      <span className="text-white/60 text-sm">Amount:</span>
                      <div className="flex items-center gap-2">
                        {claimDetails.tokenIcon && (
                          <Image
                            src={claimDetails.tokenIcon}
                            alt={claimDetails.token || 'Token'}
                            width={16}
                            height={16}
                            className="rounded-full"
                          />
                        )}
                        <span className="text-white/90 text-sm font-medium">
                          {claimDetails.amount} {claimDetails.token}
                        </span>
                      </div>
                    </div>
                  )}
                  {claimDetails.chain && (
                    <div className="flex justify-between items-center">
                      <span className="text-white/60 text-sm">Network:</span>
                      <div className="flex items-center gap-2">
                        {claimDetails.chainIcon && (
                          <Image
                            src={claimDetails.chainIcon}
                            alt={claimDetails.chain}
                            width={16}
                            height={16}
                            className="rounded-full"
                          />
                        )}
                        <span className="text-white/90 text-sm font-medium capitalize">
                          {claimDetails.chain}
                        </span>
                      </div>
                    </div>
                  )}
                  {claimDetails.txHash && (
                    <div className="flex justify-between items-center">
                      <span className="text-white/60 text-sm">Transaction:</span>
                      <span className="text-white/90 text-sm font-mono">
                        {claimDetails.txHash.slice(0, 8)}...{claimDetails.txHash.slice(-6)}
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Action Buttons */}
            <motion.div
              className="flex gap-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.4 }}
            >
              {claimDetails.txHash && (
                <button
                  onClick={() => {
                    // Open block explorer - you can customize this URL based on the chain
                    const explorerUrl = claimDetails.explorerUrl || `https://etherscan.io/tx/${claimDetails.txHash}`
                    window.open(explorerUrl, '_blank')
                  }}
                  className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/20 hover:border-white/30 rounded-xl text-white/80 hover:text-white transition-all duration-200 text-sm font-medium"
                >
                  View Transaction
                </button>
              )}
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-3 bg-green-500/20 hover:bg-green-500/30 border border-green-400/30 hover:border-green-400/50 rounded-xl text-green-300 hover:text-green-200 transition-all duration-200 text-sm font-medium"
              >
                Continue
              </button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default SuccessClaimModal
