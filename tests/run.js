// GIVEN — do not modify. Run with: npm test
const http = require('http');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { ACCESS_SECRET, WEBHOOK_SECRET } = require('../src/config');
const app = require('../src/app');
const db = require('../src/db');
const cache = require('../src/cache');
const { orders } = require('../src/data');
const { _processedIds } = require('../src/webhooks');
const { handled } = require('../src/eventHandlers');

const tok = (sub, role) => jwt.sign({ sub, role }, ACCESS_SECRET, { algorithm: 'HS256', expiresIn: '1h' });
const ALICE = tok('u1', 'member'), BOB = tok('u2', 'member'), ADMIN = tok('u3', 'admin');
const auth = (t) => ({ Authorization: `Bearer ${t}` });

let server, port;
function call(method, path, { headers = {}, json, raw } = {}) {
  return new Promise((resolve, reject) => {
    const h = { ...headers };
    let payload = raw;
    if (json !== undefined) { payload = JSON.stringify(json); h['Content-Type'] = 'application/json'; }
    if (raw !== undefined) h['Content-Type'] = 'application/json';
    const req = http.request({ hostname: '127.0.0.1', port, path, method, headers: h }, (res) => {
      let d = '';
      res.on('data', (c) => (d += c));
      res.on('end', () => { let body = d; try { body = JSON.parse(d); } catch {} resolve({ status: res.statusCode, headers: res.headers, body }); });
    });
    req.on('error', reject);
    if (payload !== undefined) req.write(payload);
    req.end();
  });
}
const sign = (raw) => 'sha256=' + crypto.createHmac('sha256', WEBHOOK_SECRET).update(raw).digest('hex');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

let passed = 0, failed = 0;
function check(ok, msg) { if (ok) { passed++; console.log(`  ✓ ${msg}`); } else { failed++; console.log(`  ✗ ${msg}`); } }
async function safe(fn) { try { await fn(); } catch (e) { failed++; console.log(`  ✗ crashed: ${e.message}`); } }

async function main() {
  server = app.listen(0); port = server.address().port;

  console.log('\nTask 1 — requireRole');
  await safe(async () => {
    check((await call('GET', '/admin/orders', { headers: auth(ADMIN) })).status === 200, 'admin can open /admin/orders (200)');
    const r = await call('GET', '/admin/orders', { headers: auth(ALICE) });
    check(r.status === 403 && r.body.error && r.body.error.code === 'FORBIDDEN', 'member gets 403 FORBIDDEN on /admin/orders');
    check((await call('GET', '/admin/orders')).status === 401, 'no token gets 401');
    const p = await call('POST', '/events', { headers: auth(BOB), json: { name: 'X', price: 1 } });
    check(p.status === 403, 'member cannot create an event (403)');
  });

  console.log('\nTask 2 — ownership check (IDOR)');
  await safe(async () => {
    check((await call('GET', '/orders/o1', { headers: auth(ALICE) })).status === 200, 'alice reads her own order (200)');
    const r = await call('GET', '/orders/o1', { headers: auth(BOB) });
    check(r.status === 403 && r.body.error && r.body.error.code === 'FORBIDDEN', "bob reading alice's order gets 403 FORBIDDEN");
    check((await call('GET', '/orders/o1', { headers: auth(ADMIN) })).status === 200, 'admin can read any order (200)');
    const n = await call('GET', '/orders/o999', { headers: auth(BOB) });
    check(n.status === 404 && n.body.error && n.body.error.code === 'NOT_FOUND', 'missing order gets 404 NOT_FOUND');
  });

  console.log('\nTask 3 — idempotent POST /orders');
  await safe(async () => {
    const body = { eventId: 'e1', qty: 3 };
    const miss = await call('POST', '/orders', { headers: auth(ALICE), json: body });
    check(miss.status === 400 && miss.body.error && miss.body.error.code === 'IDEMPOTENCY_KEY_REQUIRED', 'no Idempotency-Key gets 400 IDEMPOTENCY_KEY_REQUIRED');
    const before = orders.length;
    const a = await call('POST', '/orders', { headers: { ...auth(ALICE), 'Idempotency-Key': 'k-1' }, json: body });
    check(a.status === 201 && a.body.id, 'new key creates an order (201)');
    const b = await call('POST', '/orders', { headers: { ...auth(ALICE), 'Idempotency-Key': 'k-1' }, json: body });
    check(orders.length === before + 1, 'repeating the same key creates NO second order');
    check(b.status === 201 && b.body.id === a.body.id, 'repeat returns the same status and the same order id');
    const c = await call('POST', '/orders', { headers: { ...auth(ALICE), 'Idempotency-Key': 'k-2' }, json: body });
    check(c.status === 201 && c.body.id !== a.body.id && orders.length === before + 2, 'a different key creates a new order');
  });

  console.log('\nTask 5 — webhook');
  await safe(async () => {
    _processedIds.clear(); handled.length = 0;
    const raw = JSON.stringify({ id: 'evt_1', type: 'payment.succeeded', orderId: 'o2' });
    const bad = await call('POST', '/webhooks/payments', { headers: { 'x-webhook-signature': 'sha256=' + '0'.repeat(64) }, raw });
    check(bad.status === 401, 'wrong signature gets 401');
    const none = await call('POST', '/webhooks/payments', { raw });
    check(none.status === 401, 'missing signature gets 401');
    await wait(30);
    check(handled.length === 0, 'rejected requests are never processed');
    const ok = await call('POST', '/webhooks/payments', { headers: { 'x-webhook-signature': sign(raw) }, raw });
    check(ok.status === 200 && ok.body.status === 'received', 'valid signature gets 200 { status: "received" }');
    await wait(30);
    check(handled.length === 1 && orders.find((o) => o.id === 'o2').status === 'paid', 'event is processed and the order becomes paid');
    const dup = await call('POST', '/webhooks/payments', { headers: { 'x-webhook-signature': sign(raw) }, raw });
    await wait(30);
    check(dup.status === 200 && dup.body.status === 'already_processed', 'same event again gets "already_processed"');
    check(handled.length === 1, 'duplicate event is NOT processed twice');
  });

  console.log('\nTask 6 — cache the event list');
  await safe(async () => {
    cache.clear(); db.queryCount = 0;
    const a = await call('GET', '/events');
    check(a.headers['x-cache'] === 'MISS' && Array.isArray(a.body), '1st GET /events is X-Cache: MISS');
    const b = await call('GET', '/events');
    check(b.headers['x-cache'] === 'HIT', '2nd GET /events is X-Cache: HIT');
    check(db.queryCount === 1, 'the database was queried only once for two reads');
    await call('POST', '/events', { headers: auth(ADMIN), json: { name: 'New Show', price: 100 } });
    const c = await call('GET', '/events');
    check(c.headers['x-cache'] === 'MISS' && c.body.some((e) => e.name === 'New Show'), 'after POST /events the cache is cleared and the new event shows');
  });

  console.log('\nTask 4 — login rate limit');
  await safe(async () => {
    const good = await call('POST', '/auth/login', { json: { username: 'alice', password: 'alice-pass' } });
    check(good.status === 200 && good.body.token, 'correct login works (200 + token)');
    const codes = [];
    for (let i = 0; i < 5; i++) codes.push((await call('POST', '/auth/login', { json: { username: 'alice', password: 'wrong' } })).status);
    check(codes.every((c) => c === 401), 'first 5 wrong passwords get 401 (the correct login did not count)');
    const six = await call('POST', '/auth/login', { json: { username: 'alice', password: 'wrong' } });
    check(six.status === 429, '6th wrong attempt gets 429');
    check(six.body.error && six.body.error.code === 'RATE_LIMITED', '429 body has error.code RATE_LIMITED');
    check(Number(six.headers['retry-after']) > 0, '429 has a Retry-After header');
  });

  server.close();
  console.log(`\n  RESULT: ${passed} passed, ${failed} failed`);
  console.log(failed === 0 ? '✓ All tests passed!' : '✗ Some tests failed — keep going.');
  process.exit(failed === 0 ? 0 : 1);
}
main();
