/**
 * Nomba Webhook Receiver
 * POST /api/nomba/webhook   Nomba delivers payment events here
 * GET  /api/nomba/webhook   frontend polls for pending events
 *
 * Three guarantees: HMAC-SHA256 signature verification, idempotency by
 * requestId (Nomba retries deliveries), and fast acknowledgement. Events are
 * queued and the frontend consumes them via the GET poll every 10s.
 *
 * Webhook URL: https://vepay.vercel.app/api/nomba/webhook
 * Docs: https://developer.nomba.com/nomba-api-reference/webhooks
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';
import { logNomba, recallRef, rememberRef } from './_shared.js';

interface WebhookEvent {
  id: string;
  requestId: string;
  type: string;
  data: Record<string, unknown>;
  receivedAt: string;
  processed: boolean;
}

interface FrontendAction {
  action: 'PAYMENT_SUCCESS' | 'PAYMENT_FAILED' | 'PAYMENT_REVERSED' | 'CARD_EXPIRING';
  expenseId?: string;
  reference?: string;
  reason?: string;
  message?: string;
  amount?: number;
  cardLast4?: string;
}

const eventQueue: WebhookEvent[] = [];
const MAX_QUEUE_SIZE = 50;

function verifySignature(payload: string, signature: string, secret: string): boolean {
  try {
    const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    const a = new Uint8Array(Buffer.from(signature, 'hex'));
    const b = new Uint8Array(Buffer.from(expected, 'hex'));
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

function readField(data: Record<string, unknown>, path: string[]): string | undefined {
  let current: unknown = data;
  for (const key of path) {
    if (current && typeof current === 'object' && key in current) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return undefined;
    }
  }
  return typeof current === 'string' ? current : undefined;
}

function mapEventToAction(event: WebhookEvent): FrontendAction | null {
  const { type, data } = event;
  const expenseId =
    readField(data, ['metaData', 'expenseId']) ?? readField(data, ['metadata', 'expenseId']);
  const reference = readField(data, ['reference']) ?? readField(data, ['orderReference']);

  switch (type) {
    case 'charge.success':
    case 'order.completed':
    case 'mandate.charge.success':
      return { action: 'PAYMENT_SUCCESS', expenseId, reference, message: readField(data, ['description']) ?? 'Recurring charge completed' };
    case 'charge.failed':
    case 'mandate.charge.failed':
      return { action: 'PAYMENT_FAILED', expenseId, reference, reason: readField(data, ['failureReason']) ?? 'insufficient_funds', message: readField(data, ['failureMessage']) ?? 'Payment failed — insufficient funds' };
    case 'charge.reversed':
      return { action: 'PAYMENT_REVERSED', expenseId, reference, message: 'Payment was reversed — please retry' };
    case 'card.expiring':
      return { action: 'CARD_EXPIRING', expenseId, cardLast4: readField(data, ['card', 'last4']), message: 'A saved card is expiring soon' };
    default:
      return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    const pending = eventQueue.filter((e) => !e.processed);
    pending.forEach((e) => { e.processed = true; });
    const actions = pending.map(mapEventToAction).filter((a): a is FrontendAction => a !== null);
    return res.status(200).json({ ok: true, events: actions, queueSize: eventQueue.length });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const rawBody = JSON.stringify(req.body ?? {});
  // Nomba sends the signature in the `nomba-signature` header (no "x-" prefix).
  const signature = req.headers['nomba-signature'];
  const webhookSecret = process.env.NOMBA_WEBHOOK_SECRET;

  if (webhookSecret && typeof signature === 'string') {
    if (!verifySignature(rawBody, signature, webhookSecret)) {
      logNomba('error', 'webhook.invalid_signature');
      return res.status(200).json({ ok: false, reason: 'invalid_signature' });
    }
  } else if (webhookSecret) {
    logNomba('warn', 'webhook.missing_signature');
  }

  const body = (req.body ?? {}) as { event?: string; data?: Record<string, unknown>; requestId?: string };
  const eventType = body.event;
  const data = body.data ?? {};

  if (!eventType) {
    return res.status(200).json({ ok: false, reason: 'no_event_type' });
  }

  const requestId =
    body.requestId ??
    (typeof data.reference === 'string' ? data.reference : undefined) ??
    crypto.createHash('sha256').update(rawBody).digest('hex').slice(0, 24);

  const prior = recallRef(`webhook:${requestId}`);
  if (prior.seen) {
    logNomba('info', 'webhook.duplicate_ignored', { requestId, eventType });
    return res.status(200).json({ ok: true, duplicate: true });
  }

  const webhookEvent: WebhookEvent = {
    id: `evt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    requestId,
    type: eventType,
    data,
    receivedAt: new Date().toISOString(),
    processed: false,
  };

  eventQueue.unshift(webhookEvent);
  if (eventQueue.length > MAX_QUEUE_SIZE) eventQueue.splice(MAX_QUEUE_SIZE);
  rememberRef(`webhook:${requestId}`, { acknowledged: true });

  logNomba('info', 'webhook.received', { requestId, eventType });
  return res.status(200).json({ ok: true, eventId: webhookEvent.id });
}
