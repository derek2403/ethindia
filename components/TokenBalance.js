import { useAccount, useBalance } from 'wagmi';
import { formatUnits } from 'viem';

// Chain configurations with their native and available ERC20 tokens
const CHAIN_CONFIGS = [
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
      chainId: 545,
      name: 'Flow EVM Testnet',
      icon: '🌊',
      nativeToken: {
        symbol: 'FLOW',
        name: 'Flow',
        decimals: 18,
        logo: 'https://assets.coingecko.com/coins/images/13446/small/5f6294c0c7a8cda55cb1c936_Flow_Wordmark.png'
      },
      erc20Tokens: [
        // TODO: Add actual USDC, PYUSD, LINK addresses on Flow when available
        // For now, we'll use placeholder addresses and they won't show if balance is 0
        {
          symbol: 'USDC',
          name: 'USD Coin',
          address: '0x0000000000000000000000000000000000000001', // Placeholder
          decimals: 6,
          logo: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png'
        },
        {
          symbol: 'PYUSD',
          name: 'PayPal USD',
          address: '0x0000000000000000000000000000000000000002', // Placeholder
          decimals: 6,
          logo: 'https://cryptologos.cc/logos/paypal-usd-pyusd-logo.png'
        },
        {
          symbol: 'LINK',
          name: 'Chainlink',
          address: '0x0000000000000000000000000000000000000003', // Placeholder
          decimals: 18,
          logo: 'https://cryptologos.cc/logos/chainlink-link-logo.png'
        }
      ]
    },
    {
      chainId: 296,
      name: 'Hedera Testnet',
      icon: '◇',
      nativeToken: {
        symbol: 'HBAR',
        name: 'Hedera',
        decimals: 18,
        logo: 'https://cryptologos.cc/logos/hedera-hbar-logo.png'
      },
      erc20Tokens: [
        // TODO: Add actual USDC, PYUSD, LINK addresses on Hedera when available
        {
          symbol: 'USDC',
          name: 'USD Coin',
          address: '0x0000000000000000000000000000000000000001', // Placeholder
          decimals: 6,
          logo: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png'
        },
        {
          symbol: 'PYUSD',
          name: 'PayPal USD',
          address: '0x0000000000000000000000000000000000000002', // Placeholder
          decimals: 6,
          logo: 'https://cryptologos.cc/logos/paypal-usd-pyusd-logo.png'
        },
        {
          symbol: 'LINK',
          name: 'Chainlink',
          address: '0x0000000000000000000000000000000000000003', // Placeholder
          decimals: 18,
          logo: 'https://cryptologos.cc/logos/chainlink-link-logo.png'
        }
      ]
    }
  ];
  
  

export default function TokenBalance({ transferAmounts = {}, setTransferAmounts }) {
    const { address, isConnected } = useAccount();
  
    const balances = {};
    TOKENS.forEach(token => {
      const { data: balance } = useBalance({ address, token: token.address });
      balances[token.symbol] = balance;
    });
  
    const handleSliderChange = (tokenSymbol, value) => {
      setTransferAmounts(prev => ({ ...prev, [tokenSymbol]: value }));
    };
  
    const formatBalance = (balance, decimals) => {
      if (!balance) return '0.00';
      return parseFloat(formatUnits(balance.value, decimals)).toFixed(4);
    };
  
    if (!isConnected) return <p>Please connect your wallet</p>;
  
    return (
      <div className="p-6 max-w-2xl mx-auto bg-white rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Token Balances & Transfer</h2>
        
        <div className="space-y-6">
          {TOKENS.map(token => {
            const balance = balances[token.symbol];
            const balanceFormatted = formatBalance(balance, token.decimals);
            const balanceNum = parseFloat(balanceFormatted);
            const transferAmount = transferAmounts[token.symbol] || 0;
  
            return (
              <div key={token.symbol} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <label>Transfer Amount</label>
                  <span>{transferAmount.toFixed(4)} {token.symbol}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={balanceNum}
                  step={balanceNum / 1000}
                  value={transferAmount}
                  onChange={(e) => handleSliderChange(token.symbol, parseFloat(e.target.value))}
                  disabled={balanceNum === 0}
                  className="w-full"
                />
                <div className="flex gap-2 mt-2">
                  {[25, 50, 75, 100].map(p => (
                    <button
                      key={p}
                      onClick={() => handleSliderChange(token.symbol, (balanceNum * p) / 100)}
                      disabled={balanceNum === 0}
                      className="px-3 py-1 text-xs bg-gray-100 rounded"
                    >
                      {p}%
                    </button>
                  ))}
                </div>
                {transferAmount > 0 && (
                  <div className="mt-2 text-sm text-blue-600">
                    Selected: {transferAmount.toFixed(4)} {token.symbol} 
                    ({((transferAmount / balanceNum) * 100).toFixed(1)}%)
                  </div>
                )}
              </div>
            );
          })}
        </div>
  
        {/* Transfer Summary */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-3">Transfer Summary</h3>
          <div className="space-y-2">
            {Object.entries(transferAmounts).map(([symbol, amount]) =>
              amount > 0 ? (
                <div key={symbol} className="flex justify-between text-sm">
                  <span>{symbol}:</span>
                  <span className="font-medium">{amount.toFixed(4)}</span>
                </div>
              ) : null
            )}
            {Object.values(transferAmounts).every(amount => !amount || amount === 0) && (
              <p className="text-gray-500 text-sm text-center">
                No tokens selected for transfer
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }
