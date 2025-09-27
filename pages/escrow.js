import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useReadContract } from 'wagmi';
import { parseEther, parseUnits, formatEther, isAddress, maxUint256 } from 'viem';
import { Header } from '../components/Header';
import ABI from '../lib/ABI.json';

const CONTRACT_ADDRESS = '0x084E0E4C7ce7C58821B71B48Ddef628b42717A31';
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
  const [merchantAddress, setMerchantAddress] = useState('');
  const [tokenAddress, setTokenAddress] = useState(ETH_ADDRESS);
  const [amount, setAmount] = useState('');
  const [viewAddress, setViewAddress] = useState('');
  const [activeTab, setActiveTab] = useState('deposit');
  const [tokenDecimals, setTokenDecimals] = useState(18);
  const [customTokenAddress, setCustomTokenAddress] = useState('');

  // Get current token address for validation
  const currentTokenAddress = tokenAddress === 'other' ? customTokenAddress : tokenAddress;
  
  // Read token decimals
  const { data: decimalsData } = useReadContract({
    address: isAddress(currentTokenAddress) && currentTokenAddress !== ETH_ADDRESS ? currentTokenAddress : undefined,
    abi: ERC20_ABI,
    functionName: 'decimals',
    query: {
      enabled: currentTokenAddress !== ETH_ADDRESS && isAddress(currentTokenAddress)
    }
  });

  // Update token decimals when data changes
  useEffect(() => {
    if (currentTokenAddress === ETH_ADDRESS) {
      setTokenDecimals(18);
    } else if (decimalsData) {
      setTokenDecimals(Number(decimalsData));
    }
  }, [decimalsData, currentTokenAddress]);

  // View escrow data
  const { data: escrowData, refetch: refetchEscrow } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ABI,
    functionName: 'viewEscrow',
    args: [viewAddress || address],
    query: {
      enabled: !!viewAddress || !!address,
    }
  });

  // Write contract hook
  const { writeContract, isPending: isTransactionLoading } = useWriteContract({
    mutation: {
      onSuccess: (data, variables) => {
        if (variables.functionName === 'deposit') {
          alert('Deposit successful!');
          setAmount('');
          setMerchantAddress('');
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
    if (!merchantAddress || !amount) {
      alert('Please fill in all fields');
      return;
    }
    if (!isAddress(merchantAddress)) {
      alert('Invalid merchant address');
      return;
    }
    if (currentTokenAddress !== ETH_ADDRESS && !isAddress(currentTokenAddress)) {
      alert('Please enter a valid token address');
      return;
    }
    
    const tokenAmount = currentTokenAddress === ETH_ADDRESS ? 0n : parseUnits(amount, tokenDecimals);
    const ethValue = currentTokenAddress === ETH_ADDRESS ? parseUnits(amount, 18) : 0n;
    
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: ABI,
      functionName: 'deposit',
      args: [
        merchantAddress,
        currentTokenAddress,
        tokenAmount
      ],
      value: ethValue,
    });
  };

  const handleWithdraw = () => {
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: ABI,
      functionName: 'withdraw',
    });
  };

  const handleApprove = () => {
    if (currentTokenAddress === ETH_ADDRESS) {
      alert('ETH does not need approval');
      return;
    }
    if (!isAddress(currentTokenAddress)) {
      alert('Please enter a valid token address');
      return;
    }
    
    writeContract({
      address: currentTokenAddress,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [
        CONTRACT_ADDRESS,
        maxUint256 // Approve maximum amount
      ],
    });
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
                <h2 className="text-2xl font-bold mb-4">Make Deposit</h2>
                
                <div className="space-y-4">
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Token Type
                    </label>
                     <select
                       value={tokenAddress}
                       onChange={(e) => setTokenAddress(e.target.value)}
                       className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                     >
                       <option value={ETH_ADDRESS}>ETH</option>
                       <option value="0x5fd84259d66Cd46123540766Be93DFE6D43130D7">USDC (OP Sepolia)</option>
                       <option value="0x68f180fcCe6836688e9084f035309E29Bf0A2095">WBTC (OP Sepolia)</option>
                       <option value="other">Custom Token Address</option>
                     </select>
                  </div>

                  {tokenAddress === 'other' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Custom Token Address
                      </label>
                      <input
                        type="text"
                        value={customTokenAddress}
                        onChange={(e) => setCustomTokenAddress(e.target.value)}
                        placeholder="0x..."
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      {isAddress(customTokenAddress) && (
                        <p className="text-sm text-green-600 mt-1">
                          ✅ Valid address • Decimals: {tokenDecimals}
                        </p>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amount {tokenAddress === ETH_ADDRESS ? 'ETH' : 'Tokens'}
                    </label>
                    <input
                      type="number"
                      step="0.000001"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder={tokenAddress === ETH_ADDRESS ? "0.001" : "1000"}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Approve Button for Tokens */}
                  {currentTokenAddress !== ETH_ADDRESS && (
                    <button
                      onClick={handleApprove}
                      disabled={isTransactionLoading || !isAddress(currentTokenAddress)}
                      className="w-full bg-yellow-600 text-white py-3 px-4 rounded-md font-medium hover:bg-yellow-700 disabled:bg-gray-400 disabled:cursor-not-allowed mb-2"
                    >
                      {isTransactionLoading ? 'Approving...' : `Approve Token (${tokenDecimals} decimals)`}
                    </button>
                  )}

                  <button
                    onClick={handleDeposit}
                    disabled={
                      isTransactionLoading || 
                      !merchantAddress || 
                      !amount ||
                      (currentTokenAddress !== ETH_ADDRESS && !isAddress(currentTokenAddress))
                    }
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {isTransactionLoading ? 'Depositing...' : 'Deposit'}
                  </button>

                  {currentTokenAddress !== ETH_ADDRESS && (
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                      <p className="text-sm text-blue-800">
                        <strong>Instructions:</strong> 
                        <br />1. First click "Approve Token" to allow the contract to spend your tokens
                        <br />2. Wait for approval confirmation  
                        <br />3. Then click "Deposit" to send tokens to escrow
                        <br /><br />
                        <strong>Token Info:</strong> {tokenDecimals} decimals
                        {currentTokenAddress === '0x5fd84259d66Cd46123540766Be93DFE6D43130D7' && 
                          <span> • USDC uses 6 decimals (not 18)</span>
                        }
                        <br /><br />
                        <strong>Note:</strong> You can deposit to yourself or others - both are allowed!
                      </p>
                    </div>
                  )}
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
                    {escrowData[0].map((token, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                        <span className="font-medium">
                          {token === ETH_ADDRESS ? 'ETH' : `Token: ${token}`}
                        </span>
                        <span className="text-lg">
                          {token === ETH_ADDRESS 
                            ? formatEther(escrowData[1][index]) + ' ETH'
                            : escrowData[1][index].toString()
                          }
                        </span>
                      </div>
                    ))}
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
                      {escrowData[0].map((token, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-green-50 rounded-md">
                          <span className="font-medium">
                            {token === ETH_ADDRESS ? 'ETH' : `Token: ${token}`}
                          </span>
                          <span className="text-lg text-green-600">
                            {token === ETH_ADDRESS 
                              ? formatEther(escrowData[1][index]) + ' ETH'
                              : escrowData[1][index].toString()
                            }
                          </span>
                        </div>
                      ))}
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
