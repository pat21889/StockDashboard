const express = require('express');
const db = require('../db/database');
const router = express.Router();

router.get('/trades', (req, res) => {
  const { symbol } = req.query;
  const rows = symbol
    ? db.prepare('SELECT * FROM nasdaq_trades WHERE symbol = ? ORDER BY trade_date DESC').all(symbol.toUpperCase())
    : db.prepare('SELECT * FROM nasdaq_trades ORDER BY trade_date DESC').all();
  res.json(rows);
});

router.post('/trades', (req, res) => {
  const { symbol, side, quantity, price, trade_date, note, source } = req.body;
  if (!symbol || !side || !quantity || !price || !trade_date) {
    return res.status(400).json({ error: 'symbol, side, quantity, price, and trade_date are required' });
  }
  if (!['BUY', 'SELL'].includes(side.toUpperCase())) {
    return res.status(400).json({ error: 'side must be BUY or SELL' });
  }
  if (quantity <= 0 || price <= 0) {
    return res.status(400).json({ error: 'quantity and price must be positive' });
  }
  const result = db.prepare(`
    INSERT INTO nasdaq_trades (symbol, side, quantity, price, trade_date, note, source)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(symbol.toUpperCase(), side.toUpperCase(), quantity, price, trade_date, note || null, source || 'DIME');
  const row = db.prepare('SELECT * FROM nasdaq_trades WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(row);
});

router.put('/trades/:id', (req, res) => {
  const { symbol, side, quantity, price, trade_date, note, source } = req.body;
  const existing = db.prepare('SELECT id FROM nasdaq_trades WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Trade not found' });
  db.prepare(`
    UPDATE nasdaq_trades SET symbol = ?, side = ?, quantity = ?, price = ?, trade_date = ?, note = ?, source = ?
    WHERE id = ?
  `).run(symbol.toUpperCase(), side.toUpperCase(), quantity, price, trade_date, note || null, source || 'DIME', req.params.id);
  res.json(db.prepare('SELECT * FROM nasdaq_trades WHERE id = ?').get(req.params.id));
});

router.delete('/trades/:id', (req, res) => {
  const existing = db.prepare('SELECT id FROM nasdaq_trades WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Trade not found' });
  db.prepare('DELETE FROM nasdaq_trades WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
