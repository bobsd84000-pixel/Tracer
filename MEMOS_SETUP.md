# Memos Setup

Service de prise de notes open-source auto-hébergé.

## Démarrage

```bash
docker-compose up -d memos
```

## Accès

- URL: `http://localhost:5230`
- Données: Volume `memos_data` (persistant)

## Arrêt

```bash
docker-compose down
```

## Logs

```bash
docker-compose logs -f memos
```
