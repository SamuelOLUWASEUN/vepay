import { Pause, Play, RefreshCw } from 'lucide-react';
import { useClearSpend } from '../../context/ClearSpendContext';
import { formatCurrency, frequencyLabel } from '../../lib/currency';
import type { Expense } from '../../types';

function statusDot(status: Expense['status']) {
  switch (status) {
    case 'active':
      return 'bg-express-green';
    case 'failed':
      return 'bg-express-red';
    case 'paused':
      return 'bg-express-muted';
  }
}

/**
 * Lists every local (Express) recurring obligation with self-serve
 * "Pause" controls. Failed items surface a "Retry" action that runs the
 * idempotency-safe retry flow. Paused items move into their own section.
 */
export function ExpressExpenseList() {
  const { expenses, pauseExpense, resumeExpense, retryPayment, processing } = useClearSpend();

  const local = expenses.filter((e) => e.type === 'local');
  const active = local.filter((e) => e.status !== 'paused');
  const paused = local.filter((e) => e.status === 'paused');

  return (
    <div className="flex flex-col gap-3">
      <p className="font-display text-sm font-semibold text-express-ink px-1">
        Your recurring payments
      </p>

      {active.map((expense) => {
        const isProcessing = Boolean(processing[expense.id]);

        return (
          <div
            key={expense.id}
            className="flex items-center gap-3 rounded-2xl border border-express-border bg-express-surface px-4 py-3.5 shadow-sm"
          >
            <span className="text-2xl">{expense.categoryIcon}</span>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={['h-2 w-2 rounded-full shrink-0', statusDot(expense.status)].join(' ')} />
                <p className="font-medium text-express-ink text-sm truncate">{expense.name}</p>
              </div>
              <p className="text-xs text-express-muted mt-0.5">
                {expense.status === 'failed'
                  ? expense.failureReason === 'insufficient_funds'
                    ? 'Failed · Insufficient funds'
                    : 'Failed · Card expired'
                  : `Due ${expense.dueDate} · ${frequencyLabel(expense.frequency)}`}
              </p>
            </div>

            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <span className="font-mono text-sm font-semibold text-express-ink">
                {formatCurrency(expense.amount, expense.currency)}
              </span>

              {expense.status === 'failed' ? (
                <button
                  type="button"
                  onClick={() => retryPayment(expense.id)}
                  disabled={isProcessing}
                  className="inline-flex items-center gap-1 rounded-lg bg-express-red text-white text-xs font-semibold px-2.5 py-1 disabled:opacity-60"
                >
                  <RefreshCw className={['h-3 w-3', isProcessing ? 'animate-spin' : ''].join(' ')} />
                  {isProcessing ? 'Retrying…' : 'Retry'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => pauseExpense(expense.id)}
                  className="inline-flex items-center gap-1 rounded-lg border border-express-border text-express-ink text-xs font-semibold px-2.5 py-1 hover:bg-express-bg transition-colors"
                >
                  <Pause className="h-3 w-3" />
                  Pause
                </button>
              )}
            </div>
          </div>
        );
      })}

      {paused.length > 0 && (
        <div className="mt-2">
          <p className="font-display text-sm font-semibold text-express-muted px-1 mb-2">
            Paused
          </p>
          {paused.map((expense) => (
            <div
              key={expense.id}
              className="flex items-center gap-3 rounded-2xl border border-express-border bg-express-bg px-4 py-3.5 mb-2 opacity-80"
            >
              <span className="text-2xl">{expense.categoryIcon}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-express-ink text-sm truncate">{expense.name}</p>
                <p className="text-xs text-express-muted mt-0.5">Paused · resume anytime</p>
              </div>
              <span className="font-mono text-sm font-semibold text-express-muted">
                {formatCurrency(expense.amount, expense.currency)}
              </span>
              <button
                type="button"
                onClick={() => resumeExpense(expense.id)}
                className="inline-flex items-center gap-1 rounded-lg border border-express-border text-express-ink text-xs font-semibold px-2.5 py-1 hover:bg-express-surface transition-colors"
              >
                <Play className="h-3 w-3" />
                Resume
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
