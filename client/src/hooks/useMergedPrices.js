import { useMemo } from 'react';
import useSocketStore from '../store/useSocketStore';
import usePortfolioStore from '../store/usePortfolioStore';

const FRESH_MS = 5 * 60 * 1000;

export function useMergedPrices() {
  const wsPrices = useSocketStore(s => s.prices);
  const quotePrices = usePortfolioStore(s => s.quotePrices);

  const freshWsPrices = useMemo(() => {
    const now = Date.now();
    return Object.fromEntries(
      Object.entries(wsPrices).filter(([, v]) => now - (v.receivedAt ?? 0) < FRESH_MS)
    );
  }, [wsPrices]);

  return useMemo(() => ({ ...quotePrices, ...freshWsPrices }), [quotePrices, freshWsPrices]);
}
