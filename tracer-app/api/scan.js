// POST /api/scan  { url }  →  { id }
// Lance le workflow GitHub "Scan API" sur le repo demandé.
const crypto = require("crypto");
const OWNER = "bobsd84000-pixel";
const REPO = "Tracer";

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ erreur: "Utilise POST" });
  if (!process.env.GH_TOKEN) return res.status(500).json({ erreur: "GH_TOKEN manquant dans Vercel" });

  const url = String((req.body || {}).url || "").trim().replace(/\.git$/, "").replace(/\/+$/, "");
  if (!/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+$/.test(url)) {
    return res.status(400).json({ erreur: "Colle un lien de la forme https://github.com/owner/repo" });
  }

  const id = crypto.randomBytes(6).toString("hex");
  const r = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/actions/workflows/scan-api.yml/dispatches`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GH_TOKEN}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "tracer",
      },
      body: JSON.stringify({ ref: "main", inputs: { url, id } }),
    }
  );
  if (r.status !== 204) return res.status(502).json({ erreur: `GitHub a refusé le lancement (${r.status})` });
  res.status(200).json({ id });
};