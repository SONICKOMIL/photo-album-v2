# Architecture

**Project:** Livara

**Version:** 1.0

---

# System Overview

Livara is a cloud-based event photo-sharing platform built around a modern client-server architecture.

The system enables organizers and guests to share, store, and manage event memories through a secure and scalable platform.

The architecture is designed to support:

- thousands of albums;
- millions of media files;
- high upload concurrency;
- scalable storage;
- future mobile applications;
- future AI-powered features.

The system follows a modular architecture where each component has a single responsibility.

---

# Architectural Principles

Livara is designed around the following principles.

## Scalability

The system should scale horizontally as the number of users and media grows.

---

## Simplicity

Each service should have one clear responsibility.

---

## Security

Every request must be authenticated or validated according to its role.

---

## Performance

Media browsing should remain fast even for very large albums.

---

## Reliability

File uploads should survive temporary network failures whenever possible.

---

## Extensibility

The architecture should allow future modules such as:

- AI Face Recognition
- AI Duplicate Detection
- Mobile Applications
- Public API
- Third-party integrations

without major architectural changes.

---

# High-Level Architecture

Livara consists of the following major components.

## Client

- Web Application
- Mobile Browser
- Future Mobile Apps

---

## API Layer

Handles all incoming requests.

Responsible for:

- Authentication
- Authorization
- Validation
- Business Logic

---

## Database

Stores:

- Users
- Albums
- Upload Windows
- Guests
- Media Metadata
- Notifications

---

## Object Storage

Stores:

- Original Images
- Original Videos
- Thumbnails
- Optimized Images

---

## Background Workers

Responsible for:

- Thumbnail generation
- Image optimization
- ZIP creation
- Scheduled Upload Windows
- Notification delivery

---

## CDN (Future)

Serves optimized media globally.

---

# Technology Stack

## Frontend

Framework:

- Next.js

Language:

- TypeScript

UI:

- React
- Tailwind CSS

State Management:

- Zustand

Data Fetching:

- TanStack Query

Forms:

- React Hook Form

---

## Backend

Framework:

- NestJS

Language:

- TypeScript

API:

- REST API

Validation:

- class-validator
- class-transformer

Authentication:

- JWT
- HTTP-only Cookies

---

## Database

Database:

- PostgreSQL

ORM:

- Prisma

---

## Object Storage

Storage Provider:

- Cloudflare R2

Stored Assets:

- Original Images
- Original Videos
- Thumbnails
- Optimized Images
- ZIP Archives

---

## Cache

Redis

Used for:

- Sessions
- Upload progress
- Rate limiting
- Temporary data

---

## Background Jobs

Queue:

- BullMQ

Responsible for:

- Thumbnail generation
- Image optimization
- Video processing
- ZIP archive generation
- Upload window scheduling
- Notification delivery

---

## Infrastructure

Containerization:

- Docker

Reverse Proxy:

- Nginx

Deployment:

- Docker Compose (MVP)

Future:

- Kubernetes

---

# Frontend Architecture

The frontend is built using Next.js and follows a modular architecture.

## Layers

Presentation Layer

Responsible for:

- UI Components
- Layouts
- Pages

---

Application Layer

Responsible for:

- Business logic
- State management
- API communication

---

Shared Layer

Contains:

- UI components
- Hooks
- Utilities
- Constants
- Types

---

## Routing

The application uses the Next.js App Router.

Major routes include:

- Home
- Album
- Organizer Dashboard
- Authentication
- Admin Panel

---

## State Management

Global state is managed using Zustand.

Server state is managed using TanStack Query.

---

# Backend Architecture

The backend follows a modular architecture using NestJS.

Each module owns its business logic, controllers, services, and database access.

## Core Modules

Authentication

Handles:

- Login
- JWT
- Sessions

---

Albums

Handles:

- Album creation
- Album management
- Album settings

---

Guests

Handles:

- Guest sessions
- Guest names
- Album access

---

Media

Handles:

- Uploads
- Processing
- Gallery

---

Upload Windows

Handles:

- Scheduling
- Automatic opening
- Automatic closing

---

Notifications

Handles:

- In-app notifications
- Email (future)
- Push notifications (future)

---

Storage

Handles:

- File upload
- File deletion
- File retrieval

---

Admin

Handles:

- Platform management
- Statistics
- Moderation

---

# Database Architecture

Livara uses PostgreSQL as its primary relational database.

The database is designed using a normalized relational model to ensure consistency, scalability, and maintainability.

---

## Design Principles

The database follows these principles:

- Relational data model
- UUID as primary keys
- Foreign key constraints
- Proper indexing
- Soft delete where appropriate
- Audit timestamps
- Data integrity

---

## Primary Entities

The system consists of the following core entities.

### User

Represents:

- Super Admin
- Organizer

---

### Album

Represents an event.

Each album contains:

- Upload Windows
- Guests
- Media
- QR Code
- Settings

---

### Upload Window

Represents a scheduled period during which guests may upload media.

Each Upload Window belongs to one Album.

---

### Guest

Represents a visitor interacting with an Album.

A guest may upload multiple media files.

Guest accounts are anonymous unless a name is provided.

---

### Media

Represents an uploaded image or video.

Each media file belongs to:

- Album
- Upload Window
- Guest (optional)

---

### Notification

Represents notifications delivered to organizers.

---

### Session

Stores authentication sessions.

---

### Refresh Token

Stores active refresh tokens for authenticated users.

---

## Relationships

User

↓

Albums

↓

Upload Windows

↓

Media

↓

Storage Objects

Guests are connected directly to Albums and Media.

---

## IDs

Every entity uses UUID.

Example:

UserID

AlbumID

GuestID

MediaID

NotificationID

---

## Audit Fields

Most tables include:

- createdAt
- updatedAt

Optional:

- deletedAt

---

## Soft Delete Strategy

Soft delete shall be used for:

- Albums
- Media
- Users

Hard delete shall be reserved for:

- Temporary uploads
- Failed uploads
- Cache
- Expired sessions

---

## Indexing Strategy

Indexes shall exist for:

Album ID

Organizer ID

Guest ID

Upload Window ID

Media Upload Time

Album Status

Created Date

Frequently searched fields

---

## Transactions

Database transactions shall be used whenever multiple related operations must succeed together.

Examples:

Album creation

Media upload

Album deletion

Archive restoration

---

# Storage Architecture

Livara separates metadata from binary files.

Metadata is stored in PostgreSQL.

Media files are stored in Cloudflare R2.

---

## Storage Buckets

The storage contains:

albums/

originals/

optimized/

thumbnails/

archives/

---

## File Naming

Every uploaded file receives a unique filename.

Example:

album-id/media-id.ext

This prevents collisions.

---

## File Lifecycle

Upload

↓

Validation

↓

Original Storage

↓

Thumbnail Generation

↓

Optimization

↓

Gallery Available

---

## Image Variants

The system stores:

Original

Thumbnail

Optimized Preview

Future:

WebP

AVIF

---

## Video Variants

The system stores:

Original Video

Future:

Compressed Video

Preview Frame

Streaming Formats

---

## ZIP Archives

Generated ZIP archives are temporary.

After expiration they are automatically removed.

---

# Authentication & Authorization

Livara uses JWT authentication with Refresh Tokens.

Authentication is required only for:

- Organizers
- Super Admins

Guests do not create accounts.

---

## Authentication Flow

Login

↓

Access Token

↓

Refresh Token

↓

Protected API

---

## Roles

Super Admin

Organizer

Guest

---

## Authorization

Each protected endpoint validates:

Authentication

Role

Album Ownership

Permissions

---

## Guest Access

Guests receive temporary anonymous sessions.

Optional:

Guest Name

Guest Avatar (future)

Guest Token

---

## Session Management

Sessions are stored securely.

Expired tokens are revoked.

Refresh Tokens may be invalidated individually.

Logout removes active sessions.

---

# File Processing Pipeline

Every uploaded media file passes through a defined processing pipeline before becoming available in the gallery.

The pipeline ensures security, consistency, and performance.

---

## Upload Flow

Guest selects media

↓

Upload request sent

↓

API validation

↓

Upload Window validation

↓

File validation

↓

Store original file

↓

Create Media record

↓

Queue background jobs

↓

Generate thumbnails

↓

Generate optimized preview

↓

Extract metadata

↓

Update Media status

↓

Gallery refresh

↓

Notify Organizer

---

## Step 1 — Upload Request

The API receives:

- Album ID
- Guest Session
- Upload Window
- Files

The request is validated before processing.

---

## Step 2 — Validation

The system validates:

- Album exists
- Upload Window is active
- Guest has access
- File type
- MIME type
- File size
- Upload limits

Invalid uploads are rejected immediately.

---

## Step 3 — Store Original File

The original file is uploaded to Cloudflare R2.

At this stage:

- Original quality is preserved.
- File path is generated.
- Unique filename is assigned.

---

## Step 4 — Database Record

A Media record is created with status:

Processing

The record includes:

- Album ID
- Guest ID (optional)
- Upload Window ID
- Storage Path
- File Size
- MIME Type

---

## Step 5 — Background Queue

A BullMQ job is created.

The upload request returns immediately.

Heavy processing occurs asynchronously.

---

## Step 6 — Image Processing

For images:

- Thumbnail generation
- Optimized preview generation
- Metadata extraction
- Orientation correction (EXIF)

Future:

- WebP
- AVIF

---

## Step 7 — Video Processing

For videos:

Current MVP:

- Save original
- Generate preview image

Future:

- Compression
- Streaming formats
- Adaptive bitrate

---

## Step 8 — Status Update

After processing completes:

Media Status:

Ready

Gallery immediately displays the media.

---

## Step 9 — Notification

Organizer receives:

- New upload notification
- Updated statistics
- Gallery refresh

---

## Failure Handling

If processing fails:

- Status becomes Failed.
- Error is logged.
- Retry is possible.
- Original upload remains until cleanup.

---

# Background Jobs

Livara performs long-running operations asynchronously using BullMQ and Redis.

---

## Queue Workers

The system includes dedicated workers for:

- Image Processing
- Video Processing
- ZIP Generation
- Upload Window Scheduler
- Notification Delivery
- Cleanup Tasks

---

## Image Worker

Responsible for:

- Generate thumbnails
- Optimize images
- Extract metadata
- Correct EXIF orientation

---

## Video Worker

Responsible for:

- Generate preview image

Future:

- Video compression
- Streaming formats

---

## ZIP Worker

Responsible for:

- Create album archive
- Compress media
- Store temporary archive
- Notify organizer

---

## Scheduler Worker

Responsible for:

- Open Upload Windows
- Close Upload Windows
- Trigger notifications

Runs automatically based on configured schedules.

---

## Notification Worker

Responsible for:

- In-app notifications
- Email notifications (future)
- Push notifications (future)

---

## Cleanup Worker

Responsible for:

- Remove expired ZIP archives
- Delete temporary uploads
- Remove failed uploads
- Clean cache

---

# Scalability

Livara is designed to scale horizontally.

---

## Stateless API

The backend is stateless.

Any API instance can handle any request.

---

## Horizontal Scaling

Additional API servers can be added without code changes.

---

## Object Storage

Cloudflare R2 scales independently from the application.

Media storage does not depend on backend servers.

---

## Background Workers

Workers can be scaled independently.

Example:

1 API Server

10 Image Workers

2 ZIP Workers

---

## Database Scaling

Future improvements:

- Read replicas
- Partitioning
- Connection pooling

---

## CDN

Future versions may serve optimized media through a global CDN.

---

## Caching

Redis reduces database load for:

- Sessions
- Frequently accessed data
- Upload progress
- Temporary state

---

# Monitoring & Logging

Livara continuously monitors system health, application performance, and operational events to ensure reliability and simplify troubleshooting.

---

## Logging

The application records structured logs for:

- API requests
- Authentication events
- Upload operations
- Background jobs
- Errors
- Security events

Logs should include:

- Timestamp
- Request ID
- User ID (if authenticated)
- Album ID (when applicable)
- Severity Level
- Message

---

## Log Levels

The system uses the following log levels:

- Debug
- Information
- Warning
- Error
- Critical

---

## Monitoring

The platform monitors:

- API availability
- Database connectivity
- Redis availability
- Cloudflare R2 connectivity
- Queue health
- Worker health

---

## Metrics

The system collects metrics including:

- Request count
- Response time
- Upload success rate
- Upload failure rate
- Queue length
- Active users
- Active albums
- Storage usage

---

## Alerting

Administrators should be notified when:

- API becomes unavailable
- Database connection fails
- Storage is unavailable
- Queue processing stops
- Error rate exceeds threshold

---

## Health Checks

Each service exposes a health endpoint.

Example:

/health

The endpoint reports:

- API status
- Database status
- Redis status
- Storage status
- Queue status

---

# Deployment

Livara is deployed using Docker-based infrastructure.

The application is separated into independent services.

---

## Services

Production deployment consists of:

- Frontend (Next.js)
- Backend (NestJS)
- PostgreSQL
- Redis
- Nginx
- Background Workers

---

## Environments

The project supports:

Development

Staging

Production

Each environment has its own:

- Environment variables
- Database
- Storage bucket
- Secrets

---

## Reverse Proxy

Nginx is responsible for:

- HTTPS termination
- Reverse proxy
- Static asset delivery
- Load balancing (future)

---

## Environment Variables

Sensitive values are stored outside the source code.

Examples:

- Database URL
- JWT Secret
- Redis URL
- Cloudflare R2 credentials
- SMTP credentials
- API Keys

---

## CI/CD

Future deployments should be automated.

Typical pipeline:

Code Push

↓

Tests

↓

Build

↓

Docker Image

↓

Deploy

↓

Health Check

---

# Future Architecture

The current architecture is designed to support future expansion without significant redesign.

---

## Planned Enhancements

Future versions may include:

- Native mobile applications
- AI face recognition
- AI duplicate detection
- Public API
- Webhooks
- Multi-language support
- Multi-tenant organizations
- Team collaboration
- Cloud backups
- Live event slideshow

---

## Infrastructure Evolution

As traffic grows, the platform may adopt:

- Kubernetes
- CDN optimization
- Database read replicas
- Microservices
- Distributed caching
- Event-driven architecture

---

# Architecture Decision Records (ADR)

## ADR-001 — Backend Framework

Decision:

NestJS is used as the backend framework.

Reason:

- Modular architecture
- Excellent TypeScript support
- Strong ecosystem
- Dependency Injection
- Long-term maintainability

---

## ADR-002 — Database

Decision:

PostgreSQL is the primary database.

Reason:

- Strong relational model
- ACID compliance
- Excellent indexing
- Mature ecosystem

---

## ADR-003 — ORM

Decision:

Prisma is used as the ORM.

Reason:

- Type safety
- Excellent developer experience
- Reliable migrations

---

## ADR-004 — Object Storage

Decision:

Cloudflare R2 stores media files.

Reason:

- S3-compatible API
- No egress fees
- Scalable object storage

---

## ADR-005 — Background Jobs

Decision:

BullMQ with Redis processes asynchronous tasks.

Reason:

- Reliable job queues
- Retry support
- Delayed jobs
- Scheduling capabilities

---

## ADR-006 — Authentication

Decision:

JWT Access Tokens with Refresh Tokens.

Reason:

- Stateless authentication
- Secure session management
- Scalable architecture

---

## ADR-007 — API Style

Decision:

REST API for MVP.

Future:

GraphQL may be introduced if needed.

---

## ADR-008 — Containerization

Decision:

Docker is used for all services.

Reason:

- Consistent environments
- Simple deployment
- Easy scaling

---

