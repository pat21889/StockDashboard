function validateTrade(req, res, next) {
  const { symbol, side, quantity, price, trade_date } = req.body;
  if (!symbol || !side || !quantity || !price || !trade_date) {
    return res.status(400).json({ error: 'symbol, side, quantity, price, and trade_date are required' });
  }
  if (!['BUY', 'SELL'].includes(side.toUpperCase())) {
    return res.status(400).json({ error: 'side must be BUY or SELL' });
  }
  if (quantity <= 0 || price <= 0) {
    return res.status(400).json({ error: 'quantity and price must be positive' });
  }
  next();
}

module.exports = validateTrade;
