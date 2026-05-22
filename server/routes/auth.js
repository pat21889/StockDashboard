const express = require('express');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const { saveToken } = require('../utils/tokenStore');
const logger = require('../utils/logger');
const router = express.Router();

const AUTH_URL = process.env.SETTRADE_AUTH_URL || 'https://open-api.settrade.com/api/oam/v1/oauth/authorize';
const TOKEN_URL = process.env.SETTRADE_TOKEN_URL || 'https://open-api.settrade.com/api/oam/v1/oauth/token';
const REDIRECT_URI = process.env.SETTRADE_REDIRECT_URI || 'http://localhost:3001/auth/settrade/callback';
const CLIENT_ID = process.env.SETTRADE_CLIENT_ID;
const CLIENT_SECRET = process.env.SETTRADE_CLIENT_SECRET;
const FRONTEND_URL = 'http://localhost:5173';

router.get('/settrade', (req, res) => {
  const state = uuidv4();
  req.session.oauthState = state;

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    scope: 'portfolio:read trade:read account:read',
    state,
  });

  res.redirect(`${AUTH_URL}?${params.toString()}`);
});

router.get('/settrade/callback', async (req, res) => {
  const { code, state, error } = req.query;

  if (error) {
    logger.error('Settrade OAuth error', error);
    return res.redirect(`${FRONTEND_URL}/oauth-callback?error=${encodeURIComponent(error)}`);
  }

  if (!state || state !== req.session.oauthState) {
    return res.redirect(`${FRONTEND_URL}/oauth-callback?error=invalid_state`);
  }

  delete req.session.oauthState;

  try {
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    });

    const tokenRes = await axios.post(TOKEN_URL, params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    const { access_token, refresh_token, expires_in } = tokenRes.data;
    const expiresAt = new Date(Date.now() + expires_in * 1000).toISOString();

    saveToken({ accessToken: access_token, refreshToken: refresh_token, expiresAt });
    logger.info('Settrade token saved successfully');

    res.redirect(`${FRONTEND_URL}/oauth-callback?success=true`);
  } catch (err) {
    logger.error('Token exchange failed', err.message);
    res.redirect(`${FRONTEND_URL}/oauth-callback?error=token_exchange_failed`);
  }
});

router.get('/settrade/status', (req, res) => {
  const { getToken } = require('../utils/tokenStore');
  const token = getToken('FINANSIA');
  if (!token) return res.json({ connected: false });
  const expired = Date.now() >= new Date(token.expires_at).getTime();
  res.json({ connected: true, expired, expires_at: token.expires_at, account_no: token.account_no });
});

router.delete('/settrade/disconnect', (req, res) => {
  const { clearToken } = require('../utils/tokenStore');
  clearToken('FINANSIA');
  res.json({ ok: true });
});

module.exports = router;
