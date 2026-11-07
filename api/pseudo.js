// Module « pseudo » : cherche un pseudo sur ~470 sites.
// Logique reprise de Sherlock (github.com/sherlock-project/sherlock, licence MIT).
// La liste des sites est lue en direct sur le dépôt Sherlock (toujours à jour).

const SOURCE_SITES = 'https://raw.githubusercontent.com/sherlock-project/sherlock/master/sherlock_project/resources/data.json';
const SOURCE_EXCLUS = 'https://raw.githubusercontent.com/sherlock-project/sherlock/refs/heads/exclusions/false_positive_exclusions.txt';

const PSEUDO_OK = /^[A-Za-z0-9._-]{2,40}$/;
const PARALLELE = 40;          // requêtes en même temps
const DELAI_SITE = 6000;       // délai max par site (ms)
const DELAI_TOTAL = 50000;     // on rend la main avant la limite Vercel
const CACHE_LISTE = 3600000;   // liste des sites gardée 1 h

const AGENT = 'Mozilla/5.0 (X11; Linux x86_64; rv:129.0) Gecko/20100101 Firefox/129.0';

// Pages anti-robot connues (Cloudflare, AWS, PerimeterX) : résultat non fiable
const PAGES_BLOCAGE = [
  '.loading-spinner{visibility:hidden}body.no-js .challenge-running{display:none}',
  '<span id="challenge-error-text">',
  'AwsWafIntegration.forceRefreshToken',
  '"perimeterxIdentifiers",{enumerable:'
];

let cache = { quand: 0, sites: null };

const remplir = (v, pseudo) => {
  if (typeof v === 'string') return v.split('{}').join(pseudo);
  if (Array.isArray(v)) return v.map((x) => remplir(x, pseudo));
  if (v && typeof v === 'object') {
    return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, remplir(x, pseudo)]));
  }
  return v;
};

async function chargerSites() {
  if (cache.sites && Date.now() - cache.quand < CACHE_LISTE) return cache.sites;

  const r = await fetch(SOURCE_SITES, { signal: AbortSignal.timeout(10000) });
  if (!r.ok) throw new Error('liste des sites injoignable');
  const data = await r.json();
  delete data.$schema;

  let exclus = [];
  try {
    const e = await fetch(SOURCE_EXCLUS, { signal: AbortSignal.timeout(5000) });
    if (e.ok) exclus = (await e.text()).split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
  } catch { /* pas grave : on garde tous les sites */ }

  const sites = Object.entries(data)
    .filter(([nom, s]) => !s.isNSFW && !exclus.includes(nom))
    .map(([nom, s]) => ({ nom, ...s }));

  cache = { quand: Date.now(), sites };
  return sites;
}

// Vérifie un site. Renvoie 'trouve', 'absent', 'invalide' ou 'erreur'.
async function verifierSite(site, pseudo) {
  if (site.regexCheck) {
    try { if (!new RegExp(site.regexCheck).test(pseudo)) return { etat: 'invalide' }; }
    catch { /* règle illisible : on teste quand même */ }
  }

  const url = remplir(site.url, pseudo.replace(/ /g, '%20'));
  const sonde = site.urlProbe ? remplir(site.urlProbe, pseudo) : url;
  const types = [].concat(site.errorType);
  const methode = site.request_method || (types.length === 1 && types[0] === 'status_code' ? 'HEAD' : 'GET');
  const corps = site.request_payload ? JSON.stringify(remplir(site.request_payload, pseudo)) : undefined;

  let r, texte = '';
  try {
    r = await fetch(sonde, {
      method: methode,
      headers: { 'user-agent': AGENT, ...(corps ? { 'content-type': 'application/json' } : {}), ...(site.headers || {}) },
      body: corps,
      redirect: types.includes('response_url') ? 'manual' : 'follow',
      signal: AbortSignal.timeout(DELAI_SITE)
    });
    if (methode !== 'HEAD') texte = await r.text();
  } catch {
    return { etat: 'erreur' };
  }

  if (PAGES_BLOCAGE.some((p) => texte.includes(p))) return { etat: 'erreur' };

  let etat = null;
  if (types.includes('message')) {
    const msgs = [].concat(site.errorMsg || []);
    etat = msgs.some((m) => texte.includes(m)) ? 'absent' : 'trouve';
  }
  if (types.includes('status_code') && etat !== 'absent') {
    const codes = [].concat(site.errorCode ?? []);
    etat = codes.includes(r.status) || r.status < 200 || r.status >= 300 ? 'absent' : 'trouve';
  }
  if (types.includes('response_url') && etat !== 'absent') {
    etat = r.status >= 200 && r.status < 300 ? 'trouve' : 'absent';
  }
  if (!etat) return { etat: 'erreur' };

  return { etat, url };
}

async function chercher(pseudo, sites, delaiTotal = DELAI_TOTAL) {
  const fin = Date.now() + delaiTotal;
  const trouves = [];
  let verifies = 0, erreurs = 0, i = 0;

  const ouvrier = async () => {
    while (i < sites.length && Date.now() < fin) {
      const site = sites[i++];
      const res = await verifierSite(site, pseudo);
      if (res.etat === 'invalide') continue;
      verifies++;
      if (res.etat === 'erreur') erreurs++;
      if (res.etat === 'trouve') trouves.push({ site: site.nom, url: res.url });
    }
  };
  await Promise.all(Array.from({ length: PARALLELE }, ouvrier));

  trouves.sort((a, b) => a.site.localeCompare(b.site));
  return { verifies, erreurs, trouves, partiel: i < sites.length };
}

const handler = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ erreur: 'méthode non autorisée' });

  const pseudo = String(req.query.u || '').replace(/^@/, '').trim();
  if (!PSEUDO_OK.test(pseudo)) {
    return res.status(400).json({ erreur: 'pseudo invalide (2 à 40 caractères : lettres, chiffres, . _ -)' });
  }

  const debut = Date.now();
  let sites;
  try {
    sites = await chargerSites();
  } catch (e) {
    return res.status(502).json({ erreur: e.message });
  }

  const r = await chercher(pseudo, sites);
  res.setHeader('cache-control', 's-maxage=600');
  return res.status(200).json({
    pseudo,
    sites: sites.length,
    ...r,
    duree_ms: Date.now() - debut,
    source: 'Sherlock (MIT)'
  });
};

module.exports = handler;
module.exports.verifierSite = verifierSite;
module.exports.chercher = chercher;
