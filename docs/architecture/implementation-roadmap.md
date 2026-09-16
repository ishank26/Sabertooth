# Sabertooth Personal implementation roadmap

This roadmap replaces the earlier server-first self-host plan with a local-first product direction. The primary deliverable is an installable iPhone PWA that runs workouts offline, stores data locally, and does not require an account, subscription, hosted database, analytics service, AWS infrastructure, or Liftosaur production service.

The earlier subscription-removal and MCP work remains useful reference code, but it is no longer on the critical path for the personal app.

See [local-first-architecture.md](./local-first-architecture.md) for the target architecture and dependency rules.

## Execution principles

- Build for one primary user and one primary device class first: iPhone/Safari/PWA.
- Keep the base app fully usable without a backend.
- Prefer pure domain modules and browser APIs over network services and service SDKs.
- Reuse valuable Liftosaur AGPL code where it lowers risk, especially Liftoscript/program logic and exercise definitions.
- Do not drag account, sync, billing, analytics, AWS, or SaaS infrastructure into the Personal build simply because it exists upstream.
- Preserve AGPL-3.0 licensing and upstream attribution for reused code.
- Keep master buildable after each phase.
- One focused branch/PR per phase or sub-phase.
- MCP is optional and comes after the local app is already useful.

## Critical path

1. Phase 1 — isolate reusable workout core
2. Phase 2 — create the Personal PWA shell
3. Phase 3 — implement workout execution and the canonical four-day program
4. Phase 4 — local persistence, backup, and migration
5. Phase 5 — iPhone install/offline validation
6. Phase 6 — remove unintended network/server dependencies from the Personal build

After the MVP is stable:

7. Phase 7 — optional MCP bridge
8. Phase 8 — hardening, release/update flow, and optional native-app evaluation

---

# Phase 1 — Extract the reusable workout core

## Goal

Create a small, browser-safe domain layer containing only the Liftosaur logic we actually need for a personal workout tracker.

The result should be usable without React Native, AWS, account state, sync, payments, telemetry, or network access.

## Implementation tasks

### 1.1 Identify the minimum reusable modules

Trace and classify code for:

- Liftoscript parsing and validation
- program/day/exercise representation
- set/rep definitions
- progression rules
- warmup behavior needed by the program
- timers/rest durations
- exercise definitions/equipment metadata
- custom exercises
- workout completion/history records
- weight/unit helpers
- statistics needed for Progress

For every imported module, record whether it pulls in:

- service/API clients
- account/user state
- React Native APIs
- telemetry
- subscriptions
- platform bridges
- AWS/server types

The extraction rule is strict: domain code may depend on domain utilities, not app infrastructure.

### 1.2 Create a Personal domain boundary

Create a folder such as:

```text
src/personal/core/
  program/
  workout/
  progression/
  exercises/
  history/
  units/
  import/
```

Where practical, re-export existing pure Liftosaur modules instead of copying them. If an upstream module is nearly pure but imports infrastructure, split the pure part from the integration part.

### 1.3 Define the Personal storage contract

Add a versioned local model independent of Liftosaur account/sync structures:

```ts
interface PersonalStore {
  schemaVersion: number;
  profile: PersonalProfile;
  programs: PersonalProgram[];
  activeProgramId?: string;
  customExercises: PersonalExercise[];
  history: PersonalWorkoutRecord[];
  measurements: PersonalMeasurement[];
  settings: PersonalSettings;
}
```

Use stable local IDs only. Do not require server IDs or account IDs.

### 1.4 Define adapters instead of hard dependencies

Create small interfaces for capabilities that the UI needs:

```ts
interface PersonalRepository {
  load(): Promise<PersonalStore>;
  save(store: PersonalStore): Promise<void>;
}

interface TechniqueLinkProvider {
  getLinks(exerciseId: string): TechniqueLink[];
}
```

The core must not know whether data lives in IndexedDB, memory, a JSON file, or a future sync bridge.

### 1.5 Build deterministic tests

Add fixtures for:

- parsing a simple four-day program
- custom exercise resolution
- progression decisions
- workout completion
- history serialization
- migration of schemaVersion 1 -> future versions

Avoid real personal data in committed fixtures.

## Deliverables

- `src/personal/core/*`
- pure domain tests
- architecture note documenting retained Liftosaur modules and excluded infrastructure
- dependency graph or import-check script preventing server/native-only imports into `src/personal/core`

## Acceptance criteria

- Personal core tests run in Node without React Native or AWS initialization.
- No network access is needed to parse a program, start a workout, complete sets, progress loads, or serialize history.
- The canonical four-day program can be represented without unknown exercises.
- Core imports do not pull account, subscription, telemetry, or server modules.

## Suggested branch

`rewrite/personal-core`

---

# Phase 2 — Build the Sabertooth Personal PWA shell

## Goal

Create a lightweight installable web app specifically for iPhone use, using the Personal core from Phase 1.

## Product scope

Primary navigation:

- Today
- Program
- History
- Progress
- Exercises
- Settings

No login screen, account screen, subscription screen, social/community features, admin tooling, or cloud-sync UI.

## Implementation tasks

### 2.1 Create an isolated Personal entrypoint

Prefer a separate entrypoint/build target instead of trying to make the full Liftosaur app conditionally hide features.

Example:

```text
src/personal/
  app.tsx
  routes/
  screens/
  components/
  core/
  storage/
  pwa/
```

Add a build command such as:

```bash
npm run personal:build
npm run personal:start
```

### 2.2 Set a dependency budget

The Personal app should reuse existing frontend dependencies only when they materially reduce implementation risk.

Do not add runtime service SDKs.

Prefer:

- React/ReactDOM already present in the repository
- TypeScript
- browser APIs
- existing small UI primitives where they are web-safe

Avoid adding:

- Firebase/Supabase SDKs
- analytics SDKs
- auth SDKs
- cloud storage SDKs
- payment SDKs
- state-management frameworks unless existing code makes them unavoidable

### 2.3 Implement mobile-first layout

Design for one-handed gym use:

- large touch targets
- high-contrast set controls
- fixed bottom navigation
- readable in portrait orientation
- no hover-only interactions
- minimal typing during a workout
- weight/reps controls usable with sweaty hands

### 2.4 Add PWA metadata

Create a Sabertooth Personal manifest with:

- standalone display mode
- portrait orientation preference
- Sabertooth name/short name
- theme/background colors
- icons owned by the fork
- appropriate start URL

### 2.5 Add an app-shell service worker

Cache only what the base app needs offline:

- generated JS/CSS
- manifest/icons
- local static exercise metadata/assets

Use explicit cache versioning and upgrade behavior.

Do not cache third-party video pages.

## Deliverables

- installable Personal web app
- mobile navigation shell
- PWA manifest/icons
- service worker
- offline app-shell test

## Acceptance criteria

- App opens at a dedicated Personal route/build.
- No login or backend is required.
- Browser devtools can switch offline after first load and the app shell still opens.
- The Personal bundle contains no AWS, billing, account, or analytics runtime initialization.

## Suggested branch

`rewrite/personal-pwa-shell`

---

# Phase 3 — Workout execution + canonical four-day program

## Goal

Make the PWA useful for actual training before adding broader features.

The first release should be optimized around the existing four-day Monday/Tuesday/Thursday/Saturday program rather than recreating every generic Liftosaur feature.

## Canonical program to preload

### Day 1 — Lower A

- 2 min incline walk/bike
- Knee-to-Wall Ankle Rock — 8/side
- 90/90 Hip Switch — 6/side
- KB Prying Goblet Squat — 2x5
- Broad Jump / low box jump — 3x3
- Back Squat — 3x5
- KB Single-Leg RDL — 3x8/side
- KB Reverse Lunge — 2x8/side
- KB Suitcase Carry — 2x20–30m/side
- 90/90 + ankle cooldown

### Day 2 — Upper A

- 2 min row
- Open Book — 6/side
- Band Pull-Apart — 15
- KB Halo — 5/direction
- Scap Push-Up — 8
- Bench Press — 3x5
- Chest-Supported DB Row — 3x8
- Half-Kneeling Single-Arm KB Press — 2x8/side
- Lat Pulldown / Assisted Pull-Up — 2x8–10
- Face Pull — 2x12–15

### Day 3 — Lower B

- 2 min walk/bike
- Glute Bridge — 10
- Hip Hinge Drill — 8
- Adductor Rock-Back — 6/side
- Light KB Deadlift — 8
- Lateral Shuffle / deceleration block
- Conventional Deadlift — 3x4
- KB Goblet Squat — 3x8
- Two-Hand KB Swing — 3x10
- Dead Bug — 2x6–8/side
- 90/90 + ankle cooldown

### Day 4 — Upper B

- 2 min row
- Wall Slide — 8
- KB Halo — 5/direction
- Band Pull-Apart — 15
- unloaded/extremely light Turkish Get-Up — 1/side
- Single-Arm KB OHP — 3x6–8/side
- Assisted Pull-Up / Lat Pulldown — 3x6–8
- Paused Bench Press — 2x6–8
- Single-Arm KB Row — 2x10/side
- Bottoms-Up KB Carry — 2x15–20m/side

### 3.1 Create all required exercise definitions

Do not substitute movements merely because upstream does not contain them.

Add Personal custom exercise definitions where needed, including:

- Broad Jump
- Knee-to-Wall Ankle Rock
- 90/90 Hip Switch
- KB Prying Goblet Squat if distinct behavior is useful
- Open Book Thoracic Rotation
- Band Pull-Apart
- KB Halo
- Scap Push-Up
- Hip Hinge Drill
- Adductor Rock-Back
- Lateral Shuffle
- Dead Bug
- Wall Slide
- KB Suitcase Carry
- Bottoms-Up KB Carry

### 3.2 Implement the Today screen

Today should show:

- current scheduled workout
- estimated duration
- warm-up section
- work-set section
- cooldown
- `Start Workout`

Allow manual choice of another day in case the schedule changes.

### 3.3 Implement workout mode

For each exercise show only the information needed now:

- exercise name
- short cue
- sets/reps/duration/distance
- working weight where applicable
- RPE entry for tracked work sets
- previous-session result
- technique link button
- set complete button
- rest timer

### 3.4 Handle unilateral and non-rep exercises correctly

Support set schemas for:

- reps
- reps per side
- timed intervals
- distance carries
- simple completion-only mobility drills

Do not force carries or mobility into fake rep counts merely to match old Liftosaur schemas.

### 3.5 Implement progression

Encode the program's progression rules:

- barbell compounds: progress when all reps are clean and final set is approximately RPE 8 or easier
- squat/deadlift default increment: +5 lb
- bench: +2.5 lb total when available; otherwise repeat/build before +5 lb
- KB double progression for ranges such as 6–8 or 8–10
- missed prescribed reps twice: reduce load approximately 7.5–10%
- deload weeks can be represented as program metadata instead of hidden automatic behavior

Allow all recommendations to be overridden manually.

### 3.6 Add technique links

Technique links are online enhancements only.

Store links in local static metadata and display them only when network is available. Workout execution must remain fully functional without them.

## Tests / validation

- all four workouts can be started/completed offline
- unilateral sets persist side-specific completion where relevant
- timers continue sensibly across screen changes
- a completed workout creates one history record
- progression suggestion uses the correct prior-session data
- no duplicate workout is created on accidental reload/reopen

## Acceptance criteria

A real gym session can be completed entirely from the PWA without opening Liftosaur, editing Liftoscript manually, or using an internet connection.

## Suggested branch

`rewrite/personal-workout-mvp`

---

# Phase 4 — Local persistence, backup, restore, and Liftosaur migration

## Goal

Make local data durable and portable so the app can be trusted without cloud infrastructure.

## Implementation tasks

### 4.1 Implement IndexedDB repository

Create `IndexedDbPersonalRepository` behind the Phase 1 repository interface.

Requirements:

- atomic-enough writes for workout completion
- schema version metadata
- upgrade/migration functions
- no destructive migration without explicit fallback handling
- transaction boundaries around history/program updates

### 4.2 Add autosave during workouts

Persist in-progress workout state after meaningful actions:

- set complete/uncomplete
- reps/weight edits
- exercise substitutions
- RPE edits
- notes

If Safari kills the PWA, reopening should offer to resume.

### 4.3 Add manual JSON backup

Settings should provide:

- Export Backup
- Restore Backup

Backup should contain all durable Personal data and a format version.

Suggested filename:

```text
sabertooth-personal-YYYY-MM-DD.json
```

### 4.4 Add backup validation

Before restore:

- parse JSON
- validate schema/version
- display summary counts
- reject malformed data
- warn that restore replaces/merges data depending chosen mode

Create a safety backup of current state before destructive replacement where browser capabilities permit.

### 4.5 Add Liftosaur JSON migration

Reuse/port upstream import logic only as needed.

Migration should attempt to preserve:

- programs
- history
- custom exercises
- measurements
- settings that map cleanly

Explicitly ignore:

- subscription/payment state
- account/auth tokens
- upstream sync identifiers
- analytics identifiers
- server-only metadata

### 4.6 Add migration fixtures

Commit sanitized fixtures representing supported export structures. Never commit the user's actual production backup.

## Acceptance criteria

- Data survives browser restarts and PWA relaunches.
- An interrupted workout can be resumed.
- Backup -> clear local data -> restore reconstructs equivalent programs/history/settings.
- A supported Liftosaur export can be migrated without importing subscription or account credentials.

## Suggested branch

`rewrite/personal-local-data`

---

# Phase 5 — iPhone installation and offline validation

## Goal

Validate the app as an actual iPhone product rather than assuming desktop-browser behavior translates correctly.

## Implementation tasks

### 5.1 Add explicit installation guidance

A small first-run screen should explain:

1. open in Safari
2. Share
3. Add to Home Screen
4. launch from the new icon

Do not block browser use if the user chooses not to install.

### 5.2 Test iOS PWA lifecycle

Validate:

- first load
- Add to Home Screen
- cold launch
- background/foreground
- force-close and reopen
- airplane mode
- network loss mid-workout
- iOS memory pressure/relaunch behavior
- screen locking during rest timers

### 5.3 Make timers resilient

Do not rely solely on an in-memory decrementing interval.

Persist absolute target timestamps so returning from background computes remaining time correctly.

Use vibration/audio only if reliable and user-initiated under iOS browser policies.

### 5.4 Safe-area and keyboard polish

Handle:

- notch/Dynamic Island safe areas
- bottom home indicator
- virtual keyboard obscuring weight/reps inputs
- landscape fallback even if portrait is preferred

### 5.5 Offline cache upgrades

Implement predictable update flow:

- old cached app continues working until new assets are ready
- new service worker activates cleanly
- local data is never cleared by an app-shell upgrade
- Settings exposes app version/build hash

### 5.6 Device acceptance session

Run at least one full Day 1–4 cycle from an installed iPhone PWA before calling MVP complete.

Log friction points such as excessive taps, input focus problems, timer issues, and unreadable layouts.

## Acceptance criteria

The installed app can run a full workout in airplane mode, survive backgrounding/reopening, preserve progress, and remain comfortable to operate with one hand.

## Suggested branch

`rewrite/personal-ios-pwa`

---

# Phase 6 — Enforce minimal external dependency behavior

## Goal

Prove that the Personal build does not accidentally inherit Liftosaur's SaaS/network behavior.

## Implementation tasks

### 6.1 Build-time dependency guard

Add a script that inspects the Personal import graph or compiled bundle for forbidden infrastructure modules/patterns such as:

- AWS SDK packages
- account/auth modules
- subscription/IAP modules
- Rollbar/analytics/attribution modules
- Liftosaur production API hosts
- MCP/OAuth server modules

Allow upstream attribution URLs in documentation/about text.

### 6.2 Runtime network test

With technique videos disabled/not clicked, run the main flows and assert zero unexpected network calls after the app shell is installed:

- open Today
- start workout
- complete workout
- view History
- edit Program
- export backup

### 6.3 Remove unused Personal-facing SaaS UI

Ensure the Personal entrypoint exposes none of the following:

- account creation/login
- subscription state
- payment screens
- sync errors
- API keys
- cloud backup
- community/social features

This does not require deleting all legacy upstream code from the repository yet; it requires keeping it out of the Personal build.

### 6.4 Bundle-size review

Measure JS/CSS payload and identify unnecessary inherited libraries. Remove or split large dependencies that offer little value for the Personal app.

## Acceptance criteria

- Personal bundle contains no AWS/payment/analytics runtime.
- Normal installed-PWA workout use generates no Liftosaur or Sabertooth backend request.
- CI fails if forbidden infrastructure is newly imported into the Personal entrypoint.

## Suggested branch

`rewrite/personal-dependency-guard`

---

# Phase 7 — Optional MCP bridge

## Goal

Enable ChatGPT-assisted program/history workflows without making the workout app depend on a server.

This phase is optional and starts only after the local PWA is stable.

## Design constraint

Browser IndexedDB on the iPhone is private local data. A remote MCP server cannot directly read it. We therefore need an explicit synchronization boundary.

## Phase 7A — Manual bridge first

Start with the smallest integration:

1. PWA exports a Sabertooth JSON snapshot.
2. User imports/uploads it to the bridge when AI assistance is wanted.
3. MCP tools operate on that snapshot.
4. Bridge produces an updated program/data export.
5. PWA imports the result after explicit user confirmation.

This is intentionally not seamless, but it proves the workflow with almost no infrastructure.

### MCP tool subset

Start with:

- list_programs
- get_program
- validate_program
- update_program
- list_exercises
- create_custom_exercise
- summarize_history

Do not expose unrelated upstream admin/SaaS tools.

## Phase 7B — Optional explicit sync

Only if manual exchange becomes annoying, evaluate a tiny encrypted sync layer.

Requirements:

- opt-in
- no analytics
- no billing
- minimal identity mechanism
- encrypted transport
- explicit device pairing
- conflict handling
- easy disable/delete

Possible implementations should be compared by operational dependency count, not feature count.

A one-user deployment may be simpler than a generic multi-tenant account system.

## Acceptance criteria

The base app continues to work if the MCP bridge is deleted or offline. AI integration never becomes a prerequisite for workouts or history access.

## Suggested branches

`optional/personal-mcp-manual`

then, only if justified:

`optional/personal-sync-bridge`

---

# Phase 8 — Hardening, release/update process, and native-app decision

## Goal

Make Sabertooth Personal dependable enough for long-term use and decide whether a native iOS wrapper/app is actually necessary.

## Implementation tasks

### 8.1 Backup discipline

Add:

- last-backup date in Settings
- non-blocking reminder when backups are stale
- backup format migration tests
- restore tests against older supported versions

Do not upload backups automatically without an explicit future sync feature.

### 8.2 Data integrity

Add checks for:

- duplicate workout completion
- orphan custom exercise references
- invalid active program ID
- impossible numeric values
- corrupted in-progress workout state

On corruption, preserve original data for export/debug before attempting repair.

### 8.3 Release strategy

For early releases, publish static PWA builds with:

- version number
- git commit hash
- release notes
- rollback artifact

Avoid requiring App Store distribution for the MVP.

### 8.4 Upstream reuse strategy

Document which Liftosaur components are vendored/reused and how upstream fixes will be selectively reviewed.

Do not regularly merge the entire upstream application into the Personal app if that would reintroduce SaaS dependencies.

### 8.5 Native iOS decision gate

After several weeks of real PWA use, evaluate whether PWA limitations materially hurt the experience.

Reasons that could justify a native app later:

- unreliable background timers
- desired Apple Health integration
- Watch integration
- local notifications not meeting needs
- stronger file/backup integration

If those are not meaningful problems, keep the PWA and avoid native build/signing complexity.

## Acceptance criteria

- Data has a tested backup/restore story.
- PWA updates do not erase local workout data.
- A bad release can be rolled back.
- Native iOS work begins only because of demonstrated PWA limitations, not by default.

## Suggested branch

`rewrite/personal-hardening`

---

# MVP definition

Sabertooth Personal v0.1 is complete when all of the following are true:

1. It can be installed on the user's iPhone from Safari.
2. It launches and works in airplane mode after installation.
3. All four canonical workouts are preloaded.
4. Every required exercise exists; there are no unknown-exercise errors.
5. Warmups, work sets, carries, mobility drills, unilateral work, timers, RPE, and notes are representable without fake Liftoscript workarounds.
6. Completed workouts appear in History.
7. The next-session load suggestion is calculated locally.
8. In-progress workouts survive app backgrounding/reopening.
9. Data persists locally with no account or backend.
10. Full backup and restore work through JSON files.
11. A Liftosaur JSON export can be migrated through the supported importer.
12. Normal use makes no request to Liftosaur production infrastructure.
13. Normal use requires no AWS, cloud database, OAuth, analytics, payment service, or MCP server.

# What is explicitly not required for v0.1

- multi-user accounts
- cloud sync
- subscriptions/payments
- App Store distribution
- Apple Watch
- Apple Health
- social/community features
- web dashboards for administrators
- generic SaaS hosting
- always-on MCP connectivity

These can be considered later only when a concrete personal-use need justifies the additional dependency and maintenance cost.
