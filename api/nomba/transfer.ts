/**
 * Nomba Sub-Account Transfer
 * POST /api/nomba/transfer
 *
 * Moves funds out of the Vepay sub-account to a recipient bank account. Two
 * flows use it:
 *   - ajo_payout      : pay the pot to the member whose turn it is
 *   - syndicate_split : route a collected split share
 *
 * Vepay's 1% platform fee is computed and retained here. The caller is
 * expected to have verified the recipient via /api/nomba/bank-lookup first;
 * the reference doubles as the idempotency key so a retry can't double-pay.
 *
 * Docs: https://developer.nomba.com/transfers
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getNombaToken } from './token';
import { toKobo, logNomba, recallRef, rememberRef } from './_shared';

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

  // Idempotency: replay the original result for a reference already sent.
  const prior = recallRef(`transfer:${reference}`);
  if (prior.seen) {
    logNomba('info', 'transfer.idempotent_hit', { merchantTxRef: reference });
    return res.status(200).json(prior.result);
  }

  // 1% platform fee accrues to the Vepay sub-account; recipient gets the rest.
  const platformFeeNGN = Math.round(amountNGN * 0.01);
  const netAmountNGN = amountNGN - platformFeeNGN;

  try {
    const token = await getNombaToken();

    const payload = {
      amount: toKobo(netAmountNGN),
      currency: 'NGN',
      reference,
      narration: narration || `Vepay ${transferType === 'ajo_payout' ? 'Ajo Payout' : 'Syndicate Split'}`,
      destinationAccount: {
        accountNumber: recipientAccountNumber,
        bankCode: recipientBankCode,
        accountName: recipientName,
      },
      sourceAccountId: subAccountId,
      metaData: { transferType, platformFeeNGN, originalAmountNGN: amountNGN, source: 'vepay' },
    };

    logNomba('info', 'transfer.request', {
      merchantTxRef: reference,
      transferType,
      amountNGN,
      netAmountNGN,
      platformFeeNGN,
    });

    const response = await fetch('https://api.nomba.com/v1/transfers/bank', {
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
        nombaCode: result.code,
        message: result.message,
      });
      return res.status(response.status).json({
        ok: false,
        error: result.message ?? 'Transfer failed',
        nomba_code: result.code,
      });
    }

    const ok = {
      ok: true,
      transferId: result.data?.transferId ?? result.transferId ?? null,
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
