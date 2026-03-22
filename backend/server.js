require('dotenv').config();

const app                        = require('./app');
const { testConnection }         = require('./src/config/db');
const { getClient, disconnectClient } = require('./src/config/redis');
const { configureCloudinary }    = require('./src/config/cloudinary');
const { getRazorpay }            = require('./src/config/razorpay');
const { start: startConsumer,
        stop:  stopConsumer }    = require('./src/workers/bookingConsumer');

const PORT = process.env.PORT || 5000;

let server = null;

const startServer = async () => {
  try {
    // ── 1. Test MySQL connection ───────────────────────────────────────────────
    await testConnection();

    // ── 2. Boot Redis client ───────────────────────────────────────────────────
    getClient();

    // ── 3. Configure Cloudinary ────────────────────────────────────────────────
    configureCloudinary();

    // ── 4. Init Razorpay ───────────────────────────────────────────────────────
    getRazorpay();

    // ── 5. Start booking consumer worker ──────────────────────────────────────
    startConsumer();

    // ── 6. Start HTTP server ───────────────────────────────────────────────────
    server = app.listen(PORT, () => {
      console.log(`[Server] EventFlow API running on port ${PORT} (${process.env.NODE_ENV})`);
    });

  } catch (err) {
    console.error('[Server] Startup failed:', err.message);
    process.exit(1);
  }
};

// ─── Graceful Shutdown ────────────────────────────────────────────────────────
const shutdown = async (signal) => {
  console.log(`\n[Server] ${signal} received — shutting down gracefully`);

  try {
    // Stop accepting new HTTP requests
    if (server) {
      server.close(() => {
        console.log('[Server] HTTP server closed');
      });
    }

    // Stop the booking consumer worker first
    await stopConsumer();

    // Disconnect Redis
    await disconnectClient();

    console.log('[Server] Shutdown complete');
    process.exit(0);
  } catch (err) {
    console.error('[Server] Error during shutdown:', err.message);
    process.exit(1);
  }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

// Catch unhandled promise rejections — prevent silent failures
process.on('unhandledRejection', (reason) => {
  console.error('[Server] Unhandled Rejection:', reason);
  shutdown('unhandledRejection');
});

// Catch uncaught exceptions — last resort safety net
process.on('uncaughtException', (err) => {
  console.error('[Server] Uncaught Exception:', err.message);
  shutdown('uncaughtException');
});

startServer();
