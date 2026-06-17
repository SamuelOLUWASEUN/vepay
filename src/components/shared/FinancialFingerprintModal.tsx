import { Brain, X } from 'lucide-react';
import { useClearSpend } from '../../context/ClearSpendContext';

/**
 * Financial Fingerprint — pattern recognition from the user's own data.
 *
 * Surfaces behavioural insights like: "You always miss your Esusu on weeks
 * when Power also hits. You've done this 6 times." This turns Vepay
 * from a passive ledger into an active financial advisor — one that knows
 * YOUR patterns, not generic advice.
 *
 * This is the feature that keeps people coming back for life: it gets
 * smarter the more they use it, and it tells them something true about
 * themselves that no other app does.
 */
export function FinancialFingerprintModal() {
  const { fingerprintOpen, closeFingerprint, financialPatterns, currentMode } = useClearSpend();
  const isExpress = currentMode === 'EXPRESS';

  if (!fingerprintOpen) return null;

  const severityConfig = {
    warning: {
      badge: isExpress ? 'bg-express-amber-soft text-express-amber border-express-amber/30' : 'bg-pro-amber/15 text-pro-amber border-pro-amber/30',
      border: isExpress ? 'border-express-amber/30' : 'border-pro-amber/30',
      bg: isExpress ? 'bg-express-amber-soft/50' : 'bg-pro-amber/5',
    },
    insight: {
      badge: isExpress ? 'bg-express-green-soft text-express-green border-express-green/30' : 'bg-pro-cyan/15 text-pro-cyan border-pro-cyan/30',
      border: isExpress ? 'border-express-green/30' : 'border-pro-cyan/30',
      bg: isExpress ? 'bg-express-green-soft/50' : 'bg-pro-cyan/5',
    },
    tip: {
      badge: isExpress ? 'bg-express-border text-express-muted border-express-border' : 'bg-pro-violet/15 text-pro-violet border-pro-violet/30',
      border: isExpress ? 'border-express-border' : 'border-pro-border',
      bg: isExpress ? 'bg-express-bg' : 'bg-pro-surface-2',
    },
  };

  return (
    <div
      className="fixed inset-0 z-[65] flex items-center justify-center p-4 animate-backdrop-in"
      style={{ backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) closeFingerprint(); }}
    >
      <div className={[
        'w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden animate-modal-in max-h-[90vh] flex flex-col',
        isExpress ? 'bg-express-surface border-express-border' : 'bg-pro-surface border-pro-border',
      ].join(' ')}>

        {/* Header */}
        <div className={[
          'flex items-center justify-between gap-3 px-6 py-5 border-b shrink-0',
          isExpress ? 'border-express-border bg-express-bg' : 'border-pro-border bg-pro-surface-2',
        ].join(' ')}>
          <div className="flex items-center gap-3">
            <div className={['rounded-xl p-2.5', isExpress ? 'bg-express-ink' : 'bg-pro-violet/20'].join(' ')}>
              <Brain className={['h-5 w-5', isExpress ? 'text-express-bg' : 'text-pro-violet'].join(' ')} />
            </div>
            <div>
              <p className={['font-display font-bold text-base', isExpress ? 'text-express-ink' : 'text-pro-ink'].join(' ')}>
                Your Financial Fingerprint
              </p>
              <p className={['text-xs', isExpress ? 'text-express-muted' : 'text-pro-muted'].join(' ')}>
                Patterns from your real payment behaviour
              </p>
            </div>
          </div>
          <button type="button" onClick={closeFingerprint}
            className={['rounded-full p-1.5 transition-colors', isExpress ? 'text-express-muted hover:text-express-ink' : 'text-pro-muted hover:text-pro-ink'].join(' ')}>
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Pattern cards */}
        <div className="overflow-y-auto overscroll-contain flex-1 px-6 py-5 flex flex-col gap-3">
          {financialPatterns.map((pattern) => {
            const styles = severityConfig[pattern.severity];
            return (
              <div key={pattern.id} className={['rounded-2xl border px-4 py-4', styles.border, styles.bg].join(' ')}>
                <div className="flex items-start gap-3">
                  <span className="text-2xl shrink-0 mt-0.5">{pattern.icon}</span>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className={['font-display font-semibold text-sm', isExpress ? 'text-express-ink' : 'text-pro-ink'].join(' ')}>
                        {pattern.title}
                      </p>
                      <span className={['rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase', styles.badge].join(' ')}>
                        {pattern.severity}
                      </span>
                    </div>
                    <p className={['text-xs leading-relaxed', isExpress ? 'text-express-muted' : 'text-pro-muted'].join(' ')}>
                      {pattern.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className={['px-6 py-4 border-t shrink-0', isExpress ? 'border-express-border' : 'border-pro-border'].join(' ')}>
          <p className={['text-[11px] text-center leading-relaxed', isExpress ? 'text-express-muted' : 'text-pro-muted'].join(' ')}>
            Your Fingerprint updates automatically as you use Vepay. The more you log, the sharper your insights become. All pattern analysis happens on your device — your data never leaves.
          </p>
        </div>
      </div>
    </div>
  );
}
