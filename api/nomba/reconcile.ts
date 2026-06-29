/**
 * Nomba Reconciliation
 * POST /api/nomba/reconcile
 *
 * Compares the app's local ledger against Nomba's /transactions list and
 * reports drift in three classes: missing_in_nomba, missing_in_ledger, and
 * amount_mismatch. Runs on demand from the Pro dashboard (the ledger of record
 * lives in the browser, so the panel is where that data exists to send).
 *
 * Docs: https://developer.nomba.com/nomba-api-reference/transactions
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getNombaToken } from './token.js';
import { fromKobo, logNomba, nombaBaseUrl } from './_shared.js';

interface LedgerEntry {
  reference: string;
  amountNGN: number;
}

interface ReconcileBody {
  ledger: LedgerEntry[];
  since?: string;
}

interface NombaTxn {
  reference: string;
  amount: number;
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
      `${nombaBaseUrl()}/v1/transactions?${params.toString()}`,
      { headers: { 'Authorization': `Bearer ${token}`, 'accountId': accountId } },
    );

    const result = await response.json();

    if (!response.ok) {
      logNomba('error', 'reconcile.fetch_failed', { status: response.status });
      return res.status(response.status).json({ ok: false, error: result.description ?? 'Could not fetch transactions' });
    }

    const nombaTxns: NombaTxn[] = (result.data?.transactions ?? result.data ?? []) as NombaTxn[];

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
      missingInNomba.length === 0 && missingInLedger.length === 0 && amountMismatch.length === 0;

    logNomba('info', 'reconcile.complete', {
      ledgerCount: ledger.length,
      nombaCount: nombaTxns.length,
      inSync,
    });

    return res.status(200).json({
      ok: true,
      inSync,
      checkedAt: new Date().toISOString(),
      since: sinceDate,
      summary: { ledgerCount: ledger.length, nombaCount: nombaTxns.length },
      mismatches: { missingInNomba, missingInLedger, amountMismatch },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logNomba('error', 'reconcile.exception', { message });
    return res.status(500).json({ ok: false, error: message });
  }
}
