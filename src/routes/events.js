// TASK 6 — Cache the event list (3 marks)
//
// GET /events runs db.getEvents() on EVERY request. The list rarely changes,
// so cache it (cache-aside), using the helper in ../cache (get / set / del):
//
//   GET /events
//     1. look in the cache under the key 'events:all'
//     2. HIT  -> set header  X-Cache: HIT   and return the cached list
//     3. MISS -> call db.getEvents(), cache it for 60 seconds,
//                set header  X-Cache: MISS  and return the list
//
//   POST /events (admin)
//     after creating the event, delete 'events:all' from the cache so the next
//     GET shows the new event instead of a stale list.

const router = require('express').Router();
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');
const db = require('../db');
const cache = require('../cache');

router.get('/', (req, res) => {
  // TODO: add cache-aside here
  const events = db.getEvents();
  res.set('X-Cache', 'MISS');
  return res.json(events);
});

router.post('/', requireAuth, requireRole('admin'), (req, res) => {
  const event = db.createEvent({ name: req.body.name, price: req.body.price });
  // TODO: remove the stale cached list here
  return res.status(201).json(event);
});

module.exports = router;
