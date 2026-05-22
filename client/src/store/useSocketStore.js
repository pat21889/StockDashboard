import { create } from 'zustand';

const useSocketStore = create((set) => ({
  prices: {},        // { [symbol]: { price, timestamp, volume } }
  connected: false,

  setConnected: (connected) => set({ connected }),

  updatePrice: (symbol, data) =>
    set((state) => ({
      prices: { ...state.prices, [symbol]: { ...data, receivedAt: Date.now() } },
    })),
}));

export default useSocketStore;
