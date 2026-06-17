import { ArrowLeftRight } from 'lucide-react';
import { useClearSpend } from '../../context/ClearSpendContext';

/**
 * Sticky floating control in the top-right corner. Flips the entire UI
 * between EXPRESS MODE and PRO MODE — both read/write the same underlying
 * Expense[] state via useClearSpend.
 */
export function ModeToggle() {
  const { currentMode, toggleMode } = useClearSpend();
  const isExpress = currentMode === 'EXPRESS';

  return (
    <button
      type="button"
      onClick={toggleMode}
      className={[
        'fixed top-4 right-4 z-50 flex items-center gap-2 rounded-full',
        'px-4 py-2.5 text-sm font-semibold shadow-lg backdrop-blur-md',
        'transition-all duration-200 hover:scale-[1.03] active:scale-[0.98]',
        'font-display',
        isExpress
          ? 'bg-express-ink text-express-bg border border-express-ink/10'
          : 'bg-pro-violet text-white border border-pro-violet/40 shadow-pro-violet/30',
      ].join(' ')}
      aria-label="Switch UI mode"
    >
      <ArrowLeftRight className="h-4 w-4" />
      <span className="hidden sm:inline">
        Switch to {isExpress ? 'Pro' : 'Express'} Mode
      </span>
      <span className="sm:hidden">{isExpress ? 'Pro' : 'Express'}</span>
    </button>
  );
}
