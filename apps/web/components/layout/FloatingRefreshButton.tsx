'use client';

import { RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';

type RefreshHandler = () => void;

let registeredHandler: RefreshHandler | null = null;
const listeners = new Set<() => void>();

/** Called by TopBar when a page provides onRefresh — floating button uses this. */
export function registerPageRefresh(handler: RefreshHandler | null): void {
  registeredHandler = handler;
  listeners.forEach((l) => l());
}

export function triggerPageRefresh(): void {
  if (registeredHandler) {
    registeredHandler();
    return;
  }
  window.location.reload();
}

/**
 * Fixed above the Next.js `devtools-indicator` (bottom-left) for one-click refresh.
 * Vertical control so it sits in the same corner stack as the indicator.
 */
export function FloatingRefreshButton() {
  const [spinning, setSpinning] = useState(false);
  const [, bump] = useState(0);

  useEffect(() => {
    const sync = () => bump((n) => n + 1);
    listeners.add(sync);
    return () => {
      listeners.delete(sync);
    };
  }, []);

  const handleClick = () => {
    setSpinning(true);
    triggerPageRefresh();
    window.setTimeout(() => setSpinning(false), 600);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      title={registeredHandler ? 'Refresh data' : 'Reload page'}
      aria-label="Refresh data"
      style={{
        position: 'fixed',
        left: '16px',
        // Sit just above the Next.js bottom-left devtools indicator (~40–48px tall)
        bottom: '72px',
        zIndex: 2147483000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        width: '40px',
        minHeight: '88px',
        padding: '10px 6px',
        borderRadius: '999px',
        border: '1px solid var(--border-strong, rgba(148,163,184,0.35))',
        background: 'var(--bg-elevated, #0f172a)',
        color: 'var(--text-primary, #e2e8f0)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
        cursor: 'pointer',
      }}
    >
      <RefreshCw
        size={14}
        style={{
          flexShrink: 0,
          animation: spinning ? 'aeds-refresh-spin 0.6s linear' : undefined,
        }}
      />
      <span
        style={{
          writingMode: 'vertical-rl',
          transform: 'rotate(180deg)',
          fontSize: '10px',
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          fontFamily: 'var(--font-mono, ui-monospace, monospace)',
          lineHeight: 1,
          userSelect: 'none',
        }}
      >
        Refresh
      </span>
      <style>{`@keyframes aeds-refresh-spin { to { transform: rotate(360deg); } }`}</style>
    </button>
  );
}
