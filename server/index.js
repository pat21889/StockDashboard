require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { runMigrations } = require('./db/migrations/migrate');
const errorHandler = require('./middleware/errorHandler');

const setRoutes = require('./routes/set');
const nasdaqRoutes = require('./routes/nasdaq');
const marketRoutes = require('./routes/market');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

app.get('/ping', (req, res) => res.json({ ok: true }));

app.use('/api/set', setRoutes);
app.use('/api/nasdaq', nasdaqRoutes);
app.use('/api/market', marketRoutes);

app.use(errorHandler);

try {
  runMigrations();
} catch (err) {
  console.error('[STARTUP] Migration failed — server will start but some features may be broken:', err.message);
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
