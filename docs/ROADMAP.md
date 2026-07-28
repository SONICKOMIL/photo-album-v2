# Livara Roadmap

**Project:** Livara

**Document Type:** Development Roadmap

**Product Stage:** MVP

**Document Version:** 1.0

> 🇷🇺
> Этот документ определяет порядок разработки Livara MVP.
>
> Roadmap не заменяет PRD, Architecture, Database или API.
> Он определяет последовательность реализации уже утверждённого продукта.
>
> Задачи выполняются сверху вниз. Фаза считается завершённой только после выполнения её Definition of Done.

---

# 1. Roadmap Goal

The goal of this roadmap is to take Livara from approved product documentation to a production-ready MVP.

Development follows this dependency chain:

```text
Foundation
    ↓
Database
    ↓
Backend Core
    ↓
Authentication
    ↓
Albums
    ↓
Upload Windows
    ↓
Guest Access
    ↓
Media Upload
    ↓
Media Processing
    ↓
Gallery
    ↓
Organizer Experience
    ↓
Exports
    ↓
Notifications
    ↓
Super Admin
    ↓
Hardening
    ↓
Deployment
    ↓
MVP Launch
```

The roadmap prioritizes the core Livara experience before secondary functionality.

---

# 2. Development Principles

Development must follow:

```text
PRD.md
ARCHITECTURE.md
DATABASE.md
API.md
PROJECT_RULES.md
```

The roadmap determines implementation order.

It does not override those documents.

If implementation requires an architectural change:

```text
Update documentation first
        ↓
Review affected contracts
        ↓
Implement change
```

---

# 3. Priority Model

Tasks are grouped into:

```text
P0
→ Required for MVP launch

P1
→ Important for MVP quality

P2
→ Can be postponed without breaking the core product
```

The initial development cycle focuses primarily on P0.

---

# 4. MVP Core Loop

The most important Livara loop is:

```text
Admin creates Organizer + Album
        ↓
Organizer receives Album
        ↓
Guest scans QR
        ↓
Guest opens Album
        ↓
Guest uploads Media
        ↓
Media is processed
        ↓
Media appears in Gallery
        ↓
Organizer manages memories
        ↓
Organizer downloads / exports Album
```

Until this loop works reliably, secondary features must not take priority over it.

---

# 5. Phase 0 — Documentation Baseline

**Priority:** P0

Goal:

Freeze the initial product and technical contracts before implementation.

Tasks:

```text
[x] VISION.md
[x] BUSINESS_MODEL.md
[x] BRAND.md
[x] USER_FLOW.md
[x] PRD.md
[x] ARCHITECTURE.md
[x] DATABASE.md
[x] API.md
[x] PROJECT_RULES.md
[x] ROADMAP.md
```

## Definition of Done

```text
[x] Product scope defined
[x] Actors defined
[x] Core User Flow defined
[x] Architecture defined
[x] Database model defined
[x] API contract defined
[x] Engineering rules defined
[x] Development sequence defined
```

After this phase, implementation begins.

---

# 6. Phase 1 — Repository Foundation

**Priority:** P0

Goal:

Create the technical foundation for all Livara applications.

Target structure:

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
│
└── ...
```

Tasks:

```text
[ ] Confirm repository structure
[ ] Configure workspace / monorepo
[ ] Configure TypeScript
[ ] Configure formatting
[ ] Configure linting
[ ] Configure environment handling
[ ] Create .env.example
[ ] Verify .gitignore
[ ] Create web application
[ ] Create API application
[ ] Create Worker application
[ ] Create shared configuration package
[ ] Create shared types/utilities package where justified
[ ] Configure development scripts
[ ] Configure production build scripts
```

Recommended scripts should support workflows such as:

```text
dev
build
lint
typecheck
test
```

## Definition of Done

```text
[ ] Web starts locally
[ ] API starts locally
[ ] Worker starts locally
[ ] TypeScript passes
[ ] Lint passes
[ ] Production build succeeds
[ ] Secrets are not committed
```

---

# 7. Phase 2 — Local Infrastructure

**Priority:** P0

Goal:

Provide the infrastructure required by API and Worker development.

Required services:

```text
PostgreSQL
Redis
```

Object storage integration:

```text
Cloudflare R2
```

Tasks:

```text
[x] Configure PostgreSQL
[x] Configure Redis
[x] Configure local development infrastructure
[x] Configure environment variables
[x] Verify PostgreSQL connectivity
[x] Verify Redis connectivity
[x] Configure R2 development credentials
[x] Verify R2 connectivity
[x] Document local startup workflow
```

Docker may be used for local PostgreSQL and Redis.

Real secrets must remain outside Git.

Local startup details: `docs/LOCAL_DEVELOPMENT.md`.

## Definition of Done

```text
[x] API can reach PostgreSQL
[x] API can reach Redis
[x] Worker can reach PostgreSQL
[x] Worker can reach Redis
[x] Backend can communicate with R2
[x] Local environment can be reproduced
```

Runtime connectivity verified locally with Docker-backed PostgreSQL and Redis, and Cloudflare R2 using development credentials. Real secrets remain outside Git.

---

# 8. Phase 3 — Prisma Database Foundation

**Priority:** P0

Goal:

Translate `DATABASE.md` into the real Prisma schema.

Initial models:

```text
User
Session
Album
UploadWindow
Guest
GuestSession
Media
Export
ExportItem
Notification
AuditLog
```

Tasks:

```text
[ ] Install/configure Prisma
[ ] Create schema.prisma
[ ] Define enums
[ ] Define User
[ ] Define Session
[ ] Define Album
[ ] Define UploadWindow
[ ] Define Guest
[ ] Define GuestSession
[ ] Define Media
[ ] Define Export
[ ] Define ExportItem
[ ] Define Notification
[ ] Define AuditLog
[ ] Define relations
[ ] Define unique constraints
[ ] Define indexes
[ ] Define soft-delete fields
[ ] Create initial migration
[ ] Review generated SQL
[ ] Apply migration locally
[ ] Create development seed
```

Important invariants:

```text
No RefreshToken model

No Album.uploadsEnabled

No UploadWindow.isActive
```

## Definition of Done

```text
[ ] schema.prisma matches DATABASE.md
[ ] Migration applies successfully
[ ] Database can be recreated from migrations
[ ] Seed works
[ ] Relations work
[ ] Constraints work
[ ] Indexes exist for core access patterns
```

---

# 9. Phase 4 — NestJS Core

**Priority:** P0

Goal:

Build the backend foundation before domain features.

Initial modules:

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

Tasks:

```text
[ ] Configure NestJS application
[ ] Configure environment validation
[ ] Configure Prisma integration
[ ] Configure Redis
[ ] Configure BullMQ
[ ] Configure R2 storage client
[ ] Configure global DTO validation
[ ] Configure exception handling
[ ] Configure response conventions
[ ] Configure structured logging
[ ] Configure request correlation
[ ] Configure CORS
[ ] Configure security middleware
[ ] Add health endpoints
```

## Definition of Done

```text
[ ] API boots with validated configuration
[ ] Prisma connection works
[ ] Redis connection works
[ ] Queue infrastructure works
[ ] R2 client works
[ ] Invalid DTOs are rejected
[ ] Errors follow API format
[ ] Health endpoints work
```

---

# 10. Phase 5 — User Authentication

**Priority:** P0

Goal:

Implement secure authentication for:

```text
SUPER_ADMIN
ORGANIZER
```

Tasks:

```text
[ ] Implement password hashing
[ ] Implement login
[ ] Implement Session creation
[ ] Implement access authentication
[ ] Implement refresh flow
[ ] Store refresh token hash only
[ ] Implement /auth/me
[ ] Implement logout
[ ] Implement logout-all
[ ] Implement Session revocation
[ ] Enforce User status
[ ] Enforce deleted User restrictions
[ ] Configure secure cookies/token transport
[ ] Implement CSRF protection where required
[ ] Add login rate limiting
```

Tests:

```text
[ ] Valid login
[ ] Invalid password
[ ] Unknown User
[ ] Suspended User
[ ] Revoked Session
[ ] Expired Session
[ ] Refresh
[ ] Logout
[ ] Logout-all
```

## Definition of Done

```text
[ ] Super Admin can authenticate
[ ] Organizer can authenticate
[ ] Suspended User cannot authenticate
[ ] Revoked Session cannot authenticate
[ ] Raw tokens are not stored
[ ] Raw tokens are not logged
```

---

# 11. Phase 6 — Authorization Foundation

**Priority:** P0

Goal:

Build reusable backend authorization rules before exposing Album resources.

Tasks:

```text
[ ] Implement authentication guards
[ ] Implement role authorization
[ ] Implement Organizer Album ownership policy
[ ] Implement Super Admin policy
[ ] Implement safe Not Found / Forbidden behavior
[ ] Add authorization test helpers
```

Core rule:

```text
Authenticated
≠
Authorized
```

Tests:

```text
[ ] Organizer can access owned Album
[ ] Organizer cannot access another Organizer's Album
[ ] Organizer cannot access Admin operations
[ ] Super Admin can access Admin operations
[ ] Unauthenticated requests are rejected
```

## Definition of Done

```text
[ ] Authorization is reusable
[ ] Ownership checks are server-side
[ ] Roles never come from client input
[ ] Protected resources cannot be accessed by ID alone
```

---

# 12. Phase 7 — Super Admin Organizer Management

**Priority:** P0

Goal:

Allow Livara administration to create and manage Organizers.

Endpoints:

```text
GET  /admin/organizers
POST /admin/organizers

POST /admin/organizers/:userId/suspend
POST /admin/organizers/:userId/reactivate
```

Tasks:

```text
[ ] Organizer list
[ ] Organizer creation
[ ] Email uniqueness validation
[ ] Password hashing
[ ] Suspension
[ ] Session revocation on suspension
[ ] Reactivation
[ ] Audit logging
[ ] Pagination
```

## Definition of Done

```text
[ ] Super Admin can create Organizer
[ ] Organizer can log in
[ ] Super Admin can suspend Organizer
[ ] Suspended Organizer loses active access
[ ] Reactivation works
[ ] Sensitive actions create Audit Logs
```

---

# 13. Phase 8 — Album Management

**Priority:** P0

Goal:

Implement the central Livara resource.

Admin endpoints:

```text
GET   /admin/albums
POST  /admin/albums
PATCH /admin/albums/:albumId

POST /admin/albums/:albumId/reassign
POST /admin/albums/:albumId/rotate-public-identifier

DELETE /admin/albums/:albumId
POST   /admin/albums/:albumId/recover
```

Organizer endpoints:

```text
GET /albums
GET /albums/:albumId
GET /albums/:albumId/overview
```

Tasks:

```text
[ ] Create Album
[ ] Generate secure publicIdentifier
[ ] Store timezone
[ ] Assign Organizer
[ ] Organizer Album list
[ ] Organizer Album details
[ ] Album overview
[ ] Protected Admin update
[ ] Organizer reassignment
[ ] Public identifier rotation
[ ] Soft delete
[ ] Recovery
[ ] Audit logging
```

Critical rule:

Organizer must not directly modify:

```text
title
eventDate
organizerId
publicIdentifier
```

## Definition of Done

```text
[ ] Super Admin can create Album
[ ] Organizer sees assigned Album
[ ] Organizer cannot see another Organizer's Album
[ ] Protected fields are protected
[ ] Reassignment changes access immediately
[ ] Soft-deleted Album is unavailable normally
[ ] Recovery works safely
```

---

# 14. Phase 9 — Upload Windows

**Priority:** P0

Goal:

Implement scheduled Guest contribution periods.

Endpoints:

```text
GET
/albums/:albumId/upload-windows

POST
/albums/:albumId/upload-windows

PATCH
/albums/:albumId/upload-windows/:windowId

DELETE
/albums/:albumId/upload-windows/:windowId
```

Tasks:

```text
[ ] List Upload Windows
[ ] Create Upload Window
[ ] Update Upload Window
[ ] Delete Upload Window
[ ] Validate startsAt
[ ] Validate endsAt
[ ] Reject invalid ranges
[ ] Reject overlapping windows
[ ] Implement canUploadNow calculation
[ ] Add timezone tests
```

Core rule:

```text
startsAt <= now < endsAt
```

No scheduler is required to open or close a window.

## Definition of Done

```text
[ ] Wedding window can be configured
[ ] Chilla window can be configured
[ ] Additional future window can be configured
[ ] Overlapping windows are rejected
[ ] Window opens automatically by time
[ ] Window closes automatically by time
[ ] Worker/Redis outage does not affect truth
```

---

# 15. Phase 10 — Guest Album Access

**Priority:** P0

Goal:

Allow a Guest to open an Album from QR without creating a normal Livara account.

Endpoints:

```text
GET
/guest/albums/:publicIdentifier

POST
/guest/albums/:publicIdentifier/session
```

Tasks:

```text
[ ] Public Album lookup
[ ] Guest-safe Album DTO
[ ] Guest creation
[ ] GuestSession creation
[ ] Guest session credential
[ ] Store token hash only
[ ] Session expiration
[ ] Session revocation support
[ ] Album scoping
[ ] Guest access validation
```

Tests:

```text
[ ] Valid Album
[ ] Unknown identifier
[ ] Deleted Album
[ ] Unavailable Album
[ ] Valid GuestSession
[ ] Expired GuestSession
[ ] GuestSession cannot cross Albums
```

## Definition of Done

```text
[ ] QR URL can open Guest Album
[ ] No User registration required
[ ] GuestSession works
[ ] GuestSession is Album-scoped
[ ] Guest-safe responses do not leak private data
```

---

# 16. Phase 11 — R2 Direct Upload

**Priority:** P0

Goal:

Implement the most important technical Guest contribution flow.

Endpoint:

```text
POST
/guest/albums/:publicIdentifier/uploads
```

Flow:

```text
Guest selects files
        ↓
Upload Intent
        ↓
Backend validation
        ↓
Media = PENDING
        ↓
Signed upload authorization
        ↓
Device
        ↓
R2
```

Tasks:

```text
[ ] Configure R2 bucket
[ ] Implement StorageService
[ ] Generate trusted storage keys
[ ] Generate temporary upload authorization
[ ] Validate GuestSession
[ ] Validate Album
[ ] Validate active Upload Window
[ ] Validate file count
[ ] Validate declared file size
[ ] Validate declared MIME type
[ ] Create Media PENDING records
[ ] Support multiple files
[ ] Support partial rejection
[ ] Configure signed URL expiration
[ ] Add upload rate limiting
```

## Definition of Done

```text
[ ] Guest receives upload authorization
[ ] Device uploads directly to R2
[ ] Large Media does not pass through NestJS
[ ] Storage path is server-generated
[ ] Upload is impossible outside valid Upload Window
[ ] One invalid file does not reject valid files
[ ] Permanent R2 credentials never reach browser
```

---

# 17. Phase 12 — Upload Completion

**Priority:** P0

Goal:

Safely connect direct R2 uploads back to persistent Media state.

Endpoint:

```text
POST
/guest/albums/:publicIdentifier/uploads/:mediaId/complete
```

Tasks:

```text
[ ] Verify GuestSession
[ ] Verify Media ownership
[ ] Verify Album
[ ] Verify expected R2 object exists
[ ] Validate object size where appropriate
[ ] Move PENDING → UPLOADED
[ ] Queue processing job
[ ] Implement retry-safe completion
[ ] Implement abandoned upload cleanup eligibility
```

Important behavior:

```text
Window closes after intent was created
        ↓
Valid short-lived upload may complete
```

## Definition of Done

```text
[ ] Successful R2 upload can be completed
[ ] Missing object is rejected
[ ] Another Guest cannot complete Media
[ ] Duplicate completion is safe
[ ] Processing job is queued
[ ] Media persistent state exists independently of BullMQ
```

---

# 18. Phase 13 — Worker Foundation

**Priority:** P0

Goal:

Run asynchronous workloads independently from HTTP requests.

Queues:

```text
media-processing
exports
notifications
cleanup
```

Tasks:

```text
[ ] Configure Worker runtime
[ ] Connect BullMQ
[ ] Configure queue names
[ ] Configure retry policies
[ ] Configure backoff
[ ] Configure worker concurrency
[ ] Add structured job logging
[ ] Add job failure handling
[ ] Add graceful shutdown
```

## Definition of Done

```text
[ ] API can enqueue job
[ ] Worker receives job
[ ] Worker can access PostgreSQL
[ ] Worker can access R2
[ ] Retry works
[ ] Worker restart does not corrupt product state
```

---

# 19. Phase 14 — Media Processing

**Priority:** P0

Goal:

Turn uploaded objects into safe Gallery Media.

Flow:

```text
UPLOADED
    ↓
PROCESSING
    ↓
READY

or

FAILED
```

Image tasks:

```text
[ ] Validate actual image
[ ] Detect MIME/type
[ ] Read dimensions
[ ] Normalize orientation where required
[ ] Generate optimized image
[ ] Generate thumbnail
[ ] Store derivatives in R2
```

Video tasks:

```text
[ ] Validate actual video
[ ] Extract metadata
[ ] Extract duration
[ ] Generate thumbnail where practical
```

General tasks:

```text
[ ] Implement Media state transitions
[ ] Store validated metadata
[ ] Handle invalid files
[ ] Handle processing failure
[ ] Make job retry-safe
[ ] Avoid duplicate derivatives
```

## Definition of Done

```text
[ ] Valid image becomes READY
[ ] Valid supported video becomes READY
[ ] Invalid object becomes FAILED
[ ] Thumbnail exists where required
[ ] Optimized image exists where required
[ ] Retry does not corrupt Media
[ ] Client metadata is not trusted as final truth
```

---

# 20. Phase 15 — Guest Gallery API

**Priority:** P0

Goal:

Expose shared memories safely and efficiently.

Endpoints:

```text
GET
/guest/albums/:publicIdentifier/media

GET
/guest/albums/:publicIdentifier/media/:mediaId
```

Tasks:

```text
[ ] Gallery query
[ ] READY filtering
[ ] VISIBLE filtering
[ ] deletedAt filtering
[ ] Cursor pagination
[ ] Stable ordering
[ ] Thumbnail/display URLs
[ ] Media details
[ ] Guest-safe DTO
```

Core query:

```text
status = READY
visibility = VISIBLE
deletedAt IS NULL
```

## Definition of Done

```text
[ ] Guest can browse Gallery
[ ] Hidden Media never appears
[ ] Failed Media never appears
[ ] Processing Media never appears
[ ] Deleted Media never appears
[ ] Large Gallery is paginated
```

---

# 21. Phase 16 — Guest Web Experience

**Priority:** P0

Goal:

Build the first complete customer-facing Livara experience.

Pages:

```text
Guest Album
Gallery
Media Viewer
Upload
Upload Progress
Upload Result
```

Tasks:

```text
[ ] Guest Album route
[ ] Resolve publicIdentifier
[ ] Establish GuestSession
[ ] Build Gallery
[ ] Build Media viewer
[ ] Build upload picker
[ ] Support photos
[ ] Support videos
[ ] Show per-file upload progress
[ ] Handle partial failures
[ ] Handle processing state
[ ] Handle Upload Window closed state
[ ] Handle empty Gallery
[ ] Handle invalid Album
[ ] Mobile-first layout
[ ] Slow network behavior
```

## Definition of Done

A Guest can:

```text
Scan QR
↓
Open Album
↓
See memories
↓
Select photos/videos
↓
Upload them
↓
Receive feedback
↓
See processed memories in Gallery
```

on a real mobile device.

---

# 22. Milestone A — Core Livara Loop

At this point, the first complete Livara loop exists:

```text
Admin creates Organizer
        ↓
Admin creates Album
        ↓
Upload Window configured
        ↓
Guest opens QR
        ↓
Guest uploads Media
        ↓
R2 receives Media
        ↓
Worker processes Media
        ↓
Gallery shows Media
```

This milestone should be tested end-to-end before expanding the product.

```text
[ ] MILESTONE A COMPLETE
```

---

# 23. Phase 17 — Organizer Dashboard Foundation

**Priority:** P0

Goal:

Build the authenticated Organizer interface.

Primary areas:

```text
Login
Albums
Album Overview
Gallery Management
Upload Windows
Exports
QR
Notifications
```

Tasks:

```text
[ ] Organizer login UI
[ ] Authentication bootstrap
[ ] Protected Organizer routes
[ ] Album list
[ ] Album overview
[ ] Navigation
[ ] Loading states
[ ] Error states
[ ] Empty states
[ ] Responsive layout
```

## Definition of Done

```text
[ ] Organizer can log in
[ ] Organizer sees only assigned Albums
[ ] Organizer can open Album Dashboard
[ ] Unauthorized Album access is handled safely
```

---

# 24. Phase 18 — Organizer Media Management

**Priority:** P0

Goal:

Allow Organizer to manage Album memories.

Endpoints:

```text
GET
/albums/:albumId/media

GET
/albums/:albumId/media/:mediaId

POST
/albums/:albumId/media/:mediaId/hide

POST
/albums/:albumId/media/:mediaId/restore-visibility

DELETE
/albums/:albumId/media/:mediaId
```

Tasks:

```text
[ ] Organizer Media Gallery
[ ] Cursor pagination
[ ] Media filters
[ ] Media details
[ ] Hide Media
[ ] Restore visibility
[ ] Soft delete Media
[ ] Confirmation UX
[ ] Ownership authorization
```

## Definition of Done

```text
[ ] Organizer can browse Album Media
[ ] Organizer can hide inappropriate Media
[ ] Hidden Media disappears from Guest Gallery
[ ] Organizer can restore hidden Media
[ ] Organizer can soft-delete Media
[ ] Another Organizer cannot manage the Media
```

---

# 25. Phase 19 — Organizer Upload Window UI

**Priority:** P0

Goal:

Allow Organizer to schedule contribution periods.

Tasks:

```text
[ ] Upload Window list UI
[ ] Create window UI
[ ] Edit window UI
[ ] Delete window UI
[ ] Event-local timezone display
[ ] Active/upcoming/ended visual state
[ ] Validation feedback
[ ] Overlap error handling
```

Example:

```text
Wedding
September 12
18:00–23:59

Chilla
September 19
18:00–22:00
```

## Definition of Done

```text
[ ] Organizer can manage Upload Windows
[ ] Local event time is clear
[ ] Current state is displayed correctly
[ ] UI does not create its own upload truth
```

---

# 26. Phase 20 — QR Experience

**Priority:** P0

Goal:

Make Guest Album entry usable at real events.

Tasks:

```text
[ ] Organizer QR page
[ ] Generate QR from Guest URL
[ ] Display Guest URL
[ ] Copy Guest URL
[ ] Download basic QR asset
[ ] Test QR with real phones
[ ] Verify QR opens correct Album
```

P1 enhancement:

```text
[ ] Printable QR designs
[ ] PDF materials
[ ] Multiple visual templates
```

All designs must point to the same Album identity unless explicitly rotated.

## Definition of Done

```text
[ ] Organizer can access QR
[ ] QR works from real phone camera
[ ] QR opens Guest Album
[ ] No authentication secret exists in QR
```

---

# 27. Phase 21 — Original Media Download

**Priority:** P0

Goal:

Allow Organizer to retrieve individual originals securely.

Endpoint:

```text
GET
/albums/:albumId/media/:mediaId/download
```

Tasks:

```text
[ ] Authorization
[ ] Media availability validation
[ ] Temporary download URL
[ ] Expiration
[ ] Download UI
```

## Definition of Done

```text
[ ] Organizer can download original
[ ] Another Organizer cannot download it
[ ] Storage key alone cannot grant access
[ ] Permanent signed URLs are not stored
```

---

# 28. Phase 22 — Album Exports

**Priority:** P0

Goal:

Allow Organizer to download many memories as an archive.

Endpoints:

```text
POST
/albums/:albumId/exports

GET
/albums/:albumId/exports

GET
/albums/:albumId/exports/:exportId

GET
/albums/:albumId/exports/:exportId/download
```

Tasks:

```text
[ ] Create FULL_ALBUM Export
[ ] Create SELECTED_MEDIA Export
[ ] Create ExportItems
[ ] Validate selected Media
[ ] Queue export
[ ] Implement Export Worker
[ ] Generate ZIP
[ ] Store ZIP in R2
[ ] Mark READY
[ ] Generate temporary download URL
[ ] Handle FAILED
[ ] Handle EXPIRED
[ ] Cleanup expired ZIPs
```

## Definition of Done

```text
[ ] Large Export does not block HTTP
[ ] Full Album Export works
[ ] Selected Media Export works
[ ] Export status is persistent
[ ] ZIP download is authorized
[ ] Expired ZIP can be cleaned safely
```

---

# 29. Phase 23 — Notifications

**Priority:** P1

Goal:

Provide persistent Organizer notifications.

Endpoints:

```text
GET
/notifications

GET
/notifications/unread-count

POST
/notifications/:notificationId/read

POST
/notifications/read-all
```

Initial events:

```text
Export ready
Export failed
Media activity
Upload Window event where useful
System notification
```

Tasks:

```text
[ ] Notification model integration
[ ] Notification list
[ ] Unread count
[ ] Mark read
[ ] Mark all read
[ ] Export notifications
[ ] Media activity aggregation
[ ] Organizer UI
```

## Definition of Done

```text
[ ] Organizer receives useful notifications
[ ] Notification ownership is enforced
[ ] High-frequency uploads do not create notification spam
```

---

# 30. Phase 24 — Super Admin Dashboard

**Priority:** P0

Goal:

Replace manual database operations with a safe operational interface.

Areas:

```text
Dashboard
Organizers
Albums
Recovery
Storage
Audit
```

Tasks:

```text
[ ] Admin authentication UI
[ ] Admin route protection
[ ] Organizer list
[ ] Create Organizer
[ ] Suspend/reactivate Organizer
[ ] Album list
[ ] Create Album
[ ] Protected Album update
[ ] Reassign Album
[ ] Rotate publicIdentifier
[ ] Soft-delete Album
[ ] Recover Album
[ ] Recover Media
[ ] Storage overview
[ ] Audit Log viewer
```

## Definition of Done

```text
[ ] Livara team can operate MVP without direct DB editing
[ ] Protected operations require Super Admin
[ ] Sensitive actions are audited
[ ] Recovery flows work safely
```

---

# 31. Phase 25 — Audit System

**Priority:** P1

Goal:

Ensure sensitive administrative actions have durable history.

Tasks:

```text
[ ] Audit service
[ ] Audit action enum
[ ] Organizer administration logs
[ ] Album administration logs
[ ] Reassignment logs
[ ] Recovery logs
[ ] Public identifier rotation logs
[ ] Admin Audit API
[ ] Admin Audit UI
[ ] Filters
[ ] Pagination
```

## Definition of Done

For important administrative changes, Livara can answer:

```text
Who?
Did what?
To which resource?
When?
```

---

# 32. Phase 26 — Cleanup and Retention

**Priority:** P0

Goal:

Prevent abandoned and temporary resources from accumulating indefinitely.

Cleanup candidates:

```text
Abandoned PENDING Media
Expired Export ZIPs
Soft-deleted Media after retention
Expired temporary resources
Old Sessions where appropriate
Old Notifications where policy permits
```

Tasks:

```text
[ ] Cleanup queue
[ ] Cleanup Worker
[ ] Persistent eligibility checks
[ ] Export cleanup
[ ] Abandoned upload cleanup
[ ] Soft-delete retention cleanup
[ ] R2 object cleanup
[ ] Retry-safe deletion
[ ] Logging
```

Critical rule:

```text
PostgreSQL decides cleanup eligibility.
```

Redis does not.

## Definition of Done

```text
[ ] Expired temporary files are removed
[ ] Customer originals are not accidentally deleted
[ ] Cleanup is retry-safe
[ ] Cleanup decisions are based on persistent state
```

---

# 33. Phase 27 — Queue Reconciliation

**Priority:** P0

Goal:

Recover work after Redis, Worker, or deployment failures.

Cases:

```text
Media = UPLOADED
but processing job missing

Export = QUEUED
but export job missing
```

Tasks:

```text
[ ] Media reconciliation
[ ] Export reconciliation
[ ] Define age thresholds
[ ] Prevent duplicate destructive work
[ ] Add monitoring/logging
```

## Definition of Done

```text
[ ] Queue loss does not permanently strand valid Media
[ ] Queue loss does not permanently strand Exports
[ ] Reconciliation is safe to run repeatedly
```

---

# 34. Phase 28 — Security Hardening

**Priority:** P0

Goal:

Review the complete MVP as an adversarial system.

Review:

```text
Authentication
Authorization
Guest Sessions
Upload authorization
Download authorization
Admin operations
CSRF
CORS
Rate limits
Secrets
Logging
DTO exposure
File validation
Storage access
```

Tasks:

```text
[ ] Authorization review
[ ] IDOR testing
[ ] Guest Album isolation testing
[ ] Session security review
[ ] Cookie security review
[ ] CSRF verification
[ ] CORS verification
[ ] Login rate limits
[ ] Guest rate limits
[ ] Upload abuse limits
[ ] Admin rate limits where appropriate
[ ] Secret scan
[ ] Log review
[ ] Response DTO review
[ ] Signed URL scope review
```

## Definition of Done

```text
[ ] Organizer cannot access another Organizer's resources
[ ] Guest cannot cross Album boundaries
[ ] Protected Admin operations require SUPER_ADMIN
[ ] No raw secrets leak through API/logs
[ ] Storage credentials never reach clients
[ ] Public identifier does not grant administrative access
```

---

# 35. Phase 29 — Test Suite

**Priority:** P0

Goal:

Protect the flows most likely to damage customer trust if broken.

Required coverage:

```text
Authentication
Authorization
Albums
Upload Windows
GuestSession
Upload Intent
Upload Completion
Media Processing
Gallery
Moderation
Exports
Recovery
```

Tasks:

```text
[ ] Unit tests
[ ] Integration tests
[ ] API tests
[ ] Worker tests
[ ] Authorization tests
[ ] Migration tests
[ ] Failure/retry tests
```

Core E2E flow:

```text
Create Organizer
      ↓
Create Album
      ↓
Create Upload Window
      ↓
Guest Session
      ↓
Upload Media
      ↓
Process Media
      ↓
Gallery
      ↓
Hide Media
      ↓
Export Album
```

## Definition of Done

```text
[ ] Critical E2E flow passes
[ ] Wrong-owner tests pass
[ ] Wrong-role tests pass
[ ] Retry tests pass
[ ] Worker failure tests pass
[ ] Migration tests pass
```

---

# 36. Phase 30 — Performance and Mobile Testing

**Priority:** P0

Goal:

Test Livara under realistic event conditions.

Test scenarios:

```text
Many Guests
Shared Wi-Fi
Mobile data
Slow network
Large photos
Large videos
Large Gallery
Concurrent uploads
Concurrent processing
```

Tasks:

```text
[ ] Test real iPhone uploads
[ ] Test real Android uploads
[ ] Test Safari
[ ] Test Chrome
[ ] Test slow connection
[ ] Test interrupted upload
[ ] Test many simultaneous uploads
[ ] Test Gallery pagination
[ ] Test large Album
[ ] Test Worker concurrency
[ ] Test Export with many files
```

## Definition of Done

```text
[ ] Core Guest flow works on mobile
[ ] Upload failure is understandable
[ ] Large Gallery remains usable
[ ] API remains responsive during processing
[ ] Worker limits prevent resource exhaustion
```

---

# 37. Phase 31 — Observability

**Priority:** P1

Goal:

Make production problems diagnosable.

Tasks:

```text
[ ] Structured API logs
[ ] Structured Worker logs
[ ] Request IDs
[ ] Job correlation
[ ] Error tracking
[ ] Queue monitoring
[ ] Database monitoring
[ ] Storage monitoring
[ ] Health checks
[ ] Basic operational alerts
```

Important signals:

```text
API error rate
Upload failure rate
Processing failure rate
Queue backlog
Export failure rate
Database availability
Worker availability
```

## Definition of Done

A production problem can be traced without guessing blindly.

---

# 38. Phase 32 — Production Infrastructure

**Priority:** P0

Goal:

Create a reliable production environment.

Required infrastructure:

```text
Frontend hosting
API runtime
Worker runtime
PostgreSQL
Redis
Cloudflare R2
Domain
HTTPS
```

Tasks:

```text
[ ] Production environment
[ ] Production PostgreSQL
[ ] Production Redis
[ ] Production R2
[ ] API deployment
[ ] Worker deployment
[ ] Web deployment
[ ] Domain configuration
[ ] HTTPS
[ ] Production environment variables
[ ] Production CORS
[ ] Production cookie settings
[ ] Database migration workflow
[ ] Backup configuration
```

## Definition of Done

```text
[ ] Production Web works
[ ] Production API works
[ ] Production Worker works
[ ] Database is persistent
[ ] Redis works
[ ] R2 works
[ ] HTTPS works
[ ] Backups are configured
[ ] No development secrets are used
```

---

# 39. Phase 33 — Staging

**Priority:** P1

Goal:

Provide a safe environment for final validation before production changes.

Tasks:

```text
[ ] Staging Web
[ ] Staging API
[ ] Staging Worker
[ ] Separate database
[ ] Separate storage configuration
[ ] Separate secrets
[ ] Deployment workflow
```

Staging must not casually use real production customer Media.

## Definition of Done

A production-like release can be tested without modifying real customer data.

---

# 40. Phase 34 — Real Event Pilot

**Priority:** P0

Goal:

Test Livara at a real event before broad launch.

Pilot flow:

```text
Create real Album
      ↓
Generate QR
      ↓
Guests scan
      ↓
Guests upload
      ↓
Gallery grows
      ↓
Organizer moderates
      ↓
Organizer exports
```

Observe:

```text
Guest confusion
Upload failures
Mobile performance
Network problems
Processing backlog
Gallery usability
Organizer workflow
QR placement
```

Tasks:

```text
[ ] Select pilot event
[ ] Create Album
[ ] Configure Upload Window
[ ] Prepare QR
[ ] Test before event
[ ] Monitor event
[ ] Record issues
[ ] Fix launch blockers
[ ] Verify post-event Export
```

## Definition of Done

```text
[ ] Real Guests can use Livara without assistance
[ ] Upload success rate is acceptable
[ ] No critical data loss occurs
[ ] Organizer can retrieve memories
[ ] Major UX problems are identified
```

---

# 41. Phase 35 — Launch Readiness

**Priority:** P0

Goal:

Confirm that Livara is ready for paying customers.

Checklist:

```text
[ ] Core Guest flow stable
[ ] Organizer flow stable
[ ] Admin flow stable
[ ] Upload Windows stable
[ ] R2 uploads stable
[ ] Media processing stable
[ ] Gallery stable
[ ] Exports stable
[ ] Cleanup safe
[ ] Reconciliation works
[ ] Authorization reviewed
[ ] Rate limits configured
[ ] Backups configured
[ ] Monitoring configured
[ ] Production domain ready
[ ] Error states usable
[ ] Mobile tested
[ ] Pilot completed
```

---

# 42. MVP Launch

When Phase 35 is complete:

```text
LIVARA MVP
READY FOR CUSTOMERS
```

The operational flow becomes:

```text
Customer
   ↓
Livara
   ↓
Organizer created
   ↓
Album created
   ↓
QR delivered
   ↓
Event
   ↓
Guests contribute memories
   ↓
Organizer receives complete Album
```

---

# 43. Post-Launch Priorities

After launch, prioritize real customer evidence over speculative features.

Evaluate:

```text
Upload success rate
Guest participation
Average Media per Album
Storage usage
Export usage
Organizer feedback
Support issues
Upload Window usage
Mobile performance
```

Then decide what to build next.

---

# 44. Post-MVP — Self-Service

**Priority:** Future

Possible future flow:

```text
Customer
   ↓
Registration
   ↓
Choose Package
   ↓
Payment
   ↓
Create Album
   ↓
Configure Event
   ↓
Generate QR
```

Possible future domains:

```text
Customer Accounts
Plans
Orders
Payments
Invoices
Subscriptions
```

These are intentionally excluded from MVP.

---

# 45. Post-MVP — Event Types

Livara may expand beyond weddings.

Possible events:

```text
Birthdays
Anniversaries
Corporate Events
Graduations
Family Events
Private Celebrations
```

The core Album model should remain reusable.

---

# 46. Post-MVP — Media Features

Possible future improvements:

```text
Video transcoding
Advanced image optimization
Favorites
Reactions
Comments
Albums/collections
Face grouping
Smart search
Duplicate detection
```

None are required for the first launch.

---

# 47. Post-MVP — Guest Identity

Possible future Guest features:

```text
Registered Guest account
Guest profile
Cross-event identity
Personal memory history
```

MVP intentionally keeps Guest identity lightweight.

---

# 48. Post-MVP — Notifications

Possible delivery channels:

```text
Email
WebSocket
SSE
Browser Push
Mobile Push
```

Persistent Notification remains the product concept.

Delivery channels are infrastructure.

---

# 49. Post-MVP — QR Materials

Possible improvements:

```text
Premium printable templates
Table cards
Posters
Welcome signs
Custom branding
Multiple print sizes
```

All may continue pointing to the same Guest Album URL.

---

# 50. Post-MVP — Analytics

Possible analytics:

```text
Guest visits
Upload conversion
Media count over time
QR scans
Participation rate
Upload Window performance
```

Analytics must respect privacy and data minimization principles.

---

# 51. Post-MVP — Infrastructure Scaling

Scale only when real load requires it.

Possible evolution:

```text
Multiple API instances
Multiple Worker instances
Dedicated Media Workers
Dedicated Export Workers
Database scaling
Redis scaling
CDN optimization
```

Do not move to microservices merely because MVP launched.

---

# 52. Development Order Summary

Implementation order:

```text
01  Repository Foundation
02  Infrastructure
03  Prisma Database
04  NestJS Core
05  Authentication
06  Authorization
07  Organizer Administration
08  Albums
09  Upload Windows
10  Guest Access
11  R2 Upload
12  Upload Completion
13  Worker
14  Media Processing
15  Guest Gallery API
16  Guest Web Experience

    ↓ MILESTONE A

17  Organizer Dashboard
18  Media Management
19  Upload Window UI
20  QR
21  Original Downloads
22  Exports
23  Notifications
24  Super Admin Dashboard
25  Audit
26  Cleanup
27  Reconciliation
28  Security
29  Tests
30  Performance / Mobile
31  Observability
32  Production Infrastructure
33  Staging
34  Real Event Pilot
35  Launch Readiness

    ↓

LIVARA MVP
```

---

# 53. What We Build First

After documentation is complete, the first implementation task is:

```text
PHASE 1
Repository Foundation
```

Not:

```text
Guest Gallery UI
QR design
Animations
Admin Dashboard
```

The dependency order matters.

First:

```text
Repository
↓
Database
↓
Backend
↓
Authentication
↓
Core Domains
```

Then product interfaces.

---

# 54. MVP Boundary

The MVP is not required to include:

```text
Self-service registration
Online payments
Subscriptions
Mobile apps
AI features
Comments
Reactions
Social network features
Complex analytics
Microservices
Advanced video transcoding
```

A feature should not enter the MVP merely because it sounds useful.

---

# 55. MVP Success Definition

The technical MVP succeeds when a real wedding can use Livara end-to-end:

```text
Before Wedding

Livara creates Album
Organizer receives access
QR is prepared
Upload Window is configured

        ↓

Wedding

Guests scan QR
Guests open Album
Guests upload photos/videos
Media is processed
Memories appear in Gallery

        ↓

After Wedding

Organizer views memories
Organizer moderates Media
Organizer downloads originals
Organizer exports Album

        ↓

Later Event

Chilla Upload Window opens
Same Album continues
Guests contribute new memories

        ↓

Permanent Collection

Album preserves the shared story
```

---

# 56. Roadmap Rule

The roadmap may evolve after implementation begins.

However, changes should be based on:

```text
Technical discovery
Pilot feedback
Customer evidence
Operational constraints
```

rather than uncontrolled scope growth.

When a phase changes significantly, update this document.

---

# 57. Current Status

```text
PRODUCT DEFINITION       COMPLETE
BUSINESS MODEL           COMPLETE
BRAND                    COMPLETE
USER FLOW                COMPLETE
PRD                      COMPLETE
ARCHITECTURE             COMPLETE
DATABASE DESIGN          COMPLETE
API CONTRACT             COMPLETE
PROJECT RULES            COMPLETE
ROADMAP                  COMPLETE

────────────────────────────────

DOCUMENTATION v1.0       COMPLETE

IMPLEMENTATION           NEXT
```

---

# 58. Next Step

The next phase is:

```text
PHASE 1
REPOSITORY FOUNDATION
```

The first implementation sequence:

```text
Inspect current repository
        ↓
Align project structure
        ↓
Configure workspace
        ↓
Configure web
        ↓
Configure api
        ↓
Configure worker
        ↓
Configure shared packages
        ↓
Verify lint / typecheck / build
```

Only after the foundation is stable do we create the real Prisma schema.

---

# 59. Final Roadmap

```text
Documentation
     ↓
Foundation
     ↓
Database
     ↓
Backend
     ↓
Auth
     ↓
Albums
     ↓
Upload Windows
     ↓
Guest Sessions
     ↓
R2 Uploads
     ↓
Media Processing
     ↓
Gallery
     ↓
Organizer
     ↓
Exports
     ↓
Admin
     ↓
Hardening
     ↓
Pilot
     ↓
Launch
```

The goal is not to build every possible event platform feature.

The goal is to build the smallest reliable Livara capable of preserving a real event through the memories of its guests.

**Relive your event through every guest's eyes.**

**Every guest becomes a storyteller.**