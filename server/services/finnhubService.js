const axios = require('axios');
const pThrottle = require('p-throttle');
const db = require('../db/database');

const FINNHUB_BASE = 'https://finnhub.io/api/v1';
const CACHE_TTL_MS = 60 * 1000;

// Max 60 calls per minute (free tier)
const throttle = pThrottle({ limit: 60, interval: 60 * 1000 });

const throttledGet = throttle(async (url, params) => {
  const res = await axios.get(url, {
    params: { ...params, token: process.env.FINNHUB_API_KEY },
  });
  return res.data;
});

async function getQuote(symbol) {
  return throttledGet(`${FINNHUB_BASE}/quote`, { symbol });
}

async function getCandles(symbol, resolution, from, to) {
  return throttledGet(`${FINNHUB_BASE}/stock/candle`, { symbol, resolution, from, to });
}

async function getIndices() {
  const symbols = [
    { key: '^IXIC', label: 'NASDAQ' },
    { key: '^DJI', label: 'Dow Jones' },
    { key: '^GSPC', label: 'S&P 500' },
  ];

  const results = [];
  for (const { key, label } of symbols) {
    const cached = db.prepare('SELECT * FROM index_cache WHERE symbol = ?').get(key);
    const isStale = !cached || (Date.now() - new Date(cached.fetched_at).getTime() > CACHE_TTL_MS);

    if (isStale) {
      try {
        const data = await getQuote(key);
        db.prepare(`
          INSERT INTO index_cache (symbol, price, change_pct, fetched_at)
          VALUES (?, ?, ?, datetime('now'))
          ON CONFLICT(symbol) DO UPDATE SET price = excluded.price, change_pct = excluded.change_pct, fetched_at = excluded.fetched_at
        `).run(key, data.c, data.dp);
        results.push({ symbol: key, label, price: data.c, change_pct: data.dp, open: data.o, prev_close: data.pc });
      } catch (err) {
        if (cached) results.push({ symbol: key, label, price: cached.price, change_pct: cached.change_pct });
      }
    } else {
      results.push({ symbol: key, label, price: cached.price, change_pct: cached.change_pct });
    }
  }
  return results;
}

module.exports = { getQuote, getCandles, getIndices };
