import { useState } from 'react';
import { PencilLine, Check, X } from 'lucide-react';
import { useClearSpend } from '../../context/ClearSpendContext';
import { formatCurrency } from '../../lib/currency';

/**
 * Budget Envelope System — Express Mode
 *
 * Users set a weekly spending cap per category at the start of the week.
 * The action grid buttons already log spend — this card shows how much
 * remains in each envelope in real time, turning from green → amber → red
 * as the week fills up. Transforms Express from a logger into a planner.
 */
export function BudgetEnvelopes() {
  const { budgetEnvelopes, updateEnvelopeBudget } = useClearSpend();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  function startEdit(categoryId: string, current: number) {
    setEditingId(categoryId);
    setEditValue(String(current));
  }

  function commitEdit(categoryId: string) {
    const val = parseInt(editValue.replace(/[^0-9]/g, ''), 10);
    if (!isNaN(val) && val > 0) updateEnvelopeBudget(categoryId, val);
    setEditingId(null);
  }

  return (
    <div className="rounded-2xl border border-express-border bg-express-surface shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 border-b border-express-border">
        <p className="font-display text-sm font-semibold text-express-ink">
          Weekly Budget Envelopes
        </p>
        <p className="text-xs text-express-muted mt-0.5">
          Set a limit for each category — tap ✏️ to change
        </p>
      </div>

      <div className="divide-y divide-express-border">
        {budgetEnvelopes.map((env) => {
          const pct = Math.min(env.spentThisWeekNGN / env.weeklyBudgetNGN, 1);
          const remaining = env.weeklyBudgetNGN - env.spentThisWeekNGN;
          const isOver = remaining < 0;
          const barColor = pct >= 1 ? 'bg-express-red' : pct >= 0.7 ? 'bg-express-amber' : 'bg-express-green';
          const labelColor = pct >= 1 ? 'text-express-red' : pct >= 0.7 ? 'text-express-amber' : 'text-express-green';
          const isEditing = editingId === env.categoryId;

          return (
            <div key={env.categoryId} className="px-5 py-3">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{env.icon}</span>
                  <span className="font-medium text-express-ink text-sm">{env.label}</span>
                </div>

              <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                  {isEditing ? (
                    <>
                      <span className="text-xs text-express-muted">₦</span>
                      <input
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') commitEdit(env.categoryId); if (e.key === 'Escape') setEditingId(null); }}
                        className="w-24 rounded-lg border border-express-border bg-express-bg text-express-ink text-sm font-mono px-2 py-1.5 text-right focus:outline-none focus:border-express-green"
                        autoFocus
                      />
                      <button type="button" onClick={() => commitEdit(env.categoryId)}
                        className="p-1.5 rounded-lg bg-express-green-soft text-express-green">
                        <Check className="h-4 w-4" />
                      </button>
                      <button type="button" onClick={() => setEditingId(null)}
                        className="p-1.5 rounded-lg bg-express-border text-express-muted">
                        <X className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <span className={['font-mono text-xs font-semibold', labelColor].join(' ')}>
                        {isOver ? `₦${Math.abs(remaining).toLocaleString('en-NG')} over` : `${formatCurrency(remaining, 'NGN')} left`}
                      </span>
                      <button
                        type="button"
                        onClick={() => startEdit(env.categoryId, env.weeklyBudgetNGN)}
                        className="p-1.5 rounded-lg text-express-muted hover:text-express-ink hover:bg-express-bg transition-colors"
                        aria-label={`Edit ${env.label} budget`}
                      >
                        <PencilLine className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-2 rounded-full bg-express-border overflow-hidden">
                <div
                  className={['h-full rounded-full transition-all duration-500', barColor].join(' ')}
                  style={{ width: `${Math.min(pct * 100, 100)}%` }}
                />
              </div>

              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-express-muted">
                  {formatCurrency(env.spentThisWeekNGN, 'NGN')} spent
                </span>
                <span className="text-[10px] text-express-muted">
                  Budget: {formatCurrency(env.weeklyBudgetNGN, 'NGN')}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
