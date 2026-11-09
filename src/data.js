// GIVEN — do not modify. In-memory "database" — no real DB needed.

const users = [
  { id: 'u1', username: 'alice', password: 'alice-pass', role: 'member' },
  { id: 'u2', username: 'bob',   password: 'bob-pass',   role: 'member' },
  { id: 'u3', username: 'admin', password: 'admin-pass', role: 'admin'  },
];

const events = [
  { id: 'e1', name: 'Rock Night',  price: 500 },
  { id: 'e2', name: 'Jazz Evening', price: 350 },
];

// Every order belongs to one user (userId).
const orders = [
  { id: 'o1', userId: 'u1', eventId: 'e1', qty: 2, status: 'pending' }, // alice's order
  { id: 'o2', userId: 'u2', eventId: 'e2', qty: 1, status: 'pending' }, // bob's order
];

// Used by Task 3: key -> { status, body }
const idempotency = new Map();

let orderCounter = orders.length;
const nextOrderId = () => `o${++orderCounter}`;

let eventCounter = events.length;
const nextEventId = () => `e${++eventCounter}`;

module.exports = { users, events, orders, idempotency, nextOrderId, nextEventId };
