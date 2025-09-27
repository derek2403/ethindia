import React from 'react';
import { useTokenBalance } from '../hooks/useTokenBalance';
import { formatBalance, createTransferKey } from '../lib/tokenUtils';

const TokenCard = ({ 
  token, 
  chainId, 
  userAddress, 
  transferAmounts, 
  onTransferAmountChange 
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
    <div className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
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
            <span className="text-sm font-semibold">{token.symbol}</span>
            {token.isNative && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                Native
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500">{token.name}</p>
        </div>
      </div>

      {/* Balance Display */}
      <div className="mb-4">
        {isLoading ? (
          <div className="text-sm text-gray-400">Loading balance...</div>
        ) : error ? (
          <div className="text-sm text-red-500">Error loading balance</div>
        ) : (
          <div className="text-right">
            <div className="text-lg font-semibold">
              {balanceFormatted} {token.symbol}
            </div>
            <div className="text-xs text-gray-500">Available</div>
          </div>
        )}
      </div>

      {/* Transfer Controls */}
      {!isLoading && !error && balanceNum > 0 && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-xs font-medium text-gray-700">
              Transfer Amount
            </label>
            <span className="text-xs text-gray-600">
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
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(transferAmount/balanceNum)*100}%, #e5e7eb ${(transferAmount/balanceNum)*100}%, #e5e7eb 100%)`
            }}
          />
          
          <div className="flex justify-between text-xs text-gray-500">
            <span>0</span>
            <span>{balanceFormatted}</span>
          </div>

          {/* Quick percentage buttons */}
          <div className="flex gap-1">
            {[25, 50, 75, 100].map(p => (
              <button
                key={p}
                onClick={() => handleSliderChange((balanceNum * p) / 100)}
                className="flex-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
              >
                {p}%
              </button>
            ))}
          </div>

          {/* Selected amount display */}
          {transferAmount > 0 && (
            <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
              <p className="text-xs text-blue-800">
                Selected: <span className="font-semibold">{transferAmount.toFixed(4)} {token.symbol}</span>
                <span className="text-blue-600 ml-1">
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
