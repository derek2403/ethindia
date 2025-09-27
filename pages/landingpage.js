import { useEffect } from "react";
import Head from "next/head";

import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
} from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";

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

      <div className="relative isolate grid h-dvh grid-rows-[auto,1fr] overflow-hidden">
        {/* Payment Cards */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center gap-8 flex-col md:flex-row px-4 md:px-0">
          {/* Payment Breakdown Card */}
          <div className="glass-card flex flex-col justify-start p-6">
            <div className="text-white/90">
              <h2 className="text-lg font-semibold text-white mb-6 text-center">$100 Payment Example</h2>
              
              <div className="space-y-3 mb-6">
                {/* HBAR Payment */}
                <div className="flex items-center justify-between bg-white/5 rounded-lg p-3 border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white text-xs font-bold">
                      HBAR
                    </div>
                    <span className="text-white/90 text-sm">Hedera</span>
                  </div>
                  <span className="text-white font-medium">$10</span>
                </div>

                {/* FLOW Payment */}
                <div className="flex items-center justify-between bg-white/5 rounded-lg p-3 border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold">
                      FLOW
                    </div>
                    <span className="text-white/90 text-sm">Flow</span>
                  </div>
                  <span className="text-white font-medium">$20</span>
                </div>

                {/* USDC Payment */}
                <div className="flex items-center justify-between bg-white/5 rounded-lg p-3 border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
                      USDC
                    </div>
                    <span className="text-white/90 text-sm">Arbitrum</span>
                  </div>
                  <span className="text-white font-medium">$50</span>
                </div>

                {/* PayPal USD Payment */}
                <div className="flex items-center justify-between bg-white/5 rounded-lg p-3 border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                      PYUSD
                    </div>
                    <span className="text-white/90 text-sm">PayPal USD</span>
                  </div>
                  <span className="text-white font-medium">$20</span>
                </div>
              </div>

              <div className="border-t border-white/20 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-white font-semibold">Total Payment</span>
                  <span className="text-blue-400 font-bold text-lg">$100.00</span>
                </div>
              </div>
            </div>
          </div>

          {/* Merchant Received Card */}
          <div className="glass-card flex flex-col justify-start p-6">
            <div className="text-white/90">
              <h2 className="text-lg font-semibold text-white mb-6 text-center">Merchant Receives</h2>
              
              <div className="space-y-3 mb-6">
                {/* ETH Received */}
                <div className="flex items-center justify-between bg-white/5 rounded-lg p-3 border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
                      ETH
                    </div>
                    <span className="text-white/90 text-sm">Ethereum</span>
                  </div>
                  <span className="text-white font-medium">$70</span>
                </div>

                {/* SOL Received */}
                <div className="flex items-center justify-between bg-white/5 rounded-lg p-3 border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center text-white text-xs font-bold">
                      SOL
                    </div>
                    <span className="text-white/90 text-sm">Solana</span>
                  </div>
                  <span className="text-white font-medium">$30</span>
                </div>
              </div>

              <div className="border-t border-white/20 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-white font-semibold">Total Received</span>
                  <span className="text-green-400 font-bold text-lg">$100.00</span>
                </div>
              </div>

              <div className="mt-4 text-xs text-white/60 text-center">
                Customizable allocation rules
              </div>
            </div>
          </div>
        </div>

        {/* Navbar */}
        <header className="sticky top-0 z-20 w-full">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 pt-6">
            <div className="select-none text-sm font-semibold tracking-wide text-white/80">AnyChain</div>
            <NavigationMenu viewport={false} className="rounded-xl border border-white/10 bg-white/5 px-2 py-1.5 backdrop-blur">
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuLink href="#home">Home</NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink href="#pay">Pay</NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink href="#about">About</NavigationMenuLink>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
            <Button size="sm">Start Payment</Button>
          </div>
        </header>

        {/* Hero */}
        <main id="home" className="relative mx-auto flex w-full max-w-6xl items-center justify-center px-6 h-full">
          {/* Content is now in the glassmorphism card above */}
        </main>

        {/* Footer note (non-scroll, stays within viewport) */}
        <div id="about" className="pointer-events-none mb-6 mt-auto text-center text-xs text-white/50">
          Chain‑agnostic. Developer‑friendly. Minimal UX friction.
        </div>
      </div>
    </>
  );
}


