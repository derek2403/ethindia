import React from 'react'
import Image from 'next/image'
import { Link } from 'lucide-react'

const ChainSelector = ({ 
  chains, 
  currentChain, 
  setCurrentChain, 
  selectedChains 
}) => {
  return (
    <div className="glass-card p-4 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-6 h-6 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
          <Link className="w-3 h-3 text-white/70" />
        </div>
        <h3 className="text-lg font-bold text-white/90">Select Blockchain</h3>
      </div>
      
      <div className="space-y-2 flex-1">
        {chains.map(chain => (
          <button
            key={chain.id}
            onClick={() => setCurrentChain(chain.id)}
            className={`w-full p-3 rounded-lg text-left transition-all duration-200 flex items-center gap-3 ${
              currentChain === chain.id
                ? 'bg-white/10 border-white/40 border-2 text-white shadow-lg'
                : 'bg-white/5 hover:bg-white/10 text-white/80 border border-white/20 backdrop-blur-sm hover:border-white/40'
            }`}
          >
            <div className="relative w-6 h-6 flex-shrink-0 rounded-full bg-white/10 flex items-center justify-center p-1">
              <Image
                src={chain.icon}
                alt={chain.name}
                width={16}
                height={16}
                className="w-4 h-4"
              />
            </div>
            <div className="flex-1">
              <div className="font-medium">{chain.name}</div>
              {selectedChains[chain.id] && (
                <div className="text-xs text-white/60">
                  {Object.keys(selectedChains[chain.id]).length} token(s) selected
                </div>
              )}
            </div>
            {currentChain === chain.id && (
              <div className="w-3 h-3 rounded-full bg-white/60"></div>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

export default ChainSelector
