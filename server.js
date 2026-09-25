const http = require('http');
const fs = require('fs');
const path = require('path');
const scan = require('./api/scan');

const PORT = process.env.PORT || 3000;
const INDEX = path.join(__dirname, 'public', 'index.html');
const MAX_BODY = 10 * 1024;

const wrap = (res) => {
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (body) => {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(body));
  };
  return res;
};

http.createServer((req, res) => {
  wrap(res);
  const url = new URL(req.url, 'http://localhost');
  req.query = Object.fromEntries(url.searchParams);

  if (url.pathname === '/api/scan') {
    let raw = '';
    let tooLarge = false;
    req.on('data', (chunk) => {
      if (tooLarge) return;
      raw += chunk;
      if (raw.length > MAX_BODY) { tooLarge = true; raw = ''; }
    });
    req.on('end', () => {
      if (tooLarge) return res.status(413).json({ error: 'Body too large' });
      try {
        req.body = raw ? JSON.parse(raw) : {};
      } catch {
        return res.status(400).json({ error: 'Invalid JSON body' });
      }
      scan(req, res);
    });
    return;
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  fs.createReadStream(INDEX).pipe(res);
}).listen(PORT, () => console.log(`Tracer sur http://localhost:${PORT}`));
