import { CheckCircle2, X } from 'lucide-react';
import { useClearSpend } from '../../context/ClearSpendContext';

/**
 * Global toast — ephemeral feedback for ledger entries, pause/cancel,
 * idempotency results, and any other non-blocking confirmation.
 * Uses a custom CSS keyframe (animate-toast-in) compatible with Tailwind v4.
 */
export function Toast() {
  const { toast, clearToast, currentMode } = useClearSpend();

  if (!toast) return null;

  const isExpress = currentMode === 'EXPRESS';

  return (
    <div className="fixed bottom-28 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
      <div
        className={[
          'animate-toast-in pointer-events-auto',
          'flex items-center gap-3 rounded-2xl border px-4 py-3 shadow-2xl',
          'max-w-sm w-full',
          isExpress
            ? 'bg-express-ink text-express-bg border-white/10'
            : 'bg-pro-surface-2 text-pro-ink border-pro-border',
        ].join(' ')}
      >
        <CheckCircle2
          className={[
            'h-4 w-4 shrink-0',
            isExpress ? 'text-express-green' : 'text-pro-cyan',
          ].join(' ')}
        />
        <p className="text-sm font-medium leading-snug flex-1 break-words">{toast}</p>
        <button
          type="button"
          onClick={clearToast}
          className="shrink-0 rounded-full p-1 opacity-50 hover:opacity-100 transition-opacity"
          aria-label="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
