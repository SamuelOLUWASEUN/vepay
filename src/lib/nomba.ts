/**
 * Nomba API client — frontend side
 *
 * All calls go through our Vercel serverless API routes (/api/nomba/*)
 * which hold the credentials server-side. The frontend never touches
 * Nomba directly and never sees the Client ID or Private Key.
 */

export interface ChargeResult {
  ok: boolean;
  checkoutUrl?: string;
  orderReference?: string;
  orderId?: string;
  error?: string;
}

export interface TransferResult {
  ok: boolean;
  transferId?: string;
  netAmountNGN?: number;
  platformFeeNGN?: number;
  status?: string;
  error?: string;
}

export interface WebhookAction {
  action: 'PAYMENT_SUCCESS' | 'PAYMENT_FAILED' | 'PAYMENT_REVERSED' | 'CARD_EXPIRING';
  expenseId?: string;
  reference?: string;
  reason?: string;
  message?: string;
  amount?: number;
  cardLast4?: string;
}

/**
 * Initiate a charge for a recurring payment.
 * Called when user taps "Pay now" on a failed expense.
 */
export async function chargeRecurring(params: {
  expenseId: string;
  expenseName: string;
  amountNGN: number;
  idempotencyKey: string;
  customerEmail?: string;
}): Promise<ChargeResult> {
  try {
    const res = await fetch('/api/nomba/charge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    return data;
  } catch (err: any) {
    return { ok: false, error: err.message };
  }
}

/**
 * Initiate a transfer (Ajo payout or Syndicate split).
 */
export async function initiateTransfer(params: {
  recipientAccountNumber: string;
  recipientBankCode: string;
  recipientName: string;
  amountNGN: number;
  reference: string;
  narration: string;
  transferType: 'ajo_payout' | 'syndicate_split';
}): Promise<TransferResult> {
  try {
    const res = await fetch('/api/nomba/transfer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    return data;
  } catch (err: any) {
    return { ok: false, error: err.message };
  }
}

/**
 * Poll for pending webhook events.
 * The frontend calls this every 10 seconds to pick up real-time
 * payment status updates that Nomba sent to our webhook endpoint.
 */
export async function pollWebhookEvents(): Promise<WebhookAction[]> {
  try {
    const res = await fetch('/api/nomba/webhook');
    if (!res.ok) return [];
    const data = await res.json();
    return data.events ?? [];
  } catch {
    return [];
  }
}

/**
 * Check if the backend is healthy and credentials are configured.
 */
export async function checkHealth(): Promise<{ ready: boolean; env: Record<string, boolean> }> {
  try {
    const res = await fetch('/api/health');
    const data = await res.json();
    return { ready: data.ready, env: data.env };
  } catch {
    return { ready: false, env: {} };
  }
}

// ── Mandates ─────────────────────────────────────────────────────────────────

export interface MandateResult {
  ok: boolean;
  mandateId?: string;
  status?: string;
  authorizationUrl?: string | null;
  cadence?: 'daily' | 'weekly' | 'monthly';
  error?: string;
}

/**
 * Create a recurring-charge mandate for an expense. This is what turns a
 * manual recurring item into an auto-charged subscription. Works for both
 * Express obligations and Pro subscriptions.
 */
export async function createMandate(params: {
  expenseId: string;
  expenseName: string;
  amountNGN: number;
  cadence: 'daily' | 'weekly' | 'monthly';
  mode: 'EXPRESS' | 'PRO';
  customerEmail?: string;
}): Promise<MandateResult> {
  try {
    const res = await fetch('/api/nomba/mandate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return await res.json();
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Network error' };
  }
}

export async function cancelMandate(mandateId: string): Promise<MandateResult> {
  try {
    const res = await fetch(`/api/nomba/mandate?id=${encodeURIComponent(mandateId)}`, {
      method: 'DELETE',
    });
    return await res.json();
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Network error' };
  }
}

// ── Bank lookup ──────────────────────────────────────────────────────────────

export interface BankLookupResult {
  ok: boolean;
  accountName?: string | null;
  error?: string;
}

/**
 * Resolve an account number + bank code to the holder's name. Call this and
 * show the returned name for confirmation before any Ajo payout transfer.
 */
export async function lookupBankAccount(
  accountNumber: string,
  bankCode: string,
): Promise<BankLookupResult> {
  try {
    const params = new URLSearchParams({ accountNumber, bankCode });
    const res = await fetch(`/api/nomba/bank-lookup?${params.toString()}`);
    return await res.json();
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Network error' };
  }
}

// ── Reconciliation ───────────────────────────────────────────────────────────

export interface ReconcileResult {
  ok: boolean;
  inSync?: boolean;
  checkedAt?: string;
  summary?: { ledgerCount: number; nombaCount: number };
  mismatches?: {
    missingInNomba: { reference: string; amountNGN: number }[];
    missingInLedger: { reference: string; amountNGN: number }[];
    amountMismatch: { reference: string; ledgerNGN: number; nombaNGN: number }[];
  };
  error?: string;
}

/**
 * Compare the local ledger against Nomba's transaction record and report drift.
 */
export async function reconcileLedger(
  ledger: { reference: string; amountNGN: number }[],
): Promise<ReconcileResult> {
  try {
    const res = await fetch('/api/nomba/reconcile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ledger }),
    });
    return await res.json();
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Network error' };
  }
}
