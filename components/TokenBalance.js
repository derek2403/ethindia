import React, { useState, useEffect } from 'react';
import { useAccount, useCapabilities, useSendCalls, useChainId, useSwitchChain } from 'wagmi';
import Image from "next/image";
import { BorderBeam } from "@/components/ui/border-beam";
import { CHAIN_CONFIGS } from '../lib/chainConfigs';
import { createTransferKey, formatBalance } from '../lib/tokenUtils';
import { useTokenBalance } from '../hooks/useTokenBalance';
import TransferSummary from './TransferSummary';
import { 
  groupTransfersByChain, 
  executeMultiChainTransfers
} from '../lib/chainUtils';

// Token Icon with Chain overlay component
const TokenWithChain = ({ tokenSrc, chainSrc, tokenAlt, chainAlt }) => (
  <div className="relative w-10 h-10">
    <Image 
      src={tokenSrc} 
      alt={tokenAlt} 
      width={40} 
      height={40} 
      className="w-10 h-10 rounded-full"
    />
    {chainSrc && (
      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gray-900 rounded-full p-0.5 border border-white/20 shadow-lg">
        <Image 
          src={chainSrc} 
          alt={chainAlt} 
          width={20} 
          height={20} 
          className="w-5 h-5"
        />
      </div>
    )}
  </div>
);

// Individual token row component
const TokenRow = ({ token, chain, userAddress, transferAmounts, onTransferAmountChange, tokenPrice }) => {
  const { balance, isLoading, error } = useTokenBalance(chain.chainId, token.address, userAddress);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  
  const balanceFormatted = formatBalance(balance, token.decimals);
  const balanceNum = parseFloat(balanceFormatted);
  
  const transferKey = createTransferKey(token.symbol, chain.chainId);
  const transferAmount = transferAmounts[transferKey] || 0;

  // Set timeout for loading state
  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        setLoadingTimeout(true);
      }, 1000);

      return () => clearTimeout(timer);
    } else {
      setLoadingTimeout(false);
    }
  }, [isLoading]);

  // Don't render if no balance, has error, balance is 0, or loading timeout exceeded
  if (!isLoading && (error || balanceNum === 0)) {
    return null;
  }

  if (isLoading && loadingTimeout) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-[200px_1fr_120px] gap-4 md:gap-4 p-4 md:py-4 md:px-0 border-b border-white/10 rounded-lg md:rounded-none opacity-50">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex-shrink-0">
            <TokenWithChain 
              tokenSrc={token.logo} 
              chainSrc={chain.icon} 
              tokenAlt={token.symbol} 
              chainAlt={chain.name}
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-sm text-white truncate">
              {token.symbol}
            </div>
            <div className="text-xs text-gray-400">
              Loading balance...
            </div>
          </div>
        </div>
        <div className="order-3 md:order-2"></div>
        <div className="order-2 md:order-3"></div>
      </div>
    );
  }

  const price = tokenPrice?.price || 0;
  const balanceUsd = balanceNum * price;
  const transferPercentage = balanceNum > 0 ? (transferAmount / balanceNum) * 100 : 0;

  const handleSliderChange = (percentage) => {
    const newAmount = (balanceNum * percentage) / 100;
    onTransferAmountChange(token.symbol, chain.chainId, newAmount);
  };

  const handleUsdInputChange = (usdAmount) => {
    if (price > 0 && balanceNum > 0) {
      const tokenAmount = usdAmount / price;
      // Ensure we don't exceed available balance
      const cappedAmount = Math.min(Math.max(0, tokenAmount), balanceNum);
      onTransferAmountChange(token.symbol, chain.chainId, cappedAmount);
    } else if (usdAmount === 0) {
      // Reset to 0 when input is cleared
      onTransferAmountChange(token.symbol, chain.chainId, 0);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-[200px_1fr_120px] gap-4 md:gap-4 p-4 md:py-4 md:px-0 border-b border-white/10 rounded-lg md:rounded-none" style={{
      background: transferAmount > 0 ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
      paddingLeft: transferAmount > 0 ? '12px' : '16px',
      paddingRight: transferAmount > 0 ? '12px' : '16px'
    }}>
      {/* Asset Info - Responsive column */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex-shrink-0">
          <TokenWithChain 
            tokenSrc={token.logo} 
            chainSrc={chain.icon} 
            tokenAlt={token.symbol} 
            chainAlt={chain.name}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
            <span className="font-semibold text-sm text-white truncate">
              {token.symbol}
            </span>
            {price > 0 && (
              <span className="text-xs text-gray-400 font-medium">
                ${price.toFixed(2)}
              </span>
            )}
          </div>
          <div className="space-y-1">
            <div className="text-xs text-gray-400 truncate">
              Available: {balanceFormatted} {token.symbol}
              {balanceUsd > 0 && (
                <span className="text-gray-500"> (${balanceUsd.toFixed(2)})</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Slider - Responsive column */}
      <div className="flex flex-col gap-2 justify-center items-center w-full order-3 md:order-2">
        <input
          type="range"
          min="0"
          max="100"
          value={transferPercentage}
          onChange={(e) => handleSliderChange(Number(e.target.value))}
          className="w-full h-1.5 rounded appearance-none cursor-pointer"
          style={{
            accentColor: '#ffffff',
            background: `linear-gradient(to right, #ffffff 0%, #ffffff ${transferPercentage}%, rgba(255,255,255,0.2) ${transferPercentage}%, rgba(255,255,255,0.2) 100%)`
          }}
        />

        <div className="flex justify-between text-xs text-gray-400 w-full">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>

      {/* USD Input - Responsive column */}
      <div className="text-center md:text-right order-2 md:order-3">
        <div className="relative mb-2">
          <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-sm text-white font-semibold pointer-events-none">
            $
          </span>
          <input
            type="number"
            min="0"
            max={(balanceNum * price).toFixed(2)}
            step="0.01"
            value={transferAmount * price ? (transferAmount * price).toFixed(2) : ''}
            onChange={(e) => handleUsdInputChange(parseFloat(e.target.value) || 0)}
            className="w-full sm:w-32 md:w-full pl-6 pr-2 py-2 text-sm font-semibold text-white bg-white/10 border border-white/20 rounded-lg text-right outline-none backdrop-blur-sm focus:border-white/40 focus:bg-white/15 transition-all"
            style={{
              WebkitAppearance: 'none',
              MozAppearance: 'textfield'
            }}
            placeholder="0.00"
          />
        </div>
        <div className="text-xs text-gray-400 truncate">
          {transferPercentage.toFixed(1)}% • {transferAmount.toFixed(4)} {token.symbol}
        </div>
      </div>
    </div>
  );
};

export default function TokenBalance({ transferAmounts = {}, setTransferAmounts, tokenPrices = {}, pricesLoading = false, pricesError = null }) {
  const { address, isConnected } = useAccount();
  
  // Transfer functionality
  const { data: capabilities } = useCapabilities();
  const { sendCalls, isPending } = useSendCalls();
  const currentChainId = useChainId();
  const { switchChain, isPending: isSwitchingChain } = useSwitchChain();
  
  const [txResult, setTxResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentProgress, setCurrentProgress] = useState('');

  // Add CSS to hide number input spinners
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      input[type="number"]::-webkit-outer-spin-button,
      input[type="number"]::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
      }
      input[type="number"] {
        -moz-appearance: textfield;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const handleTransferAmountChange = (tokenSymbol, chainId, value) => {
    const key = createTransferKey(tokenSymbol, chainId);
    setTransferAmounts(prev => ({ ...prev, [key]: value }));
  };

  // Transfer functionality
  const transfersByChain = groupTransfersByChain(transferAmounts);
  const hasTokensSelected = Object.keys(transfersByChain).length > 0;

  const handleTransfer = async () => {
    if (!address) return;

    setIsLoading(true);
    setTxResult(null);
    setCurrentProgress('');

    try {
      const recipientAddress = '0x3C1e5A7C1E70Dae9008C45AeAcff9C123271Cf0A';
      
      const results = await executeMultiChainTransfers({
        transfersByChain,
        recipientAddress,
        currentChainId,
        switchChain,
        sendCalls,
        capabilities,
        setProgress: setCurrentProgress
      });

      setCurrentProgress('');
      setTxResult({ success: true, results });
    } catch (err) {
      console.error('Transfer failed:', err);
      setCurrentProgress('');
      setTxResult({ success: false, error: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  // Flatten all tokens from all chains
  const allTokens = CHAIN_CONFIGS.flatMap(chain => [
    { ...chain.nativeToken, address: null, isNative: true, chain },
    ...chain.erc20Tokens.map(token => ({ ...token, isNative: false, chain }))
  ]);

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

      <div style={{
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '12px',
        padding: '24px',
        backdropFilter: 'blur(8px)'
      }}>
        {allTokens.map((token, index) => (
          <TokenRow
            key={`${token.symbol}_${token.chain.chainId}`}
            token={token}
            chain={token.chain}
            userAddress={address}
            transferAmounts={transferAmounts}
            onTransferAmountChange={handleTransferAmountChange}
            tokenPrice={tokenPrices[token.symbol]}
          />
        ))}

        {/* Transfer Summary - integrated in same container */}
        <TransferSummary transferAmounts={transferAmounts} tokenPrices={tokenPrices} />
      </div>

      {/* Transfer Button */}
      <div className="flex justify-center mt-6">
        <button
          onClick={handleTransfer}
          disabled={isLoading || isPending || isSwitchingChain || !hasTokensSelected}
          className="px-8 py-4 bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:text-white/40 text-white font-medium rounded-lg border border-white/20 hover:border-white/30 transition-all duration-200 text-lg"
        >
          {isLoading || isPending
            ? currentProgress || 'Sending Transfer...'
            : isSwitchingChain
            ? 'Switching Chain...'
            : !hasTokensSelected
            ? 'Select tokens to transfer'
            : 'Send Transfer'}
        </button>
      </div>
    </div>
  );
}