import "@/styles/globals.css";
import '@rainbow-me/rainbowkit/styles.css';

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
} from 'wagmi/chains';
import {
  QueryClientProvider,
  QueryClient,
} from "@tanstack/react-query";

const config = getDefaultConfig({
  appName: 'ethindia',
  projectId: '',
  chains: [mainnet, polygon, optimism, arbitrum, base, sepolia],
  ssr: true,
});

export default function App({ Component, pageProps }) {
  return <Component {...pageProps} />;
}
