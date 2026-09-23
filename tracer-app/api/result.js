// GET /api/result?id=xxxxxxxxxxxx  →  résultat JSON ou { statut: "en_cours" }
const OWNER = "bobsd84000-pixel";
const REPO = "Tracer";

module.exports = async (req, res) => {
  const id = String((req.query || {}).id || "");
  if (!/^[a-f0-9]{12}$/.test(id)) return res.status(400).json({ erreur: "Identifiant invalide" });
  if (!process.env.GH_TOKEN) return res.status(500).json({ erreur: "GH_TOKEN manquant dans Vercel" });

  const r = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/contents/results/${id}.json?ref=results`,
    {
      headers: {
        Authorization: `Bearer ${process.env.GH_TOKEN}`,
        Accept: "application/vnd.github.raw+json",
        "User-Agent": "tracer",
      },
    }
  );
  res.setHeader("Cache-Control", "no-store");
  if (r.status === 404) return res.status(200).json({ statut: "en_cours" });
  if (!r.ok) return res.status(502).json({ erreur: `GitHub indisponible (${r.status})` });
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.status(200).send(await r.text());
};