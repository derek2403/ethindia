import { useState, useEffect } from 'react';
import { useWriteContract, useReadContract } from 'wagmi';
import { parseUnits, isAddress, maxUint256 } from 'viem';
import ABI from '../lib/ABI.json';

const ETH_ADDRESS = '0x0000000000000000000000000000000000000000';

// Extended ERC20 ABI with decimals
const ERC20_ABI = [
  {
    "inputs": [
      {"internalType": "address", "name": "spender", "type": "address"},
      {"internalType": "uint256", "name": "amount", "type": "uint256"}
    ],
    "name": "approve",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "decimals",
    "outputs": [{"internalType": "uint8", "name": "", "type": "uint8"}],
    "stateMutability": "view",
    "type": "function"
  }
];

export function useEscrowDeposit(contractAddress, availableTokens, onSuccess) {
  const [merchantAddress, setMerchantAddress] = useState('');
  const [tokenSelections, setTokenSelections] = useState([
    { 
      id: 1, 
      tokenAddress: ETH_ADDRESS, 
      amount: '', 
      customTokenAddress: '', 
      tokenDecimals: 18 
    }
  ]);

  // Write contract hook
  const { writeContract, isPending: isTransactionLoading } = useWriteContract({
    mutation: {
      onSuccess: (data, variables) => {
        if (variables.functionName === 'deposit') {
          alert('Multi-token deposit successful!');
          setMerchantAddress('');
          // Reset token selections to single native token
          const nativeToken = availableTokens.find(t => t.isNative);
          setTokenSelections([
            { 
              id: 1, 
              tokenAddress: nativeToken?.address || ETH_ADDRESS, 
              amount: '', 
              customTokenAddress: '', 
              tokenDecimals: nativeToken?.decimals || 18 
            }
          ]);
        }
        onSuccess?.();
      },
      onError: (error) => {
        alert('Transaction failed: ' + error.message);
      },
    },
  });

  // Reset token selections when chain changes
  useEffect(() => {
    const nativeToken = availableTokens.find(t => t.isNative);
    setTokenSelections([
      { 
        id: 1, 
        tokenAddress: nativeToken?.address || ETH_ADDRESS, 
        amount: '', 
        customTokenAddress: '', 
        tokenDecimals: nativeToken?.decimals || 18 
      }
    ]);
  }, [availableTokens]);

  // Helper functions for token selections
  const addTokenSelection = () => {
    const newId = Math.max(...tokenSelections.map(t => t.id)) + 1;
    setTokenSelections([...tokenSelections, {
      id: newId,
      tokenAddress: ETH_ADDRESS,
      amount: '',
      customTokenAddress: '',
      tokenDecimals: 18
    }]);
  };

  const removeTokenSelection = (id) => {
    if (tokenSelections.length > 1) {
      setTokenSelections(tokenSelections.filter(t => t.id !== id));
    }
  };

  const updateTokenSelection = (id, field, value) => {
    setTokenSelections(tokenSelections.map(token => 
      token.id === id ? { ...token, [field]: value } : token
    ));
  };

  const getCurrentTokenAddress = (selection) => {
    return selection.tokenAddress === 'other' ? selection.customTokenAddress : selection.tokenAddress;
  };

  // Known token decimals
  const getKnownDecimals = (tokenAddress) => {
    const token = availableTokens.find(t => t.address === tokenAddress);
    return token ? token.decimals : 18; // Default for unknown tokens
  };

  // Update decimals when token selections change
  useEffect(() => {
    tokenSelections.forEach(selection => {
      const currentTokenAddress = getCurrentTokenAddress(selection);
      const knownDecimals = getKnownDecimals(currentTokenAddress);
      
      if (selection.tokenDecimals !== knownDecimals) {
        updateTokenSelection(selection.id, 'tokenDecimals', knownDecimals);
      }
    });
  }, [tokenSelections.map(s => getCurrentTokenAddress(s)).join(',')]);

  // Read decimals for custom tokens only
  const customTokenAddresses = tokenSelections
    .filter(s => s.tokenAddress === 'other' && isAddress(s.customTokenAddress))
    .map(s => s.customTokenAddress);

  // Only read decimals for the first custom token to avoid multiple hooks
  const { data: customTokenDecimals } = useReadContract({
    address: customTokenAddresses[0] || undefined,
    abi: ERC20_ABI,
    functionName: 'decimals',
    query: {
      enabled: customTokenAddresses.length > 0
    }
  });

  // Update custom token decimals
  useEffect(() => {
    if (customTokenDecimals && customTokenAddresses[0]) {
      const customTokenSelection = tokenSelections.find(s => 
        s.tokenAddress === 'other' && s.customTokenAddress === customTokenAddresses[0]
      );
      if (customTokenSelection) {
        updateTokenSelection(customTokenSelection.id, 'tokenDecimals', Number(customTokenDecimals));
      }
    }
  }, [customTokenDecimals, customTokenAddresses[0]]);

  const handleDeposit = () => {
    if (!merchantAddress) {
      alert('Please enter merchant address');
      return;
    }
    if (!isAddress(merchantAddress)) {
      alert('Invalid merchant address');
      return;
    }

    // Validate all token selections
    for (const selection of tokenSelections) {
      if (!selection.amount) {
        alert('Please enter amounts for all tokens');
        return;
      }
      const currentTokenAddress = getCurrentTokenAddress(selection);
      if (currentTokenAddress !== ETH_ADDRESS && !isAddress(currentTokenAddress)) {
        alert('Please enter valid token addresses');
        return;
      }
    }
    
    // Build arrays for batch deposit
    const merchants = [];
    const tokens = [];
    const amounts = [];
    let totalEthValue = 0n;
    
    tokenSelections.forEach(selection => {
      const currentTokenAddress = getCurrentTokenAddress(selection);
      merchants.push(merchantAddress);
      tokens.push(currentTokenAddress);
      
      if (currentTokenAddress === ETH_ADDRESS) {
        // ETH deposit
        const ethAmount = parseUnits(selection.amount, 18);
        amounts.push(ethAmount);
        totalEthValue += ethAmount;
      } else {
        // ERC20 deposit
        const tokenAmount = parseUnits(selection.amount, selection.tokenDecimals);
        amounts.push(tokenAmount);
      }
    });
    
    writeContract({
      address: contractAddress,
      abi: ABI,
      functionName: 'deposit',
      args: [
        merchants,
        tokens,
        amounts
      ],
      value: totalEthValue,
    });
  };

  const handleApprove = (tokenAddress) => {
    if (tokenAddress === ETH_ADDRESS) {
      alert('ETH does not need approval');
      return;
    }
    if (!isAddress(tokenAddress)) {
      alert('Please enter a valid token address');
      return;
    }
    
    writeContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [
        contractAddress,
        maxUint256 // Approve maximum amount
      ],
    });
  };

  const handleApproveAll = () => {
    const tokensToApprove = tokenSelections
      .map(selection => getCurrentTokenAddress(selection))
      .filter(addr => addr !== ETH_ADDRESS && isAddress(addr));
    
    if (tokensToApprove.length === 0) {
      alert('No ERC20 tokens to approve');
      return;
    }

    // Approve first token (user will need to approve others manually)
    handleApprove(tokensToApprove[0]);
    
    if (tokensToApprove.length > 1) {
      alert(`Please approve remaining ${tokensToApprove.length - 1} tokens individually`);
    }
  };

  return {
    merchantAddress,
    setMerchantAddress,
    tokenSelections,
    addTokenSelection,
    removeTokenSelection,
    updateTokenSelection,
    getCurrentTokenAddress,
    handleDeposit,
    handleApprove,
    handleApproveAll,
    isTransactionLoading
  };
}
