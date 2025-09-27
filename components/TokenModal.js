import React from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Plus, X } from 'lucide-react'

const TokenModal = ({
  showTokenModal,
  setShowTokenModal,
  selectedToken,
  chains,
  currentChain,
  tokensByChain,
  tokenAllocation,
  setTokenAllocation,
  totalAllocation,
  addTokenToPortfolio
}) => {
  if (!showTokenModal) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <motion.div 
        className="glass-card max-w-sm w-full p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.2 }}
      >
        <motion.div 
          className="text-center mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.05, duration: 0.3 }}
        >
          <motion.div 
            className="relative w-16 h-16 mx-auto mb-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            {/* Token Icon */}
            <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center p-3">
              <Image
                src={tokensByChain[currentChain]?.find(t => t.name === selectedToken)?.icon || '/icons/ethereum-eth-logo.svg'}
                alt={selectedToken}
                width={40}
                height={40}
                className="w-10 h-10"
              />
            </div>
            {/* Mini Chain Icon Overlay */}
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-black/80 rounded-full p-1 border border-white/20 shadow-lg">
              <Image
                src={chains.find(c => c.id === currentChain)?.icon || '/icons/ethereum-eth-logo.svg'}
                alt={chains.find(c => c.id === currentChain)?.name || currentChain}
                width={16}
                height={16}
                className="w-4 h-4"
              />
            </div>
          </motion.div>
          <h3 className="text-xl font-bold text-white/90 mb-2">
            Set Payment Preference
          </h3>
          <p className="text-sm text-white/70">
            Set preference percentage for {selectedToken} on {chains.find(c => c.id === currentChain)?.name}
          </p>
        </motion.div>

        <div className="space-y-6">
          {/* Current Allocation Display */}
          <motion.div 
            className="text-center bg-white/5 border border-white/20 rounded-lg p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.05, duration: 0.2 }}
          >
            <div className="text-5xl font-bold text-white/90 mb-2">
              {tokenAllocation}%
            </div>
            <div className="text-xs text-white/60">
              Remaining: <span className="font-medium text-white/80">{(100 - totalAllocation).toFixed(1)}%</span>
            </div>
          </motion.div>

          {/* Allocation Slider */}
          <div className="space-y-4">
            <div className="space-y-3">
              <label className="text-xs font-medium text-white/80">Preference Percentage</label>
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
                    background: `linear-gradient(to right, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.4) ${(tokenAllocation / Math.min(100 - totalAllocation, 100)) * 100}%, rgba(255, 255, 255, 0.1) ${(tokenAllocation / Math.min(100 - totalAllocation, 100)) * 100}%, rgba(255, 255, 255, 0.1) 100%)`
                  }}
                />
                <div className="flex justify-between text-xs text-white/50 mt-1">
                  <span>0.5%</span>
                  <span>{Math.min(100 - totalAllocation, 100)}%</span>
                </div>
              </div>
            </div>
            
            {/* Quick percentage buttons */}
            <div>
              <label className="text-xs font-medium text-white/80 block mb-2">Quick Select</label>
              <div className="grid grid-cols-4 gap-1.5">
                {[5, 10, 25, 50].filter(val => val <= (100 - totalAllocation)).map(percentage => (
                  <button
                    key={percentage}
                    onClick={() => setTokenAllocation(percentage)}
                    className={`px-2 py-1.5 text-xs rounded-md transition-all duration-200 border font-medium ${
                      tokenAllocation === percentage
                        ? 'bg-white/20 border-white/40 text-white'
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
          <motion.div 
            className="flex space-x-3 pt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.2 }}
          >
            <motion.button
              onClick={() => setShowTokenModal(false)}
              className="flex-1 px-4 py-2.5 bg-white/10 text-white/80 rounded-lg hover:bg-white/20 transition-all duration-200 font-medium border border-white/20 hover:border-white/40 text-sm"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Cancel
            </motion.button>
            <motion.button
              onClick={addTokenToPortfolio}
              disabled={tokenAllocation <= 0 || (totalAllocation + tokenAllocation > 100)}
              className="flex-1 px-4 py-2.5 bg-white/20 border border-white/30 text-white rounded-lg hover:bg-white/30 disabled:bg-white/5 disabled:border-white/10 disabled:text-white/40 disabled:cursor-not-allowed transition-all duration-200 font-medium backdrop-blur-sm text-sm"
              whileHover={!(tokenAllocation <= 0 || (totalAllocation + tokenAllocation > 100)) ? { scale: 1.02 } : {}}
              whileTap={!(tokenAllocation <= 0 || (totalAllocation + tokenAllocation > 100)) ? { scale: 0.98 } : {}}
            >
              Set Preference
            </motion.button>
          </motion.div>

          {/* Warning */}
          {totalAllocation + tokenAllocation > 100 && (
            <div className="bg-white/5 border border-white/20 rounded-md p-2.5 backdrop-blur-sm">
              <div className="flex items-center space-x-1.5">
                <div className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                  <X className="w-2.5 h-2.5 text-white/70" />
                </div>
                <p className="text-xs text-white/70">
                  This preference would exceed 100%. Please reduce the percentage.
                </p>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

export default TokenModal
