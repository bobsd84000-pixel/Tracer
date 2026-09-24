# Tracer

Contrôle de sécurité des skills d'agents IA avec [SkillSpector](https://github.com/NVIDIA/skillspector) (NVIDIA).

## Fonctionnement

- Les skills vont dans `skills/<nom-du-skill>/SKILL.md`.
- À chaque push / pull request, le workflow `.github/workflows/skillspector.yml` scanne chaque skill.
- Résultat : rapport visible dans la page du job + rapports téléchargeables (artifact `skillspector-reports`).
- Le contrôle échoue si un skill est jugé à risque (score > 50) ou si le scan plante.

## En local

```bash
uv tool install git+https://github.com/NVIDIA/skillspector.git
scripts/scan-skills.sh              # scanne ./skills
scripts/scan-skills.sh ~/mes-skills # scanne un autre dossier
```

Par défaut le scan est statique (`--no-llm`, gratuit, sans clé API).
Pour ajouter l'analyse IA : `SKILLSPECTOR_ARGS="" ANTHROPIC_API_KEY=... SKILLSPECTOR_PROVIDER=anthropic scripts/scan-skills.sh`

## Site web + API

L'API lance le programme `skillspector` : il doit être installé sur la machine.
Vercel ne l'a pas, donc sur Vercel seule la page s'affiche et `/api/scan` répond une erreur.
Pour un site complet, utiliser Docker (VPS, Render, Fly.io…) :

```bash
docker build -t tracer .
docker run -p 3000:3000 tracer   # puis http://localhost:3000
```

Sans Docker (SkillSpector installé) : `npm start`. Tests : `npm test`.
L'API n'accepte que des URL `https://github.com/<compte>/<dépôt>`.
