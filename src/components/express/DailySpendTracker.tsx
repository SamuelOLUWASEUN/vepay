import { useState } from 'react';
import { Flame, PencilLine, Trash2, TrendingUp, Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useClearSpend } from '../../context/ClearSpendContext';
import { formatCurrency } from '../../lib/currency';

// ─────────────────────────────────────────────────────────────────────────────
// BudgetInput — OUTSIDE to prevent remount
// ─────────────────────────────────────────────────────────────────────────────

interface BudgetInputProps {
  value: string;
  onChange: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

function BudgetInput({ value, onChange, onSave, onCancel }: BudgetInputProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-express-muted text-sm shrink-0">₦</span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') onSave(); if (e.key === 'Escape') onCancel(); }}
        className="flex-1 rounded-lg border border-express-border bg-express-bg text-express-ink px-3 py-1.5 text-sm font-mono outline-none focus:border-express-green"
        autoFocus
        min={1000}
      />
      <button type="button" onClick={onSave}
        className="p-1.5 rounded-lg bg-express-green-soft text-express-green">
        <Check className="h-3.5 w-3.5" />
      </button>
      <button type="button" onClick={onCancel}
        className="p-1.5 rounded-lg bg-express-border text-express-muted">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main analytics card
// ─────────────────────────────────────────────────────────────────────────────

/**
 * DailySpendTracker — analytics card.
 *
 * This card is for READING your spending data, not for inputting.
 * All input goes through the QuickLogFAB floating button.
 *
 * Shows: today's total vs budget, 7-day bar chart, streak,
 * weekly/monthly rollup, and today's entry list.
 */
export function DailySpendTracker() {
  const {
    dailySpendEntries, dailyBudgetNGN, setDailyBudgetNGN,
    deleteDailySpendEntry,
    todaySpendNGN, todayDayKey, spendStreak,
    weeklySpendNGN, monthlySpendNGN, dailySpendByDay,
  } = useClearSpend();

  const [showHistory, setShowHistory] = useState(false);
  const [editingBudget, setEditingBudget] = useState(false);
  const [budgetDraft, setBudgetDraft] = useState(String(dailyBudgetNGN));

  const todayEntries = dailySpendEntries.filter((e) => e.dayKey === todayDayKey);

  const pct = Math.min(todaySpendNGN / dailyBudgetNGN, 1);
  const isOver = todaySpendNGN > dailyBudgetNGN;
  const isWarn = pct >= 0.7 && !isOver;
  const remaining = dailyBudgetNGN - todaySpendNGN;

  const barColor = isOver ? 'bg-express-red' : isWarn ? 'bg-express-amber' : 'bg-express-green';
  const totalColor = isOver ? 'text-express-red' : isWarn ? 'text-express-amber' : 'text-express-ink';

  const chartMax = Math.max(...dailySpendByDay.map((d) => d.totalNGN), dailyBudgetNGN, 1);

  function saveBudget() {
    const val = parseInt(budgetDraft, 10);
    if (val >= 1000) setDailyBudgetNGN(val);
    setEditingBudget(false);
  }

  function formatTime(ms: number) {
    return new Date(ms).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' });
  }

  function dayLabel(dayKey: string) {
    return ['Su','Mo','Tu','We','Th','Fr','Sa'][new Date(dayKey + 'T12:00:00').getDay()];
  }

  return (
    <div className="rounded-2xl border border-express-border bg-express-surface shadow-sm overflow-hidden">

      {/* ── Header row ───────────────────────────────────────────── */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <p className="font-display text-sm font-bold text-express-ink">Daily Spend</p>
            {spendStreak > 0 && (
              <div className="flex items-center gap-1 rounded-full bg-express-amber-soft px-2 py-0.5">
                <Flame className="h-3 w-3 text-express-amber" />
                <span className="text-[10px] font-bold text-express-amber">
                  {spendStreak}d streak
                </span>
              </div>
            )}
          </div>

          {/* Today's total — large, immediate */}
          <div className="text-right">
            <p className={['font-mono text-2xl font-black leading-none', totalColor].join(' ')}>
              {formatCurrency(todaySpendNGN, 'NGN')}
            </p>
            <p className="text-[10px] text-express-muted mt-0.5">today</p>
          </div>
        </div>

        {/* Budget bar */}
        {editingBudget ? (
          <BudgetInput
            value={budgetDraft}
            onChange={setBudgetDraft}
            onSave={saveBudget}
            onCancel={() => setEditingBudget(false)}
          />
        ) : (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] text-express-muted">
                {isOver
                  ? `₦${Math.abs(remaining).toLocaleString('en-NG')} over budget`
                  : `₦${remaining.toLocaleString('en-NG')} remaining`}
              </span>
              <button
                type="button"
                onClick={() => { setEditingBudget(true); setBudgetDraft(String(dailyBudgetNGN)); }}
                className="flex items-center gap-1 text-[11px] text-express-muted hover:text-express-ink transition-colors"
              >
                {formatCurrency(dailyBudgetNGN, 'NGN')} budget
                <PencilLine className="h-2.5 w-2.5" />
              </button>
            </div>
            <div className="h-2 rounded-full bg-express-border overflow-hidden">
              <div
                className={['h-full rounded-full transition-all duration-500', barColor].join(' ')}
                style={{ width: `${Math.min(pct * 100, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Weekly / Monthly rollup */}
        <div className="grid grid-cols-2 gap-2 mt-3">
          <div className="rounded-xl bg-express-bg border border-express-border px-3 py-2">
            <p className="text-[9px] text-express-muted uppercase tracking-wide">This week</p>
            <p className="font-mono font-bold text-express-ink text-sm mt-0.5">
              {formatCurrency(weeklySpendNGN, 'NGN')}
            </p>
          </div>
          <div className="rounded-xl bg-express-bg border border-express-border px-3 py-2">
            <p className="text-[9px] text-express-muted uppercase tracking-wide">This month</p>
            <p className="font-mono font-bold text-express-ink text-sm mt-0.5">
              {formatCurrency(monthlySpendNGN, 'NGN')}
            </p>
          </div>
        </div>
      </div>

      {/* ── 7-Day chart ──────────────────────────────────────────── */}
      <div className="px-5 pb-4 border-t border-express-border pt-4">
        <div className="flex items-center gap-1.5 mb-2">
          <TrendingUp className="h-3 w-3 text-express-muted" />
          <p className="text-[10px] font-semibold text-express-muted uppercase tracking-wide">
            7-day spending
          </p>
        </div>
        <div className="flex items-end gap-1.5 h-12">
          {dailySpendByDay.map((day) => {
            const height = (day.totalNGN / chartMax) * 100;
            const isToday = day.dayKey === todayDayKey;
            const isOverBudget = day.totalNGN > dailyBudgetNGN;
            return (
              <div key={day.dayKey} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex items-end" style={{ height: '36px' }}>
                  <div
                    className={[
                      'w-full rounded-t transition-all duration-500',
                      isOverBudget ? 'bg-express-red' : isToday ? 'bg-express-ink' : 'bg-express-green/50',
                    ].join(' ')}
                    style={{ height: `${Math.max(day.totalNGN > 0 ? height : 0, day.totalNGN > 0 ? 8 : 2)}%` }}
                  />
                </div>
                <span className={[
                  'text-[9px] font-medium',
                  isToday ? 'text-express-ink font-bold' : 'text-express-muted',
                ].join(' ')}>
                  {dayLabel(day.dayKey)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Today's entries toggle ───────────────────────────────── */}
      {todayEntries.length > 0 && (
        <div className="border-t border-express-border">
          <button
            type="button"
            onClick={() => setShowHistory((v) => !v)}
            className="w-full flex items-center justify-between px-5 py-3 hover:bg-express-bg transition-colors"
          >
            <span className="text-xs font-semibold text-express-ink">
              Today's entries ({todayEntries.length})
            </span>
            {showHistory
              ? <ChevronUp className="h-3.5 w-3.5 text-express-muted" />
              : <ChevronDown className="h-3.5 w-3.5 text-express-muted" />}
          </button>

          {showHistory && (
            <div className="max-h-52 overflow-y-auto divide-y divide-express-border">
              {todayEntries.map((entry) => (
                <div key={entry.id} className="flex items-center gap-3 px-5 py-2.5 hover:bg-express-bg transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-express-ink truncate">{entry.label}</p>
                    <p className="text-[10px] text-express-muted">{formatTime(entry.timestamp)}</p>
                  </div>
                  <span className="font-mono text-sm font-semibold text-express-ink shrink-0">
                    {formatCurrency(entry.amountNGN, 'NGN')}
                  </span>
                  <button
                    type="button"
                    onClick={() => deleteDailySpendEntry(entry.id)}
                    className="shrink-0 p-1.5 rounded-lg text-express-muted hover:text-express-red hover:bg-express-red-soft transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Streak motivator */}
      {spendStreak >= 3 && (
        <div className="px-5 pb-4 pt-2 border-t border-express-border">
          <div className="rounded-xl bg-express-amber-soft border border-express-amber/20 px-4 py-2.5 flex items-center gap-2">
            <Flame className="h-4 w-4 text-express-amber shrink-0" />
            <p className="text-xs font-semibold text-express-ink">
              {spendStreak} day streak — you're building a great habit.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
