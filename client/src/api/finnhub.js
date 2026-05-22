import backend from './backend';

export const fetchIndices = () => backend.get('/api/market/indices').then(r => r.data);
export const fetchQuote = (symbol) => backend.get(`/api/market/quote/${symbol}`).then(r => r.data);
export const fetchCandles = (symbol, params = {}) =>
  backend.get(`/api/market/candles/${symbol}`, { params }).then(r => r.data);
