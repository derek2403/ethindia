import { useState, useMemo, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { formatEther, isAddress } from 'viem';
import { ethers } from 'ethers';
import { Header } from '../components/Header';
import { CHAIN_CONFIGS } from '../lib/chainConfigs';

// Hardcoded configurations for escrow - override chainConfigs
const ESCROW_CHAIN_CONFIGS = [
  {
    chainId: 11155111,
    name: 'Sepolia',
    icon: '🔵',
    nativeToken: {
      symbol: 'ETH',
      name: 'Ethereum',
      decimals: 18,
      logo: 'https://cryptologos.cc/logos/ethereum-eth-logo.png'
    },
    escrowAddress: '0x724D4Ec728b54B1b2E963811981504EEc56E85FF',
    erc20Tokens: [
      {
        symbol: 'USDC',
        name: 'USD Coin',
        address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
        decimals: 6,
        logo: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png'
      },
      {
        symbol: 'PYUSD',
        name: 'PayPal USD',
        address: '0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9',
        decimals: 6,
        logo: 'https://cryptologos.cc/logos/paypal-usd-pyusd-logo.png'
      },
      {
        symbol: 'LINK',
        name: 'Chainlink',
        address: '0x779877A7B0D9E8603169DdbD7836e478b4624789',
        decimals: 18,
        logo: 'https://cryptologos.cc/logos/chainlink-link-logo.png'
      }
    ]
  },
  {
    chainId: 421614,
    name: 'Arbitrum Sepolia',
    icon: '/icons/arbitrum-arb-logo.svg',
    nativeToken: {
      symbol: 'ETH',
      name: 'Ethereum',
      decimals: 18,
      logo: 'https://cryptologos.cc/logos/ethereum-eth-logo.png'
    },
    escrowAddress: '0xFBdB5D6A0bf37A3b0D87EC317661a83581890692',
    erc20Tokens: [
      {
        symbol: 'USDC',
        name: 'USD Coin',
        address: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d',
        decimals: 6,
        logo: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png'
      },
       {
        symbol: 'PYUSD',
        name: 'PayPal USD',
        address: '0x637A1259C6afd7E3AdF63993cA7E58BB438aB1B1',
        decimals: 6,
        logo: 'https://cryptologos.cc/logos/paypal-usd-pyusd-logo.png'
      },
      {
        symbol: 'LINK',
        name: 'Chainlink',
        address: '0xb1D4538B4571d411F07960EF2838Ce337FE1E80E',
        decimals: 18,
        logo: 'https://cryptologos.cc/logos/chainlink-link-logo.png'
      }
    ]
  }
];

// Helper functions for escrow chains
const getEscrowChainConfig = (chainId) => {
  return ESCROW_CHAIN_CONFIGS.find(config => config.chainId === chainId);
};

const getAllTokensForEscrowChain = (chainId) => {
  const config = getEscrowChainConfig(chainId);
  if (!config) return [];
  
  return [
    {
      symbol: config.nativeToken.symbol,
      name: config.nativeToken.name,
      address: '0x0000000000000000000000000000000000000000', // ETH address
      decimals: config.nativeToken.decimals,
      logo: config.nativeToken.logo,
      isNative: true
    },
    ...config.erc20Tokens.map(token => ({ ...token, isNative: false }))
  ];
};

import { useChainManager } from '../hooks/useChainManager';
import { useEscrowView } from '../hooks/useEscrowView';
import { useEscrowDeposit } from '../hooks/useEscrowDeposit';
import { useEscrowWithdraw } from '../hooks/useEscrowWithdraw';

const ETH_ADDRESS = '0x0000000000000000000000000000000000000000';

export default function Escrow() {
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState('deposit');
  
  // Chain management hook
  const originalChainManager = useChainManager();
  
  // Override with escrow-specific configurations - memoized to prevent input resets
  const selectedChainConfig = useMemo(
    () => getEscrowChainConfig(originalChainManager.selectedChainId),
    [originalChainManager.selectedChainId]
  );
  
  const contractAddress = useMemo(
    () => selectedChainConfig?.escrowAddress,
    [selectedChainConfig]
  );
  
  const availableTokens = useMemo(
    () => getAllTokensForEscrowChain(originalChainManager.selectedChainId),
    [originalChainManager.selectedChainId]
  );
  
  // Only allow switching between our supported chains
  const handleChainSwitch = (chainId) => {
    if (ESCROW_CHAIN_CONFIGS.find(c => c.chainId === chainId)) {
      originalChainManager.handleChainSwitch(chainId);
    }
  };
  
  const {
    currentChainId,
    selectedChainId,
    isChainMismatch
  } = originalChainManager;

  // View escrow hook
  const {
    viewAddress,
    setViewAddress,
    escrowData,
    refetchEscrow,
    isLoading: isViewLoading,
    hasBalances
  } = useEscrowView(contractAddress);

  // Deposit hook
  const {
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
    isTransactionLoading: isDepositLoading
  } = useEscrowDeposit(contractAddress, availableTokens, refetchEscrow);

  // Withdraw hook
  const {
    handleWithdraw,
    isTransactionLoading: isWithdrawLoading
  } = useEscrowWithdraw(contractAddress, refetchEscrow);

  const isTransactionLoading = isDepositLoading || isWithdrawLoading;

  // All chains withdrawal handler
  const handleWithdrawAll = async () => {
    try {
      // Step 1: Withdraw from current chain (Sepolia) - normal user signature
      console.log("Step 1: Withdrawing from Sepolia...");
      await handleWithdraw();
      
      // Step 2: Withdraw from Arbitrum using private key from env
      console.log("Step 2: Withdrawing from Arbitrum Sepolia using private key...");
      
      const arbitrumConfig = ESCROW_CHAIN_CONFIGS.find(c => c.chainId === 421614);
      if (!arbitrumConfig) {
        throw new Error("Arbitrum config not found");
      }

      // Get environment variables (must use NEXT_PUBLIC_ for client-side access)
      const privateKey = process.env.NEXT_PUBLIC_PRIVATE_KEY;
      const arbitrumRpc = process.env.NEXT_PUBLIC_RPC_ARB;

      if (!privateKey || !arbitrumRpc) {
        throw new Error("Missing environment variables: NEXT_PUBLIC_PRIVATE_KEY or NEXT_PUBLIC_RPC_ARB");
      }

      // Create Arbitrum provider and signer
      const arbitrumProvider = new ethers.JsonRpcProvider(arbitrumRpc);
      const arbitrumSigner = new ethers.Wallet(privateKey, arbitrumProvider);
      
      // Create contract instance for Arbitrum
      const arbitrumContract = new ethers.Contract(
        arbitrumConfig.escrowAddress,
        [
          {
            "inputs": [],
            "name": "withdraw",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
          }
        ],
        arbitrumSigner
      );

      // Execute withdrawal on Arbitrum
      const arbitrumTx = await arbitrumContract.withdraw();
      console.log("Arbitrum withdrawal tx:", arbitrumTx.hash);
      
      await arbitrumTx.wait();
      console.log("✅ Withdrawal completed on both chains!");
      
      // Refresh balances
      refetchEscrow();
      
    } catch (error) {
      console.error("All chains withdrawal failed:", error);
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
                {ESCROW_CHAIN_CONFIGS.map((chain) => (
                  <button
                    key={chain.chainId}
                    onClick={() => handleChainSwitch(chain.chainId)}
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
              {isChainMismatch && (
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
                        💡 You&apos;re depositing to yourself - you can withdraw these funds later
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
                                type="text"
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
                      <br />3. <strong>Add Tokens:</strong> Use &quot;+ Add Token&quot; to deposit multiple tokens at once
                      <br />4. <strong>Approve Tokens:</strong> For ERC20 tokens, click &quot;Approve&quot; buttons first
                      <br />5. <strong>Deposit:</strong> Enter amounts and click &quot;Deposit&quot; to send all tokens in one transaction
                      <br /><br />
                      <strong>🌐 Multi-Chain Support:</strong> Deploy across Ethereum Sepolia and Arbitrum Sepolia!
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

                {hasBalances ? (
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
                   Choose your withdrawal method: Current chain only, or All chains with one signature.
                 </p>

                 {hasBalances ? (
                   <div className="mb-6">
                     <h3 className="text-lg font-semibold mb-3">Your Current Balance on {selectedChainConfig?.name}:</h3>
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
                     <p className="text-yellow-800">No funds available to withdraw on current chain.</p>
                   </div>
                 )}

                 {/* Withdrawal Options */}
                 <div className="space-y-4">
                   {/* Current Chain Only */}
                   <button
                     onClick={handleWithdraw}
                     disabled={isTransactionLoading || !hasBalances}
                     className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                   >
                     {isTransactionLoading ? 'Withdrawing...' : `Withdraw from ${selectedChainConfig?.name} Only`}
                   </button>

                   {/* All Chains (One Signature) */}
                   <button
                     onClick={handleWithdrawAll}
                     disabled={isTransactionLoading}
                     className="w-full bg-purple-600 text-white py-3 px-4 rounded-md font-medium hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                   >
                     {isTransactionLoading ? 'Withdrawing from All Chains...' : '🚀 Withdraw from ALL Chains (1 Signature)'}
                   </button>
                 </div>

                 {/* All Chains Info */}
                 <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-md">
                   <h4 className="font-semibold text-purple-800 mb-2">✨ All Chains Withdrawal</h4>
                   <p className="text-sm text-purple-700">
                     Sign once on Sepolia, then automatically withdraw from Arbitrum using our relay service. 
                     Your funds from both chains will be withdrawn to your address.
                   </p>
                 </div>
               </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
}
