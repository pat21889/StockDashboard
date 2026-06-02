# StockDashboard

A personal stock dashboard for tracking NASDAQ (US) and SET (Thailand) portfolios with real-time prices, P&L, and allocation breakdown.

![Stack](https://img.shields.io/badge/React_18-Vite-blue) ![Stack](https://img.shields.io/badge/Node.js-Express-green) ![Stack](https://img.shields.io/badge/SQLite-better--sqlite3-orange)

---

## Features

- **Dashboard** — live index cards (NASDAQ, S&P 500, Dow Jones), interactive price chart, watchlist, stock search, and portfolio sidebar with allocation pie chart and USD/THB toggle
- **NASDAQ Portfolio** — manual trade entry, per-position P&L, average cost tracking, live prices via Finnhub WebSocket with REST fallback
- **SET Portfolio** — manual trade entry (THB), live Thai stock prices via Yahoo Finance (`.BK` suffix), P&L in THB
- **Live prices** — Finnhub WebSocket streams real-time NASDAQ ticks; prices are applied only if received within 5 minutes (market open), Yahoo Finance REST serves as fallback for after-hours and SET
- **Multi-currency** — toggle portfolio values between USD and THB with live exchange rate (open.er-api.com)
- **Settrade sync** — optional OAuth 2.0 connection to Finansia broker for automatic SET holdings import

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Recharts, Zustand, React Router v6 |
| Backend | Node.js, Express |
| Database | SQLite via `better-sqlite3` |
| US prices | Finnhub WebSocket (real-time) + Yahoo Finance REST (off-hours fallback) |
| TH prices | Yahoo Finance REST (`.BK` suffix) |
| SET sync | Settrade Open API (OAuth 2.0, Finansia broker) |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A free [Finnhub](https://finnhub.io) account (API key)
- *(Optional)* A [Settrade developer](https://developer.settrade.com) app for SET auto-sync

### Installation

```bash
# 1. Install all dependencies
npm install
npm run install:all

# 2. Set up environment variables
cp .env.example server/.env
cp .env.example client/.env
# Edit both files and fill in your API keys (see Environment Variables below)

# 3. Start both client and server
npm run dev
```

Frontend runs at `http://localhost:5173`, backend at `http://localhost:3001`.

---

## Environment Variables

**`server/.env`**

| Variable | Description |
|---|---|
| `PORT` | Server port (default `3001`) |
| `FINNHUB_API_KEY` | Finnhub REST API key (proxied to hide from browser) |
| `SETTRADE_CLIENT_ID` | Settrade app client ID (optional, for SET auto-sync) |
| `SETTRADE_CLIENT_SECRET` | Settrade app client secret (optional) |
| `SETTRADE_REDIRECT_URI` | OAuth callback URL (default `http://localhost:3001/auth/settrade/callback`) |

**`client/.env`**

| Variable | Description |
|---|---|
| `VITE_FINNHUB_API_KEY` | Finnhub key used directly by the browser WebSocket |
| `VITE_API_BASE_URL` | Backend base URL (default `http://localhost:3001`) |

---

## Available Scripts

```bash
npm run dev            # Start client + server concurrently
npm run dev:client     # Frontend only (port 5173)
npm run dev:server     # Backend only (port 3001)
npm run install:all    # Install client and server dependencies
```

---

## Project Structure

```
StockDashboard/
├── client/
│   └── src/
│       ├── api/             # backend.js (axios instance), finnhub.js (REST helpers)
│       ├── components/
│       │   ├── common/      # LoadingSpinner, MarketBadge, Badge, ErrorBoundary
│       │   ├── dashboard/   # IndexCard, MainChartPanel, FavoritesPanel, SearchPanel, PortfolioSidebar
│       │   ├── layout/      # Sidebar, TopBar
│       │   ├── portfolio/   # TradeForm, PortfolioTable, PLSummary
│       │   └── stocks/      # StockChart, PriceChangeTag
│       ├── hooks/
│       │   ├── useFinnhubSocket.js   # Finnhub WebSocket (module-level singleton)
│       │   ├── useMergedPrices.js    # Merges WS + REST prices (shared by 2 consumers)
│       │   ├── useSETPortfolio.js    # SET trades, prices, and memoized positions
│       │   ├── useQuote.js           # Index polling hook
│       │   └── useExchangeRate.js    # USD/THB rate
│       ├── pages/           # DashboardPage, NasdaqPortfolioPage, SetPortfolioPage, etc.
│       ├── store/
│       │   ├── useSocketStore.js     # Live WS price bus (Zustand)
│       │   └── usePortfolioStore.js  # NASDAQ trades + REST quote cache
│       └── utils/
│           └── calculatePositions.js # Shared P&L aggregation (used by both markets)
│
└── server/
    ├── db/
    │   ├── database.js      # SQLite singleton
    │   └── migrations/      # Schema — runs automatically on startup
    ├── middleware/
    │   ├── validateTrade.js # Shared trade input validation (used by nasdaq + set routes)
    │   ├── errorHandler.js
    │   └── rateLimiter.js
    ├── routes/              # auth.js, market.js, nasdaq.js, set.js
    ├── services/            # finnhubService, yahooService, settradeService
    └── utils/               # tokenStore.js, logger.js
```

---

## Database Schema

Six tables managed by auto-running migrations on startup:

| Table | Purpose |
|---|---|
| `nasdaq_trades` | Manual NASDAQ buy/sell trade log |
| `set_manual_trades` | Manually entered SET trades |
| `set_holdings` | SET portfolio snapshot synced from Finansia |
| `set_trades` | SET trade history synced from Finansia |
| `oauth_tokens` | Settrade OAuth access + refresh tokens |
| `watched_symbols` | Watchlist / favorites |
| `index_cache` | Cached index quotes (60-second TTL) |

---

## Architecture Notes

**Price flow (NASDAQ)**
- Finnhub WebSocket opens directly in the browser (one shared connection via `useFinnhubSocket`).
- Price ticks land in `useSocketStore` (Zustand), distributing to all components without prop drilling.
- `useMergedPrices` hook filters WS ticks to those received within the last 5 minutes (market-open guard), then overlays them on REST prices from Yahoo Finance. Components consume this merged result — real-time during market hours, REST closing prices after hours.

**Price flow (SET)**
- No free real-time WebSocket exists for Thai SET market data. Yahoo Finance REST (`.BK` suffix) is polled on page load and after each trade mutation. Prices update to ~15–30 second resolution, which matches Yahoo's own refresh rate — no faster transport would help here.

**P&L calculation**
- `calculatePositions(trades, prices)` in `client/src/utils/calculatePositions.js` is the single source of truth for aggregating trades into positions with `avgCost`, `marketValue`, `unrealizedPL`, and `plPct`. Both the NASDAQ store and the SET hook delegate to it.

**Trade validation**
- `server/middleware/validateTrade.js` is shared by the NASDAQ and SET POST/PUT routes — required fields, BUY/SELL enum, positive quantity and price.

**Settrade OAuth**
- Authorization Code flow. Token stored in `oauth_tokens` SQLite table. `settradeService` auto-refreshes the access token 5 minutes before expiry on any API call.

**Finnhub REST**
- Proxied through the backend to hide the API key and throttled to 60 req/min via `p-throttle` (free tier limit).
