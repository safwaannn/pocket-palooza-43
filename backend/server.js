/**
 * ============================================================================
 * server.js — THE ENTRY POINT
 * ============================================================================
 *
 * This file runs the PROCESS: load env vars, install process-level safety nets,
 * connect to the database, start listening, and shut down cleanly. All request
 * handling lives in app.js (which is what makes the app testable — you can
 * require it without binding a port).
 *
 * ⚠️ ORDER IS CRITICAL: dotenv.config() MUST run BEFORE require('./app'),
 * because app.js — through its controllers — reads process.env at load time.
 */

/* ═══════════════ 1. UNCAUGHT EXCEPTIONS — register first ════════════════ */
// A synchronous error nobody caught. Registered at the very top so it can catch
// crashes during the requires below. Exit immediately: after an uncaught
// exception the process state is unknown and continuing risks corrupting data.
process.on('uncaughtException', (err) => {
  console.error('💥 UNCAUGHT EXCEPTION! Shutting down...');
  console.error(err.name, err.message);
  console.error(err.stack);
  process.exit(1);
});

const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

/* ═════════════════════ 2. ENVIRONMENT VARIABLES ═════════════════════════ */
dotenv.config({ path: path.join(__dirname, 'config.env') });

// FAIL FAST: refuse to start with missing configuration, turning a mysterious
// later runtime error into a clear message now.
const requiredEnv = [
  'DATABASE',
  'DATABASE_PASSWORD',
  'JWT_SECRET',
  'JWT_EXPIREIN',
  'JWT_COOKIE_EXPIREIN',
];
const missing = requiredEnv.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error(`💥 Missing required env variables: ${missing.join(', ')}`);
  console.error('   Check your config.env file.');
  process.exit(1);
}

// Required AFTER dotenv.
const app = require('./app');

/* ══════════════════════ 3. DATABASE CONNECTION ══════════════════════════ */
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
);

mongoose
  .connect(DB)
  .then(async () => {
    console.log('✅ DB connection successful');
    // Seed the global default categories once (idempotent). These have
    // `user: null` and are visible to every user. `updateOne` with `upsert`
    // means re-running does nothing on rows that already exist.
    const Category = require('./models/categoryModel');
    await Promise.all(
      Category.DEFAULTS.map((c) =>
        Category.updateOne(
          { name: c.name, type: c.type, user: null },
          { $setOnInsert: { name: c.name, type: c.type, user: null } },
          { upsert: true },
        ),
      ),
    );
    console.log('✅ Default categories ensured');
  })
  .catch((err) => {
    console.error('💥 DB connection FAILED:', err.message);
    console.error(
      '   Check: password correct? IP whitelisted in Atlas? Online?',
    );
    process.exit(1);
  });


/* ═══════════════════════ 4. START THE SERVER ════════════════════════════ */
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`🚀 Listening on http://localhost:${port}`);
  console.log(`   Environment: ${process.env.NODE_ENV}`);
});

/* ══════════════════ 5. UNHANDLED PROMISE REJECTIONS ═════════════════════ */
// The async counterpart to uncaughtException — typically an outage the app
// cannot recover from. GRACEFUL shutdown here: the code is fine, an external
// dependency failed, so let in-flight requests finish before exiting.
process.on('unhandledRejection', (err) => {
  console.error('💥 UNHANDLED REJECTION! Shutting down gracefully...');
  console.error(err.name, err.message);
  server.close(() => process.exit(1));
});

// SIGTERM — the platform politely asking us to stop (deploy, scale-down).
// Exit 0: this was a requested shutdown, not a crash.
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('   Process terminated.');
    process.exit(0);
  });
});
