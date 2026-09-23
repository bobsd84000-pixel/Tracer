#!/usr/bin/env python3
# Scanne toutes les skills d'un repo cloné et écrit un résultat JSON.
# Usage : scan_api.py <dossier_repo> <fichier_json>
import datetime, json, os, pathlib, re, subprocess, sys

src = pathlib.Path(sys.argv[1])
out = pathlib.Path(sys.argv[2])
res = {
    "statut": "termine",
    "url": os.environ.get("URL", ""),
    "date": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    "skills": [],
}

dossiers = sorted({p.parent for p in src.rglob("SKILL.md") if ".git" not in p.parts})[:10]
if not dossiers:
    res.update(statut="erreur", message="Aucun SKILL.md dans ce repo")

rapports = pathlib.Path("/tmp/rapports")
rapports.mkdir(exist_ok=True)

for d in dossiers:
    nom = str(d.relative_to(src)) if d != src else src.name
    rapport = rapports / (nom.replace("/", "_") + ".md")
    try:
        subprocess.run(
            ["skillspector", "scan", str(d), "--no-llm", "--format", "markdown", "--output", str(rapport)],
            capture_output=True, text=True, timeout=300,
        )
    except subprocess.TimeoutExpired:
        res["skills"].append({"nom": nom, "erreur": "Scan trop long (plus de 5 min)"})
        continue
    if not rapport.exists():
        res["skills"].append({"nom": nom, "erreur": "Scan impossible"})
        continue
    t = rapport.read_text(errors="ignore")
    score = re.search(r"\|\s*Score\s*\|\s*(\d+)", t)
    sev = re.search(r"\|\s*Severity\s*\|\s*(\w+)", t)
    regles = {}
    for code in re.findall(r"^### \S+ (?:CRITICAL|HIGH): (\w+)", t, re.M):
        regles[code] = regles.get(code, 0) + 1
    res["skills"].append({
        "nom": nom,
        "score": int(score.group(1)) if score else 0,
        "severite": sev.group(1) if sev else "INCONNUE",
        "high": len(re.findall(r"^### \S+ (?:CRITICAL|HIGH):", t, re.M)),
        "medium": len(re.findall(r"^### \S+ MEDIUM:", t, re.M)),
        "regles": dict(sorted(regles.items(), key=lambda x: -x[1])[:6]),
    })

scores = [s["score"] for s in res["skills"] if "score" in s]
res["score_max"] = max(scores) if scores else None
out.write_text(json.dumps(res, ensure_ascii=False, indent=2))
print(json.dumps(res, ensure_ascii=False))