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
    export default function TokenBalance({ transferAmounts = {}, setTransferAmounts }) {
      const { address, isConnected } = useAccount();

      // Call useBalance hook for each token individually at the top level
      const ethBalance = useBalance({ address, token: null });
      const usdcBalance = useBalance({ address, token: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238' });
      const pyusdBalance = useBalance({ address, token: '0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9' });
      const linkBalance = useBalance({ address, token: '0x779877A7B0D9E8603169DdbD7836e478b4624789' });

      const balances = {
        'ETH': ethBalance.data,
        'USDC': usdcBalance.data,
        'PYUSD': pyusdBalance.data,
        'LINK': linkBalance.data
      };

      const handleSliderChange = (tokenSymbol, value) => {
        setTransferAmounts(prev => ({ ...prev, [tokenSymbol]: value }));
      };

      const formatBalance = (balance, decimals) => {
        if (!balance) return '0.00';
        return parseFloat(formatUnits(balance.value, decimals)).toFixed(4);
      };

      if (!isConnected) return <p>Please connect your wallet</p>;

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