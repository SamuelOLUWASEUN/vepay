import { useState, useMemo } from 'react';
import { Check, AlertTriangle, X, RefreshCw, CalendarClock, ChevronDown, ChevronUp } from 'lucide-react';
import { useClearSpend } from '../../context/ClearSpendContext';
import { formatCurrency } from '../../lib/currency';
import type { Expense } from '../../types';

/**
 * Traffic Light Ring — Express Mode's signature status indicator.
 *
 * When amber or red: the ring is tappable and expands an inline action
 * sheet showing exactly which payments need attention with one-tap fixes.
 * No scrolling required — the problem and the solution are in one place.
 */

type RingStatus = 'green' | 'amber' | 'red';

function getStatus(localExpenses: Expense[]): RingStatus {
  if (localExpenses.some((e) => e.status === 'failed')) return 'red';

  const today = new Date('2026-06-16').getTime();
  const threeDays = 3 * 24 * 60 * 60 * 1000;
  if (
    localExpenses.some(
      (e) =>
        e.status === 'active' &&
        new Date(e.dueDate).getTime() - today <= threeDays &&
        new Date(e.dueDate).getTime() - today >= 0,
    )
  ) {
    return 'amber';
  }

  return 'green';
}

function daysUntil(dateStr: string): number {
  const today = new Date('2026-06-16').getTime();
  return Math.ceil((new Date(dateStr).getTime() - today) / (1000 * 60 * 60 * 24));
}

export function TrafficLightRing() {
  const { expenses, retryPayment, processing } = useClearSpend();
  const [expanded, setExpanded] = useState(false);

  const localExpenses = useMemo(
    () => expenses.filter((e) => e.type === 'local'),
    [expenses],
  );

  const status = useMemo(() => getStatus(localExpenses), [localExpenses]);

  // Items that need attention — failed first, then due within 3 days
  const attentionItems = useMemo<Expense[]>(() => {
    const today = new Date('2026-06-16').getTime();
    const threeDays = 3 * 24 * 60 * 60 * 1000;

    const failed = localExpenses.filter((e) => e.status === 'failed');
    const dueSoon = localExpenses.filter(
      (e) =>
        e.status === 'active' &&
        new Date(e.dueDate).getTime() - today <= threeDays &&
        new Date(e.dueDate).getTime() - today >= 0,
    );

    return [...failed, ...dueSoon];
  }, [localExpenses]);

  const needsAction = status !== 'green';

  const ringColors = {
    green: {
      bg: 'bg-express-green',
      glow: 'bg-express-green',
      Icon: Check,
      label: 'All payments on track',
      sub: 'Every group, levy and rent is up to date',
    },
    amber: {
      bg: 'bg-express-amber',
      glow: 'bg-express-amber',
      Icon: AlertTriangle,
      label: `${attentionItems.length} payment${attentionItems.length === 1 ? '' : 's'} due soon`,
      sub: expanded ? 'Tap to hide details' : 'Tap to see what needs attention',
    },
    red: {
      bg: 'bg-express-red',
      glow: 'bg-express-red',
      Icon: X,
      label: `${attentionItems.filter((e) => e.status === 'failed').length} payment${attentionItems.filter((e) => e.status === 'failed').length === 1 ? '' : 's'} failed`,
      sub: expanded ? 'Tap to hide details' : 'Tap to fix now — no scrolling needed',
    },
  }[status];

  const { Icon } = ringColors;

  // Auto-expand when status turns bad
  useMemo(() => {
    if (needsAction) setExpanded(true);
  }, [needsAction]);

  return (
    <div className="flex flex-col items-center gap-0 py-4">
      {/* The ring itself — tappable when there's something to show */}
      <button
        type="button"
        onClick={() => needsAction && setExpanded((v) => !v)}
        disabled={!needsAction}
        className={[
          'flex flex-col items-center gap-4 w-full',
          needsAction ? 'cursor-pointer' : 'cursor-default',
        ].join(' ')}
        aria-expanded={needsAction ? expanded : undefined}
      >
        <div className="relative flex items-center justify-center">
          {/* Outer glow ring */}
          <div
            className={[
              'absolute h-36 w-36 rounded-full opacity-20',
              ringColors.glow,
            ].join(' ')}
          />
          {/* Main ring */}
          <div
            className={[
              'relative animate-ring-pulse h-28 w-28 rounded-full flex items-center justify-center shadow-xl',
              ringColors.bg,
            ].join(' ')}
          >
            <Icon className="h-12 w-12 text-white" strokeWidth={3} />
          </div>
        </div>

        <div className="text-center">
          <p className="font-display text-xl font-bold text-express-ink">
            {ringColors.label}
          </p>
          <div className="flex items-center justify-center gap-1 mt-1">
            <p className="text-sm text-express-muted">{ringColors.sub}</p>
            {needsAction && (
              expanded
                ? <ChevronUp className="h-4 w-4 text-express-muted" />
                : <ChevronDown className="h-4 w-4 text-express-muted" />
            )}
          </div>
        </div>
      </button>

      {/* Inline action sheet — appears directly below the ring */}
      {needsAction && expanded && attentionItems.length > 0 && (
        <div className="w-full mt-4 rounded-2xl overflow-hidden border border-express-border shadow-lg">
          {/* Sheet header */}
          <div
            className={[
              'px-4 py-3 flex items-center gap-2',
              status === 'red'
                ? 'bg-express-red-soft border-b border-express-red/20'
                : 'bg-express-amber-soft border-b border-express-amber/20',
            ].join(' ')}
          >
            {status === 'red'
              ? <X className="h-4 w-4 text-express-red shrink-0" />
              : <CalendarClock className="h-4 w-4 text-express-amber shrink-0" />
            }
            <p className="font-display text-sm font-semibold text-express-ink">
              {status === 'red' ? 'Fix these now' : 'Coming up — pay on time'}
            </p>
          </div>

          {/* One row per attention item */}
          <div className="bg-express-surface divide-y divide-express-border">
            {attentionItems.map((expense) => {
              const isFailed = expense.status === 'failed';
              const isProcessing = Boolean(processing[expense.id]);
              const days = daysUntil(expense.dueDate);

              return (
                <div
                  key={expense.id}
                  className={[
                    'flex items-center gap-3 px-4 py-3.5',
                    isFailed ? 'bg-express-red-soft/40' : '',
                  ].join(' ')}
                >
                  {/* Icon */}
                  <span className="text-2xl shrink-0">{expense.categoryIcon}</span>

                  {/* Name + reason */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-express-ink text-sm truncate">
                      {expense.name}
                    </p>
                    <p
                      className={[
                        'text-xs mt-0.5',
                        isFailed ? 'text-express-red' : 'text-express-amber',
                      ].join(' ')}
                    >
                      {isFailed
                        ? expense.failureReason === 'insufficient_funds'
                          ? '✗ Failed — not enough funds'
                          : '✗ Failed — card expired'
                        : days === 0
                          ? '⚡ Due today'
                          : `Due in ${days} day${days === 1 ? '' : 's'}`}
                    </p>
                  </div>

                  {/* Amount + CTA */}
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className="font-mono text-sm font-bold text-express-ink">
                      {formatCurrency(expense.amount, expense.currency)}
                    </span>

                    {isFailed ? (
                      <button
                        type="button"
                        onClick={() => retryPayment(expense.id)}
                        disabled={isProcessing}
                        className={[
                          'inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5',
                          'bg-express-red text-white text-xs font-bold',
                          'disabled:opacity-60 transition-opacity',
                        ].join(' ')}
                      >
                        <RefreshCw
                          className={[
                            'h-3 w-3',
                            isProcessing ? 'animate-spin' : '',
                          ].join(' ')}
                        />
                        {isProcessing ? 'Retrying…' : 'Pay now'}
                      </button>
                    ) : (
                      <span
                        className={[
                          'inline-flex items-center rounded-xl px-3 py-1.5',
                          'bg-express-amber/15 text-express-amber text-xs font-bold',
                        ].join(' ')}
                      >
                        <CalendarClock className="h-3 w-3 mr-1" />
                        {days === 0 ? 'Pay today' : 'Remind me'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Foot note */}
          <div className="bg-express-surface px-4 py-2.5 border-t border-express-border">
            <p className="text-[11px] text-express-muted text-center">
              All payments below are also shown in your full list
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
