const express      = require('express');
const helmet       = require('helmet');
const cors         = require('cors');
const cookieParser = require('cookie-parser');
const { initStripe } = require('./src/config/stripe');

// ─── App init MUST come first ─────────────────────────────────────────────────
const app = express();

// ─── Security ─────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

// ─── Stripe Webhooks — RAW BODY (must be BEFORE express.json()) ───────────────
// Registration webhook — raw body handled here, NOT inside routes.js
app.use(
  '/api/registration/webhook',
  express.raw({ type: 'application/json' }),
  require('./src/modules/registration/routes')
);

// Payment webhook — raw body handled here, NOT inside routes.js
app.use(
  '/api/payment/webhook',
  express.raw({ type: 'application/json' }),
  require('./src/modules/payment/routes')
);

// ─── Body Parsers (after webhook routes) ─────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth',         require('./src/modules/auth/routes'));
app.use('/api/admin',        require('./src/modules/admin/routes'));
app.use('/api/events',       require('./src/modules/events/routes'));
app.use('/api/seats',        require('./src/modules/seats/routes'));
app.use('/api/booking',      require('./src/modules/booking/routes'));
app.use('/api/payment',      require('./src/modules/payment/routes'));
app.use('/api/tickets',      require('./src/modules/tickets/routes'));
app.use('/api/scanner',      require('./src/modules/scanner/routes'));
app.use('/api/staff',        require('./src/modules/staff/routes'));
app.use('/api/organizer',    require('./src/modules/organizer/routes'));
app.use('/api/venue-owner',  require('./src/modules/venue-owner/routes'));
app.use('/api/browse',       require('./src/modules/browse/routes'));
app.use('/api/registration', require('./src/modules/registration/routes'));

// ─── Jobs ─────────────────────────────────────────────────────────────────────
const { updateSessionStatuses } = require('./src/jobs/sessionStatusUpdater');
updateSessionStatuses();
setInterval(updateSessionStatuses, 5 * 60 * 1000);

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[App Error]', err.message);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ─── Init Stripe ──────────────────────────────────────────────────────────────
initStripe();

module.exports = app;