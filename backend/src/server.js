require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const authRoutes     = require('./routes/auth');
const urlRoutes      = require('./routes/urls');
const bioRoutes      = require('./routes/bio');
const redirectRoutes = require('./routes/redirect');

const app = express();

// Trust proxy for IP forwarding
app.set('trust proxy', 1);

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting — relaxed in development
const isDev = process.env.NODE_ENV !== 'production';
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 1000 : 100,
  message: { error: 'Too many requests, please try again later' },
  skip: () => isDev,
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 1000 : 20,
  message: { error: 'Too many auth attempts, please try again later' },
  skip: () => isDev,
});

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/urls', apiLimiter, urlRoutes);
app.use('/api/bio',  apiLimiter, bioRoutes);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Short URL redirect (must be after /api routes)
app.use('/', redirectRoutes);

// 404 fallback
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Local dev only — Vercel handles listening itself
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

module.exports = app;
