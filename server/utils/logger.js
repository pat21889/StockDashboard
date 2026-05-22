function log(level, message, data) {
  const ts = new Date().toISOString();
  if (data) {
    console[level === 'error' ? 'error' : 'log'](`[${ts}] [${level.toUpperCase()}] ${message}`, data);
  } else {
    console[level === 'error' ? 'error' : 'log'](`[${ts}] [${level.toUpperCase()}] ${message}`);
  }
}

module.exports = {
  info: (msg, data) => log('info', msg, data),
  error: (msg, data) => log('error', msg, data),
  warn: (msg, data) => log('warn', msg, data),
};
