/**
 * Shared backend utilities for all Nomba endpoints.
 *
 * Centralises the cross-cutting concerns the endpoints all need: money
 * conversion, the base URL (which differs between sandbox and production),
 * structured logging, and a small idempotency store.
 */

/** Smallest-unit conversion. Nomba expects integer kobo, never naira floats. */
export function toKobo(naira: number): number {
  return Math.round(naira * 100);
}

/** Inverse, for display when reading Nomba responses back. */
export function fromKobo(kobo: number): number {
  return kobo / 100;
}

/**
 * Base URL for the Nomba API. Defaults to sandbox because that's what the
 * hackathon test credentials authenticate against. Set NOMBA_BASE_URL to
 * https://api.nomba.com to go live.
 */
export function nombaBaseUrl(): string {
  return process.env.NOMBA_BASE_URL ?? 'https://sandbox.nomba.com';
}

/**
 * Checkout path differs by environment. Sandbox serves checkout under
 * /sandbox/checkout/, production under /v1/checkout/. Deriving it from the
 * base URL keeps the two from drifting apart — change the environment and the
 * path follows.
 */
export function checkoutPath(suffix: string): string {
  const isSandbox = nombaBaseUrl().includes('sandbox');
  const prefix = isSandbox ? '/sandbox/checkout' : '/v1/checkout';
  return `${nombaBaseUrl()}${prefix}/${suffix}`;
}

/**
 * Structured log line. One JSON object per call so logs are grep-able in the
 * Vercel dashboard by merchantTxRef across the whole request lifecycle.
 */
export function logNomba(
  level: 'info' | 'warn' | 'error',
  event: string,
  fields: Record<string, unknown> = {},
): void {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    service: 'vepay-nomba',
    event,
    ...fields,
  });
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}

/**
 * Process-level idempotency store. Serverless instances are reused across
 * invocations, so this catches the common duplicate cases (webhook retries,
 * double taps) without external infrastructure. Production would back this
 * with Redis or a unique DB constraint.
 */
const seenRefs = new Map<string, { at: number; result: unknown }>();
const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000;

export function rememberRef(ref: string, result: unknown): void {
  seenRefs.set(ref, { at: Date.now(), result });
  if (seenRefs.size > 500) {
    const cutoff = Date.now() - IDEMPOTENCY_TTL_MS;
    for (const [key, value] of seenRefs) {
      if (value.at < cutoff) seenRefs.delete(key);
    }
  }
}

export function recallRef(ref: string): { seen: boolean; result: unknown } {
  const hit = seenRefs.get(ref);
  if (!hit) return { seen: false, result: null };
  if (Date.now() - hit.at > IDEMPOTENCY_TTL_MS) {
    seenRefs.delete(ref);
    return { seen: false, result: null };
  }
  return { seen: true, result: hit.result };
}

/** Generate a merchant transaction reference unique to this app + attempt. */
export function makeMerchantTxRef(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 10);
  return `vepay_${prefix}_${Date.now().toString(36)}_${rand}`;
}
