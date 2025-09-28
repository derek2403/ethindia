import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Header } from '../components/Header';
import { Spotlight } from '@/components/ui/spotlight-new';
import AtomicTransfer from '../components/AtomicTransfer';
import TokenBalance from '../components/TokenBalance';
import AtomicEscrowTransfer from '../components/AtomicEscrowTransfer';

// Pyth price feed IDs mapping
const PYTH_PRICE_IDS = {
  'PYUSD': '0xc1da1b73d7f01e7ddd54b3766cf7fcd644395ad14f70aa706ec5384c59e76692',
  'LINK': '0x8ac0c70fff57e9aefdf5edf44b51d62c2d433653cbb2cf5cc06bb115af04d221',
  'FLOW': '0x2fb245b9a84554a0f15aa123cbb5f64cd263b59e9a87d80148cbffab50c69f30',
  'HBAR': '0x3728e591097635310e6341af53db8b7ee42da9b3a8d918f9463ce9cca886dfbd',
  'USDC': '0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a',
  'ETH': '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace'
};

export default function Transfer() {
  const router = useRouter();
  const [transferAmounts, setTransferAmounts] = useState({});
  const [tokenPrices, setTokenPrices] = useState({});
  const [pricesLoading, setPricesLoading] = useState(true);
  const [pricesError, setPricesError] = useState(null);
  const [portfolioData, setPortfolioData] = useState(null);
  
  // Payment limit configuration
  const MAX_PAYMENT_AMOUNT = 100; // $100 limit

  // Function to fetch prices from Hermes API
  const fetchTokenPrices = async () => {
    try {
      setPricesLoading(true);
      setPricesError(null);
      
      // Get all price feed IDs
      const priceIds = Object.values(PYTH_PRICE_IDS);
      
      // Create query string for multiple IDs
      const idsQuery = priceIds.map(id => `ids[]=${id}`).join('&');
      const url = `https://hermes.pyth.network/api/latest_price_feeds?${idsQuery}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch prices: ${response.status}`);
      }
      
      const priceData = await response.json();
      
      // Convert to symbol-keyed object
      const pricesById = {};
      priceData.forEach(item => {
        const symbol = Object.keys(PYTH_PRICE_IDS).find(
          key => PYTH_PRICE_IDS[key] === `0x${item.id}`
        );
        
        if (symbol && item.price) {
          // Convert price based on expo (price feeds use different decimal places)
          const price = parseFloat(item.price.price) * Math.pow(10, item.price.expo);
          pricesById[symbol] = {
            price: price,
            confidence: parseFloat(item.price.conf) * Math.pow(10, item.price.expo),
            publishTime: item.price.publish_time,
            formatted: price.toFixed(price < 1 ? 6 : 2)
          };
        }
      });
      
      setTokenPrices(pricesById);
    } catch (error) {
      console.error('Error fetching token prices:', error);
      setPricesError(error.message);
    } finally {
      setPricesLoading(false);
    }
  };

  // Calculate total USD value of selected tokens
  const calculateTotalUSDValue = () => {
    return Object.entries(transferAmounts).reduce((total, [key, amount]) => {
      // Extract token symbol from key (format: "SYMBOL_CHAINID")
      const tokenSymbol = key.split('_')[0];
      const tokenPrice = tokenPrices[tokenSymbol]?.price || 0;
      return total + (amount * tokenPrice);
    }, 0);
  };

  // Wrapper for setTransferAmounts that enforces the payment limit
  const setTransferAmountsWithLimit = (newAmounts) => {
    if (typeof newAmounts === 'function') {
      setTransferAmounts(prev => {
        const updated = newAmounts(prev);
        const totalValue = Object.entries(updated).reduce((total, [key, amount]) => {
          const tokenSymbol = key.split('_')[0];
          const tokenPrice = tokenPrices[tokenSymbol]?.price || 0;
          return total + (amount * tokenPrice);
        }, 0);
        
        // Only update if within limit
        if (totalValue <= MAX_PAYMENT_AMOUNT) {
          return updated;
        }
        return prev; // Return previous state if limit exceeded
      });
    } else {
      // Direct object assignment
      const totalValue = Object.entries(newAmounts).reduce((total, [key, amount]) => {
        const tokenSymbol = key.split('_')[0];
        const tokenPrice = tokenPrices[tokenSymbol]?.price || 0;
        return total + (amount * tokenPrice);
      }, 0);
      
      if (totalValue <= MAX_PAYMENT_AMOUNT) {
        setTransferAmounts(newAmounts);
      }
    }
  };

  // Effect to parse portfolio data from URL parameter
  useEffect(() => {
    if (router.isReady && router.query.portfolio) {
      try {
        const decodedData = decodeURIComponent(router.query.portfolio);
        const parsedPortfolio = JSON.parse(decodedData);
        setPortfolioData(parsedPortfolio);
      } catch (error) {
        console.error('Error parsing portfolio data from URL:', error);
      }
    }
  }, [router.isReady, router.query.portfolio]);

  // Effect to fetch prices on mount and set up periodic updates
  useEffect(() => {
    // Initial fetch
    fetchTokenPrices();
    
    // Set up periodic updates every 30 seconds
    const interval = setInterval(fetchTokenPrices, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Make RainbowKit modal use a full-page blurred overlay on this page
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Mark body so page-scoped CSS can target the RainbowKit portal
    document.body.classList.add('transfer-page');

    // Create a global, page-scoped overlay that always spans the viewport
    const pageOverlay = document.createElement('div');
    pageOverlay.id = 'transfer-global-overlay';
    const ov = pageOverlay.style;
    ov.position = 'fixed';
    ov.inset = '0';
    ov.width = '100vw';
    ov.height = '100vh';
    ov.background = 'rgba(0, 0, 0, 0.35)';
    ov.backdropFilter = 'blur(9px)';
    ov.WebkitBackdropFilter = 'blur(9px)';
    ov.zIndex = '999998';
    ov.pointerEvents = 'none';
    ov.display = 'none';
    document.body.appendChild(pageOverlay);

    const applyBackdropFix = () => {
      const candidates = new Set();

      // Known RainbowKit backdrop test id
      document
        .querySelectorAll('div[data-testid="rk-connect-modal-backdrop"]')
        .forEach((el) => candidates.add(el));

      // Generic full-screen overlay divs created near the dialog
      const portalRoot = document.querySelector('div[data-rk][aria-hidden="false"]');
      if (portalRoot) {
        portalRoot
          .querySelectorAll('div[style*="position: fixed"][style*="inset: 0"]')
          .forEach((el) => candidates.add(el));

        // Also capture overlay-like nodes that don't contain dialogs
        portalRoot
          .querySelectorAll('div')
          .forEach((el) => {
            if (el.getAttribute('role') === 'dialog') return;
            if (el.querySelector('[role="dialog"]')) return;
            const styleAttr = el.getAttribute('style') || '';
            const looksLikeOverlay =
              styleAttr.includes('position: fixed') ||
              styleAttr.includes('inset: 0') ||
              (styleAttr.includes('top: 0') && styleAttr.includes('left: 0'));
            if (looksLikeOverlay) {
              candidates.add(el);
            }
          });
      }

      candidates.forEach((el) => {
        // Mark so we don't repeatedly process
        if (!el.getAttribute('data-rk-backdrop')) {
          el.setAttribute('data-rk-backdrop', 'patched');
        }
        // Neutralize RainbowKit's own backdrop (we'll add our own full-page layer)
        el.style.setProperty('background', 'transparent', 'important');
        el.style.setProperty('backdrop-filter', 'none', 'important');
        el.style.setProperty('-webkit-backdrop-filter', 'none', 'important');
      });

      // Toggle our full-page overlay based on whether a RainbowKit dialog is open
      const isOpen = !!document.querySelector('div[data-rk][aria-hidden="false"] [role="dialog"]');
      pageOverlay.style.display = isOpen ? 'block' : 'none';
    };

    // Initial run in case modal is already present
    applyBackdropFix();

    // Observe new nodes/styles while the page is mounted
    const observer = new MutationObserver(() => applyBackdropFix());
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class', 'data-testid', 'aria-hidden'],
    });

    // Fallback, page-scoped CSS override
    const styleEl = document.createElement('style');
    styleEl.id = 'transfer-no-backdrop';
    styleEl.textContent = `
      /* Ensure RK backdrops are transparent; we'll supply our own */
      .transfer-page div[data-rk][aria-hidden="false"] > div[data-testid="rk-connect-modal-backdrop"],
      .transfer-page div[data-rk][aria-hidden="false"] > div[style*="position: fixed"][style*="inset: 0"] {
        background: transparent !important;
        backdrop-filter: none !important;
        -webkit-backdrop-filter: none !important;
      }
      /* Keep the dialog crisp */
      .transfer-page div[data-rk][aria-hidden="false"] [role="dialog"],
      .transfer-page div[data-rk][aria-hidden="false"] [role="dialog"] *,
      .transfer-page div[data-rk][aria-hidden="false"] [role="dialog"]::before,
      .transfer-page div[data-rk][aria-hidden="false"] [role="dialog"]::after {
        backdrop-filter: none !important;
        -webkit-backdrop-filter: none !important;
      }
    `;
    document.head.appendChild(styleEl);

    return () => {
      observer.disconnect();
      document.body.classList.remove('transfer-page');
      if (pageOverlay.parentNode) pageOverlay.parentNode.removeChild(pageOverlay);
      if (styleEl.parentNode) styleEl.parentNode.removeChild(styleEl);
    };
  }, []);
  const [merchant, setMerchant] = useState(''); // Merchant address for escrow

  return (
    <div className="min-h-screen bg-black overflow-hidden relative">
      <div className="absolute inset-0 z-0">
        <Spotlight
          gradientFirst="radial-gradient(68.54% 68.72% at 55.02% 31.46%, hsla(0, 0%, 100%, .12) 0, hsla(0, 0%, 100%, .04) 50%, hsla(0, 0%, 100%, 0) 80%)"
          gradientSecond="radial-gradient(50% 50% at 50% 50%, hsla(0, 0%, 100%, .08) 0, hsla(0, 0%, 100%, .03) 80%, transparent 100%)"
          gradientThird="radial-gradient(50% 50% at 50% 50%, hsla(0, 0%, 100%, .06) 0, hsla(0, 0%, 100%, .02) 80%, transparent 100%)"
          translateY={-300}
          width={600}
          height={1200}
          smallWidth={300}
          duration={6}
          xOffset={120}
        />
      </div>
      <div className="relative z-10">
        <Header />
        <main className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-7xl mx-auto">
        <div className="space-y-6 sm:space-y-8 lg:space-y-10">
          {/* Portfolio Info from QR Code */}
          {portfolioData && (
            <div className="w-full">
              <div className="glass-card flex flex-col justify-start p-6 relative max-w-4xl mx-auto w-full">
                <h3 className="text-xl font-bold mb-4 text-white">📱 Scanned Portfolio</h3>
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <p className="text-sm text-white/70 mb-2">Recipient Wallet:</p>
                  <p className="text-white font-mono text-sm break-all">{portfolioData.walletAddress}</p>
                  
                  {Object.keys(portfolioData).length > 1 && (
                    <div className="mt-4">
                      <p className="text-sm text-white/70 mb-2">Portfolio Allocation:</p>
                      <div className="space-y-2">
                        {Object.entries(portfolioData).map(([chain, tokens]) => {
                          if (chain === 'walletAddress' || typeof tokens !== 'object') return null;
                          return (
                            <div key={chain} className="text-sm">
                              <span className="text-white/90 capitalize">{chain}: </span>
                              {Object.entries(tokens).map(([token, percentage], index, arr) => (
                                <span key={token} className="text-white/70">
                                  {token} ({percentage}%){index < arr.length - 1 ? ', ' : ''}
                                </span>
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="w-full">
            <TokenBalance 
              transferAmounts={transferAmounts}
              setTransferAmounts={setTransferAmountsWithLimit}
              tokenPrices={tokenPrices}
              pricesLoading={pricesLoading}
              pricesError={pricesError}
              maxPaymentAmount={MAX_PAYMENT_AMOUNT}
              currentTotalUSD={calculateTotalUSDValue()}
            />
          </div>
          <div className="w-full">
            <AtomicTransfer 
              transferAmounts={transferAmounts}
            />
          </div>
        </div>
        </main>
      </div>
    </div>
  );
}
