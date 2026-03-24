const express= require('express');
const helmet= require('helmet');
const cors= require('cors');
const cookieParser = require('cookie-parser');

const app = express();

// ─── Security Middleware ───────────────────────────────────────────────────────
app.use(helmet());

app.use(cors({
  origin:process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true, // allows httpOnly cookie to be sent with every request
}));

// ─── Body Parsers ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));           // blocks oversized JSON payloads
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
// Each module router is mounted here — add one line per module as we build them
app.use('/api/auth',     require('./src/modules/auth/routes'));
app.use('/api/admin',    require('./src/modules/admin/routes'));
app.use('/api/events',   require('./src/modules/events/routes'));
app.use('/api/seats',    require('./src/modules/seats/routes'));
app.use('/api/booking',  require('./src/modules/booking/routes'));
app.use('/api/payment',  require('./src/modules/payment/routes'));
app.use('/api/tickets',  require('./src/modules/tickets/routes'));
app.use('/api/scanner', require('./src/modules/scanner/routes'));
app.use('/api/staff',    require('./src/modules/staff/routes'));

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
// Must have exactly 4 params for Express to treat it as error middleware
app.use((err, req, res, next) => {
  console.error('[App Error]', err.message);

  const statusCode = err.statusCode || 500;
  const message    = err.message    || 'Internal server error';

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

module.exports = app;
