import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import Image from "next/image";
import { BorderBeam } from "@/components/ui/border-beam";
import { CHAIN_CONFIGS } from '../lib/chainConfigs';
import { createTransferKey, formatBalance } from '../lib/tokenUtils';
import { useTokenBalance } from '../hooks/useTokenBalance';
import TransferSummary from './TransferSummary';

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
      <div style={{
        display: 'grid',
        gridTemplateColumns: '200px 1fr 120px',
        alignItems: 'center',
        gap: '16px',
        padding: '16px 0',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        opacity: 0.5
      }}>
        <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
          <TokenWithChain 
            tokenSrc={token.logo} 
            chainSrc={chain.icon} 
            tokenAlt={token.symbol} 
            chainAlt={chain.name}
          />
          <div>
            <div style={{color: 'white', fontWeight: '600', fontSize: '14px'}}>
              {token.symbol}
            </div>
            <div style={{fontSize: '11px', color: '#9ca3af'}}>
              Loading balance...
            </div>
          </div>
        </div>
        <div></div>
        <div></div>
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

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '200px 1fr 120px',
      alignItems: 'center',
      gap: '16px',
      padding: '16px 0',
      borderBottom: '1px solid rgba(255,255,255,0.1)',
      background: transferAmount > 0 ? 'rgba(96, 165, 250, 0.1)' : 'transparent',
      borderRadius: transferAmount > 0 ? '6px' : '0',
      paddingLeft: transferAmount > 0 ? '12px' : '0',
      paddingRight: transferAmount > 0 ? '12px' : '0'
    }}>
      {/* Asset Info - Fixed width column */}
      <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
        <TokenWithChain 
          tokenSrc={token.logo} 
          chainSrc={chain.icon} 
          tokenAlt={token.symbol} 
          chainAlt={chain.name}
        />
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '2px'
          }}>
            <span style={{
              fontWeight: '600',
              fontSize: '14px',
              color: transferAmount > 0 ? '#60a5fa' : 'white'
            }}>
              {token.symbol}
            </span>
            {price > 0 && (
              <span style={{
                fontSize: '12px',
                color: '#6b7280',
                fontWeight: '500'
              }}>
                ${price.toFixed(2)}
              </span>
            )}
          </div>
          <div>
            <div style={{fontSize: '11px', color: '#9ca3af'}}>
              Available: {balanceFormatted} {token.symbol}
              {balanceUsd > 0 && (
                <span style={{color: '#6b7280'}}> (${balanceUsd.toFixed(2)})</span>
              )}
            </div>
            {transferAmount > 0 && (
              <div style={{fontSize: '11px', color: '#ef4444', marginTop: '1px'}}>
                Selected: {transferAmount.toFixed(4)} {token.symbol} (${(transferAmount * price).toFixed(2)})
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Slider - Flexible center column */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%'
      }}>
        <input
          type="range"
          min="0"
          max="100"
          value={transferPercentage}
          onChange={(e) => handleSliderChange(Number(e.target.value))}
          style={{
            width: '100%',
            margin: '0',
            cursor: 'pointer',
            accentColor: '#60a5fa',
            WebkitAppearance: 'none',
            appearance: 'none',
            background: `linear-gradient(to right, #60a5fa 0%, #60a5fa ${transferPercentage}%, rgba(255,255,255,0.2) ${transferPercentage}%, rgba(255,255,255,0.2) 100%)`,
            height: '6px',
            borderRadius: '3px'
          }}
        />

        <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#6b7280', width: '100%'}}>
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Allocation Display - Fixed width column */}
      <div style={{textAlign: 'right'}}>
        <div style={{
          fontWeight: '600',
          fontSize: '16px',
          color: transferAmount > 0 ? '#60a5fa' : 'white'
        }}>
          ${(transferAmount * price).toFixed(2)}
        </div>
        <div style={{fontSize: '12px', color: '#6b7280'}}>
          Slider: {transferPercentage.toFixed(1)}% • {transferAmount.toFixed(4)} {token.symbol}
        </div>
      </div>
    </div>
  );
};

export default function TokenBalance({ transferAmounts = {}, setTransferAmounts, tokenPrices = {}, pricesLoading = false, pricesError = null }) {
  const { address, isConnected } = useAccount();

  const handleTransferAmountChange = (tokenSymbol, chainId, value) => {
    const key = createTransferKey(tokenSymbol, chainId);
    setTransferAmounts(prev => ({ ...prev, [key]: value }));
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
      </div>

      <TransferSummary transferAmounts={transferAmounts} />
    </div>
  );
}