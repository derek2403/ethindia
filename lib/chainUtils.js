import { parseUnits } from 'viem';
import { CHAIN_CONFIGS } from './chainConfigs';
import { parseTransferKey } from './tokenUtils';

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

/**
 * Finds token details from chain configurations
 * @param {string} symbol - Token symbol
 * @param {number} chainId - Chain ID
 * @returns {Object|null} - Token details or null if not found
 */
export const findTokenDetails = (symbol, chainId) => {
  const chain = CHAIN_CONFIGS.find(c => c.chainId === chainId);
  if (!chain) return null;

  // Check if it's the native token
  if (chain.nativeToken.symbol === symbol) {
    return { ...chain.nativeToken, address: null, isNative: true };
  }

  // Check ERC20 tokens
  const erc20Token = chain.erc20Tokens.find(t => t.symbol === symbol);
  return erc20Token ? { ...erc20Token, isNative: false } : null;
};

/**
 * Groups transfer amounts by chain
 * @param {Object} transferAmounts - Transfer amounts with keys like "SYMBOL_CHAINID"
 * @returns {Object} - Transfers grouped by chain ID
 */
export const groupTransfersByChain = (transferAmounts) => {
  const transfersByChain = {};
  
  Object.entries(transferAmounts).forEach(([key, amount]) => {
    if (!amount || amount <= 0) return;
    
    const { symbol, chainId } = parseTransferKey(key);
    const token = findTokenDetails(symbol, chainId);
    
    if (!token) return;
    
    if (!transfersByChain[chainId]) {
      transfersByChain[chainId] = [];
    }
    
    transfersByChain[chainId].push({
      token,
      amount,
      chainId
    });
  });
  
  return transfersByChain;
};

/**
 * Builds transaction calls for token transfers
 * @param {Array} transfers - Array of transfer objects
 * @param {string} recipientAddress - Recipient wallet address
 * @returns {Array} - Array of transaction calls
 */
export const buildTransferCalls = (transfers, recipientAddress) => {
  const calls = [];

  transfers.forEach(({ token, amount }) => {
    if (token.isNative) {
      // Native token transfer
      calls.push({
        to: recipientAddress,
        value: parseUnits(amount.toString(), token.decimals),
      });
    } else {
      // ERC20 token transfer
      const amountInWei = parseUnits(amount.toString(), token.decimals);
      const transferData = `0xa9059cbb${recipientAddress
        .slice(2)
        .padStart(64, '0')}${amountInWei.toString(16).padStart(64, '0')}`;

      calls.push({
        to: token.address,
        data: transferData,
      });
    }
  });

  return calls;
};

/**
 * Checks capabilities for atomic transfer support on a specific chain
 * @param {Object} capabilities - Wagmi capabilities object
 * @param {string} chainId - Chain ID as string
 * @returns {Object} - Capabilities object for the chain
 */
export const getChainCapabilities = (capabilities, chainId) => {
  const callCapabilities = {};
  
  if (capabilities && capabilities[chainId]) {
    const chainCaps = capabilities[chainId];
    const hasAtomicSupport = chainCaps.atomic === true ||
      (typeof chainCaps.atomic === 'object' && chainCaps.atomic.supported);
    
    if (hasAtomicSupport) {
      callCapabilities.atomic = { required: true };
    }
  }

  return Object.keys(callCapabilities).length > 0 ? callCapabilities : undefined;
};

/**
 * Executes transfers on multiple chains with automatic chain switching
 * @param {Object} params - Parameters object
 * @returns {Promise<Array>} - Array of transfer results
 */
export const executeMultiChainTransfers = async ({
  transfersByChain,
  recipientAddress,
  currentChainId,
  switchChain,
  sendCalls,
  capabilities,
  setProgress
}) => {
  const results = [];
  const chainEntries = Object.entries(transfersByChain);

  if (chainEntries.length === 0) {
    throw new Error('No transfer amounts selected');
  }

  // Execute transfers for each chain sequentially
  for (let i = 0; i < chainEntries.length; i++) {
    const [chainId, transfers] = chainEntries[i];
    const targetChainId = parseInt(chainId);
    const chain = CHAIN_CONFIGS.find(c => c.chainId === targetChainId);
    
    setProgress(`Processing ${chain?.name || `Chain ${chainId}`} (${i + 1}/${chainEntries.length})`);

    // Check if we need to switch chains
    if (currentChainId !== targetChainId) {
      await switchToChainSafely(switchChain, targetChainId, setProgress);
    }

    setProgress(`Executing transfers on ${chain?.name || `Chain ${chainId}`}...`);

    const calls = buildTransferCalls(transfers, recipientAddress);

    if (calls.length > 0) {
      const callCapabilities = getChainCapabilities(capabilities, chainId);

      const result = await sendCalls({
        calls,
        capabilities: callCapabilities,
      });

      results.push({ 
        chainId, 
        result, 
        transfers, 
        chainName: chain?.name 
      });
    }
  }

  return results;
};