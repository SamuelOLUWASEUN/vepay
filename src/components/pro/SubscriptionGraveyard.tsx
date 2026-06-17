import { FileText, MessageSquare, Skull, Sparkles } from 'lucide-react';
import { type LucideIcon } from 'lucide-react';
import { useClearSpend } from '../../context/ClearSpendContext';
import { formatCurrency } from '../../lib/currency';
import { SaaSExpenseList } from './SaaSExpenseList';

// Re-export SaaSExpenseList with cancel button injected
// (The graveyard is a separate card — cancel buttons live in SaaSExpenseList)

const GRAVEYARD_ICONS: Record<string, LucideIcon> = {
  FileText,
  MessageSquare,
  Sparkles,
};

/**
 * Subscription Graveyard — a dedicated section for cancelled/paused subs
 * showing exactly when they died and how much they cost in total.
 *
 * Solves a real problem: people cancel subscriptions and never reckon with
 * how much they actually spent. Seeing "You paid ₦108,000 for Slack over
 * 12 months before cancelling" changes future decision-making permanently.
 * It's a mirror, not a dashboard.
 */
export function SubscriptionGraveyard() {
  const { graveyardEntries, displayCurrency } = useClearSpend();

  if (graveyardEntries.length === 0) return null;

  const totalWasted = graveyardEntries.reduce((s, e) => s + e.totalSpentNGN, 0);
  const displayTotal = displayCurrency === 'NGN'
    ? formatCurrency(totalWasted, 'NGN')
    : formatCurrency(totalWasted / 1500, 'USD');

  function timeAgo(ms: number): string {
    const days = Math.floor((Date.now() - ms) / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 30) return `${days} days ago`;
    const months = Math.floor(days / 30);
    return `${months} month${months > 1 ? 's' : ''} ago`;
  }

  return (
    <div className="rounded-2xl border border-pro-border bg-pro-surface shadow-sm overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-pro-border bg-pro-surface-2">
        <div className="flex items-center gap-2">
          <Skull className="h-4 w-4 text-pro-muted" />
          <p className="font-display text-sm font-semibold text-pro-ink">
            Subscription Graveyard
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-pro-muted">Total spent before cancelling</p>
          <p className="font-mono text-sm font-semibold text-pro-red">{displayTotal}</p>
        </div>
      </div>

      <div className="divide-y divide-pro-border">
        {graveyardEntries.map((entry) => {
          const Icon = GRAVEYARD_ICONS[entry.categoryIcon] ?? Sparkles;
          const displayAmount = displayCurrency === 'NGN'
            ? formatCurrency(entry.totalSpentNGN, 'NGN')
            : formatCurrency(entry.totalSpentNGN / 1500, 'USD');

          return (
            <div key={entry.id} className="flex items-center gap-3 px-5 py-3.5 opacity-75 hover:opacity-100 transition-opacity">
              <div className="rounded-xl bg-pro-surface-2 p-2.5 grayscale">
                <Icon className="h-4 w-4 text-pro-muted" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-pro-ink text-sm truncate">{entry.name}</p>
                <p className="text-xs text-pro-muted mt-0.5">
                  Cancelled {timeAgo(entry.cancelledAt)} · {entry.monthsActive} month{entry.monthsActive !== 1 ? 's' : ''} active
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-mono text-sm font-semibold text-pro-muted line-through">
                  {displayAmount}
                </p>
                <p className="text-[10px] text-pro-muted">total spent</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="px-5 py-3 border-t border-pro-border">
        <p className="text-[11px] text-pro-muted text-center leading-relaxed">
          Every cancelled service stays here so you remember the cost of subscription creep.
        </p>
      </div>
    </div>
  );
}

// Export cancel-aware expense list wrapper
export { SaaSExpenseList };
