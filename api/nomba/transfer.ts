/**
 * Nomba Sub-Account Transfer
 * POST /api/nomba/transfer
 *
 * Moves funds out of the Vepay sub-account to a recipient bank account for Ajo
 * payouts and Syndicate splits. Vepay's 1% platform fee is computed here. The
 * caller should verify the recipient via /api/nomba/bank-lookup first; the
 * reference doubles as the idempotency key.
 *
 * Docs: https://developer.nomba.com/nomba-api-reference/transfers
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getNombaToken } from './token.js';
import { toKobo, logNomba, recallRef, rememberRef, nombaBaseUrl } from './_shared.js';

interface TransferBody {
  recipientAccountNumber: string;
  recipientBankCode: string;
  recipientName: string;
  amountNGN: number;
  reference: string;
  narration: string;
  transferType: 'ajo_payout' | 'syndicate_split';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const {
    recipientAccountNumber,
    recipientBankCode,
    recipientName,
    amountNGN,
    reference,
    narration,
    transferType,
  } = req.body as TransferBody;

  if (!recipientAccountNumber || !recipientBankCode || !amountNGN || !reference) {
    return res.status(400).json({
      ok: false,
      error: 'Missing required fields: recipientAccountNumber, recipientBankCode, amountNGN, reference',
    });
  }

  const accountId = process.env.NOMBA_ACCOUNT_ID;
  const subAccountId = process.env.NOMBA_SUB_ACCOUNT_ID;
  if (!accountId || !subAccountId) {
    return res.status(500).json({ ok: false, error: 'Nomba account configuration missing' });
  }

  const prior = recallRef(`transfer:${reference}`);
  if (prior.seen) {
    logNomba('info', 'transfer.idempotent_hit', { merchantTxRef: reference });
    return res.status(200).json(prior.result);
  }

  const platformFeeNGN = Math.round(amountNGN * 0.01);
  const netAmountNGN = amountNGN - platformFeeNGN;

  try {
    const token = await getNombaToken();

    const payload = {
      amount: toKobo(netAmountNGN),
      currency: 'NGN',
      reference,
      narration: narration || `Vepay ${transferType === 'ajo_payout' ? 'Ajo Payout' : 'Syndicate Split'}`,
      accountNumber: recipientAccountNumber,
      bankCode: recipientBankCode,
      accountName: recipientName,
      senderName: 'Vepay',
    };

    logNomba('info', 'transfer.request', {
      merchantTxRef: reference,
      transferType,
      amountNGN,
      netAmountNGN,
      platformFeeNGN,
    });

    const response = await fetch(`${nombaBaseUrl()}/v1/transfers/bank`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'accountId': accountId,
        'Idempotency-Key': reference,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      logNomba('error', 'transfer.failed', {
        merchantTxRef: reference,
        status: response.status,
        message: result.description ?? result.message,
      });
      return res.status(response.status).json({
        ok: false,
        error: result.description ?? result.message ?? 'Transfer failed',
      });
    }

    const ok = {
      ok: true,
      transferId: result.data?.transferId ?? result.data?.id ?? null,
      reference,
      netAmountNGN,
      platformFeeNGN,
      status: result.data?.status ?? 'processing',
    };

    rememberRef(`transfer:${reference}`, ok);
    logNomba('info', 'transfer.success', { merchantTxRef: reference, transferId: ok.transferId });
    return res.status(200).json(ok);

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logNomba('error', 'transfer.exception', { merchantTxRef: reference, message });
    return res.status(500).json({ ok: false, error: message });
  }
}
