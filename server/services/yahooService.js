const axios = require('axios');
const logger = require('../utils/logger');

const YAHOO_BASE = 'https://query1.finance.yahoo.com/v8/finance/chart';

// Map our range keys → Yahoo range + interval
const RANGE_MAP = {
  today: { range: '1d',  interval: '5m'  },
  '5d':  { range: '5d',  interval: '1h'  },
  '1m':  { range: '1mo', interval: '1d'  },
  '6m':  { range: '6mo', interval: '1wk' },
  '1y':  { range: '1y',  interval: '1wk' },
  '5y':  { range: '5y',  interval: '1mo' },
  ytd:   { range: 'ytd', interval: '1d'  },
};

async function getUSCandles(symbol, range) {
  const { range: yRange, interval } = RANGE_MAP[range] || RANGE_MAP['1m'];

  const res = await axios.get(`${YAHOO_BASE}/${encodeURIComponent(symbol)}`, {
    params: { interval, range: yRange, includePrePost: false },
    headers: {
      'User-Agent': 'Mozilla/5.0',
      'Accept': 'application/json',
    },
    timeout: 10000,
  });

  const chartError = res.data?.chart?.error;
  if (chartError) logger.warn('Yahoo Finance error', symbol, chartError.code, chartError.description);
  const result = res.data?.chart?.result?.[0];
  if (!result) return { s: 'no_data', t: [], o: [], h: [], l: [], c: [], v: [] };

  const timestamps = result.timestamp || [];
  const quote = result.indicators?.quote?.[0] || {};

  if (!timestamps.length) return { s: 'no_data', t: [], o: [], h: [], l: [], c: [], v: [] };

  const meta = result.meta || {};
  const previousClose = meta.previousClose ?? meta.chartPreviousClose ?? null;

  // Filter out nulls (market closed gaps)
  const points = { s: 'ok', t: [], o: [], h: [], l: [], c: [], v: [], previousClose };
  for (let i = 0; i < timestamps.length; i++) {
    const c = quote.close?.[i];
    if (c == null) continue;
    points.t.push(timestamps[i]);
    points.o.push(quote.open?.[i] ?? c);
    points.h.push(quote.high?.[i] ?? c);
    points.l.push(quote.low?.[i] ?? c);
    points.c.push(c);
    points.v.push(quote.volume?.[i] ?? 0);
  }

  if (!points.t.length) points.s = 'no_data';
  return points;
}

async function fetchQuoteViaChart(yahooSymbol) {
  const res = await axios.get(`${YAHOO_BASE}/${encodeURIComponent(yahooSymbol)}`, {
    params: { interval: '1m', range: '1d', includePrePost: false },
    headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' },
    timeout: 8000,
  });
  const meta = res.data?.chart?.result?.[0]?.meta || {};
  const price = meta.regularMarketPrice ?? null;
  const prev = meta.previousClose ?? meta.chartPreviousClose ?? null;
  const change_pct = (price != null && prev != null && prev !== 0)
    ? ((price - prev) / prev) * 100
    : null;
  return { price, change_pct };
}

async function fetchInBatches(tasks, batchSize = 4, delayMs = 250) {
  const results = [];
  for (let i = 0; i < tasks.length; i += batchSize) {
    const batch = tasks.slice(i, i + batchSize);
    results.push(...await Promise.allSettled(batch.map(fn => fn())));
    if (i + batchSize < tasks.length) await new Promise(r => setTimeout(r, delayMs));
  }
  return results.filter(r => r.status === 'fulfilled').map(r => r.value);
}

async function getUSQuotes(symbols) {
  if (!symbols.length) return [];
  return fetchInBatches(
    symbols.map(s => () => fetchQuoteViaChart(s).then(q => ({ symbol: s.toUpperCase(), ...q })))
  );
}

async function getTHQuotes(symbols) {
  if (!symbols.length) return [];
  return fetchInBatches(
    symbols.map(s => () => fetchQuoteViaChart(`${s}.BK`).then(q => ({ symbol: s.toUpperCase(), ...q })))
  );
}

module.exports = { getUSCandles, getUSQuotes, getTHQuotes };
