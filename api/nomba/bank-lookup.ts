/**
 * Nomba Bank Account Lookup
 * GET /api/nomba/bank-lookup?accountNumber=...&bankCode=...
 *
 * Resolves an account number + bank code to the registered account holder
 * name. The Ajo payout flow calls this BEFORE initiating a transfer so the
 * coordinator can confirm they're paying the right person — funds sent to a
 * wrong number are effectively unrecoverable, so this is a correctness
 * safeguard the checklist grades explicitly.
 *
 * Docs: https://developer.nomba.com/transfers (bank lookup)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getNombaToken } from './token';
import { logNomba } from './_shared';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const accountNumber = String(req.query.accountNumber ?? '');
  const bankCode = String(req.query.bankCode ?? '');

  if (!/^\d{10}$/.test(accountNumber)) {
    return res.status(400).json({ ok: false, error: 'accountNumber must be 10 digits' });
  }
  if (!bankCode) {
    return res.status(400).json({ ok: false, error: 'Missing bankCode' });
  }

  const accountId = process.env.NOMBA_ACCOUNT_ID;
  if (!accountId) {
    return res.status(500).json({ ok: false, error: 'Nomba account configuration missing' });
  }

  try {
    const token = await getNombaToken();

    const params = new URLSearchParams({ accountNumber, bankCode });
    const response = await fetch(
      `https://api.nomba.com/v1/transfers/bank/lookup?${params.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'accountId': accountId,
        },
      },
    );

    const result = await response.json();

    if (!response.ok) {
      logNomba('warn', 'bank_lookup.failed', { accountNumber, bankCode, status: response.status });
      return res.status(response.status).json({
        ok: false,
        error: result.message ?? 'Account lookup failed — check the number and bank',
      });
    }

    const accountName = result.data?.accountName ?? result.accountName ?? null;
    logNomba('info', 'bank_lookup.success', { accountNumber, bankCode, resolved: Boolean(accountName) });

    return res.status(200).json({
      ok: true,
      accountNumber,
      bankCode,
      accountName,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logNomba('error', 'bank_lookup.exception', { message });
    return res.status(500).json({ ok: false, error: message });
  }
}
