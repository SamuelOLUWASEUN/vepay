import { useMemo } from 'react';
import { CalendarDays } from 'lucide-react';
import { useClearSpend } from '../../context/ClearSpendContext';
import { formatCurrency, convertCurrency } from '../../lib/currency';
import type { Expense } from '../../types';

interface CalendarDayProps {
  date: Date;
  expenses: Expense[];
  isExpress: boolean;
  displayCurrency: 'USD' | 'NGN';
}

function CalendarDay({ date, expenses, isExpress, displayCurrency }: CalendarDayProps) {
  const today = new Date('2026-06-16');
  const isToday = date.toDateString() === today.toDateString();
  const isPast = date < today;
  const hasFailed = expenses.some((e) => e.status === 'failed');
  const hasActive = expenses.some((e) => e.status === 'active');

  const dotColor = hasFailed
    ? (isExpress ? 'bg-express-red' : 'bg-pro-red')
    : hasActive
      ? (isExpress ? 'bg-express-green' : 'bg-pro-cyan')
      : 'transparent';

  return (
    <div className="flex flex-col items-center gap-0.5 min-w-0 w-full">
      {/* Day circle — uses aspect-square so it scales with column width on all screens */}
      <div className={[
        'relative w-full aspect-square max-w-[44px] flex items-center justify-center rounded-xl text-xs font-semibold transition-colors cursor-default',
        isToday
          ? (isExpress ? 'bg-express-ink text-express-bg' : 'bg-pro-violet text-white')
          : isPast
            ? (isExpress ? 'text-express-muted' : 'text-pro-muted')
            : (isExpress ? 'text-express-ink' : 'text-pro-ink'),
        hasFailed && !isToday ? 'animate-due-pulse' : '',
      ].filter(Boolean).join(' ')}>
        {date.getDate()}
        {expenses.length > 0 && (
          <span className={[
            'absolute bottom-0.5 h-1 w-1 rounded-full',
            dotColor,
            isToday ? 'bg-white/70' : '',
          ].join(' ')} />
        )}
      </div>

      {/* Amount chip — only show on larger cells, hide on tiny screens */}
      {expenses.length > 0 && (
        <span className={[
          'hidden sm:block rounded px-0.5 text-[8px] font-semibold leading-tight truncate w-full text-center',
          expenses[0].status === 'failed'
            ? (isExpress ? 'bg-express-red-soft text-express-red' : 'bg-pro-red/20 text-pro-red')
            : (isExpress ? 'bg-express-green-soft text-express-green' : 'bg-pro-cyan/15 text-pro-cyan'),
        ].join(' ')} title={expenses[0].name}>
          {formatCurrency(convertCurrency(expenses[0].amount, expenses[0].currency, displayCurrency), displayCurrency)}
        </span>
      )}
      {/* On mobile: just show a count badge if multiple */}
      {expenses.length > 1 && (
        <span className={['sm:hidden text-[9px] font-bold', isExpress ? 'text-express-muted' : 'text-pro-muted'].join(' ')}>
          ×{expenses.length}
        </span>
      )}
    </div>
  );
}

interface PaymentCalendarProps {
  mode: 'EXPRESS' | 'PRO';
}

export function PaymentCalendar({ mode }: PaymentCalendarProps) {
  const { expenses, displayCurrency } = useClearSpend();
  const isExpress = mode === 'EXPRESS';
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

  return (
    <div className={['rounded-2xl border px-3 py-4 shadow-sm', isExpress ? 'border-express-border bg-express-surface' : 'border-pro-border bg-pro-surface'].join(' ')}>
      <div className="flex items-center gap-2 mb-3">
        <CalendarDays className={['h-4 w-4', isExpress ? 'text-express-muted' : 'text-pro-muted'].join(' ')} />
        <p className={['font-display text-sm font-semibold', isExpress ? 'text-express-ink' : 'text-pro-ink'].join(' ')}>
          Payments this week
        </p>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const key = day.toISOString().slice(0, 10);
          const dayExpenses = expensesByDate[key] ?? [];
          return (
            <div key={key} className="flex flex-col items-center gap-0.5">
              <span className={['text-[10px] font-medium mb-0.5', isExpress ? 'text-express-muted' : 'text-pro-muted'].join(' ')}>
                {dayLabels[day.getDay()]}
              </span>
              <CalendarDay
                date={day}
                expenses={dayExpenses}
                isExpress={isExpress}
                displayCurrency={calendarCurrency}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
