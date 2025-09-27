import { useEffect } from "react";
import Head from "next/head";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { ConnectButton } from '@rainbow-me/rainbowkit';

import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
} from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import { BorderBeam } from "@/components/ui/border-beam";
import { ShimmerButton } from "@/components/ui/shimmer-button";

// Aurora Background Component (Real Aceternity UI implementation)
const AuroraBackground = ({ children, className, showRadialGradient = true, ...props }) => {
  return (
    <div
      className={cn(
        "relative flex h-[100vh] flex-col items-center justify-center bg-zinc-50 text-slate-950 dark:bg-zinc-900",
        className,
      )}
      {...props}
    >
      <div
        className="absolute inset-0 overflow-hidden"
        style={{
          "--aurora": "repeating-linear-gradient(100deg,#475569_12%,#64748b_18%,#334155_24%,#1e293b_30%,#0f172a_36%)",
          "--dark-gradient": "repeating-linear-gradient(100deg,#000_0%,#000_8%,transparent_12%,transparent_16%,#000_20%)",
          "--white-gradient": "repeating-linear-gradient(100deg,#fff_0%,#fff_8%,transparent_12%,transparent_16%,#fff_20%)",
          "--slate-600": "#475569",
          "--slate-500": "#64748b",
          "--slate-700": "#334155",
          "--slate-800": "#1e293b",
          "--slate-900": "#0f172a",
          "--black": "#000",
          "--white": "#fff",
          "--transparent": "transparent",
        }}
      >
        <div
          className={cn(
            `after:animate-aurora pointer-events-none absolute -inset-[10px] [background-image:var(--white-gradient),var(--aurora)] [background-size:250%,_180%] [background-position:50%_50%,50%_50%] opacity-40 blur-[12px] invert filter will-change-transform [--aurora:repeating-linear-gradient(100deg,var(--slate-600)_12%,var(--slate-500)_18%,var(--slate-700)_24%,var(--slate-800)_30%,var(--slate-900)_36%)] [--dark-gradient:repeating-linear-gradient(100deg,var(--black)_0%,var(--black)_8%,var(--transparent)_12%,var(--transparent)_16%,var(--black)_20%)] [--white-gradient:repeating-linear-gradient(100deg,var(--white)_0%,var(--white)_8%,var(--transparent)_12%,var(--transparent)_16%,var(--white)_20%)] after:absolute after:inset-0 after:[background-image:var(--white-gradient),var(--aurora)] after:[background-size:180%,_120%] after:[background-attachment:fixed] after:mix-blend-difference after:content-[""] dark:[background-image:var(--dark-gradient),var(--aurora)] dark:invert-0 after:dark:[background-image:var(--dark-gradient),var(--aurora)]`,
            showRadialGradient && `[mask-image:radial-gradient(ellipse_at_100%_0%,black_10%,var(--transparent)_70%)]`,
          )}
        ></div>
      </div>
      {children}
    </div>
  );
};

// Token Icon Components using real icon files
const TokenIcon = ({ src, alt }) => (
  <Image 
    src={src} 
    alt={alt} 
    width={32} 
    height={32} 
    className="w-8 h-8"
  />
);

// Token Icon with Chain overlay - more prominent like 1inch
const TokenWithChain = ({ tokenSrc, chainSrc, tokenAlt, chainAlt }) => (
  <div className="relative w-8 h-8">
    <Image 
      src={tokenSrc} 
      alt={tokenAlt} 
      width={32} 
      height={32} 
      className="w-8 h-8"
    />
    {chainSrc && (
      <div className="absolute -bottom-0.5 -right-0.5 w-4.5 h-4.5 bg-gray-900 rounded-full p-0.5 border border-white/20 shadow-lg">
        <Image 
          src={chainSrc} 
          alt={chainAlt} 
          width={14} 
          height={14} 
          className="w-3.5 h-3.5"
        />
      </div>
    )}
  </div>
);

export default function LandingPage() {
  useEffect(() => {
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
    };
  }, []);

  return (
    <>
      <Head>
        <title>Universal Cross‑Chain Payments</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <AuroraBackground className="relative isolate grid h-dvh grid-rows-[auto,1fr] overflow-hidden bg-black">
        {/* Header and Payment Cards */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center gap-6 max-w-7xl w-full px-4">
            {/* Header */}
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white text-center max-w-4xl leading-tight">
              Pay and Receive with any combination of any token on any chain.
            </h1>
            
            {/* Payment Cards Container */}
            <div className="flex gap-6 flex-col lg:flex-row w-full max-w-4xl">
              {/* Payment Breakdown Card */}
              <div className="glass-card flex flex-col justify-start p-4 relative flex-1 max-w-sm">
                <BorderBeam 
                  size={120}
                  duration={4}
                  colorFrom="#ffffff"
                  colorTo="#ffffff80"
                  delay={0}
                />
                <div className="text-white/90">
                  <h2 className="text-base font-semibold text-white mb-3 text-center">User Pay</h2>
                  
                  <div className="space-y-2 mb-3">
                {/* HBAR Payment */}
                <div className="flex items-center justify-between bg-white/5 rounded-lg p-2 border border-white/10">
                  <div className="flex items-center gap-2">
                    <TokenWithChain 
                      tokenSrc="/icons/hedera-hbar-logo.svg" 
                      chainSrc="/icons/hedera-hbar-logo.svg" 
                      tokenAlt="HBAR" 
                      chainAlt="Hedera"
                    />
                    <div className="flex flex-col">
                      <span className="text-white/90 text-xs font-medium">HBAR</span>
                      <span className="text-white/50 text-[10px]">on Hedera</span>
                    </div>
                  </div>
                  <span className="text-white font-medium text-sm">$10</span>
                </div>

                {/* FLOW Payment */}
                <div className="flex items-center justify-between bg-white/5 rounded-lg p-2 border border-white/10">
                  <div className="flex items-center gap-2">
                    <TokenWithChain 
                      tokenSrc="/icons/flow-flow-logo.svg" 
                      chainSrc="/icons/flow-flow-logo.svg" 
                      tokenAlt="FLOW" 
                      chainAlt="Flow"
                    />
                    <div className="flex flex-col">
                      <span className="text-white/90 text-xs font-medium">FLOW</span>
                      <span className="text-white/50 text-[10px]">on Flow</span>
                    </div>
                  </div>
                  <span className="text-white font-medium text-sm">$20</span>
                </div>

                {/* USDC Payment */}
                <div className="flex items-center justify-between bg-white/5 rounded-lg p-2 border border-white/10">
                  <div className="flex items-center gap-2">
                    <TokenWithChain 
                      tokenSrc="/icons/usd-coin-usdc-logo.svg" 
                      chainSrc="/icons/arbitrum-arb-logo.svg" 
                      tokenAlt="USDC" 
                      chainAlt="Arbitrum"
                    />
                    <div className="flex flex-col">
                      <span className="text-white/90 text-xs font-medium">USDC</span>
                      <span className="text-white/50 text-[10px]">on Arbitrum</span>
                    </div>
                  </div>
                  <span className="text-white font-medium text-sm">$30</span>
                </div>

                {/* ETH Payment */}
                <div className="flex items-center justify-between bg-white/5 rounded-lg p-2 border border-white/10">
                  <div className="flex items-center gap-2">
                    <TokenWithChain 
                      tokenSrc="/icons/ethereum-eth-logo.svg" 
                      chainSrc="/icons/arbitrum-arb-logo.svg" 
                      tokenAlt="ETH" 
                      chainAlt="Arbitrum"
                    />
                    <div className="flex flex-col">
                      <span className="text-white/90 text-xs font-medium">ETH</span>
                      <span className="text-white/50 text-[10px]">on Arbitrum</span>
                    </div>
                  </div>
                  <span className="text-white font-medium text-sm">$20</span>
                </div>

                {/* PayPal USD Payment */}
                <div className="flex items-center justify-between bg-white/5 rounded-lg p-2 border border-white/10">
                  <div className="flex items-center gap-2">
                    <TokenWithChain 
                      tokenSrc="/icons/paypal-usd-pyusd-logo.svg" 
                      chainSrc="/icons/ethereum-eth-logo.svg" 
                      tokenAlt="PYUSD" 
                      chainAlt="Ethereum Sepolia"
                    />
                    <div className="flex flex-col">
                      <span className="text-white/90 text-xs font-medium">PYUSD</span>
                      <span className="text-white/50 text-[10px]">on Ethereum Sepolia</span>
                    </div>
                  </div>
                  <span className="text-white font-medium text-sm">$20</span>
                </div>
              </div>

                  <div className="border-t border-white/20 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-semibold text-sm">Total Payment</span>
                      <span className="text-white font-bold text-base">$100.00</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Animated Transition Arrow */}
              <div className="hidden lg:flex items-center justify-center flex-shrink-0">
                <div className="relative flex items-center">
                  {/* Flowing dots */}
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-white/20 rounded-full animate-flow-dot" style={{animationDelay: '0s'}}></div>
                    <div className="w-2 h-2 bg-white/20 rounded-full animate-flow-dot" style={{animationDelay: '0.3s'}}></div>
                    <div className="w-2 h-2 bg-white/20 rounded-full animate-flow-dot" style={{animationDelay: '0.6s'}}></div>
                  </div>
                  
                  {/* Arrow */}
                  <div className="ml-4 relative">
                    <svg 
                      width="40" 
                      height="20" 
                      viewBox="0 0 40 20" 
                      className="text-white/60"
                    >
                      <defs>
                        <linearGradient id="arrowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" style={{stopColor: '#ffffff', stopOpacity: 0.6}} />
                          <stop offset="50%" style={{stopColor: '#ffffff', stopOpacity: 0.4}} />
                          <stop offset="100%" style={{stopColor: '#ffffff', stopOpacity: 0.2}} />
                        </linearGradient>
                      </defs>
                      <path 
                        d="M2 10 L30 10 M24 4 L30 10 L24 16" 
                        stroke="url(#arrowGradient)" 
                        strokeWidth="2" 
                        fill="none" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  
                  {/* More flowing dots */}
                  <div className="ml-4 flex items-center gap-2">
                    <div className="w-2 h-2 bg-white/20 rounded-full animate-flow-dot" style={{animationDelay: '0.9s'}}></div>
                    <div className="w-2 h-2 bg-white/20 rounded-full animate-flow-dot" style={{animationDelay: '1.2s'}}></div>
                    <div className="w-2 h-2 bg-white/20 rounded-full animate-flow-dot" style={{animationDelay: '1.5s'}}></div>
                  </div>
                </div>
                
                {/* Conversion label */}
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs text-white/40 whitespace-nowrap">
                  Swaps & Bridges
                </div>
              </div>

              {/* Mobile Transition (vertical) */}
              <div className="lg:hidden flex flex-col items-center justify-center py-3">
                <div className="relative flex flex-col items-center">
                  {/* Flowing dots */}
                  <div className="flex flex-col items-center gap-2 my-2">
                    <div className="w-2 h-2 bg-white/20 rounded-full animate-flow-dot" style={{animationDelay: '0s'}}></div>
                    <div className="w-2 h-2 bg-white/20 rounded-full animate-flow-dot" style={{animationDelay: '0.3s'}}></div>
                    <div className="w-2 h-2 bg-white/20 rounded-full animate-flow-dot" style={{animationDelay: '0.6s'}}></div>
                  </div>
                  
                  {/* Vertical Arrow */}
                  <svg 
                    width="20" 
                    height="40" 
                    viewBox="0 0 20 40" 
                    className="text-white/60"
                  >
                    <defs>
                      <linearGradient id="arrowGradientVertical" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style={{stopColor: '#ffffff', stopOpacity: 0.6}} />
                        <stop offset="50%" style={{stopColor: '#ffffff', stopOpacity: 0.4}} />
                        <stop offset="100%" style={{stopColor: '#ffffff', stopOpacity: 0.2}} />
                      </linearGradient>
                    </defs>
                    <path 
                      d="M10 2 L10 30 M4 24 L10 30 L16 24" 
                      stroke="url(#arrowGradientVertical)" 
                      strokeWidth="2" 
                      fill="none" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    />
                  </svg>
                  
                  {/* More flowing dots */}
                  <div className="flex flex-col items-center gap-2 my-2">
                    <div className="w-2 h-2 bg-white/20 rounded-full animate-flow-dot" style={{animationDelay: '0.9s'}}></div>
                    <div className="w-2 h-2 bg-white/20 rounded-full animate-flow-dot" style={{animationDelay: '1.2s'}}></div>
                    <div className="w-2 h-2 bg-white/20 rounded-full animate-flow-dot" style={{animationDelay: '1.5s'}}></div>
                  </div>
                </div>
                
                {/* Conversion label */}
                <div className="text-xs text-white/40 whitespace-nowrap">
                  Swaps & Bridges
                </div>
              </div>

              {/* Merchant Received Card */}
              <div className="glass-card flex flex-col justify-start p-4 relative flex-1 max-w-sm">
                <BorderBeam 
                  size={120}
                  duration={4}
                  colorFrom="#ffffff80"
                  colorTo="#ffffff"
                  delay={2}
                />
                <div className="text-white/90">
              <h2 className="text-base font-semibold text-white mb-3 text-center">Merchant Receive</h2>
              
              <div className="space-y-2 mb-3">
                {/* ETH Received */}
                <div className="flex items-center justify-between bg-white/5 rounded-lg p-2 border border-white/10">
                  <div className="flex items-center gap-2">
                    <TokenWithChain 
                      tokenSrc="/icons/ethereum-eth-logo.svg" 
                      chainSrc="/icons/ethereum-eth-logo.svg" 
                      tokenAlt="ETH" 
                      chainAlt="Ethereum"
                    />
                    <div className="flex flex-col">
                      <span className="text-white/90 text-xs font-medium">ETH</span>
                      <span className="text-white/50 text-[10px]">on Ethereum</span>
                    </div>
                  </div>
                  <span className="text-white font-medium text-sm">$50</span>
                </div>

                {/* SOL Received */}
                <div className="flex items-center justify-between bg-white/5 rounded-lg p-2 border border-white/10">
                  <div className="flex items-center gap-2">
                    <TokenWithChain 
                      tokenSrc="/icons/solana-sol-logo.svg" 
                      chainSrc="/icons/solana-sol-logo.svg" 
                      tokenAlt="SOL" 
                      chainAlt="Solana"
                    />
                    <div className="flex flex-col">
                      <span className="text-white/90 text-xs font-medium">SOL</span>
                      <span className="text-white/50 text-[10px]">on Solana</span>
                    </div>
                  </div>
                  <span className="text-white font-medium text-sm">$30</span>
                </div>

                {/* PYUSD Received */}
                <div className="flex items-center justify-between bg-white/5 rounded-lg p-2 border border-white/10">
                  <div className="flex items-center gap-2">
                    <TokenWithChain 
                      tokenSrc="/icons/paypal-usd-pyusd-logo.svg" 
                      chainSrc="/icons/arbitrum-arb-logo.svg" 
                      tokenAlt="PYUSD" 
                      chainAlt="Arbitrum"
                    />
                    <div className="flex flex-col">
                      <span className="text-white/90 text-xs font-medium">PYUSD</span>
                      <span className="text-white/50 text-[10px]">on Arbitrum</span>
                    </div>
                  </div>
                  <span className="text-white font-medium text-sm">$20</span>
                </div>
              </div>

                  <div className="border-t border-white/20 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-semibold text-sm">Total Received</span>
                      <span className="text-white font-bold text-base">$100.00</span>
                    </div>
                  </div>

                  <div className="mt-3 text-[10px] text-white/60 text-center">
                    Customizable allocation rules
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Wallet Connection Header - Glassmorphism design */}
        <header className="absolute top-0 left-0 right-0 z-30 flex justify-end items-center p-4">
          <div className="relative bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl shadow-2xl p-1">
            <ConnectButton.Custom>
              {({ account, chain, openAccountModal, openChainModal, openConnectModal, authenticationStatus, mounted }) => {
                const ready = mounted && authenticationStatus !== 'loading';
                const connected = ready && account && chain && (!authenticationStatus || authenticationStatus === 'authenticated');

                return (
                  <div className="relative z-10">
                    {(() => {
                      if (!connected) {
                        return (
                          <button
                            onClick={openConnectModal}
                            type="button"
                            className="px-4 py-2 text-sm font-medium text-white/90 hover:text-white transition-colors rounded-lg hover:bg-white/10"
                          >
                            Connect Wallet
                          </button>
                        );
                      }

                      if (chain.unsupported) {
                        return (
                          <button
                            onClick={openChainModal}
                            type="button"
                            className="px-4 py-2 text-sm font-medium text-red-300 hover:text-red-200 transition-colors rounded-lg hover:bg-red-500/10"
                          >
                            Wrong network
                          </button>
                        );
                      }

                      return (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={openChainModal}
                            type="button"
                            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white/80 hover:text-white transition-colors rounded-lg hover:bg-white/10"
                          >
                            {chain.hasIcon && (
                              <div
                                className="w-4 h-4 rounded-full overflow-hidden flex items-center justify-center"
                                style={{ background: chain.iconBackground }}
                              >
                                {chain.iconUrl && (
                                  <img
                                    alt={chain.name ?? 'Chain icon'}
                                    src={chain.iconUrl}
                                    className="w-4 h-4"
                                  />
                                )}
                              </div>
                            )}
                            <span className="hidden sm:inline">{chain.name}</span>
                          </button>

                          <button
                            onClick={openAccountModal}
                            type="button"
                            className="px-3 py-2 text-sm font-medium text-white/80 hover:text-white transition-colors rounded-lg hover:bg-white/10"
                          >
                            {account.displayName}
                            {account.displayBalance && (
                              <span className="hidden sm:inline text-white/60 ml-1">
                                ({account.displayBalance})
                              </span>
                            )}
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                );
              }}
            </ConnectButton.Custom>
          </div>
        </header>

        {/* Navigation Header - Separate from wallet */}
        <div className="absolute top-0 left-0 right-0 z-20 w-full">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 pt-6">
             <div className="select-none text-sm font-semibold tracking-wide text-white/90">AnyChain</div>
             
             <NavigationMenu viewport={false} className="rounded-xl border border-white/30 bg-white/5 px-3 py-2 backdrop-blur-md shadow-lg">
               <NavigationMenuList className="gap-1">
                <NavigationMenuItem>
                   <NavigationMenuLink href="#home" className="px-3 py-1.5 text-sm text-white/80 hover:text-white transition-colors rounded-lg hover:bg-white/10">Home</NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                   <NavigationMenuLink href="/transfer" className="px-3 py-1.5 text-sm text-white/80 hover:text-white transition-colors rounded-lg hover:bg-white/10">Transfer</NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                   <NavigationMenuLink href="#about" className="px-3 py-1.5 text-sm text-white/80 hover:text-white transition-colors rounded-lg hover:bg-white/10">About</NavigationMenuLink>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
            
             {/* Empty space to balance layout */}
             <div style={{ width: '140px' }}></div>
          </div>
        </div>

        {/* Hero */}
        <main id="home" className="relative mx-auto flex w-full max-w-6xl items-center justify-center px-6 h-full">
          {/* Content is now in the glassmorphism card above */}
        </main>

        {/* Footer note (non-scroll, stays within viewport) */}
        <div id="about" className="pointer-events-none mb-6 mt-auto text-center text-xs text-white/50">
          Chain‑agnostic. Developer‑friendly. Minimal UX friction.
        </div>
      </AuroraBackground>
    </>
  );
}


