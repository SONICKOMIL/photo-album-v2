# Livara User Flow

**Project:** Livara

**Document Version:** 1.0

> 🇷🇺
> Этот документ описывает, как Super Admin, Organizer и Guest взаимодействуют с Livara на протяжении полного жизненного цикла мероприятия.
>
> User Flow определяет пользовательское поведение продукта. Техническая реализация описывается отдельно в Architecture, Database и API документации.

---

# 1. Overview

Livara is built around one central object: the Event Album.

The Album begins as an event created by Livara administration, becomes a shared memory space during the event, may continue receiving memories during later related gatherings, and eventually remains as a long-term collection.

The primary lifecycle is:

```text
Event Created
      ↓
Organizer Receives Access
      ↓
QR Code Prepared
      ↓
Guests Enter Album
      ↓
Guests View & Upload Memories
      ↓
Organizer Moderates Album
      ↓
Main Upload Window Closes
      ↓
Gallery Remains Available
      ↓
Optional Later Upload Windows
      ↓
Long-Term Event Memory
```

> 🇷🇺
> В центре Livara находится Album — цифровое пространство конкретного мероприятия.
>
> Сначала Livara создаёт событие и передаёт доступ организатору. Во время мероприятия гости через QR-код попадают в общий альбом, просматривают и добавляют воспоминания.
>
> После основного события загрузка может закрыться, при этом галерея продолжает работать. Позже загрузку можно снова открыть для связанных событий и традиций.
>
> В итоге Album становится долгосрочной цифровой историей мероприятия.

---

# 2. Actors

Livara has three primary actors:

```text
Super Admin
Organizer
Guest
```

Each actor has a different level of access and responsibility.

---

# 3. Super Admin

The Super Admin manages Livara at the platform level.

During the initial business stage, Super Admin represents Livara administration and is responsible for customer onboarding and protected platform operations.

The Super Admin can:

- Create Organizer accounts
- Create Albums
- Assign Albums to Organizers
- Configure event information
- Change protected Album information
- Manage platform resources
- Support customers
- Recover supported deleted resources
- View platform-level information

Protected Album information includes:

- Event title
- Event date
- Album ownership
- Public Album identifier

> 🇷🇺
> Super Admin управляет Livara на уровне всей платформы.
>
> На начальном этапе именно администрация Livara создаёт клиентов и их мероприятия, назначает Organizer и управляет защищённой информацией.
>
> Organizer не может самостоятельно менять название мероприятия, дату, владельца Album или его публичный идентификатор.

---

# 4. Organizer

The Organizer owns or manages a specific Event Album.

An Organizer may be:

- Bride or groom
- Event organizer
- Photographer
- Another authorized customer

The Organizer can:

- Access the Organizer Dashboard
- View their Albums
- View Album statistics
- View Guest Media
- Hide unwanted Media
- Restore hidden Media
- Delete Media where permitted
- Manage Upload Windows
- Download Media
- Request Album exports
- Access QR materials
- Configure permitted Album settings

The Organizer cannot modify protected event information directly.

> 🇷🇺
> Organizer — клиент, который управляет конкретным Album.
>
> Это может быть жених, невеста, организатор мероприятия, фотограф или другой человек, которому передано управление.
>
> Organizer контролирует содержимое Album и периоды загрузки, но защищённые данные мероприятия изменяются через администрацию Livara.

---

# 5. Guest

The Guest participates in an Event Album.

The Guest does not need a traditional Livara account for the core experience.

A Guest can:

- Enter through QR code or shared link
- View the Event Album
- View shared Media
- Upload photos and videos during an active Upload Window
- Return to the Album later
- See memories contributed by other Guests

Guest access should require as little friction as possible.

> 🇷🇺
> Guest — участник мероприятия.
>
> Для основного сценария гостю не требуется создавать обычный аккаунт Livara.
>
> Он сканирует QR-код или открывает ссылку, попадает в Album, смотрит воспоминания других людей и добавляет свои, когда загрузка разрешена.

---

# 6. Customer Onboarding Flow

During the initial business stage, onboarding is managed by Livara.

```text
Customer Contacts Livara
        ↓
Event Details Discussed
        ↓
Package Selected
        ↓
Payment Confirmed
        ↓
Super Admin Creates Organizer
        ↓
Super Admin Creates Album
        ↓
Album Assigned to Organizer
        ↓
Event Information Configured
        ↓
QR Material Prepared
        ↓
Organizer Receives Access
```

The customer does not need to create and configure the entire event independently during the initial stage.

> 🇷🇺
> На начальном этапе подключение клиента выполняется вручную через Livara.
>
> После обсуждения мероприятия и оплаты Super Admin создаёт Organizer, создаёт Album, настраивает данные события и передаёт клиенту доступ и QR-материалы.
>
> В будущем этот процесс может быть автоматизирован.

---

# 7. Super Admin — Create Organizer Flow

```text
Super Admin Login
        ↓
Admin Dashboard
        ↓
Organizers
        ↓
Create Organizer
        ↓
Enter Required Information
        ↓
Organizer Created
        ↓
Access Provided to Customer
```

The Organizer account can later own or manage one or more Albums according to the product model.

---

# 8. Super Admin — Create Album Flow

```text
Admin Dashboard
      ↓
Create Album
      ↓
Select Organizer
      ↓
Enter Event Title
      ↓
Enter Event Date
      ↓
Configure Album
      ↓
Create Initial Upload Window
      ↓
Generate Public Access
      ↓
Prepare QR
      ↓
Album Ready
```

The Super Admin controls protected Album information.

> 🇷🇺
> Super Admin создаёт Album, назначает владельца, указывает название и дату события, выполняет начальную настройку и подготавливает доступ для гостей.
>
> После этого Album готов к использованию на мероприятии.

---

# 9. Organizer Login Flow

```text
Organizer Opens Livara
        ↓
Login
        ↓
Credentials Valid?
   ┌────┴────┐
   │         │
  NO        YES
   │         │
Error     Dashboard
```

After successful authentication, the Organizer enters the Dashboard and sees only resources they are authorized to manage.

---

# 10. Organizer Dashboard Flow

```text
Organizer Dashboard
        ↓
Select Album
        ↓
Album Dashboard
```

The Album Dashboard may provide access to:

```text
Overview
Gallery
Upload Windows
Downloads / Exports
QR Materials
Album Settings
```

The exact interface may evolve, but authorization rules remain consistent.

> 🇷🇺
> После входа Organizer попадает в Dashboard и выбирает нужный Album.
>
> Оттуда он управляет фотографиями и видео, периодами загрузки, скачиванием, QR и разрешёнными настройками.

---

# 11. QR Flow

The QR code is one of the primary Guest entry points.

```text
Guest Sees QR
      ↓
Scans QR
      ↓
Livara Album URL
      ↓
Album Valid?
  ┌────┴────┐
  │         │
 NO        YES
  │         │
Error     Album
```

The QR code points to the same Event Album throughout its lifecycle.

A new QR code is not required when a later Upload Window opens.

> 🇷🇺
> QR-код ведёт в один и тот же Album.
>
> После свадьбы его не нужно заменять для Чиллы или другого связанного события. Меняется возможность загрузки, а не сам Album или QR-код.

---

# 12. Guest Entry Flow

For MVP, Albums use an unlisted access model.

```text
QR / Shared Link
       ↓
Public Album Identifier
       ↓
Album Exists?
   ┌───┴───┐
   │       │
  NO      YES
   │       │
404      Album Available?
         ┌────┴────┐
         │         │
        NO        YES
         │         │
    Unavailable   Guest Entry
```

A Guest does not need to search for the Album through Livara.

Access comes through possession of the QR code or shared link.

The Album should not be publicly discoverable or indexed as normal public content.

> 🇷🇺
> В MVP Album работает как unlisted-пространство.
>
> Его URL доступен через интернет, но само мероприятие не должно находиться через публичный поиск Livara или поисковые системы.
>
> Гость получает доступ через QR-код или переданную ему ссылку.

---

# 13. Guest Session Flow

When a Guest enters an Album, Livara may establish a Guest session for that Album.

```text
Guest Opens Album
       ↓
Existing Valid Guest Session?
       │
   ┌───┴───┐
   │       │
  YES      NO
   │       │
Reuse    Create Guest Session
   │       │
   └───┬───┘
       ↓
Album Experience
```

The Guest session allows Livara to recognize the Guest experience without requiring a traditional account.

A Guest session belongs to a specific Album.

> 🇷🇺
> Livara может создать гостевую сессию при первом посещении Album.
>
> Благодаря этому гостя можно узнавать при следующих действиях без регистрации обычного аккаунта.
>
> Гостевая сессия относится к конкретному Album.

---

# 14. Guest Gallery Flow

The Gallery is the central Guest experience.

```text
Guest Opens Album
       ↓
Gallery Loads
       ↓
Visible Memories
       ↓
Browse Photos / Videos
       ↓
Open Memory
       ↓
Return to Gallery
```

The Gallery contains only Media that is available for Guest viewing.

Hidden, deleted, failed, or unfinished Media must not appear.

> 🇷🇺
> Галерея — центральная часть опыта гостя.
>
> Здесь он видит опубликованные воспоминания других участников.
>
> Скрытые, удалённые или ещё не обработанные материалы гостю не показываются.

---

# 15. Guest Upload Availability Flow

Before allowing a Guest to upload, Livara checks whether uploads are currently allowed.

```text
Guest Opens Album
       ↓
Upload Action
       ↓
Active Upload Window?
   ┌────┴────┐
   │         │
  NO        YES
   │         │
Upload     Select Media
Closed
```

If uploads are closed, the Gallery may remain fully available.

> 🇷🇺
> Возможность загрузки и доступность галереи — разные вещи.
>
> Если Upload Window закрыт, гости больше не могут добавлять новые материалы, но уже собранные воспоминания могут оставаться доступными.

---

# 16. Guest Upload Flow

```text
Guest Selects Photos / Videos
          ↓
Client Validates Selection
          ↓
Livara Authorizes Upload
          ↓
Files Upload
          ↓
Upload Completed
          ↓
Media Processing
          ↓
Ready?
     ┌────┴────┐
     │         │
    NO        YES
     │         │
 Processing   Gallery
 / Failed
```

Each file has its own upload and processing lifecycle.

One failed file should not automatically cause all selected files to fail.

> 🇷🇺
> Гость может выбрать фотографии и видео и отправить их в Album.
>
> Каждый файл обрабатывается отдельно. Если один файл не загрузился, остальные не должны автоматически считаться неудачными.
>
> После успешной обработки воспоминание появляется в галерее.

---

# 17. Guest Upload Success Experience

After successful contribution, Livara should clearly communicate that the Guest's memories became part of the event story.

Example:

```text
Upload Complete

"Your memories have been added."
```

The Guest may then:

```text
Return to Gallery
Upload More
Continue Browsing
```

The experience should not require unnecessary technical steps.

---

# 18. Upload Window Lifecycle

One Album may have multiple Upload Windows.

Example:

```text
Wedding Upload Window
September 12
OPEN
      ↓
September 13
CLOSED
      ↓
Gallery Remains Available
      ↓
Chilla Upload Window
September 19
OPEN
      ↓
CLOSED
      ↓
Gallery Remains Available
```

Upload permission is determined by the currently active Upload Window.

The Album does not need to be recreated for later related events.

> 🇷🇺
> Один Album может иметь несколько периодов загрузки.
>
> Например, загрузка открывается во время свадьбы, затем закрывается, а позже снова открывается на Чиллу.
>
> Все воспоминания продолжают собираться в одном Album.

---

# 19. Organizer — Manage Upload Windows Flow

```text
Organizer
    ↓
Album Dashboard
    ↓
Upload Windows
    ↓
View Schedule
    ↓
Create / Configure Allowed Window
    ↓
Window Reaches Start Time
    ↓
Uploads Available
    ↓
Window Reaches End Time
    ↓
Uploads Closed
```

Organizer actions must respect platform rules and permissions.

Changes to the main event date remain protected and require Super Admin.

> 🇷🇺
> Organizer управляет периодами, когда гости могут добавлять новые воспоминания.
>
> При этом изменение Upload Window не означает изменение официальной даты мероприятия.

---

# 20. Organizer — Gallery Management Flow

```text
Organizer Opens Album
        ↓
Gallery Management
        ↓
View Media
        ↓
Select Media
        ↓
Action
```

Available actions may include:

```text
View
Hide
Restore
Delete
Download
```

Hiding Media removes it from the Guest Gallery without immediately destroying the stored file.

> 🇷🇺
> Organizer может модерировать содержимое Album.
>
> Нежелательное фото можно скрыть от гостей без немедленного физического удаления файла.
>
> Это позволяет безопаснее управлять воспоминаниями и при необходимости восстановить материал.

---

# 21. Organizer — Hide Media Flow

```text
Visible Media
     ↓
Organizer Selects Hide
     ↓
Confirmation
     ↓
Media Hidden
     ↓
Removed from Guest Gallery
```

The Media remains available to authorized management interfaces where appropriate.

---

# 22. Organizer — Restore Media Flow

```text
Hidden Media
     ↓
Organizer Selects Restore
     ↓
Media Valid and READY?
   ┌────┴────┐
   │         │
  NO        YES
   │         │
Error     Visible Again
```

Only valid Media may return to the Guest Gallery.

---

# 23. Organizer — Delete Media Flow

```text
Organizer Selects Media
        ↓
Delete
        ↓
Confirmation
        ↓
Soft Delete
        ↓
Removed from Normal Views
```

Where recovery is supported, permanent storage cleanup occurs according to retention rules rather than immediately.

> 🇷🇺
> Удаление должно быть безопасным.
>
> На первом этапе Media может быть soft-deleted: оно исчезает из обычных интерфейсов, но некоторое время может быть восстановлено администрацией до окончательной очистки.

---

# 24. Organizer — Download Single Media Flow

```text
Organizer Selects Media
        ↓
Download
        ↓
Authorization Check
        ↓
Temporary Download Access
        ↓
Original Media Downloaded
```

Storage credentials must never be exposed to the Organizer.

---

# 25. Organizer — Album Export Flow

The Organizer may request a downloadable archive.

```text
Organizer
    ↓
Select Media / Full Album
    ↓
Request Export
    ↓
Export Queued
    ↓
Processing
    ↓
Archive Ready
    ↓
Organizer Downloads ZIP
    ↓
Archive Expires Later
```

Large exports are not expected to be generated instantly.

> 🇷🇺
> Organizer может запросить ZIP выбранных воспоминаний или всего Album.
>
> Большой архив создаётся в фоне. Когда он готов, Organizer получает возможность скачать его.
>
> Сам временный ZIP не должен храниться бессрочно.

---

# 26. Organizer — QR Materials Flow

```text
Organizer
    ↓
Album
    ↓
QR Materials
    ↓
Select Design
    ↓
Download / Print
    ↓
Place at Event
```

QR designs may include formats suitable for:

- Tables
- Invitations
- Welcome areas
- Posters
- Digital sharing

All designs point Guests to the same Album.

> 🇷🇺
> Organizer получает QR-материалы, которые можно распечатать и разместить на столах, приглашениях, welcome-зоне или других элементах мероприятия.
>
> Внешний дизайн QR может отличаться, но ссылка ведёт в один и тот же Album.

---

# 27. Protected Album Changes Flow

Organizer cannot directly change protected Album information.

```text
Organizer Needs Protected Change
            ↓
Contacts Livara
            ↓
Super Admin Reviews Request
            ↓
Authorized?
      ┌─────┴─────┐
      │           │
     NO          YES
      │           │
No Change     Admin Updates Album
```

Protected fields include:

```text
Event Title
Event Date
Album Owner
Public Identifier
```

This workflow applies during the initial managed business stage.

> 🇷🇺
> Если клиенту нужно изменить название или дату события, он обращается в Livara.
>
> Изменение выполняет Super Admin.
>
> В будущем при переходе к автоматизированной модели некоторые правила могут измениться.

---

# 28. Returning Guest Flow

A Guest may return after the main event.

```text
Guest Opens Same QR / Link
          ↓
Album Available
          ↓
Gallery
          ↓
Active Upload Window?
      ┌────┴────┐
      │         │
     NO        YES
      │         │
View Only    View + Upload
```

This makes the same Album useful throughout the extended event lifecycle.

> 🇷🇺
> Гость может снова открыть тот же QR-код после свадьбы.
>
> Если загрузка закрыта — он просматривает воспоминания.
>
> Если начался новый Upload Window — например, связанный с Чиллой — он снова может добавлять материалы.

---

# 29. Album Long-Term Flow

After all active collection periods end:

```text
Final Upload Window Closes
          ↓
No New Uploads
          ↓
Gallery Remains
          ↓
Organizer Can Manage / Download
          ↓
Album Preserved According to Plan
```

The exact retention period may depend on the customer's package and future business rules.

The product should not assume that the value of the Album ends when uploads close.

> 🇷🇺
> После завершения всех периодов загрузки ценность Album не исчезает.
>
> Он остаётся местом, куда можно вернуться, чтобы снова увидеть историю события и сохранить её.

---

# 30. Invalid Album Flow

If a Guest opens an invalid or unavailable Album:

```text
Open Album URL
      ↓
Album Not Available
      ↓
Friendly Error Experience
```

The Guest should not see technical errors, database information, storage information, or internal identifiers.

---

# 31. Upload Failure Flow

```text
Upload Started
      ↓
Failure
      ↓
Recoverable?
   ┌───┴───┐
   │       │
  YES      NO
   │       │
Retry    Clear Error
   │       │
   └───┬───┘
       ↓
Guest Continues
```

One upload failure should not unnecessarily interrupt the entire Album experience.

> 🇷🇺
> Ошибка загрузки одного файла не должна ломать весь пользовательский сценарий.
>
> Если повтор возможен, Livara должна позволить повторить загрузку понятным способом.

---

# 32. Organizer Suspension Flow

If an Organizer account is suspended:

```text
Organizer Suspended
        ↓
New Login Blocked
        ↓
Existing Sessions Revoked
```

Suspension of the Organizer does not automatically destroy their Albums or Media.

Platform administration determines what happens to those resources.

---

# 33. Album Recovery Flow

Where supported:

```text
Album Soft Deleted
      ↓
Recovery Period
      ↓
Super Admin Reviews
      ↓
Recover
      ↓
Album Restored
      ↓
Safe Non-Uploading State
```

Recovery must not automatically reopen Guest uploads.

---

# 34. Future Self-Service Flow

The initial workflow is managed by Livara.

In the future, onboarding may become self-service:

```text
Customer Visits Livara
        ↓
Creates Account
        ↓
Selects Package
        ↓
Pays Online
        ↓
Creates Event
        ↓
Configures Album
        ↓
Receives QR
        ↓
Event Goes Live
```

This future workflow should be possible without fundamentally rebuilding the core Album model.

> 🇷🇺
> В будущем Livara должна позволить клиенту самостоятельно зарегистрироваться, оплатить пакет, создать мероприятие и получить QR.
>
> Архитектура MVP должна позволять перейти к этой модели без полной перестройки продукта.

---

# 35. Complete MVP Flow

The complete MVP experience can be summarized as:

```text
CUSTOMER
   ↓
Contacts Livara
   ↓
Pays
   ↓
SUPER ADMIN
   ↓
Creates Organizer
   ↓
Creates Album
   ↓
Configures Event
   ↓
Creates Upload Window
   ↓
Prepares QR
   ↓
ORGANIZER
   ↓
Receives Dashboard Access
   ↓
Prepares Event
   ↓
GUEST
   ↓
Scans QR
   ↓
Opens Album
   ↓
Views Gallery
   ↓
Uploads Memories
   ↓
Media Becomes READY
   ↓
Shared Gallery
   ↓
ORGANIZER
   ↓
Moderates Memories
   ↓
Downloads / Exports
   ↓
UPLOAD WINDOW CLOSES
   ↓
Gallery Remains Available
   ↓
OPTIONAL LATER EVENT
   ↓
New Upload Window
   ↓
More Memories
   ↓
LONG-TERM ALBUM
```

---

# 36. User Flow Principles

All Livara flows should follow these principles:

### Guest Friction Must Stay Low

Guests should reach the event experience with as few steps as possible.

### One Event, One Album

Related memories should remain connected to the same Event Album whenever appropriate.

### Upload Permission and Gallery Access Are Separate

Closing uploads must not automatically close the Gallery.

### Protected Data Has Clear Ownership

Organizer manages the experience.

Super Admin manages protected platform-level information during the managed business stage.

### Failures Should Be Recoverable

A failed file, export, or background operation should not unnecessarily break the entire experience.

### Technology Should Remain Invisible

Users should interact with memories and events, not infrastructure concepts.

> 🇷🇺
> Все пользовательские сценарии Livara должны оставаться простыми и предсказуемыми.
>
> Гость быстро попадает в событие, Organizer контролирует свой Album, Super Admin управляет защищёнными операциями, а техническая сложность остаётся внутри системы.

---

# 37. User Flow Summary

Livara connects three actors around one shared Event Album:

```text
Super Admin
     │
     │ creates and protects
     ▼
Event Album
     ▲
     │ manages
Organizer
     │
     │ shares QR
     ▼
Guests
     │
     │ contribute memories
     ▼
Shared Story
```

The Album begins as a configured event and becomes a growing collection of memories contributed by the people who experienced it.

**Relive your event through every guest's eyes.**

**Every guest becomes a storyteller.**