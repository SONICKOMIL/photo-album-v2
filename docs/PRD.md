# Product Requirements Document

**Project:** Livara

**Version:** 1.0

---

# Product Overview

Livara is a modern event photo-sharing platform that enables organizers and guests to collect, share, and preserve memories from real-life events.

Instead of relying on messaging apps or social media, Livara provides one centralized album where every guest can contribute photos and videos through a simple QR code.

The platform is designed to work without requiring guests to create an account, making the sharing experience fast, accessible, and frictionless.

---

## Core Value Proposition

One QR Code.

One Shared Album.

Every Memory Together.

---

# Problem Statement

Today, event memories are scattered across dozens of phones.

Guests take hundreds of photos and videos, but after the event:

- many files are never shared;
- media is lost over time;
- organizers spend days asking guests to send photos;
- messaging apps compress image quality;
- there is no single place where all memories are preserved.

Livara solves this problem by creating one shared digital space where everyone contributes to the same event album.

---

# Goals

The product should:

- Preserve every event memory.
- Make uploading effortless.
- Remove the need for guest registration.
- Support thousands of media files.
- Allow organizers to manage albums easily.
- Keep memories available for years.

---

# Functional Requirements

# Album Management

## Description

Albums are the core entity of Livara.

Every event is represented by a single album where guests can upload, browse, and preserve memories.

Each album has one organizer and can contain thousands of photos and videos.

---

## User Story

As an Organizer,

I want to have one dedicated album for my event,

so that every guest can contribute their memories in one place.

---

## Functional Requirements

### Album Creation

The system shall:

- Create a unique album.
- Generate a unique Album ID.
- Generate a QR Code.
- Generate a public sharing link.
- Assign an organizer.
- Apply default settings.
- Create an empty gallery.

---

### Album Information

Each album shall contain:

- Album ID
- Title
- Description
- Cover Image
- Event Date
- Event Location
- Organizer
- Album Status
- Created Date
- Last Updated Date

---

### Album Settings

The organizer shall be able to:

- Change album title.
- Change description.
- Change cover image.
- Enable or disable uploads.
- Configure upload windows.
- Enable or disable downloads.
- Enable or disable guest names.
- Enable or disable comments (future).
- Archive the album.

---

### Album Status

An album can have one of the following statuses:

- Created
- Configured
- Shared
- Active
- Scheduled Uploads
- Archived

---

### Acceptance Criteria

An album is considered successfully created when:

- Album ID exists.
- QR Code is generated.
- Public link works.
- Organizer has access.
- Gallery is ready for uploads.

---

# QR Code Sharing

## Description

Every album is automatically assigned a unique QR Code and public sharing link.

Guests can instantly join the album by scanning the QR Code without creating an account.

The QR Code serves as the primary entry point to the album before, during, and after the event.

---

## User Story

As a Guest,

I want to scan a QR Code and immediately access the event album,

so that I can upload and view memories without any registration.

---

## Functional Requirements

### QR Generation

The system shall:

- Automatically generate a unique QR Code for every album.
- Generate a public sharing URL.
- Ensure every QR Code is unique.
- Regenerate the QR Code if the public link changes.

---

### QR Usage

Guests shall be able to:

- Scan the QR Code using any smartphone camera.
- Open the album directly in a browser.
- Join without creating an account.
- Return to the album later using the same link.

---

### Organizer Actions

The organizer shall be able to:

- Download the QR Code.
- Print the QR Code.
- Share the QR Code as an image.
- Copy the public link.

---

### Validation

The system shall:

- Reject invalid album links.
- Reject deleted album links.
- Display an appropriate error page if the album is unavailable.

---

### Acceptance Criteria

The feature is complete when:

- Every album has a unique QR Code.
- Every QR Code opens the correct album.
- Guests can join without registration.
- The public link works on all modern devices.

---

# Upload Windows

## Description

Upload Windows allow organizers to control when guests can upload photos and videos.

Instead of keeping uploads permanently open or permanently closed, organizers can create multiple scheduled upload periods for different stages of an event.

This feature supports multi-day and recurring celebrations while keeping the gallery organized.

---

## User Story

As an Organizer,

I want to schedule multiple upload periods,

so that guests can continue sharing memories from related events without leaving uploads permanently open.

---

## Functional Requirements

### Upload Window Creation

The organizer shall be able to:

- Create unlimited upload windows.
- Assign a custom name.
- Select a start date and time.
- Select an end date and time.
- Edit an existing upload window.
- Delete an upload window.

---

### Upload Window Status

Each upload window shall have one of the following states:

- Scheduled
- Active
- Closed
- Cancelled

The system shall automatically update the status based on the current date and time.

---

### Upload Permissions

Guests shall:

- Upload media only while an upload window is Active.
- Continue browsing the gallery even if uploads are closed.
- Receive an appropriate message when uploads are unavailable.

---

### Organizer Controls

The organizer shall be able to:

- Open uploads immediately.
- Close uploads immediately.
- Extend an upload window.
- End an upload window early.

---

### Validation Rules

The system shall:

- Prevent overlapping upload windows.
- Require every upload window to have a valid start and end time.
- Prevent an end time earlier than the start time.
- Automatically close expired upload windows.

---

### Notifications

The system may notify guests when:

- A new upload window opens.
- An upload window is about to close.
- Uploads have been closed.

---

### Acceptance Criteria

The feature is complete when:

- Organizers can create and manage upload windows.
- Uploads automatically open and close according to schedule.
- Guests cannot upload outside active windows.
- Guests can always view the gallery unless restricted by album settings.

---

# Media Upload

## Description

Media Upload is the core functionality of Livara.

Guests can upload photos and videos to an event album during active upload windows.

The system should provide a fast, reliable, and intuitive uploading experience across desktop and mobile devices.

---

## User Story

As a Guest,

I want to quickly upload photos and videos,

so that my memories become part of the shared event album.

---

## Functional Requirements

### Supported Media

The system shall support:

- Photos
- Videos

Supported image formats:

- JPG
- JPEG
- PNG
- HEIC (future)
- WEBP (future)

Supported video formats:

- MP4
- MOV

---

### Upload Methods

Guests shall be able to:

- Select files manually.
- Select multiple files.
- Drag and drop files (Desktop).
- Upload directly from mobile devices.

---

### Upload Process

During upload, the system shall:

- Display upload progress.
- Display upload percentage.
- Show upload status.
- Allow upload cancellation.
- Retry failed uploads.

---

### File Validation

Before upload, the system shall validate:

- File type
- File size
- Corrupted files
- Empty files
- Unsupported formats

Invalid files shall not be uploaded.

---

### Upload States

Each upload shall have one of the following states:

- Waiting
- Uploading
- Processing
- Completed
- Failed
- Cancelled

---

### Processing

After upload, the system shall:

- Store the original file.
- Generate thumbnails.
- Extract metadata.
- Optimize previews.
- Prepare files for gallery display.

---

### Duplicate Handling

The system should detect duplicate uploads.

Duplicate detection may use:

- File hash
- File size
- Metadata

Future improvements may include image similarity detection.

---

### Offline Behavior

If the network connection is interrupted:

- Uploads should pause.
- Uploads should resume automatically when possible.
- Failed uploads should remain available for retry.

---

### Organizer Permissions

The organizer shall be able to:

- View uploaded media.
- Delete uploaded media.
- Approve uploaded media (future moderation mode).

---

### Acceptance Criteria

The feature is complete when:

- Photos upload successfully.
- Videos upload successfully.
- Multiple uploads work correctly.
- Progress is displayed.
- Failed uploads can be retried.
- Gallery updates after successful upload.

---

# Gallery

## Description

The Gallery is the central place where all approved event photos and videos are displayed.

It allows guests to relive the event through everyone's perspective while giving organizers full control over the displayed content.

The gallery should remain fast and responsive even when containing thousands of media files.

---

## User Story

As a Guest,

I want to browse all event photos and videos in one place,

so that I can relive the event and discover moments captured by other guests.

---

## Functional Requirements

### Gallery View

The system shall:

- Display photos and videos in chronological order by default.
- Load media progressively for smooth browsing.
- Display thumbnails before loading full-resolution media.
- Support infinite scrolling.
- Display upload date and time for each media item.

---

### Media Viewer

Guests shall be able to:

- Open photos in full screen.
- Play videos directly in the gallery.
- Swipe between media on mobile devices.
- Navigate using previous and next controls on desktop.

---

### Gallery Performance

The system shall:

- Lazy-load media as users scroll.
- Cache thumbnails for faster loading.
- Optimize gallery performance for albums containing thousands of files.

---

### Organizer Controls

The organizer shall be able to:

- Delete media.
- Hide media from the gallery.
- Restore hidden media.
- View upload information.

---

### Empty Gallery

If no media has been uploaded, the system shall display:

- A friendly empty state.
- Instructions for uploading media.
- The album QR Code (optional).

---

### Acceptance Criteria

The feature is complete when:

- Photos display correctly.
- Videos play correctly.
- Infinite scrolling works.
- Full-screen viewer functions properly.
- Gallery remains responsive with large albums.

---

# Organizer Dashboard

## Description

The Organizer Dashboard is the central control panel for managing an event album.

It provides organizers with real-time access to album information, uploaded media, guest activity, upload windows, and album settings.

The dashboard should allow organizers to manage the entire lifecycle of an album from a single interface.

---

## User Story

As an Organizer,

I want one place where I can manage every aspect of my event,

so that I can monitor uploads, configure settings, and keep the album organized.

---

## Functional Requirements

### Dashboard Overview

The dashboard shall display:

- Album title
- Album cover
- Album status
- Event date
- Event location
- QR Code
- Public sharing link

---

### Statistics

The dashboard shall display:

- Total guests
- Total photos
- Total videos
- Total uploads
- Total storage used
- Active upload window
- Last upload time

---

### Media Management

The organizer shall be able to:

- View all uploaded media
- Search media
- Delete media
- Hide media
- Restore hidden media
- View upload details

---

### Upload Window Management

The organizer shall be able to:

- Create upload windows
- Edit upload windows
- Delete upload windows
- Open uploads immediately
- Close uploads immediately

---

### QR Management

The organizer shall be able to:

- View QR Code
- Download QR Code
- Print QR Code
- Copy album link
- Share album link

---

### Album Settings

The organizer shall be able to configure:

- Album title
- Description
- Cover image
- Privacy settings
- Upload permissions
- Download permissions
- Guest name visibility
- Archive album

---

### Download Center

The organizer shall be able to:

- Download individual files
- Download selected files
- Download the entire album
- Export media as a ZIP archive

---

### Acceptance Criteria

The feature is complete when:

- The organizer can manage the album without leaving the dashboard.
- Statistics update automatically.
- Media management functions correctly.
- Album settings are saved successfully.
- Download options work correctly.

---

# Guest Experience

## Description

The Guest Experience is designed to be simple, fast, and frictionless.

Guests should be able to access an album, browse memories, and upload photos or videos without creating an account.

Every interaction should require as few steps as possible.

---

## User Story

As a Guest,

I want to scan a QR Code and immediately start sharing my memories,

so that I don't need to register or install an application.

---

## Functional Requirements

### Album Access

Guests shall be able to:

- Join an album by scanning a QR Code.
- Join using a public link.
- Access the album without creating an account.
- Return to the album later using the same link.

---

### Gallery Browsing

Guests shall be able to:

- Browse photos.
- Browse videos.
- Open media in full screen.
- Swipe between media on mobile devices.
- Watch uploaded videos.

---

### Media Upload

Guests shall be able to:

- Upload one photo.
- Upload multiple photos.
- Upload videos.
- Cancel uploads.
- Retry failed uploads.

Uploads shall only be available during active upload windows.

---

### Guest Identity

Depending on album settings, guests may:

- Upload anonymously.
- Enter their name before uploading.
- Reuse the previously entered name on the same device.

---

### Upload Feedback

The system shall provide:

- Upload progress.
- Upload success confirmation.
- Error messages.
- Validation messages for unsupported files.

---

### Album Availability

Guests shall:

- Continue viewing the gallery after uploads close.
- Receive a message if uploads are unavailable.
- Receive a message if the album has been archived.

---

### Acceptance Criteria

The feature is complete when:

- Guests can access the album without registration.
- Guests can upload media during active upload windows.
- Guests receive clear feedback during uploads.
- Gallery browsing remains available after uploads close.

---

# Permissions & Privacy

## Description

Livara uses a role-based permission system to ensure that each user can only perform actions appropriate to their role.

Privacy settings allow organizers to control how guests interact with an album while maintaining a simple and secure experience.

---

## User Roles

The platform supports three primary roles:

- Super Admin
- Organizer
- Guest

Each role has different permissions within the system.

---

## Super Admin Permissions

The Super Admin shall be able to:

- Create albums
- Delete albums
- Archive albums
- Restore archived albums
- Assign organizers
- View all albums
- Manage platform settings
- Access platform analytics
- Manage storage usage
- Suspend albums if necessary

---

## Organizer Permissions

The Organizer shall be able to:

- Edit album information
- Manage upload windows
- Share the album
- Download media
- Delete uploaded media
- Hide or restore media
- Configure album settings
- Archive the album
- View album statistics

The Organizer shall not be able to:

- Access other organizers' albums
- Change platform-wide settings

---

## Guest Permissions

Guests shall be able to:

- View the gallery (if enabled)
- Upload photos and videos during active upload windows
- Revisit the album using the same link

Guests shall not be able to:

- Delete media
- Edit album settings
- View dashboard statistics
- Download the full album unless permitted

---

## Album Privacy Settings

The Organizer shall be able to configure:

- Public or private album
- Enable or disable uploads
- Enable or disable downloads
- Require guest names
- Allow anonymous uploads
- Show or hide guest names
- Show or hide upload timestamps

---

## Access Control

The system shall:

- Validate permissions before every protected action.
- Prevent unauthorized access to organizer functions.
- Prevent guests from accessing administrative endpoints.
- Return appropriate error responses for unauthorized requests.

---

## Acceptance Criteria

The feature is complete when:

- Each role has the correct permissions.
- Unauthorized actions are blocked.
- Privacy settings are applied immediately.
- Album access behaves according to the selected configuration.

---

# Notifications

## Description

The notification system keeps organizers and guests informed about important events and actions within an album.

Notifications should be timely, relevant, and non-intrusive.

---

## User Story

As a User,

I want to receive important updates about the album,

so that I always know when I can upload media, when uploads are completed, and when changes occur.

---

## Functional Requirements

### Organizer Notifications

The organizer shall receive notifications when:

- A guest uploads new media.
- An upload window opens.
- An upload window is about to close.
- An upload window closes.
- Storage usage reaches warning thresholds.
- A ZIP archive is ready for download.
- An upload fails due to a system error.

---

### Guest Notifications

Guests may receive notifications when:

- A new upload window opens.
- An upload window is about to close.
- Their upload completes successfully.
- Their upload fails.
- Uploads are currently unavailable.
- The album has been archived.

---

### System Notifications

The system shall generate notifications for:

- Successful uploads.
- Failed uploads.
- Invalid file formats.
- File size exceeded.
- Album unavailable.
- Permission denied.
- Network connection lost.
- Upload resumed after reconnection.

---

### Notification Delivery

The platform shall support:

- In-app notifications.
- Browser notifications (optional).
- Email notifications (future).
- Push notifications (future mobile application).

---

### Notification Behavior

The system shall:

- Display notifications in real time where possible.
- Prevent duplicate notifications.
- Automatically dismiss temporary success messages.
- Keep critical notifications visible until acknowledged.

---

### Acceptance Criteria

The feature is complete when:

- Users receive relevant notifications.
- Failed actions generate appropriate error messages.
- Success messages confirm completed actions.
- Duplicate notifications are not displayed.

---

# Storage & File Management

## Description

Livara stores all uploaded media securely while maintaining fast access and efficient storage usage.

The platform preserves original media files and generates optimized versions for gallery viewing.

---

## User Story

As an Organizer,

I want all uploaded media to be stored safely,

so that memories remain available without losing quality.

---

## Functional Requirements

### File Storage

The system shall:

- Store original media files.
- Store optimized preview versions.
- Store thumbnails for gallery browsing.
- Organize files by album.
- Assign a unique identifier to every uploaded file.

---

### File Processing

After a successful upload, the system shall:

- Validate the file.
- Store the original file.
- Generate thumbnails.
- Generate optimized preview images.
- Extract metadata (when available).
- Mark the file as ready for display.

---

### Supported File Types

Images:

- JPG
- JPEG
- PNG
- HEIC (future)
- WEBP (future)

Videos:

- MP4
- MOV

---

### File Limits

The system shall define configurable limits for:

- Maximum image size.
- Maximum video size.
- Maximum upload size per request.
- Maximum storage per album (optional).

These values should be configurable by administrators.

---

### File Organization

Every uploaded file shall belong to:

- Album
- Upload Window
- Guest (if available)

Each file shall contain:

- File ID
- File Name
- File Type
- MIME Type
- File Size
- Upload Time
- Processing Status
- Storage Path

---

### File Deletion

When media is deleted:

- The gallery shall no longer display the file.
- The original file shall be marked for deletion.
- Preview files shall also be removed.
- The action shall be logged.

Future versions may support file recovery.

---

### Export

The Organizer shall be able to:

- Download individual files.
- Download selected files.
- Download the complete album as a ZIP archive.

The system shall generate archives asynchronously for large albums.

---

### Acceptance Criteria

The feature is complete when:

- Original files are stored successfully.
- Preview images are generated.
- Thumbnails are generated.
- Deleted files are removed correctly.
- Album export functions correctly.

---

# Security

## Description

Security is a fundamental aspect of Livara.

The platform must protect user data, uploaded media, and system resources while maintaining a simple and seamless experience for organizers and guests.

---

## User Story

As a User,

I want my data and uploaded media to be secure,

so that I can trust Livara with my event memories.

---

## Functional Requirements

### Authentication

The system shall:

- Authenticate Organizers and Super Admins.
- Allow Guests to access albums without creating an account.
- Protect organizer-only functionality.

---

### Authorization

The system shall:

- Validate user permissions before every protected action.
- Restrict administrative endpoints.
- Prevent unauthorized access to private albums.

---

### Album Access

The system shall support:

- Public album links.
- Private album links (future).
- Secure QR Code access.
- Album availability checks.

---

### File Security

Before storing uploaded media, the system shall:

- Validate file type.
- Validate MIME type.
- Reject unsupported file formats.
- Reject corrupted files.
- Reject empty files.

Future versions may include malware scanning.

---

### Rate Limiting

The system shall:

- Limit excessive upload requests.
- Prevent spam uploads.
- Protect public endpoints from abuse.
- Protect authentication endpoints from brute-force attacks.

---

### Data Protection

The system shall:

- Encrypt sensitive data in transit.
- Use HTTPS for all communication.
- Store passwords using secure hashing algorithms.
- Never expose internal storage paths.

---

### Audit Logging

The system shall record important actions including:

- Album creation
- Album deletion
- Album archive
- Media upload
- Media deletion
- Login attempts
- Permission changes

---

### Error Handling

The system shall:

- Return secure error messages.
- Avoid exposing internal implementation details.
- Log unexpected server errors.

---

### Acceptance Criteria

The feature is complete when:

- Unauthorized actions are blocked.
- Uploaded files are validated.
- Sensitive data is protected.
- Security events are logged.

---

