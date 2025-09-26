import { useAccount } from 'wagmi';

// Token configurations for Sepolia testnet
const TOKENS = [
  {
    symbol: 'ETH',
    name: 'Ethereum',
    address: null, // Native ETH
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

export default function TokenBalance() {
  const { address, isConnected } = useAccount();

  if (!isConnected) {
    return (
      <div className="p-6 max-w-2xl mx-auto bg-yellow-50 rounded-lg border border-yellow-200">
        <p className="text-yellow-800 text-center">
          Please connect your wallet to view token balances
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Token Balances & Transfer</h2>
      
      <div className="space-y-6">
        {TOKENS.map(token => (
          <div key={token.symbol} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <img 
                src={token.logo} 
                alt={token.name}
                className="w-10 h-10 rounded-full"
              />
              <div>
                <h3 className="font-semibold text-lg">{token.name}</h3>
                <p className="text-sm text-gray-600">{token.symbol}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
