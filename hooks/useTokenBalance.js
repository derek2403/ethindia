import { useBalance } from 'wagmi';

// Custom hook to get balance for a specific token on a specific chain
export const useTokenBalance = (chainId, tokenAddress, userAddress) => {
  const { data: balance, isLoading, error } = useBalance({
    address: userAddress,
    token: tokenAddress, // null for native tokens
    chainId: chainId,
    enabled: !!userAddress,
    refetchInterval: 10000,
    retry: 3
  });
  
  return { balance, isLoading, error };
};
