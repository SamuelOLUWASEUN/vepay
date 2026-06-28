/**
 * Health Check
 * GET /api/health
 *
 * Simple endpoint to confirm the Vercel serverless backend is running
 * and environment variables are configured correctly.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const checks = {
    NOMBA_CLIENT_ID: !!process.env.NOMBA_CLIENT_ID,
    NOMBA_PRIVATE_KEY: !!process.env.NOMBA_PRIVATE_KEY,
    NOMBA_ACCOUNT_ID: !!process.env.NOMBA_ACCOUNT_ID,
    NOMBA_SUB_ACCOUNT_ID: !!process.env.NOMBA_SUB_ACCOUNT_ID,
    NOMBA_WEBHOOK_SECRET: !!process.env.NOMBA_WEBHOOK_SECRET,
  };

  const allConfigured = Object.values(checks).every(Boolean);

  return res.status(200).json({
    ok: true,
    service: 'Vepay API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    env: checks,
    ready: allConfigured,
    webhookUrl: 'https://vepay.vercel.app/api/nomba/webhook',
    endpoints: {
      token: 'GET /api/nomba/token',
      charge: 'POST /api/nomba/charge',
      transfer: 'POST /api/nomba/transfer',
      mandate: 'POST|GET|DELETE /api/nomba/mandate',
      bankLookup: 'GET /api/nomba/bank-lookup',
      reconcile: 'POST /api/nomba/reconcile',
      webhook: 'POST|GET /api/nomba/webhook',
    },
    note: allConfigured
      ? 'All environment variables configured. Ready to process Nomba payments.'
      : 'Some environment variables are missing. Add them in Vercel dashboard.',
  });
}
