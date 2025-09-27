import React from 'react';
import { useAccount } from 'wagmi';
import { BorderBeam } from "@/components/ui/border-beam";
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
      <div className="glass-card flex flex-col justify-start p-6 relative max-w-4xl mx-auto w-full" style={{ width: '100%', maxWidth: '800px' }}>
        <BorderBeam 
          size={120}
          duration={4}
          colorFrom="#ffffff80"
          colorTo="#ffffff"
          delay={1}
        />
        <p className="text-white/80 text-center">
          Please connect your wallet to view multi-chain token balances
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card flex flex-col justify-start p-6 relative max-w-6xl mx-auto w-full" style={{ width: '100%', maxWidth: '1000px' }}>
      <BorderBeam 
        size={120}
        duration={4}
        colorFrom="#ffffff80"
        colorTo="#ffffff"
        delay={2}
      />
      <h2 className="text-2xl font-bold mb-6 text-white">
        Multi-Chain Token Balances
        <span className="text-sm font-normal text-white/70 ml-2">
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