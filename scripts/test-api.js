const assert = require('assert');
const fs = require('fs');
const http = require('http');
const net = require('net');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const scan = require('../api/scan');

const call = (fn, req) => new Promise((resolve) => {
  const res = {
    status(code) { this.code = code; return this; },
    json(body) { resolve({ code: this.code, body }); },
  };
  fn(req, res);
});

const post = (body) => call(scan, { method: 'POST', body });

const freePort = () => new Promise((resolve, reject) => {
  const s = net.createServer().on('error', reject).listen(0, () => {
    const { port } = s.address();
    s.close(() => resolve(port));
  });
});

const startServer = (port) => new Promise((resolve, reject) => {
  const child = spawn(process.execPath, [path.join(__dirname, '..', 'server.js')], {
    env: { ...process.env, PORT: String(port) }, stdio: ['ignore', 'pipe', 'inherit'],
  });
  const timer = setTimeout(() => { child.kill(); reject(new Error('server start timeout')); }, 5000);
  child.on('exit', (code) => { clearTimeout(timer); reject(new Error(`server exited ${code}`)); });
  child.stdout.on('data', (d) => {
    if (String(d).includes(`http://localhost:${port}`)) { clearTimeout(timer); resolve(child); }
  });
});

const rawPost = (port, payload) => new Promise((resolve, reject) => {
  const r = http.request({
    host: '127.0.0.1', port, path: '/api/scan', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) },
  }, (res) => {
    let data = '';
    res.on('data', (c) => { data += c; });
    res.on('end', () => resolve({ code: res.statusCode, body: JSON.parse(data) }));
  });
  r.setTimeout(5000, () => r.destroy(new Error('request timeout')));
  r.on('error', reject);
  r.end(payload);
});

(async () => {
  assert.strictEqual((await post({ skillPath: '/etc' })).code, 400);
  assert.strictEqual((await post({ skillPath: '--help' })).code, 400);
  assert.strictEqual((await post({ skillPath: 'https://evil.com/a/b' })).code, 400);
  assert.strictEqual((await post({ skillPath: 'https://github.com/a/b', format: 'x' })).code, 400);
  assert.strictEqual((await call(scan, { method: 'GET' })).code, 405);
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

  const port = await freePort();
  const child = await startServer(port);
  try {
    const r = await rawPost(port, JSON.stringify({ skillPath: 'x'.repeat(20 * 1024) }));
    assert.strictEqual(r.code, 413);
    assert.deepStrictEqual(r.body, { error: 'Body too large' });
  } finally {
    child.kill();
  }
  console.log('OK : tous les tests API passent');
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
