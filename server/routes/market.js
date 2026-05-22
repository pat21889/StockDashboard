const express = require('express');
const axios = require('axios');
const db = require('../db/database');
const { getQuote, getIndices } = require('../services/finnhubService');
const { getSetQuotes } = require('../services/fcsService');
const { getUSCandles, getUSQuotes, getTHQuotes } = require('../services/yahooService');
const logger = require('../utils/logger');
const SET_STOCKS = require('../data/setStocks');
const { marketRateLimiter } = require('../middleware/rateLimiter');
const router = express.Router();

router.use(marketRateLimiter);

// --- Indices ---
router.get('/indices', async (req, res, next) => {
  try { res.json(await getIndices()); } catch (err) { next(err); }
});

// --- Unified candles (US + TH) ---
// range: today | 5d | 1m | 6m | 1y | 5y | ytd
router.get('/candles/:symbol', async (req, res, next) => {
  try {
    const rawSymbol = req.params.symbol;
    const symbol = rawSymbol.toUpperCase();
    const market = (req.query.market || 'US').toUpperCase();
    const range = req.query.range || '1m';

    if (market === 'TH') {
      // Thai SET stocks on Yahoo Finance use the .BK suffix (Bangkok exchange)
      const data = await getUSCandles(symbol + '.BK', range);
      return res.json(data);
    }

    // US stocks via Yahoo Finance (free, no key required)
    const data = await getUSCandles(rawSymbol, range);
    res.json(data);
  } catch (err) { next(err); }
});

// --- Batch quotes (US or TH, multiple symbols in one call) ---
router.get('/quotes', async (req, res, next) => {
  try {
    const symbols = (req.query.symbols || '').split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
    if (!symbols.length) return res.json([]);
    const market = (req.query.market || 'US').toUpperCase();
    const data = market === 'TH' ? await getTHQuotes(symbols) : await getUSQuotes(symbols);
    res.set('Cache-Control', 'no-store');
    res.json(data);
  } catch (err) { next(err); }
});

// --- Quote (single symbol) ---
router.get('/quote/:symbol', async (req, res, next) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const market = (req.query.market || 'US').toUpperCase();
    if (market === 'TH') {
      const data = await getSetQuotes([symbol]);
      return res.json(data[0] || { symbol, price: null, change_pct: null });
    }
    res.json(await getQuote(symbol));
  } catch (err) { next(err); }
});

// --- Search stocks (US via Finnhub + TH via hardcoded list) ---
router.get('/search', async (req, res, next) => {
  try {
    const q = (req.query.q || '').trim().toUpperCase();
    const market = (req.query.market || 'all').toUpperCase();
    if (!q || q.length < 1) return res.json([]);

    const results = [];

    if (market === 'ALL' || market === 'US') {
      try {
        const r = await axios.get('https://query1.finance.yahoo.com/v1/finance/search', {
          params: { q, quotesCount: 10, newsCount: 0, listsCount: 0 },
          headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' },
          timeout: 5000,
        });
        let pushed = 0;
        for (const item of (r.data.quotes || [])) {
          if (pushed >= 8) break;
          if (item.quoteType === 'EQUITY') {
            results.push({ symbol: item.symbol, name: item.shortname || item.longname || item.symbol, market: 'US' });
            pushed++;
          }
        }
      } catch (err) { logger.error('Yahoo search failed', err.response?.status, err.message); }
    }

    if (market === 'ALL' || market === 'TH') {
      const thMatches = SET_STOCKS.filter(s =>
        s.symbol.includes(q) || s.name.toUpperCase().includes(q)
      ).slice(0, 8);
      for (const s of thMatches) results.push({ symbol: s.symbol, name: s.name, market: 'TH' });
    }

    res.json(results);
  } catch (err) { next(err); }
});

// --- Favorites (watched_symbols) ---
router.get('/favorites', (req, res) => {
  const rows = db.prepare('SELECT * FROM watched_symbols ORDER BY added_at DESC').all();
  res.json(rows);
});

router.post('/favorites', (req, res) => {
  const { symbol, market, name } = req.body;
  if (!symbol || !market) return res.status(400).json({ error: 'symbol and market required' });
  try {
    db.prepare('INSERT OR IGNORE INTO watched_symbols (symbol, market, name) VALUES (?, ?, ?)').run(symbol.toUpperCase(), market.toUpperCase(), name || null);
    res.status(201).json({ symbol: symbol.toUpperCase(), market: market.toUpperCase(), name: name || null });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/favorites/:symbol', (req, res) => {
  db.prepare('DELETE FROM watched_symbols WHERE symbol = ?').run(req.params.symbol.toUpperCase());
  res.json({ ok: true });
});

// --- USD/THB exchange rate (from open.er-api.com, free, no key required) ---
let rateCache = { rate: 33.5, fetchedAt: 0 };
router.get('/rate', async (req, res) => {
  const now = Date.now();
  if (now - rateCache.fetchedAt < 60 * 60 * 1000) return res.json({ USDTHB: rateCache.rate });
  try {
    const r = await axios.get('https://open.er-api.com/v6/latest/USD', { timeout: 5000 });
    const rate = r.data.rates?.THB || 33.5;
    rateCache = { rate, fetchedAt: now };
    res.json({ USDTHB: rate });
  } catch {
    res.json({ USDTHB: rateCache.rate });
  }
});

module.exports = router;
