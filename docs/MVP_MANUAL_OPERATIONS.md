# Livara Manual MVP Operations

**Project:** Livara

**Document Type:** Temporary Operational Guide

**Status:** TEMPORARY — this document describes the manual operational mode, not the long-term architecture.

> This mode exists so Livara can serve its first customers today, before the
> documented roadmap phases (Prisma, authentication, Upload Windows, direct R2
> upload, dashboards) are implemented. Nothing in this document overrides
> `docs/ARCHITECTURE.md`, `docs/DATABASE.md`, `docs/API.md` or
> `docs/PROJECT_RULES.md` — those remain the target contracts.

---

# 1. What the Manual MVP Is

The smallest real Livara vertical slice:

```text
Operator (CLI)                Guest (phone)
─────────────                 ─────────────
create album                  open /a/<guestToken>
copy guest URL / QR           see event info
open/close uploads            pick photos
set upload expiration         upload without registration
list uploaded media           see progress + result
delete unwanted media
```

Everything lives inside the existing applications:

```text
apps/api/src/mvp/        Isolated NestJS MvpModule (vertical slice)
apps/web/src/app/a/      Guest experience route /a/[guestToken]
scripts/mvp/cli.mjs      Operator CLI
```

---

# 2. Temporary Components (and What Replaces Them)

| Temporary component | Location | Why temporary | Replaced by |
|---|---|---|---|
| JSON file store (`mvp-store.json`) | `apps/api/src/mvp/store/` | PostgreSQL/Prisma is Phase 3 and PostgreSQL infrastructure may be unavailable locally | Prisma + PostgreSQL (Roadmap Phase 3), behind the same `MvpStore`-style interface |
| Local filesystem storage adapter | `apps/api/src/mvp/storage/local-fs.storage.ts` | Used only when R2 credentials are not configured | `R2StorageAdapter` (already implemented, auto-selected when R2 env vars are set) and later direct-to-R2 signed uploads (Phase 11) |
| Upload bytes passing through the API | guest upload endpoint | Direct-to-R2 signed upload requires R2 + upload intent flow (Phase 11) | Direct-to-R2 upload with upload intents (Phases 11–12) |
| `uploadEnabled` / `uploadExpiresAt` manual flags | MVP album record | Manual operator switch for the manual business mode only; the target architecture derives upload availability from Upload Windows and forbids `Album.uploadsEnabled` | Upload Windows (Phase 9). These fields exist only in the MVP store and must not be carried into the Prisma schema |
| Operator key header + CLI | `operator-key.guard.ts`, `scripts/mvp/` | Real authentication is Phases 5–7 | Super Admin / Organizer authentication and dashboards (Phases 5–8, 17, 24) |
| In-memory upload rate limit | `upload-rate-limit.guard.ts` | Redis-based limiting is not required to run the MVP today | Redis-backed rate limiting (later phases) |
| Guest media file route | guest controller | Serves private media without R2 signed URLs | Signed/temporary URL delivery (Phases 11, 15) |

All MVP runtime data (store file, uploads, QR PNGs) lives under the gitignored
`data/` directory and is never committed.

---

# 3. Environment

Copy `.env.example` to `.env` and set:

```text
MVP_DATA_DIR=data/mvp          # runtime data root (gitignored)
MVP_UPLOAD_DIR=data/mvp/uploads
MVP_OPERATOR_KEY=<random hex>  # required for operator commands
MVP_PUBLIC_WEB_URL=http://localhost:3000
```

Generate an operator key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Operator endpoints stay disabled (`503 OPERATOR_API_DISABLED`) while
`MVP_OPERATOR_KEY` is empty, so they can never silently become a public API.

**Storage selection:** when all five `R2_*` variables are set, uploads go to
the private Cloudflare R2 bucket. When they are empty, the local filesystem
fallback under `MVP_UPLOAD_DIR` is used so the flow can be tested without
credentials. The bucket is never public; media is served only through the
API route that verifies album access via the guest token.

PostgreSQL/Redis are not required for this mode. In development the API logs
a warning and continues if they are unreachable; in production their absence
remains fatal.

---

# 4. Running

```bash
npm install
npm run dev:api    # terminal 1 — API on :3001
npm run dev:web    # terminal 2 — Web on :3000
```

---

# 5. Operator Commands

```bash
# Create an album (prints guest URL, saves QR PNG to data/mvp/qr/)
npm run mvp:album:create -- "Aziz & Madina"
npm run mvp:album:create -- "Aziz & Madina" --expires 2026-09-20T18:00:00Z

# List albums / show a guest URL
npm run mvp:album:list
npm run mvp:album:url -- <albumId|guestToken|idPrefix>

# Open / close uploads
npm run mvp:uploads:open -- <albumId> [--expires <iso-date>]
npm run mvp:uploads:close -- <albumId>

# Review uploads (prints preview URLs) and remove unwanted photos
npm run mvp:media:list -- <albumId>
npm run mvp:media:delete -- <albumId> <mediaId>

# Regenerate the QR PNG for an album
npm run mvp:qr -- <albumId>
```

The CLI talks to the running API using `MVP_OPERATOR_KEY`, so start
`npm run dev:api` first.

Example:

```text
$ npm run mvp:album:create -- "Aziz & Madina"

  Album created

  Title:        Aziz & Madina
  Album ID:     1a2b3c4d-...
  Guest URL:    http://localhost:3000/a/Nn4cRk1uL2...
  Uploads:      OPEN
  Expires:      no expiration
  Created:      2026-08-03T12:00:00.000Z
  QR code:      C:\...\data\mvp\qr\1a2b3c4d-....png
```

---

# 6. Guest Flow

1. Guest opens `MVP_PUBLIC_WEB_URL/a/<guestToken>` (link or QR).
2. The page shows Livara branding, the event title and a short explanation.
3. Guest picks photos (mobile-first picker), sees the selected count, taps
   "Add your memories", watches progress, and gets a clear success state.
4. Closed/expired albums show a friendly "not accepting new memories" state.
5. Unknown tokens show an album-not-found state.

---

# 7. Upload Security (Server-Side)

Enforced in `apps/api/src/mvp/` regardless of anything the client claims:

- Guest token must resolve to an existing album (strict token format check
  first; unknown/malformed tokens → `404 ALBUM_NOT_FOUND`).
- `uploadEnabled` must be true (`403 UPLOADS_CLOSED`) and `uploadExpiresAt`,
  when set, must be in the future (`403 UPLOADS_EXPIRED`).
- Max 10 files per request; max 25 MB per file (multer hard limit + explicit
  per-file check).
- File content is validated by magic bytes (JPEG/PNG/WebP/GIF/HEIC/HEIF);
  filename extension and browser MIME type are never trusted. Unsupported
  content is rejected per file without failing the whole batch.
- Storage keys are generated server-side
  (`albums/{albumId}/originals/{mediaId}.{ext}`); original filenames are kept
  only as sanitized metadata. Keys are validated against traversal on every
  storage operation.
- Basic in-memory per-IP rate limit on the upload endpoint (no Redis
  dependency; deliberately generous because event guests share networks).
- No directory listing exists; files are served only through
  `GET /api/v1/mvp/guest/albums/:guestToken/media/:mediaId/file` after the
  album/media relationship is verified.

---

# 8. API Surface (Temporary, Namespaced)

All MVP endpoints live under `/api/v1/mvp/...` so they cannot be confused
with the documented long-term contract in `docs/API.md`:

```text
Guest (public):
  GET  /api/v1/mvp/guest/albums/:guestToken
  GET  /api/v1/mvp/guest/albums/:guestToken/media
  POST /api/v1/mvp/guest/albums/:guestToken/uploads          (multipart "files")
  GET  /api/v1/mvp/guest/albums/:guestToken/media/:mediaId/file

Operator (requires x-livara-mvp-operator-key header):
  POST   /api/v1/mvp/operator/albums
  GET    /api/v1/mvp/operator/albums
  GET    /api/v1/mvp/operator/albums/:albumId
  GET    /api/v1/mvp/operator/albums/:albumId/media
  DELETE /api/v1/mvp/operator/albums/:albumId/media/:mediaId
  POST   /api/v1/mvp/operator/albums/:albumId/uploads/open
  POST   /api/v1/mvp/operator/albums/:albumId/uploads/close
```

When the documented phases are implemented, these endpoints are removed and
replaced by the contract in `docs/API.md`.

---

# 9. Decommissioning Checklist

When Roadmap Phases 3–16 land:

1. Migrate any live MVP albums/media metadata from `data/mvp/mvp-store.json`
   into PostgreSQL, and local files (if any) into R2.
2. Delete `apps/api/src/mvp/`, `scripts/mvp/`, the `mvp:*` npm scripts and
   the `MVP_*` environment variables.
3. Keep `/a/<token>` guest URLs working by mapping guest tokens to
   `Album.publicIdentifier` (or serve a redirect) so printed QR codes for
   pilot events survive the migration.
