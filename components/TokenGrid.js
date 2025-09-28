import React from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Coins, CheckCircle2, Circle } from 'lucide-react'

const TokenGrid = ({ 
  chains, 
  currentChain, 
  tokensByChain, 
  selectedChains, 
  handleTokenClick, 
  totalAllocation 
}) => {
  return (
    <div className="glass-card p-4 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-6 h-6 rounded-full bg-white/10 border border-white/10 flex items-center justify-center backdrop-blur-sm">
          <Coins className="w-3 h-3 text-white/70" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white/90">Available Payment Tokens</h3>
          <p className="text-xs text-white/60">{chains.find(c => c.id === currentChain)?.name}</p>
        </div>
      </div>
      
      <div className="space-y-2 flex-1 overflow-y-auto mb-4">
        <AnimatePresence mode="wait">
          <motion.div 
            key={currentChain}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-2"
          >
            {tokensByChain[currentChain]?.map((token, index) => {
            const isSelected = selectedChains[currentChain]?.[token.name]
            const isPreferencesFull = totalAllocation >= 100
            const isDisabled = isSelected || isPreferencesFull
            
            return (
              <motion.button
                key={token.name}
                onClick={() => !isDisabled && handleTokenClick(token)}
                disabled={isDisabled}
                className={`w-full p-3 rounded-lg border transition-all duration-200 flex items-center gap-3 text-left backdrop-blur-sm ${
                  isSelected
                    ? 'border-white/20 bg-white/10 cursor-not-allowed shadow-sm shadow-white/10'
                    : isPreferencesFull
                    ? 'border-white/10 bg-white/5 cursor-not-allowed opacity-50 blur-[1px]'
                    : 'border-white/10 hover:border-white/20 hover:bg-white/10 cursor-pointer bg-white/5'
                }`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                whileTap={!isDisabled ? { scale: 0.99 } : {}}
              >
              <div className="relative w-10 h-10 flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center p-2 backdrop-blur-sm">
                  <Image
                    src={token.icon}
                    alt={token.name}
                    width={20}
                    height={20}
                    className="w-6 h-6"
                  />
                </div>
                <AnimatePresence>
                  {isSelected && (
                    <motion.div 
                      className="absolute -top-1 -right-1 w-4 h-4 bg-white/80 rounded-full flex items-center justify-center"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0, rotate: 180 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    >
                      <CheckCircle2 className="w-2.5 h-2.5 text-black" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-base font-bold text-white/90">{token.name}</div>
                <div className="text-xs text-white/60 truncate">{token.fullName}</div>
                <AnimatePresence>
                  {isSelected && (
                    <motion.div 
                      className="text-xs text-white/70 font-medium mt-0.5"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {selectedChains[currentChain][token.name]}% preference
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              {!isSelected && (
                <Circle className="w-5 h-5 text-white/30 flex-shrink-0" />
              )}
            </motion.button>
          )
            })}
          </motion.div>
        </AnimatePresence>
      </div>
      
      {/* Progress indicator */}
      <div className="border-t border-white/15 pt-4 mt-auto">
        <div className="flex justify-between text-sm text-white/70 mb-3">
          <span className="font-medium">Payment Progress</span>
          <span className="font-mono">{totalAllocation.toFixed(1)}% / 100%</span>
        </div>
        <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 ${
              totalAllocation <= 100 ? 'bg-white/60' : 'bg-white/40'
            }`}
            style={{ width: `${Math.min(totalAllocation, 100)}%` }}
          ></div>
        </div>
        <div className="text-xs text-white/50 mt-2 text-center">
          {totalAllocation === 0 && "Start by selecting payment tokens above"}
          {totalAllocation > 0 && totalAllocation < 100 && `${(100 - totalAllocation).toFixed(1)}% remaining`}
          {totalAllocation === 100 && "Payment preferences set! Ready to claim"}
          {totalAllocation > 100 && "Over-allocated! Please reduce some percentages"}
        </div>
      </div>
    </div>
  )
}

export default TokenGrid
