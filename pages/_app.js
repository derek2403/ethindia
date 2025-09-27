import "@/styles/globals.css";
import '@rainbow-me/rainbowkit/styles.css';
import React, { useEffect } from 'react';

import {
  getDefaultConfig,
  RainbowKitProvider,
  darkTheme,
  Theme,
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

// Create custom glassmorphism theme
const glassmorphismTheme = darkTheme({
  accentColor: 'rgba(255, 255, 255, 0.15)',
  accentColorForeground: 'white',
  borderRadius: 'large',
  fontStack: 'system',
  overlayBlur: 'large',
});

// Enhanced glassmorphism styling - more transparent and glass-like
glassmorphismTheme.colors.modalBackground = 'rgba(0, 0, 0, 0.7)';  // More transparent dark background
glassmorphismTheme.colors.modalBorder = 'rgba(255, 255, 255, 0.2)';
glassmorphismTheme.colors.modalText = 'rgba(255, 255, 255, 0.95)';
glassmorphismTheme.colors.modalTextSecondary = 'rgba(255, 255, 255, 0.7)';
glassmorphismTheme.colors.modalTextDim = 'rgba(255, 255, 255, 0.6)';

// Close button glassmorphism
glassmorphismTheme.colors.closeButton = 'rgba(255, 255, 255, 0.15)';
glassmorphismTheme.colors.closeButtonBackground = 'rgba(255, 255, 255, 0.08)';

// General UI elements with glass effect
glassmorphismTheme.colors.generalBorder = 'rgba(255, 255, 255, 0.1)';
glassmorphismTheme.colors.generalBorderDim = 'rgba(255, 255, 255, 0.05)';

// Menu items and interactive elements
glassmorphismTheme.colors.menuItemBackground = 'rgba(255, 255, 255, 0.08)';
glassmorphismTheme.colors.profileAction = 'rgba(255, 255, 255, 0.08)';
glassmorphismTheme.colors.profileActionHover = 'rgba(255, 255, 255, 0.15)';
glassmorphismTheme.colors.profileForeground = 'rgba(255, 255, 255, 0.95)';

// Network/chain selection styling
glassmorphismTheme.colors.selectedOptionBorder = 'rgba(59, 130, 246, 0.4)';
glassmorphismTheme.colors.actionButtonBorder = 'rgba(255, 255, 255, 0.15)';
glassmorphismTheme.colors.actionButtonBorderMobile = 'rgba(255, 255, 255, 0.1)';
glassmorphismTheme.colors.actionButtonSecondaryBackground = 'rgba(255, 255, 255, 0.05)';

// Connected state styling
glassmorphismTheme.colors.connectButtonBackground = 'rgba(255, 255, 255, 0.08)';
glassmorphismTheme.colors.connectButtonBackgroundError = 'rgba(239, 68, 68, 0.15)';
glassmorphismTheme.colors.connectButtonInnerBackground = 'rgba(255, 255, 255, 0.05)';
glassmorphismTheme.colors.connectButtonText = 'rgba(255, 255, 255, 0.95)';
glassmorphismTheme.colors.connectButtonTextError = 'rgba(239, 68, 68, 0.9)';

// Enhanced backdrop and shadow effects
if (glassmorphismTheme.blurs) {
  glassmorphismTheme.blurs.modalOverlay = 'blur(24px)';
}

if (glassmorphismTheme.shadows) {
  glassmorphismTheme.shadows.dialog = '0 25px 80px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.1)';
  glassmorphismTheme.shadows.profileDetailsAction = '0 4px 12px rgba(0, 0, 0, 0.3)';
  glassmorphismTheme.shadows.selectedOption = '0 4px 16px rgba(59, 130, 246, 0.2)';
  glassmorphismTheme.shadows.selectedWallet = '0 4px 16px rgba(59, 130, 246, 0.15)';
  glassmorphismTheme.shadows.walletLogo = '0 2px 8px rgba(0, 0, 0, 0.2)';
}

export default function App({ Component, pageProps }) {
  return (
    <ErrorBoundary>
      <div className={nunito.className}>
        <WagmiProvider config={config}>
          <QueryClientProvider client={queryClient}>
            <RainbowKitProvider theme={glassmorphismTheme}>
              <Component {...pageProps} />
            </RainbowKitProvider>
          </QueryClientProvider>
        </WagmiProvider>
      </div>
    </ErrorBoundary>
  );
}
