# Livara Project Rules

**Project:** Livara

**Document Type:** Engineering Rules

**Product Stage:** MVP

**Document Version:** 1.0

> 🇷🇺
> Этот документ определяет обязательные правила разработки Livara.
>
> Он не описывает продуктовые требования заново. Источниками продуктовой и технической истины являются соответствующие документы проекта.
>
> Код не должен молча изменять утверждённую архитектуру.

---

# 1. Purpose

These rules exist to keep Livara:

- Secure
- Predictable
- Maintainable
- Consistent
- Testable
- Scalable
- Safe for customer Media

Every implementation decision should follow the approved product and architecture documents.

---

# 2. Documentation Hierarchy

The project documentation is:

```text
VISION.md
BUSINESS_MODEL.md
BRAND.md
USER_FLOW.md
PRD.md
ARCHITECTURE.md
DATABASE.md
API.md
PROJECT_RULES.md
ROADMAP.md
```

Each document owns a different responsibility.

```text
VISION
→ Why Livara exists

BUSINESS_MODEL
→ How Livara operates commercially

BRAND
→ How Livara communicates and presents itself

USER_FLOW
→ How Users interact with Livara

PRD
→ What the product must do

ARCHITECTURE
→ How the system is structured

DATABASE
→ How persistent product state is modeled

API
→ How clients interact with the backend

PROJECT_RULES
→ How implementation must be written

ROADMAP
→ In what order the product is built
```

---

# 3. Source of Truth

The following ownership must remain explicit:

```text
Product requirements
→ PRD

System architecture
→ ARCHITECTURE

Persistent data model
→ DATABASE

HTTP contract
→ API

Implementation rules
→ PROJECT_RULES

Binary Media
→ Cloudflare R2

Persistent product state
→ PostgreSQL

Queue coordination
→ Redis / BullMQ
```

Do not create competing sources of truth.

---

# 4. Architecture Changes

Code must not silently introduce architectural changes.

Examples:

```text
Adding uploadsEnabled
Creating RefreshToken entity
Moving Media binaries into PostgreSQL
Allowing Organizer to edit protected Album fields
Using Redis as permanent state
Changing Guest into User
```

If implementation reveals that an architectural decision must change:

```text
1. Identify the conflict
2. Update the relevant documentation
3. Review related documents
4. Update implementation
```

Do not make the code and documentation intentionally disagree.

---

# 5. MVP Principle

Build the smallest implementation that correctly satisfies the approved MVP.

Do not build speculative systems merely because they may be useful later.

Avoid premature:

```text
Microservices
Event sourcing
Complex CQRS
Custom distributed infrastructure
Multiple databases
Premature abstractions
```

Future compatibility matters.

Future complexity does not need to exist today.

---

# 6. Repository Structure

The repository should clearly separate applications and shared packages.

Recommended conceptual structure:

```text
livara/
├── apps/
│   ├── web/
│   ├── api/
│   └── worker/
│
├── packages/
│   ├── config/
│   └── shared/
│
├── docs/
│   ├── VISION.md
│   ├── BUSINESS_MODEL.md
│   ├── BRAND.md
│   ├── USER_FLOW.md
│   ├── PRD.md
│   ├── ARCHITECTURE.md
│   ├── DATABASE.md
│   ├── API.md
│   ├── PROJECT_RULES.md
│   ├── ROADMAP.md
│   └── LOCAL_DEVELOPMENT.md
│
└── ...
```

Exact tooling may change, but application boundaries must remain clear.

---

# 7. Applications

Primary runtime applications:

```text
web
api
worker
```

### web

Next.js frontend.

### api

NestJS HTTP API.

### worker

Background processing runtime using the backend domain/infrastructure code where appropriate.

Do not duplicate business rules independently between API and Worker.

---

# 8. TypeScript

All primary application code should use TypeScript.

Avoid:

```text
any
```

unless there is a concrete justified boundary where the type cannot reasonably be known.

Prefer:

```text
unknown
```

for untrusted values, followed by validation/narrowing.

TypeScript types do not replace runtime validation.

---

# 9. Strict TypeScript

Projects should use strict TypeScript configuration where practical.

Important compiler protections should not be disabled merely to silence errors.

Do not solve type problems with widespread:

```ts
as any
```

or unsafe type assertions.

Fix the model instead.

---

# 10. Naming

Use consistent naming.

TypeScript:

```text
PascalCase
→ classes
→ types
→ interfaces
→ enums

camelCase
→ variables
→ functions
→ fields
```

Environment variables:

```text
UPPER_SNAKE_CASE
```

API paths:

```text
kebab-case
```

Examples:

```text
/upload-windows
/audit-logs
/rotate-public-identifier
```

---

# 11. Domain Language

Code should use the same terminology as product documentation.

Preferred:

```text
Album
Guest
GuestSession
UploadWindow
Media
Export
Notification
AuditLog
Organizer
SuperAdmin
```

Avoid creating synonyms such as:

```text
EventBook
VisitorToken
PhotoRoom
UploadPeriodManager
```

for concepts already defined by the product.

Shared language reduces ambiguity.

---

# 12. Backend Module Structure

NestJS backend should use domain modules.

Core modules:

```text
AuthModule
UsersModule
AlbumsModule
GuestsModule
UploadWindowsModule
MediaModule
ExportsModule
NotificationsModule
AdminModule
AuditModule
StorageModule
QueueModule
HealthModule
```

Modules may contain:

```text
Controller
Service
Repository / data-access layer where justified
DTOs
Guards
Policies
Domain helpers
Tests
```

Avoid one global service containing unrelated product logic.

---

# 13. Controllers

Controllers handle HTTP concerns.

Responsibilities:

```text
Receive request
Resolve authentication context
Validate DTO
Call application/domain service
Return response
```

Controllers should not contain complex business logic.

Avoid:

```ts
@Controller(...)
class MediaController {
  async upload() {
    // hundreds of lines of product logic
  }
}
```

Business rules belong in services/domain logic.

---

# 14. Services

Services implement application and domain behavior.

Examples:

```text
CreateUploadWindow
CreateUploadIntent
CompleteUpload
HideMedia
CreateExport
ReassignAlbum
RecoverAlbum
```

Services must enforce authorization-sensitive invariants even when frontend behavior appears to guarantee them.

---

# 15. Prisma Access

Prisma should not be called arbitrarily throughout the entire application.

Database access should remain inside clearly defined backend layers.

Avoid mixing:

```text
HTTP logic
Database queries
R2 calls
Queue calls
Business rules
```

inside one controller.

---

# 16. Prisma Schema

`schema.prisma` must implement the approved logical model from `DATABASE.md`.

Before adding or removing a model or important field, verify whether the database documentation must change.

Forbidden architectural shortcuts include reintroducing:

```text
RefreshToken
Album.uploadsEnabled
UploadWindow.isActive
```

as competing persistent concepts.

---

# 17. Prisma Migrations

Every production schema change must use a versioned migration.

Never manually modify production tables as the normal development workflow.

Expected flow:

```text
Change schema.prisma
      ↓
Generate migration
      ↓
Review SQL
      ↓
Test migration
      ↓
Commit migration
      ↓
Deploy
```

Destructive migrations require explicit review.

---

# 18. Production Database

Never use destructive development commands against production.

Commands equivalent to:

```text
reset database
force schema recreation
drop all data
```

must never be part of normal production deployment.

Production data is customer data.

---

# 19. Database Transactions

Use transactions when multiple database changes form one logical atomic operation.

Examples:

```text
Reassign Album
+
AuditLog
```

or:

```text
Create Export
+
ExportItems
```

Do not hold database transactions open while performing long external network operations.

---

# 20. External Systems and Transactions

PostgreSQL, R2 and Redis do not share one database transaction.

Do not write code pretending they do.

Use persistent recoverable states.

Example:

```text
Media = PENDING
      ↓
R2 upload
      ↓
Media = UPLOADED
      ↓
Queue processing
```

Failures must leave a state that can be reconciled.

---

# 21. DTOs

Every external request uses explicit DTO validation.

Do not accept raw database models as request DTOs.

Bad:

```ts
updateAlbum(body: Album)
```

Better conceptually:

```ts
updateAlbum(body: AdminUpdateAlbumDto)
```

DTOs define what the caller is allowed to submit.

---

# 22. Response DTOs

Prisma models must not be returned directly from controllers.

Map database records to safe response DTOs.

This prevents accidental exposure of fields such as:

```text
passwordHash
refreshTokenHash
tokenHash
storageKey
deletedAt
internal metadata
```

when they are not part of the public contract.

---

# 23. Validation

Runtime validation is mandatory at trust boundaries.

Validate:

```text
Bodies
Query parameters
Route parameters
Headers where relevant
File metadata
Pagination cursors
Timezone identifiers
Enums
```

Frontend validation is UX.

Backend validation is security and correctness.

---

# 24. Unknown Fields

Mutation DTOs should reject or safely ignore unknown fields according to one consistent policy.

For security-sensitive mutation endpoints, rejecting unexpected fields is preferred.

Example:

Organizer submits:

```json
{
  "name": "Chilla",
  "startsAt": "...",
  "endsAt": "...",
  "organizerId": "..."
}
```

`organizerId` must not accidentally be persisted.

---

# 25. Authentication

Authenticated Users:

```text
SUPER_ADMIN
ORGANIZER
```

use the User Session model.

Guests use:

```text
Guest
+
GuestSession
```

These authentication contexts must remain separate.

---

# 26. Session Rule

User authentication state is represented by:

```text
Session
```

Do not introduce a parallel persistent RefreshToken table without an approved architecture change.

Raw credentials must never be stored.

Store only safe token hashes where required.

---

# 27. GuestSession Rule

Guest session credentials must be treated as authentication secrets.

Never store:

```text
raw Guest session token
```

Persist only:

```text
tokenHash
```

or an equivalent safe representation.

GuestSession must resolve to:

```text
Guest
→ Album
```

before Album-scoped Guest operations are authorized.

---

# 28. Browser Token Storage

Authentication secrets must not be placed in browser `localStorage` as the standard authentication architecture.

Use the approved secure session/cookie/token strategy.

Frontend convenience must not weaken authentication design.

---

# 29. Authorization

Authentication answers:

```text
Who are you?
```

Authorization answers:

```text
May you perform this operation on this resource?
```

Both checks are required.

Example:

```text
Authenticated Organizer
+
Album.organizerId = User.id
```

---

# 30. Ownership Checks

Every Organizer Album operation must validate ownership server-side.

Never rely on:

```text
Frontend route protection
Hidden buttons
Album ID secrecy
Previous successful request
```

Example:

```text
GET /albums/:albumId/media
```

must verify the authenticated Organizer currently owns/manages that Album.

---

# 31. Super Admin

`SUPER_ADMIN` authorization must be explicit.

Do not infer Super Admin status from:

```text
email address
frontend route
special query parameter
database ID
```

Use authenticated User role and Session validity.

---

# 32. Protected Album Fields

During managed MVP, Organizer must not directly modify protected Album information such as:

```text
title
eventDate
organizerId
publicIdentifier
```

Only approved Super Admin operations may modify protected fields.

Organizer DTOs must not contain these fields.

---

# 33. Public Identifier

`Album.publicIdentifier` is Guest entry information.

It is not:

```text
Organizer authentication
Admin authentication
Storage authorization
```

It must be:

```text
Unique
Difficult to guess
Stable
```

Rotation is an explicit protected operation.

---

# 34. Upload Availability

The authoritative upload rule is derived from:

```text
Album availability
+
UploadWindow time
+
GuestSession validity
+
Platform restrictions
```

Do not create:

```text
Album.uploadsEnabled
UploadWindow.isActive
Redis upload-open flag
Frontend upload-open state
```

as competing authorities.

---

# 35. Time

Persistent timestamps are stored consistently in UTC.

Album stores an IANA timezone:

```text
Asia/Tashkent
```

Frontend may display local event time.

Backend must not depend on the server machine's local timezone for product rules.

---

# 36. Upload Window

Current Upload Window activity is derived from:

```text
startsAt <= now
AND
now < endsAt
```

Do not require a scheduled job to flip the window open or closed.

Scheduler failure must not change whether uploads are legally available.

---

# 37. Upload Window Overlap

MVP should reject overlapping Upload Windows for the same Album.

Validation must happen server-side.

Do not rely only on calendar UI restrictions.

---

# 38. Media Binary Transfer

Large Media binaries must upload directly to object storage.

Preferred:

```text
Device
   ↓
R2
```

Control flow:

```text
Device
   ↓
NestJS
   ↓
Temporary authorization
```

Avoid:

```text
Device
   ↓
NestJS receives 200 MB video
   ↓
NestJS uploads same 200 MB to R2
```

unless a specific future workflow requires server-side proxying.

---

# 39. Upload Intent

Before direct upload, backend must validate:

```text
Album
GuestSession
Guest ownership
UploadWindow
File metadata
File size
File type
Rate limits
Storage restrictions
```

Only then create:

```text
Media = PENDING
```

and issue temporary storage authorization.

---

# 40. Storage Keys

Storage object keys are generated by trusted backend code.

Never use raw user filename as trusted object path.

Good conceptual structure:

```text
albums/{albumId}/originals/{mediaId}
```

User filename may be stored separately as metadata.

---

# 41. R2 Credentials

Permanent R2 credentials must never reach:

```text
Browser
Guest
Organizer frontend
API response
Git repository
Logs
```

Clients receive only narrowly scoped temporary access where needed.

---

# 42. Upload Completion

Upload completion must verify the expected object exists before moving Media into the next lifecycle state.

Do not trust:

```text
Client says upload succeeded
```

as sufficient proof.

Completion must be safe to retry.

---

# 43. Media State

Three dimensions must remain separate:

```text
status
visibility
deletedAt
```

Do not combine them.

Examples:

```text
READY + HIDDEN + not deleted
```

is valid.

```text
PROCESSING + VISIBLE + not deleted
```

may temporarily exist but must not appear in Guest Gallery until READY.

---

# 44. MediaStatus

Expected lifecycle:

```text
PENDING
UPLOADED
PROCESSING
READY
FAILED
```

Workers should perform explicit state transitions.

Do not reset unrelated Media fields while updating status.

---

# 45. MediaVisibility

Moderation uses:

```text
VISIBLE
HIDDEN
```

Hiding Media must not modify:

```text
status
storage object
upload source
```

unless another explicit operation requires it.

---

# 46. Media Deletion

Deletion uses:

```text
deletedAt
```

Soft deletion should immediately remove Media from normal product queries.

Physical R2 deletion happens according to retention/cleanup policy.

---

# 47. Gallery Query

Guest Gallery must only expose Media matching product visibility rules.

Core condition:

```text
status = READY
visibility = VISIBLE
deletedAt IS NULL
```

plus valid Album access.

Never fetch all Media and filter sensitive records only in frontend code.

---

# 48. Pagination

Large collections must be paginated.

Use cursor pagination for:

```text
Gallery
Organizer Media
Notifications
Audit Logs
Large Admin lists
```

Clients must not request unlimited datasets.

---

# 49. Cursor

Cursor values are opaque client tokens.

Frontend should not construct database queries from cursor internals.

Stable ordering should use deterministic fields such as:

```text
createdAt
+
id
```

---

# 50. Media Processing

Expensive processing belongs in Worker processes.

Examples:

```text
Image optimization
Thumbnail generation
Metadata extraction
Video metadata processing
```

HTTP requests should enqueue work and return instead of waiting for expensive processing.

---

# 51. Media Validation

Do not trust client-declared:

```text
mimeType
extension
dimensions
duration
```

as authoritative.

Worker/backend must validate uploaded object properties before marking Media READY.

---

# 52. Worker Rules

Workers must be:

```text
Retry-safe
Idempotent where practical
Observable
Recoverable
```

A job retry must not create uncontrolled duplicate derivatives or archives.

---

# 53. Queue State

BullMQ job existence is not permanent product truth.

Bad:

```text
No BullMQ job
→ therefore Media does not need processing
```

Correct:

```text
PostgreSQL says Media = UPLOADED
→ processing may need reconciliation
```

---

# 54. Redis

Redis is allowed for:

```text
BullMQ
Cache
Rate limiting
Temporary coordination
```

Redis must not be the only location for:

```text
Album status
Upload Window configuration
Media lifecycle
Export outcome
User ownership
```

---

# 55. Reconciliation

The system should be able to detect stranded persistent work.

Examples:

```text
Media = UPLOADED
but no active processing job

Export = QUEUED
but job was lost
```

A reconciliation mechanism may requeue eligible records.

---

# 56. Exports

Large ZIP exports are asynchronous.

Forbidden:

```text
HTTP request
→ build huge ZIP synchronously
→ keep connection open
```

Required model:

```text
Create Export
→ QUEUED
→ Worker
→ READY
→ Temporary download authorization
```

---

# 57. Export Media

For:

```text
SELECTED_MEDIA
```

use relational:

```text
ExportItem
```

Do not store the authoritative selected Media list as an arbitrary JSON array.

---

# 58. Export Download

Store:

```text
storageKey
```

not permanent signed URLs.

Generate temporary download access after authorization.

---

# 59. Notifications

Notifications are persistent user-facing messages.

They are not Audit Logs.

High-frequency activity should be aggregated when appropriate.

Avoid:

```text
1 upload = 1 notification
```

for hundreds of event uploads.

---

# 60. Audit Logs

Audit Logs record sensitive administrative actions.

Audit records should be append-oriented.

Do not allow normal application code to rewrite historical Audit Logs.

Sensitive operations should record:

```text
actor
action
target
timestamp
safe metadata
```

---

# 61. Logging

Production logs should be structured.

Useful context:

```text
requestId
userId where safe
albumId where relevant
jobId
operation
error code
```

Never log secrets.

---

# 62. Forbidden Log Data

Do not log:

```text
Passwords
Access tokens
Refresh tokens
Guest session tokens
R2 credentials
Database passwords
Secret keys
Raw cookie values
```

Signed URLs should also be avoided in logs where possible.

---

# 63. Error Handling

Expected product errors should use stable application error codes.

Examples:

```text
ALBUM_NOT_FOUND
FORBIDDEN
UPLOAD_WINDOW_CLOSED
FILE_TOO_LARGE
MEDIA_NOT_READY
EXPORT_EXPIRED
SESSION_REVOKED
```

Do not expose raw database or infrastructure errors to clients.

---

# 64. Exceptions

Unexpected errors should:

```text
Be logged safely
Be reported to error monitoring
Return generic server error response
Preserve request correlation
```

Do not send stack traces to production clients.

---

# 65. HTTP Status

Use HTTP status codes consistently with `API.md`.

Application error codes provide product-level detail.

Example:

```text
403
+
UPLOAD_NOT_ALLOWED
```

rather than relying only on human-readable error messages.

---

# 66. Security by Default

All new backend endpoints should be treated as protected unless they are explicitly designed as public/Guest endpoints.

Do not create a route publicly first and plan to secure it later.

---

# 67. Public Endpoints

Public/Guest endpoints must expose the minimum necessary data.

Never expose internal models simply because the route is read-only.

Guest-safe responses are explicit DTOs.

---

# 68. Rate Limiting

Sensitive routes require appropriate rate limits.

Examples:

```text
Login
Guest session creation
Upload intent
Upload completion
Export creation
Admin mutations
```

Do not rely solely on IP because many Guests may share the same event network.

---

# 69. Secrets

Secrets belong in environment/deployment configuration.

Examples:

```text
DATABASE_URL
REDIS_URL
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
AUTH_SECRET
```

Never commit real secrets.

---

# 70. Environment Files

Allowed repository file:

```text
.env.example
```

It contains variable names and safe examples/placeholders.

Real:

```text
.env
.env.local
.env.production
```

must follow repository/deployment security policy and must not be committed when they contain secrets.

---

# 71. Git Ignore

At minimum, repository ignore rules should cover sensitive/local artifacts such as:

```text
.env
.env.local
.env.*.local
node_modules
build output
temporary files
logs
```

Do not rely on `.gitignore` after a secret has already been committed.

A leaked secret must be rotated.

---

# 72. CORS

Production CORS must explicitly allow required Livara origins.

Do not use credentialed:

```text
Access-Control-Allow-Origin: *
```

---

# 73. Cookies

Authentication cookies, where used, should apply appropriate:

```text
HttpOnly
Secure
SameSite
```

configuration.

Development and production may require different secure transport settings.

---

# 74. CSRF

Cookie-based authenticated mutations must account for CSRF.

Do not assume:

```text
HttpOnly = CSRF protection
```

Use the approved combination of:

```text
SameSite
Origin checks
CSRF tokens
```

where appropriate.

---

# 75. Passwords

Passwords must use an appropriate modern password hashing algorithm and configuration.

Never:

```text
Encrypt passwords reversibly
Store plaintext passwords
Log passwords
Email stored passwords back to Users
```

Password verification compares against the hash.

---

# 76. Frontend Responsibilities

Next.js frontend handles:

```text
Presentation
Interaction
Client-side UX validation
Upload progress
Gallery UI
Navigation
```

Frontend does not own:

```text
Authorization
Album ownership
Upload Window truth
Media validation
Session validity
```

---

# 77. Server and Client Components

Use server/client boundaries intentionally.

Do not make every Next.js component a client component by default.

Client components are appropriate where browser interaction is required.

Keep unnecessary JavaScript away from Guest pages where practical.

---

# 78. Guest Mobile Experience

Guest flows are mobile-first.

Implementation should account for:

```text
Slow networks
Unstable connections
Large camera files
Upload retries
Small screens
Touch interaction
```

Do not assume desktop broadband.

---

# 79. Upload UI

Frontend upload state is local UX state.

Example:

```text
SELECTED
UPLOADING
WAITING_FOR_PROCESSING
DONE
ERROR
```

These UI states do not replace backend:

```text
MediaStatus
```

The frontend must reconcile with server state.

---

# 80. Upload Retry

Network retries should not automatically create duplicate Media records.

Reuse existing `mediaId`/upload flow where the API contract allows.

Completion retries must be idempotent.

---

# 81. Optimistic UI

Optimistic UI is allowed only where failure can be safely reconciled.

Do not optimistically assume:

```text
Authorization changed
Media permanently deleted
Export ready
Upload Window accepted
```

without handling backend rejection.

---

# 82. API Client

Frontend should use a centralized API client layer rather than scattered raw requests with inconsistent behavior.

Shared concerns:

```text
Base URL
Authentication
Error parsing
Request IDs where applicable
Response typing
```

---

# 83. Shared Types

Shared types may be used when they represent stable cross-application contracts.

Do not import Prisma database models directly into frontend as API types.

Database model and public API contract are different layers.

---

# 84. Configuration

Operational limits belong in configuration where appropriate.

Examples:

```text
Maximum image size
Maximum video size
Signed URL lifetime
Session lifetime
Guest Session lifetime
Export retention
Soft-delete retention
Pagination limits
```

Do not scatter magic numbers across controllers and workers.

---

# 85. Constants

Domain constants should have one clear definition.

Avoid:

```text
100 MB in frontend
150 MB in API
120 MB in Worker
```

for the same product limit.

Frontend may consume safe public configuration where needed.

Backend remains authoritative.

---

# 86. Feature Flags

Do not introduce a complex feature-flag platform for MVP without a concrete need.

Simple environment-controlled rollout flags may be used for operationally risky features if necessary.

Feature flags must not become permanent undocumented product state.

---

# 87. Testing Strategy

Tests should focus on business-critical behavior.

Priority areas:

```text
Authentication
Authorization
Album ownership
Upload Window rules
GuestSession isolation
Media lifecycle
Media visibility
Soft deletion
Exports
Admin protected operations
```

---

# 88. Unit Tests

Use unit tests for isolated business rules where they provide value.

Examples:

```text
UploadWindow active calculation
Allowed Media state transition
Permission policy
Cursor helpers
```

Do not mock so aggressively that tests stop representing real behavior.

---

# 89. Integration Tests

Integration tests should verify important database/service behavior.

Examples:

```text
Organizer cannot access another Album
GuestSession cannot cross Albums
Overlapping Upload Windows rejected
Soft-deleted Media excluded
ExportItems belong to target Album
```

---

# 90. API Tests

Critical API flows should have end-to-end or integration-level coverage.

Especially:

```text
Login
Guest entry
Guest Session
Upload Intent
Upload completion
Gallery
Hide Media
Export creation
Admin reassignment
Recovery
```

---

# 91. Authorization Tests

Every sensitive resource type should include at least:

```text
Allowed owner case
Wrong owner case
Wrong role case
Unauthenticated case
Deleted/unavailable resource case where relevant
```

Authorization regressions are high priority.

---

# 92. Worker Tests

Workers should be tested for:

```text
Success
Retry
Duplicate execution
Missing object
Invalid Media
Database update failure
```

Idempotency behavior deserves explicit tests.

---

# 93. Migration Tests

Before production deployment, migrations must be tested against a representative database state.

Pay particular attention to:

```text
NOT NULL additions
Unique constraints
Enum changes
Foreign keys
Destructive column changes
```

---

# 94. Formatting and Linting

Repository should use automated:

```text
Formatting
Linting
Type checking
```

CI should detect violations.

Developers should not spend time manually debating formatting already handled by tooling.

---

# 95. CI

At minimum, CI should be capable of running:

```text
Install
Lint
Typecheck
Tests
Build
```

Migration validation should be included where appropriate.

Production deployment should not proceed from obviously failing builds.

---

# 96. Git Branches

Use focused branches for meaningful changes.

Examples:

```text
feature/guest-upload
feature/upload-windows
fix/export-retry
docs/database
```

Exact branch workflow may evolve with team size.

Avoid combining unrelated major features into one change.

---

# 97. Commits

Commits should describe meaningful changes.

Prefer:

```text
feat: add guest upload intent flow
fix: enforce album ownership on media download
docs: update upload window rules
```

Avoid meaningless commit history such as:

```text
update
fix
again
final-final
```

when practical.

---

# 98. Code Review

Changes affecting critical domains should be reviewed carefully.

High-risk areas:

```text
Authentication
Authorization
Database migrations
R2 deletion
Admin operations
Media lifecycle
Retention cleanup
Exports
```

Review architecture impact, not only syntax.

---

# 99. Dependency Rule

Add dependencies only when they solve a concrete problem.

Before adding a package, consider:

```text
Is it maintained?
Is it necessary?
Does the platform already solve this?
Does it introduce security risk?
Does it significantly increase frontend bundle size?
```

Avoid packages for trivial helpers.

---

# 100. Dependency Security

Keep dependencies reasonably current and monitor security advisories.

Critical vulnerabilities affecting:

```text
Authentication
Next.js
NestJS
File processing
Database
Storage
```

should receive priority.

Do not blindly upgrade production dependencies without testing.

---

# 101. Media Processing Dependencies

Libraries handling user-uploaded Media operate on untrusted input.

Treat image/video processing libraries as security-sensitive dependencies.

Use supported versions and limit resource consumption.

---

# 102. Resource Limits

Workers must account for:

```text
Memory
CPU
File size
Processing duration
Concurrency
```

Do not allow unlimited parallel video processing on one machine.

Worker concurrency should be configurable.

---

# 103. Timeouts

External operations should have reasonable timeouts where supported.

Examples:

```text
R2 operations
External HTTP requests
Long-running processing
```

A stalled external dependency should not indefinitely consume application resources.

---

# 104. Retry Policy

Retries should be intentional.

Retry appropriate transient failures.

Do not repeatedly retry permanent failures such as:

```text
Unsupported Media format
Missing required authorization
Invalid DTO
```

Use bounded retries and backoff for transient infrastructure failures.

---

# 105. Cleanup

Cleanup operations are destructive and require conservative rules.

Before deleting an R2 object, cleanup must establish persistent eligibility from PostgreSQL.

Do not delete based solely on:

```text
Filename
Queue state
Cache state
Age of object without product context
```

---

# 106. Soft Delete

Soft-deletable resources should be excluded from normal queries by consistent backend patterns.

Do not depend on every controller remembering:

```text
deletedAt: null
```

independently.

Centralize safe query patterns where practical.

---

# 107. Recovery

Recovery operations must restore product state deliberately.

Example:

```text
Recover Album
```

does not mean:

```text
Open uploads
Restore expired Export ZIPs
Make hidden Media visible
```

Independent states remain independent.

---

# 108. Album Reassignment

Reassignment changes:

```text
Album.organizerId
```

and should take effect immediately in authorization checks.

Do not cache Album ownership in a way that lets the previous Organizer retain access after reassignment.

---

# 109. Caching

Cache only when there is a demonstrated benefit.

Cache must not become authoritative.

A cache miss should degrade performance, not correctness.

Mutable authorization-sensitive information requires careful invalidation.

---

# 110. Storage Usage

Do not create unreliable storage counters updated independently in many code paths.

Authoritative usage should remain derivable from trusted Media/storage metadata.

Aggregated counters may be introduced as optimization with reconciliation support.

---

# 111. QR

QR codes represent Guest Album URLs.

Do not embed:

```text
Admin credentials
Organizer credentials
Storage credentials
Session tokens
```

inside QR codes.

Multiple designs may represent the same Album URL.

---

# 112. Privacy

Return only data required for the current actor and operation.

Guest responses should be especially minimal.

Do not expose Organizer account information through public Album endpoints.

---

# 113. Data Minimization

Do not collect fields merely because they might become useful later.

For MVP, Guest identity should remain lightweight.

Every new personal-data field should have a clear product purpose.

---

# 114. Production Data

Do not use real customer Media casually for:

```text
Development
Demos
Screenshots
Testing
```

Use generated/sample data.

Access to production customer data should be limited to legitimate operational needs.

---

# 115. Backups

Production PostgreSQL must have a backup strategy.

Backups should be tested for recoverability, not merely assumed to work because they exist.

Object storage recovery requires its own policy.

---

# 116. Observability

Production should provide enough information to diagnose:

```text
API failures
Worker failures
Queue backlog
Database problems
Storage problems
Upload failures
Export failures
```

Monitoring should focus on actionable signals.

---

# 117. Request Correlation

Requests should receive or propagate a correlation/request ID where practical.

Background jobs triggered by requests should preserve relevant safe identifiers for tracing.

Example:

```text
requestId
→ exportId
→ jobId
```

without propagating secrets.

---

# 118. Health Checks

Health endpoints must remain lightweight.

Liveness:

```text
Is the process alive?
```

Readiness:

```text
Can the application serve expected traffic?
```

Do not perform expensive storage operations on every health request.

---

# 119. Performance

Optimize based on real bottlenecks.

Known areas deserving early care:

```text
Guest Gallery
Direct uploads
Image thumbnails
Large Albums
Export generation
Database indexes
```

Do not optimize ordinary low-volume admin operations prematurely.

---

# 120. Database Queries

Avoid obvious N+1 query patterns.

Select only data required for the operation where practical.

Do not retrieve entire Album graphs for simple permission checks.

---

# 121. Large Album Rule

No implementation may assume an Album contains only a few dozen Media items.

Avoid:

```text
Load all Media
Sort in browser
Generate all signed URLs at once
```

Use pagination and bounded processing.

---

# 122. Download Rule

Normal Gallery browsing should use optimized derivatives where available.

Original files are reserved for operations requiring originals, such as:

```text
Organizer download
Export
```

This protects bandwidth and improves Guest performance.

---

# 123. API Compatibility

Changes to established API behavior should be reviewed for compatibility.

Do not silently:

```text
Rename fields
Change enum meanings
Remove response fields
Change authorization semantics
```

after clients depend on them.

Update `API.md` when contract changes.

---

# 124. Database Compatibility

Database changes must consider existing data.

Adding:

```text
required field
unique constraint
new relation
```

may require a data migration/backfill.

Schema correctness includes migration correctness.

---

# 125. Documentation with Code

A code change must update documentation when it changes an approved contract.

Examples:

```text
New API endpoint
New core entity
Changed Media lifecycle
Changed authorization rule
Changed Upload Window semantics
```

Documentation should not become historical fiction.

---

# 126. TODO Rule

TODO comments must describe a concrete unresolved task.

Good:

```text
TODO: requeue UPLOADED media older than reconciliation threshold
```

Bad:

```text
TODO: fix later
```

Critical security behavior must not be left as an indefinite TODO.

---

# 127. No Silent Failure

Do not catch errors and silently continue when product correctness depends on the operation.

Bad:

```ts
try {
  await createAuditLog();
} catch {}
```

For important operations, define whether failure should:

```text
Fail operation
Retry
Alert
Reconcile
```

---

# 128. No Fake Success

The API must not return success before required persistent state is established.

Example:

```text
Export request
```

may return `202 Accepted` after Export is persistently created.

It must not claim:

```text
READY
```

before the Worker completes.

---

# 129. Idempotency

Retryable operations should have explicit duplicate handling.

Important examples:

```text
Upload completion
Queue jobs
Notification aggregation
Cleanup
Selected admin mutations
```

Network retries are normal behavior, not exceptional behavior.

---

# 130. State Transitions

Lifecycle transitions should be explicit.

Do not scatter arbitrary assignments such as:

```ts
media.status = whatever;
```

through unrelated services.

Use controlled domain operations where practical.

---

# 131. Business Rules

Business rules belong in backend domain/application logic.

Examples:

```text
Can this Guest upload now?
Can this Organizer access this Album?
Can this Media be recovered?
Can this Export be downloaded?
```

Do not duplicate these rules independently across multiple controllers.

---

# 132. Frontend Business Rules

Frontend may mirror business rules for UX.

Example:

```text
Disable upload button when canUploadNow = false
```

But backend still performs the real check.

A modified frontend must not bypass product rules.

---

# 133. No Trust in IDs

Knowing:

```text
albumId
mediaId
exportId
guestId
```

does not prove access.

Every resource operation resolves authorization context.

---

# 134. No Trust in Client Roles

Ignore client claims such as:

```json
{
  "role": "SUPER_ADMIN"
}
```

Role comes from authenticated server-side identity.

---

# 135. No Trust in Client Time

Client clock must not decide whether Upload Window is open.

Use backend/server-controlled current time against persistent timestamps.

Frontend may show countdowns for UX only.

---

# 136. No Trust in Client File Type

File extension:

```text
.jpg
```

does not prove the object is an image.

Client MIME declaration also does not prove it.

Validate uploaded content before READY.

---

# 137. No Trust in Redis

Redis loss must not destroy Livara's understanding of:

```text
Who owns Album
Which Media exists
Whether Upload Window is open
Whether Export completed
```

Persistent state belongs in PostgreSQL/R2 according to responsibility.

---

# 138. No Permanent Signed URLs

Signed URLs are temporary capabilities.

Do not persist them as permanent resource fields.

Persist storage identity:

```text
storageKey
```

and generate temporary URLs when authorized.

---

# 139. No Raw Tokens

Never persist or log:

```text
Access token
Refresh token
Guest session token
Password
```

Raw authentication secrets exist only where operationally required and for the shortest practical lifetime.

---

# 140. No `uploadsEnabled`

Do not add:

```text
Album.uploadsEnabled
```

as upload authority.

Upload availability is derived.

This rule is intentionally explicit because reintroducing this boolean would recreate contradictory product state.

---

# 141. No `UploadWindow.isActive`

Do not persist current time-derived activity as:

```text
isActive
```

unless a future architecture change gives that field a different non-authoritative purpose.

For MVP:

```text
active = startsAt <= now < endsAt
```

---

# 142. No Standalone RefreshToken Model

Do not add a persistent:

```text
RefreshToken
```

entity alongside Session for MVP.

Refresh authentication lifecycle belongs to:

```text
Session
```

---

# 143. No Prisma Models in Frontend

Frontend must not depend directly on:

```text
@prisma/client
```

models as its public API contract.

Use API DTO types.

---

# 144. No Large Files Through API

Do not proxy normal large Guest Media uploads through NestJS.

Use direct object-storage upload authorization.

Exceptions require an explicit technical reason and review.

---

# 145. No Synchronous Large Exports

Do not build large Album ZIPs inside normal request-response lifecycle.

Exports use Worker jobs.

---

# 146. No Broad Cascade Deletes

Do not configure major entities so one accidental database delete can destroy the Album tree.

Be conservative with:

```text
ON DELETE CASCADE
```

Use cascades only for clearly dependent resources with understood semantics.

---

# 147. No Secret URLs in Git

Do not commit credentials embedded inside URLs.

Example:

```text
postgresql://user:password@...
redis://:password@...
```

Use environment variables.

---

# 148. No Security by UI

The following are not security mechanisms:

```text
Hidden button
Disabled input
Private frontend route
JavaScript condition
Unlisted Admin page
```

Security is enforced by trusted backend logic.

---

# 149. Definition of Done

A feature is not complete only because it works on the happy path.

Before considering a feature done, verify as applicable:

```text
Implementation
Validation
Authorization
Error behavior
Loading behavior
Empty state
Retry behavior
Tests
Logging
Documentation
Migration
Security
Mobile behavior
```

Not every small change requires every category, but critical flows do.

---

# 150. Critical Flow Definition of Done

For flows involving:

```text
Authentication
Guest access
Uploads
Media deletion
Exports
Admin operations
```

completion requires testing:

```text
Success
Failure
Unauthorized access
Invalid input
Retry
Relevant concurrency/failure cases
```

---

# 151. Review Checklist

Before merging a meaningful feature, ask:

```text
Does this match PRD?

Does this match ARCHITECTURE?

Does this match DATABASE?

Does this match API?

Is PostgreSQL still the source of product truth?

Is R2 used only for binary storage?

Is Redis only coordinating temporary work?

Are permissions enforced by backend?

Are secrets protected?

Are states separated correctly?

Can retries create duplicates?

Can failure leave recoverable state?

Does documentation need updating?
```

---

# 152. Core Engineering Invariants

These invariants must remain true:

```text
PostgreSQL
= persistent product truth

Cloudflare R2
= binary Media storage

Redis / BullMQ
= temporary coordination and queues
```

Authentication:

```text
User
→ Session

Guest
→ GuestSession
```

Album upload permission:

```text
Album
+
UploadWindow
+
GuestSession
+
Platform Rules
→ canUpload
```

Media:

```text
status
≠
visibility
≠
deletion
```

Security:

```text
Frontend
≠
authorization authority
```

API:

```text
Prisma Model
≠
Response DTO
```

Storage:

```text
storageKey
≠
download permission
```

---

# 153. Forbidden Architecture Shortcuts

The following must not be introduced without an approved architecture change:

```text
Album.uploadsEnabled

UploadWindow.isActive as source of truth

Standalone RefreshToken entity

Guest represented as normal User

Raw authentication tokens in database

Permanent R2 credentials in frontend

Direct Prisma access from frontend

Media binaries stored in PostgreSQL

Normal large Media proxying through NestJS

Large synchronous ZIP generation

Redis-only critical product state

Frontend-only authorization

Permanent signed storage URLs

Unbounded Gallery queries

Broad destructive cascade deletion

Production schema edits outside migrations
```

---

# 154. Final Principle

Livara stores memories that may exist only once.

Engineering decisions must therefore favor:

```text
Correctness
Recoverability
Security
Simplicity
```

over cleverness.

The system should remain simple enough to understand and strong enough to trust.

**Relive your event through every guest's eyes.**

**Every guest becomes a storyteller.**