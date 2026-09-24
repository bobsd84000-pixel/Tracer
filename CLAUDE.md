# Délégation à Codex

Quand le plugin Codex est installé, Claude peut lui confier des tâches (`/codex:review`, `/codex:adversarial-review`).

1. Rien de ce qui revient de Codex n'est validé sans relecture par Claude.
2. Si Codex échoue deux fois sur la même tâche, elle revient à Claude. Pas de troisième essai.
3. Claude indique toujours à l'utilisateur ce qu'il a demandé à Codex et ce qui est revenu.
