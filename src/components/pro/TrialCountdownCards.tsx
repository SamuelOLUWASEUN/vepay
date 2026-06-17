import { Clock, CreditCard } from 'lucide-react';
import { useClearSpend } from '../../context/ClearSpendContext';
import { formatConverted } from '../../lib/currency';

/**
 * Horizontal countdown trial tracking. Surfaces every isTrial=true
 * subscription with days remaining, the converted post-trial charge, and
 * a one-tap "Cancel Trial" self-serve control — a key Nomba unhappy-path
 * scenario (preventing surprise charges after a trial converts).
 */
export function TrialCountdownCards() {
  const { expenses, displayCurrency, cancelTrial } = useClearSpend();

  const trials = expenses.filter((e) => e.isTrial && e.status === 'active');

  if (trials.length === 0) return null;

  return (
    <div>
      <p className="font-display text-sm font-semibold text-pro-ink mb-2 px-1">
        Active Trials — Will Convert Soon
      </p>
      {/* snap scroll with visible scroll hint on mobile */}
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory scroll-smooth">
        {trials.map((trial) => {
          const urgent = (trial.trialDaysLeft ?? 99) <= 5;
          return (
            <div
              key={trial.id}
              className={[
                'shrink-0 w-[min(256px,80vw)] snap-start rounded-2xl border px-4 py-4 shadow-sm',
                urgent
                  ? 'border-pro-amber/40 bg-pro-amber/10'
                  : 'border-pro-border bg-pro-surface',
              ].join(' ')}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium text-pro-ink text-sm">{trial.name}</span>
                <div
                  className={[
                    'flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold',
                    urgent ? 'bg-pro-amber/20 text-pro-amber' : 'bg-pro-violet/15 text-pro-violet',
                  ].join(' ')}
                >
                  <Clock className="h-3 w-3" />
                  {trial.trialDaysLeft}d left
                </div>
              </div>

              <p className="text-xs text-pro-muted mb-3">
                Converts to{' '}
                <span className="font-mono text-pro-ink font-semibold">
                  {formatConverted(trial.amount, trial.currency, displayCurrency)}
                </span>
                /mo on {trial.dueDate}
              </p>

              <button
                type="button"
                onClick={() => cancelTrial(trial.id)}
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-pro-border text-xs font-semibold text-pro-ink py-1.5 hover:bg-pro-surface-2 transition-colors"
              >
                <CreditCard className="h-3 w-3" />
                Cancel Trial
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
