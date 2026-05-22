# StockDashboard

A personal stock dashboard for tracking NASDAQ (US) and SET (Thailand) portfolios with real-time prices, P&L, and allocation breakdown.

![Stack](https://img.shields.io/badge/React_18-Vite-blue) ![Stack](https://img.shields.io/badge/Node.js-Express-green) ![Stack](https://img.shields.io/badge/SQLite-better--sqlite3-orange)

---

## Features

- **Dashboard** — live index cards (NASDAQ, S&P 500, Dow Jones), interactive price chart, watchlist, stock search, and portfolio sidebar with allocation percentages
- **NASDAQ Portfolio** — manual trade entry (buy/sell), per-position P&L, average cost tracking, live prices via Finnhub WebSocket
- **SET Portfolio** — manual trade entry (same flow as NASDAQ), live Thai stock prices via Yahoo Finance (`.BK` suffix)
- **Live prices** — Finnhub WebSocket streams real-time NASDAQ ticks; Yahoo Finance REST provides closing/current prices for both markets
- **Multi-currency** — toggle portfolio values between USD and THB with live exchange rate

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Recharts, Zustand, React Router v6 |
| Backend | Node.js, Express |
| Database | SQLite via `better-sqlite3` |
| US prices | Finnhub WebSocket (real-time) + Yahoo Finance REST (closing/off-hours) |
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

The frontend runs at `http://localhost:5173` and the backend at `http://localhost:3001`.

---

## Environment Variables

**`server/.env`**

| Variable | Description |
|---|---|
| `PORT` | Server port (default `3001`) |
| `FINNHUB_API_KEY` | Finnhub REST API key (proxied to hide from browser) |
| `FCS_API_KEY` | FCS API key for Thai SET quotes (500 free calls/month) |

**`client/.env`**

| Variable | Description |
|---|---|
| `VITE_FINNHUB_API_KEY` | Finnhub key used for the browser WebSocket connection |
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
├── client/                  # React + Vite frontend
│   └── src/
│       ├── api/             # backend.js (axios), finnhub.js (REST helpers)
│       ├── components/
│       │   ├── dashboard/   # IndexCard, MainChartPanel, PortfolioSidebar, etc.
│       │   ├── layout/      # Sidebar, TopBar
│       │   ├── portfolio/   # TradeForm, PortfolioTable, PLSummary
│       │   └── stocks/      # StockChart, StockCard, PriceChangeTag
│       ├── hooks/           # useFinnhubSocket, useQuote, useSETPortfolio, etc.
│       ├── pages/           # DashboardPage, NasdaqPortfolioPage, SetPortfolioPage, etc.
│       └── store/           # useSocketStore (live WS prices), usePortfolioStore (trades + REST prices)
│
└── server/                  # Node.js + Express backend
    ├── db/
    │   ├── database.js      # SQLite singleton
    │   └── migrations/      # Schema migrations (run on startup)
    ├── middleware/           # errorHandler, rateLimiter
    ├── routes/              # auth.js, market.js, nasdaq.js, set.js
    ├── services/            # finnhubService, yahooService, settradeService, fcsService
    └── utils/               # tokenStore.js, logger.js
```

---

## Database Schema

Six tables managed by auto-running migrations:

| Table | Purpose |
|---|---|
| `nasdaq_trades` | Manual NASDAQ buy/sell trade log |
| `set_holdings` | SET portfolio holdings synced from Finansia |
| `set_trades` | SET trade history synced from Finansia |
| `set_manual_trades` | Manually entered SET trades |
| `oauth_tokens` | Settrade OAuth access/refresh tokens |
| `watched_symbols` | Watchlist (favorites) |
| `index_cache` | Cached index quotes (60-second TTL) |

---

## Architecture Notes

- **Finnhub WebSocket** lives in the browser (persistent connection). Zustand `useSocketStore` distributes live prices to all components without prop drilling. WebSocket prices are only applied if received within the last 5 minutes — outside trading hours, correct Yahoo closing prices are used instead.
- **REST price cache** (`quotePrices` in `usePortfolioStore`) is shared across pages with a 5-minute cache. Navigating from Portfolio to Dashboard reuses already-fetched prices instantly.
- **Finnhub REST** is proxied through the backend to hide the API key and apply `p-throttle` (60 req/min free tier limit).
- **SET holdings** are cached in SQLite so the app works offline after a sync.
