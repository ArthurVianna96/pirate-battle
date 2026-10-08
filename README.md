---
covers:
  - src/**
  - package.json
  - playwright.config.ts
---

# Pirate Battle

A naval survival game built with React, TypeScript, and PixiJS 8. This is the solution guide; the original challenge is in [CHALLENGE_INSTRUCTIONS.md](docs/CHALLENGE_INSTRUCTIONS.md).

Play the [deployed game](https://pirate-battle-pearl.vercel.app/).

See [architecture](docs/ARCHITECTURE.md) and the [performance report](profiling/report.md).

## Run locally

Use Node.js 24 and npm. Install dependencies and start Vite:

```sh
npm ci
npm run dev
```

Open the URL printed by Vite. No application environment variables or private backend services are required. MSW provides the ranking, history, and match-registration APIs in development and production.

`predev` and `prebuild` generate `public/mockServiceWorker.js`. This generated file is ignored by Git and copied into the production build.

## Controls

| Action                    | Keyboard                  |
| ------------------------- | ------------------------- |
| Move forward              | W or Up                   |
| Turn left/right           | A/D or Left/Right         |
| Fire forward              | Space                     |
| Fire left/right broadside | Q/E                       |
| Pause/resume              | HUD button and pause menu |

The six round controls also accept touch input, including simultaneous actions. Portrait touch screens prompt rotation to landscape. The game pauses during rotation and requires Resume afterward. Continue in portrait is available for the current match. Menus work in either orientation.

Losing focus or hiding the tab pauses the game. Returning requires Resume and fresh movement/firing input. Paused time does not count toward the match duration.

## Gameplay settings

The level has three grass-covered islands with palms and rocks, an open center, and land extending beyond the bottom and right edges. `src/game/arena/level.ts` defines tile dimensions, positions, and decorations; rendering and collision bounds use that same layout.

Options change the duration and spawn interval for the next match. Each match keeps the configuration captured when Play was selected.

| Setting              |          Default | Allowed values                               |
| -------------------- | ---------------: | -------------------------------------------- |
| Match duration       |       60 seconds | Whole seconds from 60 to 180                 |
| Enemy spawn interval |        4 seconds | Whole seconds from 1 to 30                   |
| Player/enemy health  |            5 / 3 | Source configuration in `src/game/config.ts` |
| Player speed         | 120 units/second | Source configuration in `src/game/config.ts` |

Chasers approach and damage the player on contact. Shooters approach firing range and shoot when aimed at the player. Enemies alternate when spawned. Destroying an enemy with a player projectile awards one point; firing and enemy contact destruction award no points. A match ends when time expires or the player dies.

Health changes ship sprites in three stages. Hits, muzzle flashes, trails, explosions, and sounds provide combat feedback. Enemy health appears above enemy ships; player health appears above the ship and in the HUD.

## Ranking and history

Ranking shows matches with the selected duration and spawn interval, ordered by score. Match History shows the current browser's player identity, newest first. Both views paginate five records at a time.

Finished matches are queued locally before submission. A failed submission remains pending, can be retried, and survives refresh when storage is available. Retries keep the same match ID, so server acceptance followed by a lost response does not create duplicates. Query failures do not block local gameplay.

This is a browser-local demo. Player identity, options, confirmed mock matches, pending submissions, and the last result use local storage. Clearing site data removes them. Different browsers do not share a leaderboard. Storage failures are reported where recovery requires keeping the page open.

## Network scenarios

Open `/?network=success&seed=0` and expand Network simulation in the menu or Captain's Log. Select a scenario there, or specify its ID in the URL.

| ID                     | Behavior                                                                 |
| ---------------------- | ------------------------------------------------------------------------ |
| `success`              | Normal fixture data                                                      |
| `empty`                | Hide fixtures; keep confirmed player matches                             |
| `many-pages`           | Add 24 demo matches for the current player                               |
| `slow`                 | Responses wait 1.5 seconds                                               |
| `variable`             | Repeat delays of 1200, 100, and 600 ms; seed selects the starting offset |
| `out-of-order`         | Odd pages wait 1.5 seconds; even pages wait 0.1 seconds                  |
| `timeout`              | Responses exceed the 8-second Axios timeout                              |
| `connection`           | Fail without an HTTP response                                            |
| `bad-request`          | HTTP 400 for all API operations                                          |
| `server-error`         | HTTP 500 for all API operations                                          |
| `ranking-error`        | HTTP 500 for ranking only                                                |
| `history-error`        | HTTP 500 for history only                                                |
| `accepted-timeout`     | Save a new match, then delay its first response beyond the timeout       |
| `registration-offline` | HTTP 500 for submissions; queries keep working                           |

Scenario and seed persist across refresh. Selecting a scenario resets its request counter, cancels existing ranking/history requests, and resets their caches. Reset network state clears confirmed and pending demo matches, restores fixtures, and selects Success with seed 0. Reset is disabled while a registration is sending.

To reproduce registration recovery:

1. Open `/?network=accepted-timeout&seed=0`.
2. Finish a match and wait for registration to time out.
3. Retry registration or refresh. The existing ID is recovered once in ranking/history.

To reproduce an outage, open `/?network=registration-offline`. Finish a match, return to the menu, select Success, and retry pending matches. Use `/?network=many-pages` to exercise pagination.

## Commands and reports

```sh
npm run dev
npm run build
npm run preview
npm run lint
npm run typecheck
npm run format:check
npx playwright install chromium
npm run test:e2e
npx playwright show-report
```

Playwright runs Chromium desktop and Pixel 7 touch emulation in landscape. Dedicated tests cover portrait and resizing. HTML reports go to `playwright-report/`; failure traces and other artifacts go to `test-results/`. These generated directories are ignored by Git. The delivered [HTML test report](reports/playwright/index.html) is versioned separately; open it with `npx playwright show-report reports/playwright`. Tests use isolated browser contexts, pure mechanics modules, keyboard/pointer input, and HTTP mocks. Combat scenarios with exact travel-time assertions use a 960 × 540 viewport; responsive and visual tests use device viewports. The game has no test-state bridge. Versioned screenshots in `tests/visualRegression.spec.ts-snapshots/` cover the main menu, stable arena, and completed match on desktop and mobile. The tests freeze the browser clock and wait for fonts, images, and match registration before capture.

Compare screenshots with `npm run test:e2e -- tests/visualRegression.spec.ts`. After an intentional UI change, run `npm run test:e2e -- tests/visualRegression.spec.ts --update-snapshots`, inspect the changed PNGs, then commit them. Baselines were generated with Chromium on macOS; use the same browser version and operating system for comparisons. Other operating systems need separately reviewed baselines.

For profiling, serve a production build on port 4173, then run:

```sh
npm run build
npm run preview -- --host 127.0.0.1 --port 4173 --strictPort
```

In another terminal:

```sh
PROFILE_HEADED=1 PROFILE_SPAWN_INTERVAL=2 npm run profile
npm run profile:memory
```

Profiler-only variables select a visible browser and spawn interval. They are not application environment variables. Reproducing the recorded run also requires the health configuration listed in the performance report; the shipped game uses 5/3 health. Fresh results go to `test-results/performance/`.

## Known limits

Enemy movement steers directly toward the player and has no obstacle pathfinding. Ship collision bounds are axis-aligned approximations of rotated ships. The playable world fills the viewport. A uniform scale based on a 960 × 540 reference keeps ships proportional; wider or taller screens add playable space. Resizing rebuilds island bounds and relocates ships while preserving the current match.

The recorded native-GPU workload averaged 59.95 FPS, with 17.60 ms frame-time p95. That run used 500/8 health to sustain the three-minute workload. Physical mobile performance remains unverified.
