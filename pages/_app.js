import "@/styles/globals.css";
import '@rainbow-me/rainbowkit/styles.css';
import React, { useEffect } from 'react';

import {
  getDefaultConfig,
  RainbowKitProvider,
} from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import {
  mainnet,
  polygon,
  optimism,
  arbitrum,
  base,
  sepolia,
} from 'wagmi/chains';

// Custom chain definitions for testnets
const flowEVMTestnet = {
  id: 545,
  name: 'Flow EVM Testnet',
  nativeCurrency: { name: 'Flow', symbol: 'FLOW', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://testnet.evm.nodes.onflow.org'] },
    public: { http: ['https://testnet.evm.nodes.onflow.org'] }
  },
  blockExplorers: {
    default: { name: 'Flow Diver', url: 'https://testnet.flowdiver.io' }
  },
  testnet: true
};

const hederaTestnet = {
  id: 296,
  name: 'Hedera Testnet',
  nativeCurrency: { name: 'HBAR', symbol: 'HBAR', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://testnet.hashio.io/api'] },
    public: { http: ['https://testnet.hashio.io/api'] }
  },
  blockExplorers: {
    default: { name: 'HashScan', url: 'https://hashscan.io/testnet' }
  },
  testnet: true
};
import {
  QueryClientProvider,
  QueryClient,
} from "@tanstack/react-query";

const config = getDefaultConfig({
  appName: 'ethindia',
  projectId: '1',
  chains: [sepolia, flowEVMTestnet, hederaTestnet, mainnet, polygon, optimism, arbitrum, base],
  ssr: true,
});

const queryClient = new QueryClient();
import { Nunito } from "next/font/google";

const nunito = Nunito({ subsets: ["latin"], display: "swap" });

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Only log non-analytics errors to avoid spam
    if (!error.message.includes('Analytics SDK') && 
        !error.message.includes('Failed to fetch') &&
        !error.stack.includes('cca-lite.coinbase.com')) {
      console.error('Error caught by boundary:', error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      // Reset error state and continue rendering
      this.setState({ hasError: false });
    }
    return this.props.children;
  }
}

// Global error handler for unhandled promise rejections
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', function(event) {
    // Check if it's an analytics-related error
    const isAnalyticsError = event.reason && (
      event.reason.message?.includes('Analytics SDK') ||
      event.reason.message?.includes('Failed to fetch') ||
      event.reason.stack?.includes('cca-lite.coinbase.com') ||
      event.reason.stack?.includes('pulse.walletconnect.org')
    );
    
    if (isAnalyticsError) {
      // Prevent the error from showing in console/UI
      event.preventDefault();
      return false;
    }
  });

  // Override console.error for specific analytics errors
  const originalConsoleError = console.error;
  console.error = function(...args) {
    const errorMessage = args.join(' ');
    
    // Filter out known analytics errors
    if (errorMessage.includes('Analytics SDK') ||
        errorMessage.includes('Failed to fetch') ||
        errorMessage.includes('cca-lite.coinbase.com') ||
        errorMessage.includes('pulse.walletconnect.org')) {
      return; // Don't log these errors
    }
    
    // Log all other errors normally
    originalConsoleError.apply(console, args);
  };
}

export default function App({ Component, pageProps }) {
  return (
    <ErrorBoundary>
      <div className={nunito.className}>
        <WagmiProvider config={config}>
          <QueryClientProvider client={queryClient}>
            <RainbowKitProvider>
              <Component {...pageProps} />
            </RainbowKitProvider>
          </QueryClientProvider>
        </WagmiProvider>
      </div>
    </ErrorBoundary>
  );
}
