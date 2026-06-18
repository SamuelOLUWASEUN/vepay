import {
  Brain,
  CreditCard,
  Pause,
  Play,
  RefreshCw,
  Sparkles,
  Train,
  Triangle,
  Tv,
  PenTool,
  Trash2,
  type LucideIcon,
} from 'lucide-react';
import { useClearSpend } from '../../context/ClearSpendContext';
import { formatConverted, frequencyLabel } from '../../lib/currency';
import type { Expense } from '../../types';

const ICON_MAP: Record<string, LucideIcon> = {
  Sparkles,
  Brain,
  Triangle,
  Tv,
  PenTool,
  Train,
};

function statusBadge(expense: Expense) {
  if (expense.status === 'failed') {
    return expense.failureReason === 'expired_card'
      ? { label: 'Card expired', className: 'bg-pro-red/15 text-pro-red' }
      : { label: 'Declined', className: 'bg-pro-red/15 text-pro-red' };
  }
  if (expense.status === 'paused') {
    return { label: 'Paused', className: 'bg-pro-muted/15 text-pro-muted' };
  }
  if (expense.sharedGroup) {
    return { label: 'Syndicate', className: 'bg-pro-cyan/15 text-pro-cyan' };
  }
  return { label: 'Active', className: 'bg-pro-violet/15 text-pro-violet' };
}

/**
 * Usage-based SaaS expenditure list. Failed items (e.g. Vercel Pro with an
 * expired tokenised card) pulse red and offer a self-serve retry. Active
 * items can be paused in one tap, moving them into the Paused section
 * without deleting the underlying mandate.
 */
export function SaaSExpenseList() {
  const { expenses, displayCurrency, pauseExpense, resumeExpense, retryPayment, processing, cancelExpense } =
    useClearSpend();

  const tech = expenses.filter((e) => e.type === 'tech' && !e.isTrial);
  const active = tech.filter((e) => e.status !== 'paused');
  const paused = tech.filter((e) => e.status === 'paused');

  return (
    <div className="flex flex-col gap-3">
      <p className="font-display text-sm font-semibold text-pro-ink px-1">
        SaaS &amp; API Subscriptions
      </p>

      {active.map((expense) => {
        const Icon = ICON_MAP[expense.categoryIcon] ?? Sparkles;
        const badge = statusBadge(expense);
        const isFailed = expense.status === 'failed';
        const isProcessing = Boolean(processing[expense.id]);

        return (
          <div
            key={expense.id}
            className={[
              'flex items-center gap-3 rounded-2xl border px-4 py-3.5 shadow-sm transition-colors',
              isFailed
                ? 'border-pro-red/40 bg-pro-red-soft animate-pulse'
                : 'border-pro-border bg-pro-surface',
            ].join(' ')}
          >
            <div
              className={[
                'rounded-xl p-2.5',
                isFailed ? 'bg-pro-red/15' : 'bg-pro-violet/15',
              ].join(' ')}
            >
              <Icon className={['h-4 w-4', isFailed ? 'text-pro-red' : 'text-pro-violet'].join(' ')} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-pro-ink text-sm truncate">{expense.name}</p>
                <span className={['rounded-full px-2 py-0.5 text-[10px] font-semibold', badge.className].join(' ')}>
                  {badge.label}
                </span>
              </div>
              <p className="text-xs text-pro-muted mt-0.5">
                {expense.sharedGroup
                  ? `${expense.sharedGroup.pendingMembers.length} pending invites · fee accrued ${formatConverted(expense.sharedGroup.platformFeeAccrued, 'USD', displayCurrency)}`
                  : `Due ${expense.dueDate} ${frequencyLabel(expense.frequency)}`}
              </p>
            </div>

                <div className="flex flex-col items-end gap-1.5 shrink-0 max-w-[120px]">
              <span className="font-mono text-sm font-semibold text-pro-ink">
                {formatConverted(expense.amount, expense.currency, displayCurrency)}
              </span>

              {isFailed ? (
                <button
                  type="button"
                  onClick={() => retryPayment(expense.id)}
                  disabled={isProcessing}
                  className="inline-flex items-center gap-1 rounded-lg bg-pro-red text-white text-xs font-semibold px-2.5 py-1 disabled:opacity-60"
                >
                  {isProcessing ? (
                    <RefreshCw className="h-3 w-3 animate-spin" />
                  ) : (
                    <CreditCard className="h-3 w-3" />
                  )}
                  {isProcessing ? 'Retrying…' : 'Update card'}
                </button>
              ) : (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => pauseExpense(expense.id)}
                    className="inline-flex items-center gap-1 rounded-lg border border-pro-border text-pro-ink text-xs font-semibold px-2.5 py-1 hover:bg-pro-surface-2 transition-colors"
                  >
                    <Pause className="h-3 w-3" />
                    Pause
                  </button>
                  <button
                    type="button"
                    onClick={() => cancelExpense(expense.id)}
                    className="inline-flex items-center gap-1 rounded-lg border border-pro-red/30 text-pro-red text-xs font-semibold px-2.5 py-1 hover:bg-pro-red/10 transition-colors"
                    title="Cancel & move to Graveyard"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {paused.length > 0 && (
        <div className="mt-2">
          <p className="font-display text-sm font-semibold text-pro-muted px-1 mb-2">Paused</p>
          {paused.map((expense) => {
            const Icon = ICON_MAP[expense.categoryIcon] ?? Sparkles;
            return (
              <div
                key={expense.id}
                className="flex items-center gap-3 rounded-2xl border border-pro-border bg-pro-bg/60 px-4 py-3.5 mb-2 opacity-70"
              >
                <div className="rounded-xl bg-pro-surface-2 p-2.5">
                  <Icon className="h-4 w-4 text-pro-muted" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-pro-ink text-sm truncate">{expense.name}</p>
                  <p className="text-xs text-pro-muted mt-0.5">Paused · resume anytime</p>
                </div>
                <span className="font-mono text-sm font-semibold text-pro-muted">
                  {formatConverted(expense.amount, expense.currency, displayCurrency)}
                </span>
                <button
                  type="button"
                  onClick={() => resumeExpense(expense.id)}
                  className="inline-flex items-center gap-1 rounded-lg border border-pro-border text-pro-ink text-xs font-semibold px-2.5 py-1 hover:bg-pro-surface-2 transition-colors"
                >
                  <Play className="h-3 w-3" />
                  Resume
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
