# Livara Database

**Project:** Livara

**Document Type:** Database Design

**Product Stage:** MVP

**Database:** PostgreSQL

**ORM:** Prisma

**Document Version:** 1.0

> 🇷🇺
> Этот документ определяет логическую модель данных Livara MVP.
>
> Он описывает сущности, связи, ограничения, состояния, индексы, правила удаления и источники истины.
>
> Физическая реализация этой модели будет определена в `schema.prisma` и Prisma migrations.

---

# 1. Database Goals

The database must provide a reliable source of truth for Livara product state.

Primary goals:

- Clear relational model
- Strong ownership relationships
- Safe authentication sessions
- Separate Guest identity and Guest sessions
- Multiple Upload Windows per Album
- Reliable Media lifecycle tracking
- Separate processing, visibility, and deletion state
- Asynchronous Export tracking
- Persistent Notifications
- Durable Audit Logs
- Safe soft deletion and recovery
- Efficient Gallery queries
- Future self-service compatibility

> 🇷🇺
> PostgreSQL является главным источником истины для состояния Livara.
>
> Redis используется для очередей и временной координации, а Cloudflare R2 — для хранения файлов. Критическое состояние продукта не должно существовать только в Redis или на клиенте.

---

# 2. Core Entities

Livara MVP uses the following primary entities:

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

Conceptual relationship:

```text
User
 ├── Sessions
 ├── Owned Albums
 ├── Notifications
 └── Audit Logs as Actor

Album
 ├── Organizer
 ├── Upload Windows
 ├── Guests
 │    └── Guest Sessions
 ├── Media
 ├── Exports
 └── Notifications
```

---

# 3. General Conventions

Primary internal identifiers should use non-sequential globally unique IDs.

Recommended:

```text
UUID
```

or another supported globally unique identifier chosen consistently during Prisma implementation.

Public Guest identifiers are separate from internal database IDs.

All timestamps should be stored consistently in UTC.

Core timestamp fields:

```text
createdAt
updatedAt
```

Soft-deletable resources additionally use:

```text
deletedAt
```

Nullable fields should only be used when absence has clear product meaning.

> 🇷🇺
> Внутренний `id` и публичный идентификатор Album — разные вещи.
>
> Гостю нельзя показывать последовательные database ID вроде `/event/145`.
>
> Для QR используется отдельный трудноугадываемый публичный идентификатор.

---

# 4. User

`User` represents authenticated Livara accounts.

MVP authenticated roles:

```text
SUPER_ADMIN
ORGANIZER
```

Guest is not a User.

Conceptual model:

```text
User
├── id
├── email
├── passwordHash
├── role
├── status
├── createdAt
├── updatedAt
└── deletedAt
```

---

# 5. User Fields

## id

Internal primary key.

```text
UNIQUE
NOT NULL
PRIMARY KEY
```

---

## email

User login email.

Requirements:

```text
UNIQUE
NOT NULL
```

Email should be normalized before persistence.

Case-insensitive uniqueness must be guaranteed either through normalized storage or an appropriate database strategy.

---

## passwordHash

Secure password hash.

```text
NOT NULL
```

Raw passwords must never be stored.

---

## role

Enum:

```text
SUPER_ADMIN
ORGANIZER
```

Guest must not be represented through this enum.

---

## status

Enum:

```text
ACTIVE
SUSPENDED
```

Suspension blocks authenticated access without deleting the User or their Albums.

---

## deletedAt

Optional soft deletion timestamp.

A deleted User must not be able to authenticate.

Deletion policy for Users must account for owned Albums and Audit history.

---

# 6. UserRole

```text
SUPER_ADMIN
ORGANIZER
```

The database role represents broad platform authority.

Resource-level authorization is still required.

Example:

```text
role = ORGANIZER
```

does not mean the User may access every Album.

---

# 7. UserStatus

```text
ACTIVE
SUSPENDED
```

MVP does not require unnecessary lifecycle states unless product requirements introduce them later.

---

# 8. Session

`Session` represents an authenticated User login context.

One User may have multiple Sessions.

```text
User
  1
  │
  └──── *
       Session
```

Conceptual model:

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

---

# 9. Session Rules

`refreshTokenHash` stores only a secure hash or equivalent safe representation.

Never store:

```text
raw refresh token
raw access token
```

A Session is valid when product authentication rules consider:

```text
revokedAt IS NULL
AND
expiresAt > now
AND
User.status = ACTIVE
AND
User.deletedAt IS NULL
```

Logout may revoke the current Session.

Logout-all may revoke all active Sessions belonging to the User.

---

# 10. Why There Is No RefreshToken Entity

MVP does not use both:

```text
Session
+
RefreshToken
```

as parallel persistent concepts.

Refresh lifecycle belongs to Session.

This avoids duplicated state such as:

```text
Session says active
RefreshToken says revoked
```

One authenticated login context has one authoritative Session record.

> 🇷🇺
> Отдельная таблица `RefreshToken` для MVP не нужна.
>
> Сессия уже хранит состояние refresh-механизма, срок действия и отзыв.
>
> Это уменьшает вероятность противоречивых состояний.

---

# 11. Album

`Album` is the central product entity.

Conceptual model:

```text
Album
├── id
├── organizerId
├── publicIdentifier
├── title
├── eventDate
├── status
├── createdAt
├── updatedAt
└── deletedAt
```

Relationships:

```text
Organizer User
      1
      │
      └──── *
           Album
```

An Organizer may manage multiple Albums.

Each Album has one Organizer owner in MVP.

---

# 12. Album Fields

## organizerId

Foreign key:

```text
Album.organizerId
→ User.id
```

The referenced User must represent an Organizer according to business rules.

Database foreign keys alone cannot enforce role semantics, so application logic must validate this.

---

## publicIdentifier

Public identifier used for Guest access and QR URLs.

Requirements:

```text
UNIQUE
NOT NULL
UNGUESSABLE
```

Example conceptual URL:

```text
/event/{publicIdentifier}
```

The public identifier must not be derived from sequential Album IDs.

---

## title

Human-readable event title.

Example:

```text
Aziz & Malika
```

Protected during managed MVP.

Only authorized Super Admin operations may modify it.

---

## eventDate

Primary event date.

This is not the same as Upload Window start/end time.

One Album may have Upload Windows before or after the main event date.

---

## status

Album lifecycle state.

Recommended enum:

```text
DRAFT
ACTIVE
ARCHIVED
```

Deletion is represented separately through `deletedAt`.

This avoids mixing lifecycle state with deletion state.

---

# 13. AlbumStatus

```text
DRAFT
ACTIVE
ARCHIVED
```

### DRAFT

Album exists but is not ready for normal Guest use.

### ACTIVE

Album is available according to product access rules.

Uploads may still be open or closed independently.

### ARCHIVED

Album remains preserved but normal Guest behavior may be restricted according to product policy.

Deletion is not an AlbumStatus.

```text
deletedAt != null
```

represents soft deletion.

---

# 14. No uploadsEnabled Field

Album must not contain a primary boolean such as:

```text
uploadsEnabled
```

to independently determine Guest upload availability.

Upload permission is derived from Upload Windows and other product rules.

Conceptually:

```text
CAN_UPLOAD =
Album.status = ACTIVE
AND
Album.deletedAt IS NULL
AND
Active UploadWindow exists
AND
Guest Session valid
AND
Platform restrictions pass
```

> 🇷🇺
> Мы специально не создаём `Album.uploadsEnabled`.
>
> Иначе может возникнуть ситуация:
>
> `uploadsEnabled = true`, но Upload Window уже закончился.
>
> Источник истины должен быть один.

---

# 15. UploadWindow

`UploadWindow` represents a period when Guests may contribute new Media.

Relationship:

```text
Album
  1
  │
  └──── *
       UploadWindow
```

Conceptual model:

```text
UploadWindow
├── id
├── albumId
├── name
├── startsAt
├── endsAt
├── createdAt
└── updatedAt
```

---

# 16. UploadWindow Fields

## name

Optional or required according to final Prisma decision.

Human-readable label such as:

```text
Wedding
Chilla
Family Gathering
```

This label is not the source of business behavior.

---

## startsAt

Timestamp at which Guest uploads become permitted.

---

## endsAt

Timestamp at which Guest uploads stop being permitted.

Constraint:

```text
endsAt > startsAt
```

---

# 17. UploadWindow Active State

Active state is derived.

```text
startsAt <= now
AND
now < endsAt
```

No persistent `isActive` field is required.

This prevents time-based state from becoming stale.

> 🇷🇺
> `UploadWindow.isActive` не нужен.
>
> Если сервер или Worker был выключен в момент начала окна, состояние всё равно определяется корректно по времени после запуска.

---

# 18. UploadWindow Overlap

For MVP, Upload Windows belonging to the same Album should not overlap.

Invalid:

```text
Window A
10:00 ───────── 18:00

Window B
        15:00 ───────── 22:00
```

Valid:

```text
Wedding
September 12

Chilla
September 19
```

Overlap validation may be enforced through application logic and, where practical, database-level constraints.

---

# 19. Guest

`Guest` represents a participant identity within one Album.

Guest is not a platform User.

Relationship:

```text
Album
  1
  │
  └──── *
       Guest
```

Conceptual model:

```text
Guest
├── id
├── albumId
├── displayName
├── createdAt
├── updatedAt
└── deletedAt
```

`displayName` may be nullable if MVP allows completely anonymous participation.

---

# 20. Guest Identity

Guest identity is scoped to an Album.

A Guest from Album A has no automatic identity relationship with Album B.

```text
Guest
→ belongs to one Album
```

Future versions may introduce registered Guest identities, but MVP must not require them.

---

# 21. GuestSession

`GuestSession` represents Guest access from a browser/session context.

Relationship:

```text
Guest
  1
  │
  └──── *
       GuestSession
```

Conceptual model:

```text
GuestSession
├── id
├── guestId
├── tokenHash
├── expiresAt
├── lastSeenAt
├── revokedAt
├── createdAt
└── updatedAt
```

---

# 22. GuestSession Rules

Raw Guest session tokens must never be stored.

Store:

```text
tokenHash
```

or an equivalent secure representation.

GuestSession validity depends on:

```text
revokedAt IS NULL
expiresAt > now
Guest.deletedAt IS NULL
Album available
```

One Guest may have multiple Guest Sessions.

This allows future multi-device or renewed-session behavior without redesigning Guest.

---

# 23. Media

`Media` represents one uploaded photo or video.

Relationship:

```text
Album
  1
  │
  └──── *
       Media

Guest
  1
  │
  └──── *
       Media
```

For Guest uploads, Media belongs to both an Album and the Guest who contributed it.

Conceptual model:

```text
Media
├── id
├── albumId
├── guestId
├── type
├── status
├── visibility
├── originalFilename
├── mimeType
├── sizeBytes
├── width
├── height
├── durationMs
├── originalStorageKey
├── optimizedStorageKey
├── thumbnailStorageKey
├── failureCode
├── createdAt
├── updatedAt
└── deletedAt
```

---

# 24. MediaType

```text
IMAGE
VIDEO
```

Media type is a product-level category.

`mimeType` stores the validated technical MIME type separately.

---

# 25. MediaStatus

Recommended lifecycle:

```text
PENDING
UPLOADED
PROCESSING
READY
FAILED
```

### PENDING

Media record exists and upload authorization has been issued, but upload completion has not been confirmed.

### UPLOADED

Original object has been uploaded and confirmed, but processing has not completed.

### PROCESSING

Worker is validating or generating derivatives.

### READY

Media successfully passed processing and may be used according to visibility rules.

### FAILED

Upload validation or processing failed.

Deletion is not a MediaStatus.

---

# 26. MediaVisibility

Visibility is independent from processing.

Enum:

```text
VISIBLE
HIDDEN
```

Example:

```text
status = READY
visibility = VISIBLE
deletedAt = null
```

Guest Gallery may show the Media.

Example:

```text
status = READY
visibility = HIDDEN
deletedAt = null
```

Organizer may manage the Media, but Guest Gallery must not show it.

---

# 27. Media Deletion

Deletion is represented through:

```text
deletedAt
```

not through `MediaStatus` or `MediaVisibility`.

Therefore three dimensions remain independent:

```text
Processing
→ status

Moderation
→ visibility

Deletion
→ deletedAt
```

This distinction must be preserved in Prisma and API design.

---

# 28. Media Storage Fields

## originalStorageKey

Required once original upload has been accepted.

Represents the R2 object key for the original Media.

Example conceptual key:

```text
albums/{albumId}/originals/{mediaId}.jpg
```

Storage keys are generated by trusted backend logic.

---

## optimizedStorageKey

Nullable.

Used for optimized Gallery delivery where applicable.

---

## thumbnailStorageKey

Nullable.

Used for previews and Gallery thumbnails.

---

# 29. Original Filename

`originalFilename` may preserve the filename supplied by the Guest device for metadata or export purposes.

It must never be trusted as:

```text
storage path
authorization data
MIME validation
```

Unsafe characters must not influence storage structure.

---

# 30. Media Metadata

Image Media may use:

```text
width
height
```

Video Media may additionally use:

```text
durationMs
```

Fields may remain nullable until processing extracts metadata.

Client-provided values are not authoritative.

---

# 31. Media Failure

Failed Media may store a stable internal/product failure code:

```text
failureCode
```

Examples:

```text
INVALID_FILE
UNSUPPORTED_FORMAT
OBJECT_MISSING
PROCESSING_FAILED
```

Sensitive raw infrastructure errors should not be stored as user-facing messages.

Detailed diagnostics belong in logs/error tracking where appropriate.

---

# 32. Media Gallery Query

Guest Gallery conceptually returns Media satisfying:

```text
albumId = target Album
status = READY
visibility = VISIBLE
deletedAt IS NULL
```

Additional Album availability rules apply.

This query pattern should receive appropriate indexing.

---

# 33. Media Upload Ownership

When an upload intent is created, the Media record is associated with:

```text
albumId
guestId
```

before temporary upload authorization is returned.

This prevents uploaded objects from existing without expected product ownership metadata.

Abandoned PENDING Media may later be cleaned by background jobs.

---

# 34. Export

`Export` represents an asynchronous downloadable archive request.

Relationship:

```text
Album
  1
  │
  └──── *
       Export

User
  1
  │
  └──── *
       Export
```

Conceptual model:

```text
Export
├── id
├── albumId
├── requestedByUserId
├── type
├── status
├── storageKey
├── expiresAt
├── failureCode
├── createdAt
├── updatedAt
└── completedAt
```

---

# 35. ExportType

Recommended:

```text
FULL_ALBUM
SELECTED_MEDIA
```

For `SELECTED_MEDIA`, selected Media membership must be represented reliably.

Recommended relational model:

```text
Export
  1
  │
  └──── *
       ExportItem
              *
              │
              1
            Media
```

This introduces supporting entity:

```text
ExportItem
├── exportId
└── mediaId
```

Composite uniqueness:

```text
UNIQUE(exportId, mediaId)
```

> 🇷🇺
> Список выбранных Media не стоит хранить одной строкой или JSON-массивом ID.
>
> `ExportItem` сохраняет нормальную relational-связь и позволяет базе гарантировать целостность.

---

# 36. ExportStatus

```text
QUEUED
PROCESSING
READY
FAILED
EXPIRED
```

### QUEUED

Export request exists and awaits processing.

### PROCESSING

Worker is creating the archive.

### READY

Archive is available for authorized download.

### FAILED

Export generation failed.

### EXPIRED

Temporary archive is no longer available.

---

# 37. Export Storage

`storageKey` is nullable until an archive has been successfully created.

Do not persist permanent signed URLs.

Correct model:

```text
storageKey
```

Then:

```text
Download Request
      ↓
Authorization
      ↓
Temporary Signed URL
```

---

# 38. Export Expiration

`expiresAt` defines how long a generated archive remains available.

When expired:

```text
status = EXPIRED
```

and the temporary R2 archive may be deleted asynchronously.

The Export record may remain for history according to retention policy.

---

# 39. ExportItem

Supporting entity for selected Media exports.

Conceptual model:

```text
ExportItem
├── exportId
├── mediaId
└── createdAt
```

Primary key may be:

```text
(exportId, mediaId)
```

or a dedicated ID plus unique composite constraint.

The exact Prisma implementation will be chosen during schema creation.

---

# 40. Notification

`Notification` represents a persistent user-facing message.

Relationship:

```text
User
  1
  │
  └──── *
       Notification
```

A Notification may optionally relate to an Album.

Conceptual model:

```text
Notification
├── id
├── userId
├── albumId
├── type
├── title
├── message
├── metadata
├── readAt
├── createdAt
└── expiresAt
```

---

# 41. NotificationType

Initial types may include:

```text
MEDIA_ACTIVITY
UPLOAD_WINDOW
EXPORT_READY
EXPORT_FAILED
STORAGE_WARNING
SYSTEM
```

Exact enum values may evolve as API behavior is finalized.

Notification type should represent product meaning rather than delivery mechanism.

Do not create types such as:

```text
EMAIL
PUSH
WEBSOCKET
```

unless modeling delivery channels separately.

---

# 42. Notification Metadata

`metadata` may use PostgreSQL JSON/JSONB for small flexible contextual data.

Example:

```json
{
  "albumId": "...",
  "newMediaCount": 47
}
```

JSON must not replace proper relational columns for core relationships.

For example:

```text
userId
albumId
```

should remain relational fields where they define ownership/access.

---

# 43. Notification Read State

Use:

```text
readAt
```

rather than only:

```text
isRead
```

because the timestamp provides both state and useful history.

Unread:

```text
readAt IS NULL
```

Read:

```text
readAt IS NOT NULL
```

---

# 44. AuditLog

`AuditLog` stores durable history of sensitive actions.

Conceptual model:

```text
AuditLog
├── id
├── actorUserId
├── action
├── targetType
├── targetId
├── albumId
├── metadata
├── ipAddress
├── createdAt
```

Audit Logs are append-oriented records.

Normal product flows should not update old Audit Logs.

---

# 45. Audit Actor

`actorUserId` references the authenticated User responsible for the action where applicable.

Some future automated actions may have no User actor.

Therefore `actorUserId` may be nullable if system-generated audit events are supported.

The application must distinguish:

```text
User action
System action
```

through action/metadata conventions.

---

# 46. AuditAction

Initial actions may include:

```text
USER_CREATED
USER_SUSPENDED
USER_REACTIVATED
SESSIONS_REVOKED

ALBUM_CREATED
ALBUM_UPDATED
ALBUM_REASSIGNED
ALBUM_DELETED
ALBUM_RECOVERED

UPLOAD_WINDOW_CREATED
UPLOAD_WINDOW_UPDATED
UPLOAD_WINDOW_DELETED

MEDIA_HIDDEN
MEDIA_RESTORED
MEDIA_DELETED
MEDIA_RECOVERED

EXPORT_REQUESTED
```

Exact enum values should reflect actions requiring durable administrative history.

Not every Gallery view or Guest upload needs an AuditLog.

---

# 47. Audit Target

AuditLog may use:

```text
targetType
targetId
```

to represent different audited resources.

Example:

```text
targetType = ALBUM
targetId = album.id
```

Because polymorphic foreign keys are not naturally enforced by PostgreSQL through one column, `targetId` may not have a universal FK.

Important direct relationships such as `actorUserId` and `albumId` should still use real foreign keys.

> 🇷🇺
> Audit Log — один из редких случаев, где `targetType + targetId` оправданы.
>
> Но это не означает, что всю базу нужно строить через polymorphic IDs.

---

# 48. Notification vs AuditLog

These entities serve different purposes.

```text
Notification
→ What should the User know?

AuditLog
→ Who changed what and when?
```

Notifications may expire or be deleted according to product policy.

Audit Logs may require longer retention.

Deleting a Notification must never erase Audit history.

---

# 49. Soft Delete Strategy

Resources requiring recovery may use:

```text
deletedAt
```

Initial soft-delete candidates:

```text
User
Album
Guest
Media
```

Not every entity requires soft deletion.

For example, Sessions may be revoked/expired instead.

Export lifecycle is represented through ExportStatus.

Audit Logs should not be soft-deleted through normal product operations.

---

# 50. Soft Delete Query Rule

Normal application queries must exclude:

```text
deletedAt IS NOT NULL
```

unless explicitly performing:

```text
Admin recovery
Retention cleanup
Audit/support operation
```

Soft deletion is not useful if every service independently forgets to filter deleted resources.

Implementation should provide consistent repository/service patterns.

---

# 51. Album Soft Delete

Soft deleting an Album must make its normal Guest and Organizer product access unavailable according to authorization rules.

It must not immediately delete:

```text
Media
UploadWindows
Guests
Exports
```

from the database.

Physical cleanup happens according to retention policy.

---

# 52. Album Recovery

Recovery clears:

```text
Album.deletedAt
```

and places the Album into a safe product state if necessary.

Recovery must not automatically create an active Upload Window.

Existing future Upload Windows must be reviewed according to recovery policy.

> 🇷🇺
> Если Album восстановили через месяц, нельзя случайно обнаружить, что старое окно загрузки снова делает его открытым.
>
> Recovery service должен проверять связанные временные правила и возвращать Album в безопасное состояние.

---

# 53. Media Soft Delete

Soft deleting Media sets:

```text
deletedAt
```

Guest Gallery immediately excludes it.

The R2 original and derivatives may remain during the recovery period.

After retention expires:

```text
Cleanup Worker
      ↓
Delete R2 Objects
      ↓
Finalize Database Cleanup
```

Exact permanent deletion strategy will be defined during implementation.

---

# 54. Referential Integrity

Foreign keys should be used for real relational ownership.

Examples:

```text
Session.userId → User.id

Album.organizerId → User.id

UploadWindow.albumId → Album.id

Guest.albumId → Album.id

GuestSession.guestId → Guest.id

Media.albumId → Album.id

Media.guestId → Guest.id

Export.albumId → Album.id

Export.requestedByUserId → User.id

ExportItem.exportId → Export.id

ExportItem.mediaId → Media.id

Notification.userId → User.id

Notification.albumId → Album.id

AuditLog.actorUserId → User.id

AuditLog.albumId → Album.id
```

Nullable relationships are allowed only where product semantics require them.

---

# 55. Cascade Strategy

Database cascade deletion must be used carefully.

Because Livara uses recovery and Audit history, broad:

```text
ON DELETE CASCADE
```

on major product entities may be dangerous.

Example:

Deleting a User must not accidentally erase:

```text
Albums
Media
Audit Logs
```

MVP should prefer explicit application-managed deletion and restrictive FK behavior for important resources.

Cascade may be appropriate for purely dependent records where recovery semantics are clear.

Example candidate:

```text
ExportItem
```

when its Export is permanently deleted.

---

# 56. Unique Constraints

Recommended uniqueness constraints include:

```text
User.email

Album.publicIdentifier

GuestSession.tokenHash

Session.refreshTokenHash
```

where the authentication design requires token-hash lookup.

Supporting uniqueness:

```text
ExportItem(exportId, mediaId)
```

Additional constraints may be added during Prisma implementation.

---

# 57. Index Strategy

Indexes should support actual access patterns.

Recommended initial indexes:

### User

```text
email
status
```

### Session

```text
userId
expiresAt
revokedAt
refreshTokenHash
```

### Album

```text
organizerId
publicIdentifier
status
eventDate
deletedAt
```

### UploadWindow

```text
albumId
startsAt
endsAt
```

### Guest

```text
albumId
deletedAt
```

### GuestSession

```text
guestId
tokenHash
expiresAt
```

### Media

```text
albumId
guestId
status
visibility
deletedAt
createdAt
```

Gallery-oriented composite index should be considered:

```text
(albumId, status, visibility, deletedAt, createdAt)
```

### Export

```text
albumId
requestedByUserId
status
createdAt
expiresAt
```

### Notification

```text
userId
readAt
createdAt
```

### AuditLog

```text
actorUserId
albumId
action
createdAt
targetType
targetId
```

Exact index ordering should be validated against real queries.

---

# 58. Gallery Pagination

Gallery should use stable cursor pagination.

A common cursor candidate is:

```text
createdAt + id
```

rather than `createdAt` alone.

Reason:

Multiple Media rows may share the same timestamp.

Conceptual ordering:

```text
ORDER BY createdAt DESC, id DESC
```

Cursor contains enough information to continue consistently.

---

# 59. Money and Packages

MVP managed sales do not require payment tables unless online payment becomes part of the product.

Current business flow:

```text
Customer pays through managed business process
        ↓
Super Admin creates Album
```

Therefore entities such as:

```text
Payment
Subscription
Invoice
Plan
```

are not required in Database v1.0.

The schema must remain extendable so these can be added later.

> 🇷🇺
> Мы не добавляем таблицы ради будущего функционала, которого пока нет.
>
> Когда появится self-service и онлайн-оплата, Billing станет отдельным доменом.

---

# 60. QR Storage

The QR code itself does not require a database entity for the core MVP.

QR can be generated from:

```text
Album.publicIdentifier
```

Multiple QR designs may point to the same URL.

If future functionality requires saved QR templates, analytics, or unique QR campaigns, a dedicated entity can be introduced later.

---

# 61. Album Settings

Avoid creating dozens of nullable columns for every possible future setting.

MVP settings that affect core authorization or product behavior should use explicit typed columns or entities.

Flexible presentation-only settings may later use a controlled JSON structure if justified.

Core rules such as Upload Windows must never be hidden inside arbitrary JSON.

---

# 62. Guest Download Settings

If MVP allows Organizer to control whether Guests may download Media, this should be represented as an explicit Album setting.

Conceptual example:

```text
guestDownloadsEnabled Boolean
```

This is different from `uploadsEnabled`.

Download permission is a persistent configuration choice.

Upload availability is time-derived from Upload Windows.

The exact inclusion of this field will be decided during `schema.prisma` implementation based on final API scope.

---

# 63. Timestamps

Use UTC timestamps for persistent time values.

Examples:

```text
eventDate
startsAt
endsAt
expiresAt
createdAt
updatedAt
deletedAt
readAt
revokedAt
completedAt
lastSeenAt
```

Frontend converts timestamps to appropriate display timezone.

Event timezone requirements should be explicitly addressed before scheduling behavior is finalized.

---

# 64. Event Timezone

Because Upload Windows are time-sensitive, an Album should have a defined event timezone.

Recommended field:

```text
timezone
```

Example:

```text
Asia/Tashkent
```

Store timezone as an IANA timezone identifier.

Example:

```text
Asia/Tashkent
Europe/London
America/New_York
```

Do not store only:

```text
UTC+5
```

because timezone rules may vary by region.

> 🇷🇺
> Это важно даже для Узбекистана.
>
> В базе сами timestamps хранятся в UTC, но Album должен знать, в каком часовом поясе пользователь задавал «19 сентября, 18:00».

---

# 65. Updated Album Model

With timezone included, conceptual Album becomes:

```text
Album
├── id
├── organizerId
├── publicIdentifier
├── title
├── eventDate
├── timezone
├── status
├── createdAt
├── updatedAt
└── deletedAt
```

`timezone` should be required.

---

# 66. Media Source

MVP primarily expects Guest uploads.

However, future Organizer or photographer uploads may be introduced.

Do not overload `guestId` to represent every possible source forever.

For MVP, `guestId` may be nullable if administrative/system Media creation is supported.

Recommended conceptual fields:

```text
guestId nullable
uploadedByUserId nullable
```

Rules:

```text
Guest upload
→ guestId set

Authenticated User upload
→ uploadedByUserId set
```

At least one valid source should exist for normal Media.

Exact database constraint may be implemented in application logic initially.

---

# 67. Updated Media Model

Recommended conceptual model:

```text
Media
├── id
├── albumId
├── guestId?
├── uploadedByUserId?
├── type
├── status
├── visibility
├── originalFilename
├── mimeType
├── sizeBytes
├── width?
├── height?
├── durationMs?
├── originalStorageKey?
├── optimizedStorageKey?
├── thumbnailStorageKey?
├── failureCode?
├── createdAt
├── updatedAt
└── deletedAt?
```

This keeps MVP Guest uploads simple while avoiding a schema dead end.

---

# 68. Storage Usage

Storage usage should be derived from authoritative Media/object metadata where possible.

Do not maintain a single manually incremented Album storage counter as the only source of truth unless consistency strategy is defined.

For performance, cached/aggregated counters may be introduced later.

The underlying Media records and storage state remain authoritative.

---

# 69. Data Ownership

Primary ownership hierarchy:

```text
Organizer User
      ↓
Album
      ↓
Album Resources
```

Album resources include:

```text
UploadWindows
Guests
Media
Exports
```

Notifications belong primarily to Users.

Sessions belong to Users.

GuestSessions belong to Guests.

Audit Logs describe actions rather than product ownership.

---

# 70. Organizer Reassignment

Album ownership may be reassigned by Super Admin.

Updating:

```text
Album.organizerId
```

must be performed through a protected service operation.

Reassignment should create an AuditLog.

Existing old Organizer Sessions do not need to be revoked globally, but authorization checks must immediately prevent the old Organizer from accessing the reassigned Album.

> 🇷🇺
> Именно поэтому ownership проверяется при каждом защищённом запросе.
>
> Старый Organizer может оставаться авторизованным в Livara, но после reassignment он уже не имеет доступа к этому Album.

---

# 71. Session Revocation

Suspending a User should revoke active Sessions.

Conceptually:

```text
User.status = SUSPENDED

+

Session.revokedAt = now
WHERE userId = targetUser
AND revokedAt IS NULL
```

Both checks remain useful:

- User status blocks access
- Session revocation invalidates existing login contexts

---

# 72. Guest Session Expiration

Guest Sessions may live long enough to support returning Guests, but they should not be permanent secrets.

Expiration policy should balance:

```text
Low friction
Security
Album lifecycle
```

Expired Guest Sessions may be renewed by creating a new GuestSession according to Guest access rules.

Exact lifetime is configuration, not schema design.

---

# 73. Public Identifier Rotation

`Album.publicIdentifier` is protected because changing it invalidates existing QR codes and shared links.

If rotation is ever required:

```text
Old QR
→ may stop working
```

Therefore rotation must be a deliberate Super Admin operation.

Future versions may introduce alias/history support if preserving old links becomes necessary.

MVP uses one active public identifier per Album.

---

# 74. Retention

Different resources may have different retention policies.

Examples:

```text
Original Media
→ customer/package retention

Soft-deleted Media
→ recovery retention

Export ZIP
→ short temporary retention

Sessions
→ authentication retention

Notifications
→ product retention

Audit Logs
→ administrative retention
```

Retention durations belong in configuration/business policy, not hardcoded database structure.

---

# 75. Cleanup Safety

Cleanup workers must select resources based on persistent database state.

Incorrect:

```text
Redis job missing
→ delete file
```

Correct:

```text
Database says:
deletedAt older than retention
        ↓
Cleanup eligible
```

The cleanup operation should be idempotent.

---

# 76. Concurrency

Database operations must account for concurrent Guests and workers.

Examples:

- Multiple Guests uploading simultaneously
- Two workers attempting the same job
- Organizer hiding Media while processing completes
- Export requested while Media changes

Critical transitions should use atomic database operations or transactions where appropriate.

---

# 77. Media State Transitions

Allowed transitions should be controlled by application logic.

Typical:

```text
PENDING
  ↓
UPLOADED
  ↓
PROCESSING
  ↓
READY
```

Failure:

```text
PENDING → FAILED
UPLOADED → FAILED
PROCESSING → FAILED
```

Invalid examples:

```text
READY → PENDING
FAILED → READY
```

unless an explicit retry/recovery flow defines them.

Visibility changes do not modify MediaStatus.

---

# 78. Export State Transitions

Typical:

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
QUEUED → FAILED
PROCESSING → FAILED
```

Retry policy may either reuse the Export or create a new request depending on implementation rules.

The chosen behavior must be consistent in API and Worker logic.

---

# 79. Database Transactions

Transactions should be used for operations such as:

```text
Create Album
+
Create related initial configuration
```

or:

```text
Reassign Album
+
Create AuditLog
```

External R2 operations cannot participate in PostgreSQL transactions.

Therefore cross-system workflows must use recoverable states.

Example:

```text
Media row created PENDING
      ↓
R2 upload fails
      ↓
Media remains PENDING
      ↓
Cleanup later
```

---

# 80. Database Constraints

Where practical, the database should enforce invariants that do not depend on application context.

Examples:

```text
UNIQUE User.email
UNIQUE Album.publicIdentifier

UploadWindow.endsAt > UploadWindow.startsAt

ExportItem(exportId, mediaId) unique
```

Role-specific rules such as:

```text
Album.organizerId must reference User.role = ORGANIZER
```

are typically enforced in application logic unless more advanced database constraints are intentionally introduced.

---

# 81. JSON Usage

JSON/JSONB is appropriate for flexible metadata.

Possible uses:

```text
Notification.metadata
AuditLog.metadata
```

JSON must not replace relational modeling for core entities.

Avoid:

```json
{
  "guestIds": ["...", "..."],
  "mediaIds": ["...", "..."],
  "uploadWindows": [...]
}
```

when these represent real relationships.

---

# 82. Sensitive Data

The database must never store:

```text
Raw passwords
Raw refresh tokens
Raw access tokens
Raw Guest session tokens
R2 secret credentials
Permanent signed URLs as credentials
```

Sensitive hashes should be treated as secrets even though they are not raw tokens.

---

# 83. Data Returned to Clients

Database models must not be serialized directly to API responses.

For example, User database rows may contain:

```text
passwordHash
```

but API responses must never expose it.

NestJS should map persistent models to explicit response DTOs.

---

# 84. Prisma Naming

Prisma model names should use singular PascalCase:

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

Fields should use camelCase.

Database table naming strategy may use Prisma defaults or explicit mappings, but must remain consistent across the project.

---

# 85. Migration Strategy

All production database changes must use versioned Prisma migrations.

Do not manually modify production schema without migration history.

Flow:

```text
schema.prisma change
      ↓
Migration generated
      ↓
Reviewed
      ↓
Applied
```

Destructive migrations require special review.

---

# 86. Seed Data

Development may use seed scripts for:

```text
Super Admin
Organizer
Sample Album
Upload Window
Sample Guest
Sample Media metadata
```

Production seeds must never contain development passwords or sample customer data.

---

# 87. Development vs Production

Development and production must use separate databases.

Development:

```text
Disposable / local data
```

Production:

```text
Real customer data
Backups
Controlled migrations
Restricted access
```

Production data should not be copied into development without appropriate privacy controls.

---

# 88. Entity Relationship Summary

```text
User
 ├──< Session
 │
 ├──< Album
 │      │
 │      ├──< UploadWindow
 │      │
 │      ├──< Guest
 │      │      └──< GuestSession
 │      │
 │      ├──< Media
 │      │      ├── Guest?
 │      │      └── UploadedByUser?
 │      │
 │      ├──< Export
 │      │      └──< ExportItem >── Media
 │      │
 │      └──< Notification
 │
 ├──< Notification
 │
 ├──< Export requestedBy
 │
 └──< AuditLog actor
```

---

# 89. Core Models Summary

```text
User
→ authenticated platform identity

Session
→ authenticated login context

Album
→ central Event Album

UploadWindow
→ time period when Guest uploads are allowed

Guest
→ participant identity scoped to an Album

GuestSession
→ Guest browser/session context

Media
→ uploaded photo or video

Export
→ asynchronous ZIP request

ExportItem
→ selected Media membership in an Export

Notification
→ user-facing persistent message

AuditLog
→ durable history of sensitive actions
```

---

# 90. Database Acceptance Criteria

Database design v1.0 is valid when:

- Guest is separate from User
- User Session is separate from Guest Session
- No standalone RefreshToken entity is required
- Raw tokens are never persisted
- One Organizer may own multiple Albums
- Each Album has one Organizer in MVP
- Album has a unique unguessable public identifier
- Album has an explicit event timezone
- Album lifecycle is separate from upload availability
- No competing `uploadsEnabled` source of truth exists
- One Album may have multiple Upload Windows
- Upload Window active state is time-derived
- Guest belongs to one Album
- Guest may have multiple Guest Sessions
- Media belongs to an Album
- Media can identify its upload source
- Media processing status is separate from visibility
- Visibility is separate from deletion
- Original Media is referenced through R2 storage keys
- Selected exports use relational ExportItems
- Export lifecycle is persisted
- Notifications are separate from Audit Logs
- Soft deletion supports recovery where required
- Foreign keys protect relational integrity
- Cascades cannot accidentally destroy major customer resources
- Gallery access patterns are indexed
- Cursor pagination is supported
- Database timestamps are stored consistently
- Core relationships are relational rather than arbitrary JSON
- Prisma migrations control schema evolution
- PostgreSQL remains the authoritative source of product state

---

# 91. Database Summary

Livara's core persistent model is:

```text
User
 ├── Session
 └── Album
      ├── UploadWindow
      ├── Guest
      │    └── GuestSession
      ├── Media
      └── Export
           └── ExportItem
```

with supporting platform entities:

```text
Notification
AuditLog
```

The model deliberately separates:

```text
Authentication
Guest identity
Album lifecycle
Upload availability
Media processing
Media visibility
Deletion
Export processing
User notifications
Administrative history
```

This separation keeps each concept authoritative and prevents contradictory product state.

PostgreSQL stores product truth.

Cloudflare R2 stores Media objects.

Redis/BullMQ coordinates asynchronous work.

The next technical layer must preserve these boundaries when implementing the API and Prisma schema.