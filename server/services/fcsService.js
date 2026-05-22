const axios = require('axios');
const db = require('../db/database');
const logger = require('../utils/logger');

const FCS_BASE = 'https://fcsapi.com/api-v3/stock';
const PRICE_CACHE_TTL_MS = 10 * 60 * 1000;

// Simple in-memory cache for candle data to protect 500 calls/month limit
const candleCache = new Map();
function getCandleCacheKey(symbol, period, from, to) { return `${symbol}:${period}:${from}:${to}`; }
function getCachedCandles(key, ttlMs) {
  const entry = candleCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > ttlMs) { candleCache.delete(key); return null; }
  return entry.data;
}
function setCachedCandles(key, data) { candleCache.set(key, { data, ts: Date.now() }); }

async function fetchFromFCS(symbols) {
  const key = process.env.FCS_API_KEY;
  if (!key) throw Object.assign(new Error('FCS_API_KEY not set in server/.env'), { status: 503 });
  const res = await axios.get(`${FCS_BASE}/latest`, {
    params: { symbol: symbols.join(','), country: 'thailand', access_key: key },
    timeout: 8000,
  });
  if (!res.data || res.data.status === false) throw new Error(res.data?.msg || 'FCS API error');
  return res.data.response || [];
}

async function getSetQuotes(symbols) {
  if (!symbols.length) return [];
  const results = [];
  const toFetch = [];
  for (const sym of symbols) {
    const cached = db.prepare('SELECT * FROM set_price_cache WHERE symbol = ?').get(sym.toUpperCase());
    const isStale = !cached || Date.now() - new Date(cached.fetched_at).getTime() > PRICE_CACHE_TTL_MS;
    if (isStale) toFetch.push(sym.toUpperCase());
    else results.push({ symbol: sym.toUpperCase(), price: cached.price, change_pct: cached.change_pct, cached: true });
  }
  if (toFetch.length > 0) {
    try {
      const fresh = await fetchFromFCS(toFetch);
      const upsert = db.prepare(`
        INSERT INTO set_price_cache (symbol, price, change_pct, fetched_at)
        VALUES (?, ?, ?, datetime('now'))
        ON CONFLICT(symbol) DO UPDATE SET price = excluded.price, change_pct = excluded.change_pct, fetched_at = excluded.fetched_at
      `);
      for (const item of fresh) {
        const sym = (item.s || item.symbol || '').toUpperCase();
        const price = parseFloat(item.c || item.price || 0);
        const changePct = parseFloat(item.cp || item.change_percentage || 0);
        upsert.run(sym, price, changePct);
        results.push({ symbol: sym, price, change_pct: changePct, cached: false });
      }
    } catch (err) {
      logger.error('FCS API fetch failed', err.message);
      for (const sym of toFetch) {
        const stale = db.prepare('SELECT * FROM set_price_cache WHERE symbol = ?').get(sym);
        if (stale) results.push({ symbol: sym, price: stale.price, change_pct: stale.change_pct, cached: true, stale: true });
      }
    }
  }
  return results;
}

async function getSetCandles(symbol, period, fromDate, toDate) {
  const key = process.env.FCS_API_KEY;
  if (!key) throw Object.assign(new Error('FCS_API_KEY not set'), { status: 503 });

  const cacheKey = getCandleCacheKey(symbol, period, fromDate, toDate);
  // Short ranges cached 30min, longer ranges 12h
  const ttl = ['1D'].includes(period) ? 30 * 60 * 1000 : 12 * 60 * 60 * 1000;
  const cached = getCachedCandles(cacheKey, ttl);
  if (cached) return cached;

  const res = await axios.get(`${FCS_BASE}/history`, {
    params: { symbol, period, country: 'thailand', from: fromDate, to: toDate, access_key: key },
    timeout: 10000,
  });

  if (!res.data || res.data.status === false) {
    throw new Error(res.data?.msg || 'FCS history error');
  }

  const raw = res.data.response || [];
  // Normalize to Finnhub-compatible format
  const normalized = {
    s: raw.length > 0 ? 'ok' : 'no_data',
    t: raw.map(r => Math.floor(new Date(r.d).getTime() / 1000)),
    o: raw.map(r => parseFloat(r.o)),
    h: raw.map(r => parseFloat(r.h)),
    l: raw.map(r => parseFloat(r.l)),
    c: raw.map(r => parseFloat(r.c)),
    v: raw.map(r => parseFloat(r.v || 0)),
  };

  setCachedCandles(cacheKey, normalized);
  return normalized;
}

module.exports = { getSetQuotes, getSetCandles };
