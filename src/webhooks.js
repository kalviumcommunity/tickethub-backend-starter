// TASK 3 — Safe payment webhook (5 marks)
//
// A payment provider POSTs events like
//   { "id": "evt_1", "type": "payment.succeeded", "orderId": "o1" }
// to /webhooks/payments. Anyone could fake this request, and the provider may send
// the same event twice. Implement handleWebhook(req, res):
//
//   1. Verify the signature. The header 'x-webhook-signature' looks like  sha256=<hex>.
//      Compute HMAC-SHA256 of req.body (a raw Buffer — app.js already provides it)
//      using WEBHOOK_SECRET, and compare with crypto.timingSafeEqual.
//      Wrong signature -> 401 { error: 'Invalid signature' }
//   2. Only after it is verified:  const event = JSON.parse(req.body)
//   3. If event.id is already in _processedIds -> 200 { status: 'already_processed' } and stop
//   4. Otherwise add event.id to _processedIds
//   5. Reply 200 { status: 'received' } FIRST, then call handleEvent(event) inside setImmediate

const crypto = require('crypto');
const { WEBHOOK_SECRET } = require('./config');
const { handleEvent } = require('./eventHandlers');

const _processedIds = new Set(); // ids of events we already handled

function handleWebhook(req, res) {
  // TODO: implement steps 1-5 above. This stub trusts everyone.
  const event = JSON.parse(req.body);
  handleEvent(event);
  return res.status(200).json({ status: 'received' });
}

module.exports = { handleWebhook, _processedIds };
