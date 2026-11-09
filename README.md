# TicketHub Backend

A small Express API for selling event tickets. Four things are missing — finish them.

```bash
npm install
npm test
```

All tests fail/misbehave until you finish the tasks. See `question.md` for the task list.
Everything runs in memory: no database, no Redis, no keys, no internet.

| File | Task |
|---|---|
| `src/middleware/requireRole.js` and `src/routes/orders.js` (GET) | 1 |
| `src/routes/orders.js` (POST) | 2 |
| `src/webhooks.js` | 3 |
| `src/routes/events.js` | 4 |
