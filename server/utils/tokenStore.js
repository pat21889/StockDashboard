const db = require('../db/database');

function saveToken({ broker = 'FINANSIA', accountNo, accessToken, refreshToken, expiresAt, scope }) {
  const existing = db.prepare('SELECT id FROM oauth_tokens WHERE broker = ?').get(broker);
  if (existing) {
    db.prepare(`
      UPDATE oauth_tokens
      SET account_no = ?, access_token = ?, refresh_token = ?, expires_at = ?, updated_at = datetime('now')
      WHERE broker = ?
    `).run(accountNo || null, accessToken, refreshToken || null, expiresAt, broker);
  } else {
    db.prepare(`
      INSERT INTO oauth_tokens (broker, account_no, access_token, refresh_token, expires_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(broker, accountNo || null, accessToken, refreshToken || null, expiresAt);
  }
}

function getToken(broker = 'FINANSIA') {
  return db.prepare('SELECT * FROM oauth_tokens WHERE broker = ?').get(broker);
}

function clearToken(broker = 'FINANSIA') {
  db.prepare('DELETE FROM oauth_tokens WHERE broker = ?').run(broker);
}

module.exports = { saveToken, getToken, clearToken };
