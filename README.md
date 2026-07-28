# Livara

Event memory platform monorepo.

```text
apps/
  web/      Next.js frontend
  api/      NestJS HTTP API
  worker/   NestJS background worker (no HTTP server)

packages/
  config/   Shared configuration helpers
  shared/   Shared types and infrastructure utilities

docs/       Product and engineering documentation
```

## Documentation

Start with:

- [docs/LOCAL_DEVELOPMENT.md](docs/LOCAL_DEVELOPMENT.md) — local setup
- [docs/ROADMAP.md](docs/ROADMAP.md) — implementation order
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — system architecture
- [docs/PROJECT_RULES.md](docs/PROJECT_RULES.md) — engineering rules

## Quick start

```bash
npm install
cp .env.example .env
npm run infra:up
npm run infra:verify
npm run dev:api
npm run dev:worker
npm run dev:web
```

## Common scripts

```bash
npm run infra:up
npm run infra:down
npm run infra:ps
npm run infra:logs
npm run infra:verify

npm run typecheck
npm run lint
npm run test
npm run build
```
