/**
 * Nomba API client — frontend side.
 *
 * Every call goes through our Vercel serverless routes (/api/nomba/*), which
 * hold the credentials server-side. The frontend never sees the Client ID or
 * Private Key.
 *
 * ── Demo-mode fallback ───────────────────────────────────────────────────────
 * While the Nomba sandbox credentials are pending, the backend authenticates
 * but Nomba rejects the call (403). So the UX can still be demonstrated end to
 * end, each call detects that specific "service not ready" condition and
 * returns a clean simulated success instead of surfacing an error. The moment
 * real credentials are in place the live path is taken automatically — no code
 * change. `isDemoFallback` is set on simulated results so the UI can label them
 * honestly ("demo") rather than implying a real charge occurred.
 */

interface ApiError {
  ok: false;
  error: string;
}

/**
 * Heuristic: does this error indicate the payment service simply isn't wired
 * up yet (credentials pending / auth rejected), as opposed to a genuine bad
 * request we should surface? We only fall back to demo mode for the former.
 */
function isServiceNotReady(error: string | undefined): boolean {
  if (!error) return false;
  const e = error.toLowerCase();
  return (
    e.includes('403') ||
    e.includes('forbidden') ||
    e.includes('auth failed') ||
    e.includes('missing nomba') ||
    e.includes('configuration missing') ||
    e.includes('credentials')
  );
}

async function safeJson<T>(res: Response): Promise<T | ApiError> {
  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    const snippet = text.trim().slice(0, 120) || `Request failed (${res.status})`;
    return { ok: false, error: snippet };
  }
}

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
  isDemoFallback?: boolean;
}

export async function chargeRecurring(params: {
  expenseId: string;
  expenseName: string;
  amountNGN: number;
  idempotencyKey: string;
  customerEmail?: string;
}): Promise<ChargeResult> {
  const result = (await postJson<ChargeResult>('/api/nomba/charge', params)) as ChargeResult;
  if (!result.ok && isServiceNotReady(result.error)) {
    return { ok: true, orderReference: params.idempotencyKey, isDemoFallback: true };
  }
  return result;
}

// ── Transfer ─────────────────────────────────────────────────────────────────

export interface TransferResult {
  ok: boolean;
  transferId?: string;
  netAmountNGN?: number;
  platformFeeNGN?: number;
  status?: string;
  error?: string;
  isDemoFallback?: boolean;
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
  const result = (await postJson<TransferResult>('/api/nomba/transfer', params)) as TransferResult;
  if (!result.ok && isServiceNotReady(result.error)) {
    const platformFeeNGN = Math.round(params.amountNGN * 0.01);
    return {
      ok: true,
      reference: params.reference,
      netAmountNGN: params.amountNGN - platformFeeNGN,
      platformFeeNGN,
      status: 'demo',
      isDemoFallback: true,
    } as TransferResult;
  }
  return result;
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
  isDemoFallback?: boolean;
}

export async function createMandate(params: {
  expenseId: string;
  expenseName: string;
  amountNGN: number;
  cadence: 'daily' | 'weekly' | 'monthly';
  mode: 'EXPRESS' | 'PRO';
  customerEmail?: string;
}): Promise<MandateResult> {
  const result = (await postJson<MandateResult>('/api/nomba/mandate', params)) as MandateResult;
  if (!result.ok && isServiceNotReady(result.error)) {
    return {
      ok: true,
      mandateId: `demo_${params.expenseId}_${Date.now().toString(36)}`,
      status: 'active',
      authorizationUrl: null,
      cadence: params.cadence,
      isDemoFallback: true,
    };
  }
  return result;
}

export async function cancelMandate(mandateId: string): Promise<MandateResult> {
  // Demo mandates never reached Nomba, so cancel them locally without a call.
  if (mandateId.startsWith('demo_')) {
    return { ok: true, mandateId, status: 'cancelled', isDemoFallback: true };
  }
  try {
    const res = await fetch(`/api/nomba/mandate?id=${encodeURIComponent(mandateId)}`, {
      method: 'DELETE',
    });
    const result = (await safeJson<MandateResult>(res)) as MandateResult;
    if (!result.ok && isServiceNotReady(result.error)) {
      return { ok: true, mandateId, status: 'cancelled', isDemoFallback: true };
    }
    return result;
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
