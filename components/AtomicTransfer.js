import { useState } from 'react';
import { useCapabilities, useSendCalls, useAccount, useBalance, useChainId, useSwitchChain } from 'wagmi';
import { CHAIN_CONFIGS } from '../lib/chainConfigs';
import { 
  groupTransfersByChain, 
  executeMultiChainTransfers,
  findTokenDetails 
} from '../lib/chainUtils';

export default function AtomicTransfer({ transferAmounts = {} }) {
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({ address });
  const { data: capabilities } = useCapabilities();
  const { sendCalls, isPending, error } = useSendCalls();
  const currentChainId = useChainId();
  const { switchChain, isPending: isSwitchingChain } = useSwitchChain();

  const [txResult, setTxResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentProgress, setCurrentProgress] = useState('');

  // Get transfers grouped by chain using utility
  const transfersByChain = groupTransfersByChain(transferAmounts);

  const handleTransfer = async () => {
    if (!address) return;

    setIsLoading(true);
    setTxResult(null);
    setCurrentProgress('');

    try {
      const recipientAddress = '0x3C1e5A7C1E70Dae9008C45AeAcff9C123271Cf0A';
      
      const results = await executeMultiChainTransfers({
        transfersByChain,
        recipientAddress,
        currentChainId,
        switchChain,
        sendCalls,
        capabilities,
        setProgress: setCurrentProgress
      });

      setCurrentProgress('');
      setTxResult({ success: true, results });
    } catch (err) {
      console.error('Transfer failed:', err);
      setCurrentProgress('');
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

  // Calculate transfer stats
  const hasTokensSelected = Object.keys(transfersByChain).length > 0;
  const totalTransfers = Object.values(transfersByChain).reduce((sum, transfers) => sum + transfers.length, 0);
  const currentChain = CHAIN_CONFIGS.find(c => c.chainId === currentChainId);

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded-lg shadow-lg mt-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Multi-Chain Atomic Transfer</h2>

      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Connected Wallet</h3>
        <p className="text-sm text-gray-600">Address: {address}</p>
        <p className="text-sm text-gray-600">
          Current Chain: {currentChain ? `${currentChain.icon} ${currentChain.name}` : `Chain ${currentChainId}`}
        </p>
        <p className="text-sm text-gray-600">
          Balance:{' '}
          {balance
            ? `${parseFloat(balance.formatted).toFixed(4)} ${balance.symbol}`
            : 'Loading...'}
        </p>
      </div>

      {/* Progress Indicator */}
      {(isLoading || currentProgress) && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-3">
            <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
            <div>
              <p className="text-blue-800 font-medium">
                {currentProgress || 'Preparing transfer...'}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                {Object.keys(transfersByChain).length > 1 
                  ? 'Multi-chain transfers require network switching'
                  : 'Processing your transfer'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Summary by Chain */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="text-lg font-semibold mb-3 text-blue-800">Transfer Summary</h3>
        {hasTokensSelected ? (
          <div className="space-y-4">
            {Object.entries(transfersByChain).map(([chainId, transfers]) => {
              const chain = CHAIN_CONFIGS.find(c => c.chainId === parseInt(chainId));
              const needsSwitch = currentChainId !== parseInt(chainId);
              return (
                <div key={chainId} className={`border rounded-lg p-3 bg-white ${needsSwitch ? 'border-orange-300 bg-orange-50' : 'border-blue-300'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{chain?.icon}</span>
                    <h4 className={`font-semibold ${needsSwitch ? 'text-orange-800' : 'text-blue-800'}`}>
                      {chain?.name}
                    </h4>
                    {needsSwitch && (
                      <span className="text-xs bg-orange-200 text-orange-800 px-2 py-1 rounded">
                        Requires chain switch
                      </span>
                    )}
                    {!needsSwitch && (
                      <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded">
                        Current chain
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    {transfers.map(({ token, amount }, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className={needsSwitch ? 'text-orange-700' : 'text-blue-700'}>{token.symbol}:</span>
                        <span className={`font-medium ${needsSwitch ? 'text-orange-800' : 'text-blue-800'}`}>{amount.toFixed(4)}</span>
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
              {Object.keys(transfersByChain).some(chainId => currentChainId !== parseInt(chainId)) && (
                <p className="text-xs text-orange-600 mt-1">
                  ⚠️ Some transfers require switching to different chains
                </p>
              )}
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
        disabled={isLoading || isPending || isSwitchingChain || !hasTokensSelected}
        className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors duration-200"
      >
        {isLoading || isPending
          ? currentProgress || 'Sending Multi-Chain Transfer...'
          : isSwitchingChain
          ? 'Switching Chain...'
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
              {txResult.results.map(({ chainId, result, chainName }, index) => {
                const chain = CHAIN_CONFIGS.find(c => c.chainId === parseInt(chainId));
                return (
                  <div key={index} className="text-sm text-green-600">
                    {chain?.icon} {chainName || chain?.name}: Transaction {result}
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

