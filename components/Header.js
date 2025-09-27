import { ConnectButton } from '@rainbow-me/rainbowkit';
import Image from 'next/image';
import Link from 'next/link';

export const Header = ({ showNavigation = false }) => {

  return (
    <header className="relative flex items-center pt-8 pb-4 px-16">
      {/* Logo and App Name - Left */}
      <div className="flex items-center gap-4">
        <Image 
          src="/icons/dhalway_1.png"
          alt="DhalWay Logo"
          width={64}
          height={64}
          className="w-16 h-16"
        />
        <div className="select-none text-3xl font-bold tracking-wide text-white/90">
          DhalWay
        </div>
      </div>
      
      {/* Navigation - Absolutely centered */}
      {showNavigation && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <nav className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl shadow-2xl px-6 py-3">
            <div className="flex items-center space-x-8">
              <Link href="/" className="text-white/80 hover:text-white transition-colors font-medium">
                Home
              </Link>
              <Link href="/transfer" className="text-white/80 hover:text-white transition-colors font-medium">
                Pay
              </Link>
              <Link href="/merchant" className="text-white/80 hover:text-white transition-colors font-medium">
                Merchant
              </Link>
            </div>
          </nav>
        </div>
      )}
      
      {/* Spacer to push connect button to the right */}
      <div className="flex-1"></div>
      
      {/* Connect Button - Right */}
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
  );
};
