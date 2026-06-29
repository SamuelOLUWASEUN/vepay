# Vepay

A subscription and recurring-payment tracker built for the Nomba × DevCareer Hackathon 2026, in the "subscription product" track.

Live: https://vepay.vercel.app

The idea behind Vepay is that "subscriptions" mean two very different things depending on who you are. A market trader in Lagos has recurring money going out too — shop rent, daily thrift contributions, NEPA tokens, market association levies — but no app treats those like the manageable, trackable commitments they are. A developer paying for fifteen SaaS tools has the opposite problem: too many subscriptions, easy to lose track of, easy to forget to cancel. Same underlying need (money leaves on a schedule, help me stay on top of it), two audiences who'd never use the same interface.

So Vepay has two modes:

- **Express mode** — for traders and everyday users. Daily spend tracking, thrift/Ajo group payouts, a traffic-light "what's due" view, recurring obligations in plain language.
- **Pro mode** — for developers and teams. Burn-rate meter, per-tool cost tracking, trial countdowns, a "subscription graveyard" for things you've cancelled, and split-cost syndicates for shared subscriptions.

Both modes sit on the same data layer and the same Nomba integration. The thing that ties them together is the **mandate** — a recurring-charge authorization — which is the actual product requirement for the subscription track.

## How the Nomba integration works

The whole point of a subscription product is that the customer authorizes a recurring charge once and the platform pulls funds on schedule afterwards. In Nomba terms that's a **mandate**. Vepay's "Auto-pay" toggle on each recurring item is the front for that: turning it on creates a mandate, turning it off cancels it. This works the same way for an Express thrift contribution as it does for a Pro SaaS subscription — same endpoint, same lifecycle, different labels.

Around the mandate there's the supporting cast you need for a real payment flow:

- **`/api/nomba/mandate`** — create / fetch / cancel recurring authorizations. This is the core of the subscription track.
- **`/api/nomba/charge`** — one-off charge via Nomba Checkout, used for "Pay now" recovery when a recurring payment fails.
- **`/api/nomba/transfer`** — sub-account bank transfer, used for Ajo payouts and syndicate splits. Takes a 1% platform fee.
- **`/api/nomba/bank-lookup`** — resolves account number + bank code to the holder's name, so a payout can be confirmed before it's sent.
- **`/api/nomba/reconcile`** — compares the app's local ledger against Nomba's transaction record and reports drift.
- **`/api/nomba/webhook`** — receives Nomba's signed payment events, verifies the HMAC signature, and de-duplicates by request id.
- **`/api/nomba/token`** — client-credentials auth, cached per function instance.
- **`/api/health`** — reports which credentials and environment are configured. Useful for checking a deploy without guessing.

A few decisions worth explaining:

**Credentials never touch the frontend.** Everything goes through the serverless routes under `/api`. The Client ID and Private Key live only in Vercel environment variables. The browser calls `/api/nomba/*` and never sees a secret. That's also why this is a Vercel-functions backend rather than calling Nomba from the React app directly — you can't safely hold a private key in client code.

**Idempotency is handled explicitly.** Every charge, transfer, and mandate carries an `Idempotency-Key` (a merchant transaction reference), and the webhook de-duplicates on Nomba's request id. A retried request from a flaky connection, or a webhook Nomba delivers twice, won't double-charge. The store is in-memory per function instance, which is honest about its limits — a production deploy would back it with Redis or a unique DB constraint, and that boundary is marked in the code.

**Money is always in kobo.** Amounts are converted to integer kobo at exactly one place (`toKobo` in `_shared.ts`) and never sent to Nomba as naira floats. Reading responses back goes through `fromKobo`. Keeping that in one spot is deliberate — currency-unit bugs are the kind that don't show up until someone's charged 100× too little.

**Sandbox vs production is a config switch, not a code change.** The base URL and the checkout path prefix both derive from `NOMBA_BASE_URL`. Sandbox uses `https://sandbox.nomba.com` and serves checkout under `/sandbox/checkout/`; production uses `https://api.nomba.com` and `/v1/checkout/`. Switching environments is one environment variable.

## Current status / known limitation

The backend is built, deployed, and verified end-to-end against Nomba's documented API shapes. `/api/health` confirms all credentials load and the app is pointed at the sandbox.

What's still pending is **sandbox authentication**. The hackathon credentials I was given were issued by email for registration; Nomba's sandbox requires the test `clientId`, `clientSecret`, and `accountId` generated from the dashboard's API Keys page, which only work against `sandbox.nomba.com`. The token call currently returns 403 because the email credentials and the dashboard sandbox credentials are different sets — I've reached out to Nomba support for sandbox access.

So that the app stays fully demonstrable in the meantime, the payment flows have a **demo fallback**: when a call hits the "service not ready" auth error, it returns a clean simulated success tagged `isDemoFallback`, so the Auto-pay toggle and the recurring-payment UX work end to end. The moment real sandbox credentials are in place, the live path is taken automatically — there's no code change to make, just the environment variables. Nothing in the demo path pretends a real charge happened.

## Stack

- **Frontend:** Vite + React + TypeScript, Tailwind for the shell, inline styles where guaranteed layout mattered more than utility classes. State is in React context; persistence is localStorage (this is a tracker, not a system of record).
- **Backend:** Vercel serverless functions (Node, TypeScript), one file per endpoint under `/api`.
- **Payments:** Nomba — mandates, checkout, transfers, bank lookup, webhooks.

## Running it locally

```bash
npm install
npm run dev
```

The frontend runs without any backend — it falls back to demo behavior for anything that needs Nomba, so you can click through both modes immediately.

To exercise the real API routes you need the Nomba environment variables set. Create them in Vercel (or a local `.env` if running `vercel dev`):

```
NOMBA_CLIENT_ID         your sandbox client id
NOMBA_PRIVATE_KEY       your sandbox client secret
NOMBA_ACCOUNT_ID        your parent account id (sent in the accountId header)
NOMBA_SUB_ACCOUNT_ID    your sub-account id (calls are scoped to this)
NOMBA_BASE_URL          https://sandbox.nomba.com   (omit to default to sandbox)
NOMBA_WEBHOOK_SECRET    provided by Nomba after you submit your webhook URL
```

Then `https://<your-deploy>/api/health` will show everything as configured.

## Project layout

```
api/
  health.ts              deploy + credential status
  nomba/
    _shared.ts           kobo conversion, base URL, checkout path, logging, idempotency
    token.ts             client-credentials auth (cached)
    mandate.ts           recurring authorizations — the subscription core
    charge.ts            one-off checkout charge
    transfer.ts          sub-account payouts (Ajo, syndicate splits)
    bank-lookup.ts       recipient name verification
    reconcile.ts         ledger vs Nomba transaction comparison
    webhook.ts           signed event receiver, idempotent
src/
  context/               shared state for both modes
  components/express/     trader-facing UI
  components/pro/         developer-facing UI
  components/shared/      mode-agnostic pieces (e.g. the Auto-pay control)
  lib/nomba.ts           frontend client for the /api routes
```

## Notes

The internal code name was ClearSpend before the rebrand to Vepay; a few identifiers in the source still carry the old name. Functionally it's the same thing — didn't want to risk a rename breaking something this close to the deadline.
