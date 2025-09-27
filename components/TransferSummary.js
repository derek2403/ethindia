import React from 'react';
import Image from "next/image";
import { CHAIN_CONFIGS } from '../lib/chainConfigs';
import { parseTransferKey } from '../lib/tokenUtils';

const TransferSummary = ({ transferAmounts, tokenPrices = {} }) => {
  return (
    <div className="mt-6 pt-6 border-t border-white/10">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {CHAIN_CONFIGS.map(chain => {
          const chainTransfers = Object.entries(transferAmounts).filter(([key, amount]) => {
            const { chainId } = parseTransferKey(key);
            return chainId === chain.chainId && amount > 0;
          });

          return (
            <div key={chain.chainId} className="bg-white/10 p-4 rounded-lg border border-white/30 backdrop-blur-sm">
              <h4 className="font-medium text-white mb-2 flex items-center gap-2">
                <Image 
                  src={chain.icon} 
                  alt={chain.name}
                  width={20} 
                  height={20} 
                  className="w-5 h-5"
                />
                {chain.name}
              </h4>
              {chainTransfers.length > 0 ? (
                <div className="space-y-1">
                  {chainTransfers.map(([key, amount]) => {
                    const { symbol } = parseTransferKey(key);
                    const tokenPrice = tokenPrices[symbol]?.price || 0;
                    const usdValue = amount * tokenPrice;
                    return (
                      <div key={key} className="text-sm">
                        <div className="flex justify-between">
                          <span className="text-white/70">{symbol}:</span>
                          <span className="font-medium text-white">{amount.toFixed(4)}</span>
                        </div>
                        {tokenPrice > 0 && usdValue > 0 && (
                          <div className="flex justify-end">
                            <span className="text-xs text-white/60">${Number(usdValue).toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {/* Chain Total */}
                  {(() => {
                    const chainTotal = chainTransfers.reduce((sum, [key, amount]) => {
                      const { symbol } = parseTransferKey(key);
                      const tokenPrice = tokenPrices[symbol]?.price || 0;
                      return sum + (amount * tokenPrice);
                    }, 0);
                    return chainTotal > 0 ? (
                      <div className="pt-2 mt-2 border-t border-white/20">
                        <div className="flex justify-between text-sm font-medium">
                          <span className="text-white">Total:</span>
                          <span className="text-white">${Number(chainTotal).toFixed(2)}</span>
                        </div>
                      </div>
                    ) : null;
                  })()}
                </div>
              ) : (
                <p className="text-sm text-white/60">No transfers selected</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TransferSummary;
