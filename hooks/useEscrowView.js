import { useState } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import ABI from '../lib/ABI.json';

export function useEscrowView(contractAddress) {
  const { address } = useAccount();
  const [viewAddress, setViewAddress] = useState('');

  // View escrow data
  const { data: escrowData, refetch: refetchEscrow, isLoading } = useReadContract({
    address: contractAddress,
    abi: ABI,
    functionName: 'viewEscrow',
    args: [viewAddress || address],
    query: {
      enabled: (!!viewAddress || !!address) && !!contractAddress,
    }
  });

  const hasBalances = escrowData && escrowData[0]?.length > 0;

  return {
    viewAddress,
    setViewAddress,
    escrowData,
    refetchEscrow,
    isLoading,
    hasBalances
  };
}
