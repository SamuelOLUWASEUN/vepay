import { useMemo } from 'react';
import { useState } from 'react';
import { CalendarDays, Check, PencilLine, X } from 'lucide-react';
import { useClearSpend } from '../../context/ClearSpendContext';
import { formatCurrency, convertCurrency } from '../../lib/currency';
import type { Expense } from '../../types';

// ── BudgetInput outside to prevent remount ──────────────────────────────────

interface BudgetInputProps {
  value: string;
  onChange: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
  isExpress: boolean;
}

function BudgetEditInput({ value, onChange, onSave, onCancel, isExpress }: BudgetInputProps) {
  return (
    <div className="flex items-center gap-2">
      <span className={['text-sm shrink-0', isExpress ? 'text-express-muted' : 'text-pro-muted'].join(' ')}>₦</span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') onSave(); if (e.key === 'Escape') onCancel(); }}
        className={[
          'flex-1 rounded-lg border px-3 py-1.5 text-sm font-mono outline-none transition-colors',
          isExpress
            ? 'border-express-border bg-express-bg text-express-ink focus:border-express-green'
            : 'border-pro-border bg-pro-bg text-pro-ink focus:border-pro-violet',
        ].join(' ')}
        autoFocus
      />
      <button type="button" onClick={onSave}
        className={['p-1.5 rounded-lg', isExpress ? 'bg-express-green-soft text-express-green' : 'bg-pro-cyan/15 text-pro-cyan'].join(' ')}>
        <Check className="h-3.5 w-3.5" />
      </button>
      <button type="button" onClick={onCancel}
        className={['p-1.5 rounded-lg', isExpress ? 'bg-express-border text-express-muted' : 'bg-pro-border text-pro-muted'].join(' ')}>
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

interface WeeklyPlanProps {
  mode: 'EXPRESS' | 'PRO';
}

/**
 * This Week's Plan — merged PaymentCalendar + BudgetEnvelopes.
 *
 * Top: 7-day calendar strip showing when money hits.
 * Bottom: envelope bars showing how much per category.
 * One card, one scroll, complete picture of the week.
 */
export function WeeklyPlanCard({ mode }: WeeklyPlanProps) {
  const { expenses, displayCurrency, budgetEnvelopes, updateEnvelopeBudget } = useClearSpend();
  const isExpress = mode === 'EXPRESS';

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const calendarCurrency = isExpress ? 'NGN' : displayCurrency;

  const days = useMemo(() => {
    const today = new Date('2026-06-16');
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      return d;
    });
  }, []);

  const relevantExpenses = useMemo(() =>
    expenses.filter((e) => isExpress ? e.type === 'local' : e.type === 'tech'),
    [expenses, isExpress],
  );

  const expensesByDate = useMemo(() => {
    const map: Record<string, Expense[]> = {};
    days.forEach((d) => {
      const key = d.toISOString().slice(0, 10);
      map[key] = relevantExpenses.filter((e) => e.dueDate === key);
    });
    return map;
  }, [days, relevantExpenses]);

  const dayLabels = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const todayStr = new Date('2026-06-16').toISOString().slice(0, 10);

  function commitEdit(categoryId: string) {
    const val = parseInt(editValue.replace(/[^0-9]/g, ''), 10);
    if (!isNaN(val) && val > 0) updateEnvelopeBudget(categoryId, val);
    setEditingId(null);
  }

  const card = isExpress ? 'border-express-border bg-express-surface' : 'border-pro-border bg-pro-surface';
  const ink = isExpress ? 'text-express-ink' : 'text-pro-ink';
  const muted = isExpress ? 'text-express-muted' : 'text-pro-muted';
  const border = isExpress ? 'border-express-border' : 'border-pro-border';
  const headerBg = isExpress ? 'bg-express-bg' : 'bg-pro-surface-2';
  const accent = isExpress ? 'text-express-green' : 'text-pro-cyan';
  const todayBg = isExpress ? 'bg-express-ink text-express-bg' : 'bg-pro-violet text-white';

  return (
    <div className={['rounded-2xl border shadow-sm overflow-hidden', card].join(' ')}>
      {/* Header */}
      <div className={['px-5 py-3.5 border-b flex items-center gap-2', border, headerBg].join(' ')}>
        <CalendarDays className={['h-4 w-4', muted].join(' ')} />
        <p className={['font-display text-sm font-bold', ink].join(' ')}>This Week's Plan</p>
        <span className={['text-[10px] font-semibold ml-auto', muted].join(' ')}>
          Calendar · Budgets
        </span>
      </div>

      {/* 7-day calendar strip */}
      <div className="px-4 py-3 border-b" style={{ borderColor: isExpress ? 'var(--express-border)' : 'var(--pro-border)' }}>
        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const key = day.toISOString().slice(0, 10);
            const dayExpenses = expensesByDate[key] ?? [];
            const isToday = key === todayStr;
            const hasFailed = dayExpenses.some((e) => e.status === 'failed');
            const hasActive = dayExpenses.some((e) => e.status === 'active');
            const dotColor = hasFailed ? (isExpress ? 'bg-express-red' : 'bg-pro-red')
              : hasActive ? (isExpress ? 'bg-express-green' : 'bg-pro-cyan')
              : 'transparent';

            return (
              <div key={key} className="flex flex-col items-center gap-0.5">
                <span className={['text-[10px] font-medium mb-0.5', muted].join(' ')}>
                  {dayLabels[day.getDay()]}
                </span>
                <div className={[
                  'relative w-full aspect-square max-w-[40px] flex items-center justify-center rounded-xl text-xs font-semibold',
                  isToday ? todayBg : ink,
                ].join(' ')}>
                  {day.getDate()}
                  {dayExpenses.length > 0 && (
                    <span className={['absolute bottom-0.5 h-1 w-1 rounded-full', dotColor, isToday ? 'bg-white/70' : ''].join(' ')} />
                  )}
                </div>
                {dayExpenses.length > 0 && (
                  <span className={['text-[9px] font-semibold truncate w-full text-center', accent].join(' ')}>
                    {formatCurrency(convertCurrency(dayExpenses[0].amount, dayExpenses[0].currency, calendarCurrency), calendarCurrency)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Budget envelopes — Express only */}
      {isExpress && (
        <div className="divide-y divide-express-border">
          {budgetEnvelopes.map((env) => {
            const pct = Math.min(env.spentThisWeekNGN / env.weeklyBudgetNGN, 1);
            const remaining = env.weeklyBudgetNGN - env.spentThisWeekNGN;
            const isOver = remaining < 0;
            const barColor = pct >= 1 ? 'bg-express-red' : pct >= 0.7 ? 'bg-express-amber' : 'bg-express-green';
            const labelColor = pct >= 1 ? 'text-express-red' : pct >= 0.7 ? 'text-express-amber' : 'text-express-green';
            const isEditing = editingId === env.categoryId;

            return (
              <div key={env.categoryId} className="px-5 py-2.5">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{env.icon}</span>
                    <span className="font-medium text-express-ink text-sm">{env.label}</span>
                  </div>
                  {isEditing ? (
                    <BudgetEditInput
                      value={editValue}
                      onChange={setEditValue}
                      onSave={() => commitEdit(env.categoryId)}
                      onCancel={() => setEditingId(null)}
                      isExpress
                    />
                  ) : (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={['font-mono text-xs font-semibold', labelColor].join(' ')}>
                        {isOver ? `₦${Math.abs(remaining).toLocaleString('en-NG')} over` : `${formatCurrency(remaining, 'NGN')} left`}
                      </span>
                      <button type="button"
                        onClick={() => { setEditingId(env.categoryId); setEditValue(String(env.weeklyBudgetNGN)); }}
                        className="p-1 text-express-muted hover:text-express-ink">
                        <PencilLine className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
                <div className="h-1.5 rounded-full bg-express-border overflow-hidden">
                  <div className={['h-full rounded-full transition-all', barColor].join(' ')}
                    style={{ width: `${Math.min(pct * 100, 100)}%` }} />
                </div>
                <div className="flex justify-between mt-0.5">
                  <span className="text-[9px] text-express-muted">{formatCurrency(env.spentThisWeekNGN, 'NGN')} spent</span>
                  <span className="text-[9px] text-express-muted">Budget: {formatCurrency(env.weeklyBudgetNGN, 'NGN')}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
