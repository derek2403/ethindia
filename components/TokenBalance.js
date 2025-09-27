import React from 'react';
import { useAccount } from 'wagmi';
import { BorderBeam } from "@/components/ui/border-beam";
import { CHAIN_CONFIGS } from '../lib/chainConfigs';
import { createTransferKey } from '../lib/tokenUtils';
import ChainSection from './ChainSection';
import TransferSummary from './TransferSummary';

export default function TokenBalance({ transferAmounts = {}, setTransferAmounts }) {
  const { address, isConnected } = useAccount();

  const handleTransferAmountChange = (tokenSymbol, chainId, value) => {
    const key = createTransferKey(tokenSymbol, chainId);
    setTransferAmounts(prev => ({ ...prev, [key]: value }));
  };

  if (!isConnected) {
    return (
      <div className="glass-card flex flex-col justify-start p-6 relative max-w-4xl mx-auto w-full" style={{ width: '100%', maxWidth: '800px' }}>
        <BorderBeam 
          size={120}
          duration={4}
          colorFrom="#ffffff"
          colorTo="#ffffff80"
          delay={0}
        />
        <p className="text-white/80 text-center">
          Please connect your wallet to view multi-chain token balances
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card flex flex-col justify-start p-6 relative max-w-4xl mx-auto w-full" style={{ width: '100%', maxWidth: '800px' }}>
      <BorderBeam 
        size={120}
        duration={4}
        colorFrom="#ffffff"
        colorTo="#ffffff80"
        delay={0}
      />
      <h2 className="text-2xl font-bold mb-6 text-white">Multi-Chain Token Balances</h2>
      
      {/* Multi-chain sections */}
      <div className="space-y-6">
        {CHAIN_CONFIGS.map(chain => (
          <div key={chain.chainId} className="bg-white/5 rounded-lg p-6 border border-white/10">
            {/* Chain Header */}
            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl">{chain.icon}</span>
              <div>
                <h3 className="text-xl font-semibold text-white">{chain.name}</h3>
                <p className="text-sm text-white/60">Chain ID: {chain.chainId}</p>
              </div>
            </div>

            {/* Tokens on this chain - simplified version */}
            <div className="space-y-4">
              {[
                { ...chain.nativeToken, address: null, isNative: true },
                ...chain.erc20Tokens.map(token => ({ ...token, isNative: false }))
              ].map(token => {
                const transferKey = createTransferKey(token.symbol, chain.chainId);
                const transferAmount = transferAmounts[transferKey] || 0;
                
                return (
                  <div key={`${token.symbol}_${chain.chainId}`} className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-white">
                            {token.symbol.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <h4 className="text-white font-medium">{token.symbol}</h4>
                          <p className="text-white/60 text-sm">{token.name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-medium">
                          {transferAmount.toFixed(4)} {token.symbol}
                        </p>
                        <p className="text-white/60 text-sm">Selected</p>
                      </div>
                    </div>
                    
                    {/* Simplified slider for demo - in real implementation would use proper balance checking */}
                    <div className="space-y-3">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="0.1"
                        value={transferAmount}
                        onChange={(e) => handleTransferAmountChange(token.symbol, chain.chainId, parseFloat(e.target.value))}
                        className="w-full accent-white/70"
                      />
                      <div className="flex gap-2">
                        {[25, 50, 75, 100].map(p => (
                          <button
                            key={p}
                            onClick={() => handleTransferAmountChange(token.symbol, chain.chainId, p)}
                            className="px-3 py-1 text-xs bg-white/10 text-white/80 hover:bg-white/20 rounded transition-colors"
                          >
                            {p}%
                          </button>
                        ))}
                      </div>
                      {transferAmount > 0 && (
                        <div className="text-sm text-white/70">
                          Selected: {transferAmount.toFixed(4)} {token.symbol}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Transfer Summary - styled for dark theme */}
      <div className="mt-8 p-6 bg-white/5 rounded-lg border border-white/10">
        <h3 className="font-semibold mb-4 text-white text-lg">
          🌐 Multi-Chain Transfer Summary
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {CHAIN_CONFIGS.map(chain => {
            const chainTransfers = Object.entries(transferAmounts).filter(([key, amount]) => {
              const [, chainIdStr] = key.split('_');
              return parseInt(chainIdStr) === chain.chainId && amount > 0;
            });

            return (
              <div key={chain.chainId} className="bg-white/5 p-4 rounded-lg border border-white/10">
                <h4 className="font-medium text-white mb-2 flex items-center gap-2">
                  <span>{chain.icon}</span>
                  {chain.name}
                </h4>
                {chainTransfers.length > 0 ? (
                  <div className="space-y-1">
                    {chainTransfers.map(([key, amount]) => {
                      const [symbol] = key.split('_');
                      return (
                        <div key={key} className="flex justify-between text-sm">
                          <span className="text-white/70">{symbol}:</span>
                          <span className="font-medium text-white">{amount.toFixed(4)}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-white/50">No transfers selected</p>
                )}
              </div>
            );
          })}
        </div>
        
        {Object.values(transferAmounts).every(amount => !amount || amount === 0) && (
          <div className="text-center mt-4">
            <p className="text-white/70 text-sm">
              No tokens selected for transfer across any chain
            </p>
            <p className="text-xs text-white/50 mt-1">
              Use the sliders above to select transfer amounts for each token on each chain.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}