export function calculatePositions(trades, prices = {}) {
  const map = {};
  for (const t of trades) {
    if (!map[t.symbol]) map[t.symbol] = { symbol: t.symbol, totalQty: 0, totalCost: 0 };
    const qty = t.side === 'BUY' ? t.quantity : -t.quantity;
    map[t.symbol].totalQty += qty;
    if (t.side === 'BUY') map[t.symbol].totalCost += t.quantity * t.price;
  }
  return Object.values(map)
    .filter(p => p.totalQty > 0)
    .map(p => {
      const avgCost = p.totalCost / p.totalQty;
      const priceEntry = prices[p.symbol] ?? {};
      const currentPrice = priceEntry.price ?? null;
      const marketValue = currentPrice != null ? currentPrice * p.totalQty : null;
      const unrealizedPL = marketValue != null ? marketValue - avgCost * p.totalQty : null;
      const plPct = unrealizedPL != null ? (unrealizedPL / (avgCost * p.totalQty)) * 100 : null;
      const changePct = priceEntry.change_pct ?? null;
      return { symbol: p.symbol, quantity: p.totalQty, avgCost, currentPrice, marketValue, unrealizedPL, plPct, changePct };
    });
}
