import { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import AtomicTransfer from '../components/AtomicTransfer';
import TokenBalance from '../components/TokenBalance';

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
  const [transferAmounts, setTransferAmounts] = useState({});
  const [tokenPrices, setTokenPrices] = useState({});
  const [pricesLoading, setPricesLoading] = useState(true);
  const [pricesError, setPricesError] = useState(null);

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

  return (
    <div>
      <Header />
      <main className="p-4 max-w-6xl mx-auto">
        <TokenBalance 
          transferAmounts={transferAmounts}
          setTransferAmounts={setTransferAmounts}
          tokenPrices={tokenPrices}
          pricesLoading={pricesLoading}
          pricesError={pricesError}
        />
        <AtomicTransfer 
          transferAmounts={transferAmounts}
        />
      </main>
    </div>
  );
}
