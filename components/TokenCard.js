import React from 'react';
import { useTokenBalance } from '../hooks/useTokenBalance';
import { formatBalance, createTransferKey } from '../lib/tokenUtils';

const TokenCard = ({ 
  token, 
  chainId, 
  userAddress, 
  transferAmounts, 
  onTransferAmountChange,
  tokenPrice = null 
}) => {
  const { balance, isLoading, error } = useTokenBalance(chainId, token.address, userAddress);
  const balanceFormatted = formatBalance(balance, token.decimals);
  const balanceNum = parseFloat(balanceFormatted);
  
  const transferKey = createTransferKey(token.symbol, chainId);
  const transferAmount = transferAmounts[transferKey] || 0;

  const handleSliderChange = (value) => {
    onTransferAmountChange(token.symbol, chainId, value);
  };

  // Don't render if no balance and not loading
  if (!isLoading && !error && balanceNum === 0) {
    return null;
  }

  return (
    <div className="border border-white/30 rounded-lg p-4 bg-white/10 backdrop-blur-sm">
      {/* Token Header */}
      <div className="flex items-center gap-3 mb-4">
        <img 
          src={token.logo} 
          alt={token.name}
          className="w-8 h-8 rounded-full"
          onError={(e) => {
            e.target.src = `https://via.placeholder.com/32x32?text=${token.symbol}`;
          }}
        />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white">{token.symbol}</span>
            {token.isNative && (
              <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded border border-blue-400/30">
                Native
              </span>
            )}
          </div>
          <p className="text-xs text-white/70">{token.name}</p>
        </div>
      </div>

      {/* Balance Display */}
      <div className="mb-4">
        {isLoading ? (
          <div className="text-sm text-white/60">Loading balance...</div>
        ) : error ? (
          <div className="text-sm text-red-300">Error loading balance</div>
        ) : (
          <div className="text-right">
            <div className="text-lg font-semibold text-white">
              {balanceFormatted} {token.symbol}
            </div>
            {tokenPrice ? (
              <div className="space-y-1">
                <div className="text-sm text-green-300 font-medium">
                  ${tokenPrice.formatted}
                </div>
                <div className="text-xs text-white/60">
                  ≈ ${(balanceNum * tokenPrice.price).toFixed(2)} USD
                </div>
              </div>
            ) : (
              <div className="text-xs text-white/60">Available</div>
            )}
          </div>
        )}
      </div>

      {/* Transfer Controls */}
      {!isLoading && !error && balanceNum > 0 && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-xs font-medium text-white/80">
              Transfer Amount
            </label>
            <span className="text-xs text-white/70">
              {transferAmount.toFixed(4)} {token.symbol}
            </span>
          </div>
          
          <input
            type="range"
            min="0"
            max={balanceNum}
            step={balanceNum / 1000}
            value={transferAmount}
            onChange={(e) => handleSliderChange(parseFloat(e.target.value))}
            className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #60a5fa 0%, #60a5fa ${(transferAmount/balanceNum)*100}%, rgba(255,255,255,0.2) ${(transferAmount/balanceNum)*100}%, rgba(255,255,255,0.2) 100%)`
            }}
          />
          
          <div className="flex justify-between text-xs text-white/60">
            <span>0</span>
            <span>{balanceFormatted}</span>
          </div>

          {/* Quick percentage buttons */}
          <div className="flex gap-1">
            {[25, 50, 75, 100].map(p => (
              <button
                key={p}
                onClick={() => handleSliderChange((balanceNum * p) / 100)}
                className="flex-1 px-2 py-1 text-xs bg-white/10 hover:bg-white/20 text-white rounded transition-colors border border-white/20 hover:border-white/30"
              >
                {p}%
              </button>
            ))}
          </div>

          {/* Selected amount display */}
          {transferAmount > 0 && (
            <div className="mt-2 p-2 bg-blue-500/10 rounded border border-blue-400/30 backdrop-blur-sm">
              <p className="text-xs text-blue-200">
                Selected: <span className="font-semibold text-white">{transferAmount.toFixed(4)} {token.symbol}</span>
                {tokenPrice && (
                  <span className="text-blue-300 ml-1">
                    (≈ ${(transferAmount * tokenPrice.price).toFixed(2)} USD)
                  </span>
                )}
                <span className="text-blue-300 ml-1">
                  ({((transferAmount/balanceNum)*100).toFixed(1)}% of balance)
                </span>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TokenCard;
