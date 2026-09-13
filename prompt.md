# ANLIK — Nostr-Based, Fully Client-Side Social Media App

## Role

You are a senior **React Native, TypeScript, Nostr protocol, DDD, Clean Architecture, and mobile systems architect**.

You will build this application from scratch according to the specification below.

The application name should be a **simple, memorable, elegant, and brandable name**. You may choose the final name yourself. Do not use a generic technical name.

---

# 1. Product Vision

Build a completely **client-side, Nostr-native social media application**, inspired by Instagram.

There is **NO custom backend**.

The application communicates directly with:

* Nostr relays
* Blossom-compatible media servers
* NIP-96-compatible media servers
* Nostr signers / bunkers

The client is responsible for:

* UI
* application state
* local cache
* identity management
* signing
* event validation
* relay communication
* media upload
* feed aggregation
* story expiration filtering
* optimistic UI where appropriate
* offline/reconnection handling

The application must remain usable even when individual relays fail.

---

# 2. Initial Product Scope

The first release must remain intentionally small.

### V1 features

1. User identity / authentication
2. Profile
3. Image posts
4. Image feed
5. Stories
6. Follow users
7. Like posts
8. Comment on posts
9. Relay management internally
10. Local caching
11. Offline-aware behavior

### Explicitly NOT included in V1

Do not implement:

* Reels
* Video posts
* Direct messages
* Groups
* Live streaming
* Payments
* Zaps
* Notifications backend
* Ads
* Carousels
* Custom backend
* Custom authentication server
* Custom database server

The architecture must make these features easy to add later without prematurely implementing them.

---

# 3. Core Architectural Principle

Use:

**Pragmatic DDD + Clean Architecture + Feature-First Architecture + SOLID**

However:

> Do NOT turn the application into an academic Clean Architecture demonstration.

Architecture exists to protect boundaries and make the system easier to evolve.

Do not create abstractions merely because a design pattern exists.

Prefer:

* simple
* explicit
* testable
* understandable
* replaceable
* maintainable

over:

* excessive abstraction
* generic frameworks
* unnecessary interfaces
* unnecessary factories
* unnecessary base classes
* excessive dependency injection
* premature event-driven architecture

---

# 4. Technology Stack

Use:

* React Native CLI
* TypeScript
* Strict TypeScript
* React Navigation
* TanStack Query
* Zustand
* MMKV
* React Native Keychain
* Jest
* React Native Testing Library

Nostr:

* `nostr-tools`

Cryptography:

* `@noble/curves`
* `@noble/hashes`

Required React Native compatibility/polyfills should be added only when actually necessary.

Potential examples:

* `react-native-get-random-values`
* `buffer`
* `fast-text-encoding`

Do not blindly install dependencies.

Before adding a package:

1. Verify that it is actually required.
2. Verify React Native CLI compatibility.
3. Prefer well-maintained, minimal dependencies.
4. Explain why the dependency is needed.

---

# 5. Dependency Rules

Domain layer:

**MUST NOT depend on external libraries.**

Application layer:

* depends only on domain contracts/types
* must not know implementation details

Infrastructure:

* may depend on Nostr libraries
* may depend on crypto libraries
* may depend on Keychain/MMKV
* may depend on networking libraries

Presentation:

* React Native specific
* communicates with application/use-case layer
* must not directly access infrastructure implementations

---

# 6. Feature-First Project Structure

Use a structure similar to:

```text
src/
│
├── app/
│   ├── di/
│   ├── navigation/
│   ├── providers/
│   ├── config/
│   └── bootstrap/
│
├── core/
│   ├── errors/
│   ├── result/
│   ├── logging/
│   ├── types/
│   └── utilities/
│
├── shared/
│   ├── components/
│   ├── hooks/
│   ├── utils/
│   └── constants/
│
├── infrastructure/
│   ├── nostr/
│   │   ├── gateway/
│   │   ├── relay/
│   │   ├── crypto/
│   │   └── mappers/
│   │
│   ├── storage/
│   │   ├── keychain/
│   │   └── mmkv/
│   │
│   └── media/
│
└── features/
    │
    ├── auth/
    │   ├── domain/
    │   ├── application/
    │   ├── infrastructure/
    │   └── presentation/
    │
    ├── feed/
    │   ├── domain/
    │   ├── application/
    │   ├── infrastructure/
    │   └── presentation/
    │
    ├── stories/
    │   ├── domain/
    │   ├── application/
    │   ├── infrastructure/
    │   └── presentation/
    │
    ├── profile/
    │   ├── domain/
    │   ├── application/
    │   ├── infrastructure/
    │   └── presentation/
    │
    ├── social/
    │   ├── domain/
    │   ├── application/
    │   ├── infrastructure/
    │   └── presentation/
    │
    └── media-upload/
        ├── domain/
        ├── application/
        ├── infrastructure/
        └── presentation/
```

Do not create folders that contain no meaningful responsibility.

---

# 7. Layer Responsibilities

## Domain

Contains:

* entities
* value objects
* domain rules
* domain errors
* repository/service ports where appropriate

Examples:

```text
User
Post
Story
ImageAttachment
PublicKey
NostrIdentity
Relay
```

The domain must NOT know:

* React Native
* Nostr WebSocket protocol
* nostr-tools
* Keychain
* MMKV
* HTTP
* Blossom
* NIP-96
* Zustand
* TanStack Query

---

# 8. Application Layer

Contains use cases.

Examples:

```text
CreateIdentityUseCase
ImportIdentityUseCase
ConnectSignerUseCase
GetCurrentUserUseCase

GetFeedUseCase
PublishImagePostUseCase
LikePostUseCase
CommentOnPostUseCase

GetActiveStoriesUseCase
PublishStoryUseCase

FollowUserUseCase
UnfollowUserUseCase

GetProfileUseCase
UpdateProfileUseCase

UploadImageUseCase
```

Use cases coordinate application behavior.

They must not contain UI logic.

They must not directly access infrastructure.

---

# 9. Infrastructure Layer

Infrastructure implements application/domain ports.

Examples:

```text
NostrGateway
RelayPool
KeychainSignerRepository
Nip46SignerAdapter
NostrToolsCryptoAdapter
BlossomUploader
Nip96Uploader
MmkvCache
```

Nostr-specific details belong here.

---

# 10. Presentation Layer

Presentation contains:

* screens
* components
* hooks
* view models
* UI state
* navigation integration

Presentation must not:

```text
import nostr-tools
```

Presentation must not directly:

* open WebSockets
* sign Nostr events
* access Keychain
* access MMKV
* upload to Blossom
* communicate with relays

Use application-level APIs/use cases.

---

# 11. SOLID Rules

Apply SOLID pragmatically.

### SRP

Each use case should have one clear responsibility.

### OCP

Adding another relay/media/signing implementation should not require rewriting feature logic.

### LSP

Implementations of the same port must preserve the contract.

### ISP

Prefer small focused interfaces.

For example:

```text
IPostRepository
IStoryRepository
ISigner
IMediaUploader
IRelayTransport
```

Do not create one giant repository interface.

### DIP

Application depends on abstractions.

Infrastructure depends on those abstractions.

---

# 12. Nostr Protocol Strategy

Nostr is not merely an external API.

It is the **core data transport and identity protocol of the application**.

Use Nostr standards according to their actual purpose.

Before implementation:

> Check the current official Nostr NIPs repository/specifications and verify that the proposed implementation still matches the current specification.

Do not assume this prompt is permanently up to date.

Use only NIPs that are actually relevant.

Do NOT implement a NIP merely because it appears in this document.

---

# 13. Nostr NIPs

## NIP-01

Use for:

* event structure
* event IDs
* signatures
* filters
* subscriptions
* relay communication

This is foundational.

---

## NIP-19

Use for user-facing Nostr identifiers:

* npub
* nsec
* note
* nevent
* nprofile
* naddr

Internally, use the appropriate raw representation where technically necessary.

Never expose raw hexadecimal identifiers to normal users when a NIP-19 representation exists.

---

## NIP-68

Investigate and use the appropriate NIP-68 picture-first event model for image-oriented posts if it is still the appropriate current standard.

Do not blindly assume the specification from this prompt is current.

---

## NIP-92

Use `imeta` metadata where appropriate for media attachments.

Include useful metadata such as:

* URL
* MIME type
* dimensions
* blurhash where appropriate
* alt text
* other supported media metadata

Only include metadata that is actually supported by the current specification.

---

## NIP-94

Use only if there is a concrete use case requiring file metadata events.

Do not add it unnecessarily.

---

## Blossom

Prefer Blossom-compatible media storage when appropriate.

The image upload architecture must be abstracted:

```text
IMediaUploader
      │
      ├── BlossomUploader
      │
      └── Nip96Uploader
```

The feature layer must not know which media protocol is being used.

---

## NIP-96

Support as an alternative/compatible media upload strategy where appropriate.

Do not assume every server supports every NIP.

---

## NIP-98

Use for HTTP authentication to media servers where required.

Signing must remain behind the signer abstraction.

---

## NIP-46

Support Nostr Connect / bunker authentication.

This allows users to connect an external signer without exposing their private key to the application.

Support:

* bunker URI
* deep links
* QR-based connection where appropriate
* remote signing
* connection persistence

NIP-46 should be one of the primary methods for experienced Nostr users.

---

## Local Identity

For users who do not already have a Nostr identity:

Generate a new keypair locally.

Private keys must NEVER be stored as plain text in:

* AsyncStorage
* MMKV
* logs
* analytics
* Redux/Zustand persistence
* files

Use secure platform storage.

Prefer:

```text
React Native Keychain
        +
platform secure storage
        +
biometric protection where available
```

---

# 14. Nsec Import

Allow advanced users to import an existing nsec.

But:

* never log it
* never send it to a server
* never persist it in plaintext
* never expose it in analytics
* never place it into crash reports
* clear temporary memory/reference when practical

Display a strong security warning before import.

---

# 15. NIP-05

NIP-05 is NOT authentication.

Use it only for:

* identity discovery
* verification display
* profile presentation

Never treat a NIP-05 identifier as proof that a user controls an account unless the appropriate cryptographic verification succeeds.

---

# 16. NIP-65

Support relay list metadata where useful.

Use it to support:

* read relays
* write relays
* future outbox/inbox-style routing
* user-specific relay configuration

The relay architecture must already support this even if V1 exposes only a minimal relay UI.

---

# 17. Social Features

Use appropriate Nostr standards for:

### Following

Use the appropriate contact-list mechanism according to the current Nostr specifications.

### Reactions

Use NIP-25 where appropriate.

### Comments

Use the current appropriate comment/threading standard.

Do not blindly force NIP-22 or NIP-10.

Check the current specifications and choose the correct model for the implemented feature.

---

# 18. Stories

Stories are special.

A story should have:

```text
createdAt
expiresAt
author
media
caption
```

Use the appropriate Nostr expiration mechanism where supported.

The application must treat expiration as a **client-side visibility rule**.

Important:

```text
Story expired
≠
Relay deleted the event
```

Never assume that a relay actually deletes expired content.

The client must never display a story where:

```text
expiresAt <= currentTime
```

even if the relay still returns it.

Relay-side deletion is optional and must never be relied upon.

---

# 19. Feed Architecture

The feed must aggregate events from multiple relays.

Example:

```text
Relay A ─┐
Relay B ─┼──> RelayPool ──> Event Aggregator ──> Feed Repository
Relay C ─┘
```

The feed must not depend on a single relay.

If:

```text
Relay A = unavailable
Relay B = available
Relay C = slow
```

the application should still produce useful results.

---

# 20. Event Deduplication

The same Nostr event may arrive from multiple relays.

For example:

```text
Relay A → event abc
Relay B → event abc
Relay C → event abc
```

The UI must display it only once.

Deduplicate using event identity.

Deduplication should happen below the presentation layer.

Do not implement relay-specific deduplication separately inside every feature.

---

# 21. RelayPool

Create a central RelayPool abstraction.

RelayPool is responsible for:

* relay connections
* connection lifecycle
* reconnect
* subscriptions
* publishing
* timeouts
* relay failures
* event deduplication
* EOSE handling
* CLOSED handling
* NOTICE handling
* AUTH handling where required
* relay health
* subscription cleanup
* concurrent relay requests
* publish fan-out

Feature code must not know WebSocket implementation details.

---

# 22. Relay Failure Isolation

One broken relay must never crash the application.

For example:

```text
Relay A → timeout
Relay B → success
Relay C → connection refused
```

The application should still return data from Relay B.

Do not make relay communication fail-fast across the entire pool unless the specific operation genuinely requires it.

---

# 23. Publishing Events

Publishing should support multiple relays.

Example:

```text
Publish Event
      │
      ├── Relay A
      ├── Relay B
      └── Relay C
```

The application should track relay-level publish results.

Do not assume:

```text
one successful relay = all relays accepted event
```

The UI should be able to represent partial success when useful.

---

# 24. Event Validation

Incoming events must be validated.

Validate as appropriate:

* event structure
* event ID
* signature
* required tags
* kind
* timestamps
* expiration
* content structure

Never blindly trust relay data.

Invalid events should be rejected safely.

---

# 25. Media Upload Flow

Image publishing should follow this general flow:

```text
User selects image
        ↓
Validate image
        ↓
Optional local processing/compression
        ↓
Upload media
        ↓
Receive media URL + metadata
        ↓
Create Nostr event
        ↓
Sign event
        ↓
Publish event to relay pool
        ↓
Update local cache/UI
```

Do not publish an event pointing to a media file that was never successfully uploaded.

If upload fails:

```text
Do not publish the post.
```

If publishing partially succeeds:

```text
Do not automatically assume failure.
```

Represent the actual state.

---

# 26. Image Handling

V1 supports:

* JPEG
* PNG
* WebP where supported

Validate:

* MIME type
* file size
* dimensions

Do not add video processing.

Do not add carousel support.

Architecture may support future media types, but V1 implementation must remain image-only.

---

# 27. Offline / Network Resilience

This is a mobile application.

The application must gracefully handle:

* no internet
* unstable internet
* relay disconnects
* reconnects
* slow relays
* partial relay availability
* duplicate events
* stale cache
* app backgrounding
* app foregrounding

The UI should not become unusable merely because a relay is temporarily unavailable.

Use local cache appropriately.

Do not pretend cached data is fresh.

Represent stale/loading/error states clearly.

---

# 28. Caching

Use:

### TanStack Query

For server/relay-derived asynchronous data.

### Zustand

For application/UI state that should not be treated as remote server state.

### MMKV

For persistent local cache where appropriate.

Do not duplicate the same state unnecessarily across:

```text
TanStack Query
Zustand
MMKV
```

Every piece of state should have one clear owner.

---

# 29. Security

Security is critical because the application manages Nostr identities.

Never:

* log private keys
* log nsec
* send private keys anywhere
* store nsec in plaintext
* put secrets into analytics
* include secrets in errors
* include secrets in crash reports

Private key access should be isolated behind an abstraction.

For external signing:

```text
Application
    ↓
ISigner
    ↓
LocalSigner OR NIP46Signer
```

The application should not care which signer implementation is used.

---

# 30. Authentication UX

Provide three identity paths.

### New user

```text
Create new identity
        ↓
Generate keypair locally
        ↓
Securely store private key
        ↓
Create profile
```

### Existing Nostr user

```text
Connect existing signer
        ↓
NIP-46
        ↓
External signer
```

### Advanced user

```text
Import nsec
        ↓
Security warning
        ↓
Secure storage
```

NIP-05 must not be used as authentication.

---

# 31. Navigation

V1 navigation should be simple.

Suggested structure:

```text
Home / Feed
Stories
Create
Profile
Settings
```

Do not create complex navigation architecture before it is necessary.

---

# 32. Design System & UX Rules

The UI must not default to generic "AI-generated app" aesthetics (default gradients,
generic icon packs, default shadcn/Material spacing, indistinct typography). Every
visual decision below is a hard constraint, not a suggestion.

## 32.1 Visual Direction

Do not copy Instagram's UI or branding. Aim for an editorial, quiet, confident
feel rather than a busy consumer-social look — closer in spirit to the restraint
of Are.na or early Threads than to Instagram's density. Prioritize:

* generous whitespace over dense information packing
* one accent color used sparingly, not decoratively everywhere
* content (the image) as the visual hero — chrome/UI should recede

## 32.2 Color System

* Full dark mode is mandatory (not optional/"nice to have") — Nostr's user base
  skews toward dark-mode-first usage.
* Define an explicit token set, not ad-hoc hex values scattered in components:

```text
color.background.primary
color.background.secondary
color.background.elevated
color.text.primary
color.text.secondary
color.text.disabled
color.border.default
color.accent.primary
color.accent.onAccent
color.state.error
color.state.success
color.state.warning
```

* Choose ONE accent color for the brand (not a gradient system) and derive
  light/dark variants from it programmatically, not by hand-picking per screen.
* Maintain WCAG AA contrast minimums for text/background pairs in both themes.
* Never hardcode a color literal directly in a component — always reference a token.

## 32.3 Typography

* Define an explicit type scale (do not let each screen invent its own sizes):

```text
display   32/40  bold
title     24/32  semibold
heading   18/24  semibold
body      16/22  regular
caption   13/18  regular
label     12/16  medium (uppercase tracking for section labels only)
```

* One font family for UI text, at most one secondary/display face if truly
  justified — never more than two typefaces in the app.
* Line-height and letter-spacing are part of the token, not left to default.

## 32.4 Spacing & Layout

* Use an 8pt base grid: all padding/margin/gap values must be multiples of 4
  (4, 8, 12, 16, 24, 32, 48...). No arbitrary values like 13px or 22px.
* Define consistent screen-edge padding (e.g. 16pt) applied uniformly across
  all screens — feed, profile, settings, create-post must share the same
  horizontal rhythm.
* Corner radius is tokenized too (e.g. sm=8, md=12, lg=20, full=9999) —
  not a different radius per component.

## 32.5 Image & Media Rules

* Feed images: preserve original aspect ratio within sane bounds (e.g. clamp
  between 4:5 and 1.91:1) rather than force-cropping to a fixed square like
  Instagram — this is a deliberate differentiator, not an oversight.
* Always reserve layout space for an image before it loads using its known
  aspect ratio (from imeta/NIP-92 metadata) to prevent layout shift.
* Story ring: a subtle single-color or two-stop gradient ring for "has unseen
  story," a neutral/gray ring for "seen" — do not use Instagram's exact
  rainbow gradient.

## 32.6 State Rendering (per screen — this is not optional polish)

Every data-driven screen (feed, stories, profile) must explicitly design for
all of the following states, not just the "happy path":

```text
loading (first load)      → skeleton placeholders matching final content shape,
                             never a bare spinner for content lists
loading (pagination)      → small inline spinner at list end, not a full-screen block
refreshing (pull-to-refresh) → native platform refresh indicator
empty                     → illustration/short copy + a clear next action
                             (e.g. empty feed → "Follow people to see posts")
error (recoverable)       → inline message + retry action, content already
                             on screen must not be wiped out by a transient error
error (fatal)             → full-screen state with retry
offline                   → a persistent, unobtrusive banner/indicator, not a
                             blocking modal — cached content stays visible and
                             is visually marked as possibly stale
partial relay failure     → content still renders; do not show a global error
                             just because one of several relays failed
upload in progress        → progress indicator on the post being created;
                             publish action is disabled until upload completes
upload failed             → clear inline error on the specific item, with retry,
                             never a silent failure
```

Skeleton loaders (not spinners) are the default for any list/grid of content.
Spinners are reserved for short, deterministic actions (button press feedback,
final publish step).

## 32.7 Motion & Micro-interactions

* Keep animation durations short and consistent: 150–200ms for micro-interactions
  (like button, tab switch), 250–300ms for screen-level transitions. Do not mix
  arbitrary durations across components.
* Use a single easing curve system-wide (e.g. ease-out for entrances, ease-in
  for exits) rather than choosing ad hoc per component.
* Like action: an immediate optimistic local animation (subtle scale/opacity),
  reconciled silently if the relay publish later fails (see optimistic UI
  rollback rule in section 27/Social).
* Story viewer: deliberate progress-bar-per-story pacing and transition,
  since this is a signature interaction pattern users will expect to feel smooth.
* Do not add decorative animation with no functional purpose (no bouncing icons,
  no gratuitous confetti).

## 32.8 Componentization

* Build a small shared component library in `shared/components` before feature
  screens (Button, Avatar, Skeleton, EmptyState, ErrorState, Badge, etc.) —
  features must compose these rather than each screen re-implementing basics.
* Every shared component must expose its variants through explicit props
  (e.g. `variant: "primary" | "secondary" | "ghost"`), not through ad hoc
  style overrides passed in from call sites.

## 32.9 Definition of Done for UI work

A screen is not "done" until:

* it uses only design tokens (no raw hex colors, no raw arbitrary spacing)
* all states in 32.6 that apply to it are implemented, not just the happy path
* dark mode has been visually verified, not just "should work"
* it matches the spacing/typography scale, not approximate values

The application name and visual identity should be simple and memorable.

---

# 33. Performance

Mobile performance matters.

Avoid:

* unnecessary re-renders
* huge in-memory event lists
* unnecessary WebSocket connections
* duplicate subscriptions
* excessive JSON parsing
* unnecessary state synchronization
* rendering hundreds of images at once

Use:

* pagination / incremental loading where appropriate
* virtualization
* image caching
* subscription lifecycle management
* memoization only where it provides real value

Do not prematurely optimize without evidence.

---

# 34. Testing (Strict Quality Bar)

Domain and application layers must be highly testable without React Native.

**Hard rule: every production use case and every critical infrastructure component must have meaningful tests. Do not create placeholder tests, trivial `expect(true).toBe(true)` tests, or tests that only verify a mock was called without validating actual behavior/output/state. A test that would still pass if the implementation were deleted and replaced with a no-op is not acceptable.**

### Domain tests

Story:

```text
story expires after 24h
expired story is not visible
future story is visible
invalid expiration is rejected
```

Post / ImageAttachment:

```text
valid image attachment
invalid MIME type
invalid dimensions
invalid metadata
```

Identity:

```text
valid public key
invalid public key
identity equality
```

### Application tests (use cases, with fake infrastructure)

Example — `PublishImagePostUseCase`:

```text
upload succeeds → event is created
upload fails → event is NOT published
signing fails → publish does NOT happen
relay publish partially succeeds → correct result reported
relay publish completely fails → correct error reported
```

Use fakes/stubs behind ports (`IMediaUploader`, `IPostRepository`, `ISigner`) — never real network/relay calls in unit tests.

### RelayPool tests

```text
one relay fails → other relay still works
same event received from 3 relays → deduplicated to one event
relay reconnects → subscription restored
relay timeout → does not block the entire pool
EOSE handled correctly
CLOSED handled correctly
NOTICE handled correctly
AUTH challenge handled correctly
```

### Security tests

```text
private key is never logged
nsec is never logged
private key is never persisted in MMKV
private key never appears in error objects/messages
```

### Mapper / repository tests

```text
Nostr event → domain entity (correct mapping, missing/invalid fields handled)
domain intent → Nostr event (correct kind/tags/content produced)
```

Test both directions independently.

### Presentation tests

Test observable user-facing behavior, not implementation details:

```text
feed shows loading state
feed shows cached data
feed shows error state
feed renders posts
expired story is not rendered
publish button disabled while uploading
upload failure is displayed to the user
```

### Test isolation principle

A use case like `PublishImagePostUseCase` must be testable with:

```text
PublishImagePostUseCase
        │
   IMediaUploader → FakeUploader
        │
   IPostRepository → FakeRepository
```

so tests remain fast, deterministic, and fully offline. Real Nostr/relay/media integration is validated separately in integration tests, not in unit tests.

Infrastructure should have focused integration tests where practical.

---

# 35. Error Handling

Do not throw generic errors everywhere.

Use meaningful error types.

Examples:

```text
RelayConnectionError
RelayTimeoutError
EventValidationError
SignatureVerificationError
MediaUploadError
AuthenticationError
SignerUnavailableError
IdentityImportError
StoryExpiredError
```

Errors must not contain secrets.

---

# 36. Result Pattern

Use a simple Result type where it improves explicit error handling.

Example:

```text
Result<T, E>
```

Do not force Result everywhere.

Use normal exceptions where appropriate for infrastructure failures.

The goal is explicit, understandable error handling.

---

# 37. Dependency Injection

Use lightweight constructor injection.

A custom/simple DI composition root is preferred.

Do NOT introduce a large dependency injection framework unless there is a concrete requirement.

Composition should happen in:

```text
src/app/di/
```

Dependencies should be wired there.

---

# 38. No Global God Services

Do not create things like:

```text
AppService
SocialService
NostrService
DataService
Manager
UtilityManager
```

that contain unrelated responsibilities.

Prefer focused components:

```text
RelayPool
EventPublisher
EventValidator
Signer
MediaUploader
PostRepository
StoryRepository
```

---

# 39. No Generic Repository Abuse

Do not create:

```text
IRepository<T>
GenericRepository<T>
BaseRepository<T>
```

unless there is a real domain requirement.

Repositories should model actual domain/application needs.

---

# 40. No Premature Event Bus

Do not introduce an event bus merely because DDD often uses domain events.

Use domain events only if there is a concrete business requirement.

Do not create a global event-driven architecture for simple UI state changes.

---

# 41. No Premature Microservices

There is no backend.

Do not create:

* Node.js backend
* NestJS backend
* REST API
* GraphQL API
* database server
* Redis server
* message queue

unless explicitly requested in a future phase.

---

# 42. Relay Configuration

Start with two public relays.

Choose currently healthy/popular relays based on current Nostr ecosystem information.

Do not hard-code relay assumptions deep inside feature code.

Use configuration:

```text
DEFAULT_RELAYS
```

and a RelayPool.

The application should later be able to add:

```text
user relay
custom relay
private relay
self-hosted relay
```

without modifying feature logic.

---

# 43. Future Own Relay

Eventually the application may operate its own relay.

The architecture must make this possible.

Adding the relay should primarily require:

```text
configuration
+
relay availability
```

not rewriting:

```text
feed
stories
profiles
social features
```

---

# 44. Nostr Data Model

Do not create a second artificial backend-style data model that duplicates all Nostr data.

Use domain models for business meaning.

Map:

```text
Nostr Event
      ↓
Domain Entity
```

and:

```text
Domain Intent
      ↓
Nostr Event
```

through explicit mappers/factories.

---

# 45. Protocol Leakage Rule

The following must NOT appear in domain code:

```text
kind
pubkey
sig
created_at
tags
relay URL
WebSocket
nostr-tools
```

unless a concept genuinely belongs to the domain abstraction.

Nostr protocol representation should stay at infrastructure boundaries.

---

# 46. Feature Independence

A feature should not directly import another feature's infrastructure.

For example:

```text
feed → infrastructure/nostr
```

is not acceptable.

Instead:

```text
feed application
       ↓
port
       ↓
infrastructure implementation
```

Cross-feature communication should happen through clearly defined application/domain contracts.

---

# 47. Logging

Create a structured logger.

Logging must support development debugging but must never expose:

* private keys
* nsec
* authentication secrets
* tokens
* sensitive personal data

Relay logs should be useful for diagnosing:

* connection
* subscription
* publish
* errors
* latency

without leaking secrets.

---

# 48. Observability

V1 does not need a remote analytics platform.

However, development logging should make it possible to understand:

```text
relay connection state
relay latency
publish success/failure
subscription lifecycle
cache state
media upload state
```

Keep this replaceable.

---

# 49. App Lifecycle

React Native app lifecycle must be considered.

When the app:

```text
backgrounds
```

manage subscriptions/connections appropriately.

When the app:

```text
returns to foreground
```

revalidate stale data and restore required relay subscriptions.

Do not leave unnecessary WebSocket subscriptions running indefinitely.

---

# 50. Deep Links

Prepare architecture for:

* NIP-46 bunker URLs
* nprofile
* nevent
* note
* naddr

Use React Native linking/deep-link infrastructure.

Do not implement every possible deep link feature in V1.

---

# 51. Accessibility

The UI must support basic accessibility:

* meaningful labels
* touch target sizes
* readable text
* screen reader compatibility where practical
* sufficient contrast

Do not sacrifice accessibility for visual effects.

---

# 52. Internationalization

V1 may start with one language, but do not hard-code architecture in a way that makes localization impossible.

UI strings should be centralized enough to be replaced later.

Do not build a full i18n framework unless needed.

---

# 53. Code Style

Code must be:

* English
* clear
* explicit
* strongly typed
* consistent

Comments should be rare and useful.

Do not comment obvious code.

Explain:

* why a non-obvious decision exists
* protocol edge cases
* security constraints
* architectural boundaries

Do not write comments like:

```text
// Create user
createUser()
```

---

# 54. TypeScript

Use strict TypeScript.

Avoid:

```text
any
```

unless there is a documented and unavoidable reason.

Prefer:

* discriminated unions
* type guards
* readonly types where useful
* explicit domain types
* exhaustive handling

Do not over-type trivial code.

---

# 55. Development Workflow

You must work incrementally.

Before writing code for each phase:

1. Inspect the current project.
2. Inspect existing files.
3. Check relevant current Nostr specifications.
4. Identify architectural boundaries.
5. Explain the plan briefly.
6. List files that will be created/modified.
7. Implement only the current phase.
8. Run type checking.
9. Run tests.
10. Fix issues.
11. Stop.

**Do not continue to the next phase automatically.**

Wait for approval before proceeding.

---

# 56. Minimal Changes Rule

When modifying existing code:

* do not rewrite unrelated files
* do not rename things unnecessarily
* do not introduce unrelated refactors
* do not change styling without reason
* do not replace working architecture without justification

Preserve existing behavior unless the current phase explicitly changes it.

---

# 57. Architecture Decision Rule

When there is ambiguity:

1. Prefer the current Nostr specification.
2. Prefer the simplest correct implementation.
3. Prefer established React Native patterns.
4. Prefer secure defaults.
5. Prefer replaceable infrastructure.
6. Avoid speculative abstractions.

If an important decision is ambiguous:

```text
Decision:
Reason:
Trade-off:
```

briefly explain it before implementation.

Do not stop merely because a minor detail is ambiguous.

Make a reasonable assumption and proceed.

---

# 58. Current Nostr Specification Rule

This prompt intentionally does NOT override the official Nostr specifications.

Before implementing protocol-specific behavior:

* inspect the current NIP specification
* verify event kinds
* verify tags
* verify relay behavior
* verify media protocol behavior
* verify signer behavior

If the current specification differs from this prompt:

> Follow the current specification and briefly explain the discrepancy.

Never implement an outdated NIP definition simply because this prompt says so.

---

# 59. Implementation Phases

## Phase 0 — Foundation

Implement:

* React Native CLI project
* TypeScript strict configuration
* project structure
* core Result/error system
* lightweight DI
* logger
* NostrGateway abstraction
* RelayPool foundation
* event validation
* event signing abstraction
* basic configuration
* test infrastructure
* design tokens (color, typography, spacing) as defined in Section 32,
  wired into a theme provider — before any feature screen is built

Do NOT implement feed/story UI yet.

Stop after Phase 0.

---

# Phase 1 — Identity / Authentication

Implement:

* local key generation
* secure Keychain storage
* identity model
* nsec import
* NIP-19 encoding/decoding
* local signer
* NIP-46 signer abstraction
* bunker connection
* deep-link foundation
* authentication UI (following Section 32 states/tokens)
* logout
* identity restoration

Stop after Phase 1.

---

# Phase 2 — Profiles

Implement:

* kind:0 profile metadata where appropriate
* display name
* username
* avatar
* bio
* NIP-05 display/verification
* profile cache

Stop after Phase 2.

---

# Phase 3 — Media Upload

Implement:

* image selection
* image validation
* image metadata
* media uploader abstraction
* Blossom integration
* NIP-96 integration if appropriate
* NIP-98 authentication where required
* upload progress
* upload error handling

Stop after Phase 3.

---

# Phase 4 — Image Feed

Implement:

* image post domain model
* appropriate Nostr picture/image event model
* media metadata
* feed repository
* multi-relay feed aggregation
* event validation
* event deduplication
* pagination/incremental loading
* local caching
* feed UI (skeletons, empty/error/offline states per Section 32.6)
* create post UI

Stop after Phase 4.

---

# Phase 5 — Social Interactions

Implement:

* follow
* unfollow
* reactions
* likes
* comments
* optimistic UI where safe
* event reconciliation

Stop after Phase 5.

---

# Phase 6 — Stories

Implement:

* story domain model
* story publishing
* expiration timestamp
* client-side expiration enforcement
* story aggregation
* story cache
* story ring UI
* story viewer
* story creation
* expiration cleanup

Remember:

```text
expired story != deleted relay event
```

Never rely on relay-side deletion.

Stop after Phase 6.

---

# Phase 7 — Relay Management

Implement:

* NIP-65 support
* user relay preferences
* read/write relay distinction
* relay health
* relay configuration
* relay UI where appropriate

Stop after Phase 7.

---

# Phase 8 — Hardening

Review the complete application for:

* security
* performance
* memory usage
* subscription leaks
* duplicate WebSockets
* duplicate events
* stale cache
* offline behavior
* error handling
* accessibility
* architecture violations
* dependency bloat
* unnecessary abstractions
* type safety
* test coverage
* design token compliance (no raw colors/spacing left in components)

Do not add features.

This phase is for stabilization.

---

# 60. Definition of Done

A phase is complete only when:

* code compiles
* TypeScript passes
* tests pass
* every use case and critical infrastructure component in this phase has meaningful, behavior-verifying tests (no placeholder/trivial tests)
* no obvious architecture violations exist
* no private key leaks exist
* no unnecessary dependency was introduced
* feature works through its intended abstraction boundaries
* relay failures do not crash the app
* relevant Nostr behavior follows the current specification
* any UI shipped in this phase satisfies Section 32.9 (tokens used, all
  applicable states implemented, dark mode verified)

---

# 61. Final Architectural Constraint

The application must preserve this dependency direction:

```text
                 ┌──────────────────────┐
                 │     Presentation     │
                 └──────────┬───────────┘
                            │
                            ▼
                 ┌──────────────────────┐
                 │     Application      │
                 └──────────┬───────────┘
                            │
                            ▼
                 ┌──────────────────────┐
                 │        Domain        │
                 └──────────────────────┘

                 Infrastructure
                       │
                       ▼
                 implements
                    ports
```

Infrastructure details must never leak upward.

The UI must never become coupled to Nostr implementation details.

---

# 62. Most Important Rule

Build a **real application**, not an architecture showcase.

If a simple solution is correct, use the simple solution.

If a boundary is important, protect it.

If an abstraction has no current value, do not create it.

If a Nostr protocol detail is complex, isolate it.

If a feature does not need a framework, do not introduce one.

The final result should feel like it was designed by an experienced mobile/backend architect who understands both **Nostr's decentralized model** and **React Native's practical constraints**, and by a product designer who cares about restraint and detail rather than decoration.

Start with **Phase 0 only**.

Before writing code, inspect the project and present the Phase 0 implementation plan and files that will be affected.
Then wait for approval.