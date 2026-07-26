# Livara REST API

**Project:** Livara

**API Version:** v1

**Architecture:** REST

**Backend:** NestJS

**Format:** JSON

---

# Overview

The Livara API provides communication between client applications and the Livara backend.

It is responsible for:

- Authentication
- Authorization
- Album management
- Guest access
- Upload windows
- Media management
- Notifications
- Administrative operations

The API is designed to support the web application as well as future mobile applications and integrations.

---

# Base URL

All API endpoints are versioned.

```text
/api/v1
```

Examples:

```text
/api/v1/auth/login
/api/v1/albums
/api/v1/albums/:albumId/media
```

---

# API Principles

The API follows these principles:

- RESTful resource-oriented design
- JSON request and response bodies
- Consistent response structures
- HTTP status codes
- API versioning
- Input validation
- Role-based authorization
- Pagination for large collections
- Idempotency where required

---

# Authentication

Authenticated users include:

- Super Admin
- Organizer

Guests do not require traditional accounts.

Organizer and Super Admin authentication uses:

- JWT Access Token
- Refresh Token
- HTTP-only secure cookies

Guest access uses an anonymous guest session associated with an album.

---

# Authorization

Protected endpoints validate:

1. Authentication
2. User role
3. Resource ownership
4. Required permission

For example, an Organizer may manage their own album but cannot access another Organizer's dashboard.

Super Admin has platform-wide administrative access.

---

# Content Type

Standard API requests use:

```text
Content-Type: application/json
```

Media uploads use an upload-specific flow rather than embedding binary files inside JSON.

---

# Standard Success Response

```json
{
  "success": true,
  "data": {},
  "meta": {}
}
```

The `meta` property may be omitted when no additional metadata is required.

---

# Standard Error Response

```json
{
  "success": false,
  "error": {
    "code": "ALBUM_NOT_FOUND",
    "message": "Album not found."
  }
}
```

Development environments may include additional debugging information.

Production responses must never expose stack traces, database errors, secrets, or internal implementation details.

---

# HTTP Status Codes

| Status | Usage |
|---|---|
| 200 | Request completed successfully |
| 201 | Resource created successfully |
| 204 | Request succeeded with no response body |
| 400 | Invalid request |
| 401 | Authentication required or invalid |
| 403 | User does not have permission |
| 404 | Resource not found |
| 409 | Resource conflict |
| 413 | Upload exceeds allowed size |
| 415 | Unsupported media type |
| 422 | Valid request format but invalid business data |
| 429 | Rate limit exceeded |
| 500 | Unexpected server error |
| 503 | Service temporarily unavailable |

---

# Pagination

Large collections must use pagination.

Examples include:

- Gallery media
- Albums
- Guests
- Notifications
- Admin lists

Cursor-based pagination is preferred for large and frequently changing datasets such as gallery media.

Example request:

```text
GET /api/v1/albums/:albumId/media?limit=50&cursor=...
```

Example response metadata:

```json
{
  "success": true,
  "data": [],
  "meta": {
    "nextCursor": "...",
    "hasMore": true
  }
}
```

---

# Filtering and Sorting

Collection endpoints may support:

```text
?type=IMAGE
?status=READY
?sort=uploadedAt
?order=desc
```

Available filters depend on the resource.

The server must validate all filtering and sorting parameters.

---

# Dates and Time

All API timestamps use UTC and ISO 8601.

Example:

```text
2026-07-26T18:30:00.000Z
```

Clients are responsible for displaying timestamps in the appropriate local timezone.

Upload Window schedules are stored and processed using UTC timestamps.

---

# IDs

Resources use UUID identifiers.

Examples:

```text
albumId
mediaId
guestId
uploadWindowId
```

Public URLs should not expose sequential database identifiers.

---

# Rate Limiting

Rate limits apply to sensitive and public endpoints, including:

- Authentication
- Guest session creation
- Media upload initialization
- Public album access
- Administrative operations

Rate limits may vary by endpoint and user type.

---

# API Modules

The API is divided into the following modules:

- Auth
- Albums
- Guests
- Upload Windows
- Media
- Notifications
- Admin
- Health

Each module defines its own endpoints, permissions, request schemas, responses, and error codes.

---

# Auth API

## Overview

The Auth API handles authentication and session management for authenticated Livara users.

Authenticated users are:

- Super Admin
- Organizer

Guests do not use this authentication flow.

The authentication system uses short-lived JWT access tokens and long-lived refresh tokens.

Refresh tokens are stored in secure HTTP-only cookies and are never exposed to client-side JavaScript.

---

## POST /auth/login

Authenticates an Organizer or Super Admin.

### Request

```http
POST /api/v1/auth/login
Content-Type: application/json
```

```json
{
  "email": "organizer@example.com",
  "password": "password"
}
```

### Validation

The server shall:

- Validate the email format.
- Require a password.
- Verify that the user exists.
- Verify the password hash.
- Verify that the account is active.
- Reject soft-deleted users.

### Success Response

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "organizer@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "ORGANIZER"
    }
  }
}
```

The server also creates:

- Access Token
- Refresh Token
- Session

Authentication cookies are returned using secure HTTP-only cookies.

### Errors

```text
400 INVALID_REQUEST
401 INVALID_CREDENTIALS
403 ACCOUNT_DISABLED
429 TOO_MANY_ATTEMPTS
```

The API must not reveal whether an email address exists.

---

## POST /auth/refresh

Issues a new access token using a valid refresh token.

### Request

```http
POST /api/v1/auth/refresh
```

The refresh token is read from an HTTP-only cookie.

No refresh token is accepted from the request body.

### Success Response

```json
{
  "success": true,
  "data": {
    "refreshed": true
  }
}
```

### Behavior

The server shall:

- Validate the refresh token.
- Verify the associated session.
- Verify that the user is active.
- Reject expired tokens.
- Reject revoked tokens.
- Rotate the refresh token.

The previous refresh token becomes invalid after successful rotation.

### Errors

```text
401 REFRESH_TOKEN_INVALID
401 REFRESH_TOKEN_EXPIRED
401 SESSION_EXPIRED
403 ACCOUNT_DISABLED
```

---

## POST /auth/logout

Terminates the current authenticated session.

### Request

```http
POST /api/v1/auth/logout
```

### Behavior

The server shall:

- Revoke the current refresh token.
- Invalidate the current session.
- Clear authentication cookies.

### Success Response

```http
204 No Content
```

Calling logout multiple times should remain safe and should not create an error if the session has already ended.

---

## POST /auth/logout-all

Terminates all active sessions belonging to the authenticated user.

### Request

```http
POST /api/v1/auth/logout-all
```

Authentication required.

### Behavior

The server shall:

- Revoke all refresh tokens belonging to the user.
- Invalidate all active sessions.
- Keep the current account active.

### Success Response

```json
{
  "success": true,
  "data": {
    "sessionsRevoked": true
  }
}
```

---

## GET /auth/me

Returns information about the currently authenticated user.

### Request

```http
GET /api/v1/auth/me
```

Authentication required.

### Success Response

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "organizer@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "ORGANIZER",
    "avatarUrl": null
  }
}
```

### Errors

```text
401 UNAUTHENTICATED
403 ACCOUNT_DISABLED
```

---

# Authentication Cookies

Authentication cookies shall use:

```text
HttpOnly
Secure
SameSite
```

Cookie configuration may differ between development and production environments.

Refresh tokens must never be stored in:

- localStorage
- sessionStorage
- client-side application state

---

# Password Security

Passwords shall never be stored in plain text.

The backend shall:

- Hash passwords using a modern password hashing algorithm.
- Apply rate limiting to login attempts.
- Never return password hashes through the API.
- Never log passwords.
- Never include passwords in authentication errors.

---

# Session Management

Every successful login creates a server-side Session record.

A session may contain:

- Session ID
- User ID
- IP address
- User agent
- Creation time
- Expiration time

Users may have multiple active sessions across different devices.

Super Admins may revoke user sessions when required.

---

# Auth Authorization Matrix

| Endpoint | Guest | Organizer | Super Admin |
|---|:---:|:---:|:---:|
| POST /auth/login | ✓ | ✓ | ✓ |
| POST /auth/refresh | — | ✓ | ✓ |
| POST /auth/logout | — | ✓ | ✓ |
| POST /auth/logout-all | — | ✓ | ✓ |
| GET /auth/me | — | ✓ | ✓ |

`POST /auth/login` is publicly accessible, but only Organizer and Super Admin accounts can authenticate through it.

---

# Auth Acceptance Criteria

Authentication is complete when:

- Organizer can log in.
- Super Admin can log in.
- Invalid credentials are rejected.
- Access tokens can expire without forcing a new login while the refresh session remains valid.
- Refresh tokens are rotated securely.
- Logout invalidates the current session.
- Logout All invalidates all user sessions.
- Protected endpoints reject unauthenticated requests.
- Disabled or deleted accounts cannot authenticate.
- Passwords and authentication secrets are never exposed to the client.---

# Auth API

## Overview

The Auth API handles authentication and session management for authenticated Livara users.

Authenticated users are:

- Super Admin
- Organizer

Guests do not use this authentication flow.

The authentication system uses short-lived JWT access tokens and long-lived refresh tokens.

Refresh tokens are stored in secure HTTP-only cookies and are never exposed to client-side JavaScript.

---

## POST /auth/login

Authenticates an Organizer or Super Admin.

### Request

```http
POST /api/v1/auth/login
Content-Type: application/json
```

```json
{
  "email": "organizer@example.com",
  "password": "password"
}
```

### Validation

The server shall:

- Validate the email format.
- Require a password.
- Verify that the user exists.
- Verify the password hash.
- Verify that the account is active.
- Reject soft-deleted users.

### Success Response

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "organizer@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "ORGANIZER"
    }
  }
}
```

The server also creates:

- Access Token
- Refresh Token
- Session

Authentication cookies are returned using secure HTTP-only cookies.

### Errors

```text
400 INVALID_REQUEST
401 INVALID_CREDENTIALS
403 ACCOUNT_DISABLED
429 TOO_MANY_ATTEMPTS
```

The API must not reveal whether an email address exists.

---

## POST /auth/refresh

Issues a new access token using a valid refresh token.

### Request

```http
POST /api/v1/auth/refresh
```

The refresh token is read from an HTTP-only cookie.

No refresh token is accepted from the request body.

### Success Response

```json
{
  "success": true,
  "data": {
    "refreshed": true
  }
}
```

### Behavior

The server shall:

- Validate the refresh token.
- Verify the associated session.
- Verify that the user is active.
- Reject expired tokens.
- Reject revoked tokens.
- Rotate the refresh token.

The previous refresh token becomes invalid after successful rotation.

### Errors

```text
401 REFRESH_TOKEN_INVALID
401 REFRESH_TOKEN_EXPIRED
401 SESSION_EXPIRED
403 ACCOUNT_DISABLED
```

---

## POST /auth/logout

Terminates the current authenticated session.

### Request

```http
POST /api/v1/auth/logout
```

### Behavior

The server shall:

- Revoke the current refresh token.
- Invalidate the current session.
- Clear authentication cookies.

### Success Response

```http
204 No Content
```

Calling logout multiple times should remain safe and should not create an error if the session has already ended.

---

## POST /auth/logout-all

Terminates all active sessions belonging to the authenticated user.

### Request

```http
POST /api/v1/auth/logout-all
```

Authentication required.

### Behavior

The server shall:

- Revoke all refresh tokens belonging to the user.
- Invalidate all active sessions.
- Keep the current account active.

### Success Response

```json
{
  "success": true,
  "data": {
    "sessionsRevoked": true
  }
}
```

---

## GET /auth/me

Returns information about the currently authenticated user.

### Request

```http
GET /api/v1/auth/me
```

Authentication required.

### Success Response

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "organizer@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "ORGANIZER",
    "avatarUrl": null
  }
}
```

### Errors

```text
401 UNAUTHENTICATED
403 ACCOUNT_DISABLED
```

---

# Authentication Cookies

Authentication cookies shall use:

```text
HttpOnly
Secure
SameSite
```

Cookie configuration may differ between development and production environments.

Refresh tokens must never be stored in:

- localStorage
- sessionStorage
- client-side application state

---

# Password Security

Passwords shall never be stored in plain text.

The backend shall:

- Hash passwords using a modern password hashing algorithm.
- Apply rate limiting to login attempts.
- Never return password hashes through the API.
- Never log passwords.
- Never include passwords in authentication errors.

---

# Session Management

Every successful login creates a server-side Session record.

A session may contain:

- Session ID
- User ID
- IP address
- User agent
- Creation time
- Expiration time

Users may have multiple active sessions across different devices.

Super Admins may revoke user sessions when required.

---

# Auth Authorization Matrix

| Endpoint | Guest | Organizer | Super Admin |
|---|:---:|:---:|:---:|
| POST /auth/login | ✓ | ✓ | ✓ |
| POST /auth/refresh | — | ✓ | ✓ |
| POST /auth/logout | — | ✓ | ✓ |
| POST /auth/logout-all | — | ✓ | ✓ |
| GET /auth/me | — | ✓ | ✓ |

`POST /auth/login` is publicly accessible, but only Organizer and Super Admin accounts can authenticate through it.

---

# Auth Acceptance Criteria

Authentication is complete when:

- Organizer can log in.
- Super Admin can log in.
- Invalid credentials are rejected.
- Access tokens can expire without forcing a new login while the refresh session remains valid.
- Refresh tokens are rotated securely.
- Logout invalidates the current session.
- Logout All invalidates all user sessions.
- Protected endpoints reject unauthenticated requests.
- Disabled or deleted accounts cannot authenticate.
- Passwords and authentication secrets are never exposed to the client.

---

# Albums API

## Overview

The Albums API manages the lifecycle and configuration of Livara event albums.

Albums are created and assigned by Super Admins.

Organizers can manage permitted album settings and content, but protected event information can only be changed by a Super Admin.

Guests access albums through separate public endpoints.

---

# POST /albums

Creates a new album.

### Permission

Super Admin only.

### Request

```http
POST /api/v1/albums
Content-Type: application/json
```

```json
{
  "organizerId": "uuid",
  "title": "Aziz & Malika",
  "eventDate": "2026-09-12T15:00:00.000Z",
  "location": "Samarkand, Uzbekistan"
}
```

### Behavior

The server shall:

- Validate the Organizer.
- Create a unique Album ID.
- Generate a unique public slug.
- Create default album settings.
- Set the initial album status.
- Record creation timestamps.

QR generation may use the generated public album URL.

### Success Response

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "organizerId": "uuid",
    "title": "Aziz & Malika",
    "eventDate": "2026-09-12T15:00:00.000Z",
    "location": "Samarkand, Uzbekistan",
    "status": "DRAFT",
    "publicSlug": "aziz-malika-x7k29p",
    "createdAt": "2026-07-26T18:30:00.000Z"
  }
}
```

### Errors

```text
400 INVALID_REQUEST
404 ORGANIZER_NOT_FOUND
409 PUBLIC_SLUG_CONFLICT
```

---

# GET /albums

Returns albums accessible to the authenticated user.

### Permission

Organizer or Super Admin.

### Behavior

For Organizer:

- Return only albums assigned to that Organizer.

For Super Admin:

- Return albums across the platform.

### Query Parameters

```text
?status=ACTIVE
?limit=20
?cursor=...
```

### Success Response

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Aziz & Malika",
      "eventDate": "2026-09-12T15:00:00.000Z",
      "status": "ACTIVE",
      "coverMediaId": null
    }
  ],
  "meta": {
    "nextCursor": null,
    "hasMore": false
  }
}
```

---

# GET /albums/:albumId

Returns detailed information about an album.

### Permission

Organizer owning the album or Super Admin.

### Request

```http
GET /api/v1/albums/:albumId
```

### Success Response

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "organizerId": "uuid",
    "title": "Aziz & Malika",
    "description": null,
    "eventDate": "2026-09-12T15:00:00.000Z",
    "location": "Samarkand, Uzbekistan",
    "status": "ACTIVE",
    "publicSlug": "aziz-malika-x7k29p",
    "coverMediaId": null,
    "uploadsEnabled": true,
    "downloadsEnabled": true
  }
}
```

### Errors

```text
403 ALBUM_ACCESS_DENIED
404 ALBUM_NOT_FOUND
```

---

# PATCH /albums/:albumId

Updates album configuration.

### Permission

Organizer owning the album or Super Admin.

The server must apply field-level permissions based on the user's role.

---

## Organizer Editable Fields

Organizer may update:

```json
{
  "description": "Welcome to our wedding album!",
  "coverMediaId": "uuid",
  "downloadsEnabled": true
}
```

Organizer cannot directly modify protected event information such as:

- title
- eventDate
- organizerId
- publicSlug
- album ownership

Upload availability is managed through Upload Windows rather than by changing event information.

---

## Super Admin Editable Fields

Super Admin may additionally update:

```json
{
  "title": "Aziz & Malika",
  "eventDate": "2026-09-13T15:00:00.000Z",
  "location": "Samarkand, Uzbekistan"
}
```

### Success Response

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Aziz & Malika",
    "updatedAt": "2026-07-26T19:00:00.000Z"
  }
}
```

### Errors

```text
400 INVALID_REQUEST
403 FIELD_UPDATE_NOT_ALLOWED
404 ALBUM_NOT_FOUND
409 INVALID_ALBUM_STATE
```

---

# POST /albums/:albumId/archive

Archives an album.

### Permission

Organizer owning the album or Super Admin.

### Behavior

The server shall:

- Change the album status to ARCHIVED.
- Prevent new guest uploads.
- Preserve existing media.
- Preserve gallery access according to privacy settings.
- Close or cancel future upload activity according to business rules.

### Success Response

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "ARCHIVED"
  }
}
```

---

# POST /albums/:albumId/restore

Restores an archived album.

### Permission

Super Admin only.

### Behavior

Restoring the album does not automatically reopen uploads.

Upload Windows must be configured separately.

### Success Response

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "READY"
  }
}
```

---

# DELETE /albums/:albumId

Soft deletes an album.

### Permission

Super Admin only.

### Behavior

The server shall:

- Set deletedAt.
- Remove the album from normal queries.
- Disable public access.
- Prevent uploads.
- Preserve data during the configured recovery period.

Media objects must not be immediately permanently deleted from storage.

### Success Response

```http
204 No Content
```

---

# GET /albums/:albumId/stats

Returns album statistics.

### Permission

Organizer owning the album or Super Admin.

### Success Response

```json
{
  "success": true,
  "data": {
    "photos": 843,
    "videos": 71,
    "totalMedia": 914,
    "guests": 126,
    "storageBytes": 12884901888,
    "lastUploadAt": "2026-09-12T21:42:17.000Z",
    "activeUploadWindow": {
      "id": "uuid",
      "title": "Wedding Day"
    }
  }
}
```

---

# Albums Authorization Matrix

| Endpoint | Guest | Organizer | Super Admin |
|---|:---:|:---:|:---:|
| POST /albums | — | — | ✓ |
| GET /albums | — | Own | ✓ |
| GET /albums/:albumId | — | Own | ✓ |
| PATCH /albums/:albumId | — | Limited | ✓ |
| POST /albums/:albumId/archive | — | Own | ✓ |
| POST /albums/:albumId/restore | — | — | ✓ |
| DELETE /albums/:albumId | — | — | ✓ |
| GET /albums/:albumId/stats | — | Own | ✓ |

---

# Albums Acceptance Criteria

The Albums API is complete when:

- Super Admin can create albums.
- Albums can be assigned to Organizers.
- Organizer can access only assigned albums.
- Super Admin can access all albums.
- Organizer cannot change protected event information.
- Super Admin can change protected event information.
- Albums can be archived without deleting their media.
- Super Admin can restore archived albums.
- Album deletion uses soft delete.
- Deleted albums cannot be accessed publicly.
- Album statistics are available to authorized users.

---

# Guest Access API

## Overview

The Guest Access API provides frictionless access to public Livara albums without requiring account registration.

Guests enter an album through:

- QR Code
- Public album link

A guest receives an anonymous session associated with the specific album.

Guest sessions are separate from Organizer and Super Admin authentication.

---

# GET /public/albums/:slug

Returns public information required to open an album.

### Permission

Public.

Authentication is not required.

### Request

```http
GET /api/v1/public/albums/:slug
```

### Behavior

The server shall:

- Find the album by public slug.
- Verify that the album exists.
- Reject soft-deleted albums.
- Check album availability.
- Return only public album information.
- Never expose Organizer private information.

### Success Response

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Aziz & Malika",
    "description": "Welcome to our wedding album!",
    "eventDate": "2026-09-12T15:00:00.000Z",
    "location": "Samarkand, Uzbekistan",
    "cover": {
      "url": "https://media.example.com/..."
    },
    "status": "ACTIVE",
    "uploadsAvailable": true,
    "downloadsAvailable": false
  }
}
```

### Errors

```text
404 ALBUM_NOT_FOUND
410 ALBUM_UNAVAILABLE
```

---

# POST /public/albums/:slug/guests

Creates or restores an anonymous Guest session for the album.

### Permission

Public.

### Request

```http
POST /api/v1/public/albums/:slug/guests
Content-Type: application/json
```

Optional:

```json
{
  "displayName": "Komiljon"
}
```

The request may contain no body when guest names are optional.

---

## Behavior

The server shall:

- Verify the album.
- Check whether a valid guest session already exists.
- Reuse the existing Guest when possible.
- Otherwise create a new Guest record.
- Associate the Guest with the current Album.
- Generate a secure guest session.
- Return only non-sensitive Guest information.

A Guest session belongs to one album.

Access to Album A must not automatically grant access to Album B.

---

## Success Response

```json
{
  "success": true,
  "data": {
    "guest": {
      "id": "uuid",
      "displayName": "Komiljon"
    },
    "album": {
      "id": "uuid",
      "publicSlug": "aziz-malika-x7k29p"
    }
  }
}
```

The guest session identifier should be stored in a secure cookie where practical.

Raw guest session tokens must not be returned in normal API responses.

---

# GET /public/albums/:slug/guest

Returns the current Guest associated with this album and device session.

### Permission

Guest session required.

### Request

```http
GET /api/v1/public/albums/:slug/guest
```

### Success Response

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "displayName": "Komiljon",
    "createdAt": "2026-09-12T14:32:00.000Z"
  }
}
```

### Errors

```text
401 GUEST_SESSION_REQUIRED
404 GUEST_NOT_FOUND
```

---

# PATCH /public/albums/:slug/guest

Updates allowed Guest information.

### Permission

Guest session required.

### Request

```http
PATCH /api/v1/public/albums/:slug/guest
Content-Type: application/json
```

```json
{
  "displayName": "Komiljon"
}
```

### Behavior

The server shall:

- Verify the Guest session.
- Verify that the Guest belongs to the requested album.
- Validate the display name.
- Update only fields available to Guests.

### Success Response

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "displayName": "Komiljon"
  }
}
```

---

# GET /public/albums/:slug/access

Returns the current public capabilities of an album.

This endpoint allows the frontend to determine which actions are currently available.

### Permission

Public.

### Success Response

```json
{
  "success": true,
  "data": {
    "canView": true,
    "canUpload": true,
    "canDownload": false,
    "guestNameRequired": false,
    "activeUploadWindow": {
      "id": "uuid",
      "title": "Wedding Day",
      "startsAt": "2026-09-12T10:00:00.000Z",
      "endsAt": "2026-09-13T01:00:00.000Z"
    },
    "nextUploadWindow": null
  }
}
```

When uploads are closed but another Upload Window exists:

```json
{
  "success": true,
  "data": {
    "canView": true,
    "canUpload": false,
    "canDownload": false,
    "guestNameRequired": false,
    "activeUploadWindow": null,
    "nextUploadWindow": {
      "id": "uuid",
      "title": "Chilla",
      "startsAt": "2026-09-19T16:00:00.000Z",
      "endsAt": "2026-09-19T22:00:00.000Z"
    }
  }
}
```

This allows the interface to display messages such as:

```text
Uploads are currently closed.

Next upload period:
Chilla — September 19
```

without making the album itself unavailable.

---

# Guest Session Security

Guest sessions shall:

- Use cryptographically secure identifiers.
- Be scoped to a specific album.
- Expire according to configured policy.
- Never grant Organizer permissions.
- Never grant Super Admin permissions.
- Be revocable by the system.

The server must never trust a Guest ID supplied by the client without validating the associated session.

---

# Guest Privacy

Livara should minimize personal data collected from Guests.

Guest accounts do not require:

- Email
- Password
- Phone number

Optional information may include:

- Display name

IP addresses and user-agent information may be processed for security and abuse prevention according to the platform privacy policy.

---

# Guest Access Authorization Matrix

| Endpoint | Anonymous | Guest Session | Organizer | Super Admin |
|---|:---:|:---:|:---:|:---:|
| GET /public/albums/:slug | ✓ | ✓ | ✓ | ✓ |
| POST /public/albums/:slug/guests | ✓ | ✓ | ✓ | ✓ |
| GET /public/albums/:slug/guest | — | ✓ | — | — |
| PATCH /public/albums/:slug/guest | — | ✓ | — | — |
| GET /public/albums/:slug/access | ✓ | ✓ | ✓ | ✓ |

---

# Guest Access Acceptance Criteria

The Guest Access API is complete when:

- A QR Code can open the correct public album.
- No account registration is required.
- A new visitor can receive an anonymous Guest session.
- A returning visitor can reuse their existing Guest session.
- Guest sessions are isolated between albums.
- Guests cannot access Organizer or Super Admin functionality.
- Public responses do not expose private user information.
- An album remains viewable when uploads are closed, if viewing is permitted.
- The API exposes the active or next Upload Window.

---

# Upload Windows API

## Overview

Upload Windows define when Guests are allowed to upload media to an Album.

An Album may contain multiple Upload Windows for the main event and related events that happen later.

Examples:

- Wedding Day
- Chilla
- Family Gathering
- Custom Event

Outside an active Upload Window, the Gallery may remain available while new uploads are disabled.

---

# POST /albums/:albumId/upload-windows

Creates a new Upload Window.

### Permission

Organizer owning the Album or Super Admin.

### Request

```http
POST /api/v1/albums/:albumId/upload-windows
Content-Type: application/json
```

```json
{
  "title": "Chilla",
  "startsAt": "2026-09-19T11:00:00.000Z",
  "endsAt": "2026-09-19T17:00:00.000Z"
}
```

### Validation

The server shall:

- Verify Album access.
- Require a title.
- Require start and end timestamps.
- Ensure `endsAt` is later than `startsAt`.
- Prevent overlapping Upload Windows within the same Album.
- Reject creation for deleted Albums.
- Reject creation for archived Albums unless restored first.

### Success Response

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "albumId": "uuid",
    "title": "Chilla",
    "startsAt": "2026-09-19T11:00:00.000Z",
    "endsAt": "2026-09-19T17:00:00.000Z",
    "status": "SCHEDULED"
  }
}
```

### Errors

```text
400 INVALID_REQUEST
403 ALBUM_ACCESS_DENIED
404 ALBUM_NOT_FOUND
409 UPLOAD_WINDOW_OVERLAP
409 ALBUM_ARCHIVED
422 INVALID_TIME_RANGE
```

---

# GET /albums/:albumId/upload-windows

Returns Upload Windows belonging to an Album.

### Permission

Organizer owning the Album or Super Admin.

### Request

```http
GET /api/v1/albums/:albumId/upload-windows
```

### Success Response

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Wedding Day",
      "startsAt": "2026-09-12T05:00:00.000Z",
      "endsAt": "2026-09-12T20:00:00.000Z",
      "status": "CLOSED"
    },
    {
      "id": "uuid",
      "title": "Chilla",
      "startsAt": "2026-09-19T11:00:00.000Z",
      "endsAt": "2026-09-19T17:00:00.000Z",
      "status": "SCHEDULED"
    }
  ]
}
```

---

# GET /albums/:albumId/upload-windows/:windowId

Returns a specific Upload Window.

### Permission

Organizer owning the Album or Super Admin.

### Success Response

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "albumId": "uuid",
    "title": "Chilla",
    "startsAt": "2026-09-19T11:00:00.000Z",
    "endsAt": "2026-09-19T17:00:00.000Z",
    "status": "SCHEDULED"
  }
}
```

### Errors

```text
403 ALBUM_ACCESS_DENIED
404 UPLOAD_WINDOW_NOT_FOUND
```

---

# PATCH /albums/:albumId/upload-windows/:windowId

Updates an Upload Window.

### Permission

Organizer owning the Album or Super Admin.

### Request

```http
PATCH /api/v1/albums/:albumId/upload-windows/:windowId
Content-Type: application/json
```

```json
{
  "title": "Chilla Evening",
  "startsAt": "2026-09-19T12:00:00.000Z",
  "endsAt": "2026-09-19T18:00:00.000Z"
}
```

### Validation

The server shall:

- Verify Album ownership or administrative access.
- Verify the Upload Window belongs to the Album.
- Validate the time range.
- Prevent overlaps with other Upload Windows.
- Reject modification of cancelled windows.

### Errors

```text
403 ALBUM_ACCESS_DENIED
404 UPLOAD_WINDOW_NOT_FOUND
409 UPLOAD_WINDOW_OVERLAP
409 UPLOAD_WINDOW_CANCELLED
422 INVALID_TIME_RANGE
```

---

# POST /albums/:albumId/upload-windows/:windowId/open

Immediately opens an Upload Window.

### Permission

Organizer owning the Album or Super Admin.

### Behavior

The server shall:

- Verify the Album is not archived.
- Verify the window is not cancelled.
- Ensure another Upload Window is not currently active.
- Set the effective opening time to now.
- Change status to `ACTIVE`.

### Success Response

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "ACTIVE",
    "startsAt": "2026-09-19T10:42:15.000Z",
    "endsAt": "2026-09-19T17:00:00.000Z"
  }
}
```

---

# POST /albums/:albumId/upload-windows/:windowId/close

Immediately closes an active Upload Window.

### Permission

Organizer owning the Album or Super Admin.

### Behavior

The server shall:

- Set the effective closing time to now.
- Change status to `CLOSED`.
- Prevent new uploads immediately.
- Allow uploads already accepted by the server to finish according to upload policy.

### Success Response

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "CLOSED",
    "endsAt": "2026-09-19T16:24:11.000Z"
  }
}
```

---

# DELETE /albums/:albumId/upload-windows/:windowId

Cancels an Upload Window.

### Permission

Organizer owning the Album or Super Admin.

### Behavior

For a future window:

- Change status to `CANCELLED`.

For an active window:

- Close uploads.
- Change status to `CANCELLED`.

Historical Upload Windows should not be physically deleted because Media may reference them.

### Success Response

```http
204 No Content
```

---

# Upload Window State Rules

The standard lifecycle is:

```text
SCHEDULED
    ↓
  ACTIVE
    ↓
  CLOSED
```

A window may also become:

```text
SCHEDULED → CANCELLED
ACTIVE    → CANCELLED
```

Status should be derived from timestamps where possible rather than relying only on scheduled background jobs.

This ensures uploads do not remain incorrectly open if a scheduler or worker is temporarily unavailable.

---

# Upload Authorization

Before accepting a Guest upload, the server must verify:

1. Album exists.
2. Album is available.
3. Album is not archived or deleted.
4. Guest session belongs to the Album.
5. An Upload Window is currently active.
6. The Upload Window belongs to the Album.
7. Upload limits have not been exceeded.

The frontend state must never be treated as proof that uploads are allowed.

---

# Concurrency

The API must prevent two Upload Windows for the same Album from becoming active simultaneously.

Opening or modifying a window should perform overlap validation atomically where practical.

---

# Upload Windows Authorization Matrix

| Endpoint | Guest | Organizer | Super Admin |
|---|:---:|:---:|:---:|
| POST /albums/:albumId/upload-windows | — | Own | ✓ |
| GET /albums/:albumId/upload-windows | — | Own | ✓ |
| GET /albums/:albumId/upload-windows/:windowId | — | Own | ✓ |
| PATCH /albums/:albumId/upload-windows/:windowId | — | Own | ✓ |
| POST .../:windowId/open | — | Own | ✓ |
| POST .../:windowId/close | — | Own | ✓ |
| DELETE .../:windowId | — | Own | ✓ |

Guests receive current availability through the public Album Access API rather than these management endpoints.

---

# Upload Windows Acceptance Criteria

The module is complete when:

- Multiple Upload Windows can belong to one Album.
- Organizer can create future Upload Windows.
- Organizer can edit scheduled windows.
- Organizer can manually open uploads.
- Organizer can manually close uploads.
- Overlapping windows are rejected.
- Archived Albums cannot accept uploads.
- Window state remains correct even if background workers are temporarily unavailable.
- Guests can upload only during an active window.
- Closing one window does not prevent a future scheduled window from opening.
- Historical Media remains associated with the Upload Window in which it was uploaded.

---

# Media Upload API

## Overview

The Media Upload API manages the lifecycle of photos and videos uploaded by Guests and Organizers.

Media files are uploaded directly from the client to Cloudflare R2 using temporary upload authorization issued by the Livara API.

The backend controls:

- Album access
- Guest access
- Upload Window availability
- File validation
- Upload limits
- Media metadata
- Processing state
- Storage authorization

Binary media should not pass through the main NestJS API during normal uploads.

---

# Upload Lifecycle

A standard upload follows this flow:

```text
Select Media
    ↓
Initialize Upload
    ↓
API Validation
    ↓
Create Media Record
    ↓
Temporary R2 Upload Authorization
    ↓
Direct Upload to R2
    ↓
Complete Upload
    ↓
Server Verification
    ↓
PROCESSING
    ↓
BullMQ
    ↓
Thumbnail / Preview / Metadata
    ↓
READY
    ↓
Gallery
```

---

# POST /public/albums/:slug/media/uploads

Initializes one or more Guest uploads.

### Permission

Valid Guest session required.

### Request

```http
POST /api/v1/public/albums/:slug/media/uploads
Content-Type: application/json
```

```json
{
  "files": [
    {
      "clientId": "local-file-1",
      "fileName": "IMG_4821.JPG",
      "mimeType": "image/jpeg",
      "fileSize": 4281942
    },
    {
      "clientId": "local-file-2",
      "fileName": "IMG_4822.JPG",
      "mimeType": "image/jpeg",
      "fileSize": 5182031
    }
  ]
}
```

`clientId` is generated by the client and allows the frontend to match each server response to the selected local file.

---

## Validation

For every requested file, the server shall verify:

- Album exists.
- Album is available.
- Guest session belongs to the Album.
- An Upload Window is active.
- File size is within configured limits.
- MIME type is allowed.
- Upload rate limits are not exceeded.
- Album storage limits are not exceeded.

Client-provided file metadata must not be treated as trusted proof of the actual uploaded file type.

---

## Success Response

```json
{
  "success": true,
  "data": {
    "uploads": [
      {
        "clientId": "local-file-1",
        "mediaId": "uuid",
        "status": "UPLOADING",
        "upload": {
          "method": "PUT",
          "url": "temporary-signed-upload-url",
          "headers": {
            "Content-Type": "image/jpeg"
          },
          "expiresAt": "2026-09-12T16:10:00.000Z"
        }
      },
      {
        "clientId": "local-file-2",
        "mediaId": "uuid",
        "status": "UPLOADING",
        "upload": {
          "method": "PUT",
          "url": "temporary-signed-upload-url",
          "headers": {
            "Content-Type": "image/jpeg"
          },
          "expiresAt": "2026-09-12T16:10:00.000Z"
        }
      }
    ]
  }
}
```

The signed URL must:

- Expire after a short period.
- Allow upload only to the assigned object key.
- Not provide general access to the storage bucket.

---

# Direct Storage Upload

After initialization, the client uploads each file directly to object storage.

```text
Guest Device
      │
      │ PUT media binary
      ▼
Cloudflare R2
```

The NestJS API does not proxy the media binary.

The client tracks progress independently for every file.

---

# POST /public/albums/:slug/media/:mediaId/complete

Confirms that the client finished uploading a media object.

### Permission

Guest session that initialized the upload.

### Request

```http
POST /api/v1/public/albums/:slug/media/:mediaId/complete
```

### Behavior

The server shall:

- Verify Guest session.
- Verify Media ownership.
- Verify the Media belongs to the Album.
- Verify the object exists in R2.
- Verify expected file size where possible.
- Validate stored object metadata.
- Prevent completing the same upload incorrectly multiple times.
- Change Media status to `PROCESSING`.
- Queue the appropriate processing job.

### Success Response

```json
{
  "success": true,
  "data": {
    "mediaId": "uuid",
    "status": "PROCESSING"
  }
}
```

The endpoint should be idempotent.

Repeated valid completion requests must not create duplicate processing jobs.

---

# GET /public/albums/:slug/media/:mediaId/status

Returns the current processing state of a Guest upload.

### Permission

Valid Guest session.

### Success Response

```json
{
  "success": true,
  "data": {
    "mediaId": "uuid",
    "status": "READY"
  }
}
```

Possible statuses:

```text
UPLOADING
PROCESSING
READY
FAILED
DELETED
```

---

# POST /public/albums/:slug/media/:mediaId/retry

Retries processing after a recoverable processing failure.

### Permission

Guest session that uploaded the Media.

### Behavior

The server shall:

- Verify the original object exists.
- Verify the failure is retryable.
- Prevent duplicate active processing jobs.
- Change status to `PROCESSING`.
- Queue processing again.

### Success Response

```json
{
  "success": true,
  "data": {
    "mediaId": "uuid",
    "status": "PROCESSING"
  }
}
```

---

# DELETE /public/albums/:slug/media/:mediaId/upload

Cancels an unfinished upload.

### Permission

Guest session that initialized the upload.

### Behavior

The server shall:

- Cancel the pending upload where possible.
- Mark the temporary Media record for cleanup.
- Remove incomplete storage objects.
- Prevent processing.

### Success Response

```http
204 No Content
```

This endpoint does not allow Guests to delete successfully published gallery media.

---

# Upload Expiration

Initialized uploads must expire if they are never completed.

Example lifecycle:

```text
UPLOADING
    ↓
Expiration reached
    ↓
Cleanup Worker
    ↓
Temporary object removed
    ↓
Media record cleaned up
```

The exact expiration period is configurable.

---

# File Validation

Validation occurs at multiple stages.

## Initialization

Validate:

- Declared MIME type
- Declared file size
- Filename
- Upload limits

## Completion

Validate:

- Object exists
- Expected object size
- Storage metadata

## Processing

Validate actual file contents before making Media available in the Gallery.

A file must never become `READY` solely because the client declared a valid MIME type.

---

# Multiple Uploads

Guests may initialize multiple files in a single request.

Each file has its own:

- Media ID
- Upload URL
- Progress
- Status
- Retry lifecycle

Failure of one file must not automatically fail the entire batch.

Example:

```text
Photo 1   READY
Photo 2   READY
Photo 3   FAILED
Photo 4   UPLOADING
Photo 5   PROCESSING
```

---

# Upload Concurrency

The client should limit simultaneous uploads.

For example:

```text
Selected: 37 files

Uploading simultaneously: 4
Waiting: 33
```

The exact concurrency limit is a client configuration and may vary based on device and network conditions.

---

# Large File Uploads

The initial MVP may use signed single-request uploads for files below configured limits.

Future versions may support multipart uploads for:

- Large videos
- Unstable networks
- Resumable uploads

The API design should allow multipart upload support without changing the Media entity model.

---

# Organizer Uploads

Authenticated Organizers may upload media to their own Albums using the same upload lifecycle.

Organizer-specific endpoints may use:

```text
POST /albums/:albumId/media/uploads
POST /albums/:albumId/media/:mediaId/complete
```

The underlying upload service and processing pipeline should be shared with Guest uploads.

---

# Upload Security

The system shall:

- Use short-lived signed upload authorization.
- Generate storage object keys server-side.
- Never expose R2 credentials to clients.
- Validate Album and Guest permissions before initialization.
- Apply rate limits.
- Apply file size limits.
- Validate actual file contents during processing.
- Prevent clients from selecting arbitrary storage paths.

---

# Media Upload Acceptance Criteria

The module is complete when:

- Guests can initialize uploads during an active Upload Window.
- Uploads are rejected outside active Upload Windows.
- Multiple files can be initialized together.
- Files upload directly to object storage.
- NestJS does not proxy normal media binaries.
- Every file has an independent status.
- Successful uploads enter background processing.
- Failed processing can be retried when appropriate.
- Incomplete uploads are cleaned automatically.
- Duplicate completion requests do not create duplicate jobs.
- Media becomes visible in the Gallery only after reaching `READY`.

---

# Gallery & Media API

## Overview

The Gallery & Media API provides access to processed photos and videos stored within an Album.

Only Media with status `READY` and visible to Guests may appear in the public Gallery.

The API supports:

- Gallery browsing
- Cursor pagination
- Filtering
- Sorting
- Individual Media access
- Organizer moderation
- Media deletion
- Media restoration

---

# GET /public/albums/:slug/media

Returns visible Media for the public Gallery.

### Permission

Public Album access.

### Request

```http
GET /api/v1/public/albums/:slug/media
```

### Query Parameters

```text
?limit=50
?cursor=...
?type=IMAGE
?sort=uploadedAt
?order=desc
```

Supported filters may include:

- IMAGE
- VIDEO

Only Media with status `READY` and public visibility may be returned.

---

## Success Response

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "type": "IMAGE",
      "thumbnailUrl": "https://media.example.com/...",
      "previewUrl": "https://media.example.com/...",
      "width": 3024,
      "height": 4032,
      "uploadedAt": "2026-09-12T18:42:11.000Z",
      "guest": {
        "displayName": "Komiljon"
      }
    }
  ],
  "meta": {
    "nextCursor": "...",
    "hasMore": true
  }
}
```

Guest information shall only be returned when Album privacy settings allow it.

---

# Gallery Pagination

The Gallery uses cursor-based pagination.

The server shall:

- Return a configurable number of Media records.
- Provide `nextCursor`.
- Indicate whether additional results exist.
- Maintain stable ordering between requests.

Example:

```text
GET /media?limit=50

↓

50 Media

↓

nextCursor

↓

GET /media?limit=50&cursor=...
```

Cursor implementation details must remain opaque to clients.

---

# Gallery Sorting

Default sorting:

```text
uploadedAt DESC
```

Future sorting options may include:

- Oldest first
- Capture time
- Most viewed
- Favorites

The API must use deterministic ordering.

If multiple Media records share the same timestamp, a secondary unique field such as Media ID shall be used.

---

# GET /public/albums/:slug/media/:mediaId

Returns a single visible Media item.

### Permission

Public Album access.

### Success Response

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "type": "IMAGE",
    "previewUrl": "https://media.example.com/...",
    "width": 3024,
    "height": 4032,
    "uploadedAt": "2026-09-12T18:42:11.000Z"
  }
}
```

### Errors

```text
404 MEDIA_NOT_FOUND
404 ALBUM_NOT_FOUND
410 MEDIA_UNAVAILABLE
```

Hidden, deleted, failed, or processing Media must not be exposed through public endpoints.

---

# GET /albums/:albumId/media

Returns Media for Organizer management.

### Permission

Organizer owning the Album or Super Admin.

Unlike the public Gallery, this endpoint may include:

- READY
- PROCESSING
- FAILED
- Hidden Media

Soft-deleted Media is excluded by default.

### Query Parameters

```text
?limit=50
?cursor=...
?type=IMAGE
?status=READY
?visibility=HIDDEN
```

---

# GET /albums/:albumId/media/:mediaId

Returns detailed Media information.

### Permission

Organizer owning the Album or Super Admin.

### Success Response

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "albumId": "uuid",
    "guestId": "uuid",
    "uploadWindowId": "uuid",
    "type": "IMAGE",
    "status": "READY",
    "visibility": "VISIBLE",
    "fileName": "IMG_4821.JPG",
    "mimeType": "image/jpeg",
    "fileSize": 4281942,
    "width": 3024,
    "height": 4032,
    "uploadedAt": "2026-09-12T18:42:11.000Z"
  }
}
```

Internal storage credentials must never be returned.

---

# POST /albums/:albumId/media/:mediaId/hide

Hides Media from the public Gallery without deleting it.

### Permission

Organizer owning the Album or Super Admin.

### Behavior

The server shall:

- Verify Album access.
- Verify Media belongs to the Album.
- Set visibility to `HIDDEN`.
- Remove the Media from public Gallery queries.
- Preserve stored files.

### Success Response

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "visibility": "HIDDEN"
  }
}
```

---

# POST /albums/:albumId/media/:mediaId/restore

Restores hidden Media to the public Gallery.

### Permission

Organizer owning the Album or Super Admin.

### Behavior

Only valid `READY` Media may become publicly visible.

### Success Response

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "visibility": "VISIBLE"
  }
}
```

---

# DELETE /albums/:albumId/media/:mediaId

Soft deletes Media.

### Permission

Organizer owning the Album or Super Admin.

### Behavior

The server shall:

- Verify Media ownership.
- Set `deletedAt`.
- Remove Media from Gallery queries.
- Prevent normal access.
- Schedule storage cleanup according to retention policy.
- Record the action in audit logs.

### Success Response

```http
204 No Content
```

The binary object should not necessarily be permanently destroyed immediately.

---

# POST /albums/:albumId/media/:mediaId/recover

Recovers soft-deleted Media during the configured recovery period.

### Permission

Super Admin.

### Behavior

The server shall:

- Verify the recovery period has not expired.
- Verify required storage objects still exist.
- Clear `deletedAt`.
- Restore the previous visibility state where possible.

### Success Response

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "READY"
  }
}
```

---

# Media Delivery

Gallery responses shall use optimized assets rather than original files whenever possible.

Example:

```text
Gallery Grid
    ↓
Thumbnail

Media Viewer
    ↓
Optimized Preview

Explicit Download
    ↓
Original
```

This reduces:

- Bandwidth usage
- Loading time
- Mobile data consumption

Original files should not be loaded simply to display Gallery thumbnails.

---

# Media URLs

Media URLs may be:

- CDN URLs
- Signed URLs
- Application-controlled delivery URLs

The database stores object identifiers or storage paths rather than temporary signed URLs.

Temporary URLs are generated when needed.

---

# Gallery Visibility

Public Gallery Media must satisfy all applicable conditions:

```text
Album accessible
AND
Media status = READY
AND
Media visibility = VISIBLE
AND
Media not soft-deleted
```

Upload Window status does not determine whether previously uploaded Media can be viewed.

Closing uploads must not remove existing Media from the Gallery.

---

# Media Moderation

For MVP, moderation is performed manually by the Organizer.

Organizer can:

- View Media
- Hide Media
- Restore hidden Media
- Delete Media

Future versions may support:

- Approval before publishing
- Automated moderation
- AI content detection
- Bulk moderation

---

# Gallery Performance

The API shall:

- Use cursor pagination.
- Avoid returning unnecessary metadata.
- Use database indexes for Album and Media queries.
- Serve thumbnails for Gallery grids.
- Support caching where appropriate.

The Gallery should remain usable with thousands of Media records in a single Album.

---

# Gallery & Media Authorization Matrix

| Endpoint | Public | Guest | Organizer | Super Admin |
|---|:---:|:---:|:---:|:---:|
| GET /public/albums/:slug/media | ✓ | ✓ | ✓ | ✓ |
| GET /public/albums/:slug/media/:mediaId | ✓ | ✓ | ✓ | ✓ |
| GET /albums/:albumId/media | — | — | Own | ✓ |
| GET /albums/:albumId/media/:mediaId | — | — | Own | ✓ |
| POST .../:mediaId/hide | — | — | Own | ✓ |
| POST .../:mediaId/restore | — | — | Own | ✓ |
| DELETE .../:mediaId | — | — | Own | ✓ |
| POST .../:mediaId/recover | — | — | — | ✓ |

---

# Gallery & Media Acceptance Criteria

The module is complete when:

- Guests can browse READY Media.
- Gallery supports cursor pagination.
- Photos and videos can be filtered.
- Hidden Media disappears from the public Gallery.
- Hidden Media can be restored.
- Deleted Media disappears from normal queries.
- Super Admin can recover Media during the recovery period.
- Gallery uses optimized assets instead of originals.
- Closing an Upload Window does not affect existing Gallery Media.
- Public endpoints never expose internal storage information.

---

# Downloads & ZIP API

## Overview

The Downloads & ZIP API allows authorized users to download original Media files individually, in selected groups, or as a complete Album archive.

Large archives are generated asynchronously using BullMQ.

Generated ZIP archives are temporary and automatically removed after expiration.

---

# GET /albums/:albumId/media/:mediaId/download

Generates temporary access to the original Media file.

### Permission

Organizer owning the Album or Super Admin.

Guest downloads depend on Album download settings and use separate public endpoints.

### Behavior

The server shall:

- Verify Album access.
- Verify Media belongs to the Album.
- Verify Media is available.
- Generate temporary download authorization.
- Never expose permanent storage credentials.

### Success Response

```json
{
  "success": true,
  "data": {
    "url": "temporary-signed-download-url",
    "fileName": "IMG_4821.JPG",
    "expiresAt": "2026-09-12T20:15:00.000Z"
  }
}
```

---

# GET /public/albums/:slug/media/:mediaId/download

Downloads a Media file through the public Album.

### Permission

Public Album access.

### Validation

The server shall verify:

- Album exists.
- Album is publicly accessible.
- Downloads are enabled.
- Media belongs to the Album.
- Media status is `READY`.
- Media is publicly visible.
- Media is not deleted.

### Errors

```text
403 DOWNLOADS_DISABLED
404 MEDIA_NOT_FOUND
410 MEDIA_UNAVAILABLE
```

---

# POST /albums/:albumId/exports

Creates an asynchronous export job.

The export may contain selected Media or the entire Album.

### Permission

Organizer owning the Album or Super Admin.

### Request — Selected Media

```json
{
  "type": "SELECTED",
  "mediaIds": [
    "uuid-1",
    "uuid-2",
    "uuid-3"
  ]
}
```

### Request — Entire Album

```json
{
  "type": "FULL_ALBUM"
}
```

### Behavior

The server shall:

- Verify Album access.
- Validate requested Media.
- Create an Export record.
- Set export status to `QUEUED`.
- Create a BullMQ job.
- Return immediately without waiting for ZIP generation.

### Success Response

```json
{
  "success": true,
  "data": {
    "exportId": "uuid",
    "status": "QUEUED"
  }
}
```

---

# GET /albums/:albumId/exports/:exportId

Returns the current state of an export.

### Permission

Organizer owning the Album or Super Admin.

### Success Response — Processing

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "PROCESSING",
    "progress": 63
  }
}
```

### Success Response — Ready

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "READY",
    "fileSize": 4831838208,
    "expiresAt": "2026-09-13T20:00:00.000Z"
  }
}
```

---

# GET /albums/:albumId/exports/:exportId/download

Generates temporary download access for a completed export.

### Permission

Organizer owning the Album or Super Admin.

### Behavior

The server shall:

- Verify export ownership.
- Verify status is `READY`.
- Verify the archive has not expired.
- Generate a short-lived signed download URL.

### Success Response

```json
{
  "success": true,
  "data": {
    "url": "temporary-signed-download-url",
    "fileName": "aziz-malika.zip",
    "expiresAt": "2026-09-12T21:15:00.000Z"
  }
}
```

### Errors

```text
404 EXPORT_NOT_FOUND
409 EXPORT_NOT_READY
410 EXPORT_EXPIRED
```

---

# DELETE /albums/:albumId/exports/:exportId

Deletes a generated export before automatic expiration.

### Permission

Organizer owning the Album or Super Admin.

### Behavior

The server shall:

- Remove the generated archive from object storage.
- Mark the Export as expired or deleted.
- Preserve audit information where required.

### Success Response

```http
204 No Content
```

---

# Export States

An Export may have the following states:

```text
QUEUED
  ↓
PROCESSING
  ↓
READY
```

Failure:

```text
QUEUED / PROCESSING
        ↓
      FAILED
```

Expiration:

```text
READY
  ↓
EXPIRED
```

---

# ZIP Generation

ZIP archives are generated by Background Workers.

```text
Create Export
     ↓
BullMQ
     ↓
ZIP Worker
     ↓
Read originals from R2
     ↓
Build archive
     ↓
Store temporary ZIP in R2
     ↓
Export = READY
     ↓
Notify Organizer
```

The API process must not generate large ZIP archives synchronously.

---

# Archive Contents

By default, exports contain original Media files.

The system should preserve original filenames where possible while preventing filename collisions inside the archive.

Example:

```text
Livara - Aziz & Malika/

photos/
  IMG_4821.JPG
  IMG_4822.JPG

videos/
  VID_1051.MOV
```

Exact archive organization may evolve without changing the public API contract.

---

# Export Expiration

Generated archives are temporary.

After `expiresAt`:

- Download access is rejected.
- Cleanup Worker removes the ZIP from object storage.
- Export status becomes `EXPIRED`.

The Organizer may create a new export later.

---

# Export Concurrency

The system should prevent unnecessary duplicate full-album exports.

If an equivalent export is already being generated, the API may reuse the existing active job rather than create another expensive job.

---

# Downloads Security

The system shall:

- Never expose Cloudflare R2 credentials.
- Use short-lived download authorization.
- Validate ownership before generating private download access.
- Apply rate limits where appropriate.
- Prevent access to deleted Media.
- Prevent access to expired exports.

---

# Downloads & ZIP Acceptance Criteria

The module is complete when:

- Organizer can download an original Media file.
- Public Media downloads respect Album settings.
- Organizer can request selected Media as an archive.
- Organizer can request the entire Album as an archive.
- Large ZIP generation occurs asynchronously.
- Export progress can be checked.
- Completed archives can be downloaded securely.
- Expired archives become unavailable.
- Temporary archives are automatically cleaned up.
- Unauthorized users cannot access private exports.

---

# Notifications API

## Overview

The Notifications API provides authenticated users with important updates about their Albums and platform activity.

For the MVP, notifications are primarily intended for Organizers and Super Admins.

Examples:

- New Media uploaded
- Upload Window opened
- Upload Window closed
- ZIP export ready
- Storage warning
- System notification

Guest-facing messages such as upload success or validation errors do not necessarily require persistent Notification records.

---

# GET /notifications

Returns notifications belonging to the authenticated User.

### Permission

Organizer or Super Admin.

### Request

```http
GET /api/v1/notifications
```

### Query Parameters

```text
?limit=20
?cursor=...
?read=false
?type=ZIP_READY
```

Supported filters may include:

- Read status
- Notification type
- Album
- Creation date

### Success Response

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "type": "MEDIA_UPLOADED",
      "title": "New memories added",
      "message": "12 new photos were uploaded to Aziz & Malika.",
      "albumId": "uuid",
      "isRead": false,
      "createdAt": "2026-09-12T18:42:11.000Z"
    }
  ],
  "meta": {
    "nextCursor": "...",
    "hasMore": true
  }
}
```

The server must return only notifications belonging to the authenticated User.

---

# GET /notifications/unread-count

Returns the number of unread notifications.

### Permission

Organizer or Super Admin.

### Request

```http
GET /api/v1/notifications/unread-count
```

### Success Response

```json
{
  "success": true,
  "data": {
    "count": 7
  }
}
```

This endpoint may be used to display a notification badge in the interface.

---

# PATCH /notifications/:notificationId/read

Marks a notification as read.

### Permission

Notification owner.

### Request

```http
PATCH /api/v1/notifications/:notificationId/read
```

### Success Response

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "isRead": true
  }
}
```

### Errors

```text
403 NOTIFICATION_ACCESS_DENIED
404 NOTIFICATION_NOT_FOUND
```

The endpoint should be idempotent.

Marking an already-read notification as read must not produce an error.

---

# POST /notifications/read-all

Marks all notifications belonging to the authenticated User as read.

### Permission

Organizer or Super Admin.

### Request

```http
POST /api/v1/notifications/read-all
```

### Success Response

```json
{
  "success": true,
  "data": {
    "updated": 7
  }
}
```

---

# DELETE /notifications/:notificationId

Removes a notification from the User's notification feed.

### Permission

Notification owner.

### Behavior

The server shall:

- Verify notification ownership.
- Remove or soft-delete the notification according to retention policy.
- Never allow one User to delete another User's notification.

### Success Response

```http
204 No Content
```

---

# Notification Events

Notifications may be created by domain events.

Examples:

```text
MEDIA_READY
      ↓
Notification Worker
      ↓
Organizer Notification
```

```text
UPLOAD WINDOW OPENS
        ↓
Scheduler
        ↓
Notification Worker
        ↓
Organizer Notification
```

```text
EXPORT READY
      ↓
ZIP Worker
      ↓
Notification Worker
      ↓
Organizer Notification
```

---

# Media Upload Notifications

The system should avoid generating one persistent notification for every individual photo.

Example:

```text
Guest uploads 47 photos

BAD:
47 separate notifications

BETTER:
"47 new memories were added to your album."
```

Media notifications may therefore be grouped or aggregated.

---

# Upload Window Notifications

The Organizer may receive notifications when:

- Upload Window becomes active.
- Upload Window is approaching its closing time.
- Upload Window closes.
- Scheduled window fails to process an associated background action.

The actual permission to upload is still determined by timestamps and Album state, not by the notification system.

---

# Export Notifications

When an Export reaches `READY`, the Organizer receives a notification.

Example:

```json
{
  "type": "ZIP_READY",
  "title": "Your album is ready",
  "message": "The Aziz & Malika archive is ready to download."
}
```

The notification should reference the Export rather than contain a permanent download URL.

A temporary download URL is generated only when requested through the Downloads API.

---

# Real-Time Delivery

For MVP, the frontend may retrieve notifications through normal API requests.

Future versions may support:

- Server-Sent Events
- WebSockets
- Browser Push
- Mobile Push
- Email

The Notification model should remain independent from the delivery channel.

---

# Notification Retention

Notifications do not need to be stored permanently.

The platform may automatically remove old notifications after a configurable retention period.

Important system and security events should remain in Audit Logs rather than relying on Notifications for permanent history.

---

# Notification Security

The system shall:

- Validate User ownership.
- Never expose another User's notifications.
- Never include authentication secrets.
- Never store temporary signed download URLs inside notifications.
- Sanitize dynamic notification content where required.

---

# Notifications Authorization Matrix

| Endpoint | Guest | Organizer | Super Admin |
|---|:---:|:---:|:---:|
| GET /notifications | — | ✓ | ✓ |
| GET /notifications/unread-count | — | ✓ | ✓ |
| PATCH /notifications/:id/read | — | Own | Own |
| POST /notifications/read-all | — | ✓ | ✓ |
| DELETE /notifications/:id | — | Own | Own |

---

# Notifications Acceptance Criteria

The module is complete when:

- Authenticated Users can retrieve their notifications.
- Cursor pagination works.
- Notifications can be filtered by read status.
- Unread count is available.
- Individual notifications can be marked as read.
- All notifications can be marked as read.
- Users cannot access another User's notifications.
- Media upload notifications can be aggregated.
- ZIP completion can generate a notification.
- Upload Window events can generate notifications.
- Notifications do not contain permanent storage credentials or signed download URLs.

---

# Admin API

## Overview

The Admin API provides platform-wide management functionality for Livara Super Admins.

It is used to manage:

- Organizers
- Albums
- Platform statistics
- Storage usage
- Deleted resources
- User sessions
- Administrative actions

All Admin API endpoints require the `SUPER_ADMIN` role.

---

# GET /admin/dashboard

Returns platform-wide statistics for the Admin Dashboard.

### Permission

Super Admin only.

### Request

```http
GET /api/v1/admin/dashboard
```

### Success Response

```json
{
  "success": true,
  "data": {
    "users": {
      "organizers": 42,
      "activeOrganizers": 38
    },
    "albums": {
      "total": 156,
      "active": 27,
      "archived": 112
    },
    "media": {
      "photos": 184320,
      "videos": 12840,
      "total": 197160
    },
    "storage": {
      "usedBytes": 879609302220
    }
  }
}
```

---

# GET /admin/users

Returns platform users.

### Permission

Super Admin only.

### Query Parameters

```text
?limit=20
?cursor=...
?role=ORGANIZER
?active=true
?search=aziz
```

### Success Response

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "email": "organizer@example.com",
      "firstName": "Aziz",
      "lastName": "Karimov",
      "role": "ORGANIZER",
      "isActive": true,
      "createdAt": "2026-08-01T10:00:00.000Z"
    }
  ],
  "meta": {
    "nextCursor": null,
    "hasMore": false
  }
}
```

---

# POST /admin/users

Creates an Organizer account.

### Permission

Super Admin only.

### Request

```json
{
  "email": "organizer@example.com",
  "firstName": "Aziz",
  "lastName": "Karimov",
  "password": "temporary-password"
}
```

### Behavior

The server shall:

- Validate the email.
- Ensure the email is unique.
- Hash the password.
- Create the User with role `ORGANIZER`.
- Never return the password or password hash.

### Success Response

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "organizer@example.com",
    "role": "ORGANIZER",
    "isActive": true
  }
}
```

### Errors

```text
400 INVALID_REQUEST
409 EMAIL_ALREADY_EXISTS
```

---

# GET /admin/users/:userId

Returns detailed information about an authenticated platform User.

### Permission

Super Admin only.

### Success Response

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "organizer@example.com",
    "firstName": "Aziz",
    "lastName": "Karimov",
    "role": "ORGANIZER",
    "isActive": true,
    "lastLoginAt": "2026-09-10T14:20:00.000Z",
    "createdAt": "2026-08-01T10:00:00.000Z"
  }
}
```

---

# PATCH /admin/users/:userId

Updates an Organizer account.

### Permission

Super Admin only.

### Request

```json
{
  "firstName": "Aziz",
  "lastName": "Karimov",
  "email": "new@example.com"
}
```

The server must restrict changes to protected fields such as administrative roles according to platform policy.

---

# POST /admin/users/:userId/suspend

Suspends a User account.

### Permission

Super Admin only.

### Behavior

The server shall:

- Set the account as inactive.
- Prevent new authentication.
- Revoke active sessions.
- Preserve Albums and Media.

### Success Response

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "isActive": false
  }
}
```

---

# POST /admin/users/:userId/activate

Reactivates a suspended User account.

### Permission

Super Admin only.

### Success Response

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "isActive": true
  }
}
```

---

# POST /admin/users/:userId/revoke-sessions

Revokes all active sessions belonging to a User.

### Permission

Super Admin only.

### Success Response

```json
{
  "success": true,
  "data": {
    "sessionsRevoked": true
  }
}
```

---

# GET /admin/albums

Returns Albums across the entire platform.

### Permission

Super Admin only.

### Query Parameters

```text
?limit=20
?cursor=...
?status=ACTIVE
?organizerId=uuid
?search=aziz
```

### Success Response

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Aziz & Malika",
      "organizerId": "uuid",
      "eventDate": "2026-09-12T15:00:00.000Z",
      "status": "ACTIVE",
      "mediaCount": 914
    }
  ],
  "meta": {
    "nextCursor": null,
    "hasMore": false
  }
}
```

Album creation, modification, archival, restoration, and deletion continue to use the existing Albums API.

The Admin API does not duplicate those resource operations unnecessarily.

---

# POST /admin/albums/:albumId/reassign

Assigns an Album to another Organizer.

### Permission

Super Admin only.

### Request

```json
{
  "organizerId": "uuid"
}
```

### Behavior

The server shall:

- Verify the Album.
- Verify the target Organizer.
- Verify the target account is active.
- Update Album ownership.
- Record the administrative action.

### Success Response

```json
{
  "success": true,
  "data": {
    "albumId": "uuid",
    "organizerId": "uuid"
  }
}
```

---

# GET /admin/storage

Returns platform storage statistics.

### Permission

Super Admin only.

### Success Response

```json
{
  "success": true,
  "data": {
    "totalBytes": 879609302220,
    "originalsBytes": 751619276800,
    "optimizedBytes": 85899345920,
    "thumbnailsBytes": 10737418240,
    "archivesBytes": 32212254720
  }
}
```

Values may be calculated asynchronously or retrieved from cached platform metrics.

---

# GET /admin/deleted/albums

Returns soft-deleted Albums that are still within the recovery period.

### Permission

Super Admin only.

---

# POST /admin/deleted/albums/:albumId/recover

Recovers a soft-deleted Album.

### Permission

Super Admin only.

### Behavior

The server shall:

- Verify the recovery period.
- Verify required data still exists.
- Clear `deletedAt`.
- Restore the Album to a safe non-uploading state.

Restoration must not automatically open Guest uploads.

---

# GET /admin/deleted/media

Returns recoverable soft-deleted Media.

### Permission

Super Admin only.

Existing Media recovery operations may then be used to restore individual items.

---

# Administrative Audit

Every sensitive administrative action shall be recorded.

Examples:

- User created
- User suspended
- User reactivated
- Sessions revoked
- Album created
- Album reassigned
- Protected Album information changed
- Album recovered
- Media recovered

An audit event should record, where applicable:

- Actor
- Action
- Target resource
- Timestamp
- Relevant metadata

Audit history must be separate from normal User notifications.

---

# Admin Security

Admin endpoints shall:

- Require authentication.
- Require `SUPER_ADMIN`.
- Apply strict authorization checks.
- Apply rate limiting where appropriate.
- Record sensitive operations.
- Never trust role information supplied by the client.
- Never expose passwords, hashes, secrets, or storage credentials.

High-impact operations may require additional confirmation in future versions.

---

# Admin Authorization Matrix

| Capability | Organizer | Super Admin |
|---|:---:|:---:|
| Platform dashboard | — | ✓ |
| View all Users | — | ✓ |
| Create Organizer | — | ✓ |
| Suspend Organizer | — | ✓ |
| Revoke User sessions | — | ✓ |
| View all Albums | — | ✓ |
| Reassign Album | — | ✓ |
| Change protected Album data | — | ✓ |
| View platform storage | — | ✓ |
| Recover deleted Albums | — | ✓ |
| Recover deleted Media | — | ✓ |
| View administrative audit history | — | ✓ |

---

# Admin Acceptance Criteria

The module is complete when:

- Super Admin can manage Organizer accounts.
- Organizer accounts can be suspended and reactivated.
- Suspended Users cannot authenticate.
- Active sessions can be revoked.
- Super Admin can view all Albums.
- Albums can be reassigned between Organizers.
- Super Admin can change protected Album information through authorized Album operations.
- Platform statistics are available.
- Storage usage can be inspected.
- Recoverable Albums and Media can be managed.
- Sensitive administrative actions are recorded.
- Organizer cannot access Admin endpoints.

---

# Health API

## Overview

The Health API provides service health information for deployment, monitoring, and infrastructure checks.

Health endpoints are not part of the normal user-facing product API.

---

# GET /health

Returns the basic availability of the Livara API.

### Permission

Public.

### Request

```http
GET /api/v1/health
```

### Success Response

```json
{
  "status": "ok",
  "timestamp": "2026-07-26T18:30:00.000Z"
}
```

This endpoint should remain lightweight and should not perform expensive dependency checks.

---

# GET /health/ready

Determines whether the application is ready to receive traffic.

### Permission

Infrastructure only where possible.

### Checks

The server may verify:

- PostgreSQL connectivity
- Redis connectivity
- Queue availability
- Required application configuration

### Success Response

```json
{
  "status": "ready",
  "checks": {
    "database": "ok",
    "redis": "ok",
    "queue": "ok"
  }
}
```

If a critical dependency is unavailable, the endpoint should return:

```http
503 Service Unavailable
```

---

# GET /health/live

Determines whether the application process is running.

### Permission

Infrastructure only where possible.

### Success Response

```json
{
  "status": "alive"
}
```

The liveness check should not depend on PostgreSQL, Redis, R2, or other external services.

Its purpose is to determine whether the application process itself is responsive.

---

# Health Endpoint Security

Health endpoints shall:

- Never expose credentials.
- Never expose environment variables.
- Never expose database connection strings.
- Never expose internal stack traces.
- Return only information required for infrastructure monitoring.

Detailed internal diagnostics should not be publicly accessible.

---

# Health Acceptance Criteria

The module is complete when:

- API availability can be checked.
- Liveness can be checked independently from external dependencies.
- Readiness reflects critical dependency availability.
- Dependency failures can return `503 Service Unavailable`.
- Health responses never expose sensitive infrastructure information.