# Sabertooth Personal — local-first architecture

Sabertooth Personal is the primary product direction for this fork: a private, local-first workout tracker intended to run on an iPhone as an installable PWA, with no required backend, account, subscription, analytics service, cloud database, or Liftosaur production dependency.

## Product principles

1. **Phone-first:** the primary target is Safari on iPhone installed with Add to Home Screen.
2. **Offline-first:** normal workout execution must work without network connectivity.
3. **Local data ownership:** programs, workout history, settings, measurements, and custom exercises live on-device by default.
4. **Minimal external services:** the base app must not require AWS, Firebase, Supabase, OAuth, analytics, payments, or a hosted API.
5. **Small dependency surface:** prefer browser APIs and extracted Liftosaur domain logic over adding service SDKs or large frameworks.
6. **Portable backups:** all durable user data must be exportable to a human-portable JSON backup and restorable without a server.
7. **Optional AI integration:** MCP is a separate optional bridge and must never be required for the workout app to function.
8. **Preserve upstream license obligations:** reused Liftosaur AGPL code remains attributed and source-available.

## Target topology

```text
                    optional later
ChatGPT / MCP client ---------------> Tiny Sabertooth MCP bridge
                                         |
                                         | explicit sync/import only
                                         v
+---------------------------------------------------------------+
| iPhone                                                        |
|                                                               |
| Sabertooth Personal PWA                                       |
|                                                               |
|  Today / Workout / Program / History / Progress / Exercises   |
|                                                               |
|  workout engine   Liftoscript   timers   progression          |
|        |               |          |          |                |
|        +---------------+----------+----------+                |
|                        |                                      |
|                 local repository                              |
|                        |                                      |
|                 IndexedDB / browser storage                   |
|                        |                                      |
|               JSON backup / restore                           |
|                        |                                      |
|                  Files / iCloud Drive                         |
+---------------------------------------------------------------+
```

## Base build: allowed runtime dependencies

The base iPhone app may depend on browser/platform features and static assets, but should not require network services after installation.

Allowed:

- Safari/WebKit
- service worker / Cache Storage
- IndexedDB
- File API / Web Share or browser download/upload flows
- timers/notifications only where iOS PWA support is reliable
- static exercise images/video links when online

Not required by the base app:

- accounts or login
- OAuth
- AWS Lambda/DynamoDB/S3/SES/CloudWatch
- Liftosaur APIs
- subscriptions/IAP
- analytics/telemetry
- push infrastructure
- hosted SQL/NoSQL databases
- MCP

## Code reuse policy

Prefer extracting pure, reusable domain code from Liftosaur rather than importing the entire application runtime.

High-value reuse candidates:

- Liftoscript parser/evaluator
- program/workout model
- progression rules
- exercise definitions and equipment metadata
- workout history calculations
- unit/weight helpers
- import/export compatibility logic

Avoid carrying forward into the Personal build:

- account/auth state
- sync protocol
- server API clients
- AWS DI providers
- payment/subscription state
- telemetry/attribution
- admin/debug SaaS tooling
- store purchase SDKs

## Data model

The local repository should expose a small versioned storage contract independent of browser APIs:

```ts
interface PersonalStore {
  schemaVersion: number;
  profile: Profile;
  programs: Program[];
  activeProgramId?: string;
  customExercises: CustomExercise[];
  history: WorkoutRecord[];
  measurements: Measurement[];
  settings: PersonalSettings;
}
```

Storage implementations:

- `IndexedDbPersonalRepository` for production
- `MemoryPersonalRepository` for tests
- JSON serializer/deserializer for backup/migration

No server identifiers should be necessary to address local records.

## Offline model

The installed PWA should cache:

- application shell
- fonts/icons owned by the project
- exercise metadata needed by the current program
- local program/history data through IndexedDB

External technique videos are online enhancements and must never block workout execution.

## MCP boundary

MCP is not part of the local app runtime. A later optional bridge may support workflows such as reading/updating programs or analyzing exported history. It must use an explicit synchronization model; the phone's private IndexedDB must not be silently exposed to the internet.

Possible bridge models, to decide later:

1. manual JSON import/export between phone and bridge;
2. user-triggered encrypted sync to a tiny self-hosted store;
3. local-network bridge while both devices are reachable.

The base release ships without any of these.
