const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
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
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fake-skillspector-'));
  fs.writeFileSync(path.join(dir, 'skillspector'), '#!/bin/sh\nexec sleep 5\n', { mode: 0o755 });
  const { PATH, SCAN_TIMEOUT_MS } = process.env;
  process.env.PATH = `${dir}${path.delimiter}${PATH}`;
  process.env.SCAN_TIMEOUT_MS = '200';
  try {
    const r = await post({ skillPath: 'https://github.com/a/b' });
    assert.strictEqual(r.code, 504);
    assert.deepStrictEqual(r.body, { success: false, error: 'Scan timed out' });
  } finally {
    process.env.PATH = PATH;
    if (SCAN_TIMEOUT_MS === undefined) delete process.env.SCAN_TIMEOUT_MS;
    else process.env.SCAN_TIMEOUT_MS = SCAN_TIMEOUT_MS;
    fs.rmSync(dir, { recursive: true, force: true });
  }
  console.log('OK : tous les tests API passent');
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
