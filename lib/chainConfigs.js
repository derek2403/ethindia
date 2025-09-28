// Chain configurations with their native and available ERC20 tokens
export const CHAIN_CONFIGS = [
  {
    chainId: 11155111,
    name: 'Sepolia',
    icon: '/icons/ethereum-eth-logo-colored.svg',
    nativeToken: {
      symbol: 'ETH',
      name: 'Ethereum',
      decimals: 18,
      logo: '/icons/ethereum-eth-logo-colored.svg'
    },
    escrowAddress: '0xd58Ff1d0865b25f3C9D0Fca171890Ca92CCE870e',
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
        logo: '/icons/chainlink-link-logo.svg'
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
    escrowAddress: '0x845eCA8895048c24Cd24Fa658571d70123F470a2',
    erc20Tokens: [
      {
        symbol: 'USDC',
        name: 'USD Coin',
        address: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d',
        decimals: 6,
        logo: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png'
      },
      {
        symbol: 'LINK',
        name: 'Chainlink',
        address: '0xb1D4538B4571d411F07960EF2838Ce337FE1E80E',
        decimals: 18,
        logo: 'https://cryptologos.cc/logos/chainlink-link-logo.png'
      }
    ]
  },
  {
    chainId: 545,
    name: 'Flow EVM Testnet',
    icon: '/icons/flow-flow-logo.svg',
    nativeToken: {
      symbol: 'FLOW',
      name: 'Flow',
      decimals: 18,
      logo: '/icons/flow-flow-logo.svg'
    },
    escrowAddress: '0x74249245BcbAFc19C04E652eB6F308d9699Ae875',
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
        logo: '/icons/chainlink-link-logo.svg'
      }
    ]
  },
  {
    chainId: 296,
    name: 'Hedera Testnet',
    icon: '/icons/hedera-hbar-logo.svg',
    nativeToken: {
      symbol: 'HBAR',
      name: 'Hedera',
      decimals: 18,
      logo: '/icons/hedera-hbar-logo.svg'
    },
    escrowAddress: '0x0D7DA668e24E25be4DE4C6e28938bDD936579c7b',
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
        logo: '/icons/chainlink-link-logo.svg'
      }
    ]
  }
];

export const getChainConfig = (chainId) => {
  return CHAIN_CONFIGS.find(config => config.chainId === chainId);
};

export const getAllTokensForChain = (chainId) => {
  const config = getChainConfig(chainId);
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
