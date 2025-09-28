import { useState, useEffect } from 'react';
import { useChainId, useSwitchChain } from 'wagmi';
import { CHAIN_CONFIGS, getChainConfig, getAllTokensForChain } from '../lib/chainConfigs';

export function useChainManager() {
  const currentChainId = useChainId();
  const { switchChain } = useSwitchChain();
  const [selectedChainId, setSelectedChainId] = useState(11155111); // Default to Ethereum Sepolia

  // Get current chain config and contract address
  const selectedChainConfig = getChainConfig(selectedChainId);
  const contractAddress = selectedChainConfig?.escrowAddress;
  const availableTokens = getAllTokensForChain(selectedChainId);

  // Update selected chain when wallet chain changes
  useEffect(() => {
    if (currentChainId && CHAIN_CONFIGS.find(c => c.chainId === currentChainId)) {
      setSelectedChainId(currentChainId);
    }
  }, [currentChainId]);

  const handleChainSwitch = (chainId) => {
    setSelectedChainId(chainId);
    if (currentChainId !== chainId) {
      switchChain({ chainId });
    }
  };

  return {
    currentChainId,
    selectedChainId,
    selectedChainConfig,
    contractAddress,
    availableTokens,
    handleChainSwitch,
    isChainMismatch: currentChainId !== selectedChainId
  };
}
