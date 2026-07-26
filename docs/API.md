# Livara API

**Project:** Livara

**Document Type:** API Contract

**Product Stage:** MVP

**API Version:** v1

**Document Version:** 1.0

> 🇷🇺
> Этот документ определяет HTTP API Livara MVP.
>
> API реализует продуктовые правила, определённые в PRD, Architecture и Database.
>
> Клиент никогда не является источником истины для авторизации, ownership, Upload Window, Media state или других защищённых правил.

---

# 1. API Goals

The Livara API must provide:

- Secure authenticated access for Organizer and Super Admin
- Low-friction Guest Album access
- Guest Sessions
- Album management
- Upload Window management
- Direct Media upload authorization
- Media lifecycle management
- Guest Gallery access
- Organizer moderation
- Downloads
- Asynchronous Exports
- Notifications
- Administrative operations
- Recovery operations
- Audit access where authorized

The API must remain predictable, versioned, and independent from frontend implementation details.

---

# 2. Base URL

All MVP endpoints use:

```text
/api/v1
```

Example:

```text
GET /api/v1/albums/:albumId
```

Versioning allows future breaking API changes without silently changing existing clients.

---

# 3. API Areas

The API is conceptually divided into:

```text
/api/v1/auth
/api/v1/albums
/api/v1/guest
/api/v1/media
/api/v1/exports
/api/v1/notifications
/api/v1/admin
```

Nested resources may be used where ownership is important.

Example:

```text
/albums/:albumId/upload-windows
```

---

# 4. Actors

The API recognizes three access contexts:

```text
SUPER_ADMIN
ORGANIZER
GUEST
```

### SUPER_ADMIN

Platform-level authenticated User.

### ORGANIZER

Authenticated User with access to assigned Albums.

### GUEST

Guest Session scoped to an Album.

Guest is not authenticated through the normal User login flow.

---

# 5. Authorization Principle

Every protected endpoint must perform server-side authorization.

The client must never decide:

```text
I am Super Admin
I own this Album
This Upload Window is active
This Media belongs to me
This Album is available
This file is safe
```

Resource IDs do not grant access.

---

# 6. Standard Response Format

Successful responses should use a consistent structure.

Example:

```json
{
  "success": true,
  "data": {
    "id": "..."
  }
}
```

Responses containing pagination may additionally contain:

```json
{
  "success": true,
  "data": [],
  "pagination": {
    "nextCursor": "..."
  }
}
```

---

# 7. Error Format

Errors use a stable structure:

```json
{
  "success": false,
  "error": {
    "code": "UPLOAD_WINDOW_CLOSED",
    "message": "Uploads are not available right now."
  }
}
```

Optional safe details may be included:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request contains invalid fields.",
    "details": {
      "field": "startsAt"
    }
  }
}
```

Internal stack traces, SQL errors, R2 credentials, and infrastructure details must never be returned.

---

# 8. HTTP Status Codes

Typical usage:

```text
200 OK
201 Created
202 Accepted
204 No Content

400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
413 Payload Too Large
415 Unsupported Media Type
422 Unprocessable Entity
429 Too Many Requests

500 Internal Server Error
503 Service Unavailable
```

Exact status selection should remain consistent across modules.

---

# 9. Validation

All external input must be validated by the backend.

This includes:

```text
Request body
Path parameters
Query parameters
Pagination cursors
Public identifiers
File metadata
Dates
Timezone values
```

Unknown or protected fields should not silently become writable.

---

# 10. Authentication

Organizer and Super Admin use authenticated User Sessions.

Recommended model:

```text
Access Token
+
Refresh Session
```

Access tokens are short-lived.

Refresh credentials are associated with persistent `Session` records.

Raw refresh tokens must never be stored in PostgreSQL.

---

# 11. Login

```text
POST /api/v1/auth/login
```

Request:

```json
{
  "email": "organizer@example.com",
  "password": "password"
}
```

Success:

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "email": "organizer@example.com",
      "role": "ORGANIZER",
      "status": "ACTIVE"
    }
  }
}
```

Refresh/session credentials should be delivered using the chosen secure authentication mechanism rather than exposed unnecessarily in JSON.

Possible errors:

```text
INVALID_CREDENTIALS
ACCOUNT_SUSPENDED
```

---

# 12. Refresh Authentication

```text
POST /api/v1/auth/refresh
```

The backend validates the refresh credential against the persistent Session.

Success returns renewed authentication state according to implementation.

Possible errors:

```text
SESSION_INVALID
SESSION_EXPIRED
SESSION_REVOKED
```

---

# 13. Current User

```text
GET /api/v1/auth/me
```

Requires:

```text
SUPER_ADMIN or ORGANIZER
```

Returns safe User information.

Never returns:

```text
passwordHash
refreshTokenHash
```

---

# 14. Logout

```text
POST /api/v1/auth/logout
```

Revokes the current Session.

Success:

```text
204 No Content
```

---

# 15. Logout All

```text
POST /api/v1/auth/logout-all
```

Revokes active Sessions for the authenticated User.

Success:

```text
204 No Content
```

---

# 16. Organizer Album List

```text
GET /api/v1/albums
```

Requires:

```text
ORGANIZER
```

Returns only Albums assigned to the authenticated Organizer.

Super Admin platform-wide Album listing belongs under Admin endpoints.

---

# 17. Organizer Album Details

```text
GET /api/v1/albums/:albumId
```

Requires:

```text
ORGANIZER
```

Backend verifies:

```text
album.organizerId = authenticatedUser.id
AND
album.deletedAt IS NULL
```

Example response:

```json
{
  "success": true,
  "data": {
    "id": "...",
    "title": "Aziz & Malika",
    "eventDate": "2026-09-12T00:00:00.000Z",
    "timezone": "Asia/Tashkent",
    "status": "ACTIVE",
    "publicIdentifier": "...",
    "canUploadNow": true
  }
}
```

`canUploadNow` may be derived for convenience.

It is not stored as authoritative Album state.

---

# 18. Organizer Album Updates

Organizer must not receive a generic endpoint capable of changing protected fields.

Protected fields:

```text
title
eventDate
organizerId
publicIdentifier
```

Therefore a request such as:

```text
PATCH /albums/:albumId
```

must not allow these fields for Organizer.

Organizer-editable settings should use explicitly permitted DTO fields or dedicated endpoints.

> 🇷🇺
> Мы не принимаем весь Album object и потом не надеемся, что frontend не отправит `eventDate`.
>
> Backend DTO сам определяет, какие поля Organizer вообще разрешено изменять.

---

# 19. Organizer Album Overview

```text
GET /api/v1/albums/:albumId/overview
```

Requires Album ownership.

May return:

```json
{
  "success": true,
  "data": {
    "mediaCount": 428,
    "imageCount": 391,
    "videoCount": 37,
    "guestCount": 126,
    "canUploadNow": false,
    "activeUploadWindow": null
  }
}
```

Statistics may evolve without changing core resources.

---

# 20. Upload Window List

```text
GET /api/v1/albums/:albumId/upload-windows
```

Requires:

```text
ORGANIZER owner
or
SUPER_ADMIN through authorized administrative context
```

Returns Upload Windows belonging to the Album.

---

# 21. Create Upload Window

```text
POST /api/v1/albums/:albumId/upload-windows
```

Organizer may create an Upload Window for an Album they manage where product policy permits.

Request:

```json
{
  "name": "Chilla",
  "startsAt": "2026-09-19T13:00:00.000Z",
  "endsAt": "2026-09-19T18:00:00.000Z"
}
```

Backend validates:

```text
Album ownership
Album availability
endsAt > startsAt
No forbidden overlap
Valid timestamps
Product restrictions
```

Success:

```text
201 Created
```

---

# 22. Update Upload Window

```text
PATCH /api/v1/albums/:albumId/upload-windows/:windowId
```

Permitted fields:

```text
name
startsAt
endsAt
```

Backend verifies that the Upload Window belongs to the specified Album.

Protected Album `eventDate` is unaffected.

---

# 23. Delete Upload Window

```text
DELETE /api/v1/albums/:albumId/upload-windows/:windowId
```

Requires appropriate Album authorization.

Deletion behavior may be physical for unused configuration records or application-managed according to final implementation policy.

Deleting a window does not delete Media previously uploaded during that window.

---

# 24. Upload Window State

No endpoint should toggle:

```text
isActive = true
```

as the authoritative mechanism.

Current state is derived from:

```text
startsAt <= now < endsAt
```

and Album availability.

---

# 25. Public Guest Album Entry

```text
GET /api/v1/guest/albums/:publicIdentifier
```

No authenticated User account required.

Backend validates:

```text
Album exists
Album is available for Guest access
Album is not deleted
```

Response contains only Guest-safe information.

Example:

```json
{
  "success": true,
  "data": {
    "title": "Aziz & Malika",
    "eventDate": "2026-09-12T00:00:00.000Z",
    "timezone": "Asia/Tashkent",
    "canUploadNow": true
  }
}
```

Must not expose:

```text
organizerId
internal storage keys
private settings
administrative metadata
```

---

# 26. Guest Session Creation

```text
POST /api/v1/guest/albums/:publicIdentifier/session
```

Creates or establishes Guest participation.

Possible request:

```json
{
  "displayName": "Kamron"
}
```

`displayName` may be optional if anonymous Guest participation is supported.

Backend:

```text
Validates Album
Creates Guest if required
Creates GuestSession
Returns/sets Guest session credential securely
```

The credential must not be stored raw in PostgreSQL.

---

# 27. Guest Session Context

Guest-protected requests must resolve:

```text
GuestSession
      ↓
Guest
      ↓
Album
```

and verify that the Session is valid.

A Guest Session for Album A must not authorize Guest operations in Album B.

---

# 28. Guest Gallery

```text
GET /api/v1/guest/albums/:publicIdentifier/media
```

Returns only:

```text
status = READY
visibility = VISIBLE
deletedAt IS NULL
```

Media belonging to the target Album.

Supports cursor pagination.

Example:

```text
GET /api/v1/guest/albums/:publicIdentifier/media?cursor=...
```

---

# 29. Gallery Response

Example:

```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "type": "IMAGE",
      "width": 3024,
      "height": 4032,
      "thumbnailUrl": "...",
      "displayUrl": "...",
      "createdAt": "2026-09-12T16:42:10.000Z"
    }
  ],
  "pagination": {
    "nextCursor": "..."
  }
}
```

The API must not expose permanent R2 credentials or trusted internal storage information.

---

# 30. Guest Media Details

```text
GET /api/v1/guest/albums/:publicIdentifier/media/:mediaId
```

Returns the Media only if it is Guest-visible.

A valid Media ID does not bypass Album or visibility checks.

---

# 31. Upload Flow Overview

Guest upload uses:

```text
1. Create Upload Intent
2. Upload binary directly to R2
3. Confirm Upload
4. Background Processing
5. Media becomes READY
```

Conceptually:

```text
Guest
  ↓
API
  ↓
R2
  ↓
API
  ↓
BullMQ
  ↓
Worker
```

---

# 32. Create Upload Intent

```text
POST /api/v1/guest/albums/:publicIdentifier/uploads
```

Requires valid Guest Session.

Request:

```json
{
  "files": [
    {
      "clientId": "local-1",
      "filename": "IMG_4821.JPG",
      "mimeType": "image/jpeg",
      "sizeBytes": 4839201
    },
    {
      "clientId": "local-2",
      "filename": "VID_4822.MOV",
      "mimeType": "video/quicktime",
      "sizeBytes": 48283920
    }
  ]
}
```

Backend validates each file independently.

---

# 33. Upload Intent Validation

For each file, backend verifies:

```text
GuestSession valid
Guest belongs to Album
Album available
Active UploadWindow exists
File type allowed
Declared size allowed
Rate limits acceptable
Storage policy acceptable
```

The client-provided MIME type is preliminary metadata only.

Actual uploaded object is validated during processing.

---

# 34. Upload Intent Response

Example:

```json
{
  "success": true,
  "data": {
    "uploads": [
      {
        "clientId": "local-1",
        "mediaId": "...",
        "status": "PENDING",
        "upload": {
          "method": "PUT",
          "url": "...",
          "headers": {
            "Content-Type": "image/jpeg"
          },
          "expiresAt": "2026-09-12T16:50:00.000Z"
        }
      },
      {
        "clientId": "local-2",
        "mediaId": "...",
        "status": "PENDING",
        "upload": {
          "method": "PUT",
          "url": "...",
          "headers": {
            "Content-Type": "video/quicktime"
          },
          "expiresAt": "2026-09-12T16:50:00.000Z"
        }
      }
    ]
  }
}
```

Each upload authorization is short-lived and object-scoped.

---

# 35. Partial Upload Intent Failure

Multiple selected files are independent.

A response may contain per-file failures.

Example:

```json
{
  "success": true,
  "data": {
    "uploads": [
      {
        "clientId": "local-1",
        "mediaId": "...",
        "status": "PENDING",
        "upload": {
          "method": "PUT",
          "url": "...",
          "expiresAt": "..."
        }
      }
    ],
    "rejected": [
      {
        "clientId": "local-2",
        "code": "FILE_TOO_LARGE",
        "message": "The selected file exceeds the upload limit."
      }
    ]
  }
}
```

One invalid file does not reject every valid file.

---

# 36. Direct R2 Upload

After authorization:

```text
Guest Device
      ↓
PUT temporary signed URL
      ↓
Cloudflare R2
```

The binary does not pass through the normal NestJS API.

The signed authorization must not grant access to arbitrary storage objects.

---

# 37. Confirm Upload

After successful R2 transfer:

```text
POST /api/v1/guest/albums/:publicIdentifier/uploads/:mediaId/complete
```

Requires valid Guest Session.

Backend verifies:

```text
Media belongs to Album
Media belongs to Guest/source
Media status permits completion
Expected object exists
Object satisfies preliminary constraints
```

Then:

```text
Media → UPLOADED
```

and processing is queued.

---

# 38. Upload Completion Idempotency

Upload completion must tolerate safe retries.

Example:

```text
Client sends /complete
Network response lost
Client retries /complete
```

The second request must not create duplicate Media or duplicate destructive processing.

Possible behavior:

```text
UPLOADED / PROCESSING / READY
→ return current state
```

when the same valid completion is repeated.

---

# 39. Media Processing

After completion:

```text
Media = UPLOADED
      ↓
Queue
      ↓
Worker
      ↓
Media = PROCESSING
      ↓
Validation / Derivatives
      ↓
READY or FAILED
```

The HTTP request does not wait for expensive processing.

---

# 40. Guest Upload Status

```text
GET /api/v1/guest/albums/:publicIdentifier/uploads/:mediaId
```

Requires valid Guest Session and ownership/access validation.

Example:

```json
{
  "success": true,
  "data": {
    "id": "...",
    "status": "PROCESSING"
  }
}
```

Possible states:

```text
PENDING
UPLOADED
PROCESSING
READY
FAILED
```

---

# 41. Upload Window Closing During Upload

Upload authorization is validated when the Upload Intent is created.

If the Upload Window closes while an already-authorized file is actively uploading, the platform may allow completion within the short authorization lifetime.

A new Upload Intent after the window closes must be rejected.

This prevents uploads from failing merely because the clock crossed the end time during a legitimate transfer.

---

# 42. Organizer Media List

```text
GET /api/v1/albums/:albumId/media
```

Requires Album ownership.

Unlike Guest Gallery, Organizer Media management may include:

```text
READY
FAILED
PROCESSING
HIDDEN
```

according to query filters.

Example:

```text
?status=READY&visibility=HIDDEN
```

Soft-deleted Media should require an explicit authorized recovery/admin context rather than appearing in normal Organizer lists.

---

# 43. Organizer Media Details

```text
GET /api/v1/albums/:albumId/media/:mediaId
```

Requires Album ownership.

Returns management-safe metadata.

Storage secrets remain excluded.

---

# 44. Hide Media

```text
POST /api/v1/albums/:albumId/media/:mediaId/hide
```

Requires Organizer ownership.

Backend verifies:

```text
Media belongs to Album
Media not deleted
Action permitted
```

Result:

```text
visibility = HIDDEN
```

Processing status remains unchanged.

---

# 45. Restore Hidden Media

```text
POST /api/v1/albums/:albumId/media/:mediaId/restore-visibility
```

Restores:

```text
visibility = VISIBLE
```

only if Media is otherwise valid for visibility.

For example, failed Media must not become Guest-visible merely because visibility was restored.

---

# 46. Delete Media

```text
DELETE /api/v1/albums/:albumId/media/:mediaId
```

Requires appropriate Organizer permission.

For recoverable Media:

```text
deletedAt = now
```

Normal Guest and Organizer views exclude it.

R2 objects are not immediately destroyed if recovery retention applies.

---

# 47. Media Recovery

Recovery is an administrative operation.

```text
POST /api/v1/admin/media/:mediaId/recover
```

Requires:

```text
SUPER_ADMIN
```

Backend verifies recovery eligibility.

Recovery clears deletion state but does not bypass processing or visibility rules.

---

# 48. Download Original Media

```text
GET /api/v1/albums/:albumId/media/:mediaId/download
```

Requires authorized Organizer access.

Backend:

```text
Verifies Album ownership
Verifies Media availability
Generates temporary download access
```

Example response:

```json
{
  "success": true,
  "data": {
    "url": "...",
    "expiresAt": "..."
  }
}
```

A permanent signed URL must not be persisted as the Media record.

---

# 49. Guest Downloads

Guest download behavior is optional/configurable according to final MVP settings.

If enabled, Guest download endpoints must still verify:

```text
Album access
Media = READY
visibility = VISIBLE
deletedAt IS NULL
Guest download setting
```

Guest must never obtain arbitrary original object access merely from knowing a storage key.

---

# 50. Create Export

```text
POST /api/v1/albums/:albumId/exports
```

Requires Organizer ownership.

Full Album request:

```json
{
  "type": "FULL_ALBUM"
}
```

Selected Media:

```json
{
  "type": "SELECTED_MEDIA",
  "mediaIds": [
    "...",
    "..."
  ]
}
```

Backend validates every selected Media belongs to the Album.

---

# 51. Export Creation

Backend:

```text
Validates Organizer
Validates Album
Validates Media selection
Creates Export
Creates ExportItems where required
Sets status = QUEUED
Queues Export job
```

Response:

```text
202 Accepted
```

Example:

```json
{
  "success": true,
  "data": {
    "id": "...",
    "status": "QUEUED"
  }
}
```

---

# 52. Export List

```text
GET /api/v1/albums/:albumId/exports
```

Requires Organizer ownership.

Returns exports associated with the Album and authorized management context.

---

# 53. Export Details

```text
GET /api/v1/albums/:albumId/exports/:exportId
```

Example:

```json
{
  "success": true,
  "data": {
    "id": "...",
    "type": "FULL_ALBUM",
    "status": "READY",
    "createdAt": "...",
    "completedAt": "...",
    "expiresAt": "..."
  }
}
```

---

# 54. Export Download

```text
GET /api/v1/albums/:albumId/exports/:exportId/download
```

Requires current Organizer authorization.

Backend verifies:

```text
Export belongs to Album
User currently owns/manages Album
Export status = READY
Export not expired
Archive exists
```

Then generates temporary download access.

---

# 55. Export Expiration

Expired exports return a stable error:

```text
EXPORT_EXPIRED
```

The Organizer may request a new Export.

Temporary ZIP expiration does not delete original Album Media.

---

# 56. Notifications

```text
GET /api/v1/notifications
```

Requires authenticated User.

Returns only Notifications belonging to that User.

Supports cursor pagination.

---

# 57. Unread Notification Count

```text
GET /api/v1/notifications/unread-count
```

Example:

```json
{
  "success": true,
  "data": {
    "count": 3
  }
}
```

---

# 58. Mark Notification Read

```text
POST /api/v1/notifications/:notificationId/read
```

Backend verifies Notification ownership.

Sets:

```text
readAt = now
```

Repeated requests should be safe.

---

# 59. Mark All Notifications Read

```text
POST /api/v1/notifications/read-all
```

Marks the authenticated User's current unread Notifications as read.

---

# 60. Super Admin Access

Administrative endpoints use:

```text
/api/v1/admin
```

All Admin endpoints require:

```text
Authenticated User
AND
role = SUPER_ADMIN
AND
active Session
AND
active User
```

Frontend `/admin` routing is not security.

---

# 61. Admin Organizer List

```text
GET /api/v1/admin/organizers
```

Returns Organizer accounts according to pagination/filter rules.

Must not expose password hashes or Session secrets.

---

# 62. Create Organizer

```text
POST /api/v1/admin/organizers
```

Example request:

```json
{
  "email": "organizer@example.com",
  "password": "initial-password"
}
```

Backend:

```text
Validates email
Hashes password
Creates User(role = ORGANIZER)
Creates AuditLog
```

Initial password delivery/reset strategy must avoid exposing stored credentials later.

---

# 63. Suspend Organizer

```text
POST /api/v1/admin/organizers/:userId/suspend
```

Backend:

```text
User.status = SUSPENDED
Revoke active Sessions
Create AuditLog
```

Albums and Media remain preserved.

---

# 64. Reactivate Organizer

```text
POST /api/v1/admin/organizers/:userId/reactivate
```

Backend:

```text
User.status = ACTIVE
Create AuditLog
```

Old revoked Sessions do not become active again.

Organizer must authenticate through a valid new/current mechanism.

---

# 65. Admin Album List

```text
GET /api/v1/admin/albums
```

Provides platform-wide Album management with pagination and filters.

---

# 66. Admin Create Album

```text
POST /api/v1/admin/albums
```

Example:

```json
{
  "organizerId": "...",
  "title": "Aziz & Malika",
  "eventDate": "2026-09-12T00:00:00.000Z",
  "timezone": "Asia/Tashkent",
  "status": "ACTIVE"
}
```

Backend:

```text
Validates Organizer
Creates unique publicIdentifier
Creates Album
Creates AuditLog
```

An initial Upload Window may either be included through a transactional creation DTO or created through the Upload Window endpoint immediately after Album creation.

Implementation must choose one consistent flow.

---

# 67. Admin Protected Album Update

```text
PATCH /api/v1/admin/albums/:albumId
```

May modify protected fields where authorized:

```text
title
eventDate
timezone
status
organizerId
```

`publicIdentifier` should preferably use a dedicated rotation operation because changing it affects QR codes and shared links.

Every sensitive change should create appropriate Audit history.

---

# 68. Reassign Album

Album reassignment may use:

```text
POST /api/v1/admin/albums/:albumId/reassign
```

Request:

```json
{
  "organizerId": "new-organizer-id"
}
```

Backend verifies the new User is an eligible Organizer.

Authorization changes take effect immediately.

The old Organizer's existing Livara Session may remain valid for their account but no longer authorizes this Album.

---

# 69. Public Identifier Rotation

Because rotation can invalidate existing QR codes:

```text
POST /api/v1/admin/albums/:albumId/rotate-public-identifier
```

requires explicit Super Admin action.

Backend:

```text
Generates new identifier
Updates Album
Creates AuditLog
```

The API should not allow accidental rotation through generic Album updates.

---

# 70. Delete Album

```text
DELETE /api/v1/admin/albums/:albumId
```

Requires Super Admin.

For recoverable Album:

```text
deletedAt = now
```

Guest access becomes unavailable.

Organizer normal access becomes unavailable.

Child resources are not immediately physically destroyed.

---

# 71. Recover Album

```text
POST /api/v1/admin/albums/:albumId/recover
```

Requires Super Admin.

Recovery must return the Album to a safe state.

It must not blindly reopen uploads.

Backend must evaluate related Upload Windows according to recovery policy.

---

# 72. Admin Audit Logs

```text
GET /api/v1/admin/audit-logs
```

Requires Super Admin.

Possible filters:

```text
actorUserId
albumId
action
targetType
targetId
date range
```

Uses pagination.

Audit records are read-oriented and not editable through normal API operations.

---

# 73. Admin Storage Overview

```text
GET /api/v1/admin/storage
```

May provide derived platform storage information.

This endpoint must not expose:

```text
R2 secret keys
internal credentials
```

Storage statistics may be calculated or aggregated according to implementation.

---

# 74. QR Access Data

Organizer may retrieve the Guest Album URL:

```text
GET /api/v1/albums/:albumId/qr
```

Example:

```json
{
  "success": true,
  "data": {
    "guestUrl": "https://...",
    "publicIdentifier": "..."
  }
}
```

The frontend may generate QR visuals from this URL.

---

# 75. QR Materials

If Livara generates printable QR materials server-side:

```text
POST /api/v1/albums/:albumId/qr-materials
```

may create a PDF generation request.

Simple MVP QR generation may instead happen synchronously if inexpensive.

QR material generation must not create a new Album identifier unless explicitly requested through Admin rotation.

---

# 76. Cursor Pagination

Large collection endpoints should use cursor pagination.

Examples:

```text
GET /albums/:id/media
GET /guest/albums/:publicIdentifier/media
GET /notifications
GET /admin/albums
GET /admin/audit-logs
```

Typical query:

```text
?limit=30&cursor=...
```

Response:

```json
{
  "pagination": {
    "nextCursor": "..."
  }
}
```

Cursor format is an API implementation detail and should be treated as opaque by clients.

---

# 77. Pagination Limits

The backend defines:

```text
default limit
maximum limit
```

Clients must not be able to request an unbounded Gallery such as:

```text
?limit=1000000
```

Exact numeric limits belong in configuration/API implementation.

---

# 78. Sorting

Endpoints should expose only supported sorting options.

Clients must not send arbitrary SQL column names.

Example:

```text
?sort=newest
```

rather than:

```text
?orderBy=whatever_database_column
```

where arbitrary input could leak persistence implementation.

---

# 79. Filtering

Filters should represent product concepts.

Example Organizer Media filters:

```text
type=IMAGE
status=READY
visibility=HIDDEN
```

Backend maps them to database queries.

---

# 80. Idempotency

Operations vulnerable to duplicate client retries should support idempotent behavior.

Important examples:

```text
Upload completion
Export creation where duplicate submission matters
Administrative actions where network retry could duplicate effects
```

An `Idempotency-Key` header may be introduced for selected POST operations.

The server must scope and expire idempotency records appropriately.

Exact persistence strategy will be defined during implementation.

---

# 81. Concurrency

API operations must remain safe under concurrent requests.

Example:

```text
Organizer hides Media
at the same time
Worker marks processing READY
```

Result must preserve both independent dimensions:

```text
status = READY
visibility = HIDDEN
```

Workers must not overwrite unrelated fields.

---

# 82. Rate Limiting

Rate limiting should be applied according to endpoint risk.

Sensitive examples:

```text
POST /auth/login
POST /guest/.../session
POST /guest/.../uploads
POST /albums/.../exports
Admin mutation endpoints
```

Guest rate limiting must account for many Guests sharing one event Wi-Fi/IP.

IP alone should not represent Guest identity.

---

# 83. Upload Limits

File restrictions should be configured centrally.

Possible rules:

```text
Allowed MIME types
Maximum image size
Maximum video size
Maximum files per upload intent
Guest rate limits
Album/package storage limits
```

Client validation may mirror these limits for UX.

Backend validation remains authoritative.

---

# 84. Upload Security

Temporary upload authorization must:

```text
Expire quickly
Target one expected object
Use server-generated storage key
Respect expected operation
Avoid permanent credentials
```

The Guest must not choose arbitrary R2 storage paths.

---

# 85. Download Security

Temporary download access must:

```text
Expire
Follow authorization checks
Reference expected object
Avoid permanent storage credentials
```

Knowing:

```text
originalStorageKey
```

must not itself grant access.

Storage keys should normally remain internal.

---

# 86. CSRF

If authenticated state-changing requests rely on cookies, the API must implement appropriate CSRF protection.

Possible mechanisms:

```text
SameSite cookie policy
Origin validation
CSRF token
```

according to deployment architecture.

Authentication alone does not automatically solve CSRF.

---

# 87. CORS

Production API must accept browser requests only from required Livara origins.

Credentialed wildcard CORS is prohibited.

Development origins are configured separately.

---

# 88. Guest Album Privacy

Guest endpoints must expose only information needed for the Guest experience.

Do not expose:

```text
Organizer email
User IDs unnecessarily
Audit Logs
Storage keys
Admin state
Internal errors
Deleted Media
Hidden Media
```

The unlisted public identifier provides entry, not administrative authority.

---

# 89. Not Found vs Forbidden

For sensitive resource lookups, the API may intentionally return:

```text
404 Not Found
```

instead of revealing that a protected resource exists but belongs to another Organizer.

The policy should remain consistent.

---

# 90. Audit Integration

Sensitive mutation endpoints create Audit Logs.

Examples:

```text
Create Organizer
Suspend Organizer
Reactivate Organizer
Create Album
Update protected Album data
Reassign Album
Rotate publicIdentifier
Delete Album
Recover Album
Recover Media
```

Audit logging should occur as part of the same reliable application operation where possible.

---

# 91. Notifications Integration

Product events may create Notifications.

Examples:

```text
Export READY
Export FAILED
Aggregated Media activity
Important Upload Window event
```

Notification creation may happen synchronously for simple cases or through BullMQ for aggregated/background events.

---

# 92. API and Queue Boundary

HTTP API creates persistent state before relying on background jobs.

Correct:

```text
Create Export row = QUEUED
      ↓
Commit
      ↓
Queue job
```

If queue delivery fails, the persistent Export still exists and can be reconciled.

Critical product state must not exist only inside BullMQ.

---

# 93. Queue Reconciliation

Because Redis/BullMQ is not the product source of truth, the system should allow recovery of stranded work.

Examples:

```text
Media status = UPLOADED
but processing job missing

Export status = QUEUED
but queue job missing
```

A reconciliation process may identify and requeue eligible persistent records.

---

# 94. API DTO Principle

Every endpoint uses explicit request and response DTOs.

Do not expose Prisma models directly.

Example:

```text
Prisma User
├── id
├── email
├── passwordHash
├── role
└── ...

API UserResponse
├── id
├── email
├── role
└── status
```

Sensitive persistence fields never leave the backend accidentally.

---

# 95. Protected DTO Principle

Organizer DTOs and Super Admin DTOs are different.

Example:

```text
OrganizerAlbumSettingsDto
```

must not contain:

```text
organizerId
publicIdentifier
eventDate
title
```

if those fields are protected.

Admin DTOs may expose authorized mutation fields explicitly.

---

# 96. Timezone Handling

API timestamps use ISO 8601.

Example:

```text
2026-09-19T13:00:00.000Z
```

Album also exposes its IANA timezone:

```text
Asia/Tashkent
```

Frontend uses the Album timezone for event-local presentation and input conversion.

Backend persists timestamps consistently in UTC.

---

# 97. Health Endpoints

Infrastructure endpoints may include:

```text
GET /health
GET /health/live
GET /health/ready
```

These may exist outside `/api/v1` because they represent deployment infrastructure rather than product API.

Health responses must not reveal credentials or sensitive infrastructure topology.

---

# 98. API Documentation

The NestJS API should generate machine-readable API documentation.

Recommended:

```text
OpenAPI
```

Documentation should describe:

```text
Routes
DTOs
Authentication
Response structures
Errors
Enums
```

Internal/admin documentation may be protected in production.

---

# 99. API Naming

Use consistent resource naming.

Preferred:

```text
/albums
/media
/exports
/notifications
/upload-windows
/audit-logs
```

Avoid mixing styles such as:

```text
/uploadWindows
/getAlbums
/create_export
```

HTTP method already communicates the action for normal CRUD operations.

Action endpoints are appropriate when representing domain operations such as:

```text
/hide
/recover
/reassign
/rotate-public-identifier
```

---

# 100. API Versioning Rules

Breaking contract changes require a new API version or controlled migration strategy.

Non-breaking additions may remain within:

```text
v1
```

Examples of potentially breaking changes:

```text
Removing response fields
Changing field meaning
Changing authentication behavior
Changing enum semantics
Changing endpoint ownership rules
```

---

# 101. Core Guest API Summary

```text
GET
/guest/albums/:publicIdentifier

POST
/guest/albums/:publicIdentifier/session

GET
/guest/albums/:publicIdentifier/media

GET
/guest/albums/:publicIdentifier/media/:mediaId

POST
/guest/albums/:publicIdentifier/uploads

POST
/guest/albums/:publicIdentifier/uploads/:mediaId/complete

GET
/guest/albums/:publicIdentifier/uploads/:mediaId
```

This is enough to support:

```text
QR
→ Album
→ Guest Session
→ Gallery
→ Upload
→ Processing
→ Shared Memory
```

---

# 102. Core Organizer API Summary

```text
GET
/albums

GET
/albums/:albumId

GET
/albums/:albumId/overview

GET
/albums/:albumId/upload-windows

POST
/albums/:albumId/upload-windows

PATCH
/albums/:albumId/upload-windows/:windowId

DELETE
/albums/:albumId/upload-windows/:windowId

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

GET
/albums/:albumId/media/:mediaId/download

POST
/albums/:albumId/exports

GET
/albums/:albumId/exports

GET
/albums/:albumId/exports/:exportId

GET
/albums/:albumId/exports/:exportId/download

GET
/albums/:albumId/qr

GET
/notifications

GET
/notifications/unread-count

POST
/notifications/:notificationId/read

POST
/notifications/read-all
```

---

# 103. Core Admin API Summary

```text
GET
/admin/organizers

POST
/admin/organizers

POST
/admin/organizers/:userId/suspend

POST
/admin/organizers/:userId/reactivate

GET
/admin/albums

POST
/admin/albums

PATCH
/admin/albums/:albumId

POST
/admin/albums/:albumId/reassign

POST
/admin/albums/:albumId/rotate-public-identifier

DELETE
/admin/albums/:albumId

POST
/admin/albums/:albumId/recover

POST
/admin/media/:mediaId/recover

GET
/admin/audit-logs

GET
/admin/storage
```

Additional administrative read endpoints may be introduced as the Admin Dashboard is implemented.

---

# 104. API Acceptance Criteria

API v1 is valid when:

- All product endpoints live under a consistent version
- User authentication is separate from Guest Sessions
- Organizer and Super Admin authentication uses persistent Session state
- Raw tokens are never returned/stored unnecessarily
- Every protected endpoint performs backend authorization
- Organizer can access only assigned Albums
- Guest Session is scoped to one Album
- Guest can enter an Album without traditional registration
- Guest endpoints expose only Guest-safe data
- Upload permission is derived from Upload Windows
- No API endpoint introduces `uploadsEnabled` as competing truth
- Organizer cannot directly modify protected Album fields
- Super Admin has explicit protected mutation operations
- Direct-to-R2 upload is supported
- Upload Intent validates permission before issuing storage access
- Each selected file may succeed or fail independently
- Upload completion is safely retryable
- Media processing remains asynchronous
- Media status and visibility remain independent
- Deletion remains independent from visibility
- Guest Gallery returns only READY + VISIBLE + non-deleted Media
- Large collections use pagination
- Downloads use temporary authorized access
- Exports are asynchronous
- Selected exports validate relational Media ownership
- Notifications are user-scoped
- Audit Logs are separate from Notifications
- Album recovery does not automatically reopen uploads
- Rate limits account for shared event networks
- DTOs prevent persistence fields from leaking
- Stable error codes are used
- Critical persistent state exists in PostgreSQL before asynchronous processing
- Queue loss can be reconciled from persistent state
- API remains compatible with future self-service onboarding

---

# 105. Complete API Flow

The central Guest flow:

```text
QR
 ↓
GET Guest Album
 ↓
Create / Restore Guest Session
 ↓
GET Gallery
 ↓
Guest Selects Media
 ↓
POST Upload Intent
 ↓
API checks:
Album
Guest
Upload Window
File Limits
 ↓
Media = PENDING
 ↓
Temporary R2 Upload Access
 ↓
Phone ─────────────→ R2
 ↓
POST Complete
 ↓
Media = UPLOADED
 ↓
BullMQ
 ↓
Worker
 ↓
PROCESSING
 ↓
READY
 ↓
Gallery
```

Organizer:

```text
Login
 ↓
Dashboard
 ↓
Album
 ├── Gallery Management
 ├── Upload Windows
 ├── Downloads
 ├── Exports
 ├── QR
 └── Notifications
```

Super Admin:

```text
Login
 ↓
Admin
 ├── Organizers
 ├── Albums
 ├── Protected Changes
 ├── Recovery
 ├── Storage
 └── Audit
```

---

# 106. API Summary

Livara API v1 separates three access models:

```text
SUPER_ADMIN
ORGANIZER
GUEST
```

and preserves the core architecture:

```text
Client
  ↓
NestJS API
  ↓
PostgreSQL

Media Binary
  ↓
Cloudflare R2

Long-running Work
  ↓
Redis / BullMQ
  ↓
Workers
```

The API controls permissions and product state.

PostgreSQL stores product truth.

R2 stores Media.

BullMQ coordinates asynchronous work.

The client provides interaction, not authority.

The resulting API supports Livara's core experience:

**Relive your event through every guest's eyes.**

**Every guest becomes a storyteller.**