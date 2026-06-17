import { useState } from 'react';
import { Crown, Lock, ShieldCheck, Snowflake, Sparkles, Zap } from 'lucide-react';
import { useClearSpend } from '../../context/ClearSpendContext';
import { convertCurrency, formatCurrency } from '../../lib/currency';

/**
 * Premium tier overlay ($2/mo, billed in NGN value via Nomba checkout).
 * Unlocks "Trial Virtual Card Management" — single-use tokenised cards for
 * trial sign-ups that auto-expire before a trial converts, preventing
 * surprise charges. Also hosts the AI Agentic Optimizer entry point, which
 * always routes through the human-in-the-loop confirmation modal.
 */
export function PremiumOverlay() {
  const { displayCurrency, openAgenticOptimizer, agenticOptimizer } = useClearSpend();
  const [unlocked, setUnlocked] = useState(false);

  const priceUSD = 2;
  const priceDisplay = formatCurrency(
    convertCurrency(priceUSD, 'USD', displayCurrency),
    displayCurrency,
  );

  return (
    <div className="rounded-2xl border border-pro-violet/30 bg-pro-violet-soft px-5 py-4 shadow-sm">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="rounded-xl bg-pro-violet/20 p-2">
            <Crown className="h-4 w-4 text-pro-violet" />
          </div>
          <div>
            <p className="font-display text-sm font-semibold text-pro-ink">Vepay Pro+</p>
            <p className="text-xs text-pro-muted">{priceDisplay}/mo · billed via Nomba Checkout</p>
          </div>
        </div>

        {!unlocked && (
          <button
            type="button"
            onClick={() => setUnlocked(true)}
            className="rounded-full bg-pro-violet text-white text-xs font-semibold px-3 py-1.5 hover:bg-pro-violet/90 transition-colors shrink-0"
          >
            Unlock
          </button>
        )}
      </div>

      {/* Trial Virtual Card Management */}
      <div
        className={[
          'rounded-xl border px-4 py-3 mb-3',
          unlocked ? 'border-pro-border bg-pro-surface' : 'border-pro-border bg-pro-bg/40',
        ].join(' ')}
      >
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-pro-ink">Trial Virtual Card Management</p>
          {!unlocked && <Lock className="h-3.5 w-3.5 text-pro-muted" />}
        </div>

        {unlocked ? (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-pro-muted leading-relaxed">
              Generate a single-use tokenised Nomba virtual card for new trial sign-ups. The
              card auto-freezes before each trial converts, so you're never charged without
              choosing to be.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-pro-violet text-white text-xs font-semibold py-2 hover:bg-pro-violet/90 transition-colors"
              >
                <Zap className="h-3.5 w-3.5" />
                Generate trial card
              </button>
              <button
                type="button"
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-pro-border text-pro-ink text-xs font-semibold py-2 hover:bg-pro-surface-2 transition-colors"
              >
                <Snowflake className="h-3.5 w-3.5" />
                Freeze all trial cards
              </button>
            </div>
          </div>
        ) : (
          <p className="text-xs text-pro-muted leading-relaxed">
            Upgrade to generate disposable virtual cards for trials — auto-freeze before
            conversion to avoid surprise charges.
          </p>
        )}
      </div>

      {/* AI Agentic Optimizer */}
      <button
        type="button"
        onClick={openAgenticOptimizer}
        className="w-full flex items-center justify-between gap-3 rounded-xl border border-pro-cyan/30 bg-pro-cyan/10 px-4 py-3 hover:bg-pro-cyan/15 transition-colors"
      >
        <div className="flex items-center gap-2.5 text-left">
          <Sparkles className="h-4 w-4 text-pro-cyan shrink-0" />
          <div>
            <p className="text-sm font-medium text-pro-ink">AI Agentic Optimizer</p>
            <p className="text-xs text-pro-muted">
              {agenticOptimizer.resolved === 'approved'
                ? 'Optimization applied'
                : 'Found unused seats — review savings'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-pro-cyan/20 text-pro-cyan text-[10px] font-semibold px-2 py-1 shrink-0">
          <ShieldCheck className="h-3 w-3" />
          10% fee on savings
        </div>
      </button>
    </div>
  );
}
