import { useState } from 'react';
import { useCapabilities, useSendCalls, useAccount, useBalance } from 'wagmi';
import { parseUnits, encodeAbiParameters, encodeFunctionData } from 'viem';
import { ethers } from 'ethers';

// Multi-chain configuration with escrow contracts
const CHAINS = {
  sepolia: {
    chainId: 11155111,
    label: 'Ethereum Sepolia',
    key: 'sepolia',
    escrow: '0x610c598A1B4BF710a10934EA47E4992a9897fad1',
    explorer: 'https://sepolia.etherscan.io/tx/',
    atomicSupported: true, // EIP-5792 well supported
    native: { symbol: 'ETH', decimals: 18 },
    erc20s: [
      { symbol: 'PYUSD', token: '0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9', decimals: 6 },
      { symbol: 'LINK', token: '0x779877A7B0D9E8603169DdbD7836e478b4624789', decimals: 18 },
    ],
  },
  flow: {
    chainId: 747, // Flow EVM Testnet
    label: 'Flow EVM Testnet',
    key: 'flow',
    escrow: '0x81aB919673b29B07AFC0191Cb9A4c2EE1b518fe3',
    explorer: 'https://evm-testnet.flowscan.io/tx/',
    atomicSupported: false, // Limited EIP-5792 support
    native: { symbol: 'FLOW', decimals: 18 },
    erc20s: [],
  },
  hedera: {
    chainId: 296, // Hedera Testnet
    label: 'Hedera Testnet', 
    key: 'hedera',
    escrow: '0x0772b7b4Dce613e75fde92e2bBfe351aE06ffc6b',
    explorer: 'https://hashscan.io/testnet/transaction/',
    atomicSupported: false, // Limited EIP-5792 support
    native: { symbol: 'HBAR', decimals: 18 },
    erc20s: [
      { symbol: 'USDC', token: '0x1234567890123456789012345678901234567890', decimals: 6 }, // Placeholder - update with real address
    ],
  },
};

// Escrow ABI for encoding function calls
const ESCROW_ABI = [
  'function depositFor(address from, address[] merchants, address[] tokens, uint256[] amounts) external payable'
];

export default function AtomicEscrowTransfer({ merchant, transferAmounts, setTransferAmounts }) {
  const { address, isConnected, chainId } = useAccount();
  const { data: capabilities } = useCapabilities();
  const { sendCalls, isPending, error } = useSendCalls();

  const [txResults, setTxResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Get current chain info
  const currentChain = Object.values(CHAINS).find(c => c.chainId === chainId);
  
  // Get balances for current chain (hooks must be called at top level)
  const ethBalance = useBalance({ address });
  const pyusdBalance = useBalance({ 
    address, 
    token: currentChain?.erc20s.find(t => t.symbol === 'PYUSD')?.token 
  });
  const linkBalance = useBalance({ 
    address, 
    token: currentChain?.erc20s.find(t => t.symbol === 'LINK')?.token 
  });
  const usdcBalance = useBalance({
    address,
    token: currentChain?.erc20s.find(t => t.symbol === 'USDC')?.token
  });

  // Organize balances by chain:token format
  const balances = {};
  if (currentChain) {
    balances[`${currentChain.key}:${currentChain.native.symbol}`] = ethBalance.data;
    if (pyusdBalance.data) balances[`${currentChain.key}:PYUSD`] = pyusdBalance.data;
    if (linkBalance.data) balances[`${currentChain.key}:LINK`] = linkBalance.data;
    if (usdcBalance.data) balances[`${currentChain.key}:USDC`] = usdcBalance.data;
  }

  const handleSliderChange = (chainKey, tokenSymbol, value) => {
    const key = `${chainKey}:${tokenSymbol}`;
    setTransferAmounts(prev => ({ ...prev, [key]: value }));
  };

  const formatBalance = (balance, decimals) => {
    if (!balance) return '0.00';
    return parseFloat(balance.formatted).toFixed(4);
  };

  const getTokenBalance = (chainKey, tokenSymbol) => {
    const key = `${chainKey}:${tokenSymbol}`;
    return balances[key];
  };

  const handleAtomicEscrowTransfer = async () => {
    if (!address || !merchant || !ethers.isAddress(merchant)) {
      alert('Please connect wallet and enter a valid merchant address');
      return;
    }

    if (!currentChain) {
      alert('Current chain not supported for atomic transfers');
      return;
    }

    setIsLoading(true);
    setTxResults(null);

    try {
      const calls = [];
      let totalNativeValue = 0n;

      // Collect all amounts for current chain
      const merchants = [];
      const tokens = [];
      const amounts = [];

      // Process native token
      const nativeKey = `${currentChain.key}:${currentChain.native.symbol}`;
      const nativeAmount = transferAmounts[nativeKey];
      if (nativeAmount && Number(nativeAmount) > 0) {
        const amountWei = parseUnits(nativeAmount.toString(), currentChain.native.decimals);
        merchants.push(merchant);
        tokens.push('0x0000000000000000000000000000000000000000'); // Zero address for native
        amounts.push(amountWei);
        totalNativeValue += amountWei;
      }

      // Process ERC-20 tokens
      for (const token of currentChain.erc20s || []) {
        const tokenKey = `${currentChain.key}:${token.symbol}`;
        const tokenAmount = transferAmounts[tokenKey];
        if (tokenAmount && Number(tokenAmount) > 0) {
          const amountWei = parseUnits(tokenAmount.toString(), token.decimals);
          merchants.push(merchant);
          tokens.push(token.token);
          amounts.push(amountWei);
        }
      }

      if (merchants.length === 0) {
        throw new Error('No transfer amounts selected');
      }

      // Encode the depositFor function call
      const depositData = encodeFunctionData({
        abi: ESCROW_ABI,
        functionName: 'depositFor',
        args: [address, merchants, tokens, amounts]
      });

      // Create atomic call to escrow contract
      calls.push({
        to: currentChain.escrow,
        data: depositData,
        value: totalNativeValue
      });

      // Check for atomic capabilities
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
        capabilities: Object.keys(callCapabilities).length > 0
          ? callCapabilities
          : undefined,
      });

      // Prepare result with explorer link
      const txData = [{
        chainKey: currentChain.key,
        chainLabel: currentChain.label,
        txHash: result,
        explorerUrl: `${currentChain.explorer}${result}`
      }];

      setTxResults(txData);
    } catch (err) {
      console.error('Atomic escrow transfer failed:', err);
      alert(`Transfer failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="p-6 max-w-md mx-auto bg-yellow-50 rounded-lg">
        <p className="text-yellow-800">
          Please connect your wallet to use atomic escrow transfers
        </p>
      </div>
    );
  }

  if (!currentChain) {
    return (
      <div className="p-6 max-w-md mx-auto bg-red-50 rounded-lg">
        <p className="text-red-800">
          Current chain (ID: {chainId}) not supported for atomic transfers.
          Please switch to Ethereum Sepolia.
        </p>
      </div>
    );
  }

  const tokensToTransfer = Object.entries(transferAmounts)
    .filter(([key, amount]) => amount > 0)
    .map(([key, amount]) => {
      const [chainKey, symbol] = key.split(':');
      const chain = CHAINS[chainKey];
      return { chainKey, chainLabel: chain?.label || chainKey, symbol, amount };
    });

  const hasTokensSelected = tokensToTransfer.length > 0;

  return (
    <div className="space-y-6">
      {/* Multi-Chain Token Selection */}
      <div className="space-y-6">
        {Object.values(CHAINS).map(chain => {
          const isCurrentChain = currentChain?.key === chain.key;
          
          return (
            <div key={chain.key} className="p-6 bg-white rounded-lg shadow-lg">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  {chain.label}
                </h2>
                <div className="flex items-center gap-2">
                  {isCurrentChain ? (
                    <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                      ✅ Connected
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
                      Switch network for balances
                    </span>
                  )}
                  {!chain.atomicSupported && (
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full">
                      ⚠️ Limited atomic support
                    </span>
                  )}
                </div>
              </div>
              
              <div className="space-y-4">
                {/* Native Token */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <div className="font-semibold">{chain.native.symbol} (native)</div>
                    <div className="text-sm text-gray-600">
                      {isCurrentChain ? (
                        <>Balance: {formatBalance(getTokenBalance(chain.key, chain.native.symbol), chain.native.decimals)} {chain.native.symbol}</>
                      ) : (
                        <>Switch to {chain.label} to see balance</>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between items-center mb-3">
                    <label>Escrow Amount</label>
                    <span>{(transferAmounts[`${chain.key}:${chain.native.symbol}`] || 0).toFixed(4)} {chain.native.symbol}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={isCurrentChain ? parseFloat(formatBalance(getTokenBalance(chain.key, chain.native.symbol), chain.native.decimals)) : 10}
                    step="0.0001"
                    value={transferAmounts[`${chain.key}:${chain.native.symbol}`] || 0}
                    onChange={(e) => handleSliderChange(chain.key, chain.native.symbol, parseFloat(e.target.value))}
                    className="w-full"
                  />
                  {isCurrentChain && (
                    <div className="flex gap-2 mt-2">
                      {[25, 50, 75, 100].map(p => (
                        <button
                          key={p}
                          onClick={() => {
                            const balance = parseFloat(formatBalance(getTokenBalance(chain.key, chain.native.symbol), chain.native.decimals));
                            handleSliderChange(chain.key, chain.native.symbol, (balance * p) / 100);
                          }}
                          className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                        >
                          {p}%
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* ERC-20 Tokens */}
                {chain.erc20s?.map(token => (
                  <div key={token.symbol} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <div className="font-semibold">{token.symbol}</div>
                      <div className="text-sm text-gray-600">
                        {isCurrentChain ? (
                          <>Balance: {formatBalance(getTokenBalance(chain.key, token.symbol), token.decimals)} {token.symbol}</>
                        ) : (
                          <>Switch to {chain.label} to see balance</>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between items-center mb-3">
                      <label>Escrow Amount</label>
                      <span>{(transferAmounts[`${chain.key}:${token.symbol}`] || 0).toFixed(4)} {token.symbol}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max={isCurrentChain ? parseFloat(formatBalance(getTokenBalance(chain.key, token.symbol), token.decimals)) : 1000}
                      step="0.0001"
                      value={transferAmounts[`${chain.key}:${token.symbol}`] || 0}
                      onChange={(e) => handleSliderChange(chain.key, token.symbol, parseFloat(e.target.value))}
                      className="w-full"
                    />
                    {isCurrentChain && (
                      <div className="flex gap-2 mt-2">
                        {[25, 50, 75, 100].map(p => (
                          <button
                            key={p}
                            onClick={() => {
                              const balance = parseFloat(formatBalance(getTokenBalance(chain.key, token.symbol), token.decimals));
                              handleSliderChange(chain.key, token.symbol, (balance * p) / 100);
                            }}
                            className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                          >
                            {p}%
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="mt-4 text-xs text-gray-600 bg-gray-50 p-3 rounded">
                <p><strong>Escrow:</strong> {chain.escrow}</p>
                {!chain.atomicSupported && (
                  <p className="mt-1 text-yellow-700">
                    <strong>Note:</strong> This chain has limited EIP-5792 support. Transfers may fall back to regular transactions.
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Multi-Chain Transfer Summary */}
      <div className="p-6 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="text-lg font-semibold mb-3 text-blue-800">Multi-Chain Escrow Transfer Summary</h3>
        {hasTokensSelected ? (
          <div className="space-y-3">
            {tokensToTransfer.map(({ chainKey, chainLabel, symbol, amount }, index) => (
              <div key={`${chainKey}:${symbol}`} className="flex justify-between items-center text-sm">
                <span className="text-blue-700">
                  <span className="font-medium">{chainLabel}</span> - {symbol}:
                </span>
                <span className="font-medium text-blue-800">{amount.toFixed(4)}</span>
              </div>
            ))}
            <div className="pt-3 border-t border-blue-300">
              <p className="text-xs text-blue-600 mb-1">
                <strong>Merchant:</strong> {merchant || 'Not set'}
              </p>
              <p className="text-xs text-blue-600">
                <strong>Selected Chains:</strong> {[...new Set(tokensToTransfer.map(t => t.chainLabel))].join(', ')}
              </p>
              {!currentChain?.atomicSupported && tokensToTransfer.some(t => t.chainKey === currentChain?.key) && (
                <p className="text-xs text-yellow-700 mt-2">
                  ⚠️ Current chain has limited atomic support - may fall back to regular transfers
                </p>
              )}
            </div>
          </div>
        ) : (
          <p className="text-blue-600 text-sm">No tokens selected. Use the sliders above to choose amounts from any chain.</p>
        )}
      </div>

      {/* EIP-5792 Support Status */}
      <div className="p-3 rounded-lg text-sm">
        {capabilities && Object.keys(capabilities).length > 0 ? (
          <div className="bg-green-50 text-green-700 p-3 rounded">
            ✅ EIP-5792 atomic capabilities detected - Atomic escrow transfers supported
          </div>
        ) : (
          <div className="bg-yellow-50 text-yellow-700 p-3 rounded">
            ⚠️ No EIP-5792 capabilities detected - Will attempt regular escrow transfer
          </div>
        )}
      </div>

      {/* Transfer Button */}
      <button
        onClick={handleAtomicEscrowTransfer}
        disabled={isLoading || isPending || !hasTokensSelected || !merchant || !ethers.isAddress(merchant)}
        className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors duration-200"
      >
        {isLoading || isPending
          ? 'Executing Atomic Escrow Transfer...'
          : !merchant || !ethers.isAddress(merchant)
          ? 'Enter valid merchant address'
          : !hasTokensSelected
          ? 'Select tokens to transfer'
          : `Execute Atomic Escrow Transfer (${tokensToTransfer.length} token${tokensToTransfer.length !== 1 ? 's' : ''})`}
      </button>

      {/* Transaction Results */}
      {txResults && txResults.length > 0 && (
        <div className="p-6 bg-green-50 rounded-lg border border-green-200">
          <h3 className="text-lg font-semibold mb-3 text-green-800">✅ Atomic Transfer Completed!</h3>
          <div className="space-y-2">
            {txResults.map(({ chainKey, chainLabel, txHash, explorerUrl }) => (
              <div key={chainKey} className="flex items-center gap-2">
                <span className="font-medium">{chainLabel}:</span>
                <a 
                  href={explorerUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-green-700 hover:text-green-900 font-mono text-sm"
                >
                  {txHash.slice(0, 8)}...{txHash.slice(-6)} ↗
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 rounded-lg">
          <p className="text-red-800 font-medium">Error:</p>
          <p className="text-sm text-red-600">{error.message}</p>
        </div>
      )}

      {/* Usage Notes */}
      <div className="text-xs text-gray-500 bg-gray-50 p-4 rounded-lg">
        <p className="font-medium mb-2">Multi-Chain Escrow Transfer Notes:</p>
        <ul className="space-y-1">
          <li>• <strong>Token Selection:</strong> You can select tokens from any supported chain</li>
          <li>• <strong>Balance Visibility:</strong> Switch networks to see actual token balances</li>
          <li>• <strong>ERC-20 Approvals:</strong> For ERC-20 tokens, approve the escrow contract as spender on each chain</li>
          <li>• <strong>Native Tokens:</strong> ETH/FLOW/HBAR are sent directly to escrow contracts</li>
          <li>• <strong>Atomic Transfers:</strong> EIP-5792 enables atomic execution when supported</li>
          <li>• <strong>Cross-Chain Limitation:</strong> Currently processes one chain at a time due to wallet limitations</li>
          <li>• <strong>Supported Chains:</strong> {Object.values(CHAINS).map(c => c.label).join(', ')}</li>
        </ul>
      </div>
    </div>
  );
}
