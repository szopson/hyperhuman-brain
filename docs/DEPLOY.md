# Deploy

## Vercel

Repo gotowe do deploy. Wymaga jednorazowego `vercel link` lub `vercel deploy`.

```bash
# zainstaluj CLI (raz na maszynę)
npm i -g vercel

# z poziomu repo
vercel              # interactive: link/create project + preview deploy
vercel --prod       # production deploy
```

## Env vars do ustawienia w Vercel

| Key | Where | Why |
|---|---|---|
| `ANTHROPIC_API_KEY` | Production + Preview | Phase A extraction. Bez tego `npm run extract` failuje (UI działa, bo czyta `analysis-full.json` z repo) |

```bash
vercel env add ANTHROPIC_API_KEY production
```

## Co Vercel zobaczy

- Next.js 16.2.6 detected automatically
- `npm run build` jako build command
- `analysis-full.json` w `data/cases/stock-hurt/outputs/` jest commitowany (poza `data/cases/*/outputs/*` w gitignore — wystarczy `git add -f`)
- Brak runtime API routes (na razie), więc deploy to czyste static + RSC

## Architecture deploy

UI nie wymaga API key w runtime — `loadAnalysis()` czyta plik z repo. Ekstrakcja działa **lokalnie** przed commit-em. Continuous refresh (planowane v0.2) dorzuci API route z cronem.

## Bootstrap dla nowego case

```bash
mkdir -p data/cases/{new-client}/inputs data/cases/{new-client}/outputs
cp transcript.txt data/cases/{new-client}/inputs/conversation-transcript.txt
# update INPUT i OUTPUT w scripts/test-extract.ts i scripts/test-full-pipeline.ts
ANTHROPIC_API_KEY=... npm run extract
npm run pipeline
git add -f data/cases/{new-client}/outputs/analysis-full.json
vercel --prod
```
