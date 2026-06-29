import { useEffect } from 'react';
import {
  AlertTriangle,
  Brain,
  CreditCard,
  LogOut,
  Menu,
  Moon,
  PiggyBank,
  RotateCcw,
  Settings,
  ShoppingBasket,
  Sparkles,
  Sun,
  Terminal,
  Wifi,
  X,
} from 'lucide-react';
import { useClearSpend } from '../../context/ClearSpendContext';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  expanded: boolean;
  mobileOpen: boolean;
  onToggleExpanded: () => void;
  onCloseMobile: () => void;
  onOpenMobile: () => void;
  onOpenDevTools: () => void;
  onOpenSettings: () => void;
  onOpenSavings: () => void;
  onOpenProfile: () => void;
}

/**
 * Sidebar — proper left navigation rail.
 *
 * Desktop: fixed left, collapsed (icon-only, 64px) by default.
 *   Click the menu icon to expand to full labels (224px).
 *   Main content margin is controlled by parent based on `expanded` state.
 *
 * Mobile: hidden by default. The hamburger that opens it now lives INSIDE each
 *   dashboard header (see MobileMenuButton at the bottom of this file) so it
 *   scrolls with the header instead of floating over content. Tapping outside
 *   closes the overlay panel, which slides in from the LEFT.
 */
export function Sidebar({
  expanded,
  mobileOpen,
  onToggleExpanded,
  onCloseMobile,
  onOpenMobile,
  onOpenDevTools,
  onOpenSettings,
  onOpenSavings,
  onOpenProfile,
}: SidebarProps) {
  const { currentMode, setMode, openFingerprint } = useClearSpend();
  const { isDark, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();
  const isExpress = currentMode === 'EXPRESS';

  // Close mobile sidebar on Escape key
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && mobileOpen) onCloseMobile();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileOpen, onCloseMobile]);

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  function switchTo(mode: 'EXPRESS' | 'PRO') {
    setMode(mode);
    onCloseMobile();
  }

  function handleFingerprint() {
    openFingerprint();
    onCloseMobile();
  }

  function handleDevTools() {
    onOpenDevTools();
    onCloseMobile();
  }

  function handleSettings() {
    onOpenSettings();
    onCloseMobile();
  }

  // ─── Shared style helpers ─────────────────────────────────────────────────
  const bg = isExpress ? 'bg-express-surface' : 'bg-pro-surface';
  const border = isExpress ? 'border-express-border' : 'border-pro-border';
  const ink = isExpress ? 'text-express-ink' : 'text-pro-ink';
  const muted = isExpress ? 'text-express-muted' : 'text-pro-muted';

  // Row button used for both icon-only and expanded states
  function NavBtn({
    icon: Icon,
    label,
    sublabel,
    onClick,
    active = false,
    activeColor = '',
    danger = false,
  }: {
    icon: React.ElementType;
    label: string;
    sublabel?: string;
    onClick: () => void;
    active?: boolean;
    activeColor?: string;
    danger?: boolean;
  }) {
    const base = [
      'w-full flex items-center gap-3 rounded-xl border transition-all text-left',
      expanded ? 'px-3 py-2.5' : 'justify-center w-12 h-12 mx-auto',
      active
        ? activeColor
        : danger
          ? (isExpress ? 'border-transparent hover:bg-express-red-soft hover:border-express-red/30 text-express-red' : 'border-transparent hover:bg-pro-red-soft hover:border-pro-red/30 text-pro-red')
          : (isExpress
              ? 'border-transparent hover:bg-express-bg hover:border-express-border ' + muted
              : 'border-transparent hover:bg-pro-surface-2 hover:border-pro-border ' + muted),
    ].join(' ');

    return (
      <button type="button" onClick={onClick} className={base} title={label}>
        <Icon className={['h-5 w-5 shrink-0', active ? '' : danger ? 'text-current' : ''].join(' ')} />
        {expanded && (
          <div className="min-w-0">
            <p className={['text-sm font-semibold leading-tight', ink].join(' ')}>{label}</p>
            {sublabel && <p className={['text-xs leading-tight mt-0.5', muted].join(' ')}>{sublabel}</p>}
          </div>
        )}
      </button>
    );
  }

  // ─── Sidebar inner content (shared between desktop + mobile overlay) ──────
  const content = (
    <div className="flex flex-col h-full select-none">

      {/* Logo + close button */}
      <div className={['flex items-center border-b shrink-0', border,
        expanded ? 'gap-3 px-4 py-4 justify-between' : 'flex-col py-4 px-2 gap-2'].join(' ')}>
        <div className={['h-9 w-9 rounded-xl flex items-center justify-center shrink-0 font-display font-black text-sm',
          isExpress ? 'bg-express-ink text-express-bg' : 'bg-pro-violet text-white'].join(' ')}>
          VP
        </div>
        {expanded && (
          <div className="flex-1 min-w-0">
            <p className={['font-display font-bold text-sm leading-tight', ink].join(' ')}>Vepay</p>
            <p className={['text-[10px] leading-tight', muted].join(' ')}>
              {isExpress ? 'Daily money tracking' : 'Subscription OS'}
            </p>
          </div>
        )}
        {/* Toggle button — desktop only */}
        <button
          type="button"
          onClick={onToggleExpanded}
          className={['hidden sm:flex h-8 w-8 rounded-lg items-center justify-center transition-colors shrink-0',
            isExpress ? 'hover:bg-express-bg text-express-muted' : 'hover:bg-pro-surface-2 text-pro-muted'].join(' ')}
          aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {expanded ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {/* Mode section */}
      <div className={['px-2 pt-4 pb-2 shrink-0', expanded ? '' : ''].join(' ')}>
        {expanded && (
          <p className={['text-[10px] font-bold uppercase tracking-widest px-2 mb-2', muted].join(' ')}>Mode</p>
        )}
        <div className="flex flex-col gap-1">
          <NavBtn
            icon={ShoppingBasket}
            label="Express"
            sublabel="For market traders"
            onClick={() => switchTo('EXPRESS')}
            active={currentMode === 'EXPRESS'}
            activeColor="border-express-green bg-express-green-soft text-express-green"
          />
          <NavBtn
            icon={Sparkles}
            label="Pro"
            sublabel="For developers"
            onClick={() => switchTo('PRO')}
            active={currentMode === 'PRO'}
            activeColor="border-pro-violet bg-pro-violet-soft text-pro-violet"
          />
        </div>
      </div>

      {/* Divider */}
      <div className={['mx-3 border-t my-1', border].join(' ')} />

      {/* Tools section */}
      <div className="px-2 pb-2">
        {expanded && (
          <p className={['text-[10px] font-bold uppercase tracking-widest px-2 mb-2 mt-2', muted].join(' ')}>Tools</p>
        )}
        <div className="flex flex-col gap-1">
          <NavBtn
            icon={Brain}
            label="Fingerprint"
            sublabel="Your money patterns"
            onClick={handleFingerprint}
          />
          {isExpress && (
            <NavBtn
              icon={PiggyBank}
              label="Savings"
              sublabel="Goals & vault"
              onClick={() => { onOpenSavings(); }}
            />
          )}
          <NavBtn
            icon={Terminal}
            label="DevTools"
            sublabel="Simulate scenarios"
            onClick={handleDevTools}
          />
          <NavBtn
            icon={isDark ? Sun : Moon}
            label={isDark ? 'Light mode' : 'Dark mode'}
            onClick={toggleTheme}
          />
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Divider */}
      <div className={['mx-3 border-t', border].join(' ')} />

      {/* User + Settings + Sign out */}
      <div className="px-2 py-3 shrink-0 flex flex-col gap-1">
        {/* Avatar + name — tappable to open profile */}
        {user && (
          <button
            type="button"
            onClick={onOpenProfile}
            className={['flex items-center gap-2.5 px-2 py-2 rounded-xl w-full text-left transition-colors hover:bg-opacity-50',
              isExpress ? 'hover:bg-express-bg' : 'hover:bg-pro-surface-2',
              expanded ? '' : 'justify-center'].join(' ')}
          >
            <div
              className="h-8 w-8 rounded-xl flex items-center justify-center font-display font-bold text-xs text-white shrink-0"
              style={{ backgroundColor: user.avatarColor }}
            >
              {user.initials}
            </div>
            {expanded && (
              <div className="min-w-0">
                <p className={['text-sm font-semibold truncate', ink].join(' ')}>{user.name}</p>
                <p className={['text-[10px] truncate', muted].join(' ')}>{user.email}</p>
              </div>
            )}
          </button>
        )}
        <NavBtn icon={Settings} label="Settings" onClick={handleSettings} />
        <NavBtn icon={LogOut} label="Sign out" onClick={() => { signOut(); onCloseMobile(); }} danger />
      </div>
    </div>
  );

  return (
    <>
      {/* ── Desktop sidebar — fixed left rail ───────────────────────────── */}
      <aside className={[
        'hidden sm:flex flex-col fixed left-0 top-0 bottom-0 z-30 border-r transition-[width] duration-300 overflow-hidden',
        border, bg,
        expanded ? 'w-56' : 'w-16',
      ].join(' ')}>
        {content}
      </aside>

      {/* The mobile hamburger now lives inside each dashboard header
          (see MobileMenuButton below) so it scrolls with the header
          instead of floating over the page content. */}

      {/* ── Mobile: backdrop + left-slide panel ─────────────────────────── */}
      {mobileOpen && (
        <div className="sm:hidden fixed inset-0 z-[60]">
          {/* Backdrop — tap to close */}
          <div
            className="absolute inset-0 animate-backdrop-in"
            style={{ backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)' }}
            onClick={onCloseMobile}
            aria-label="Close navigation"
          />

          {/* Panel — slides in from left */}
          <div
            className={[
              'absolute left-0 top-0 bottom-0 w-72 border-r shadow-2xl animate-modal-in',
              border, bg,
            ].join(' ')}
            style={{ animationName: 'slideInLeft' }}
          >
            {/* Mobile header with close */}
            <div className={['flex items-center justify-between px-4 py-4 border-b', border].join(' ')}>
              <div className="flex items-center gap-2.5">
                <div className={['h-8 w-8 rounded-xl flex items-center justify-center font-display font-black text-xs',
                  isExpress ? 'bg-express-ink text-express-bg' : 'bg-pro-violet text-white'].join(' ')}>
                  VP
                </div>
                <p className={['font-display font-bold text-sm', ink].join(' ')}>Vepay</p>
              </div>
              <button
                type="button"
                onClick={onCloseMobile}
                className={['rounded-full p-1.5', muted].join(' ')}
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable nav content */}
            <div className="overflow-y-auto overscroll-contain h-[calc(100%-64px)]">
              <div className="px-3 pt-4 pb-2">
                <p className={['text-[10px] font-bold uppercase tracking-widest px-1 mb-2', muted].join(' ')}>Mode</p>
                <div className="flex flex-col gap-1">
                  {(['EXPRESS', 'PRO'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => switchTo(m)}
                      className={['flex items-center gap-3 rounded-xl border px-3 py-3 text-left transition-all',
                        currentMode === m
                          ? m === 'EXPRESS'
                            ? 'border-express-green bg-express-green-soft'
                            : 'border-pro-violet bg-pro-violet-soft'
                          : (isExpress ? 'border-transparent hover:bg-express-bg' : 'border-transparent hover:bg-pro-surface-2')].join(' ')}
                    >
                      {m === 'EXPRESS'
                        ? <ShoppingBasket className={['h-5 w-5', currentMode === 'EXPRESS' ? 'text-express-green' : muted].join(' ')} />
                        : <Sparkles className={['h-5 w-5', currentMode === 'PRO' ? 'text-pro-violet' : muted].join(' ')} />
                      }
                      <div>
                        <div className="flex items-center gap-2">
                          <p className={['font-semibold text-sm', ink].join(' ')}>
                            {m === 'EXPRESS' ? 'Express Mode' : 'Pro Mode'}
                          </p>
                          {currentMode === m && (
                            <span className={['text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white',
                              m === 'EXPRESS' ? 'bg-express-green' : 'bg-pro-violet'].join(' ')}>
                              ACTIVE
                            </span>
                          )}
                        </div>
                        <p className={['text-xs mt-0.5', muted].join(' ')}>
                          {m === 'EXPRESS' ? 'For market traders & artisans' : 'For developers & creators'}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className={['mx-4 border-t my-2', border].join(' ')} />

              <div className="px-3 pb-2">
                <p className={['text-[10px] font-bold uppercase tracking-widest px-1 mb-2', muted].join(' ')}>Tools</p>
                <div className="flex flex-col gap-1">
                  {[
                    { icon: Brain, label: 'Financial Fingerprint', sub: 'Your money patterns', action: handleFingerprint },
                    ...(isExpress ? [{ icon: PiggyBank, label: 'Savings', sub: 'Goals & vault', action: () => { onOpenSavings(); onCloseMobile(); } }] : []),
                    { icon: Terminal, label: 'DevTools', sub: 'Simulate scenarios', action: handleDevTools },
                    { icon: isDark ? Sun : Moon, label: isDark ? 'Switch to light' : 'Switch to dark', action: toggleTheme },
                    { icon: Settings, label: 'Settings', sub: 'Profile & preferences', action: handleSettings },
                  ].map(({ icon: Icon, label, sub, action }) => (
                    <button
                      key={label}
                      type="button"
                      onClick={action}
                      className={['flex items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-left transition-colors',
                        isExpress ? 'hover:bg-express-bg' : 'hover:bg-pro-surface-2'].join(' ')}
                    >
                      <Icon className={['h-5 w-5 shrink-0', muted].join(' ')} />
                      <div>
                        <p className={['text-sm font-semibold', ink].join(' ')}>{label}</p>
                        {sub && <p className={['text-xs', muted].join(' ')}>{sub}</p>}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className={['mx-4 border-t my-2', border].join(' ')} />

              {/* User + sign out */}
              <div className="px-3 pb-6">
                {user && (
                  <button
                    type="button"
                    onClick={() => { onOpenProfile(); onCloseMobile(); }}
                    className={['w-full flex items-center gap-3 px-2 py-3 mb-1 rounded-xl text-left transition-colors',
                      isExpress ? 'hover:bg-express-bg' : 'hover:bg-pro-surface-2'].join(' ')}
                  >
                    <div
                      className="h-10 w-10 rounded-xl flex items-center justify-center font-display font-bold text-sm text-white shrink-0"
                      style={{ backgroundColor: user.avatarColor }}
                    >
                      {user.initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={['font-semibold text-sm truncate', ink].join(' ')}>{user.name}</p>
                      <p className={['text-xs truncate', muted].join(' ')}>{user.email}</p>
                      <p className={['text-[10px] font-medium mt-0.5', isExpress ? 'text-express-green' : 'text-pro-violet'].join(' ')}>
                        View profile →
                      </p>
                    </div>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => { signOut(); onCloseMobile(); }}
                  className={['w-full flex items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-left transition-colors',
                    isExpress ? 'hover:bg-express-red-soft text-express-red' : 'hover:bg-pro-red-soft text-pro-red'].join(' ')}
                >
                  <LogOut className="h-5 w-5 shrink-0" />
                  <p className="text-sm font-semibold">Sign out</p>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Mobile menu button — placed inside dashboard headers ──────────────────────
// Rendered inline in the sticky header so it scrolls with it (no position:fixed,
// so it never floats over content). Visibility is controlled by the
// `.vepay-mobile-menu-btn` CSS class (a media query), NOT an inline `display`,
// so nothing overrides the hide on desktop where the rail's own toggle is used.
export function MobileMenuButton({ onClick, tone }: { onClick: () => void; tone: 'express' | 'pro' }) {
  const isExpress = tone === 'express';
  return (
    <button
      type="button"
      onClick={onClick}
      className="vepay-mobile-menu-btn"
      style={{
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        padding: 0,
        flexShrink: 0,
        alignItems: 'center',
      }}
      aria-label="Open navigation"
    >
      <div style={{
        width: '38px', height: '38px',
        borderRadius: '10px',
        border: `1px solid ${isExpress ? 'var(--express-border)' : 'var(--pro-border)'}`,
        background: isExpress ? 'var(--express-bg)' : 'var(--pro-bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        color: isExpress ? 'var(--express-ink)' : 'var(--pro-ink)',
      }}>
        <Menu style={{ width: '18px', height: '18px' }} />
      </div>
    </button>
  );
}

// ── DevTools Modal ────────────────────────────────────────────────────────────

export function DevToolsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { currentMode, simulateInsufficientFunds, simulateExpiredCard, resetSimulations, retryPayment, processing } = useClearSpend();
  const isExpress = currentMode === 'EXPRESS';
  const anyProcessing = Object.keys(processing).length > 0;

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-backdrop-in"
      style={{ backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className={['w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden animate-modal-in mx-auto',
        isExpress ? 'bg-express-surface border-express-border' : 'bg-pro-surface border-pro-border'].join(' ')}>

        <div className={['flex items-center justify-between gap-3 px-6 py-5 border-b',
          isExpress ? 'border-express-border bg-express-bg' : 'border-pro-border bg-pro-surface-2'].join(' ')}>
          <div className="flex items-center gap-3">
            <div className={['rounded-xl p-2.5', isExpress ? 'bg-express-ink' : 'bg-pro-violet/20'].join(' ')}>
              <Terminal className={['h-5 w-5', isExpress ? 'text-express-bg' : 'text-pro-violet'].join(' ')} />
            </div>
            <div>
              <p className={['font-display font-bold text-base', isExpress ? 'text-express-ink' : 'text-pro-ink'].join(' ')}>DevTools</p>
              <p className={['text-xs', isExpress ? 'text-express-muted' : 'text-pro-muted'].join(' ')}>Trigger Nomba webhook scenarios</p>
            </div>
          </div>
          <button type="button" onClick={onClose}
            className={['rounded-full p-1.5', isExpress ? 'text-express-muted' : 'text-pro-muted'].join(' ')}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-3">
          {[
            {
              icon: AlertTriangle, label: 'Simulate Insufficient Funds',
              sub: 'Declines an active charge via Nomba webhook — surfaces recovery banner.',
              action: () => { simulateInsufficientFunds(); onClose(); },
              color: isExpress ? 'border-express-red/30 bg-express-red-soft' : 'border-pro-red/30 bg-pro-red-soft',
              iconCls: isExpress ? 'text-express-red' : 'text-pro-red',
              iconBg: isExpress ? 'bg-express-red/20' : 'bg-pro-red/20',
            },
            {
              icon: CreditCard, label: 'Simulate Expired Card',
              sub: 'Flags the Nomba tokenised card on Vercel Pro as expiring.',
              action: () => { simulateExpiredCard(); onClose(); },
              color: isExpress ? 'border-express-amber/30 bg-express-amber-soft' : 'border-pro-amber/30 bg-pro-amber/10',
              iconCls: isExpress ? 'text-express-amber' : 'text-pro-amber',
              iconBg: isExpress ? 'bg-express-amber/20' : 'bg-pro-amber/20',
            },
            {
              icon: Wifi, label: 'Retry with Idempotency-Key',
              sub: 'Safe retry over a flaky connection — proves no double-charge occurs.',
              action: () => { retryPayment('pro-vercel'); onClose(); },
              color: isExpress ? 'border-express-green/30 bg-express-green-soft' : 'border-pro-cyan/30 bg-pro-cyan/10',
              iconCls: isExpress ? 'text-express-green' : 'text-pro-cyan',
              iconBg: isExpress ? 'bg-express-green/20' : 'bg-pro-cyan/20',
              disabled: anyProcessing,
            },
          ].map(({ icon: Icon, label, sub, action, color, iconCls, iconBg, disabled }) => (
            <button key={label} type="button" onClick={action} disabled={disabled}
              className={['flex items-start gap-4 rounded-2xl border px-4 py-4 text-left transition-colors disabled:opacity-50', color].join(' ')}>
              <div className={['rounded-xl p-2 shrink-0', iconBg].join(' ')}>
                <Icon className={['h-5 w-5', iconCls].join(' ')} />
              </div>
              <div>
                <p className={['font-display font-semibold text-sm', isExpress ? 'text-express-ink' : 'text-pro-ink'].join(' ')}>{label}</p>
                <p className={['text-xs mt-1 leading-relaxed', isExpress ? 'text-express-muted' : 'text-pro-muted'].join(' ')}>{sub}</p>
              </div>
            </button>
          ))}

          <button type="button" onClick={() => { resetSimulations(); onClose(); }}
            className={['flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition-colors',
              isExpress ? 'border-express-border text-express-ink hover:bg-express-bg' : 'border-pro-border text-pro-ink hover:bg-pro-surface-2'].join(' ')}>
            <RotateCcw className="h-4 w-4" />
            Reset all simulations
          </button>
        </div>
      </div>
    </div>
  );
}
