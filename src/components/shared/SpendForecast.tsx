import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, TrendingUp, AlertTriangle, Clock } from 'lucide-react';
import { useClearSpend } from '../../context/ClearSpendContext';
import { convertCurrency, formatCurrency, frequencyLabel } from '../../lib/currency';
import type { Expense } from '../../types';

interface ForecastProps {
  mode: 'EXPRESS' | 'PRO';
}

function getMonthlyNGN(expense: Expense): number {
  const ngn = expense.currency === 'USD' ? expense.amount * 1500 : expense.amount;
  switch (expense.frequency) {
    case 'daily':   return ngn * 30;
    case 'weekly':  return ngn * 4.3;
    case 'monthly': return ngn;
    case 'yearly':  return ngn / 12;
  }
}

function daysUntil(dateStr: string): number {
  const today = new Date('2026-06-16').getTime();
  return Math.ceil((new Date(dateStr).getTime() - today) / (1000 * 60 * 60 * 24));
}

/**
 * Recurring Spend Forecast — "This Month Will Cost You"
 *
 * The summary card is always visible. Tapping "View breakdown" expands
 * an inline accordion panel showing each recurring obligation's monthly
 * equivalent, its share of the total as a bar, and its due date.
 *
 * No modal needed — everything lives in context, the number and the
 * breakdown are visible simultaneously.
 */
export function SpendForecast({ mode }: ForecastProps) {
  const { expenses, displayCurrency } = useClearSpend();
  const isExpress = mode === 'EXPRESS';
  const [open, setOpen] = useState(false);

  const relevantExpenses = useMemo(() =>
    expenses.filter((e) => e.type === (isExpress ? 'local' : 'tech') && e.status === 'active'),
    [expenses, isExpress],
  );

  const withMonthly = useMemo(() =>
    relevantExpenses
      .map((e) => ({ expense: e, monthlyNGN: getMonthlyNGN(e) }))
      .sort((a, b) => b.monthlyNGN - a.monthlyNGN),
    [relevantExpenses],
  );

  const monthlyTotalNGN = useMemo(() =>
    withMonthly.reduce((s, { monthlyNGN }) => s + monthlyNGN, 0),
    [withMonthly],
  );

  const heaviestWeek = useMemo(() => {
    const weeks: Record<string, number> = { 'Jun 1–7': 0, 'Jun 8–15': 0, 'Jun 16–23': 0, 'Jun 24–30': 0 };
    withMonthly.forEach(({ expense, monthlyNGN }) => {
      const day = parseInt(expense.dueDate.slice(8, 10), 10);
      if (day <= 7) weeks['Jun 1–7'] += monthlyNGN;
      else if (day <= 15) weeks['Jun 8–15'] += monthlyNGN;
      else if (day <= 23) weeks['Jun 16–23'] += monthlyNGN;
      else weeks['Jun 24–30'] += monthlyNGN;
    });
    return Object.entries(weeks).sort((a, b) => b[1] - a[1])[0];
  }, [withMonthly]);

  // Display conversion
  const tgt = isExpress ? 'NGN' : displayCurrency;
  const fmt = (ngn: number) => formatCurrency(convertCurrency(ngn, 'NGN', tgt), tgt);

  // Colour system
  const c = isExpress ? {
    card: 'border-express-border bg-express-surface',
    header: 'bg-express-bg border-express-border',
    icon: 'text-express-muted',
    label: 'text-express-muted',
    amount: 'text-express-ink',
    badge: 'bg-express-amber-soft text-express-amber border-express-amber/30',
    sub: 'text-express-muted',
    row: 'border-express-border',
    rowHover: 'hover:bg-express-bg',
    bar: 'bg-express-border',
    barFill: 'bg-express-green',
    barFillFailed: 'bg-express-red',
    barFillTrial: 'bg-express-amber',
    ink: 'text-express-ink',
    muted: 'text-express-muted',
    toggle: 'text-express-green border-express-green/40 bg-express-green-soft hover:bg-express-green/15',
    total: 'border-express-border',
  } : {
    card: 'border-pro-border bg-pro-surface',
    header: 'bg-pro-surface-2 border-pro-border',
    icon: 'text-pro-muted',
    label: 'text-pro-muted',
    amount: 'text-pro-ink',
    badge: 'bg-pro-amber/15 text-pro-amber border-pro-amber/30',
    sub: 'text-pro-muted',
    row: 'border-pro-border',
    rowHover: 'hover:bg-pro-surface-2',
    bar: 'bg-pro-border',
    barFill: 'bg-pro-cyan',
    barFillFailed: 'bg-pro-red',
    barFillTrial: 'bg-pro-amber',
    ink: 'text-pro-ink',
    muted: 'text-pro-muted',
    toggle: 'text-pro-cyan border-pro-cyan/40 bg-pro-cyan/10 hover:bg-pro-cyan/15',
    total: 'border-pro-border',
  };

  const failedCount = expenses.filter(
    (e) => e.type === (isExpress ? 'local' : 'tech') && e.status === 'failed'
  ).length;

  return (
    <div className={['rounded-2xl border shadow-sm overflow-hidden', c.card].join(' ')}>
      {/* ── Summary header ──────────────────────────────────────────── */}
      <div className="px-5 py-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className={['h-4 w-4', c.icon].join(' ')} />
          <p className={['text-xs font-semibold uppercase tracking-wide', c.label].join(' ')}>
            This month will cost you
          </p>
          {failedCount > 0 && (
            <span className="ml-auto flex items-center gap-1 rounded-full bg-express-red/15 text-express-red text-[10px] font-bold px-2 py-0.5">
              <AlertTriangle className="h-2.5 w-2.5" />
              {failedCount} failed
            </span>
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <p className={['font-mono text-2xl sm:text-3xl font-bold break-all', c.amount].join(' ')}>
              {fmt(monthlyTotalNGN)}
            </p>

            {/* ── The tappable trigger ──────────────────────────── */}
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className={[
                'inline-flex items-center gap-1.5 mt-2 rounded-full border px-3 py-1 text-xs font-semibold transition-colors',
                c.toggle,
              ].join(' ')}
              aria-expanded={open}
            >
              {open ? (
                <>Hide breakdown <ChevronUp className="h-3.5 w-3.5" /></>
              ) : (
                <>
                  From {relevantExpenses.length} {isExpress ? 'obligation' : 'subscription'}{relevantExpenses.length !== 1 ? 's' : ''} · View breakdown
                  <ChevronDown className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </div>

          {heaviestWeek[1] > 0 && (
            <div className={['rounded-xl border px-3 py-2 self-start sm:text-right shrink-0', c.badge].join(' ')}>
              <p className="text-[10px] font-semibold uppercase tracking-wide opacity-75 mb-0.5">
                Heaviest week
              </p>
              <p className="font-mono font-bold text-sm">{fmt(heaviestWeek[1])}</p>
              <p className="text-[10px] opacity-75">{heaviestWeek[0]}</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Inline breakdown accordion ───────────────────────────────── */}
      {open && (
        <div className={['border-t', c.row].join(' ')}>
          {/* Column headers */}
          <div className={['grid grid-cols-[1fr_auto] gap-x-3 px-5 py-2 border-b text-[10px] font-bold uppercase tracking-widest', c.row, c.muted].join(' ')}>
            <span>Obligation</span>
            <span className="text-right">Monthly equiv.</span>
          </div>

          {/* Expense rows */}
          <div className="divide-y" style={{ borderColor: 'var(--express-border, #f0e1cd)' }}>
            {withMonthly.map(({ expense, monthlyNGN }) => {
              const pct = monthlyTotalNGN > 0 ? (monthlyNGN / monthlyTotalNGN) * 100 : 0;
              const days = daysUntil(expense.dueDate);
              const isFailed = expense.status === 'failed';
              const isTrial = expense.isTrial;
              const barColor = isFailed ? c.barFillFailed : isTrial ? c.barFillTrial : c.barFill;

              return (
                <div key={expense.id} className={['px-5 py-3.5 transition-colors', c.rowHover].join(' ')}>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-xl shrink-0">{expense.categoryIcon}</span>
                      <div className="min-w-0">
                        <p className={['font-medium text-sm leading-tight truncate', c.ink].join(' ')}>
                          {expense.name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className={['text-[10px]', c.muted].join(' ')}>
                            {formatCurrency(expense.amount, expense.currency)}{frequencyLabel(expense.frequency)}
                          </span>
                          {isFailed && (
                            <span className="text-[10px] font-semibold text-express-red bg-express-red/10 px-1.5 py-0.5 rounded-full">
                              Failed
                            </span>
                          )}
                          {isTrial && !isFailed && (
                            <span className={['text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex items-center gap-1', c.badge].join(' ')}>
                              <Clock className="h-2.5 w-2.5" />
                              Trial · {expense.trialDaysLeft}d
                            </span>
                          )}
                          {!isFailed && (
                            <span className={['text-[10px]', days <= 0 ? 'text-express-red font-semibold' : days <= 3 ? 'text-express-amber font-semibold' : c.muted].join(' ')}>
                              {days <= 0 ? '⚡ Due today' : days === 1 ? 'Due tomorrow' : `Due in ${days}d`}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className={['font-mono text-sm font-semibold', c.ink].join(' ')}>
                        {fmt(monthlyNGN)}
                      </p>
                      <p className={['text-[10px]', c.muted].join(' ')}>/mo equiv.</p>
                    </div>
                  </div>

                  {/* Share bar */}
                  <div className="flex items-center gap-2">
                    <div className={['flex-1 h-1.5 rounded-full overflow-hidden', c.bar].join(' ')}>
                      <div
                        className={['h-full rounded-full transition-all duration-500', barColor].join(' ')}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className={['text-[10px] font-mono w-8 text-right shrink-0', c.muted].join(' ')}>
                      {Math.round(pct)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Total footer */}
          <div className={['flex items-center justify-between px-5 py-3.5 border-t', c.total].join(' ')}>
            <p className={['text-sm font-semibold', c.ink].join(' ')}>Total this month</p>
            <p className={['font-mono text-base font-bold', c.amount].join(' ')}>{fmt(monthlyTotalNGN)}</p>
          </div>
        </div>
      )}
    </div>
  );
}
