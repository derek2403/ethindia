import { useState } from 'react';
import { useSendCalls, useAccount, useBalance } from 'wagmi';
import { parseEther } from 'viem';

export default function AtomicTransfer() {
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({ address });
  const { sendCalls, isPending, error } = useSendCalls();

  const [txResult, setTxResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleTransfer = async () => {
    if (!address) return;

    setIsLoading(true);
    setTxResult(null);

    try {
      const recipientAddress = '0x3C1e5A7C1E70Dae9008C45AeAcff9C123271Cf0A';

      const sepoliaUSDC = '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238';
      const sepoliaPYUSD = '0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9';

      const usdcTransferData = `0xa9059cbb${recipientAddress
        .slice(2)
        .padStart(64, '0')}${(10000).toString(16).padStart(64, '0')}`;

      const pyusdTransferData = `0xa9059cbb${recipientAddress
        .slice(2)
        .padStart(64, '0')}${(10000).toString(16).padStart(64, '0')}`;

      const calls = [
        {
          to: recipientAddress,
          value: parseEther('0.001'),
        },
        {
          to: sepoliaUSDC,
          data: usdcTransferData,
        },
        {
          to: sepoliaPYUSD,
          data: pyusdTransferData,
        },
      ];

      const result = await sendCalls({ calls });
      setTxResult({ success: true, id: result });
    } catch (err) {
      console.error('Transfer failed:', err);
      setTxResult({ success: false, error: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="p-6 max-w-md mx-auto bg-yellow-50 rounded-lg">
        <p className="text-yellow-800">
          Please connect your wallet to use atomic transfers
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-lg mx-auto bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Atomic Transfer</h2>

      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Connected Wallet</h3>
        <p className="text-sm text-gray-600">Address: {address}</p>
        <p className="text-sm text-gray-600">
          Balance:{' '}
          {balance
            ? `${parseFloat(balance.formatted).toFixed(4)} ${balance.symbol}`
            : 'Loading...'}
        </p>
      </div>

      {/* Transfer button */}
      <button
        onClick={handleTransfer}
        disabled={isLoading || isPending}
        className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors duration-200"
      >
        {isLoading || isPending
          ? 'Sending Transfer...'
          : 'Send ETH + ERC20 Transfer'}
      </button>

      {error && (
        <div className="mt-4 p-4 bg-red-50 rounded-lg">
          <p className="text-red-800 font-medium">Error:</p>
          <p className="text-sm text-red-600">{error.message}</p>
        </div>
      )}
    </div>
  );
}
