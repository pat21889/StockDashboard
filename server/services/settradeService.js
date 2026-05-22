const axios = require('axios');
const { getToken, saveToken } = require('../utils/tokenStore');
const logger = require('../utils/logger');

const API_BASE = process.env.SETTRADE_API_BASE || 'https://open-api.settrade.com';
const TOKEN_URL = process.env.SETTRADE_TOKEN_URL || 'https://open-api.settrade.com/api/oam/v1/oauth/token';
const REFRESH_BUFFER_MS = 5 * 60 * 1000; // refresh 5 min before expiry

async function refreshAccessToken(tokenRow) {
  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: tokenRow.refresh_token,
    client_id: process.env.SETTRADE_CLIENT_ID,
    client_secret: process.env.SETTRADE_CLIENT_SECRET,
  });
  const res = await axios.post(TOKEN_URL, params.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  const expiresAt = new Date(Date.now() + res.data.expires_in * 1000).toISOString();
  saveToken({
    accessToken: res.data.access_token,
    refreshToken: res.data.refresh_token || tokenRow.refresh_token,
    expiresAt,
    accountNo: tokenRow.account_no,
  });
  return res.data.access_token;
}

async function getValidToken() {
  const tokenRow = getToken('FINANSIA');
  if (!tokenRow) throw Object.assign(new Error('Not connected to Settrade. Visit /auth/settrade to connect.'), { status: 401 });

  const expiresAt = new Date(tokenRow.expires_at).getTime();
  if (Date.now() >= expiresAt - REFRESH_BUFFER_MS) {
    logger.info('Refreshing Settrade access token');
    return refreshAccessToken(tokenRow);
  }
  return tokenRow.access_token;
}

async function settradeGet(path) {
  const token = await getValidToken();
  const res = await axios.get(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

async function getAccountInfo() {
  return settradeGet('/api/account/v1/accounts');
}

async function getPortfolio(accountNo) {
  return settradeGet(`/api/portf/v1/accounts/${accountNo}/portfolios`);
}

async function getHoldings(accountNo) {
  return settradeGet(`/api/portf/v1/accounts/${accountNo}/holdings`);
}

async function getTradeHistory(accountNo, from, to) {
  const query = from && to ? `?startDate=${from}&endDate=${to}` : '';
  return settradeGet(`/api/trade/v1/accounts/${accountNo}/trades${query}`);
}

module.exports = { getAccountInfo, getPortfolio, getHoldings, getTradeHistory, getValidToken };
