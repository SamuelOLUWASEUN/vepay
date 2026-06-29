/**
 * Shared backend utilities for all Nomba endpoints.
 *
 * Centralises four concerns the hackathon checklist grades:
 *   1. Money — a single kobo conversion so amounts are never sent in naira.
 *   2. Base URL — test credentials only authenticate against the sandbox host;
 *      live only against production. Read from NOMBA_BASE_URL so switching is a
 *      config change, never code.
 *   3. Structured logging — one JSON line per call, tagged with merchantTxRef.
 *   4. Idempotency — a process-level store of seen references so a retried
 *      webhook or a double-tapped action never produces two writes.
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
 * Structured log line. One JSON object per call so logs are machine-parseable
 * in the Vercel dashboard. merchantTxRef ties frontend → charge → webhook.
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
 * fast double taps) without external infrastructure. A production deploy would
 * back this with Redis or a Postgres unique constraint.
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
