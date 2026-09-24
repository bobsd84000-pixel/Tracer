const assert = require('assert');
const scan = require('../api/scan');
const result = require('../api/result');

const call = (fn, req) => new Promise((resolve) => {
  const res = {
    status(code) { this.code = code; return this; },
    json(body) { resolve({ code: this.code, body }); },
  };
  fn(req, res);
});

const post = (body) => call(scan, { method: 'POST', body });

(async () => {
  assert.strictEqual((await post({ skillPath: '/etc' })).code, 400);
  assert.strictEqual((await post({ skillPath: '--help' })).code, 400);
  assert.strictEqual((await post({ skillPath: 'https://evil.com/a/b' })).code, 400);
  assert.strictEqual((await post({ skillPath: 'https://github.com/a/b', format: 'x' })).code, 400);
  assert.strictEqual((await call(scan, { method: 'GET' })).code, 405);
  assert.strictEqual((await call(result, { method: 'GET', query: { reportId: '../../etc/x' } })).code, 400);
  assert.strictEqual((await call(result, { method: 'GET', query: { reportId: 'absent' } })).code, 404);
  console.log('OK : tous les tests API passent');
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
