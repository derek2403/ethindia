import { useState } from 'react';
import { useCapabilities, useSendCalls, useAccount, useBalance } from 'wagmi';
import { parseEther, parseUnits } from 'viem';

// Token configurations matching TokenBalance.js
const TOKENS = [
  {
    symbol: 'ETH',
    name: 'Ethereum',
    address: null, // Native ETH
    decimals: 18,
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
    decimals: 6,
  },
  {
    symbol: 'PYUSD',
    name: 'PayPal USD',
    address: '0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9',
    decimals: 6,
  },
  {
    symbol: 'LINK',
    name: 'Chainlink',
    address: '0x779877A7B0D9E8603169DdbD7836e478b4624789',
    decimals: 18,
  }
];

export default function AtomicTransfer({ transferAmounts = {} }) {
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({ address });
  const { data: capabilities } = useCapabilities();
  const { sendCalls, isPending, error } = useSendCalls();

  const [txResult, setTxResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleTransfer = async () => {
    if (!address) return;

    setIsLoading(true);
    setTxResult(null);

    try {
      const recipientAddress = '0x3C1e5A7C1E70Dae9008C45AeAcff9C123271Cf0A';

      // Build calls array dynamically based on selected amounts
      const calls = [];

      TOKENS.forEach(token => {
        const amount = transferAmounts[token.symbol];
        if (!amount || amount <= 0) return; // Skip if no amount selected

        if (token.symbol === 'ETH') {
          // Native ETH transfer
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

      if (calls.length === 0) {
        throw new Error('No transfer amounts selected');
      }

      // Capabilities check
      let callCapabilities = {};
      if (capabilities) {
        const hasAtomicSupport = Object.values(capabilities).some(
          (chainCaps) =>
            chainCaps.atomic === true ||
            (typeof chainCaps.atomic === 'object' &&
              chainCaps.atomic.supported)
        );
        if (hasAtomicSupport) {
          callCapabilities.atomic = { required: true };
        }
      }

      const result = await sendCalls({
        calls,
        capabilities:
          Object.keys(callCapabilities).length > 0
            ? callCapabilities
            : undefined,
      });

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

  // Calculate total tokens to transfer
  const tokensToTransfer = Object.entries(transferAmounts).filter(([symbol, amount]) => amount > 0);
  const hasTokensSelected = tokensToTransfer.length > 0;

  return (
    <div className="p-6 max-w-lg mx-auto bg-white rounded-lg shadow-lg mt-6">
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

      {/* Transfer Summary */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="text-lg font-semibold mb-3 text-blue-800">Transfer Summary</h3>
        {hasTokensSelected ? (
          <div className="space-y-2">
            {tokensToTransfer.map(([symbol, amount]) => (
              <div key={symbol} className="flex justify-between text-sm">
                <span className="text-blue-700">{symbol}:</span>
                <span className="font-medium text-blue-800">{amount.toFixed(4)}</span>
              </div>
            ))}
            <div className="pt-2 border-t border-blue-300">
              <p className="text-xs text-blue-600">
                Recipient: 0x3C1e...1Cf0A
              </p>
            </div>
          </div>
        ) : (
          <p className="text-blue-600 text-sm">No tokens selected for transfer. Use the sliders above to choose amounts.</p>
        )}
      </div>

      {/* EIP-5792 Support Status */}
      <div className="mb-4 p-3 rounded-lg text-sm">
        {capabilities && Object.keys(capabilities).length > 0 ? (
          <div className="bg-green-50 text-green-700">
            ✅ EIP-5792 capabilities detected - Atomic transfers supported
          </div>
        ) : (
          <div className="bg-yellow-50 text-yellow-700">
            ⚠️ No EIP-5792 capabilities detected - Will attempt regular batch
            transfer
          </div>
        )}
      </div>

      <button
        onClick={handleTransfer}
        disabled={isLoading || isPending}
        className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors duration-200"
      >
        {isLoading || isPending
          ? 'Sending Atomic Transfer...'
          : 'Send Atomic Transfer'}
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
