// Chain configurations with their native and available ERC20 tokens
export const CHAIN_CONFIGS = [
  {
    chainId: 11155111,
    name: 'Sepolia',
    icon: '🔵',
    nativeToken: {
      symbol: 'ETH',
      name: 'Ethereum',
      decimals: 18,
      logo: '/icons/ethereum-eth-logo.svg'
    },
    erc20Tokens: [
      {
        symbol: 'USDC',
        name: 'USD Coin',
        address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
        decimals: 6,
        logo: '/icons/usd-coin-usdc-logo.svg'
      },
      {
        symbol: 'PYUSD',
        name: 'PayPal USD',
        address: '0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9',
        decimals: 6,
        logo: '/icons/paypal-usd-pyusd-logo.svg'
      },
      {
        symbol: 'LINK',
        name: 'Chainlink',
        address: '0x779877A7B0D9E8603169DdbD7836e478b4624789',
        decimals: 18,
        logo: '/icons/ethereum-eth-logo.svg' // Using ETH icon as fallback since no LINK icon available
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
      logo: '/icons/flow-flow-logo.svg'
    },
    erc20Tokens: [
      // TODO: Add actual USDC, PYUSD, LINK addresses on Flow when available
      // For now, we'll use placeholder addresses and they won't show if balance is 0
      {
        symbol: 'USDC',
        name: 'USD Coin',
        address: '0x0000000000000000000000000000000000000001', // Placeholder
        decimals: 6,
        logo: '/icons/usd-coin-usdc-logo.svg'
      },
      {
        symbol: 'PYUSD',
        name: 'PayPal USD',
        address: '0x0000000000000000000000000000000000000002', // Placeholder
        decimals: 6,
        logo: '/icons/paypal-usd-pyusd-logo.svg'
      },
      {
        symbol: 'LINK',
        name: 'Chainlink',
        address: '0x0000000000000000000000000000000000000003', // Placeholder
        decimals: 18,
        logo: '/icons/ethereum-eth-logo.svg' // Using ETH icon as fallback since no LINK icon available
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
      logo: '/icons/hedera-hbar-logo.svg'
    },
    erc20Tokens: [
      // TODO: Add actual USDC, PYUSD, LINK addresses on Hedera when available
      {
        symbol: 'USDC',
        name: 'USD Coin',
        address: '0x0000000000000000000000000000000000000001', // Placeholder
        decimals: 6,
        logo: '/icons/usd-coin-usdc-logo.svg'
      },
      {
        symbol: 'PYUSD',
        name: 'PayPal USD',
        address: '0x0000000000000000000000000000000000000002', // Placeholder
        decimals: 6,
        logo: '/icons/paypal-usd-pyusd-logo.svg'
      },
      {
        symbol: 'LINK',
        name: 'Chainlink',
        address: '0x0000000000000000000000000000000000000003', // Placeholder
        decimals: 18,
        logo: '/icons/ethereum-eth-logo.svg' // Using ETH icon as fallback since no LINK icon available
      }
    ]
  }
];
