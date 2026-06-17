import { useEffect, useMemo, useState } from 'react';
import { Flame } from 'lucide-react';
import { useClearSpend } from '../../context/ClearSpendContext';
import { convertCurrency, formatCurrency, toHourlyRate } from '../../lib/currency';

/**
 * Digital Burn Rate — Vepay Pro Mode's signature element.
 *
 * Aggregates every active tech subscription into a single hourly cost,
 * converted into the selected display currency, then visually "ticks"
 * upward in real time — making the abstract idea of subscription creep
 * viscerally felt, the way a taxi meter does.
 */
export function BurnRateMeter() {
  const { expenses, displayCurrency } = useClearSpend();

  const hourlyRate = useMemo(() => {
    return expenses
      .filter((e) => e.type === 'tech' && e.status === 'active')
      .reduce((sum, e) => {
        const converted = convertCurrency(e.amount, e.currency, displayCurrency);
        return sum + toHourlyRate(converted, e.frequency);
      }, 0);
  }, [expenses, displayCurrency]);

  const perSecond = hourlyRate / 3600;

  const [elapsedSpend, setElapsedSpend] = useState(0);

  useEffect(() => {
    setElapsedSpend(0);
    const interval = setInterval(() => {
      setElapsedSpend((prev) => prev + perSecond);
    }, 1000);
    return () => clearInterval(interval);
  }, [perSecond]);

  const decimals = displayCurrency === 'USD' ? 5 : 3;

  return (
    <div className="rounded-2xl border border-pro-border bg-gradient-to-br from-pro-surface to-pro-surface-2 px-5 py-5 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <Flame className="h-4 w-4 text-pro-amber" />
        <p className="text-xs font-semibold uppercase tracking-wide text-pro-muted">
          Digital Burn Rate
        </p>
      </div>

      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <p className="font-mono text-2xl sm:text-3xl font-bold text-pro-ink animate-burn-tick break-all">
            {formatCurrency(hourlyRate, displayCurrency)}
            <span className="text-base font-normal text-pro-muted">/hr</span>
          </p>
          <p className="text-xs text-pro-muted mt-1">
            Combined cost of all active SaaS &amp; API subscriptions
          </p>
        </div>

        <div className="text-right shrink-0">
          <p className="text-xs text-pro-muted mb-1">Spent this session</p>
          <p className="font-mono text-lg font-semibold text-pro-cyan">
            {displayCurrency === 'USD' ? '$' : '₦'}
            {elapsedSpend.toFixed(decimals)}
          </p>
        </div>
      </div>
    </div>
  );
}
