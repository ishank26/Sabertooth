# Sabertooth Personal

Sabertooth Personal is the local-first iPhone/PWA rewrite path for this fork. It intentionally avoids the Liftosaur hosted backend, accounts, subscription checks, billing SDKs, analytics, and cloud workout storage.

## Current MVP

The `personal/` app is plain HTML, CSS, and JavaScript with no runtime package dependencies. It includes:

- the four-day Monday / Tuesday / Thursday / Saturday program;
- warm-ups, mobility, agility/power work, main lifts, accessories, carries, and cooldowns;
- per-set reps, load, RPE, time, or distance logging;
- a wall-clock rest timer that survives normal iPhone background/foreground transitions;
- completed-workout history and simple best-load progress summaries;
- IndexedDB persistence;
- JSON backup/restore;
- a service worker for offline app-shell caching;
- PWA metadata for Add to Home Screen.

The base app has no account and does not need the Sabertooth/Liftosaur server or MCP to run workouts.

## Run locally

Any static HTTPS-capable web server can host this directory. For development, from the repository root you can use any existing static server, for example Python if it is already installed:

```sh
python3 -m http.server 8080 --directory personal
```

Then open `http://localhost:8080` in a desktop browser. Service workers require HTTPS except on localhost.

## GitHub Pages deployment

`.github/workflows/personal-pages.yml` publishes only the contents of `personal/` after changes reach `master`. This is a deployment convenience, not a runtime dependency: the installed PWA remains a static app and workout data stays local.

For the first deployment, configure the repository's Pages source to **GitHub Actions** if GitHub has not already done so. With the repository's standard Pages hostname, the expected URL is typically:

```text
https://ishank26.github.io/Sabertooth/
```

A custom domain can be added later without changing the app architecture.

## Install on iPhone

1. Host the `personal/` directory over HTTPS (the Pages workflow above is the default path).
2. Open the URL in Safari on the iPhone.
3. Tap **Share**.
4. Choose **Add to Home Screen**.
5. Launch Sabertooth from the new home-screen icon once while online so the app shell is cached.
6. Verify an airplane-mode launch before relying on it at the gym.

Workout data remains in Safari/PWA storage on that device. Use **Settings → Export JSON** regularly and save backups to Files/iCloud Drive.

## Data model

Workout sessions and settings are stored in IndexedDB database `sabertooth-personal`. The backup format is versioned with:

```json
{
  "format": "sabertooth-personal-backup",
  "version": 1
}
```

The restore path currently accepts only Sabertooth Personal backups. Liftosaur JSON migration is a later milestone and should be implemented as an explicit adapter rather than silently treating the two schemas as interchangeable.

## Design constraint

The Personal workout experience must continue to work if every server-side Sabertooth component is unavailable. Optional sync/MCP functionality can be added later, but it must remain outside the critical workout path.
