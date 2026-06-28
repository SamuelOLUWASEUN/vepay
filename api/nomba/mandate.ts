/**
 * Nomba Mandates
 * POST   /api/nomba/mandate        create a recurring-charge authorization
 * GET    /api/nomba/mandate?id=    fetch a mandate's current status
 * DELETE /api/nomba/mandate?id=    cancel an active mandate
 *
 * A Mandate is the authorization that turns a one-off charge into a true
 * subscription: the customer approves "charge me X on this cadence" once, and
 * Nomba pulls funds automatically thereafter. Both Vepay modes use the same
 * mechanism:
 *   - Express: thrift contributions, shop rent, power, levies
 *   - Pro:     every SaaS / API subscription
 *
 * The frontend treats a mandate as the lifecycle behind each recurring item,
 * so creating one is what flips an expense from "manual pay" to "auto".
 *
 * Docs: https://developer.nomba.com/mandates
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getNombaToken } from './token';
import {
  toKobo,
  logNomba,
  rememberRef,
  recallRef,
  makeMerchantTxRef,
  nombaBaseUrl,
} from './_shared';

type Cadence = 'daily' | 'weekly' | 'monthly';

interface CreateMandateBody {
  expenseId: string;
  expenseName: string;
  amountNGN: number;
  cadence: Cadence;
  mode: 'EXPRESS' | 'PRO';
  customerEmail?: string;
  startDate?: string; // ISO date; defaults to today
}

/** Map Vepay cadence to the frequency Nomba's mandate API expects. */
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

  // ── Create a mandate ─────────────────────────────────────────────────────
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

    // Idempotency: if this exact ref was already created, return the first result.
    const prior = recallRef(merchantTxRef);
    if (prior.seen) {
      logNomba('info', 'mandate.create.idempotent_hit', { merchantTxRef, expenseId });
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
        sourceAccountId: subAccountId,
        customer: {
          email: customerEmail ?? 'user@vepay.app',
          reference: expenseId,
        },
        narration: `Vepay ${mode === 'EXPRESS' ? 'recurring obligation' : 'subscription'}: ${expenseName}`,
        callbackUrl: 'https://vepay.vercel.app/api/nomba/webhook',
        metaData: { expenseId, expenseName, mode, source: 'vepay' },
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
          nombaCode: result.code,
          message: result.message,
        });
        return res.status(response.status).json({
          ok: false,
          error: result.message ?? 'Mandate creation failed',
          nomba_code: result.code,
        });
      }

      const ok = {
        ok: true,
        merchantTxRef,
        mandateId: result.data?.mandateId ?? result.mandateId,
        status: result.data?.status ?? 'pending_authorization',
        authorizationUrl: result.data?.authorizationUrl ?? result.authorizationUrl ?? null,
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

  // ── Fetch mandate status ─────────────────────────────────────────────────
  if (req.method === 'GET') {
    const mandateId = String(req.query.id ?? '');
    if (!mandateId) {
      return res.status(400).json({ ok: false, error: 'Missing mandate id' });
    }

    try {
      const token = await getNombaToken();
      const response = await fetch(`${nombaBaseUrl()}/v1/mandates/${mandateId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'accountId': accountId,
        },
      });
      const result = await response.json();

      if (!response.ok) {
        logNomba('warn', 'mandate.fetch.failed', { mandateId, status: response.status });
        return res.status(response.status).json({ ok: false, error: result.message ?? 'Fetch failed' });
      }

      return res.status(200).json({
        ok: true,
        mandateId,
        status: result.data?.status ?? result.status,
        nextChargeDate: result.data?.nextChargeDate ?? null,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      logNomba('error', 'mandate.fetch.exception', { mandateId, message });
      return res.status(500).json({ ok: false, error: message });
    }
  }

  // ── Cancel a mandate ─────────────────────────────────────────────────────
  if (req.method === 'DELETE') {
    const mandateId = String(req.query.id ?? '');
    if (!mandateId) {
      return res.status(400).json({ ok: false, error: 'Missing mandate id' });
    }

    try {
      const token = await getNombaToken();
      const response = await fetch(`${nombaBaseUrl()}/v1/mandates/${mandateId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'accountId': accountId,
        },
      });
      const result = await response.json();

      if (!response.ok) {
        logNomba('warn', 'mandate.cancel.failed', { mandateId, status: response.status });
        return res.status(response.status).json({ ok: false, error: result.message ?? 'Cancel failed' });
      }

      logNomba('info', 'mandate.cancel.success', { mandateId });
      return res.status(200).json({ ok: true, mandateId, status: 'cancelled' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      logNomba('error', 'mandate.cancel.exception', { mandateId, message });
      return res.status(500).json({ ok: false, error: message });
    }
  }

  return res.status(405).json({ ok: false, error: 'Method not allowed' });
}
