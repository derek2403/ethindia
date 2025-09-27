import React from 'react';
import { useAccount } from 'wagmi';
import { CHAIN_CONFIGS } from '../lib/chainConfigs';
import { createTransferKey } from '../lib/tokenUtils';
import ChainSection from './ChainSection';
import TransferSummary from './TransferSummary';

export default function TokenBalance({ transferAmounts = {}, setTransferAmounts, tokenPrices = {}, pricesLoading = false, pricesError = null }) {
  const { address, isConnected } = useAccount();

  const handleTransferAmountChange = (tokenSymbol, chainId, value) => {
    const key = createTransferKey(tokenSymbol, chainId);
    setTransferAmounts(prev => ({ ...prev, [key]: value }));
  };

  if (!isConnected) {
    return (
      <div className="p-6 max-w-4xl mx-auto bg-yellow-50 rounded-lg border border-yellow-200">
        <p className="text-yellow-800 text-center">
          Please connect your wallet to view multi-chain token balances
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        Multi-Chain Token Balances
        <span className="text-sm font-normal text-gray-600 ml-2">
          (Sepolia • Flow EVM • Hedera)
        </span>
      </h2>

      
      
      <div className="space-y-8">
        {CHAIN_CONFIGS.map(chain => (
          <ChainSection
            key={chain.chainId}
            chain={chain}
            userAddress={address}
            transferAmounts={transferAmounts}
            onTransferAmountChange={handleTransferAmountChange}
            tokenPrices={tokenPrices}
          />
        ))}
      </div>

      <TransferSummary transferAmounts={transferAmounts} />
    </div>
  );
}