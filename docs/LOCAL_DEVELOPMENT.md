# Livara Local Development

**Project:** Livara

**Document Type:** Local Development Guide

**Related Phase:** Phase 2 — Local Infrastructure

> This document describes how to reproduce the local development environment for API and Worker work.
>
> Product and architecture contracts remain defined in the primary documentation set under `docs/`.

---

## Prerequisites

- Node.js 20+
- npm 10+
- Docker Desktop (or another Docker Engine with Compose v2)

---

## 1. Clone and install

```bash
git clone <repository-url>
cd photo-album-v2
npm install
```

---

## 2. Prepare environment variables

```bash
cp .env.example .env
```

Root `.env` is loaded by API and Worker through `envFilePath: ['.env', '../../.env']`.

You may also copy values into:

```text
apps/api/.env
apps/worker/.env
```

Required for local API/Worker startup:

```text
DATABASE_URL
REDIS_URL
```

Optional for R2 verification:

```text
R2_ACCOUNT_ID
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_BUCKET_NAME
R2_ENDPOINT
```

If R2 variables are empty, applications still start. Real R2 connectivity remains unverified until credentials are provided.

Never commit `.env` or real secrets.

---

## 3. Start local infrastructure

PostgreSQL and Redis run through Docker Compose:

```bash
npm run infra:up
```

Useful commands:

```bash
npm run infra:ps
npm run infra:logs
npm run infra:down
```

Default local services:

| Service    | Image              | Host port | Credentials / notes        |
|------------|--------------------|-----------|----------------------------|
| PostgreSQL | postgres:16-alpine | 5432      | user/password/db: `livara` |
| Redis      | redis:7-alpine     | 6379      | no password by default     |

Persistent Docker volumes:

```text
livara_postgres_data
livara_redis_data
```

---

## 4. Verify infrastructure connectivity

```bash
npm run infra:verify
```

Expected without R2 credentials:

```text
PostgreSQL: ok
Redis: ok
R2: skipped (credentials not configured — real R2 connectivity remains unverified)
```

Expected with complete R2 credentials:

```text
PostgreSQL: ok
Redis: ok
R2: ok
```

---

## 5. Start applications

In separate terminals:

```bash
npm run dev:api
npm run dev:worker
npm run dev:web
```

API listens on `API_PORT` (default `3001`).

Worker starts as a NestJS application context without an HTTP server and verifies the same PostgreSQL/Redis connectivity on boot.

---

## 6. Quality checks

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

---

## Notes

- Prisma is intentionally not configured in Phase 2.
- BullMQ queues are intentionally not configured in Phase 2.
- Authentication, albums, guests, media, exports, notifications, and billing belong to later roadmap phases.
- Cloudflare R2 is the object-storage target from architecture docs. Local development does not emulate R2 with a substitute storage architecture.
