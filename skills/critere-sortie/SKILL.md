---
name: critere-sortie
description: Fixe et déclare le critère de sortie d'une tâche technique (code, PR, déploiement, script, intégration d'API ou de CLI externe). Utilise cette skill au début de toute tâche multi-étapes qui produit du code ou un déploiement, et avant de dire « fait », « prêt », « terminé » ou « prêt à merger » — surtout si la tâche dépend d'un service externe (API, CLI, réseau, secrets).
---

# Critère de sortie

But : ne jamais déclarer « fait » sur une validation partielle.

## Au début

1. **Dépendances externes** : lister chaque API, CLI, secret, service.
2. **Tester l'accès tout de suite** : lancer l'install ou un appel minimal. Noter le résultat réel.
3. **Niveau visé** (annoncer, ne pas demander si évident) :
   - (a) Syntaxe
   - (b) Syntaxe + mock
   - (c) Syntaxe + exécution réelle
   Par défaut : (c). Descendre seulement si une erreur réelle l'impose.
4. **Cible de déploiement** : vérifier que chaque dépendance existe là où le code tournera (ex. Vercel serverless = Node seul, pas de CLI Python).

## Règles

- « Bloqué » = erreur réelle copiée à côté. Sans erreur, c'est « non testé ».
- Une PR créée n'est pas une tâche finie.
- Un scanner ou un linter qui signale ≠ un problème confirmé : vérifier les alertes graves.

## À la fin (format strict)

```
✅ Fait : [ce qui a été réellement exécuté + résultat]
❌ Bloqué : [dépendance — erreur réelle]
⚠️ Prérequis : [ce qui manque dans l'env cible]
Niveau atteint : a|b|c
```

« Fait » seulement si le niveau atteint = niveau visé.

## Exemple

```
✅ Fait : skillspector 2.12.0 installé, scan-skills.sh OK, /api/scan HTTP 200
❌ Bloqué : aucun
⚠️ Prérequis : /api/scan impossible sur Vercel (pas de CLI Python) → scan via GitHub Actions
Niveau atteint : c
```
