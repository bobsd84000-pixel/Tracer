# Skills

Mets chaque skill dans son propre dossier, avec un fichier `SKILL.md` :

```
skills/
  mon-skill/
    SKILL.md
    (scripts, fichiers annexes...)
```

À chaque push ou pull request qui touche ce dossier, GitHub Actions scanne tous les skills avec
[SkillSpector](https://github.com/NVIDIA/skillspector). Le contrôle passe au rouge si un skill a un score de risque > 50.
