# StockDashboard

Personal stock dashboard tracking NASDAQ (US) and SET (Thailand) markets with portfolio P&L.

## Tech Stack
- **Frontend**: React 18 + Vite (port 5173), Tailwind CSS, Recharts, Zustand, React Router v6
- **Backend**: Node.js + Express (port 3001)
- **Database**: SQLite via better-sqlite3 at `server/data/stockdashboard.db`

## Running the Project
```
npm install           # install root deps (concurrently)
npm run install:all   # install client + server deps
npm run dev           # start both client (:5173) and server (:3001)
npm run dev:client    # frontend only
npm run dev:server    # backend only
```

## Environment Setup
Copy `.env.example` — fill `server/.env` and `client/.env` with your API keys. Never commit `.env` files.

## External APIs
- **Finnhub** — NASDAQ real-time prices. WebSocket opened from browser (`useFinnhubSocket.js`), REST proxied through server (`/api/market/*`). Keys: `FINNHUB_API_KEY` (server) and `VITE_FINNHUB_API_KEY` (client).
- **Settrade Open API** — SET portfolio auto-sync from Finansia broker account. OAuth 2.0 Authorization Code flow. Register app at developer.settrade.com; set redirect URI to `http://localhost:3001/auth/settrade/callback`. Start flow at `GET /auth/settrade`.

## Portfolio Tracking
- **SET** — auto-synced from Finansia via Settrade Open API. Click "Sync Now" on Set Portfolio page or trigger `POST /api/set/sync`.
- **NASDAQ** — manual entry only (user trades via Dime app which has no public API). Use Trade Entry page to log buys/sells.

## Key Directories
```
client/src/
  hooks/        useFinnhubSocket.js (WS), useQuote.js (REST polling), useSETPortfolio.js
  store/        useSocketStore.js (live prices), usePortfolioStore.js (NASDAQ trades + P&L)
  pages/        one file per route
  components/   layout/, dashboard/, stocks/, portfolio/, common/
  api/          backend.js (axios→Express), finnhub.js (REST helpers)

server/
  db/           database.js (singleton), migrations/
  routes/       auth.js, set.js, nasdaq.js, market.js
  services/     settradeService.js, finnhubService.js
  utils/        tokenStore.js, logger.js
  middleware/   errorHandler.js, rateLimiter.js
```

## Database Schema (6 tables)
`nasdaq_trades`, `set_holdings`, `set_trades`, `oauth_tokens`, `watched_symbols`, `index_cache`
See `server/db/migrations/001_initial.js` for full schema.

## Architecture Notes
- Finnhub WebSocket lives in the browser (persistent connection) — Zustand `useSocketStore` distributes live prices to components without prop drilling.
- Finnhub REST is proxied through the backend to hide the API key and apply `p-throttle` (60 req/min).
- SET holdings are cached in SQLite so the app works offline after a sync.
- Settrade OAuth tokens auto-refresh 5 min before expiry in `settradeService.js`.
