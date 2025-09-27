import React from 'react'
import Image from 'next/image'
import { TrendingUp, Layers3, X } from 'lucide-react'

const PortfolioSummary = ({ 
  selectedChains, 
  chains, 
  tokensByChain, 
  totalAllocation, 
  removeToken 
}) => {
  if (Object.keys(selectedChains).length === 0) {
    return null
  }

  return (
    <div className="mt-auto pt-2">
      <div className="bg-white/5 border border-white/15 rounded-lg p-3 backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-4 h-4 rounded-full bg-white/10 border border-white/10 flex items-center justify-center backdrop-blur-sm">
            <TrendingUp className="w-2.5 h-2.5 text-white/70" />
          </div>
          <h3 className="text-sm font-bold text-white/90">Payment Summary</h3>
        </div>
        
        <div className="space-y-1 max-h-20 overflow-y-auto">
          {Object.entries(selectedChains).map(([chainId, tokens]) => (
            <div key={chainId} className="space-y-1">
              <div className="text-xs font-medium text-white/60 flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-full bg-white/10 flex items-center justify-center p-0.5">
                  <Image
                    src={chains.find(c => c.id === chainId)?.icon || '/icons/ethereum-eth-logo.svg'}
                    alt={chains.find(c => c.id === chainId)?.name || chainId}
                    width={10}
                    height={10}
                    className="w-1.5 h-1.5 opacity-60"
                  />
                </div>
                {chains.find(c => c.id === chainId)?.name}
              </div>
              {Object.entries(tokens).map(([tokenName, allocation]) => {
                const token = tokensByChain[chainId]?.find(t => t.name === tokenName)
                return (
                  <div key={tokenName} className="flex justify-between items-center bg-white/5 border border-white/10 p-1.5 rounded backdrop-blur-sm">
                    <div className="flex items-center gap-1">
                      {token && (
                        <div className="w-3 h-3 rounded-full bg-white/5 border border-white/10 flex items-center justify-center p-0.5">
                          <Image
                            src={token.icon}
                            alt={token.name}
                            width={8}
                            height={8}
                            className="w-2 h-2"
                          />
                        </div>
                      )}
                      <span className="text-xs font-medium text-white/90">{tokenName}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="text-xs text-white/80 font-medium">{allocation}%</span>
                      <button
                        onClick={() => removeToken(chainId, tokenName)}
                        className="text-red-400 hover:text-red-300 w-3 h-3 rounded-full hover:bg-red-400/10 flex items-center justify-center"
                      >
                        <X className="w-2 h-2" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
        
        <div className="mt-2 pt-2 border-t border-white/15">
          <div className="flex justify-between items-center">
            <span className="font-bold text-white/90 text-xs">Total:</span>
            <span className={`font-bold text-sm ${
              totalAllocation === 100 ? 'text-white/90' : 
              totalAllocation > 100 ? 'text-white/70' : 'text-white/80'
            }`}>
              {totalAllocation.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PortfolioSummary
