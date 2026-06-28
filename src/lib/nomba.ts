/**
 * Nomba API client — frontend side.
 *
 * Every call goes through our Vercel serverless routes (/api/nomba/*), which
 * hold the credentials server-side. The frontend never sees the Client ID or
 * Private Key.
 *
 * All responses are parsed through `safeJson`, which tolerates a non-JSON body
 * (for example a plain-text platform error before credentials are configured)
 * and turns it into a normal `{ ok: false, error }` result instead of throwing.
 * That keeps a backend hiccup from ever crashing the UI.
 */

interface ApiError {
  ok: false;
  error: string;
}

/**
 * Parse a fetch Response defensively. If the body isn't valid JSON we surface
 * the raw text as an error rather than letting JSON.parse throw.
 */
async function safeJson<T>(res: Response): Promise<T | ApiError> {
  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    const snippet = text.trim().slice(0, 120) || `Request failed (${res.status})`;
    return { ok: false, error: snippet };
  }
}

/** Shared POST helper — JSON in, safely-parsed JSON out. */
async function postJson<T>(url: string, body: unknown): Promise<T | ApiError> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return await safeJson<T>(res);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Network error' };
  }
}

async function getJson<T>(url: string): Promise<T | ApiError> {
  try {
    const res = await fetch(url);
    return await safeJson<T>(res);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Network error' };
  }
}

// ── Charge ───────────────────────────────────────────────────────────────────

export interface ChargeResult {
  ok: boolean;
  checkoutUrl?: string;
  orderReference?: string;
  orderId?: string;
  error?: string;
}

export async function chargeRecurring(params: {
  expenseId: string;
  expenseName: string;
  amountNGN: number;
  idempotencyKey: string;
  customerEmail?: string;
}): Promise<ChargeResult> {
  return postJson<ChargeResult>('/api/nomba/charge', params) as Promise<ChargeResult>;
}

// ── Transfer ─────────────────────────────────────────────────────────────────

export interface TransferResult {
  ok: boolean;
  transferId?: string;
  netAmountNGN?: number;
  platformFeeNGN?: number;
  status?: string;
  error?: string;
}

export async function initiateTransfer(params: {
  recipientAccountNumber: string;
  recipientBankCode: string;
  recipientName: string;
  amountNGN: number;
  reference: string;
  narration: string;
  transferType: 'ajo_payout' | 'syndicate_split';
}): Promise<TransferResult> {
  return postJson<TransferResult>('/api/nomba/transfer', params) as Promise<TransferResult>;
}

// ── Webhook polling ──────────────────────────────────────────────────────────

export interface WebhookAction {
  action: 'PAYMENT_SUCCESS' | 'PAYMENT_FAILED' | 'PAYMENT_REVERSED' | 'CARD_EXPIRING';
  expenseId?: string;
  reference?: string;
  reason?: string;
  message?: string;
  amount?: number;
  cardLast4?: string;
}

export async function pollWebhookEvents(): Promise<WebhookAction[]> {
  const data = await getJson<{ ok: boolean; events?: WebhookAction[] }>('/api/nomba/webhook');
  if ('events' in data && Array.isArray(data.events)) return data.events;
  return [];
}

// ── Health ───────────────────────────────────────────────────────────────────

export async function checkHealth(): Promise<{ ready: boolean; env: Record<string, boolean> }> {
  const data = await getJson<{ ready?: boolean; env?: Record<string, boolean> }>('/api/health');
  if ('ready' in data) return { ready: Boolean(data.ready), env: data.env ?? {} };
  return { ready: false, env: {} };
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

export async function createMandate(params: {
  expenseId: string;
  expenseName: string;
  amountNGN: number;
  cadence: 'daily' | 'weekly' | 'monthly';
  mode: 'EXPRESS' | 'PRO';
  customerEmail?: string;
}): Promise<MandateResult> {
  return postJson<MandateResult>('/api/nomba/mandate', params) as Promise<MandateResult>;
}

export async function cancelMandate(mandateId: string): Promise<MandateResult> {
  try {
    const res = await fetch(`/api/nomba/mandate?id=${encodeURIComponent(mandateId)}`, {
      method: 'DELETE',
    });
    return (await safeJson<MandateResult>(res)) as MandateResult;
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

export async function lookupBankAccount(
  accountNumber: string,
  bankCode: string,
): Promise<BankLookupResult> {
  const params = new URLSearchParams({ accountNumber, bankCode });
  return getJson<BankLookupResult>(`/api/nomba/bank-lookup?${params.toString()}`) as Promise<BankLookupResult>;
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

export async function reconcileLedger(
  ledger: { reference: string; amountNGN: number }[],
): Promise<ReconcileResult> {
  return postJson<ReconcileResult>('/api/nomba/reconcile', { ledger }) as Promise<ReconcileResult>;
}
