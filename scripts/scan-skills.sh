#!/usr/bin/env bash
# Scanne chaque skill (dossier contenant un SKILL.md) avec SkillSpector.
# Usage : scripts/scan-skills.sh [dossier_skills] [dossier_rapports]
# Sortie : 0 = tout est OK, 1 = au moins un skill à risque ou en erreur.
set -uo pipefail

SKILLS_DIR="${1:-skills}"
REPORTS_DIR="${2:-skillspector-reports}"
EXTRA_ARGS="${SKILLSPECTOR_ARGS:---no-llm}"

mkdir -p "$REPORTS_DIR"
status=0
count=0

while IFS= read -r skill_md; do
  skill_dir="$(dirname "$skill_md")"
  rel="${skill_dir#"$SKILLS_DIR"}"; rel="${rel#/}"
  name="$(echo "${rel:-$(basename "$skill_dir")}" | tr '/' '_')"
  count=$((count + 1))
  echo "==> Scan de $skill_dir"

  # shellcheck disable=SC2086
  skillspector scan "$skill_dir" $EXTRA_ARGS --format markdown --output "$REPORTS_DIR/$name.md"
  code=$?

  case $code in
    0) echo "    OK" ;;
    1) echo "    RISQUE détecté (voir $REPORTS_DIR/$name.md)"; status=1 ;;
    *) echo "    ERREUR de scan (code $code)"; status=1 ;;
  esac
done < <(find "$SKILLS_DIR" -name SKILL.md -type f 2>/dev/null | sort)

if [ "$count" -eq 0 ]; then
  echo "Aucun SKILL.md trouvé dans $SKILLS_DIR, rien à scanner."
fi

exit $status
