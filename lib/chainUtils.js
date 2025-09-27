import { CHAIN_CONFIGS } from './chainConfigs';

/**
 * Verifies if the wallet is connected to the target chain
 * @param {number} targetChainId - The chain ID to verify
 * @param {number} maxAttempts - Maximum verification attempts
 * @returns {Promise<boolean>} - True if chain switch is verified
 */
export const verifyChainSwitch = async (targetChainId, maxAttempts = 10) => {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      // Check via window.ethereum if available
      if (typeof window !== 'undefined' && window.ethereum) {
        const currentChain = await window.ethereum.request({ method: 'eth_chainId' });
        const currentChainDecimal = parseInt(currentChain, 16);
        
        if (currentChainDecimal === targetChainId) {
          return true;
        }
      }
      
      // Wait before next attempt
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.warn('Chain verification attempt failed:', error);
    }
  }
  return false;
};

/**
 * Switches to target chain and waits for confirmation
 * @param {Function} switchChain - Wagmi's switchChain function
 * @param {number} targetChainId - Target chain ID
 * @param {Function} setProgress - Progress callback function
 * @returns {Promise<void>}
 */
export const switchToChainSafely = async (switchChain, targetChainId, setProgress) => {
  const chain = CHAIN_CONFIGS.find(c => c.chainId === targetChainId);
  const chainName = chain?.name || `Chain ${targetChainId}`;

  try {
    setProgress(`Switching to ${chainName}...`);
    await switchChain({ chainId: targetChainId });
    
    // Verify the chain switch was successful
    setProgress(`Verifying chain switch to ${chainName}...`);
    
    const switchVerified = await verifyChainSwitch(targetChainId);
    
    if (!switchVerified) {
      throw new Error(`Chain switch to ${chainName} could not be verified. Please try again or switch manually in your wallet.`);
    }
    
    // Extra delay to ensure MetaMask is fully ready for transactions
    setProgress(`Preparing ${chainName} for transactions...`);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
  } catch (error) {
    throw new Error(`Failed to switch to ${chainName}: ${error.message}`);
  }
};
