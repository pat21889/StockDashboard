const express = require('express');
const db = require('../db/database');
const { getTHQuotes } = require('../services/yahooService');
const validateTrade = require('../middleware/validateTrade');
const router = express.Router();

router.get('/trades', (req, res) => {
  const { symbol } = req.query;
  const rows = symbol
    ? db.prepare('SELECT * FROM set_manual_trades WHERE symbol = ? ORDER BY trade_date DESC').all(symbol.toUpperCase())
    : db.prepare('SELECT * FROM set_manual_trades ORDER BY trade_date DESC').all();
  res.json(rows);
});

router.post('/trades', validateTrade, (req, res) => {
  const { symbol, side, quantity, price, trade_date, note, source } = req.body;
  const result = db.prepare(`
    INSERT INTO set_manual_trades (symbol, side, quantity, price, trade_date, note, source)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(symbol.toUpperCase(), side.toUpperCase(), quantity, price, trade_date, note || null, source || 'FINANSIA');
  const row = db.prepare('SELECT * FROM set_manual_trades WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(row);
});

router.put('/trades/:id', validateTrade, (req, res) => {
  const { symbol, side, quantity, price, trade_date, note, source } = req.body;
  const existing = db.prepare('SELECT id FROM set_manual_trades WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Trade not found' });
  db.prepare(`
    UPDATE set_manual_trades SET symbol = ?, side = ?, quantity = ?, price = ?, trade_date = ?, note = ?, source = ?
    WHERE id = ?
  `).run(symbol.toUpperCase(), side.toUpperCase(), quantity, price, trade_date, note || null, source || 'FINANSIA', req.params.id);
  res.json(db.prepare('SELECT * FROM set_manual_trades WHERE id = ?').get(req.params.id));
});

router.delete('/trades/:id', (req, res) => {
  const existing = db.prepare('SELECT id FROM set_manual_trades WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Trade not found' });
  db.prepare('DELETE FROM set_manual_trades WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

router.get('/prices', async (req, res, next) => {
  try {
    const { symbols } = req.query;
    if (!symbols) return res.status(400).json({ error: 'symbols query param required (comma-separated)' });
    const list = symbols.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
    const data = await getTHQuotes(list);
    res.set('Cache-Control', 'no-store');
    res.json(data);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
