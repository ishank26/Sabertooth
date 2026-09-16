# Sabertooth detailed implementation roadmap

This document turns the high-level roadmap into an executable plan. The ordering is deliberate: first make the fork independently runnable, then make MCP usable end-to-end, then clean up branding/commerce, migration, mobile distribution, and hardening.

## Execution model

- Work in one focused branch/PR per phase or sub-phase.
- Keep `master` deployable after each merge.
- Prefer adapters/configuration over broad rewrites until self-hosting works end-to-end.
- Do not weaken authentication to achieve free access. Subscription entitlement is removed; user authentication and per-user authorization remain required.
- Preserve AGPL-3.0 licensing and upstream attribution.
- Every infrastructure phase must include tests and rollback notes.

## Dependency order

1. Phase 1 -> Phase 2 -> Phase 3 is the critical path.
2. Phase 4 should begin after Phase 2 establishes the target self-host topology.
3. Phase 5 can run after Phase 4 identifies all remaining branding/domain coupling.
4. Phase 6 should happen only after we no longer need upstream commerce compatibility.
5. Phase 7 requires a working self-hosted data store from Phase 2.
6. Phase 8 requires Phase 4/5 to eliminate production identifiers and upstream endpoints.
7. Phase 9 requires Phase 3 and Phase 7.
8. Phase 10 starts during Phase 2 and becomes a release gate after Phase 9.

---

# Phase 1 — Dependency and infrastructure audit

## Goal

Produce a complete map of what Sabertooth still depends on so later self-hosting work is based on evidence rather than assumptions.

## Current starting point

The backend dependency-injection boundary already exposes DynamoDB, S3, SES, Secrets Manager, Lambda invocation, CloudWatch, logging, and fetch through `lambda/utils/di.ts`. The development server already adapts Node HTTP requests to the existing Lambda/API Gateway handler in `devserver.ts`, which gives us a useful starting point for a non-Lambda server process.

## Implementation tasks

### 1.1 Inventory source-level dependencies

Search the repository for:

- `liftosaur.com`, `api3.liftosaur.com`, `stage.liftosaur.com`, local Liftosaur domains
- hard-coded OAuth callback/issuer/resource URLs
- app update URLs and universal-link hosts
- App Store / Play Billing product IDs
- Google OAuth client IDs
- Rollbar, analytics, attribution, push, web-push, and telemetry endpoints
- AWS SDK clients and environment variables
- native bundle IDs/application IDs/deep-link schemes

Create `docs/architecture/dependency-audit.md` with columns:

- component
- code path
- dependency/service
- purpose
- data handled
- required for MVP?
- disposition: keep / parameterize / replace / remove
- target phase

### 1.2 Trace runtime paths

Trace the main entrypoints:

- web client build/runtime
- React Native iOS/Android runtime
- `lambda/index.ts`
- `lambda/mcp/*`
- `devserver.ts`
- OAuth/token issuance
- API-key authentication
- sync/persistence
- export/import

Document which DI services each path actually requires.

### 1.3 Define first self-host target

Choose the minimum viable local replacements. Initial preferred topology:

- Node API process using the existing handler via an HTTP adapter
- DynamoDB Local for first-pass persistence compatibility
- MinIO or S3-compatible object storage only if the required code paths need S3
- Mailpit/local SMTP adapter for email in development
- environment/file-backed secret provider
- stdout/no-op replacements for CloudWatch/Lambda-only helpers where safe
- static web bundle served separately or by a lightweight web server

This intentionally avoids a Postgres rewrite in the first self-host milestone.

### 1.4 Add an audit script

Add `scripts/audit-upstream-dependencies.*` that scans for known upstream production identifiers and prints categorized findings.

Initially it should report rather than fail CI. Phase 4 will convert approved rules into enforcement.

## Tests / validation

- Run the scanner in CI.
- Verify all discovered hostnames/product IDs are represented in the audit document.
- Manually compare the audit against `package.json`, `webpack*.config.js`, mobile project settings, and `lambda/utils/di.ts`.

## Deliverables

- `docs/architecture/dependency-audit.md`
- machine-readable matrix such as `docs/architecture/dependencies.yml`
- audit script
- target topology decision for Phase 2

## Acceptance criteria

- Every known outbound production dependency has a purpose and planned disposition.
- Every AWS dependency required by the account/API/MCP path has a replacement strategy.
- We can describe the exact services required for a fresh self-hosted install.
- No unresolved upstream dependency blocks Phase 2 design.

## Suggested branch

`fork/dependency-audit`

---

# Phase 2 — Self-host MVP

## Goal

Run the web app, authenticated API, persistent storage, and MCP-capable backend on infrastructure controlled by the Sabertooth operator, without requiring Liftosaur production services.

## Architecture approach

Use compatibility-first adapters before redesigning persistence. The existing backend is built around AWS-shaped interfaces; replacing those interfaces is lower risk than rewriting the domain/API layer.

Recommended first topology:

```text
Browser / Mobile
      |
      v
Reverse proxy (HTTPS)
  |            |
  |            +---- static web app
  |
  +---------------- Node Sabertooth API/MCP
                         |
                         +---- DynamoDB Local
                         +---- S3-compatible store if required
                         +---- local/env secrets
                         +---- SMTP/Mailpit in development
                         +---- stdout logs
```

## Implementation tasks

### 2.1 Extract a production-safe Node HTTP adapter

`devserver.ts` already turns Node HTTP requests into API Gateway-shaped events. Extract that logic into reusable modules, for example:

- `server/httpAdapter.ts`
- `server/main.ts`

Requirements:

- plain HTTP internally; TLS terminated by reverse proxy
- configurable bind address and port
- correct headers/cookies/body handling
- streaming behavior required by MCP
- health endpoint (`/healthz`)
- graceful shutdown
- no development certificates or `.liftosaur.com` assumptions

### 2.2 Add self-host DI providers

Implement providers matching the existing interfaces:

- `IDynamoUtil`: initially configure AWS SDK against DynamoDB Local
- `IS3Util`: configure against MinIO/S3-compatible endpoint or provide a local implementation for required paths
- `ISecretsUtil`: environment/file-backed implementation
- `ISesUtil`: SMTP/no-op provider depending environment
- `ILambdaUtil`: explicit local implementation; either direct function dispatch for required internal calls or fail-fast for unsupported admin-only paths
- `ICloudwatchUtil`: stdout/no-op implementation

Select provider set with an environment variable such as:

`SABERTOOTH_RUNTIME=selfhost`

Do not overload subscription flags for infrastructure mode.

### 2.3 Docker images

Add:

- `Dockerfile.web`
- `Dockerfile.server`
- `docker-compose.yml`
- `.env.example`

Compose services should include only what the MVP requires after Phase 1 confirms dependencies.

### 2.4 Bootstrap storage

Create an idempotent bootstrap command for tables/buckets/indexes.

Example:

`npm run selfhost:init`

It must be safe to rerun and must not destroy existing data.

### 2.5 Configuration model

Document and validate:

- `SABERTOOTH_PUBLIC_URL`
- API/public ports
- storage endpoint/credentials
- signing/JWT secrets
- email configuration
- MCP server name
- CORS/cookie settings
- optional telemetry toggles

Add startup validation so missing required production settings fail with a clear error.

### 2.6 Local developer command

Target one command from a clean checkout:

```bash
cp .env.example .env
docker compose up --build
```

Document first-run account creation and data persistence volumes.

## Tests / validation

- server unit tests for request/event translation
- integration test against DynamoDB Local
- account registration/login test
- API-key creation/authentication test
- program create/read/update test
- container restart persistence test
- health endpoint test

## Deliverables

- Node self-host server entrypoint
- self-host DI provider set
- Docker Compose stack
- bootstrap script
- `.env.example`
- `docs/self-hosting.md`

## Acceptance criteria

A fresh machine can clone the repo, configure `.env`, run Docker Compose, create/sign into an account, create a program, restart the stack, and see the same data afterward. No Liftosaur subscription or Liftosaur backend is involved.

## Suggested branch

`fork/self-host-foundation`

---

# Phase 3 — MCP + OAuth end-to-end

## Goal

Make a self-hosted Sabertooth instance usable by an MCP client for authenticated workout/account operations.

## Implementation tasks

### 3.1 API-key path first

Before OAuth, prove the simplest authenticated MCP path:

- create API key in Sabertooth
- call MCP endpoint with bearer/API-key authentication
- verify public reference tools without auth
- verify private program/history/custom-exercise tools with auth

This isolates MCP correctness from OAuth complexity.

### 3.2 OAuth metadata and endpoints

Use the existing configurable public URL support for:

- `/.well-known/oauth-protected-resource`
- `/.well-known/oauth-authorization-server`
- authorization/login flow
- token exchange
- MCP `WWW-Authenticate` challenge

Verify all generated URLs use `SABERTOOTH_PUBLIC_URL` rather than Liftosaur hosts.

### 3.3 Reverse-proxy compatibility

Support forwarded headers safely:

- `X-Forwarded-Proto`
- `X-Forwarded-Host`
- trusted proxy configuration

Do not derive security-sensitive origins from arbitrary untrusted headers when `SABERTOOTH_PUBLIC_URL` is configured.

### 3.4 MCP integration tests

Automate JSON-RPC tests for:

- initialize
- tools/list
- public reference tool
- unauthenticated private tool -> auth challenge
- authenticated `list_programs`
- `get_program`
- `run_playground`
- `create_custom_exercise`
- `update_program`
- history/stat query

Use isolated test users and verify cross-user access is denied.

### 3.5 Client connection guide

Create `docs/mcp.md` documenting:

- MCP URL
- API-key method
- OAuth method
- example client configuration
- troubleshooting auth redirects
- how to revoke credentials

## Tests / validation

- full MCP test suite against a running self-host stack
- token expiry/revocation
- invalid token
- cross-user access isolation
- restart resilience for OAuth/API-key records

## Acceptance criteria

An external MCP client can discover the Sabertooth server, authenticate, read a user's program, validate Liftoscript, update that program, and read workout history without any paid subscription or Liftosaur-hosted API.

## Suggested branch

`fork/self-host-mcp-oauth`

---

# Phase 4 — Eliminate unintended Liftosaur network dependencies

## Goal

Ensure a normal Sabertooth session does not contact Liftosaur production infrastructure unless the operator explicitly configures an upstream integration.

## Implementation tasks

### 4.1 Centralize service configuration

Create a typed configuration module for all external service origins/IDs.

Replace hard-coded production host selection in:

- webpack configuration
- native global constants
- universal-link handling
- API/service clients
- update mechanisms
- image/static URLs
- OAuth links

### 4.2 Telemetry policy

Make telemetry explicitly opt-in for self-host deployments.

For each telemetry/analytics provider:

- disabled by default
- configurable endpoint/key
- no upstream Liftosaur credential embedded in a Sabertooth build
- no account/workout data sent without explicit configuration

### 4.3 Universal links and deep links

Accept Sabertooth host/scheme. If backward-compatible Liftosaur import links are useful, treat them only as input parsing, not as a reason to contact upstream services.

### 4.4 CI enforcement

Upgrade the Phase 1 scanner to fail on unauthorized production references.

Maintain an allowlist for:

- upstream attribution/license links
- documentation explaining Liftosaur migration
- compatibility test fixtures

Do not allow runtime code to silently add new upstream production dependencies.

### 4.5 Network test

Run an integration/e2e session behind a recording proxy and assert normal flows contact only configured Sabertooth/self-host services and intentionally retained third parties.

## Acceptance criteria

- Normal web/API/MCP use makes no request to Liftosaur production systems.
- Build artifacts contain no upstream production API credentials.
- CI prevents accidental reintroduction of runtime Liftosaur hosts.

## Suggested branch

`fork/remove-upstream-runtime-deps`

---

# Phase 5 — Rebrand Sabertooth

## Goal

Make the fork operationally and visually distinct while retaining required upstream license/attribution.

## Implementation tasks

### 5.1 Product metadata

Change:

- package name/description where appropriate
- HTML titles/meta
- PWA manifest name/short name
- MCP server display identity
- support/contact references owned by the fork

### 5.2 Web UI strings

Replace user-facing Liftosaur branding with Sabertooth.

Do not blindly replace historical references in:

- license text
- migration documentation
- changelog attribution
- upstream source acknowledgements

### 5.3 Native identifiers

Define new identifiers, e.g.:

- iOS bundle ID
- watch app IDs
- Android application ID
- URL/deep-link scheme
- associated domains / asset links

Update project files, manifests, Gradle/Xcode settings, and link handling together.

### 5.4 Icons/assets

Create Sabertooth-specific app icons, splash assets, favicon/PWA icons, and store artwork. Verify all required platform dimensions.

### 5.5 Attribution

Add a visible `About / Open Source` section stating that Sabertooth is a fork of Liftosaur and linking to source/license as required by AGPL and good attribution practice.

## Tests / validation

- grep/scan for user-facing Liftosaur strings
- PWA install test
- Android link/deep-link test
- iOS link/deep-link test
- app can coexist with official Liftosaur due to different bundle/application IDs

## Acceptance criteria

A user sees Sabertooth branding throughout the app; operating-system identifiers do not collide with Liftosaur; license/upstream notices remain intact.

## Suggested branch

`fork/rebrand-sabertooth`

---

# Phase 6 — Remove commerce/subscription code

## Goal

Delete unused payment/subscription infrastructure rather than carrying permanently disabled code.

## Preconditions

- self-host stack works
- client/API/MCP full access is stable
- no requirement to maintain a subscription-gated Sabertooth distribution

## Implementation tasks

### 6.1 Build an inventory

Use compiler/`knip` plus repository search to identify:

- subscription screens
- IAP adapters
- StoreKit config
- Play Billing code
- purchase thunks
- receipt cleanup/verification
- server payment handlers
- subscription tables/indexes
- affiliate/payment reporting tied only to paid access

### 6.2 Remove UI/payment flows

Remove subscription purchase/management routes and buttons. Replace any remaining plan display with a simple Sabertooth account status only if needed.

### 6.3 Remove native billing dependencies

Remove `react-native-iap` and platform billing setup when no other code needs it.

### 6.4 Remove server commerce infrastructure

Delete payment verification/webhook/storage paths and deployment resources that are not needed for account access.

Be careful not to delete generic secure-token utilities merely because subscription keys used them historically.

### 6.5 Simplify types/storage

Decide whether old imported storage containing subscription fields remains tolerated for compatibility. Preferred approach:

- importer accepts/ignores legacy fields
- new Sabertooth storage no longer writes them

## Tests / validation

- TypeScript compile
- full unit suite
- clean install without IAP native dependency
- import legacy Liftosaur JSON containing subscription metadata
- account/API/MCP behavior unchanged

## Acceptance criteria

No payment SDK, purchase UI, store receipt verification, or paid entitlement storage is required by a standard Sabertooth build/runtime.

## Suggested branch

`fork/remove-commerce`

---

# Phase 7 — Liftosaur data migration compatibility

## Goal

Allow users to migrate legitimate exported data from Liftosaur into Sabertooth without losing programs/history/custom exercises/settings.

## Current starting point

The client already has JSON import UI using `ImporterStorage` and `Thunk_importStorage`. This phase turns that generic path into a tested migration contract.

## Implementation tasks

### 7.1 Define migration contract

Document supported imported data:

- programs/Liftoscript
- workout history
- custom exercises
- exercise notes/config
- gyms/equipment/settings
- measurements
- timers/preferences where portable

Explicitly ignore/remove:

- subscription/payment entitlement
- upstream auth tokens
- upstream-only telemetry identifiers
- device-specific secrets

### 7.2 Versioned fixtures

Add sanitized fixtures from representative Liftosaur exports across relevant schema versions.

Never commit real personal workout/account data.

### 7.3 Preflight validator

Before destructive import:

- parse JSON
- identify schema/version
- report counts: programs/history/custom exercises/etc.
- report unsupported fields
- reject malformed data before touching current storage

### 7.4 Automatic backup

Before import, automatically produce or prompt for a Sabertooth export backup.

### 7.5 Migration transforms

Add explicit migrations for schema differences introduced by rebranding/commerce removal/self-hosting.

Keep migrations pure and unit-testable.

### 7.6 Post-import verification

After import validate:

- program references resolve
- custom exercise IDs resolve
- history references valid exercises
- current program exists
- settings defaults filled

## Tests / validation

- fixture imports
- round-trip Sabertooth export/import
- corrupted file leaves existing data untouched
- legacy subscription metadata does not grant/deny anything
- large-history import performance

## Acceptance criteria

A Liftosaur export can be imported into Sabertooth and the user sees the same core programs, custom exercises, workout history, settings, and measurements after restart/sync.

## Suggested branch

`fork/data-migration`

---

# Phase 8 — Mobile build and release pipeline

## Goal

Produce reproducible installable Android/iOS builds under Sabertooth identifiers.

## Implementation tasks

### 8.1 Local release builds

Get clean local builds working for:

- Android APK/AAB
- iOS simulator release
- iOS archive/device release
- watchOS only after main iOS app is stable

Remove developer-specific device IDs/names from general release scripts.

### 8.2 Signing configuration

Externalize signing details. Do not commit certificates/private keys.

Document required secrets for:

- Android keystore
- Apple signing/profile/team
- optional store upload credentials

### 8.3 GitHub Actions

Add workflows for:

- typecheck/tests
- web build
- Android unsigned/debug artifact on PR or tag
- signed releases only when repository secrets are configured
- iOS build where runner/signing constraints allow

### 8.4 Versioning

Define one source of truth for:

- semantic app version
- Android versionCode
- iOS build number
- MCP/server version

### 8.5 Release process

Create `docs/releasing.md` with:

- tag naming
- changelog expectations
- build artifact locations
- upgrade notes
- rollback procedure

## Tests / validation

- install Android artifact on a clean device/emulator
- install iOS build on simulator/device
- verify self-host base URL configuration
- deep links
- login/sync
- offline workout behavior
- update compatibility

## Acceptance criteria

A tagged commit can produce repeatable Sabertooth artifacts without Liftosaur signing credentials or bundle identifiers.

## Suggested branch

`fork/release-pipeline`

---

# Phase 9 — Personal fitness workflow and MCP-managed program

## Goal

Use Sabertooth for the original practical objective: manage the user's actual 4-day training program cleanly from ChatGPT/MCP.

## Implementation tasks

### 9.1 Canonical program source

Add a version-controlled program definition under a Sabertooth-owned path, for example:

`programs/personal/ishank-4-day.lft`

Keep the canonical workout content aligned with the fitness project:

- Day 1 Lower A
- Day 2 Upper A
- Day 3 Lower B
- Day 4 Upper B
- warm-up guidance
- progression/deload behavior

### 9.2 Exercise compatibility audit

Use Sabertooth's built-in exercise definitions and MCP `list_exercises` to decide which movements are built-in versus custom.

Create only the custom exercises needed for tracked work. Keep low-value mobility/warm-up drills as concise workout notes where appropriate.

### 9.3 Liftoscript validation

For every day:

- parse with current Liftoscript grammar
- run MCP playground simulation
- verify equipment names
- verify unilateral semantics
- verify timers/rest
- verify starting weights/progression
- ensure no giant visible comment blocks

### 9.4 Idempotent installer/updater

Build a script or MCP workflow that can:

- locate the canonical program
- create required custom exercises if missing
- create/update the program
- avoid duplicate exercises/programs
- report the resulting program ID/version

### 9.5 ChatGPT workflow test

Test realistic commands:

- "Show me Day 2"
- "Change my bench starting weight"
- "Add a set to Thursday's pulldown"
- "Analyze my last four squat workouts"
- "Create the missing custom exercise and validate the program"

Every write action should clearly identify what changed.

## Tests / validation

- playground validation for all four days
- program update preserves workout history mapping
- custom-exercise creation is idempotent
- manual workout completion on mobile syncs and appears through MCP

## Acceptance criteria

The user can manage the canonical 4-day program and inspect training history through Sabertooth MCP without manually editing/copying Liftoscript for routine changes.

## Suggested branch

`feature/ishank-program-mcp`

---

# Phase 10 — Hardening, backup, security, and upstream maintenance

## Goal

Make Sabertooth safe to depend on for long-term workout history and account access.

## Implementation tasks

### 10.1 Threat model

Document assets and trust boundaries:

- password/session credentials
- OAuth tokens/API keys
- workout/history data
- measurements
- import files
- server secrets

Review:

- authentication
- authorization/user scoping
- CSRF/session cookies
- OAuth redirect validation
- API-key storage/hash strategy
- rate limiting
- brute-force resistance

### 10.2 Backup/restore

Implement documented backup of all persistent stores.

Requirements:

- automated scheduled backup option
- encrypted off-host backup guidance
- restore into a fresh instance
- periodic restore test

### 10.3 Observability

Provide:

- structured logs
- request IDs
- auth/security events without leaking credentials
- health/readiness endpoints
- optional metrics

No workout/account payloads should be dumped into logs by default.

### 10.4 Dependency/security checks

CI should run:

- TypeScript checks
- tests
- dependency vulnerability scan
- secret scan
- upstream-host audit
- license/SBOM generation where practical

### 10.5 Upgrade strategy

Document how to pull useful upstream Liftosaur changes without reintroducing:

- subscription gates
- upstream hosts
- payment code
- official bundle IDs

Maintain a `docs/upstream-sync.md` checklist and regression tests around Sabertooth-specific invariants.

### 10.6 Disaster recovery

Run a tabletop/automated scenario:

1. destroy local containers/runtime
2. retain only source, config secrets, and backup
3. deploy clean instance
4. restore data
5. sign in
6. read/update program through MCP

## Acceptance criteria

- backup restore is proven
- auth isolation tests pass
- no high-severity known vulnerability is knowingly shipped without documented mitigation
- a clean redeploy can restore user data and MCP access
- upstream merge procedure protects Sabertooth's free/self-hosted invariants

## Suggested branch

`fork/hardening`

---

# Milestones

## Milestone A — Independently runnable

Phases 1–2 complete.

Result: Sabertooth runs on self-hosted infrastructure with persistent accounts/programs.

## Milestone B — AI-manageable

Phase 3 complete.

Result: an MCP client can authenticate and manage programs/history.

## Milestone C — Independent product

Phases 4–6 complete.

Result: no unintended Liftosaur production dependency, Sabertooth branding/identifiers, no commerce runtime/code.

## Milestone D — Migratable and installable

Phases 7–8 complete.

Result: Liftosaur exports migrate cleanly and Sabertooth mobile builds are reproducible.

## Milestone E — Daily-driver fitness system

Phase 9 complete.

Result: the canonical 4-day program is installed, validated, and manageable through MCP.

## Milestone F — Durable

Phase 10 complete.

Result: backup/restore, security, observability, and upstream maintenance processes are in place.

# Immediate next PR

Start Phase 1 on `fork/dependency-audit` and use its findings to finalize the exact Docker Compose services for Phase 2. The first implementation PR should not attempt a database rewrite; it should establish the dependency matrix, audit tooling, and self-host architecture decision.