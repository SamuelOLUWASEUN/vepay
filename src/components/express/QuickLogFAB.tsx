import { useState } from 'react';
import { Plus, X, Check } from 'lucide-react';
import { useClearSpend } from '../../context/ClearSpendContext';
import { formatCurrency } from '../../lib/currency';

// ─────────────────────────────────────────────────────────────────────────────
// Inputs defined OUTSIDE to prevent remount on every state change
// ─────────────────────────────────────────────────────────────────────────────

interface AmountInputProps {
  value: string;
  onChange: (v: string) => void;
  onEnter: () => void;
}

function AmountInput({ value, onChange, onEnter }: AmountInputProps) {
  return (
    <div className="relative">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono font-bold text-xl text-express-muted">
        ₦
      </span>
      <input
        id="quick-log-amount"
        type="number"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') onEnter(); }}
        placeholder="0"
        min="1"
        autoFocus
        className="w-full rounded-2xl border-2 border-express-border bg-express-bg pl-10 pr-4 py-4 font-mono text-2xl font-bold text-express-ink placeholder-express-border outline-none focus:border-express-green transition-colors"
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
      className="w-full rounded-xl border border-express-border bg-express-bg px-4 py-3 text-sm text-express-ink placeholder-express-muted outline-none focus:border-express-green transition-colors"
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Quick Log Modal
// ─────────────────────────────────────────────────────────────────────────────

interface QuickLogModalProps {
  open: boolean;
  onClose: () => void;
}

function QuickLogModal({ open, onClose }: QuickLogModalProps) {
  const { logDailySpend, todaySpendNGN, dailyBudgetNGN } = useClearSpend();
  const [amount, setAmount] = useState('');
  const [label, setLabel] = useState('');
  const [logged, setLogged] = useState(false);

  if (!open) return null;

  const pct = Math.min(todaySpendNGN / dailyBudgetNGN, 1);
  const isOver = todaySpendNGN > dailyBudgetNGN;
  const isWarn = pct >= 0.7 && !isOver;
  const barColor = isOver ? 'bg-express-red' : isWarn ? 'bg-express-amber' : 'bg-express-green';
  const totalColor = isOver ? 'text-express-red' : isWarn ? 'text-express-amber' : 'text-express-green';

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
    <div
      className="fixed inset-0 z-[55] flex items-end sm:items-center justify-center p-4 animate-backdrop-in"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-sm bg-express-surface rounded-3xl border border-express-border shadow-2xl overflow-hidden animate-modal-in">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-express-border bg-express-bg">
          <div>
            <p className="font-display font-bold text-express-ink">Log a spend</p>
            <p className="text-xs text-express-muted mt-0.5">Add it now before you forget</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-express-muted hover:text-express-ink transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Today's running total */}
        <div className="px-5 pt-4 pb-3">
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-xs text-express-muted font-semibold">Today so far</span>
            <span className={['font-mono font-bold text-lg', totalColor].join(' ')}>
              {formatCurrency(todaySpendNGN, 'NGN')}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-express-border overflow-hidden">
            <div
              className={['h-full rounded-full transition-all duration-500', barColor].join(' ')}
              style={{ width: `${Math.min(pct * 100, 100)}%` }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-express-muted">
              {isOver
                ? `₦${Math.abs(dailyBudgetNGN - todaySpendNGN).toLocaleString('en-NG')} over`
                : `₦${(dailyBudgetNGN - todaySpendNGN).toLocaleString('en-NG')} left`}
            </span>
            <span className="text-[10px] text-express-muted">
              Budget: {formatCurrency(dailyBudgetNGN, 'NGN')}
            </span>
          </div>
        </div>

        {/* Inputs */}
        <div className="px-5 pb-5 flex flex-col gap-3">
          <AmountInput value={amount} onChange={setAmount} onEnter={handleLog} />
          <LabelInput value={label} onChange={setLabel} onEnter={handleLog} />

          <button
            type="button"
            onClick={handleLog}
            disabled={!amount || parseFloat(amount) <= 0 || logged}
            className={[
              'w-full flex items-center justify-center gap-2 rounded-2xl py-3.5 font-display font-bold text-base transition-all',
              logged
                ? 'bg-express-green-soft text-express-green'
                : 'bg-express-ink text-express-bg disabled:opacity-40',
            ].join(' ')}
          >
            {logged ? (
              <><Check className="h-5 w-5" /> Logged!</>
            ) : (
              <>Log spend ₦{amount ? parseFloat(amount).toLocaleString('en-NG') : '—'}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Floating Action Button + Modal — Express Mode only
// ─────────────────────────────────────────────────────────────────────────────

/**
 * QuickLogFAB — floating action button fixed to the bottom-right.
 *
 * Always visible in Express Mode regardless of scroll position.
 * One tap → compact modal → type amount → Log. Three seconds maximum.
 * The fastest possible path from "I just spent money" to "it's recorded."
 */
export function QuickLogFAB() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Floating button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={[
          'fixed bottom-6 right-6 z-40',
          'h-16 w-16 rounded-full shadow-2xl',
          'bg-express-green text-white',
          'flex items-center justify-center',
          'transition-all duration-200',
          'hover:scale-110 active:scale-95',
          open ? 'scale-0 opacity-0' : 'scale-100 opacity-100',
        ].join(' ')}
        aria-label="Log a spend"
        title="Log a spend"
      >
        <Plus className="h-8 w-8" strokeWidth={2.5} />
      </button>

      {/* Label that appears above the button */}
      {!open && (
        <div className="fixed bottom-24 right-4 z-40 pointer-events-none">
          <div className="bg-express-ink text-express-bg text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg opacity-0 hover:opacity-100 transition-opacity">
            Log a spend
          </div>
        </div>
      )}

      <QuickLogModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
