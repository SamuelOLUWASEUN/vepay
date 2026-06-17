import { ShieldCheck, Sparkles, X } from 'lucide-react';
import { useClearSpend } from '../../context/ClearSpendContext';
import { formatCurrency } from '../../lib/currency';

/**
 * "Human-in-the-Loop Agentic Confirmation Gate"
 *
 * The AI Agentic Optimizer never auto-executes. It surfaces this modal and
 * waits for explicit approval before mutating any subscription state —
 * proving the system can't accidentally cancel critical infrastructure.
 */
export function AgenticOptimizerModal() {
  const { agenticOptimizer, expenses, confirmAgenticOptimization, declineAgenticOptimization } =
    useClearSpend();

  if (!agenticOptimizer.open) return null;

  const targets = expenses.filter((e) => agenticOptimizer.targetIds.includes(e.id));
  const commission =
    agenticOptimizer.estimatedMonthlySavingsUSD * agenticOptimizer.commissionRate;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-3xl border border-pro-border bg-pro-surface shadow-2xl overflow-hidden mx-auto">
        <div className="flex items-start justify-between gap-3 border-b border-pro-border bg-pro-violet-soft px-6 py-5">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-pro-violet/20 p-2.5">
              <Sparkles className="h-5 w-5 text-pro-violet" />
            </div>
            <div>
              <p className="font-display font-semibold text-pro-ink text-base">
                AI Agentic Optimizer
              </p>
              <p className="text-xs text-pro-muted mt-0.5">
                Requesting permission to act on your behalf
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={declineAgenticOptimization}
            className="rounded-full p-1 text-pro-muted hover:text-pro-ink transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-pro-ink leading-relaxed">
            AI Agent wants permission to cancel{' '}
            <span className="font-semibold">{targets.length} unused seats</span>. Confirm
            optimization?
          </p>

          <div className="rounded-2xl border border-pro-border bg-pro-bg/60 divide-y divide-pro-border">
            {targets.map((t) => (
              <div key={t.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <div>
                  <p className="font-medium text-pro-ink">{t.name}</p>
                  <p className="text-xs text-pro-muted">
                    {t.isTrial ? `Trial · ${t.trialDaysLeft} days left` : 'Idle seat detected'}
                  </p>
                </div>
                <span className="font-mono text-pro-muted">
                  {formatCurrency(t.amount, t.currency)}/mo
                </span>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-pro-cyan/30 bg-pro-cyan/10 px-4 py-3 text-sm text-pro-ink flex items-center justify-between">
            <span>Estimated monthly savings</span>
            <span className="font-mono font-semibold text-pro-cyan">
              {formatCurrency(agenticOptimizer.estimatedMonthlySavingsUSD, 'USD')}
            </span>
          </div>

          <div className="rounded-2xl border border-pro-border bg-pro-surface-2 px-4 py-3 text-xs text-pro-muted flex items-center justify-between">
            <span>Vepay optimizer commission ({agenticOptimizer.commissionRate * 100}%)</span>
            <span className="font-mono text-pro-amber">{formatCurrency(commission, 'USD')}</span>
          </div>

          <div className="flex items-start gap-2 rounded-2xl border border-pro-border bg-pro-bg/40 px-4 py-3">
            <ShieldCheck className="h-4 w-4 text-pro-cyan shrink-0 mt-0.5" />
            <p className="text-xs text-pro-muted leading-relaxed">
              No changes are made until you approve. This action will pause (not delete) the
              affected subscriptions — fully reversible from the Paused section.
            </p>
          </div>
        </div>

        <div className="flex gap-3 px-6 pb-6">
          <button
            type="button"
            onClick={declineAgenticOptimization}
            className="flex-1 rounded-xl border border-pro-border px-4 py-2.5 text-sm font-semibold text-pro-ink hover:bg-pro-surface-2 transition-colors"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={confirmAgenticOptimization}
            className="flex-1 rounded-xl bg-pro-violet px-4 py-2.5 text-sm font-semibold text-white hover:bg-pro-violet/90 transition-colors shadow-lg shadow-pro-violet/30"
          >
            Confirm optimization
          </button>
        </div>
      </div>
    </div>
  );
}
