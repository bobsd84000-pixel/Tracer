const fs = require('fs');
const path = require('path');

module.exports = (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ erreur: 'Method not allowed' });
  }

  try {
    const indexPath = path.join(__dirname, '../index.html');
    const html = fs.readFileSync(indexPath, 'utf8');
    res.setHeader('content-type', 'text/html; charset=utf-8');
    res.setHeader('cache-control', 'public, max-age=3600');
    return res.send(html);
  } catch (e) {
    return res.status(500).json({ erreur: 'Impossible de servir index.html' });
  }
};
