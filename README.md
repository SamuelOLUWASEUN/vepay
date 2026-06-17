# Vepay

**Unified subscription and recurring expense tracker** — built for the Nomba × DevCareer Hackathon 2026 under the "Checkout, Recurring" focus area.

## What it does

Vepay operates on a single shared state database but presents two completely distinct user experiences based on persona:

### Express Mode
For market traders, artisans, and thrift group members tracking daily spending, rotating ajo/esusu pools, shop rent, levies, and power tokens. Zero-typing interface with icon action grid, voice entry, and a daily spend tracker with keypad input and streak system.

### Pro Mode
For developers and remote workers tracking SaaS subscriptions (Cursor, OpenAI, Vercel), API usage costs, burn rate, and split billing. Dense financial dashboard with USD/NGN toggle, AI optimizer, trial countdown cards, and subscription graveyard.

## Key features

- **Daily Spend Tracker** — keypad-first logger with running daily total, budget bar, 7-day chart, streak tracking, and smart pace alerts
- **Ajo Group Ledger** — timestamped dispute-proof payment trail with PDF export
- **Budget Envelope System** — weekly spend caps per category with live progress bars
- **Recurring Spend Forecast** — "This month will cost you" with inline breakdown
- **Financial Fingerprint** — pattern recognition from real payment behaviour
- **Subscription Graveyard** — cancelled service history with total money spent
- **API Cost Tracker** — variable usage logger for developers
- **DevTools Panel** — fault injection for live demo (insufficient funds, expired card, idempotency retry)
- **Dark / Light mode** — respects OS preference, persisted to localStorage
- **Dual auth flow** — sign up with mode selection, sign in returning users

## Tech stack

- Vite + React + TypeScript
- Tailwind CSS v4
- Lucide React icons
- localStorage persistence (no backend required)

## Running locally

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Deployment

Deploys to Vercel or Netlify with zero configuration — it's a static Vite app.

**Vercel:** Import repo → Framework: Vite → Deploy  
**Netlify:** Import repo → Build command: `npm run build` → Publish directory: `dist`

## Nomba integration points

The codebase includes inline comments referencing Nomba's real API endpoints:
- `// Ingesting payload from Nomba Charge Webhook`
- `// Initializing Nomba Checkout API tokenization flow`
- `// Dispatching via Nomba Sub-Account Transfer endpoint`

---

Built by [@SamuelOLUWASEUN](https://github.com/SamuelOLUWASEUN) · Nomba × DevCareer Hackathon 2026
