import React from 'react';
import TokenCard from './TokenCard';

const ChainSection = ({ 
  chain, 
  userAddress, 
  transferAmounts, 
  onTransferAmountChange 
}) => {
  // Get all tokens for this chain (native + ERC20s)
  const allTokens = [
    { ...chain.nativeToken, address: null, isNative: true },
    ...chain.erc20Tokens.map(token => ({ ...token, isNative: false }))
  ];

  return (
    <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
      {/* Chain Header */}
      <div className="flex items-center gap-3 mb-6">
        <span className="text-2xl">{chain.icon}</span>
        <div>
          <h3 className="text-xl font-semibold">{chain.name}</h3>
          <p className="text-sm text-gray-600">Chain ID: {chain.chainId}</p>
        </div>
      </div>

      {/* Tokens on this chain */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {allTokens.map(token => (
          <TokenCard
            key={`${token.symbol}_${chain.chainId}`}
            token={token}
            chainId={chain.chainId}
            userAddress={userAddress}
            transferAmounts={transferAmounts}
            onTransferAmountChange={onTransferAmountChange}
          />
        ))}
      </div>
    </div>
  );
};

export default ChainSection;
