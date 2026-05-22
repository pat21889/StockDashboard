const db = require('../database');

function up() {
  // Explicitly finalize every prepared statement before issuing DDL.
  // node-sqlite3-wasm keeps statement handles alive until finalized; SQLite
  // refuses DROP/RENAME on a table that has any live statement referencing it.
  const row = db.prepare(`SELECT sql FROM sqlite_master WHERE type='table' AND name='watched_symbols'`).get();

  // Nothing to migrate if table doesn't exist
  if (!row) return;

  // Already has the correct US/TH constraint — skip
  if (row.sql && row.sql.includes("'US'")) return;

  // Clean up any leftover tables from previous partial runs
  db.exec(`DROP TABLE IF EXISTS watched_symbols_new`);
  db.exec(`DROP TABLE IF EXISTS watched_symbols_old`);

  // Rename original out of the way first (avoids DROP TABLE on a table that
  // may still be referenced by any cached statements elsewhere).
  db.exec(`ALTER TABLE watched_symbols RENAME TO watched_symbols_old`);

  // Create fresh table with correct constraint + name column
  db.exec(`
    CREATE TABLE watched_symbols (
      id       INTEGER PRIMARY KEY AUTOINCREMENT,
      symbol   TEXT NOT NULL UNIQUE,
      market   TEXT NOT NULL CHECK (market IN ('US','TH')),
      name     TEXT,
      added_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // Copy data, converting old market codes to new ones
  db.exec(`
    INSERT OR IGNORE INTO watched_symbols (id, symbol, market, added_at)
    SELECT id,
           symbol,
           CASE market WHEN 'NASDAQ' THEN 'US' WHEN 'SET' THEN 'TH' ELSE market END,
           added_at
    FROM watched_symbols_old
  `);

  db.exec(`DROP TABLE watched_symbols_old`);
}

module.exports = { up };
