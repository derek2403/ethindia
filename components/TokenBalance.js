import { useAccount, useBalance } from 'wagmi';
import { formatUnits } from 'viem';

const TOKENS = [
  {
    symbol: 'ETH',
    name: 'Ethereum',
    address: null,
    decimals: 18,
    logo: 'https://cryptologos.cc/logos/ethereum-eth-logo.png'
  },
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
];

export default function TokenBalance({ transferAmounts = {}, setTransferAmounts }) {
    const { address, isConnected } = useAccount();
  
    const balances = {};
    TOKENS.forEach(token => {
      const { data: balance } = useBalance({ address, token: token.address });
      balances[token.symbol] = balance;
    });
  
    const handleSliderChange = (tokenSymbol, value) => {
      setTransferAmounts(prev => ({
        ...prev,
        [tokenSymbol]: value
      }));
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
                  <label className="text-sm font-medium text-gray-700">
                    Transfer Amount
                  </label>
                  <span className="text-sm text-gray-600">
                    {transferAmount.toFixed(4)} {token.symbol}
                  </span>
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
              </div>
            );
          })}
        </div>
      </div>
    );
  }
