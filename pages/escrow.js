import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useReadContract, useChainId, useSwitchChain } from 'wagmi';
import { parseEther, parseUnits, formatEther, isAddress, maxUint256 } from 'viem';
import { Header } from '../components/Header';
import ABI from '../lib/ABI.json';
import { CHAIN_CONFIGS, getChainConfig, getAllTokensForChain } from '../lib/chainConfigs';

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

export default function Escrow() {
  const { address, isConnected } = useAccount();
  const currentChainId = useChainId();
  const { switchChain } = useSwitchChain();
  const [selectedChainId, setSelectedChainId] = useState(11155111); // Default to Ethereum Sepolia
  const [merchantAddress, setMerchantAddress] = useState('');
  const [viewAddress, setViewAddress] = useState('');
  const [activeTab, setActiveTab] = useState('deposit');
  
  // Get current chain config and contract address
  const selectedChainConfig = getChainConfig(selectedChainId);
  const contractAddress = selectedChainConfig?.escrowAddress;
  const availableTokens = getAllTokensForChain(selectedChainId);
  
  // Multi-token deposit state
  const [tokenSelections, setTokenSelections] = useState([
    { 
      id: 1, 
      tokenAddress: ETH_ADDRESS, 
      amount: '', 
      customTokenAddress: '', 
      tokenDecimals: 18 
    }
  ]);

  // Update selected chain when wallet chain changes
  useEffect(() => {
    if (currentChainId && CHAIN_CONFIGS.find(c => c.chainId === currentChainId)) {
      setSelectedChainId(currentChainId);
    }
  }, [currentChainId]);

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
  }, [selectedChainId]);

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

  // View escrow data
  const { data: escrowData, refetch: refetchEscrow } = useReadContract({
    address: contractAddress,
    abi: ABI,
    functionName: 'viewEscrow',
    args: [viewAddress || address],
    query: {
      enabled: (!!viewAddress || !!address) && !!contractAddress,
    }
  });

  // Write contract hook
  const { writeContract, isPending: isTransactionLoading } = useWriteContract({
    mutation: {
      onSuccess: (data, variables) => {
        if (variables.functionName === 'deposit') {
          alert('Multi-token deposit successful!');
          setMerchantAddress('');
          // Reset token selections to single ETH
          setTokenSelections([
            { 
              id: 1, 
              tokenAddress: ETH_ADDRESS, 
              amount: '', 
              customTokenAddress: '', 
              tokenDecimals: 18 
            }
          ]);
        } else if (variables.functionName === 'withdraw') {
          alert('Withdrawal successful!');
        }
        refetchEscrow();
      },
      onError: (error) => {
        alert('Transaction failed: ' + error.message);
      },
    },
  });

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

  const handleWithdraw = () => {
    writeContract({
      address: contractAddress,
      abi: ABI,
      functionName: 'withdraw',
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8">Escrow Contract</h1>
        
        {!isConnected ? (
          <div className="text-center">
            <p className="text-gray-600">Please connect your wallet to use the escrow contract</p>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            {/* Chain Selector */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">Select Network</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {CHAIN_CONFIGS.map((chain) => (
                  <button
                    key={chain.chainId}
                    onClick={() => {
                      setSelectedChainId(chain.chainId);
                      if (currentChainId !== chain.chainId) {
                        switchChain({ chainId: chain.chainId });
                      }
                    }}
                    className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                      selectedChainId === chain.chainId
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <span className="text-2xl">{chain.icon}</span>
                      <span className="font-medium text-sm text-center">{chain.name}</span>
                      {currentChainId !== chain.chainId && selectedChainId === chain.chainId && (
                        <span className="text-xs text-orange-600">Click to switch network</span>
                      )}
                      {currentChainId === chain.chainId && (
                        <span className="text-xs text-green-600">✅ Connected</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
              
              {/* Contract Address Display */}
              {contractAddress && (
                <div className="mt-4 p-3 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-600">
                    <strong>Escrow Contract:</strong> 
                    <span className="font-mono ml-2">{contractAddress}</span>
                  </p>
                </div>
              )}

              {/* Chain Mismatch Warning */}
              {currentChainId !== selectedChainId && (
                <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-md">
                  <p className="text-orange-800 text-sm">
                    ⚠️ Your wallet is connected to a different network. Please switch to <strong>{selectedChainConfig?.name}</strong> to use this escrow contract.
                  </p>
                </div>
              )}
            </div>

            {/* Navigation Tabs */}
            <div className="flex space-x-1 bg-gray-200 p-1 rounded-lg mb-6">
              <button
                onClick={() => setActiveTab('deposit')}
                className={`flex-1 py-2 px-4 rounded-md font-medium ${
                  activeTab === 'deposit' 
                    ? 'bg-white text-blue-600 shadow' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Deposit
              </button>
              <button
                onClick={() => setActiveTab('view')}
                className={`flex-1 py-2 px-4 rounded-md font-medium ${
                  activeTab === 'view' 
                    ? 'bg-white text-blue-600 shadow' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                View Escrow
              </button>
              <button
                onClick={() => setActiveTab('withdraw')}
                className={`flex-1 py-2 px-4 rounded-md font-medium ${
                  activeTab === 'withdraw' 
                    ? 'bg-white text-blue-600 shadow' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Withdraw
              </button>
            </div>

            {/* Deposit Tab */}
            {activeTab === 'deposit' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold mb-4">Multi-Token Deposit</h2>
                
                <div className="space-y-6">
                  {/* Merchant Address */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Merchant Address
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={merchantAddress}
                        onChange={(e) => setMerchantAddress(e.target.value)}
                        placeholder="0x..."
                        className="flex-1 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => setMerchantAddress(address || '')}
                        disabled={!address}
                        className="px-4 py-3 bg-gray-600 text-white rounded-md font-medium hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        Use My Address
                      </button>
                    </div>
                    {merchantAddress === address && (
                      <p className="text-sm text-blue-600 mt-1">
                        💡 You're depositing to yourself - you can withdraw these funds later
                      </p>
                    )}
                  </div>

                  {/* Token Selections */}
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <label className="block text-sm font-medium text-gray-700">
                        Token Selections ({tokenSelections.length})
                      </label>
                      <button
                        type="button"
                        onClick={addTokenSelection}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                      >
                        + Add Token
                      </button>
                    </div>

                    {tokenSelections.map((selection, index) => {
                      const currentTokenAddress = getCurrentTokenAddress(selection);
                      return (
                        <div key={selection.id} className="border border-gray-200 rounded-lg p-4 mb-4">
                          <div className="flex justify-between items-center mb-3">
                            <h4 className="font-medium text-gray-800">Token {index + 1}</h4>
                            {tokenSelections.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeTokenSelection(selection.id)}
                                className="text-red-600 hover:text-red-800 text-sm"
                              >
                                Remove
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Token Type */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Token Type
                              </label>
                              <select
                                value={selection.tokenAddress}
                                onChange={(e) => updateTokenSelection(selection.id, 'tokenAddress', e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              >
                                {availableTokens.map((token) => (
                                  <option key={token.address} value={token.address}>
                                    {token.symbol} {!token.isNative && `(${selectedChainConfig?.name})`}
                                  </option>
                                ))}
                                <option value="other">Custom Token Address</option>
                              </select>
                            </div>

                            {/* Amount */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Amount ({selection.tokenDecimals} decimals)
                              </label>
                              <input
                                type="number"
                                step="0.000001"
                                value={selection.amount}
                                onChange={(e) => updateTokenSelection(selection.id, 'amount', e.target.value)}
                                placeholder={currentTokenAddress === ETH_ADDRESS ? "0.001" : "1000"}
                                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                          </div>

                          {/* Custom Token Address */}
                          {selection.tokenAddress === 'other' && (
                            <div className="mt-4">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Custom Token Address
                              </label>
                              <input
                                type="text"
                                value={selection.customTokenAddress}
                                onChange={(e) => updateTokenSelection(selection.id, 'customTokenAddress', e.target.value)}
                                placeholder="0x..."
                                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                              {isAddress(selection.customTokenAddress) && (
                                <p className="text-sm text-green-600 mt-1">
                                  ✅ Valid address • Decimals: {selection.tokenDecimals}
                                </p>
                              )}
                            </div>
                          )}

                          {/* Individual Approve Button */}
                          {currentTokenAddress !== ETH_ADDRESS && isAddress(currentTokenAddress) && (
                            <div className="mt-4">
                              <button
                                onClick={() => handleApprove(currentTokenAddress)}
                                disabled={isTransactionLoading}
                                className="w-full bg-yellow-600 text-white py-2 px-4 rounded-md font-medium hover:bg-yellow-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                              >
                                {isTransactionLoading ? 'Approving...' : `Approve ${currentTokenAddress.slice(0, 6)}...`}
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Deposit Summary */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-800 mb-2">Deposit Summary</h4>
                    {tokenSelections.map((selection, index) => {
                      const currentTokenAddress = getCurrentTokenAddress(selection);
                      const token = availableTokens.find(t => t.address === currentTokenAddress);
                      const tokenName = token ? token.symbol : `Token ${index + 1}`;
                      
                      return selection.amount ? (
                        <div key={selection.id} className="flex justify-between text-sm">
                          <span>{tokenName}:</span>
                          <span className="font-medium">{selection.amount}</span>
                        </div>
                      ) : null;
                    })}
                  </div>

                  {/* Main Deposit Button */}
                  <button
                    onClick={handleDeposit}
                    disabled={
                      isTransactionLoading || 
                      !merchantAddress || 
                      !tokenSelections.some(s => s.amount)
                    }
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {isTransactionLoading ? 'Depositing...' : `Deposit ${tokenSelections.length} Token(s)`}
                  </button>

                  {/* Instructions */}
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                    <p className="text-sm text-blue-800">
                      <strong>Multi-Chain Multi-Token Escrow Instructions:</strong> 
                      <br />1. <strong>Select Network:</strong> Choose your preferred blockchain network above
                      <br />2. <strong>Switch Wallet:</strong> Ensure your wallet is connected to the selected network
                      <br />3. <strong>Add Tokens:</strong> Use "+ Add Token" to deposit multiple tokens at once
                      <br />4. <strong>Approve Tokens:</strong> For ERC20 tokens, click "Approve" buttons first
                      <br />5. <strong>Deposit:</strong> Enter amounts and click "Deposit" to send all tokens in one transaction
                      <br /><br />
                      <strong>🌐 Multi-Chain Support:</strong> Deploy across Ethereum, Arbitrum, Flow EVM, and Hedera!
                      <br /><strong>✨ Batch Deposit Benefits:</strong> Save gas fees by depositing multiple tokens at once!
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* View Tab */}
            {activeTab === 'view' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold mb-4">View Escrow Balance</h2>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address to Check (leave empty to check your own)
                  </label>
                  <input
                    type="text"
                    value={viewAddress}
                    onChange={(e) => setViewAddress(e.target.value)}
                    placeholder={address || "0x..."}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <button
                  onClick={() => refetchEscrow()}
                  className="mb-6 bg-green-600 text-white py-2 px-4 rounded-md font-medium hover:bg-green-700"
                >
                  Refresh Balances
                </button>

                {escrowData && escrowData[0]?.length > 0 ? (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Escrow Balances:</h3>
                    {escrowData[0].map((token, index) => {
                      const tokenConfig = availableTokens.find(t => t.address === token);
                      const tokenName = tokenConfig ? tokenConfig.symbol : `Token: ${token}`;
                      const isNativeToken = token === ETH_ADDRESS;
                      
                      return (
                        <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                          <span className="font-medium">{tokenName}</span>
                          <span className="text-lg">
                            {isNativeToken 
                              ? formatEther(escrowData[1][index]) + ` ${selectedChainConfig?.nativeToken.symbol || 'ETH'}`
                              : `${escrowData[1][index].toString()} ${tokenName}`
                            }
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-600">No escrow balance found for this address.</p>
                )}
              </div>
            )}

            {/* Withdraw Tab */}
            {activeTab === 'withdraw' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold mb-4">Withdraw Funds</h2>
                <p className="text-gray-600 mb-6">
                  This will withdraw all your accumulated funds (ETH and tokens) from the escrow contract.
                </p>

                {escrowData && escrowData[0]?.length > 0 ? (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3">Your Current Balance:</h3>
                    <div className="space-y-2">
                      {escrowData[0].map((token, index) => {
                        const tokenConfig = availableTokens.find(t => t.address === token);
                        const tokenName = tokenConfig ? tokenConfig.symbol : `Token: ${token}`;
                        const isNativeToken = token === ETH_ADDRESS;
                        
                        return (
                          <div key={index} className="flex justify-between items-center p-3 bg-green-50 rounded-md">
                            <span className="font-medium">{tokenName}</span>
                            <span className="text-lg text-green-600">
                              {isNativeToken 
                                ? formatEther(escrowData[1][index]) + ` ${selectedChainConfig?.nativeToken.symbol || 'ETH'}`
                                : `${escrowData[1][index].toString()} ${tokenName}`
                              }
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="mb-6 p-4 bg-yellow-50 rounded-md">
                    <p className="text-yellow-800">No funds available to withdraw.</p>
                  </div>
                )}

                <button
                  onClick={handleWithdraw}
                  disabled={isTransactionLoading || !escrowData?.[0]?.length}
                  className="w-full bg-red-600 text-white py-3 px-4 rounded-md font-medium hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isTransactionLoading ? 'Withdrawing...' : 'Withdraw All Funds'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
