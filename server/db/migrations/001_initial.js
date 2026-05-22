const db = require('../database');

function up() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS nasdaq_trades (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      symbol     TEXT NOT NULL,
      side       TEXT NOT NULL CHECK (side IN ('BUY','SELL')),
      quantity   REAL NOT NULL,
      price      REAL NOT NULL,
      trade_date TEXT NOT NULL,
      note       TEXT,
      source     TEXT DEFAULT 'DIME',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS set_holdings (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      account_no    TEXT NOT NULL,
      symbol        TEXT NOT NULL,
      volume        REAL NOT NULL,
      avg_cost      REAL NOT NULL,
      market_value  REAL,
      unrealized_pl REAL,
      synced_at     TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS set_trades (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      account_no      TEXT NOT NULL,
      symbol          TEXT NOT NULL,
      side            TEXT NOT NULL CHECK (side IN ('BUY','SELL')),
      volume          REAL NOT NULL,
      price           REAL NOT NULL,
      trade_date      TEXT NOT NULL,
      settlement_date TEXT,
      order_no        TEXT UNIQUE,
      synced_at       TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS oauth_tokens (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      broker        TEXT NOT NULL DEFAULT 'FINANSIA',
      account_no    TEXT,
      access_token  TEXT NOT NULL,
      refresh_token TEXT,
      expires_at    TEXT NOT NULL,
      updated_at    TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS watched_symbols (
      id       INTEGER PRIMARY KEY AUTOINCREMENT,
      symbol   TEXT NOT NULL UNIQUE,
      market   TEXT NOT NULL CHECK (market IN ('NASDAQ','SET')),
      added_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS index_cache (
      symbol     TEXT PRIMARY KEY,
      price      REAL,
      change_pct REAL,
      fetched_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS _migrations (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT NOT NULL UNIQUE,
      applied_at TEXT DEFAULT (datetime('now'))
    );
  `);
}

module.exports = { up };
