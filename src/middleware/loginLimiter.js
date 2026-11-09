// TASK 4 — Slow down password guessing (3 marks)
//
// Right now anyone can try passwords on /auth/login forever.
// Build the limiter with express-rate-limit (already in package.json) and export it.
// It is already attached to POST /auth/login in src/app.js.
//
// Settings:
//   - windowMs: 15 minutes
//   - max: 5 attempts per window (per IP)
//   - skipSuccessfulRequests: true   (only FAILED logins count)
//   - standardHeaders: true, legacyHeaders: false
//   - after the limit, respond 429 with this body:
//       { error: { code: 'RATE_LIMITED', message: '...' } }
//     and a Retry-After header (express-rate-limit sets it for you).
//
// Also add a short comment: why is this in-memory counter not enough when the app
// runs on several servers behind a load balancer?

const rateLimit = require('express-rate-limit');

// TODO: replace this pass-through with a real limiter
module.exports = (req, res, next) => next();
