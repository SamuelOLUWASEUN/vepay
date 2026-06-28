import { useState } from 'react';
import { ShieldCheck, AlertTriangle, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useClearSpend } from '../../context/ClearSpendContext';
import { reconcileLedger, type ReconcileResult } from '../../lib/nomba';

/**
 * ReconciliationPanel — on-demand ledger audit for Pro users.
 *
 * Sends the app's local record of recurring charges to the backend, which
 * compares it against Nomba's /transactions list and reports any drift.
 * Developers care about this: it's the proof that what the app thinks happened
 * matches what actually moved through Nomba.
 *
 * It runs on demand rather than on a server cron because the ledger of record
 * lives in the browser — the panel is where that data actually exists to send.
 */
export function ReconciliationPanel() {
  const { expenses } = useClearSpend();
  const [result, setResult] = useState<ReconcileResult | null>(null);
  const [running, setRunning] = useState(false);

  async function runReconciliation() {
    setRunning(true);
    setResult(null);

    // Build a ledger from the recurring items the app is tracking. Each gets a
    // stable reference derived from its id so both sides can be matched.
    const ledger = expenses
      .filter((e) => e.status === 'active')
      .map((e) => ({
        reference: `vepay_${e.id}`,
        amountNGN: e.currency === 'NGN' ? e.amount : Math.round(e.amount * 1500),
      }));

    const res = await reconcileLedger(ledger);
    setResult(res);
    setRunning(false);
  }

  const totalMismatches = result?.mismatches
    ? result.mismatches.missingInNomba.length +
      result.mismatches.missingInLedger.length +
      result.mismatches.amountMismatch.length
    : 0;

  return (
    <div className="rounded-2xl border border-pro-border bg-pro-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <ShieldCheck className="h-4 w-4 text-pro-cyan shrink-0" />
          <div className="min-w-0">
            <p className="font-display text-sm font-semibold text-pro-ink">Ledger reconciliation</p>
            <p className="text-xs text-pro-muted">
              Check your records against Nomba's transactions
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={runReconciliation}
          disabled={running}
          className="inline-flex items-center gap-1.5 rounded-lg bg-pro-violet text-white text-xs font-semibold px-3 py-1.5 disabled:opacity-60 shrink-0"
        >
          <RefreshCw className={['h-3 w-3', running ? 'animate-spin' : ''].join(' ')} />
          {running ? 'Checking…' : 'Run check'}
        </button>
      </div>

      {result && result.ok && (
        <div className="mt-4">
          {result.inSync ? (
            <div className="flex items-center gap-2 rounded-xl border border-pro-cyan/30 bg-pro-cyan/5 px-4 py-3">
              <CheckCircle2 className="h-5 w-5 text-pro-cyan shrink-0" />
              <div>
                <p className="text-sm font-semibold text-pro-ink">Everything matches</p>
                <p className="text-xs text-pro-muted">
                  {result.summary?.ledgerCount} records checked against {result.summary?.nombaCount} Nomba transactions
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2 rounded-xl border border-pro-amber/30 bg-pro-amber/5 px-4 py-3">
                <AlertTriangle className="h-5 w-5 text-pro-amber shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-pro-ink">
                    {totalMismatches} {totalMismatches === 1 ? 'mismatch' : 'mismatches'} found
                  </p>
                  <p className="text-xs text-pro-muted">Review the items below</p>
                </div>
              </div>

              {result.mismatches && result.mismatches.missingInNomba.length > 0 && (
                <MismatchGroup
                  title="In your records, not in Nomba"
                  hint="The app counted these but Nomba has no matching transaction"
                  items={result.mismatches.missingInNomba.map((m) => `${m.reference} · ₦${m.amountNGN.toLocaleString('en-NG')}`)}
                />
              )}

              {result.mismatches && result.mismatches.missingInLedger.length > 0 && (
                <MismatchGroup
                  title="In Nomba, not in your records"
                  hint="Nomba processed these but the app didn't record them"
                  items={result.mismatches.missingInLedger.map((m) => `${m.reference} · ₦${m.amountNGN.toLocaleString('en-NG')}`)}
                />
              )}

              {result.mismatches && result.mismatches.amountMismatch.length > 0 && (
                <MismatchGroup
                  title="Amount differs"
                  hint="The reference matches but the amounts don't"
                  items={result.mismatches.amountMismatch.map(
                    (m) => `${m.reference} · app ₦${m.ledgerNGN.toLocaleString('en-NG')} vs Nomba ₦${m.nombaNGN.toLocaleString('en-NG')}`,
                  )}
                />
              )}
            </div>
          )}

          {result.checkedAt && (
            <p className="text-[10px] text-pro-muted mt-2">
              Checked {new Date(result.checkedAt).toLocaleString()}
            </p>
          )}
        </div>
      )}

      {result && !result.ok && (
        <div className="mt-4 rounded-xl border border-pro-red/30 bg-pro-red-soft px-4 py-3">
          <p className="text-sm font-semibold text-pro-ink">Couldn't run the check</p>
          <p className="text-xs text-pro-muted">{result.error ?? 'Try again in a moment'}</p>
        </div>
      )}
    </div>
  );
}

function MismatchGroup({ title, hint, items }: { title: string; hint: string; items: string[] }) {
  return (
    <div className="rounded-xl border border-pro-border bg-pro-bg/40 px-4 py-3">
      <p className="text-xs font-semibold text-pro-ink">{title}</p>
      <p className="text-[11px] text-pro-muted mb-2">{hint}</p>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="text-[11px] font-mono text-pro-muted break-all">{item}</li>
        ))}
      </ul>
    </div>
  );
}
