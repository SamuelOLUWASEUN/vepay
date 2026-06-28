/**
 * Nomba Reconciliation
 * POST /api/nomba/reconcile
 *
 * Compares the app's local ledger against Nomba's source-of-truth
 * /transactions list and reports any drift. Three mismatch classes are
 * surfaced so the UI can act on each:
 *   - missing_in_nomba : ledger has it, Nomba doesn't (local over-count)
 *   - missing_in_ledger : Nomba has it, ledger doesn't (un-recorded charge)
 *   - amount_mismatch  : both have the ref but amounts differ
 *
 * In production this would run nightly on a cron schedule (Vercel Cron). For
 * the hackathon it's an on-demand endpoint the Pro dashboard calls so judges
 * can see live reconciliation. The cron wiring is documented in vercel.json.
 *
 * Docs: https://developer.nomba.com/transactions
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getNombaToken } from './token';
import { fromKobo, logNomba } from './_shared';

interface LedgerEntry {
  reference: string;
  amountNGN: number;
}

interface ReconcileBody {
  ledger: LedgerEntry[];
  since?: string; // ISO date, defaults to last 30 days
}

interface NombaTxn {
  reference: string;
  amount: number; // kobo
  status: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const { ledger, since } = req.body as ReconcileBody;

  if (!Array.isArray(ledger)) {
    return res.status(400).json({ ok: false, error: 'ledger must be an array of { reference, amountNGN }' });
  }

  const accountId = process.env.NOMBA_ACCOUNT_ID;
  if (!accountId) {
    return res.status(500).json({ ok: false, error: 'Nomba account configuration missing' });
  }

  const sinceDate = since ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  try {
    const token = await getNombaToken();

    const params = new URLSearchParams({ dateFrom: sinceDate, limit: '200' });
    const response = await fetch(
      `https://api.nomba.com/v1/transactions?${params.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'accountId': accountId,
        },
      },
    );

    const result = await response.json();

    if (!response.ok) {
      logNomba('error', 'reconcile.fetch_failed', { status: response.status });
      return res.status(response.status).json({ ok: false, error: result.message ?? 'Could not fetch transactions' });
    }

    const nombaTxns: NombaTxn[] = (result.data?.transactions ?? result.transactions ?? []) as NombaTxn[];

    // Index both sides by reference for O(n) comparison.
    const nombaByRef = new Map<string, NombaTxn>();
    nombaTxns.forEach((t) => nombaByRef.set(t.reference, t));

    const ledgerByRef = new Map<string, LedgerEntry>();
    ledger.forEach((l) => ledgerByRef.set(l.reference, l));

    const missingInNomba: LedgerEntry[] = [];
    const missingInLedger: { reference: string; amountNGN: number }[] = [];
    const amountMismatch: { reference: string; ledgerNGN: number; nombaNGN: number }[] = [];

    for (const entry of ledger) {
      const match = nombaByRef.get(entry.reference);
      if (!match) {
        missingInNomba.push(entry);
      } else if (fromKobo(match.amount) !== entry.amountNGN) {
        amountMismatch.push({
          reference: entry.reference,
          ledgerNGN: entry.amountNGN,
          nombaNGN: fromKobo(match.amount),
        });
      }
    }

    for (const txn of nombaTxns) {
      if (!ledgerByRef.has(txn.reference)) {
        missingInLedger.push({ reference: txn.reference, amountNGN: fromKobo(txn.amount) });
      }
    }

    const inSync =
      missingInNomba.length === 0 &&
      missingInLedger.length === 0 &&
      amountMismatch.length === 0;

    logNomba('info', 'reconcile.complete', {
      ledgerCount: ledger.length,
      nombaCount: nombaTxns.length,
      missingInNomba: missingInNomba.length,
      missingInLedger: missingInLedger.length,
      amountMismatch: amountMismatch.length,
      inSync,
    });

    return res.status(200).json({
      ok: true,
      inSync,
      checkedAt: new Date().toISOString(),
      since: sinceDate,
      summary: {
        ledgerCount: ledger.length,
        nombaCount: nombaTxns.length,
      },
      mismatches: { missingInNomba, missingInLedger, amountMismatch },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logNomba('error', 'reconcile.exception', { message });
    return res.status(500).json({ ok: false, error: message });
  }
}
