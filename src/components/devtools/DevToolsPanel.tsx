import { useState } from 'react';
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  CreditCard,
  RotateCcw,
  Terminal,
  Wifi,
} from 'lucide-react';
import { useClearSpend } from '../../context/ClearSpendContext';

/**
 * "DevTools Simulation Panel"
 *
 * Floating bottom panel for live-demo fault injection. Lets the presenter
 * trigger Nomba webhook failure payloads on demand — proving the UI's
 * unhappy-path handling without waiting for a real payment to fail.
 */
export function DevToolsPanel() {
  const [open, setOpen] = useState(false);
  const {
    currentMode,
    simulateInsufficientFunds,
    simulateExpiredCard,
    resetSimulations,
    retryPayment,
    processing,
  } = useClearSpend();

  const isExpress = currentMode === 'EXPRESS';
  const anyProcessing = Object.keys(processing).length > 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 flex justify-center pointer-events-none">
      <div
        className={[
          'pointer-events-auto w-full max-w-2xl mx-4 mb-4 rounded-2xl border shadow-2xl backdrop-blur-md overflow-hidden',
          'transition-all duration-300',
          isExpress
            ? 'bg-express-ink/95 border-express-ink/20 text-express-bg'
            : 'bg-pro-surface/95 border-pro-border text-pro-ink',
        ].join(' ')}
      >
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="w-full flex items-center justify-between gap-2 px-4 py-3"
        >
          <div className="flex items-center gap-2.5">
            <div
              className={[
                'rounded-lg p-1.5',
                isExpress ? 'bg-express-bg/10' : 'bg-pro-violet/15',
              ].join(' ')}
            >
              <Terminal
                className={['h-4 w-4', isExpress ? 'text-express-bg' : 'text-pro-violet'].join(
                  ' ',
                )}
              />
            </div>
            <div className="text-left">
              <p className="font-display font-semibold text-sm">DevTools — Simulation Panel</p>
              <p
                className={[
                  'text-xs',
                  isExpress ? 'text-express-bg/60' : 'text-pro-muted',
                ].join(' ')}
              >
                Trigger Nomba webhook scenarios for live demo
              </p>
            </div>
          </div>
          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </button>

        {open && (
          <div
            className={[
              'border-t px-4 py-4 grid grid-cols-1 sm:grid-cols-3 gap-3',
              isExpress ? 'border-express-bg/10' : 'border-pro-border',
            ].join(' ')}
          >
            <button
              type="button"
              onClick={simulateInsufficientFunds}
              className={[
                'flex flex-col items-start gap-2 rounded-xl border px-3.5 py-3 text-left transition-colors',
                isExpress
                  ? 'border-express-red/30 bg-express-red/10 hover:bg-express-red/20'
                  : 'border-pro-red/30 bg-pro-red/10 hover:bg-pro-red/20',
              ].join(' ')}
            >
              <AlertTriangle
                className={['h-4 w-4', isExpress ? 'text-express-red' : 'text-pro-red'].join(' ')}
              />
              <div>
                <p className="text-sm font-semibold">Simulate Insufficient Funds</p>
                <p
                  className={[
                    'text-xs mt-0.5',
                    isExpress ? 'text-express-bg/60' : 'text-pro-muted',
                  ].join(' ')}
                >
                  Declines an active charge
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={simulateExpiredCard}
              className={[
                'flex flex-col items-start gap-2 rounded-xl border px-3.5 py-3 text-left transition-colors',
                isExpress
                  ? 'border-express-amber/30 bg-express-amber/10 hover:bg-express-amber/20'
                  : 'border-pro-amber/30 bg-pro-amber/10 hover:bg-pro-amber/20',
              ].join(' ')}
            >
              <CreditCard
                className={['h-4 w-4', isExpress ? 'text-express-amber' : 'text-pro-amber'].join(
                  ' ',
                )}
              />
              <div>
                <p className="text-sm font-semibold">Simulate Expired Card</p>
                <p
                  className={[
                    'text-xs mt-0.5',
                    isExpress ? 'text-express-bg/60' : 'text-pro-muted',
                  ].join(' ')}
                >
                  Flags Vercel Pro's tokenised card
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => retryPayment('pro-vercel')}
              disabled={anyProcessing}
              className={[
                'flex flex-col items-start gap-2 rounded-xl border px-3.5 py-3 text-left transition-colors disabled:opacity-50',
                isExpress
                  ? 'border-express-green/30 bg-express-green/10 hover:bg-express-green/20'
                  : 'border-pro-cyan/30 bg-pro-cyan/10 hover:bg-pro-cyan/20',
              ].join(' ')}
            >
              <Wifi
                className={['h-4 w-4', isExpress ? 'text-express-green' : 'text-pro-cyan'].join(
                  ' ',
                )}
              />
              <div>
                <p className="text-sm font-semibold">Retry w/ Idempotency-Key</p>
                <p
                  className={[
                    'text-xs mt-0.5',
                    isExpress ? 'text-express-bg/60' : 'text-pro-muted',
                  ].join(' ')}
                >
                  Simulates a safe network retry
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={resetSimulations}
              className={[
                'sm:col-span-3 flex items-center justify-center gap-2 rounded-xl border px-3.5 py-2.5 text-sm font-semibold transition-colors',
                isExpress
                  ? 'border-express-bg/15 hover:bg-express-bg/10'
                  : 'border-pro-border hover:bg-pro-surface-2',
              ].join(' ')}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset all simulations to defaults
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
