// GIVEN — do not modify. What to do once a webhook event is trusted.
const { orders } = require('./data');

const handled = []; // ids of events that were actually processed (tests read this)

function handleEvent(event) {
  handled.push(event.id);
  if (event.type === 'payment.succeeded') {
    const order = orders.find((o) => o.id === event.orderId);
    if (order) order.status = 'paid';
  }
}

module.exports = { handleEvent, handled };
