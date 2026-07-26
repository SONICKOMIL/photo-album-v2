# Livara Product Requirements Document

**Project:** Livara

**Document Type:** Product Requirements Document

**Product Stage:** MVP

**Document Version:** 1.0

> 🇷🇺
> Этот документ определяет продуктовые требования Livara MVP.
>
> Он описывает, какие возможности должна предоставлять платформа, какие роли существуют, какие ограничения действуют и каким критериям должен соответствовать готовый MVP.
>
> Техническая реализация этих требований определяется отдельно в Architecture, Database и API документации.

---

# 1. Product Summary

Livara is an event memory platform that allows people to collectively capture, share, and preserve photos and videos from meaningful events.

Guests enter an Event Album through a QR code or shared link, browse memories contributed by others, and upload their own during allowed periods.

Organizers manage the resulting collection through a dedicated dashboard.

Livara complements professional photography by preserving spontaneous moments and perspectives from everyone who experienced the event.

> 🇷🇺
> Livara — платформа для совместного сбора, просмотра и сохранения фотографий и видео с важных событий.
>
> Гости попадают в Event Album через QR-код или ссылку, смотрят воспоминания других участников и добавляют свои в разрешённые периоды.
>
> Organizer управляет собранными материалами через отдельный Dashboard.
>
> Livara дополняет профессиональную фотографию живыми моментами и взглядами людей, которые были частью события.

---

# 2. Product Goal

The goal of the MVP is to provide a complete event-memory experience from Album creation to long-term access.

The MVP must allow Livara to:

- Create and configure an Event Album
- Give the Organizer secure management access
- Give Guests simple QR-based access
- Collect photos and videos
- Present shared Media through a Gallery
- Control when new Media may be uploaded
- Allow Organizer moderation
- Allow Media downloading and Album exports
- Preserve the Album after the event

The product must be usable for real weddings and events.

> 🇷🇺
> Цель MVP — обеспечить полный жизненный цикл цифровых воспоминаний мероприятия: от создания Album до его использования после события.
>
> Продукт должен быть пригоден для реальных свадеб и мероприятий, а не только для демонстрации концепции.

---

# 3. Core Product Experience

The central product experience is:

```text
Livara Creates Event
        ↓
Organizer Receives Access
        ↓
QR Code Is Prepared
        ↓
Guests Scan QR
        ↓
Guests View Gallery
        ↓
Guests Upload Memories
        ↓
Shared Album Grows
        ↓
Organizer Moderates
        ↓
Uploads Close
        ↓
Gallery Remains Available
        ↓
Optional Later Upload Window
        ↓
Long-Term Event Memory
```

The product should make this flow feel simple even when the underlying system is complex.

---

# 4. Product Roles

The MVP has three primary roles:

```text
SUPER_ADMIN
ORGANIZER
GUEST
```

---

# 5. Super Admin Requirements

Super Admin represents Livara administration.

The Super Admin must be able to:

- Authenticate securely
- Access the Admin Dashboard
- Create Organizer accounts
- View Organizer accounts
- Suspend and reactivate Organizer accounts
- Create Albums
- Assign Albums to Organizers
- View Albums across the platform
- Modify protected Album information
- Reassign Albums
- Access platform statistics
- Inspect platform storage usage
- Recover supported deleted resources
- Perform administrative support actions

Protected Album information includes:

```text
Event Title
Event Date
Album Owner
Public Identifier
```

Only authorized Super Admin operations may modify these fields during the managed MVP business stage.

> 🇷🇺
> Super Admin представляет администрацию Livara.
>
> Он создаёт клиентов и Album, назначает Organizer, управляет защищёнными данными мероприятия и выполняет административные операции.
>
> На этапе MVP название события, дата, владелец Album и публичный идентификатор не изменяются Organizer самостоятельно.

---

# 6. Organizer Requirements

Organizer manages one or more Albums assigned to their account.

The Organizer must be able to:

- Authenticate
- Access their Dashboard
- View their Albums
- Open an Album management interface
- View Album information
- View Gallery Media
- View Media details
- Hide Media from Guests
- Restore hidden Media
- Delete Media where permitted
- Manage Upload Windows
- Download original Media
- Request selected Media exports
- Request full Album exports
- Access QR materials
- View relevant notifications
- Configure settings explicitly permitted to Organizer

Organizer must not be able to:

- Access another Organizer's private management resources
- Change Event Title directly
- Change Event Date directly
- Change Album ownership
- Change protected public identifiers
- Access Super Admin functionality

> 🇷🇺
> Organizer управляет своим Album и его содержимым.
>
> Он может модерировать Media, управлять периодами загрузки, скачивать материалы и получать QR.
>
> При этом Organizer не может самостоятельно менять название события, дату, владельца или защищённый публичный идентификатор.

---

# 7. Guest Requirements

Guests must be able to use the core Livara experience without creating a traditional account.

A Guest must be able to:

- Enter an Album through QR or shared link
- View basic event information
- Browse visible Media
- Open individual photos and videos
- Upload supported Media during an active Upload Window
- Receive understandable upload feedback
- Return to the same Album later

The Guest experience must prioritize low friction.

> 🇷🇺
> Для участия в основном сценарии Guest не должен проходить обычную регистрацию.
>
> Гость открывает Album через QR или ссылку, смотрит воспоминания и добавляет свои, если загрузка в данный момент разрешена.

---

# 8. Album Requirements

Album is the central product resource.

Each Album must represent one primary event and its related memory lifecycle.

An Album must contain or reference:

- Event title
- Event date
- Organizer
- Public Guest access identifier
- Album status
- Media collection
- Upload Windows
- Album settings
- Creation and update information

An Album may remain available after its main event date.

One Album may support multiple Upload Windows.

> 🇷🇺
> Album — центральная сущность продукта.
>
> Он представляет одно основное мероприятие и связанную с ним историю воспоминаний.
>
> Album не обязан завершаться после даты свадьбы и может продолжать использоваться для связанных событий.

---

# 9. Album Access Model

MVP Albums use an **unlisted Guest access model**.

Requirements:

- Guest access must be possible through QR code or shared link
- Guest access must not require a traditional account
- Albums must not be publicly discoverable through a general Livara directory
- Albums should not be intentionally indexed by search engines
- Public identifiers must be difficult to guess
- Management interfaces must remain separately authenticated and authorized

A publicly reachable URL does not make an Album publicly discoverable.

> 🇷🇺
> Album в MVP работает по модели unlisted.
>
> Гость может открыть его через QR или ссылку, но Album не должен находиться через публичный каталог Livara или обычный поиск.
>
> Административный доступ Organizer при этом защищён отдельной авторизацией.

---

# 10. Album Status

The product must distinguish the lifecycle state of an Album from whether uploads are currently available.

Possible Album states may include:

```text
DRAFT
ACTIVE
ARCHIVED
DELETED
```

Exact technical enum values are defined in technical documentation.

Album status and Upload Window status are separate concepts.

For example:

```text
Album = ACTIVE
Upload Window = CLOSED
Gallery = AVAILABLE
```

This is a valid product state.

> 🇷🇺
> Состояние самого Album и возможность загрузки — разные понятия.
>
> Активный Album может оставаться доступным для просмотра даже тогда, когда новые фотографии временно нельзя добавлять.

---

# 11. Upload Window Requirements

Upload Windows determine when Guests may contribute new Media.

An Album must support multiple Upload Windows.

Each Upload Window must define at least:

- Album
- Start time
- End time
- State derived from time and validity

Example:

```text
Wedding
12 September
OPEN

↓

13–18 September
CLOSED

↓

Chilla
19 September
OPEN

↓

After
CLOSED
```

The same Album and QR remain in use.

> 🇷🇺
> Upload Window определяет период, когда гости могут загружать новые воспоминания.
>
> Один Album может иметь несколько таких периодов — например, свадьба, а затем Чилла или другое связанное событие.
>
> Для этого не создаётся новый Album и не требуется новый QR.

---

# 12. Upload Permission

Guest upload permission must be determined by valid Album access and an active Upload Window.

The product must not rely on a second independent manual boolean that can contradict Upload Window state.

Conceptually:

```text
CAN_UPLOAD =
Album available
AND
Active Upload Window exists
AND
Guest is allowed
AND
Platform restrictions allow upload
```

Closing an Upload Window must not automatically make the Gallery unavailable.

> 🇷🇺
> Upload Windows должны быть основным источником истины для определения того, разрешена ли загрузка.
>
> Не должно быть отдельного независимого переключателя, который может говорить «загрузка включена», когда Upload Window уже закрыт.

---

# 13. Guest Session Requirements

Livara must be able to recognize a Guest within an Album without requiring a traditional User account.

Guest sessions must:

- Be scoped to an Album
- Be created with minimal Guest interaction
- Allow the Guest experience to continue across requests
- Avoid exposing sensitive session credentials
- Expire according to platform policy

Guest identity must remain separate from authenticated Organizer and Super Admin accounts.

> 🇷🇺
> Livara должна уметь распознавать гостя внутри конкретного Album без создания обычного аккаунта.
>
> Guest Session используется для удобства и безопасности гостевого сценария и не является полноценной пользовательской учётной записью.

---

# 14. QR Requirements

Each Album must have Guest access suitable for QR representation.

QR functionality must allow:

- Guests to reach the correct Album
- The same QR to remain valid across multiple Upload Windows
- QR use during and after the main event
- Multiple visual QR designs pointing to the same Album

The QR design itself may vary without changing the Album identity.

> 🇷🇺
> QR-код является одним из главных способов входа в Album.
>
> Можно создавать несколько визуальных дизайнов QR для столов, приглашений и декора, но все они могут вести в один и тот же Album.

---

# 15. Gallery Requirements

Each Album must provide a Guest-facing Gallery.

The Gallery must:

- Show Media permitted for Guest viewing
- Support photos
- Support supported video formats
- Load progressively
- Support large collections through pagination or equivalent behavior
- Exclude deleted Media
- Exclude hidden Media
- Exclude failed Media
- Exclude unfinished Media
- Remain available when uploads are closed, provided the Album itself remains available

> 🇷🇺
> Галерея показывает гостям только те материалы, которые готовы и разрешены для просмотра.
>
> Закрытие загрузки не должно автоматически закрывать галерею.

---

# 16. Media Requirements

Livara must support Media contributed to an Album.

Each Media item must be associated with:

- Album
- Uploading Guest or relevant source where applicable
- Media type
- Processing status
- Visibility state
- Original file information
- Storage references
- Creation time

Supported MVP Media categories:

```text
IMAGE
VIDEO
```

The system must distinguish Media processing status from Media visibility.

Example:

```text
status = READY
visibility = HIDDEN
```

This means the Media was processed successfully but is intentionally hidden from Guests.

> 🇷🇺
> Состояние обработки Media и его видимость — разные вещи.
>
> Файл может быть полностью готов, но скрыт Organizer от гостей.

---

# 17. Media Processing Requirements

Uploaded Media may require processing before appearing in the Gallery.

The product must support states representing at least:

```text
Uploading / Pending
Processing
Ready
Failed
Deleted
```

Exact technical states are defined in technical documentation.

A Media item must not become publicly visible before it is ready.

Processing failures must not break unrelated Media.

> 🇷🇺
> После загрузки файл может проходить обработку.
>
> До завершения обработки он не должен появляться в гостевой галерее.
>
> Ошибка одного файла не должна влиять на остальные загрузки.

---

# 18. Upload Requirements

Guests must be able to select and upload supported photos and videos.

The upload experience must:

- Validate supported file types
- Validate configured size limits
- Verify upload permission
- Support multiple selected files
- Treat files independently
- Provide upload progress where appropriate
- Report failures clearly
- Allow successful files to continue when another file fails
- Avoid routing large file payloads unnecessarily through application servers where architecture permits direct storage upload

> 🇷🇺
> Гость должен иметь возможность выбрать несколько фотографий или видео.
>
> Каждый файл проходит собственную проверку и загрузку.
>
> Ошибка одного файла не должна отменять успешную загрузку остальных.

---

# 19. Media Visibility

Organizer must be able to control whether valid Media is visible to Guests.

At minimum:

```text
VISIBLE
HIDDEN
```

Visibility changes must not require destroying the original file.

Hidden Media:

- Must disappear from Guest Gallery
- May remain visible in authorized Organizer interfaces
- May be restored where permitted

> 🇷🇺
> Organizer может скрыть нежелательное фото или видео от гостей без немедленного удаления оригинала.
>
> Скрытый материал можно восстановить, если он остаётся действительным.

---

# 20. Media Deletion

Livara must support safe Media deletion.

For resources covered by recovery policy, deletion should initially behave as soft deletion.

Soft-deleted Media must:

- Disappear from normal Gallery views
- Become unavailable through normal Guest access
- Be recoverable by authorized administration during the recovery period
- Be permanently cleaned later according to retention policy

> 🇷🇺
> Удаление Media должно быть безопасным.
>
> Если действует период восстановления, файл сначала скрывается из обычной системы и только позже удаляется окончательно.

---

# 21. Media Moderation

Organizer must be able to moderate Album content.

Required moderation capabilities:

```text
View
Hide
Restore
Delete
Download
```

Super Admin may have broader recovery and administrative capabilities.

Advanced automatic moderation is not required for MVP.

---

# 22. Single Media Download

Authorized users must be able to download original Media where product permissions allow.

Downloads must:

- Respect authorization
- Respect Media availability
- Avoid exposing storage credentials
- Provide access only for an appropriate period

Guest download behavior may be controlled by Album settings.

> 🇷🇺
> Скачивание оригиналов должно происходить только после проверки прав.
>
> Пользователь не должен получать постоянные ключи или доступ к внутреннему хранилищу Livara.

---

# 23. Album Export Requirements

Organizer must be able to request downloadable archives.

MVP should support:

```text
Selected Media Export
Full Album Export
```

Large exports may require background generation.

Organizer must be able to understand whether an export is:

```text
Queued
Processing
Ready
Failed
Expired
```

Completed export archives may be temporary.

> 🇷🇺
> Organizer может запросить ZIP выбранных материалов или всего Album.
>
> Большие архивы не обязаны создаваться мгновенно. Пользователь должен видеть состояние подготовки и скачать готовый архив, пока он доступен.

---

# 24. Notifications

Livara should provide Organizer notifications for meaningful events.

Relevant notification types may include:

- New Media activity
- Upload Window changes
- Export completion
- Important system events

Media activity should be aggregated where appropriate.

Example:

```text
"47 new memories were added."
```

rather than 47 separate notifications.

Notifications are not a permanent audit history.

> 🇷🇺
> Organizer может получать уведомления о важных событиях.
>
> При массовой загрузке Livara не должна создавать десятки одинаковых уведомлений — события можно объединять.

---

# 25. Admin Dashboard

Super Admin must have a platform-level interface.

The Admin Dashboard should provide access to:

- Organizer management
- Album management
- Platform statistics
- Storage information
- Recoverable resources
- Administrative actions

The exact visual design is outside the scope of this document.

---

# 26. Organizer Dashboard

Organizer must have a dedicated management interface.

It should provide access to:

```text
Album Overview
Gallery Management
Upload Windows
Downloads / Exports
QR Materials
Notifications
Permitted Settings
```

The interface must not expose platform-wide administrative controls.

---

# 27. Protected Album Information

The following information is protected during the managed MVP stage:

```text
Event Title
Event Date
Album Owner
Public Identifier
```

Organizer must not directly modify these values.

Required flow:

```text
Organizer Requests Change
        ↓
Livara Reviews Request
        ↓
Super Admin Updates Album
```

This policy may evolve when Livara introduces self-service onboarding.

> 🇷🇺
> На этапе MVP защищённые данные изменяются через администрацию Livara.
>
> Это соответствует текущей бизнес-модели, где Livara самостоятельно создаёт и настраивает мероприятия после оплаты.

---

# 28. Organizer Account Suspension

Super Admin must be able to suspend an Organizer account.

Suspension must:

- Prevent new Organizer authentication
- Revoke or invalidate active authenticated sessions
- Preserve Albums
- Preserve Media
- Avoid automatically deleting customer resources

Reactivation must be possible.

---

# 29. Authentication Requirements

Organizer and Super Admin access must require authentication.

Authentication must provide:

- Secure login
- Session continuation
- Logout
- Logout from all sessions where supported
- Session revocation
- Role-based authorization

Passwords and authentication secrets must never be returned through product interfaces.

Guests use a separate Guest access/session model.

---

# 30. Authorization Requirements

Every protected operation must verify authorization on the server.

The frontend must never be considered the source of truth for permissions.

At minimum:

```text
Super Admin
→ Platform-wide administrative access

Organizer
→ Authorized Albums assigned to that Organizer

Guest
→ Guest experience for the accessed Album
```

Possession of an internal resource ID alone must never grant protected access.

---

# 31. Privacy Requirements

Livara handles personal event Media and must treat it as private user content.

The MVP must:

- Avoid public discovery of unlisted Albums
- Avoid exposing storage credentials
- Restrict Organizer resources to authorized accounts
- Prevent Guests from accessing hidden or deleted Media
- Avoid leaking internal infrastructure information
- Avoid indexing event Albums as intentionally public content

Future versions may introduce stronger Album access options.

---

# 32. Search Engine Requirements

Guest Albums should not be designed for search engine discovery.

Where applicable, the product should discourage indexing of Guest Album pages.

Marketing pages and public Livara content may remain indexable separately.

> 🇷🇺
> Страницы самих мероприятий не предназначены для поисковой выдачи.
>
> Это не относится к маркетинговому сайту Livara, который может индексироваться отдельно.

---

# 33. Performance Requirements

The Guest experience must remain usable on mobile devices and typical event internet connections.

The product should prioritize:

- Fast initial Album access
- Progressive Gallery loading
- Efficient Media delivery
- Optimized images where appropriate
- Background processing for expensive operations
- Avoiding synchronous generation of large exports

Exact performance targets may be defined later through production measurements.

---

# 34. Mobile Experience

Guest experience must be mobile-first.

Primary Guest actions must work well on modern mobile browsers:

```text
Scan QR
Open Album
Browse Gallery
Select Media
Upload Media
View Upload Status
Return Later
```

A native mobile application is not required for MVP.

> 🇷🇺
> Основной Guest-сценарий происходит со смартфона, поэтому мобильная версия является приоритетной.
>
> Отдельное приложение для iOS или Android для MVP не требуется.

---

# 35. Reliability Requirements

The product must handle expected failures gracefully.

Examples include:

- Upload failure
- Media processing failure
- Temporary storage failure
- Export generation failure
- Expired Guest session
- Invalid Album URL

Failures should provide understandable user-facing behavior without exposing technical internals.

---

# 36. Data Recovery

Where recovery is supported, Livara must distinguish between user-facing deletion and final physical cleanup.

Super Admin should be able to recover supported soft-deleted resources during the configured recovery period.

Recovery must not automatically enable Guest uploads.

> 🇷🇺
> Восстановление удалённого Album не должно автоматически открывать загрузку для гостей.
>
> После восстановления система должна перейти в безопасное состояние.

---

# 37. Audit Requirements

Sensitive administrative operations should have a durable audit history.

Examples:

- Organizer created
- Organizer suspended
- Album created
- Album reassigned
- Protected Album information changed
- Deleted resource recovered
- Sessions revoked

Audit history is separate from Notifications.

> 🇷🇺
> Важные административные действия должны оставлять историю.
>
> Audit Log отвечает на вопрос «кто и что изменил», а Notification — «что нужно показать пользователю».

---

# 38. Storage Requirements

Livara must preserve original Media according to product and retention rules.

The system may additionally create:

- Optimized images
- Thumbnails
- Video derivatives
- Temporary ZIP archives

Temporary generated resources may have shorter retention than original event Media.

---

# 39. QR Design Requirements

Livara should support attractive QR materials suitable for real events.

The product may provide multiple QR designs for:

- Wedding tables
- Invitations
- Welcome boards
- Posters
- Digital sharing

QR presentation should communicate the Guest benefit.

Example:

```text
Relive the wedding through everyone's eyes.

Scan to discover and share memories.
```

> 🇷🇺
> QR должен выглядеть как часть мероприятия, а не как техническая наклейка.
>
> В будущем Livara может иметь библиотеку дизайнов для разных типов мероприятий.

---

# 40. Localization

Livara should be designed with localization in mind.

The initial product should support the languages required for its primary market.

User-facing text must not be hardcoded in a way that prevents future localization.

Exact launch languages are a product decision and may evolve independently from the core architecture.

> 🇷🇺
> Архитектура интерфейса должна учитывать мультиязычность с самого начала.
>
> Добавление новых языков не должно требовать переписывания основных функций продукта.

---

# 41. MVP Scope

The MVP includes the capabilities necessary to deliver the core Livara experience:

```text
Authentication
Super Admin
Organizer Accounts
Albums
Unlisted Guest Access
Guest Sessions
QR Access
Upload Windows
Photo Upload
Video Upload
Media Processing
Gallery
Media Moderation
Downloads
Album Exports
Organizer Dashboard
Admin Dashboard
Basic Notifications
Soft Delete / Recovery
```

The exact implementation order is defined in the Roadmap.

---

# 42. Out of Scope for MVP

The following are not required for the initial MVP unless later promoted into scope:

```text
Native iOS application
Native Android application
AI photo recognition
Face recognition
Automatic guest identification
Advanced social network features
Comments
Likes
Public user profiles
Public event discovery
Livestreaming
Advanced automated moderation
White-label platform
Full self-service billing
Marketplace
Complex CRM
```

These features may be considered after the core product has been validated.

---

# 43. Future Self-Service

The architecture should allow Livara to evolve from managed onboarding to self-service.

Future customers may be able to:

```text
Register
Choose Package
Pay
Create Event
Configure Album
Generate QR
Manage Event
```

MVP should not unnecessarily couple core Album functionality to manual Super Admin creation.

> 🇷🇺
> Сейчас Livara вручную подключает клиентов.
>
> Но фундамент продукта должен позволять в будущем автоматизировать покупку и создание мероприятия без полной перестройки системы.

---

# 44. Product Success Criteria

The MVP is successful when a real event can complete the following lifecycle:

```text
1. Livara creates the customer and Album.
2. Organizer receives management access.
3. QR is prepared and placed at the event.
4. Guests scan the QR without creating accounts.
5. Guests view the shared Gallery.
6. Guests upload photos and videos.
7. Uploaded Media is processed and becomes available.
8. Organizer moderates unwanted Media.
9. Uploads close automatically according to the configured window.
10. Gallery remains accessible.
11. A later Upload Window may reopen contributions.
12. Organizer downloads Media or requests an Album export.
13. The Album remains as a preserved event memory.
```

If this complete experience works reliably for a real event, the core Livara MVP has achieved its primary goal.

---

# 45. Acceptance Criteria

Livara MVP is product-complete when:

- Super Admin can securely access administration
- Super Admin can create Organizer accounts
- Super Admin can create and assign Albums
- Protected Album information can only be changed by authorized administration
- Organizer can securely authenticate
- Organizer can access only authorized Albums
- Guest can enter through QR or shared link
- Guest does not need traditional registration
- Album is unlisted rather than publicly discoverable
- Guest session works within the Album experience
- Multiple Upload Windows are supported
- Upload permission follows Upload Window state
- Gallery remains available when uploads are closed
- Guests can upload supported photos and videos
- Media processing state is tracked
- Media visibility is tracked separately from processing
- Organizer can hide and restore Media
- Organizer can safely delete Media
- Organizer can download original Media
- Organizer can request selected and full Album exports
- Large exports can be processed asynchronously
- Organizer can receive relevant notifications
- Soft-deleted supported resources can be recovered during retention
- Sensitive administrative actions can be audited
- Mobile Guest experience is usable
- Storage credentials and private infrastructure are never exposed
- The complete workflow can be used at a real event

---

# 46. Product Principle

Every product decision should support the central Livara promise:

**Relive your event through every guest's eyes.**

And the role of every participant:

**Every guest becomes a storyteller.**

The product succeeds when technology becomes invisible and the shared memory becomes the experience.