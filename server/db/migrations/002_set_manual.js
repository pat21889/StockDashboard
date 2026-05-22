const db = require('../database');

function up() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS set_manual_trades (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      symbol     TEXT NOT NULL,
      side       TEXT NOT NULL CHECK (side IN ('BUY','SELL')),
      quantity   REAL NOT NULL,
      price      REAL NOT NULL,
      trade_date TEXT NOT NULL,
      note       TEXT,
      source     TEXT DEFAULT 'FINANSIA',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS set_price_cache (
      symbol     TEXT PRIMARY KEY,
      price      REAL,
      change_pct REAL,
      fetched_at TEXT DEFAULT (datetime('now'))
    );
  `);
}

module.exports = { up };
