// GIVEN — do not modify.
const express = require('express');
const jwt = require('jsonwebtoken');
const { ACCESS_SECRET } = require('./config');
const { users, orders } = require('./data');
const requireAuth = require('./middleware/requireAuth');
const requireRole = require('./middleware/requireRole');
const eventsRouter = require('./routes/events');
const ordersRouter = require('./routes/orders');
const { handleWebhook } = require('./webhooks');

const app = express();

// Webhook first: express.raw() must see the untouched body (needed for the signature).
app.post('/webhooks/payments', express.raw({ type: 'application/json' }), handleWebhook);

app.use(express.json());

// Login
app.post('/auth/login', (req, res) => {
  const { username, password } = req.body || {};
  const user = users.find((u) => u.username === username && u.password === password);
  if (!user) {
    return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Wrong username or password' } });
  }
  const token = jwt.sign({ sub: user.id, role: user.role }, ACCESS_SECRET, { algorithm: 'HS256', expiresIn: '1h' });
  return res.json({ token });
});

app.use('/events', eventsRouter);
app.use('/orders', requireAuth, ordersRouter);

// Admin only: list every order (uses your Task 1 requireRole)
app.get('/admin/orders', requireAuth, requireRole('admin'), (req, res) => res.json(orders));

const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => console.log(`TicketHub on http://localhost:${PORT}`));
}

module.exports = app;
