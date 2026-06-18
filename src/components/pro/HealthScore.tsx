import { useMemo } from 'react';
import { AlertTriangle, CheckCircle2, ShieldAlert, TrendingDown } from 'lucide-react';
import { useClearSpend } from '../../context/ClearSpendContext';
import { convertCurrency, toHourlyRate } from '../../lib/currency';

interface ScoreFactor {
  label: string;
  points: number;
  maxPoints: number;
  status: 'good' | 'warn' | 'bad';
  detail: string;
}

/**
 * Subscription Health Score — a single 0–100 signal combining:
 *   - Failed payment count (most damaging)
 *   - Expiring trials about to charge
 *   - Burn rate relative to a ₦500k/mo baseline
 *   - Paused subscription ratio
 *
 * Solves a real problem: people with 6+ subscriptions have no single
 * "am I okay financially?" dashboard. This makes it one glance.
 */
export function HealthScore() {
  const { expenses, displayCurrency } = useClearSpend();

  const factors = useMemo<ScoreFactor[]>(() => {
    const tech = expenses.filter((e) => e.type === 'tech');
    const failedCount = tech.filter((e) => e.status === 'failed').length;
    const urgentTrials = tech.filter((e) => e.isTrial && (e.trialDaysLeft ?? 99) <= 5 && e.status === 'active').length;
    const activeCount = tech.filter((e) => e.status === 'active').length;
    const pausedCount = tech.filter((e) => e.status === 'paused').length;

    const hourlyRate = tech
      .filter((e) => e.status === 'active')
      .reduce((sum, e) => {
        const converted = convertCurrency(e.amount, e.currency, 'NGN');
        return sum + toHourlyRate(converted, e.frequency);
      }, 0);
    const monthlyEstimateNGN = hourlyRate * 24 * 30;
    const BURN_CEILING_NGN = 500_000;

    return [
      {
        label: 'Payment status',
        points: Math.max(0, 35 - failedCount * 20),
        maxPoints: 35,
        status: failedCount === 0 ? 'good' : failedCount === 1 ? 'warn' : 'bad',
        detail: failedCount === 0 ? 'All payments current' : `${failedCount} payment${failedCount > 1 ? 's' : ''} failed`,
      },
      {
        label: 'Trial exposure',
        points: Math.max(0, 25 - urgentTrials * 15),
        maxPoints: 25,
        status: urgentTrials === 0 ? 'good' : urgentTrials === 1 ? 'warn' : 'bad',
        detail: urgentTrials === 0 ? 'No trials converting soon' : `${urgentTrials} trial${urgentTrials > 1 ? 's' : ''} expiring within 5 days`,
      },
      {
        label: 'Monthly burn',
        points: Math.max(0, 25 - Math.floor((monthlyEstimateNGN / BURN_CEILING_NGN) * 25)),
        maxPoints: 25,
        status: monthlyEstimateNGN < 200_000 ? 'good' : monthlyEstimateNGN < 400_000 ? 'warn' : 'bad',
        detail: `₦${Math.round(monthlyEstimateNGN / 1000)}k/mo estimated · ${displayCurrency} view`,
      },
      {
        label: 'Active vs paused',
        points: activeCount + pausedCount > 0
          ? Math.round((activeCount / (activeCount + pausedCount)) * 15)
          : 15,
        maxPoints: 15,
        status: pausedCount === 0 ? 'good' : pausedCount <= 1 ? 'warn' : 'bad',
        detail: pausedCount === 0 ? 'All services running' : `${pausedCount} subscription${pausedCount > 1 ? 's' : ''} paused`,
      },
    ];
  }, [expenses, displayCurrency]);

  const score = useMemo(() => factors.reduce((s, f) => s + f.points, 0), [factors]);

  const { label, ring } = useMemo(() => {
    if (score >= 80) return { label: 'Healthy', ring: '#3fe0c5' };
    if (score >= 55) return { label: 'At risk', ring: '#ffb950' };
    return { label: 'Needs attention', ring: '#ff5470' };
  }, [score]);

  const circumference = 2 * Math.PI * 36;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const statusIcon = {
    good: <CheckCircle2 className="h-3.5 w-3.5 text-pro-cyan" />,
    warn: <AlertTriangle className="h-3.5 w-3.5 text-pro-amber" />,
    bad: <ShieldAlert className="h-3.5 w-3.5 text-pro-red" />,
  };

  return (
    <div className="rounded-2xl border border-pro-border bg-pro-surface px-5 py-4 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <TrendingDown className="h-4 w-4 text-pro-muted" />
        <p className="font-display text-sm font-semibold text-pro-ink">Subscription Health</p>
      </div>

      <div className="flex items-center gap-4 flex-wrap sm:flex-nowrap">
        {/* Circular gauge — uses w-full with max-w so it scales on all screen sizes */}
        <div className="relative shrink-0 w-20 sm:w-22">
          <svg viewBox="0 0 88 88" className="w-full h-auto">
            <circle cx="44" cy="44" r="36" fill="none" stroke="#242b3d" strokeWidth="8" />
            <circle
              cx="44" cy="44" r="36" fill="none"
              stroke={ring} strokeWidth="8" strokeLinecap="round"
              strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
              transform="rotate(-90 44 44)"
              style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.16,1,0.3,1)' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-mono font-bold text-xl text-pro-ink leading-none">{score}</span>
            <span className="text-[10px] text-pro-muted font-medium">/100</span>
          </div>
        </div>

        {/* Factor breakdown */}
        <div className="flex-1 flex flex-col gap-2 min-w-0">
          <p className="font-display font-semibold text-sm" style={{ color: ring }}>{label}</p>
          {factors.map((f) => (
            <div key={f.label} className="flex items-start gap-2">
              <div className="shrink-0 mt-0.5">{statusIcon[f.status]}</div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-pro-ink truncate">{f.label}</p>
                <p className="text-[11px] text-pro-muted leading-tight">{f.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
