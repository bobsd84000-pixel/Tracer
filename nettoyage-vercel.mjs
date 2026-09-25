// Nettoyage des doublons Vercel (équipe Bulk D)
// Mode test par défaut : affiche la liste, ne supprime rien.
// Lancer :   VERCEL_TOKEN=xxx node nettoyage-vercel.mjs
// Supprimer : VERCEL_TOKEN=xxx SUPPRIMER=1 node nettoyage-vercel.mjs

const TOKEN = process.env.VERCEL_TOKEN;
const TEAM = 'team_Dka2NSTNr3WBSLUzzwl4iJmI';
const SUPPRIMER = process.env.SUPPRIMER === '1';

// Projets à ne JAMAIS supprimer (en ligne ou utilisés)
const GARDER = new Set([
  'lumik-shop-6kem', 'lumik-shop', 'lumik-saas-landing', 'lumik-marketplace-landing',
  'lumik-mode-landing', 'lumik-boutique-art-japonais', 'lumik-v6-214',
  'traverse-bivouac-v4', 'sursaut-landing-v82', 'nuvo-landing', 'nuvo-app',
  'bulkdirect-landing', 'bulk-direct', 'bulkdirect-cotation', 'crucix-landing',
  'amorce-landing', 'obscura-landing', 'gravity-landing', 'tiroir-caisse-devis',
  'scrap-proxy', 'tracer', 'reddit-harvest', 'ecc', 'pic-2-code',
]);

if (!TOKEN) { console.error('VERCEL_TOKEN manquant.'); process.exit(1); }
const h = { Authorization: `Bearer ${TOKEN}` };

// Récupère tous les projets (pagination)
async function tousLesProjets() {
  const liste = [];
  let apres = '';
  while (true) {
    const r = await fetch(`https://api.vercel.com/v10/projects?teamId=${TEAM}&limit=100${apres}`, { headers: h });
    const d = await r.json();
    liste.push(...d.projects);
    if (!d.pagination?.next) break;
    apres = `&until=${d.pagination.next}`;
  }
  return liste;
}

const projets = await tousLesProjets();
const noms = new Set(projets.map((p) => p.name));

// Doublon = "nom-xxxx" (suffixe 4 caractères) dont le "nom" de base existe aussi
const doublons = projets.filter((p) => {
  if (GARDER.has(p.name)) return false;
  const m = p.name.match(/^(.+)-[a-z0-9]{4}$/);
  return m && noms.has(m[1]);
});

console.log(`${projets.length} projets, ${doublons.length} doublons :\n`);
doublons.forEach((p) => console.log('  -', p.name));

if (!SUPPRIMER) {
  console.log('\nMode test : rien supprimé. Relance avec SUPPRIMER=1 pour effacer.');
  process.exit(0);
}

for (const p of doublons) {
  const r = await fetch(`https://api.vercel.com/v9/projects/${p.id}?teamId=${TEAM}`, { method: 'DELETE', headers: h });
  console.log(r.ok ? `Supprimé : ${p.name}` : `Échec (${r.status}) : ${p.name}`);
}
