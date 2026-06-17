import { useState } from 'react';
import { BarChart2, Star, TrendingDown, Clock } from 'lucide-react';
import { useClearSpend } from '../../context/ClearSpendContext';
import { formatCurrency } from '../../lib/currency';

// ── ROI rating stored per expense id ─────────────────────────────────────────
const ROI_KEY = 'vepay.roi.v1';
function loadRatings(): Record<string, number> {
  try { return JSON.parse(localStorage.getItem(ROI_KEY) || '{}'); }
  catch { return {}; }
}
function saveRatings(r: Record<string, number>) {
  try { localStorage.setItem(ROI_KEY, JSON.stringify(r)); } catch { /* ignore */ }
}

// ── StarRating outside to prevent remount ─────────────────────────────────────
interface StarRatingProps {
  value: number; onChange: (v: number) => void;
}
function StarRating({ value, onChange }: StarRatingProps) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <button key={i} type="button" onClick={() => onChange(i + 1)}
          className="p-0.5 transition-transform hover:scale-110">
          <Star className={['h-4 w-4', i < value ? 'fill-pro-amber text-pro-amber' : 'text-pro-border fill-pro-border'].join(' ')} />
        </button>
      ))}
    </div>
  );
}

/**
 * Software ROI Tracker — Pro Mode.
 *
 * For each subscription, user rates how much they actually use it (1-5 stars).
 * Vepay calculates: "You're paying ₦30k/mo for tools you rated 2/5 —
 * that's ₦18k/mo wasted."
 *
 * This is the most honest thing any SaaS finance app has ever shown a developer.
 * It makes people confront subscriptions they're paying for out of habit.
 *
 * Also shows:
 * - Cost per hour of work (monthly burn ÷ 160 working hours)
 * - Best value subscription (high use, low cost)
 * - Biggest waste (low use, high cost)
 * - vs. benchmark: "Devs with your stack avg $85/mo. You spend $108/mo."
 */
export function SoftwareROI() {
  const { expenses, displayCurrency } = useClearSpend();
  const [ratings, setRatings] = useState<Record<string, number>>(loadRatings);
  const [hoursPerMonth, setHoursPerMonth] = useState(160);
  const [editingHours, setEditingHours] = useState(false);
  const [hoursDraft, setHoursDraft] = useState('160');

  const techExpenses = expenses.filter((e) => e.type === 'tech' && e.status === 'active');

  function rate(id: string, stars: number) {
    const updated = { ...ratings, [id]: stars };
    setRatings(updated); saveRatings(updated);
  }

  function toMonthlyNGN(e: typeof techExpenses[0]) {
    const ngn = e.currency === 'USD' ? e.amount * 1500 : e.amount;
    if (e.frequency === 'monthly') return ngn;
    if (e.frequency === 'yearly') return ngn / 12;
    if (e.frequency === 'weekly') return ngn * 4.3;
    return ngn * 30;
  }

  function fmt(ngn: number) {
    if (displayCurrency === 'USD') return formatCurrency(ngn / 1500, 'USD');
    return formatCurrency(ngn, 'NGN');
  }

  const totalMonthlyNGN = techExpenses.reduce((s, e) => s + toMonthlyNGN(e), 0);

  // Wasted = expenses rated ≤ 2 stars
  const wastedNGN = techExpenses
    .filter((e) => (ratings[e.id] ?? 3) <= 2)
    .reduce((s, e) => s + toMonthlyNGN(e), 0);

  // Cost per hour of work
  const costPerHourNGN = totalMonthlyNGN / hoursPerMonth;

  // Best value: highest (stars / cost) ratio
  const withRoi = techExpenses.map((e) => ({
    ...e, monthlyNGN: toMonthlyNGN(e), stars: ratings[e.id] ?? 0,
    roi: (ratings[e.id] ?? 0) / (toMonthlyNGN(e) / 1000 + 0.01),
  }));

  const bestValue = [...withRoi].filter((e) => e.stars > 0).sort((a, b) => b.roi - a.roi)[0];
  const biggestWaste = [...withRoi].filter((e) => e.stars > 0 && e.stars <= 2).sort((a, b) => b.monthlyNGN - a.monthlyNGN)[0];

  // Benchmark — hardcoded for prototype
  const BENCHMARK_USD = 85;
  const yourUSD = totalMonthlyNGN / 1500;
  const aboveBenchmark = yourUSD - BENCHMARK_USD;

  return (
    <div className="rounded-2xl border border-pro-border bg-pro-surface shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-pro-border bg-pro-surface-2 flex items-center gap-2">
        <div className="rounded-xl bg-pro-violet/15 p-2">
          <BarChart2 className="h-4 w-4 text-pro-violet" />
        </div>
        <div>
          <p className="font-display font-bold text-sm text-pro-ink">Software ROI Tracker</p>
          <p className="text-xs text-pro-muted">Rate how much you actually use each tool</p>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 divide-x divide-pro-border border-b border-pro-border">
        <div className="px-4 py-3 text-center">
          <p className="font-mono font-black text-lg text-pro-red">{fmt(wastedNGN)}</p>
          <p className="text-[10px] text-pro-muted">Potential waste/mo</p>
        </div>
        <div className="px-4 py-3 text-center">
          <button type="button" onClick={() => { setEditingHours(true); setHoursDraft(String(hoursPerMonth)); }}
            className="group">
            <p className="font-mono font-black text-lg text-pro-ink group-hover:text-pro-violet transition-colors">
              {fmt(costPerHourNGN)}
            </p>
            <p className="text-[10px] text-pro-muted flex items-center justify-center gap-1">
              <Clock className="h-2.5 w-2.5" />
              per hr of work
            </p>
          </button>
          {editingHours && (
            <div className="flex gap-1 mt-1">
              <input type="number" value={hoursDraft}
                onChange={(e) => setHoursDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { setHoursPerMonth(parseInt(hoursDraft)||160); setEditingHours(false); } }}
                className="w-14 rounded border border-pro-border bg-pro-bg text-pro-ink text-xs px-1 py-0.5 outline-none font-mono text-center"
                autoFocus />
              <span className="text-[10px] text-pro-muted self-center">hrs</span>
            </div>
          )}
        </div>
        <div className="px-4 py-3 text-center">
          <p className={['font-mono font-black text-lg', aboveBenchmark > 0 ? 'text-pro-red' : 'text-pro-cyan'].join(' ')}>
            {aboveBenchmark > 0 ? '+' : ''}{formatCurrency(aboveBenchmark, 'USD')}
          </p>
          <p className="text-[10px] text-pro-muted">vs dev avg ($85/mo)</p>
        </div>
      </div>

      {/* Insights row */}
      {(bestValue || biggestWaste) && (
        <div className="flex divide-x divide-pro-border border-b border-pro-border">
          {bestValue && (
            <div className="flex-1 px-4 py-2.5">
              <p className="text-[10px] font-bold text-pro-muted uppercase tracking-wide mb-0.5">Best value</p>
              <p className="text-xs font-semibold text-pro-ink truncate">{bestValue.name}</p>
              <p className="text-[10px] text-pro-cyan">{bestValue.stars}★ for {fmt(bestValue.monthlyNGN)}/mo</p>
            </div>
          )}
          {biggestWaste && (
            <div className="flex-1 px-4 py-2.5">
              <p className="text-[10px] font-bold text-pro-muted uppercase tracking-wide mb-0.5">Biggest waste</p>
              <p className="text-xs font-semibold text-pro-ink truncate">{biggestWaste.name}</p>
              <p className="text-[10px] text-pro-red">{biggestWaste.stars}★ but {fmt(biggestWaste.monthlyNGN)}/mo</p>
            </div>
          )}
        </div>
      )}

      {/* Per-subscription rating */}
      <div className="divide-y divide-pro-border">
        {techExpenses.map((expense) => {
          const stars = ratings[expense.id] ?? 0;
          const monthly = toMonthlyNGN(expense);
          const wasteWarning = stars > 0 && stars <= 2;
          return (
            <div key={expense.id} className={['flex items-center gap-3 px-5 py-3',
              wasteWarning ? 'bg-pro-red/5' : ''].join(' ')}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-pro-ink text-sm truncate">{expense.name}</p>
                  {wasteWarning && (
                    <span className="flex items-center gap-0.5 text-[9px] font-bold text-pro-red bg-pro-red/10 px-1.5 py-0.5 rounded-full shrink-0">
                      <TrendingDown className="h-2.5 w-2.5" /> Low ROI
                    </span>
                  )}
                </div>
                <StarRating value={stars} onChange={(s) => rate(expense.id, s)} />
              </div>
              <div className="text-right shrink-0">
                <p className="font-mono text-sm font-semibold text-pro-ink">{fmt(monthly)}</p>
                <p className="text-[10px] text-pro-muted">/mo</p>
              </div>
            </div>
          );
        })}
      </div>

      {techExpenses.some((e) => !ratings[e.id]) && (
        <div className="px-5 py-3 border-t border-pro-border">
          <p className="text-xs text-pro-muted text-center">
            ⭐ Rate each tool to see your true waste and ROI
          </p>
        </div>
      )}
    </div>
  );
}
