/**
 * Nomba OAuth2 Token
 *
 * Nomba uses client credentials flow. We exchange our Client ID + Private Key
 * for a short-lived access token, then use that token on every subsequent
 * API call. Tokens are cached for their lifetime to avoid hitting the auth
 * endpoint on every request.
 *
 * Docs: https://developer.nomba.com/authentication
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { nombaBaseUrl } from './_shared';

// In-memory token cache (lives for the duration of the serverless function instance)
let cachedToken: string | null = null;
let tokenExpiresAt = 0;

export async function getNombaToken(): Promise<string> {
  // Return cached token if still valid (with 60s buffer)
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

  // Nomba returns access_token + expires_in (seconds)
  cachedToken = data.access_token;
  tokenExpiresAt = Date.now() + (data.expires_in ?? 3600) * 1000;

  if (!cachedToken) {
    throw new Error('Nomba returned no access token');
  }

  return cachedToken;
}

/**
 * Health check — GET /api/nomba/token
 * Lets you verify credentials are wired correctly without triggering a charge.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const token = await getNombaToken();
    // Return masked token so you can confirm it works without exposing it
    return res.status(200).json({
      ok: true,
      token_preview: `${token.slice(0, 8)}...${token.slice(-4)}`,
      expires_at: new Date(tokenExpiresAt).toISOString(),
    });
  } catch (err: any) {
    console.error('[Nomba Token Error]', err.message);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
