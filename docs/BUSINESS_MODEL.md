# Livara Business Model

**Project:** Livara

**Type:** SaaS Platform

**Category:** Event Memory & Photo Sharing Platform

**Current Stage:** MVP Development

**Primary Market:** Wedding & Event Industry

**Initial Market:** Uzbekistan

**Document Version:** 1.0

> 🇷🇺
> Этот документ определяет бизнес-модель Livara: ценность продукта, целевую аудиторию, роли пользователей, жизненный цикл мероприятия, модель продаж и долгосрочное развитие платформы.

---

# 1. Product Overview

Livara is a platform that helps people collect, share, and preserve memories from meaningful events.

Guests enter an event album through a QR code or private shared link and can view, upload, and contribute photos and videos without creating a traditional account.

Rather than replacing professional photography, Livara complements it by capturing the event through the perspectives of everyone who experienced it.

The result is a shared digital memory that can continue growing during and after the main event.

> 🇷🇺
> Livara — это платформа для сбора, обмена и сохранения воспоминаний с важных событий.
>
> Гости попадают в альбом через QR-код или переданную им ссылку и могут просматривать и загружать фотографии и видео без традиционной регистрации.
>
> Livara не заменяет профессионального фотографа, а дополняет его, сохраняя событие глазами всех его участников.
>
> В результате создаётся общая цифровая история, которая может продолжать пополняться как во время мероприятия, так и после него.

---

# 2. Problem Statement

Photos and videos from events are usually fragmented across many devices and platforms.

Guests take hundreds or thousands of unique photos and videos, but these memories often remain:

- On individual phones
- In messaging applications
- In social media stories
- In private cloud storage
- Forgotten or eventually deleted

Collecting these files manually after an event is inconvenient.

Professional photographers capture important moments, but they cannot capture every conversation, reaction, joke, spontaneous moment, or perspective happening throughout the event.

Livara solves this by giving everyone one shared place to contribute and experience the event together.

> 🇷🇺
> Фотографии и видео с мероприятий обычно разбросаны по десяткам или сотням устройств.
>
> Гости создают огромное количество уникальных кадров, которые остаются в телефонах, мессенджерах, социальных сетях и личных облачных хранилищах.
>
> Собирать всё это вручную после мероприятия неудобно, а многие воспоминания в итоге теряются.
>
> Профессиональный фотограф сохраняет важные моменты, но физически не может одновременно увидеть каждую реакцию, разговор, шутку и неожиданную ситуацию.
>
> Livara объединяет эти разные взгляды в одном общем пространстве.

---

# 3. Value Proposition

Livara allows people to:

- Experience an event through the perspectives of its guests
- Collect memories in one place
- Upload without traditional account registration
- Discover photos and videos contributed by others
- Continue collecting memories after the main event
- Preserve authentic moments alongside professional photography
- Download and keep the resulting collection

The emotional value of Livara is not simply access to files.

Customers receive the opportunity to relive their event through moments they may never have personally seen.

Livara can also create new conversations after the event as people discover funny, emotional, unexpected, and previously unseen moments together.

> 🇷🇺
> Ценность Livara заключается не просто в хранении фотографий.
>
> Организатор получает возможность заново увидеть своё событие глазами гостей и обнаружить моменты, которых сам мог даже не заметить.
>
> После мероприятия эти фотографии и видео становятся новой темой для разговоров: смешные ситуации, эмоции, неожиданные кадры и моменты, увиденные другими людьми.

---

# 4. Core Brand Promise

Livara communicates its core value through two messages:

**Relive your event through every guest's eyes.**

**Every guest becomes a storyteller.**

These statements describe the central idea of the product: every participant contributes a different part of the event's story.

---

# 5. Target Audience

Livara initially focuses on weddings and private events.

Primary customers include:

### Couples

Bride and groom who want to preserve their wedding through the perspectives of their guests.

### Event Organizers

People responsible for weddings, celebrations, corporate events, and other gatherings.

### Photographers

Photographers may use Livara as a complementary experience for their clients rather than as a replacement for professional photography.

Over time, Livara may expand to:

- Birthdays
- Engagements
- Anniversaries
- Corporate events
- Graduations
- Family celebrations
- Cultural events
- Other meaningful gatherings

> 🇷🇺
> Первоначально Livara ориентирована прежде всего на свадьбы и частные мероприятия.
>
> Основные клиенты — жених и невеста, организаторы мероприятий и фотографы.
>
> В дальнейшем платформа может использоваться для дней рождения, помолвок, юбилеев, корпоративных мероприятий, выпускных и других важных событий.

---

# 6. User Roles

Livara has three primary roles.

## Super Admin

The Super Admin manages the Livara platform.

During the initial business stage, the Super Admin:

- Creates Organizer accounts
- Creates Albums
- Assigns Albums to Organizers
- Configures protected event information
- Can change event title and date
- Manages platform-level settings
- Provides customer support
- Can access and recover platform resources when required

Initially, this role represents Livara's internal administration.

---

## Organizer

The Organizer is the customer responsible for an Album.

Depending on the event, the Organizer may be:

- Bride or groom
- Event organizer
- Photographer
- Another authorized customer

The Organizer can:

- Access their Album dashboard
- View uploaded Media
- Moderate Media
- Hide or remove unwanted Media
- Configure permitted Album settings
- Manage Upload Windows
- Download Media
- Request Album exports

The Organizer cannot directly modify protected event information such as:

- Event title
- Event date
- Album ownership
- Public identifier

Changes to protected event information require Livara administration during the initial business stage.

---

## Guest

A Guest participates in an event Album.

Guests can:

- Enter through a QR code or shared link
- View available memories
- Upload photos and videos during allowed periods
- Return to the Album later

Guests do not need traditional Livara accounts for the core experience.

The Guest experience should require as little friction as possible.

---

# 7. Album Access Model

Livara Albums are private event spaces in the product sense, but they do not require every Guest to authenticate with an account.

For the MVP, Albums use an **unlisted access model**.

This means:

- The Album is not publicly discoverable through Livara
- The Album should not be indexed as public content
- Guests enter through a QR code or shared link
- The public identifier must be difficult to guess
- Possession of the event link provides access to the Guest experience
- Organizer and administrative functionality remains authenticated separately

A publicly reachable URL does not mean that the Album is intended to be publicly discoverable.

Future versions may introduce additional access controls such as passwords, invitations, or Guest authentication.

---

# 8. Event Lifecycle

A Livara Album represents the complete memory lifecycle of an event.

Example:

```text
Album Created
      ↓
Organizer Receives Access
      ↓
QR Code Prepared
      ↓
Wedding Day
      ↓
Guests Upload Memories
      ↓
Main Upload Window Closes
      ↓
Gallery Remains Available
      ↓
Later Related Event
      ↓
New Upload Window Opens
      ↓
More Memories Added
      ↓
Album Becomes Long-Term Memory