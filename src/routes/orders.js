const router = require('express').Router();
const { orders, idempotency, nextOrderId } = require('../data');

// All routes in this file are already behind requireAuth (see src/app.js),
// so req.user = { id, role } is always available.

// TASK 2 — Stop users reading other people's orders (5 marks)
//
// Right now any logged-in user can open ANY order by guessing its id (an IDOR bug).
// Fix GET /orders/:id:
//   - order does not exist                         -> 404 { error: { code: 'NOT_FOUND', message: '...' } }
//   - order.userId !== req.user.id AND role != admin -> 403 { error: { code: 'FORBIDDEN', message: '...' } }
//   - otherwise return the order (200)
// Check 404 first, then ownership. Admins may read any order.
router.get('/:id', (req, res) => {
  const order = orders.find((o) => o.id === req.params.id);
  // TODO: add the 404 check and the ownership check
  return res.json(order);
});

// TASK 3 — Never create the same order twice (5 marks)
//
// If the phone loses signal and the app retries "Place order", we must not create
// two orders. Make POST /orders idempotent using the Idempotency-Key header:
//   1. no header                -> 400 { error: { code: 'IDEMPOTENCY_KEY_REQUIRED', message: '...' } }
//   2. key already used         -> return the SAME status and body saved before; create NO new order
//   3. new key                  -> create exactly one order, save { status, body } in the
//                                  `idempotency` Map under the key, and return it with 201
//
// Create an order like this:
//   { id: nextOrderId(), userId: req.user.id, eventId: req.body.eventId, qty: req.body.qty, status: 'pending' }
// Push it into `orders`. Read the key from req.headers['idempotency-key'].
router.post('/', (req, res) => {
  // TODO: implement the three rules above. This stub creates a new order every time.
  const order = { id: nextOrderId(), userId: req.user.id, eventId: req.body.eventId, qty: req.body.qty, status: 'pending' };
  orders.push(order);
  return res.status(201).json(order);
});

module.exports = router;
