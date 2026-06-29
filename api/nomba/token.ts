/**
 * Nomba OAuth2 Token
 * GET /api/nomba/token   (health check that also verifies credentials)
 *
 * Exchanges Client ID + Private Key for a short-lived access token via the
 * client-credentials grant, caching it for its lifetime. Every other endpoint
 * calls getNombaToken() before talking to Nomba.
 *
 * Docs: https://developer.nomba.com/docs/getting-started/authentication
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { nombaBaseUrl } from './_shared.js';

let cachedToken: string | null = null;
let tokenExpiresAt = 0;

export async function getNombaToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiresAt - 60_000) {
    return cachedToken;
  }

  const clientId = process.env.NOMBA_CLIENT_ID;
  const privateKey = process.env.NOMBA_PRIVATE_KEY;
  const accountId = process.env.NOMBA_ACCOUNT_ID;

  if (!clientId || !privateKey || !accountId) {
    throw new Error('Missing Nomba credentials in environment variables');
  }

  const response = await fetch(`${nombaBaseUrl()}/v1/auth/token/issue`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'accountId': accountId,
    },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: privateKey,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Nomba auth failed: ${response.status} — ${err}`);
  }

  const data = await response.json();
  const token = data.data?.access_token ?? data.access_token;
  const expiresIn = data.data?.expiresAt ?? data.expires_in ?? 1800;

  if (!token) {
    throw new Error('Nomba returned no access token');
  }

  cachedToken = token;
  tokenExpiresAt = Date.now() + (typeof expiresIn === 'number' ? expiresIn : 1800) * 1000;
  return token;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }
  try {
    const token = await getNombaToken();
    return res.status(200).json({
      ok: true,
      token_preview: `${token.slice(0, 8)}...${token.slice(-4)}`,
      expires_at: new Date(tokenExpiresAt).toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Nomba Token Error]', message);
    return res.status(500).json({ ok: false, error: message });
  }
}
