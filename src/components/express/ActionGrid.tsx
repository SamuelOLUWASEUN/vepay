import { useClearSpend } from '../../context/ClearSpendContext';
import { QUICK_ACTIONS } from '../../lib/mockData';

/**
 * Zero-typing action grid. Each tap appends a transaction to the shared
 * ledger and (if Round-Up Vault is enabled) sweeps the change into savings.
 * Built for users who may not read fluently — icon + single word only.
 */
export function ActionGrid() {
  const { recordQuickAction } = useClearSpend();

  return (
    <div className="grid grid-cols-3 gap-3">
      {QUICK_ACTIONS.map((action) => (
        <button
          key={action.id}
          type="button"
          onClick={() => recordQuickAction(action)}
          className="flex flex-col items-center gap-2 rounded-2xl border border-express-border bg-express-surface px-2 py-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md active:scale-95 active:translate-y-0 min-h-[96px] w-full"
        >
          <span className="text-4xl leading-none">{action.icon}</span>
          <span className="font-display text-sm font-semibold text-express-ink text-center leading-tight">
            {action.label}
          </span>
          <span className="text-xs text-express-muted font-mono">
            ₦{action.defaultAmount.toLocaleString('en-NG')}
          </span>
        </button>
      ))}
    </div>
  );
}
