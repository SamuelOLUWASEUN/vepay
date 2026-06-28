/**
 * Nomba Charge (Checkout API)
 * POST /api/nomba/charge
 *
 * Initiates a one-off charge for a recurring item — used when a user taps
 * "Pay now" to recover a failed payment, or to take the first payment before a
 * mandate is authorized. The Idempotency-Key (merchantTxRef) means a retried
 * request from a flaky network is processed exactly once.
 *
 * Amounts arrive in naira and are converted to kobo here, never before.
 *
 * Docs: https://developer.nomba.com/checkout
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getNombaToken } from './token';
import { toKobo, logNomba, recallRef, rememberRef } from './_shared';

interface ChargeBody {
  expenseId: string;
  expenseName: string;
  amountNGN: number;
  idempotencyKey: string;
  customerEmail?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const { expenseId, expenseName, amountNGN, idempotencyKey, customerEmail } = req.body as ChargeBody;

  if (!expenseId || !amountNGN || !idempotencyKey) {
    return res.status(400).json({
      ok: false,
      error: 'Missing required fields: expenseId, amountNGN, idempotencyKey',
    });
  }

  const accountId = process.env.NOMBA_ACCOUNT_ID;
  const subAccountId = process.env.NOMBA_SUB_ACCOUNT_ID;
  if (!accountId || !subAccountId) {
    return res.status(500).json({ ok: false, error: 'Nomba account configuration missing' });
  }

  // Idempotency: replay the original result for a key we've already charged.
  const prior = recallRef(`charge:${idempotencyKey}`);
  if (prior.seen) {
    logNomba('info', 'charge.idempotent_hit', { merchantTxRef: idempotencyKey, expenseId });
    return res.status(200).json(prior.result);
  }

  try {
    const token = await getNombaToken();

    const payload = {
      orderReference: idempotencyKey,
      customerId: customerEmail ?? 'vepay-user',
      callbackUrl: 'https://vepay.vercel.app/api/nomba/webhook',
      customer: { email: customerEmail ?? 'user@vepay.app', name: 'Vepay User' },
      order: {
        amount: toKobo(amountNGN),
        currency: 'NGN',
        description: `Vepay recurring: ${expenseName}`,
        reference: idempotencyKey,
      },
      metaData: { expenseId, expenseName, source: 'vepay_recurring', subAccountId },
    };

    logNomba('info', 'charge.request', { merchantTxRef: idempotencyKey, expenseId, amountNGN });

    const response = await fetch('https://api.nomba.com/v1/checkout/order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'accountId': accountId,
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      logNomba('error', 'charge.failed', {
        merchantTxRef: idempotencyKey,
        status: response.status,
        nombaCode: result.code,
        message: result.message,
      });
      return res.status(response.status).json({
        ok: false,
        error: result.message ?? 'Charge failed',
        nomba_code: result.code,
      });
    }

    const ok = {
      ok: true,
      checkoutUrl: result.data?.checkoutLink ?? result.checkoutLink ?? null,
      orderReference: idempotencyKey,
      orderId: result.data?.orderId ?? result.orderId ?? null,
    };

    rememberRef(`charge:${idempotencyKey}`, ok);
    logNomba('info', 'charge.success', { merchantTxRef: idempotencyKey, orderId: ok.orderId });
    return res.status(200).json(ok);

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logNomba('error', 'charge.exception', { merchantTxRef: idempotencyKey, message });
    return res.status(500).json({ ok: false, error: message });
  }
}
