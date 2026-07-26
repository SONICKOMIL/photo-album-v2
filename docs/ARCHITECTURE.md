# Livara Architecture

**Project:** Livara

**Document Type:** System Architecture

**Product Stage:** MVP

**Document Version:** 1.0

> 🇷🇺
> Этот документ определяет техническую архитектуру Livara MVP.
>
> Он описывает основные компоненты системы, их ответственность, взаимодействие, хранение данных, обработку Media, фоновые задачи, авторизацию и архитектурные принципы.
>
> Детальная структура данных определяется в `DATABASE.md`, а HTTP API — в `API.md`.

---

# 1. Architecture Goals

Livara architecture must support the complete Event Album lifecycle while remaining maintainable and scalable.

Primary goals:

- Simple Guest experience
- Secure Organizer and Super Admin access
- Reliable photo and video uploads
- Efficient Media storage and delivery
- Background Media processing
- Multiple Upload Windows per Album
- Large Album support
- Safe Media moderation and deletion
- Asynchronous Album exports
- Clear separation of product domains
- Future transition to self-service onboarding
- Horizontal scalability where required

The MVP should avoid unnecessary distributed-system complexity while preserving clean boundaries that allow future growth.

> 🇷🇺
> Архитектура Livara должна быть достаточно простой для разработки MVP, но не должна создавать фундаментальные ограничения для будущего роста.
>
> На первом этапе мы не строим сложную микросервисную систему. Вместо этого используем модульный backend с чёткими границами ответственности.

---

# 2. Architecture Style

Livara MVP uses a **modular monolith architecture**.

The backend is deployed as one primary NestJS application, while background processing may run in separate Worker processes using the same application modules and infrastructure.

```text
                 ┌─────────────────────┐
                 │      Next.js        │
                 │      Frontend       │
                 └──────────┬──────────┘
                            │
                            │ HTTPS
                            ▼
                 ┌─────────────────────┐
                 │       NestJS        │
                 │        API          │
                 └──────────┬──────────┘
                            │
          ┌─────────────────┼──────────────────┐
          │                 │                  │
          ▼                 ▼                  ▼
    PostgreSQL            Redis          Cloudflare R2
      Prisma              BullMQ          Object Storage
          │                 │
          │                 ▼
          │          Background Workers
          │
          └─────────────────────────────────────
```

A modular monolith is preferred over microservices for MVP because:

- Deployment remains simpler
- Development is faster
- Transactions remain easier to manage
- Domain boundaries can still be enforced
- Individual workloads can be extracted later if required

> 🇷🇺
> MVP строится как модульный монолит.
>
> Это не означает, что весь backend превращается в один огромный файл. Каждый домен имеет собственный модуль, сервисы и ответственность.
>
> При необходимости отдельные тяжёлые процессы можно будет вынести в самостоятельные сервисы позже.

---

# 3. Technology Stack

## Frontend

```text
Next.js
React
TypeScript
```

Responsibilities:

- Marketing pages
- Guest Album experience
- Organizer Dashboard
- Super Admin interface
- Gallery UI
- Upload UI
- QR materials UI
- Client-side interaction

---

## Backend

```text
NestJS
TypeScript
```

Responsibilities:

- Business logic
- Authentication
- Authorization
- Album management
- Guest sessions
- Upload authorization
- Media management
- Export management
- Notifications
- Administrative operations
- Audit events

---

## Database

```text
PostgreSQL
Prisma ORM
```

PostgreSQL is the source of truth for persistent application metadata and relational state.

Media binary files are not stored directly inside PostgreSQL.

---

## Object Storage

```text
Cloudflare R2
```

R2 stores binary resources such as:

- Original photos
- Original videos
- Optimized images
- Thumbnails
- Processed Media derivatives
- Temporary export archives

---

## Cache / Queue Infrastructure

```text
Redis
BullMQ
```

Redis supports:

- BullMQ queues
- Short-lived cache where appropriate
- Distributed coordination where required
- Rate-limiting support where appropriate

Redis must not become the permanent source of truth for critical product data.

---

# 4. High-Level Request Flow

Normal application requests follow:

```text
Browser
   ↓
Next.js
   ↓
NestJS API
   ↓
Authorization / Validation
   ↓
Domain Service
   ↓
Prisma
   ↓
PostgreSQL
```

For Media binary transfer, large files should avoid unnecessarily passing through NestJS.

---

# 5. Domain Modules

The backend should be divided into domain-focused NestJS modules.

Primary modules:

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

Supporting modules may be introduced when they represent a clear technical responsibility.

---

# 6. Auth Module

`AuthModule` manages authenticated User access for:

```text
SUPER_ADMIN
ORGANIZER
```

Responsibilities:

- Login
- Access token issuance
- Refresh/session lifecycle
- Logout
- Logout from all sessions
- Session revocation
- Password verification
- Authentication guards

Guest access is not handled as a normal User login.

> 🇷🇺
> Organizer и Super Admin используют обычную защищённую авторизацию.
>
> Guest использует отдельную модель Guest Session и не становится обычным User только ради просмотра или загрузки фотографий.

---

# 7. User Session Architecture

Authenticated Users use server-tracked sessions.

Recommended model:

```text
User
  ↓
Session
```

A Session represents one authenticated login context.

Conceptually, it stores:

```text
Session
├── id
├── userId
├── refreshTokenHash
├── expiresAt
├── revokedAt
├── ipAddress
├── userAgent
├── createdAt
└── updatedAt
```

A separate persistent `RefreshToken` entity is not required for MVP if the refresh token lifecycle is already represented by Session.

Raw refresh tokens must never be stored in the database.

> 🇷🇺
> Для MVP используем одну сущность Session вместо параллельных Session + RefreshToken.
>
> В базе хранится только безопасное представление refresh token, например hash.
>
> Это упрощает logout, logout-all и принудительное завершение сессий.

---

# 8. Authentication Tokens

The authentication model may use:

```text
Short-lived Access Token
+
Long-lived Refresh Session
```

Access tokens should have short lifetimes.

Refresh credentials should be protected using secure HTTP-only cookie mechanisms where appropriate.

Authentication credentials must not be stored in browser `localStorage`.

The backend remains the authority for session validity.

---

# 9. Authorization Architecture

Authorization is enforced by the backend.

Frontend visibility rules are only UX.

Conceptually:

```text
SUPER_ADMIN
    ↓
Platform-wide authorized operations

ORGANIZER
    ↓
Assigned Albums and related resources

GUEST
    ↓
Permitted Guest operations for accessed Album
```

Every protected operation must verify both:

```text
Role Permission
+
Resource Ownership / Access
```

Example:

```text
Organizer knows albumId
        ↓
GET /albums/:albumId
        ↓
Backend checks:
Does this Album belong to this Organizer?
        ↓
YES → continue
NO  → reject
```

Resource IDs are never authorization mechanisms.

---

# 10. Guest Access Architecture

Guest Album access uses an **unlisted access model**.

The Album has a public Guest identifier suitable for use in URLs and QR codes.

Example concept:

```text
livara.example/e/{publicIdentifier}
```

The identifier must:

- Be difficult to guess
- Not expose sequential database IDs
- Be unique
- Remain stable while the same QR should continue working

Guest Album pages should not be intentionally discoverable through a public Livara directory.

---

# 11. Guest Session Architecture

Guest identity is separate from authenticated User identity.

Conceptual relationship:

```text
Album
  ↓
Guest
  ↓
GuestSession
```

`Guest` represents a Guest identity within an Album.

`GuestSession` represents an active or historical session for that Guest.

Conceptually:

```text
GuestSession
├── id
├── guestId
├── tokenHash
├── expiresAt
├── lastSeenAt
├── createdAt
└── revokedAt
```

Raw Guest session tokens must not be stored.

Guest sessions should be scoped to the relevant Album through the Guest relationship.

> 🇷🇺
> Мы не храним raw `sessionToken` прямо в Guest.
>
> Guest — это участник Album, а GuestSession — его конкретная сессия.
>
> В будущем это позволит одному Guest иметь несколько сессий или устройств без изменения основной модели.

---

# 12. Album Architecture

Album is the central domain aggregate of Livara.

It connects:

```text
Organizer
Upload Windows
Guests
Media
Exports
Notifications
```

Album contains protected event information such as:

```text
title
eventDate
owner
publicIdentifier
```

During the managed MVP stage, protected information is changed only through authorized Super Admin operations.

---

# 13. Album State vs Upload State

Album lifecycle and upload availability must remain separate.

Example:

```text
Album Status: ACTIVE
Upload Window: CLOSED
Gallery: AVAILABLE
```

Therefore, Album must not use an independent `uploadsEnabled` boolean as the primary upload permission mechanism.

Guest upload permission is derived from:

```text
Album Availability
        +
Active Upload Window
        +
Guest Permission
        +
Platform Restrictions
```

This prevents conflicting states.

---

# 14. Upload Window Architecture

An Album may contain multiple Upload Windows.

```text
Album
 ├── Wedding Window
 ├── Chilla Window
 └── Future Related Window
```

Each window defines:

```text
startsAt
endsAt
```

Whether a window is currently active should normally be derived from time:

```text
startsAt <= now < endsAt
```

rather than relying on scheduled jobs to toggle a boolean exactly at start and end time.

> 🇷🇺
> Redis или scheduler не должны быть источником истины для открытия Upload Window.
>
> Даже если Worker был выключен в момент начала Чиллы, backend всё равно должен понять по времени, что загрузка уже разрешена.

---

# 15. Upload Window Validation

The system should prevent invalid Upload Window configurations.

Examples:

- End before start
- Window outside permitted Album lifecycle where applicable
- Unauthorized Organizer modification
- Invalid overlapping windows if product policy forbids them

For MVP, overlapping Upload Windows should preferably be rejected because they provide no meaningful benefit and complicate administration.

---

# 16. Media Upload Architecture

Large Media files should upload directly from the Guest device to Cloudflare R2 using temporary authorized upload credentials or signed upload URLs.

Recommended flow:

```text
Guest
  ↓
POST Upload Intent
  ↓
NestJS validates:
- Album
- Guest Session
- Upload Window
- File metadata
- Limits
  ↓
Media record created as pending
  ↓
Temporary upload authorization returned
  ↓
Guest Device
  ↓
Cloudflare R2
  ↓
Upload completion confirmed
  ↓
Processing queued
```

The actual binary file does not need to pass through NestJS.

---

# 17. Why Direct Upload

Without direct upload:

```text
Phone
  ↓
NestJS
  ↓
R2
```

NestJS must receive and retransmit every large photo and video.

With direct upload:

```text
Phone ─────────→ R2
  │
  └── metadata/control → NestJS
```

Benefits:

- Lower backend bandwidth
- Lower memory pressure
- Better scalability
- Better handling of large videos
- Reduced application-server workload

The API remains responsible for authorization and lifecycle control.

---

# 18. Upload Intent

Before direct upload, the client requests permission from the backend.

The backend verifies:

```text
Album exists
Album available
Guest Session valid
Upload Window active
File type allowed
File size allowed
Rate limits acceptable
Storage policy acceptable
```

Only after successful validation is temporary upload authorization issued.

Temporary upload authorization must:

- Expire quickly
- Be scoped to the intended object
- Not expose permanent storage credentials

---

# 19. Media Lifecycle

A Media record has a lifecycle independent from visibility.

Conceptually:

```text
PENDING
   ↓
UPLOADED
   ↓
PROCESSING
   ↓
READY
```

Failure may occur:

```text
PENDING
   ↓
FAILED

UPLOADED
   ↓
FAILED

PROCESSING
   ↓
FAILED
```

Deletion is handled separately through deletion state / timestamps according to the database model.

Exact enums will be defined in `DATABASE.md`.

---

# 20. Media Visibility

Processing status and visibility are separate.

Example:

```text
status = READY
visibility = VISIBLE
```

Guest can see the Media.

```text
status = READY
visibility = HIDDEN
```

Organizer may see the Media, but Guest Gallery does not.

This distinction prevents moderation from corrupting the Media processing lifecycle.

---

# 21. Media Storage Structure

Object storage keys should be generated by the backend and must not depend on unsafe user filenames.

Conceptual structure:

```text
albums/
  {albumId}/
    originals/
      {mediaId}
    optimized/
      {mediaId}
    thumbnails/
      {mediaId}
```

Exports:

```text
exports/
  {albumId}/
    {exportId}.zip
```

Actual extensions or derivative naming may be added where required.

User-provided filenames may be stored as metadata but should not determine trusted storage paths.

---

# 22. Media Processing

After upload completion, expensive processing should happen asynchronously.

Flow:

```text
Upload Complete
      ↓
Media Queue
      ↓
Media Worker
      ↓
Validate Object
      ↓
Read Metadata
      ↓
Generate Derivatives
      ↓
Update Media
      ↓
READY
```

Possible processing:

### Images

- Metadata extraction
- Orientation normalization
- Optimized version
- Thumbnail generation
- Dimension extraction

### Videos

- Metadata extraction
- Duration extraction
- Thumbnail generation
- Future transcoding where required

MVP should avoid unnecessary expensive video transcoding unless product compatibility requires it.

---

# 23. Media Safety

Client-provided metadata must not be trusted as proof that an uploaded object is valid.

The processing pipeline should verify relevant properties after upload.

For example:

```text
Client says:
image/jpeg

Actual object:
invalid / unsupported data
```

The Media must fail validation rather than become READY.

---

# 24. Gallery Architecture

Guest Gallery reads Media metadata through the API.

Conceptual flow:

```text
Guest
  ↓
Gallery Request
  ↓
NestJS
  ↓
Album Access Validation
  ↓
PostgreSQL
  ↓
READY + VISIBLE Media
  ↓
Delivery URLs
  ↓
Guest
```

The Gallery must not return:

```text
PENDING
PROCESSING
FAILED
HIDDEN
DELETED
```

Media.

---

# 25. Gallery Pagination

Albums may contain thousands of Media items.

Gallery endpoints should use cursor-based pagination.

Example:

```text
GET first page
      ↓
nextCursor
      ↓
GET next page
      ↓
nextCursor
```

Cursor pagination is preferred over loading the entire Album into one response.

---

# 26. Media Delivery

Optimized Media should be used for normal Gallery browsing where appropriate.

Original Media should not automatically be loaded for every Gallery item.

Conceptually:

```text
Gallery
  ↓
Thumbnail / Optimized Media

Download
  ↓
Original Media
```

This reduces bandwidth and improves mobile performance.

---

# 27. Storage Access

Cloudflare R2 credentials remain server-side.

Clients must never receive permanent R2 credentials.

Access should use temporary mechanisms such as:

```text
Signed Upload URL
Signed Download URL
Controlled Public Delivery Layer
```

depending on resource type and privacy requirements.

---

# 28. Export Architecture

Album exports are asynchronous jobs.

Creating a large ZIP synchronously inside an HTTP request is prohibited.

Flow:

```text
Organizer
   ↓
POST Export Request
   ↓
Export record created
   ↓
BullMQ Export Queue
   ↓
Export Worker
   ↓
Read authorized Media
   ↓
Create ZIP
   ↓
Store temporary archive in R2
   ↓
Export = READY
   ↓
Organizer can download
```

---

# 29. Export Lifecycle

Conceptually:

```text
QUEUED
  ↓
PROCESSING
  ↓
READY
  ↓
EXPIRED
```

Failure:

```text
QUEUED / PROCESSING
        ↓
      FAILED
```

Export records remain separate from original Media.

Temporary ZIP archives may be deleted after expiration.

---

# 30. Export Security

An Export belongs to an Album and requesting User context.

Before download, the API must verify that the authenticated User still has access to the Album.

A permanent signed download URL must not be stored as the Export itself.

Instead:

```text
Organizer requests download
        ↓
Authorization checked
        ↓
Temporary URL generated
```

---

# 31. Notifications Architecture

Notifications are persistent product messages for authenticated Users.

Possible events:

```text
Media activity
Upload Window events
Export ready
Storage warning
System events
```

Notification records should remain independent from delivery channel.

MVP:

```text
Database Notification
      ↓
Frontend fetches notifications
```

Future:

```text
Notification
 ├── WebSocket
 ├── SSE
 ├── Email
 ├── Browser Push
 └── Mobile Push
```

---

# 32. Notification Aggregation

High-frequency events should not automatically generate one notification per event.

Example:

```text
47 Media uploads
      ↓
Aggregation
      ↓
"47 new memories were added."
```

Aggregation may be handled through application logic and background jobs where necessary.

---

# 33. Audit Architecture

Audit Logs record sensitive administrative actions.

Audit is separate from Notifications.

```text
Notification
→ user-facing information

AuditLog
→ durable administrative history
```

Audit events may include:

```text
USER_CREATED
USER_SUSPENDED
USER_ACTIVATED
SESSIONS_REVOKED
ALBUM_CREATED
ALBUM_REASSIGNED
PROTECTED_ALBUM_UPDATED
ALBUM_RECOVERED
MEDIA_RECOVERED
```

Audit Logs should identify:

```text
actor
action
target
timestamp
metadata
```

where applicable.

---

# 34. Soft Delete Architecture

Important resources should support safe deletion where required.

Concept:

```text
Resource Active
      ↓
deletedAt set
      ↓
Hidden from normal application queries
      ↓
Recovery period
      ↓
Permanent cleanup
```

The database remains the source of truth for deletion state.

Storage cleanup may happen asynchronously.

---

# 35. Album Recovery

When an Album is recovered:

```text
Soft-Deleted Album
      ↓
Super Admin Recovery
      ↓
deletedAt cleared
      ↓
Safe Album state
```

Recovery must not automatically create or activate an Upload Window.

Therefore:

```text
Album Restored
≠
Uploads Open
```

---

# 36. Background Job Architecture

BullMQ handles asynchronous workloads.

Recommended queues:

```text
media-processing
exports
notifications
cleanup
```

Additional queues may be introduced when justified.

Each queue should represent a workload category rather than every small operation becoming its own queue.

---

# 37. Worker Architecture

Workers may run as separate processes from the API.

```text
NestJS API
    │
    ├── Queue Job
    │
    ▼
   Redis
    │
    ▼
Worker Process
    │
    ├── PostgreSQL
    └── R2
```

This allows CPU-heavy or long-running work to avoid blocking API request handling.

---

# 38. Job Reliability

Background jobs should be designed to be idempotent where practical.

A retried job must avoid creating duplicate resources unnecessarily.

Example:

```text
Generate thumbnail
      ↓
Worker crashes after upload
      ↓
Job retries
      ↓
Should safely reuse / replace expected derivative
```

BullMQ retry policies should be configured according to workload type.

---

# 39. Cleanup Jobs

Cleanup workers may handle:

```text
Expired exports
Abandoned uploads
Expired temporary resources
Permanent deletion after retention
Old notifications
Expired sessions where cleanup is useful
```

Cleanup jobs must never delete resources solely because Redis lost state.

Persistent database state determines what may be removed.

---

# 40. Scheduling

Time-based product behavior should distinguish between:

### Derived State

Example:

```text
Upload Window active?
```

Calculated from PostgreSQL timestamps.

### Scheduled Side Effect

Example:

```text
Send notification before window opens
Delete expired ZIP
```

May be handled by workers/schedulers.

This distinction prevents scheduler failure from changing core product truth.

> 🇷🇺
> Время начала Upload Window определяется данными в PostgreSQL, а не тем, сработала ли задача в Redis.
>
> Scheduler нужен для побочных действий, например уведомлений и очистки.

---

# 41. Database Architecture

PostgreSQL is the authoritative persistent data store.

It stores metadata and state for concepts such as:

```text
User
Session
Album
UploadWindow
Guest
GuestSession
Media
Export
Notification
AuditLog
```

Exact models, fields, indexes and relations are defined in `DATABASE.md`.

Binary Media itself remains in object storage.

---

# 42. Prisma Architecture

Prisma is the application ORM for PostgreSQL.

Responsibilities:

- Schema definition
- Migrations
- Type-safe database access
- Relations
- Transactions

Business logic must not be placed inside Prisma schema definitions.

NestJS domain services remain responsible for product rules.

---

# 43. Transaction Boundaries

Database transactions should be used when multiple persistent changes must succeed together.

Example:

```text
Create Album
+
Assign Organizer
+
Create required related metadata
```

Where external systems are involved, database transactions cannot guarantee external side effects.

Example:

```text
PostgreSQL transaction
+
R2 upload
```

must be designed using recoverable states rather than pretending both systems share one transaction.

---

# 44. Source of Truth

Each type of data must have one clear authority.

```text
Users / Albums / Media metadata
→ PostgreSQL

Upload Window timing
→ PostgreSQL

Authentication session validity
→ PostgreSQL Session

Binary Media
→ R2

Background job delivery
→ Redis / BullMQ

Long-term job outcome
→ PostgreSQL resource status
```

Redis must never be the only place where critical product state exists.

---

# 45. Cache Architecture

Redis caching may be introduced for expensive or frequently accessed data.

However:

```text
Cache miss
```

must not break the product.

The application must be able to reconstruct authoritative state from PostgreSQL and storage.

Cache invalidation must be considered when mutable data is cached.

---

# 46. Rate Limiting

Public Guest endpoints require abuse protection.

Potential limits include:

```text
Album access
Guest session creation
Upload intent creation
Upload completion
```

Authenticated endpoints may also use rate limits for sensitive operations such as:

```text
Login
Password-related actions
Export creation
Admin operations
```

Limits should avoid blocking normal event behavior where many Guests share the same network.

> 🇷🇺
> На свадьбе сотни гостей могут использовать один Wi-Fi.
>
> Поэтому нельзя строить защиту только на жёстком лимите «один IP = один человек».

---

# 47. Validation

All external input must be validated at the backend boundary.

Examples:

```text
Request body
Query parameters
Path parameters
File metadata
Pagination cursors
Public identifiers
```

Frontend validation improves UX but does not replace backend validation.

---

# 48. Error Architecture

The API should expose stable product error codes rather than raw internal errors.

Example:

```json
{
  "success": false,
  "error": {
    "code": "UPLOAD_WINDOW_CLOSED",
    "message": "Uploads are not available right now."
  }
}
```

Internal stack traces must not be returned in production responses.

---

# 49. Observability

Production architecture should support:

```text
Structured logs
Error tracking
Request correlation
Queue monitoring
Storage monitoring
Database monitoring
Health checks
```

Sensitive values must not appear in logs.

Examples that should not be logged:

```text
Passwords
Raw access tokens
Raw refresh tokens
Guest session tokens
Storage credentials
Signed URLs where avoidable
```

---

# 50. Health Architecture

The API exposes infrastructure health checks.

Conceptually:

```text
/health
/health/live
/health/ready
```

Liveness checks verify that the application process responds.

Readiness checks may verify critical dependencies such as:

```text
PostgreSQL
Redis
Queue infrastructure
```

R2 dependency checks should be designed carefully to avoid expensive health operations.

---

# 51. Security Boundaries

The architecture must assume that all client-controlled data may be manipulated.

Trust boundaries:

```text
Browser
  │ UNTRUSTED
  ▼
NestJS API
  │
  ├── PostgreSQL
  ├── Redis
  └── R2
```

The browser must never decide:

```text
"I am Super Admin"
"I own this Album"
"Upload Window is open"
"This Media is safe"
"I may download this object"
```

These decisions belong to trusted backend logic.

---

# 52. CSRF and Cookie Security

Where authentication relies on cookies, the application must account for CSRF protection.

Cookies should use appropriate settings such as:

```text
HttpOnly
Secure
SameSite
```

according to deployment topology.

State-changing endpoints must not assume that HTTP-only cookies alone solve CSRF.

Exact implementation may use SameSite policy, CSRF tokens, origin validation, or an appropriate combination.

---

# 53. CORS

Production CORS policy should allow only required Livara origins.

Wildcard credentialed CORS must not be used.

Development environments may use separate configuration.

---

# 54. Secrets Management

Secrets must be provided through secure deployment configuration.

Examples:

```text
DATABASE_URL
Redis credentials
R2 credentials
JWT / authentication secrets
Encryption secrets
```

Secrets must not be committed to Git.

The repository should contain safe environment templates such as:

```text
.env.example
```

without real credentials.

---

# 55. Frontend Architecture

The Next.js application may contain separate route areas for:

```text
Marketing
Guest Album
Organizer
Admin
```

Conceptually:

```text
/
├── marketing
├── event/[publicIdentifier]
├── organizer
└── admin
```

Exact Next.js route structure may differ.

Authorization remains enforced by the backend regardless of frontend routing.

---

# 56. Guest Frontend

Guest UI is mobile-first.

Primary responsibilities:

```text
Album entry
Gallery
Media viewer
Upload selection
Upload progress
Upload feedback
```

Guest pages should minimize JavaScript and network overhead where practical because event connectivity may be inconsistent.

---

# 57. Organizer Frontend

Organizer Dashboard provides:

```text
Album Overview
Gallery Management
Upload Windows
Exports
QR Materials
Notifications
Settings
```

The frontend may optimistically update simple UI state, but server responses remain authoritative.

---

# 58. Admin Frontend

Super Admin interface provides platform-level management.

Primary areas:

```text
Dashboard
Organizers
Albums
Storage
Recoverable Resources
Audit
```

Admin routes must require both authentication and Super Admin authorization.

Hiding navigation items is not sufficient protection.

---

# 59. QR Architecture

QR codes encode Guest Album access URLs.

The QR visual design is independent from Album identity.

```text
Design A ─┐
Design B ─┼──→ Same Guest Album URL
Design C ─┘
```

Therefore multiple printable designs may exist without creating multiple Albums or Guest access identities.

---

# 60. QR PDF Generation

Livara may provide printable QR materials as PDFs.

For MVP, QR/PDF design generation may be:

```text
Pre-designed templates
+
Album QR
+
Event information where permitted
```

PDF generation may happen on demand or asynchronously depending on implementation cost.

QR materials must not expose administrative access credentials.

---

# 61. Notifications vs Audit

These concepts must remain separate.

```text
Notification
"Your ZIP is ready."

AuditLog
"Super Admin X changed Album Y event date."
```

Deleting or expiring Notifications must not erase administrative history.

---

# 62. Deletion vs Visibility

These concepts must also remain separate.

```text
HIDDEN
→ Media exists but Guest cannot see it.

SOFT DELETED
→ Media is removed from normal product use and may be recoverable.

PERMANENTLY DELETED
→ Database/storage cleanup completed according to retention policy.
```

This distinction must be preserved in Database and API design.

---

# 63. Scalability Strategy

Livara should scale incrementally.

Initial architecture:

```text
Next.js
NestJS API
Worker
PostgreSQL
Redis
R2
```

When traffic grows, individual layers may scale independently:

```text
Multiple Next.js instances
Multiple API instances
Multiple Media Workers
Multiple Export Workers
Managed PostgreSQL scaling
Redis scaling
R2 object storage
```

The stateless API design should allow multiple API instances.

---

# 64. Future Service Extraction

Microservices are not required for MVP.

If future scale justifies it, high-load domains may be extracted.

Possible candidates:

```text
Media Processing Service
Export Service
Notification Service
```

Extraction should happen because of measurable operational need, not because microservices appear more advanced.

> 🇷🇺
> Мы не строим микросервисы заранее.
>
> Сначала создаём хороший модульный монолит. Если через несколько лет Media Processing станет отдельной огромной нагрузкой, его можно будет вынести без переписывания всей бизнес-модели.

---

# 65. Future Self-Service Architecture

Current onboarding:

```text
Customer
   ↓
Livara Administration
   ↓
Album
```

Future:

```text
Customer
   ↓
Registration
   ↓
Payment
   ↓
Album Creation
```

Core domain models must not assume that every Album can only be created manually forever.

Manual Super Admin creation is a current business workflow, not a permanent architectural limitation.

---

# 66. Deployment Architecture

MVP should be deployable through containerized services.

Conceptually:

```text
Internet
   ↓
HTTPS
   ↓
Frontend
   ↓
API
   │
   ├── PostgreSQL
   ├── Redis
   └── R2

Worker
   │
   ├── PostgreSQL
   ├── Redis
   └── R2
```

Docker should provide consistent local and production-like environments.

Exact hosting providers may change without changing application architecture.

---

# 67. Environment Separation

At minimum, the project should distinguish:

```text
Development
Production
```

A staging environment may be introduced before production launch.

Each environment must use separate:

```text
Database
Storage configuration
Secrets
Authentication configuration
```

Production customer Media must not be used casually in development.

---

# 68. Database Backups

Production PostgreSQL must have a backup strategy.

Backups should account for:

```text
Database failure
Accidental data modification
Operational mistakes
```

Database backup alone does not back up R2 Media objects.

Storage retention and recovery require separate consideration.

---

# 69. Object Storage Recovery

Original Media is one of Livara's most valuable assets.

Production storage policies should reduce the risk of accidental permanent loss.

Possible mechanisms may include:

```text
Soft deletion before object cleanup
Delayed cleanup
Object versioning where available and justified
Storage lifecycle policies
```

Exact infrastructure policy will be defined during deployment planning.

---

# 70. Architecture Principles

All implementation decisions should follow these principles.

### PostgreSQL Owns Product State

Critical persistent state belongs in PostgreSQL.

### R2 Owns Binary Media

Large files do not belong inside relational database rows.

### Redis Coordinates, It Does Not Own

Queues and cache may disappear and be rebuilt without destroying authoritative product state.

### Backend Owns Permissions

The client never decides authorization.

### Expensive Work Is Asynchronous

Media processing, ZIP generation and cleanup should not block normal HTTP requests.

### One Concept, One Source of Truth

Upload availability should not be represented by contradictory fields.

### Separate State Dimensions

Processing, visibility and deletion represent different concepts.

### Design for Failure

Uploads, workers and external services can fail and must recover safely.

### Keep MVP Operationally Simple

Do not introduce distributed complexity without a concrete need.

---

# 71. Architecture Acceptance Criteria

Architecture v1.0 is valid when:

- Frontend and backend responsibilities are clearly separated
- NestJS uses domain modules
- PostgreSQL is the authoritative application database
- Prisma manages relational schema and migrations
- R2 stores binary Media
- Redis/BullMQ handles background jobs
- User Sessions and Guest Sessions are separate concepts
- Raw authentication/session tokens are not stored
- Guest Album access follows the unlisted model
- Upload availability is derived from Upload Windows
- `uploadsEnabled` is not a competing source of truth
- Direct-to-R2 upload architecture is supported
- Media processing is asynchronous
- Processing status and visibility are separate
- Soft deletion is separate from visibility
- Gallery supports large Albums through pagination
- Exports are asynchronous
- Notifications and Audit Logs are separate
- Background jobs do not become authoritative product state
- Authorization is enforced by backend resource checks
- The architecture supports multiple API and Worker instances
- Future self-service onboarding is possible without redesigning the core Album model
- The system can evolve without requiring premature microservices

---

# 72. Architecture Summary

Livara MVP uses:

```text
Next.js
   ↓
NestJS Modular Monolith
   ↓
PostgreSQL + Prisma

Cloudflare R2
   ↑
Direct Media Upload

Redis + BullMQ
   ↓
Background Workers
   ├── Media Processing
   ├── Exports
   ├── Notifications
   └── Cleanup
```

The central domain remains:

```text
User
 ↓
Album
 ├── UploadWindows
 ├── Guests
 │    └── GuestSessions
 ├── Media
 ├── Exports
 └── Notifications
```

with platform-level:

```text
Sessions
AuditLogs
Administration
```

The architecture exists to support one simple experience:

**Relive your event through every guest's eyes.**

**Every guest becomes a storyteller.**