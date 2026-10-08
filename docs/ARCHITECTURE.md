---
covers:
  - src/**
---

# Architecture

## React and PixiJS

`App.tsx` owns navigation, saved options, player identity, and completed-match registration. React renders menus, HUD, controls, and dialogs in `src/components`. Screen components live in `components/screens`; game overlays live in `components/game`; reusable controls live in `components/shared`.

`GameCanvas.tsx` mounts a session through `createGameSession.ts`. The session loads textures, initializes a private Pixi Application, creates the arena, and starts the simulation. Its controller exposes pause, resume, input actions, and destroy. Cancellation guards prevent an asynchronous initialization from mounting after React cleanup. Initialization errors expose Retry.

The renderer uses a fixed logical arena of 960 × 540. CSS preserves its proportions during resizing, while HUD and touch controls remain attached to viewport edges. Resizing does not recreate the simulation or change match coordinates.

## Simulation routine

`gameLoop.ts` owns the match, player, enemy projectile collection, spawner, input, and feedback. One ticker update runs this sequence:

1. Update transient visual effects.
2. Finish a pending death animation, if the match has ended.
3. Advance the match clock and limit simulation time to the remaining duration.
4. Spawn enemies, move ships, and update player and enemy attacks.
5. Resolve contact damage and remove destroyed enemies.
6. Synchronize sprites and publish changed HUD values.
7. Check whether time or player health ended the match.

React state changes when input or displayed score, health, time, and pause status change. Ship positions and projectile movement stay outside React.

`game/mechanics` contains simulation state and rules without sprite rendering. `game/arena` creates and synchronizes Pixi views. `game/feedback` groups visual and sound actions by combat, movement, and match events. `game/support` contains audio, option validation, and pause utilities. Session and loop entry points remain at the game root.

## Movement and collisions

Player movement uses heading zero as up, with X movement from sine and Y movement from negative cosine. Turning while moving follows an arc. Simulation divides movement into steps of at most 1/60 second before enforcing arena and island bounds.

Chasers and shooters share enemy movement. They rotate toward the player, with shooters stopping at attack range. There is no route planner around islands. Each ship's rotated dimensions produce an axis-aligned bounding box, which simplifies collision handling but can block corners earlier than the visible hull would.

Projectiles test the whole segment from their previous position to their next position. The collision routine intersects the X and Y intervals along that same segment, preventing fast projectiles from jumping through an obstacle. Bounds expand by projectile radius; corner checks are conservative. Enemy bullets remain in a shared collection after their shooter dies.

Front shots have one projectile. A broadside has three parallel projectiles spaced along the hull. Weapon cooldowns, enemy aiming, damage, scoring, and match completion are separate mechanics functions. Only player-projectile kills increase score.

## Pause and resource lifetime

Manual pause, window blur, and hidden-page events stop the ticker, disable input, clear pressed controls, and stop gameplay audio. Resume requires an explicit action and fresh input. Portrait guidance uses the same pause controller. Death disables gameplay immediately and finishes an explosion before publishing the result.

Session teardown destroys feedback views, input listeners, pause listeners, ticker callbacks, scene children, and the Application canvas. Projectile views remove inactive sprites and trails. Enemy destruction removes its view group. Textures loaded through Assets remain cached for later matches; sprite destruction preserves shared textures.

Audio uses a lazily unlocked AudioContext, cached decoded buffers, and per-session channels. Channels track loops and active voices, cap voice count, and invalidate pending playback when stopped or destroyed. A separate interface channel plays menu sounds. Browser audio failures do not prevent gameplay.

## Local persistence

| Key                              | Stored value                                |
| -------------------------------- | ------------------------------------------- |
| `pirate-battle.options`          | Validated match duration and spawn interval |
| `pirate-battle.player`           | Browser-local player ID and name            |
| `pirate-battle.last-result`      | Last completed result                       |
| `pirate-battle.pending-matches`  | Original records awaiting confirmation      |
| `pirate-battle.mock-matches`     | Confirmed mock server records               |
| `pirate-battle.network-scenario` | Scenario ID and seed                        |

Storage readers validate persisted values and fall back when data is missing or malformed. Pending records are deduplicated by ID. Storage failure can leave a queue only in memory; the UI explains when refresh would lose pending work. Last-result persistence has no separate Last Result menu button, matching the reference menu.

## API contracts and mock server

`api/contracts.ts` defines player identity, match records, registration responses, and paginated ranking/history results. A match record contains its ID, player, completion date, score, active duration, end reason, and starting configuration.

| Endpoint            | Inputs                                    | Result                       |
| ------------------- | ----------------------------------------- | ---------------------------- |
| `GET /api/ranking`  | Duration, spawn interval, page, page size | Ranked matching records      |
| `GET /api/matches`  | Player ID, page, page size                | Player history, newest first |
| `POST /api/matches` | Match record                              | Confirmed record             |

MSW starts before React renders. Axios waits for worker activation before sending browser requests. A 404 can trigger one worker restart and retry, recovering a request that reached the static host while interception was unavailable.

Handlers validate HTTP inputs, call named query routines, and apply a selected network scenario. The mock store persists records and returns the existing record when an ID is submitted again. A storage failure returns HTTP 503 instead of confirming an unsaved record. Scenario faults and delays are deterministic; page and request index determine ordering, and seed shifts the variable-delay sequence.

The same mocks run in development, production, and HTTP tests. They simulate a backend but share no data between users or browsers.

## Query cache and submission recovery

TanStack Query keys include ranking configuration and pagination, or history player ID and pagination. Queries have a 30-second stale period, refetch on mount, and retry network errors or HTTP 5xx at most twice. HTTP 4xx errors do not retry automatically. Axios requests accept cancellation signals so old responses cannot replace a newer query's data.

`useRegisterMatch` connects a mutation to an external registration queue. Successful confirmation invalidates ranking and history. The queue saves the record before sending, tracks status per ID, and shares one in-flight promise for duplicate submissions. Failure retains the original payload. Confirmation removes only that ID, preserving other pending matches when responses arrive out of order.

Restored pending records retry on startup. Manual retry is also available. A server acceptance followed by a timeout is safe because the mock store is idempotent by match ID. Reset is blocked while requests are in flight.

## Balance and limitations

The shipped configuration uses player health 5, enemy health 3, 60-second matches, and alternating spawns every 4 seconds. Options support 60–180 seconds and 1–30-second spawn intervals. Each match captures options at its start, including the configuration attached to its ranking entry.

Player speed is 120 units/second; chasers use 60 and shooters 45. Shooter aiming tolerance and attack range limit when enemies fire. Movement, weapon, spawn, combat, and match constants live beside their respective rules.

The performance record uses a separate 500/8 health workload and a 2-second spawn interval. It does not validate the shipped balance. Collision approximations, direct enemy steering, browser-local ranking, deferred visual baselines, and unverified physical mobile performance are current limits.
