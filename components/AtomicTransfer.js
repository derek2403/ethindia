import { useState } from 'react';
import { useCapabilities, useSendCalls, useAccount, useBalance } from 'wagmi';
import { parseEther, parseUnits } from 'viem';
import { CHAIN_CONFIGS } from '../lib/chainConfigs';
import { parseTransferKey } from '../lib/tokenUtils';

export default function AtomicTransfer({ transferAmounts = {} }) {
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({ address });
  const { data: capabilities } = useCapabilities();
  const { sendCalls, isPending, error } = useSendCalls();

  const [txResult, setTxResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Helper function to find token details from chain configs
  const findTokenDetails = (symbol, chainId) => {
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

  // Group transfers by chain
  const getTransfersByChain = () => {
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

  const handleTransfer = async () => {
    if (!address) return;

    setIsLoading(true);
    setTxResult(null);

    try {
      const recipientAddress = '0x3C1e5A7C1E70Dae9008C45AeAcff9C123271Cf0A';
      const transfersByChain = getTransfersByChain();
      const results = [];

      // Execute transfers for each chain
      for (const [chainId, transfers] of Object.entries(transfersByChain)) {
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

        if (calls.length > 0) {
          // Capabilities check for this chain
          let callCapabilities = {};
          if (capabilities && capabilities[chainId]) {
            const chainCaps = capabilities[chainId];
            const hasAtomicSupport = chainCaps.atomic === true ||
              (typeof chainCaps.atomic === 'object' && chainCaps.atomic.supported);
            
            if (hasAtomicSupport) {
              callCapabilities.atomic = { required: true };
            }
          }

          const result = await sendCalls({
            calls,
            capabilities: Object.keys(callCapabilities).length > 0 ? callCapabilities : undefined,
          });

          results.push({ chainId, result, transfers });
        }
      }

      if (results.length === 0) {
        throw new Error('No transfer amounts selected');
      }

      setTxResult({ success: true, results });
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

  // Calculate transfers by chain
  const transfersByChain = getTransfersByChain();
  const hasTokensSelected = Object.keys(transfersByChain).length > 0;
  const totalTransfers = Object.values(transfersByChain).reduce((sum, transfers) => sum + transfers.length, 0);

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded-lg shadow-lg mt-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Multi-Chain Atomic Transfer</h2>

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

      {/* Transfer Summary by Chain */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="text-lg font-semibold mb-3 text-blue-800">Transfer Summary</h3>
        {hasTokensSelected ? (
          <div className="space-y-4">
            {Object.entries(transfersByChain).map(([chainId, transfers]) => {
              const chain = CHAIN_CONFIGS.find(c => c.chainId === parseInt(chainId));
              return (
                <div key={chainId} className="border border-blue-300 rounded-lg p-3 bg-white">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{chain?.icon}</span>
                    <h4 className="font-semibold text-blue-800">{chain?.name}</h4>
                  </div>
                  <div className="space-y-1">
                    {transfers.map(({ token, amount }, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-blue-700">{token.symbol}:</span>
                        <span className="font-medium text-blue-800">{amount.toFixed(4)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            <div className="pt-2 border-t border-blue-300">
              <p className="text-xs text-blue-600">
                Recipient: 0x3C1e...1Cf0A
              </p>
              <p className="text-xs text-blue-600">
                {Object.keys(transfersByChain).length} chain{Object.keys(transfersByChain).length !== 1 ? 's' : ''} • {totalTransfers} transfer{totalTransfers !== 1 ? 's' : ''}
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
            ✅ EIP-5792 capabilities detected - Atomic transfers supported per chain
          </div>
        ) : (
          <div className="bg-yellow-50 text-yellow-700">
            ⚠️ No EIP-5792 capabilities detected - Will attempt regular batch transfers
          </div>
        )}
      </div>

      <button
        onClick={handleTransfer}
        disabled={isLoading || isPending || !hasTokensSelected}
        className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors duration-200"
      >
        {isLoading || isPending
          ? 'Sending Multi-Chain Transfer...'
          : !hasTokensSelected
          ? 'Select tokens to transfer'
          : `Send Multi-Chain Transfer (${Object.keys(transfersByChain).length} chain${Object.keys(transfersByChain).length !== 1 ? 's' : ''})`}
      </button>

      {error && (
        <div className="mt-4 p-4 bg-red-50 rounded-lg">
          <p className="text-red-800 font-medium">Error:</p>
          <p className="text-sm text-red-600">{error.message}</p>
        </div>
      )}

      {txResult && (
        <div className={`mt-4 p-4 rounded-lg ${txResult.success ? 'bg-green-50' : 'bg-red-50'}`}>
          <p className={`font-medium ${txResult.success ? 'text-green-800' : 'text-red-800'}`}>
            {txResult.success ? 'Transfer Successful!' : 'Transfer Failed'}
          </p>
          {txResult.success && txResult.results && (
            <div className="mt-2 space-y-2">
              {txResult.results.map(({ chainId, result }, index) => {
                const chain = CHAIN_CONFIGS.find(c => c.chainId === parseInt(chainId));
                return (
                  <div key={index} className="text-sm text-green-600">
                    {chain?.icon} {chain?.name}: Transaction {result}
                  </div>
                );
              })}
            </div>
          )}
          {!txResult.success && (
            <p className="text-sm text-red-600 mt-1">{txResult.error}</p>
          )}
        </div>
      )}
    </div>
  );
}
