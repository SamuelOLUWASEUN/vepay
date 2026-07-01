import { useState, useEffect, useRef } from 'react';
import { Plus, X, Check } from 'lucide-react';
import { useClearSpend } from '../../context/ClearSpendContext';
import { formatCurrency } from '../../lib/currency';

// Inputs OUTSIDE component to prevent remount
interface AmountInputProps {
  value: string;
  onChange: (v: string) => void;
  onEnter: () => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

function AmountInput({ value, onChange, onEnter, inputRef }: AmountInputProps) {
  return (
    <div style={{ position: 'relative' }}>
      <span style={{
        position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)',
        fontFamily: 'monospace', fontWeight: 700, fontSize: '20px', color: 'var(--express-muted)',
        pointerEvents: 'none',
      }}>₦</span>
      <input
        ref={inputRef}
        id="quick-log-amount"
        type="number"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') onEnter(); }}
        placeholder="0"
        min="1"
        style={{
          width: '100%', borderRadius: '16px',
          border: '2px solid var(--express-border)',
          background: 'var(--express-bg)',
          paddingLeft: '40px', paddingRight: '16px',
          paddingTop: '16px', paddingBottom: '16px',
          fontFamily: 'monospace', fontSize: '24px', fontWeight: 700,
          color: 'var(--express-ink)', outline: 'none',
          boxSizing: 'border-box',
          WebkitAppearance: 'none',
        }}
      />
    </div>
  );
}

interface LabelInputProps {
  value: string;
  onChange: (v: string) => void;
  onEnter: () => void;
}

function LabelInput({ value, onChange, onEnter }: LabelInputProps) {
  return (
    <input
      id="quick-log-label"
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => { if (e.key === 'Enter') onEnter(); }}
      placeholder="What was it? (Suya, Airtime, Fuel…)"
      maxLength={40}
      style={{
        width: '100%', borderRadius: '12px',
        border: '1px solid var(--express-border)',
        background: 'var(--express-bg)',
        padding: '12px 16px', fontSize: '14px',
        color: 'var(--express-ink)', outline: 'none',
        boxSizing: 'border-box',
        WebkitAppearance: 'none',
      }}
    />
  );
}

interface QuickLogModalProps {
  open: boolean;
  onClose: () => void;
}

function QuickLogModal({ open, onClose }: QuickLogModalProps) {
  const { logDailySpend, todaySpendNGN, dailyBudgetNGN } = useClearSpend();
  const [amount, setAmount] = useState('');
  const [label, setLabel] = useState('');
  const [logged, setLogged] = useState(false);
  const [modalBottom, setModalBottom] = useState(0);
  // Live height of the visible viewport (shrinks when the keyboard opens). We
  // cap the card to this so it can never be taller than what's on screen.
  const [viewportHeight, setViewportHeight] = useState<number | null>(null);
  const amountRef = useRef<HTMLInputElement>(null);

  // ── Keyboard avoidance + live viewport height using visualViewport API ──────
  // This is the ONLY reliable way to handle keyboard on iOS Safari + Android.
  // We track two things from the same event: how far to lift the card off the
  // bottom (keyboard height) and the current visible height (to cap the card).
  useEffect(() => {
    if (!open) return;

    function handleViewportResize() {
      if (window.visualViewport) {
        const viewport = window.visualViewport;
        const windowHeight = window.innerHeight;
        const vpHeight = viewport.height;
        const keyboardHeight = windowHeight - vpHeight - viewport.offsetTop;
        setModalBottom(Math.max(0, keyboardHeight));
        setViewportHeight(vpHeight);
      }
    }

    // Seed immediately so the cap is correct on first open, before any resize.
    handleViewportResize();

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportResize);
      window.visualViewport.addEventListener('scroll', handleViewportResize);
    }

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleViewportResize);
        window.visualViewport.removeEventListener('scroll', handleViewportResize);
      }
      setModalBottom(0);
      setViewportHeight(null);
    };
  }, [open]);

  // ── Background scroll lock ──────────────────────────────────────────────────
  // This modal owns its open state internally, so the central lock in App.tsx
  // never sees it. Lock here the same robust way: both <html> and <body>, with
  // overflow:hidden (not position:fixed) so the page stays where it was on close.
  useEffect(() => {
    if (!open) return;
    const html = document.documentElement;
    const body = document.body;
    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    return () => {
      html.style.overflow = '';
      body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  const pct = Math.min(todaySpendNGN / dailyBudgetNGN, 1);
  const isOver = todaySpendNGN > dailyBudgetNGN;
  const isWarn = pct >= 0.7 && !isOver;
  const barColor = isOver ? '#e5484d' : isWarn ? '#f5a623' : '#0f9d58';
  const totalColor = isOver ? '#e5484d' : isWarn ? '#f5a623' : 'var(--express-ink)';

  // Cap the card so it's never taller than the visible screen. We subtract a
  // little (24px) so it never quite touches the edges. When visualViewport
  // isn't available yet we fall back to the CSS `dvh` cap on the card class.
  const maxCardHeight = viewportHeight ? `${viewportHeight - 24}px` : undefined;

  function handleLog() {
    const val = parseFloat(amount);
    if (!val || val <= 0) return;
    logDailySpend(val, label);
    setLogged(true);
    setTimeout(() => {
      setAmount('');
      setLabel('');
      setLogged(false);
      onClose();
    }, 800);
  }

  return (
    // Full screen backdrop.
    // Positioning is handled by the `.vepay-quicklog-backdrop` class:
    //   mobile  → content sits near the bottom but lifted off the edge
    //   desktop → content centered like a normal dialog
    // (A media query is required for this, which inline styles can't express —
    //  hence the class. The blur/dim look is unchanged.)
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="vepay-quicklog-backdrop"
      style={{
        position: 'fixed', inset: 0, zIndex: 55,
        backgroundColor: 'rgba(0,0,0,0.5)',
        WebkitBackdropFilter: 'blur(4px)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        flexDirection: 'column',
        // Move modal up by keyboard height (mobile). On desktop the keyboard
        // never appears so this stays 0 and the centering is unaffected.
        paddingBottom: `${modalBottom}px`,
        transition: 'padding-bottom 0.1s ease',
      }}
    >
      {/* Modal card.
          It's a vertical flex column capped to the visible viewport height, so
          it can never be taller than the screen. The header is fixed; the body
          scrolls internally only if the content doesn't fit (e.g. when the
          keyboard shrinks the space). On a normal tall screen nothing scrolls —
          it looks exactly as before. */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="vepay-quicklog-card"
        style={{
          width: '100%',
          maxWidth: '440px',
          marginLeft: 'auto',
          marginRight: 'auto',
          background: 'var(--express-surface)',
          border: '1px solid var(--express-border)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: maxCardHeight,
        }}
      >
        {/* Header — fixed, never scrolls away */}
        <div style={{
          flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', borderBottom: '1px solid var(--express-border)',
          background: 'var(--express-bg)',
        }}>
          <div>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--express-ink)', fontSize: '16px', margin: 0 }}>
              Log a spend
            </p>
            <p style={{ fontSize: '12px', color: 'var(--express-muted)', marginTop: '2px' }}>
              Add it now before you forget
            </p>
          </div>
          <button type="button" onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', borderRadius: '50%', color: 'var(--express-muted)' }}>
            <X style={{ width: '20px', height: '20px' }} />
          </button>
        </div>

        {/* Scrollable body — takes remaining height, scrolls only if needed */}
        <div style={{
          flex: '1 1 auto',
          minHeight: 0,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          // Safe area padding lives here so the last element clears the iPhone
          // home indicator even while scrolling.
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}>
          {/* Today's total */}
          <div style={{ padding: '16px 20px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--express-muted)', fontWeight: 600 }}>Today so far</span>
              <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '18px', color: totalColor }}>
                {formatCurrency(todaySpendNGN, 'NGN')}
              </span>
            </div>
            <div style={{ height: '6px', borderRadius: '9999px', background: 'var(--express-border)', overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: '9999px', background: barColor, width: `${Math.min(pct * 100, 100)}%`, transition: 'width 0.5s ease' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
              <span style={{ fontSize: '10px', color: 'var(--express-muted)' }}>
                {isOver ? `₦${Math.abs(dailyBudgetNGN - todaySpendNGN).toLocaleString('en-NG')} over` : `₦${(dailyBudgetNGN - todaySpendNGN).toLocaleString('en-NG')} left`}
              </span>
              <span style={{ fontSize: '10px', color: 'var(--express-muted)' }}>
                Budget: {formatCurrency(dailyBudgetNGN, 'NGN')}
              </span>
            </div>
          </div>

          {/* Inputs */}
          <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <AmountInput value={amount} onChange={setAmount} onEnter={handleLog} inputRef={amountRef} />
            <LabelInput value={label} onChange={setLabel} onEnter={handleLog} />

            <button
              type="button"
              onClick={handleLog}
              disabled={!amount || parseFloat(amount) <= 0 || logged}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '16px',
                border: 'none',
                cursor: logged ? 'default' : 'pointer',
                background: logged ? 'var(--express-green-soft)' : 'var(--express-ink)',
                color: logged ? '#0f9d58' : 'var(--express-bg)',
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                opacity: (!amount || parseFloat(amount) <= 0) ? 0.4 : 1,
                transition: 'all 0.2s',
              }}
            >
              {logged ? (
                <><Check style={{ width: '20px', height: '20px' }} /> Logged!</>
              ) : (
                <>Log spend {amount ? `₦${parseFloat(amount).toLocaleString('en-NG')}` : ''}</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function QuickLogFAB() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Log a spend"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 40,
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: '#0f9d58',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          display: open ? 'none' : 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 24px rgba(15,157,88,0.4)',
          transition: 'transform 0.2s',
          // Safe area for iPhone home indicator
          marginBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <Plus style={{ width: '32px', height: '32px' }} strokeWidth={2.5} />
      </button>

      <QuickLogModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
