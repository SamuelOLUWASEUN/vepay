import { TrendingUp } from 'lucide-react';
import { useClearSpend } from '../../context/ClearSpendContext';
import { formatCurrency } from '../../lib/currency';

/**
 * Growth & monetization surface for Express Mode — shows the transaction
 * volume flowing through Vepay and the 1% platform fee it generates.
 * This is the demo's "show me the money" slide: every tap on the action
 * grid moves these numbers live.
 */
export function LedgerSummary() {
  const { ledgerVolumeNGN, ledgerFeesNGN } = useClearSpend();

  return (
    <div className="rounded-2xl border border-express-border bg-express-ink px-5 py-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="h-4 w-4 text-express-green" />
        <p className="text-xs font-semibold uppercase tracking-wide text-express-bg/60">
          Platform Activity
        </p>
      </div>

      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs text-express-bg/50 mb-1">Total Volume Handled</p>
          <p className="font-mono text-2xl font-bold text-express-bg">
            {formatCurrency(ledgerVolumeNGN, 'NGN')}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-express-bg/50 mb-1">Platform Fees (1%)</p>
          <p className="font-mono text-lg font-semibold text-express-green">
            {formatCurrency(ledgerFeesNGN, 'NGN')}
          </p>
        </div>
      </div>
    </div>
  );
}
