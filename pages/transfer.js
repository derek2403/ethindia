import { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import AtomicTransfer from '../components/AtomicTransfer';
import TokenBalance from '../components/TokenBalance';

export default function Transfer() {
  const [transferAmounts, setTransferAmounts] = useState({});

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
        />
        <AtomicTransfer 
          transferAmounts={transferAmounts}
        />
      </main>
    </div>
  );
}
