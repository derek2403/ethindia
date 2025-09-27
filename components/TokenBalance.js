import { useAccount, useBalance } from 'wagmi';
import { formatUnits } from 'viem';
import { BorderBeam } from "@/components/ui/border-beam";

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
      setTransferAmounts(prev => ({ ...prev, [tokenSymbol]: value }));
    };
  
    const formatBalance = (balance, decimals) => {
      if (!balance) return '0.00';
      return parseFloat(formatUnits(balance.value, decimals)).toFixed(4);
    };
  
    if (!isConnected) return <p className="text-white/80 text-center">Please connect your wallet</p>;
  
    return (
      <div className="glass-card flex flex-col justify-start p-6 relative max-w-4xl mx-auto w-full" style={{ width: '100%', maxWidth: '800px' }}>
        <BorderBeam 
          size={120}
          duration={4}
          colorFrom="#ffffff"
          colorTo="#ffffff80"
          delay={0}
        />
        <h2 className="text-2xl font-bold mb-6 text-white">Token Balances & Transfer</h2>
        
        <div className="space-y-6">
          {TOKENS.map(token => {
            const balance = balances[token.symbol];
            const balanceFormatted = formatBalance(balance, token.decimals);
            const balanceNum = parseFloat(balanceFormatted);
            const transferAmount = transferAmounts[token.symbol] || 0;
  
            return (
              <div key={token.symbol} className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="flex justify-between items-center mb-3">
                  <label className="text-white/90">Transfer Amount</label>
                  <span className="text-white font-medium">{transferAmount.toFixed(4)} {token.symbol}</span>
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
                      className="px-3 py-1 text-xs bg-white/10 text-white/80 hover:bg-white/20 disabled:bg-white/5 disabled:text-white/40 rounded transition-colors"
                    >
                      {p}%
                    </button>
                  ))}
                </div>
                {transferAmount > 0 && (
                  <div className="mt-2 text-sm text-white/70">
                    Selected: {transferAmount.toFixed(4)} {token.symbol} 
                    ({((transferAmount / balanceNum) * 100).toFixed(1)}%)
                  </div>
                )}
              </div>
            );
          })}
        </div>
  
        {/* Transfer Summary */}
        <div className="mt-8 p-4 bg-white/5 rounded-lg border border-white/10">
          <h3 className="font-semibold mb-3 text-white">Transfer Summary</h3>
          <div className="space-y-2">
            {Object.entries(transferAmounts).map(([symbol, amount]) =>
              amount > 0 ? (
                <div key={symbol} className="flex justify-between text-sm">
                  <span className="text-white/70">{symbol}:</span>
                  <span className="font-medium text-white">{amount.toFixed(4)}</span>
                </div>
              ) : null
            )}
            {Object.values(transferAmounts).every(amount => !amount || amount === 0) && (
              <p className="text-white/60 text-sm text-center">
                No tokens selected for transfer
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }
