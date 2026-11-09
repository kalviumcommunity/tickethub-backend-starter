// GIVEN — do not modify.
// Pretend database for events. Every call to getEvents() is one "database query".
// Tests read queryCount to see how many times your code hit the database.

const { events, nextEventId } = require('./data');

const db = {
  queryCount: 0,
  getEvents() {
    db.queryCount++;
    return events.map((e) => ({ ...e }));
  },
  createEvent({ name, price }) {
    const event = { id: nextEventId(), name, price };
    events.push(event);
    return { ...event };
  },
};

module.exports = db;
