import { useWriteContract } from 'wagmi';
import ABI from '../lib/ABI.json';

export function useEscrowWithdraw(contractAddress, onSuccess) {
  const { writeContract, isPending: isTransactionLoading } = useWriteContract({
    mutation: {
      onSuccess: (data, variables) => {
        if (variables.functionName === 'withdraw') {
          alert('Withdrawal successful!');
        }
        onSuccess?.();
      },
      onError: (error) => {
        alert('Transaction failed: ' + error.message);
      },
    },
  });

  const handleWithdraw = () => {
    writeContract({
      address: contractAddress,
      abi: ABI,
      functionName: 'withdraw',
    });
  };

  return {
    handleWithdraw,
    isTransactionLoading
  };
}
