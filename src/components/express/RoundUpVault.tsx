import { PiggyBank } from 'lucide-react';
import { useClearSpend } from '../../context/ClearSpendContext';
import { formatCurrency } from '../../lib/currency';

/**
 * Round-Up Savings Vault — when enabled, every quick-action ledger entry
 * rounds up to the nearest ₦100 and sweeps the difference into a savings
 * vault. Demonstrates automated fractional micro-savings collection.
 */
export function RoundUpVault() {
  const { roundUpVaultEnabled, toggleRoundUpVault, vaultBalanceNGN } = useClearSpend();

  return (
    <div className="rounded-2xl border border-express-border bg-express-surface px-5 py-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-express-green-soft p-2.5">
            <PiggyBank className="h-5 w-5 text-express-green" />
          </div>
          <div>
            <p className="font-display text-sm font-semibold text-express-ink">
              Round-Up Savings Vault
            </p>
            <p className="text-xs text-express-muted">
              Spare change from every payment goes here
            </p>
          </div>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={roundUpVaultEnabled}
          onClick={toggleRoundUpVault}
          className={[
            'relative h-7 w-12 rounded-full transition-colors duration-200 shrink-0 focus:outline-none',
            roundUpVaultEnabled ? 'bg-express-green' : 'bg-express-border',
          ].join(' ')}
        >
          <span
            style={{ transform: roundUpVaultEnabled ? 'translateX(20px)' : 'translateX(2px)' }}
            className="absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-md transition-transform duration-200 block"
          />
        </button>
      </div>

      <div className="mt-4 flex items-baseline justify-between border-t border-express-border pt-3">
        <span className="text-xs text-express-muted">Vault balance</span>
        <span className="font-mono text-lg font-bold text-express-ink">
          {formatCurrency(vaultBalanceNGN, 'NGN')}
        </span>
      </div>
    </div>
  );
}
