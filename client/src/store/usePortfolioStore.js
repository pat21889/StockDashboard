import { create } from 'zustand';
import backend from '../api/backend';
import { calculatePositions } from '../utils/calculatePositions';

const QUOTE_CACHE_MS = 5 * 60 * 1000;

const usePortfolioStore = create((set, get) => ({
  trades: [],
  loading: false,
  error: null,

  quotePrices: {},
  quotesFetchedAt: 0,

  fetchQuotePrices: async (symbols) => {
    if (!symbols.length) return;
    if (Date.now() - get().quotesFetchedAt < QUOTE_CACHE_MS) return;
    try {
      const { data } = await backend.get('/api/market/quotes', {
        params: { symbols: symbols.join(','), market: 'US' },
      });
      const map = {};
      for (const q of data) if (q.price != null) map[q.symbol] = { price: q.price };
      set({ quotePrices: map, quotesFetchedAt: Date.now() });
    } catch {}
  },

  fetchTrades: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await backend.get('/api/nasdaq/trades');
      set({ trades: data, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  addTrade: async (trade) => {
    const { data } = await backend.post('/api/nasdaq/trades', trade);
    set((state) => ({ trades: [data, ...state.trades] }));
    return data;
  },

  deleteTrade: async (id) => {
    await backend.delete(`/api/nasdaq/trades/${id}`);
    set((state) => ({ trades: state.trades.filter((t) => t.id !== id) }));
  },

  getPositions: (livePrices) => calculatePositions(get().trades, livePrices),
}));

export default usePortfolioStore;
