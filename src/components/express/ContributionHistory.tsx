import { Clock, Receipt } from 'lucide-react';
import { useClearSpend } from '../../context/ClearSpendContext';
import { formatCurrency } from '../../lib/currency';

/**
 * Ajo Contribution History — scrollable receipt trail of every quick-action tap.
 *
 * Solves a real problem: thrift group disputes happen because there is no
 * paper trail. This gives every market vendor a timestamped record of exactly
 * what they logged and when, without requiring them to type a single character.
 */
export function ContributionHistory() {
  const { contributionLog } = useClearSpend();

  if (contributionLog.length === 0) {
    return (
      <div className="rounded-2xl border border-express-border bg-express-surface px-5 py-6 text-center shadow-sm">
        <Receipt className="h-8 w-8 text-express-border mx-auto mb-2" />
        <p className="font-display text-sm font-semibold text-express-ink">No entries yet</p>
        <p className="text-xs text-express-muted mt-1">Tap the buttons above to log a payment</p>
      </div>
    );
  }

  function formatTime(ms: number) {
    const d = new Date(ms);
    return d.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' });
  }

  function formatDate(ms: number) {
    const d = new Date(ms);
    const today = new Date();
    const isToday = d.toDateString() === today.toDateString();
    if (isToday) return 'Today';
    return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
  }

  return (
    <div className="rounded-2xl border border-express-border bg-express-surface shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3.5 border-b border-express-border">
        <Clock className="h-4 w-4 text-express-muted" />
        <p className="font-display text-sm font-semibold text-express-ink">
          Payment History · {contributionLog.length} entries
        </p>
      </div>

      <div className="max-h-64 overflow-y-auto divide-y divide-express-border">
        {contributionLog.map((entry) => (
          <div key={entry.id} className="flex items-center gap-3 px-5 py-3">
            <span className="text-2xl shrink-0">{entry.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-express-ink text-sm">{entry.label}</p>
              <p className="text-xs text-express-muted">
                {formatDate(entry.timestamp)} · {formatTime(entry.timestamp)}
                {entry.roundUpNGN > 0 && (
                  <span className="text-express-green">
                    {' '}· +{formatCurrency(entry.roundUpNGN, 'NGN')} vaulted
                  </span>
                )}
              </p>
            </div>
            <span className="font-mono text-sm font-semibold text-express-ink shrink-0">
              {formatCurrency(entry.amountNGN, 'NGN')}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
