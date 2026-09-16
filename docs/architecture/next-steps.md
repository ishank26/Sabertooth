# Next steps

Sabertooth is pivoting from a server-first self-hosted Liftosaur clone to **Sabertooth Personal**: a local-first iPhone PWA for personal workout tracking.

The detailed plan is in [implementation-roadmap.md](./implementation-roadmap.md), with the target architecture in [local-first-architecture.md](./local-first-architecture.md).

## Completed foundations

1. Forked Liftosaur under AGPL-3.0 as Sabertooth.
2. Removed subscription entitlement from the fork's authenticated API/MCP paths while retaining authentication/authorization.
3. Made client feature access subscription-free by default.
4. Kept app-store commerce behavior inert in free mode.
5. Parameterized public/MCP identity away from hard-coded Liftosaur production values.

Those server-side changes remain useful reference work, but they are no longer the critical path for the personal app.

## Revised critical path

1. Extract a browser-safe Personal workout core from the valuable Liftosaur domain logic.
2. Build an isolated installable iPhone PWA entrypoint with no account/backend requirement.
3. Preload and execute the canonical four-day strength/mobility/agility program.
4. Store all program/history/settings data locally with IndexedDB.
5. Add JSON backup/restore and Liftosaur export migration.
6. Validate real iPhone installation, offline workouts, background/reopen behavior, and timers.
7. Enforce that the Personal bundle does not pull AWS, billing, analytics, account, or Liftosaur production runtime dependencies.
8. Only after the local app is stable, add an optional MCP bridge if AI program editing/history analysis is worth the extra infrastructure.

## MVP target

The first useful release is not a generic multi-user Liftosaur replacement. It is a private workout app that:

- installs from Safari to the iPhone home screen;
- runs all four workouts offline;
- has every required custom movement built in;
- tracks sets, reps, weight, RPE, timers, carries, mobility, and history;
- suggests progression locally;
- persists workouts without an account;
- exports/restores a portable JSON backup;
- can import supported Liftosaur JSON exports;
- makes no normal-use request to Liftosaur or a Sabertooth backend.

## Next implementation branch

`rewrite/personal-core`

That branch should isolate the Liftoscript/workout/progression/exercise logic required by the Personal app and create the versioned local data contract. It should not build or depend on a server.
