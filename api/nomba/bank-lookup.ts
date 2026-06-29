/**
 * Nomba Bank Account Lookup
 * GET /api/nomba/bank-lookup?accountNumber=...&bankCode=...
 *
 * Resolves an account number + bank code to the registered account holder
 * name. The Ajo payout flow calls this BEFORE a transfer so the coordinator
 * can confirm they're paying the right person.
 *
 * Docs: https://developer.nomba.com/nomba-api-reference/transfers
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getNombaToken } from './token.js';
import { logNomba, nombaBaseUrl } from './_shared.js';

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
      `${nombaBaseUrl()}/v1/transfers/bank/lookup?${params.toString()}`,
      { headers: { 'Authorization': `Bearer ${token}`, 'accountId': accountId } },
    );

    const result = await response.json();

    if (!response.ok) {
      logNomba('warn', 'bank_lookup.failed', { accountNumber, bankCode, status: response.status });
      return res.status(response.status).json({
        ok: false,
        error: result.description ?? result.message ?? 'Account lookup failed',
      });
    }

    const accountName = result.data?.accountName ?? null;
    logNomba('info', 'bank_lookup.success', { accountNumber, bankCode, resolved: Boolean(accountName) });
    return res.status(200).json({ ok: true, accountNumber, bankCode, accountName });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logNomba('error', 'bank_lookup.exception', { message });
    return res.status(500).json({ ok: false, error: message });
  }
}
