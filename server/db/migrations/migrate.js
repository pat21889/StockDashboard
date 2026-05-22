const db = require('../database');
const migration001 = require('./001_initial');
const migration002 = require('./002_set_manual');
const migration003 = require('./003_fix_market_constraint');

const migrations = [
  { name: '001_initial', module: migration001 },
  { name: '002_set_manual', module: migration002 },
  { name: '003_fix_market_constraint', module: migration003 },
];

function runMigrations() {
  db.exec(`CREATE TABLE IF NOT EXISTS _migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    applied_at TEXT DEFAULT (datetime('now'))
  )`);

  for (const { name, module } of migrations) {
    const already = db.prepare('SELECT id FROM _migrations WHERE name = ?').get(name);
    if (!already) {
      console.log(`Running migration: ${name}`);
      try {
        module.up();
        db.prepare('INSERT INTO _migrations (name) VALUES (?)').run(name);
        console.log(`Migration complete: ${name}`);
      } catch (err) {
        console.error(`[DB] Migration "${name}" failed: ${err.message}`);
        throw err;
      }
    }
  }
}

module.exports = { runMigrations };
