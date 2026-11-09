# TicketHub Backend

A small Express API for selling event tickets. Six things are missing — finish them.

```bash
npm install
npm test
```

All tests fail/misbehave until you finish the tasks. See `question.md` for the task list.
Everything runs in memory: no database, no Redis, no keys, no internet.

| File | Task |
|---|---|
| `src/middleware/requireRole.js` | 1 |
| `src/routes/orders.js` | 2 and 3 |
| `src/middleware/loginLimiter.js` | 4 |
| `src/webhooks.js` | 5 |
| `src/routes/events.js` | 6 |
