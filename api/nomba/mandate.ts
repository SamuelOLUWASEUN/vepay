/**
 * Nomba Mandates
 * POST   /api/nomba/mandate        create a recurring-charge authorization
 * GET    /api/nomba/mandate?id=    fetch a mandate's current status
 * DELETE /api/nomba/mandate?id=    cancel an active mandate
 *
 * A Mandate turns a one-off charge into a true subscription: the customer
 * approves "charge me X on this cadence" once, and Nomba pulls funds
 * automatically thereafter. Both Vepay modes use the same mechanism — Express
 * obligations (thrift, rent, power, levies) and Pro subscriptions.
 *
 * Docs: https://developer.nomba.com/nomba-api-reference
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getNombaToken } from './token.js';
import {
  toKobo,
  logNomba,
  rememberRef,
  recallRef,
  makeMerchantTxRef,
  nombaBaseUrl,
} from './_shared.js';

type Cadence = 'daily' | 'weekly' | 'monthly';

interface CreateMandateBody {
  expenseId: string;
  expenseName: string;
  amountNGN: number;
  cadence: Cadence;
  mode: 'EXPRESS' | 'PRO';
  customerEmail?: string;
  startDate?: string;
}

function toNombaFrequency(cadence: Cadence): string {
  switch (cadence) {
    case 'daily': return 'DAILY';
    case 'weekly': return 'WEEKLY';
    case 'monthly': return 'MONTHLY';
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const accountId = process.env.NOMBA_ACCOUNT_ID;
  const subAccountId = process.env.NOMBA_SUB_ACCOUNT_ID;

  if (!accountId || !subAccountId) {
    return res.status(500).json({ ok: false, error: 'Nomba account configuration missing' });
  }

  // ── Create ───────────────────────────────────────────────────────────────
  if (req.method === 'POST') {
    const body = req.body as CreateMandateBody;
    const { expenseId, expenseName, amountNGN, cadence, mode, customerEmail, startDate } = body;

    if (!expenseId || !amountNGN || !cadence || !mode) {
      return res.status(400).json({
        ok: false,
        error: 'Missing required fields: expenseId, amountNGN, cadence, mode',
      });
    }

    const merchantTxRef = makeMerchantTxRef(`mandate_${mode.toLowerCase()}`);

    const prior = recallRef(merchantTxRef);
    if (prior.seen) {
      return res.status(200).json(prior.result);
    }

    try {
      const token = await getNombaToken();

      const payload = {
        merchantTxRef,
        amount: toKobo(amountNGN),
        currency: 'NGN',
        frequency: toNombaFrequency(cadence),
        startDate: startDate ?? new Date().toISOString().slice(0, 10),
        accountId: subAccountId,
        customerEmail: customerEmail ?? 'user@vepay.app',
        customerReference: expenseId,
        narration: `Vepay ${mode === 'EXPRESS' ? 'recurring obligation' : 'subscription'}: ${expenseName}`,
        callbackUrl: 'https://vepay.vercel.app/api/nomba/webhook',
      };

      logNomba('info', 'mandate.create.request', { merchantTxRef, expenseId, amountNGN, cadence, mode });

      const response = await fetch(`${nombaBaseUrl()}/v1/mandates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'accountId': accountId,
          'Idempotency-Key': merchantTxRef,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        logNomba('error', 'mandate.create.failed', {
          merchantTxRef,
          status: response.status,
          message: result.description ?? result.message,
        });
        return res.status(response.status).json({
          ok: false,
          error: result.description ?? result.message ?? 'Mandate creation failed',
        });
      }

      const ok = {
        ok: true,
        merchantTxRef,
        mandateId: result.data?.mandateId ?? result.data?.id ?? null,
        status: result.data?.status ?? 'pending_authorization',
        authorizationUrl: result.data?.authorizationUrl ?? null,
        cadence,
      };

      rememberRef(merchantTxRef, ok);
      logNomba('info', 'mandate.create.success', { merchantTxRef, mandateId: ok.mandateId, status: ok.status });
      return res.status(200).json(ok);

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      logNomba('error', 'mandate.create.exception', { merchantTxRef, message });
      return res.status(500).json({ ok: false, error: message });
    }
  }

  // ── Fetch ────────────────────────────────────────────────────────────────
  if (req.method === 'GET') {
    const mandateId = String(req.query.id ?? '');
    if (!mandateId) {
      return res.status(400).json({ ok: false, error: 'Missing mandate id' });
    }
    try {
      const token = await getNombaToken();
      const response = await fetch(`${nombaBaseUrl()}/v1/mandates/${mandateId}`, {
        headers: { 'Authorization': `Bearer ${token}`, 'accountId': accountId },
      });
      const result = await response.json();
      if (!response.ok) {
        return res.status(response.status).json({ ok: false, error: result.description ?? 'Fetch failed' });
      }
      return res.status(200).json({
        ok: true,
        mandateId,
        status: result.data?.status ?? null,
        nextChargeDate: result.data?.nextChargeDate ?? null,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return res.status(500).json({ ok: false, error: message });
    }
  }

  // ── Cancel ───────────────────────────────────────────────────────────────
  if (req.method === 'DELETE') {
    const mandateId = String(req.query.id ?? '');
    if (!mandateId) {
      return res.status(400).json({ ok: false, error: 'Missing mandate id' });
    }
    try {
      const token = await getNombaToken();
      const response = await fetch(`${nombaBaseUrl()}/v1/mandates/${mandateId}/cancel`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'accountId': accountId },
      });
      const result = await response.json();
      if (!response.ok) {
        return res.status(response.status).json({ ok: false, error: result.description ?? 'Cancel failed' });
      }
      logNomba('info', 'mandate.cancel.success', { mandateId });
      return res.status(200).json({ ok: true, mandateId, status: 'cancelled' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return res.status(500).json({ ok: false, error: message });
    }
  }

  return res.status(405).json({ ok: false, error: 'Method not allowed' });
}
