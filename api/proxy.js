// Proxy en lecture seule : sert uniquement si le navigateur bloque un appel (CORS).
// Liste blanche stricte pour éviter que le proxy serve à autre chose.
const HOTES = ['dns.google', 'rdap.org', 'crt.sh', 'ipwho.is'];

module.exports = async (req, res) => {
  let cible;
  try { cible = new URL(req.query.url); }
  catch (e) { return res.status(400).json({ erreur: 'url invalide' }); }

  if (cible.protocol !== 'https:' || !HOTES.includes(cible.hostname)) {
    return res.status(403).json({ erreur: 'hôte non autorisé' });
  }

  try {
    const r = await fetch(cible, {
      headers: { accept: 'application/json, application/rdap+json' },
      signal: AbortSignal.timeout(20000)
    });
    const corps = await r.text();
    res.setHeader('content-type', 'application/json; charset=utf-8');
    res.setHeader('cache-control', 's-maxage=300');
    return res.status(r.status).send(corps);
  } catch (e) {
    return res.status(502).json({ erreur: 'source injoignable' });
  }
};
