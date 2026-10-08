# Performance check, October 7, 2026

This report records the native-GPU run completed at 07/10/2026 21:47 BRT. Measurements are in [combat.json](combat.json). It supersedes the earlier software-rendering runs.

## Environment and workload

- MacBook Pro, Apple M4 Pro, 12 CPU cores, 24 GB RAM, macOS 26.3.
- Chromium 153.0.8010.12, visible browser, Playwright 1.63.0.
- Optimized Vite production build served with `vite preview`.
- ANGLE Metal Renderer on the Apple M4 Pro GPU.
- Viewport 1280 × 720, device pixel ratio 1, canvas backing size 960 × 540.
- Match duration 180 seconds, enemy spawn interval 2 seconds.
- Player health 500 and enemy health 8, confirmed in the production bundle.

The automated player held forward movement and all three firing controls, turning right for 200 ms every second. The measured interval lasted 180.07 seconds and the final score was 61.

## Frame timing

| Measurement             |    Result |
| ----------------------- | --------: |
| Sampled frame intervals |    10,796 |
| Average frame rate      | 59.95 FPS |
| Frame interval p95      |  17.60 ms |
| Worst frame interval    |  50.90 ms |
| Intervals over 33.4 ms  |         5 |
| Uncaught page errors    |         0 |

Frame intervals came from real `requestAnimationFrame` timestamps. FPS is the number of intervals divided by their total duration. P95 uses the nearest-rank percentile. The profiler did not advance a fake clock or modify game state during the run.

Chrome DevTools Protocol queried existing enemy and projectile state objects every 30 seconds. These queries can trigger garbage collection and affect frame timing. The reported results include that overhead. No trace attributes the worst interval to a particular function.

| Seconds | Enemy states | Projectile states |
| ------- | -----------: | ----------------: |
| 30.29   |            3 |                 8 |
| 60.68   |            3 |                 7 |
| 90.02   |            3 |                 4 |
| 120.39  |            3 |                 4 |
| 150.74  |            3 |                 2 |

These are periodic live-object samples, not peak entity counts. The arena also contained one player and one island.

## Memory after five cycles

After combat, the profiler ran five start/play/leave cycles. Each cycle fired for five seconds, then used Pause and Main Menu. Garbage collection ran before each sample.

| Completed cycles      | JS heap, MiB | DOM nodes | Event listeners |
| --------------------- | -----------: | --------: | --------------: |
| Baseline after combat |         7.21 |        64 |             186 |
| 1                     |         7.38 |        64 |             185 |
| 2                     |         7.47 |        64 |             185 |
| 3                     |         7.53 |        64 |             185 |
| 4                     |         7.62 |        64 |             185 |
| 5                     |         7.65 |        64 |             185 |

Heap increased by 0.44 MiB. DOM nodes stayed constant, and listener count dropped to 185 after the first cycle and stayed there. These samples show no accumulating DOM nodes or listeners, but do not establish that all memory is bounded. This run did not capture heap snapshots or GPU-memory measurements.

## Reproduce

Use player health 500 and enemy health 8 in `COMBAT_CONFIG` to reproduce this workload, then build and serve:

```sh
npm ci
npx playwright install chromium
npm run build
npm run preview -- --host 127.0.0.1 --port 4173 --strictPort
```

In another terminal:

```sh
PROFILE_HEADED=1 PROFILE_SPAWN_INTERVAL=2 npm run profile
```

The script writes `test-results/performance/profile.json`. Each run uses a fresh browser context. Keep the computer awake and avoid competing heavy workloads. Check the recorded renderer and duration before comparing results.

For a separate extended memory investigation, run `npm run profile:memory`. Its output is not part of this report.

## Assessment and limits

This native-GPU workload met the 60 FPS target approximately, with 59.95 FPS average and 17.60 ms p95. It used a denser spawn interval than the 4-second default, but altered health values. It demonstrates rendering and simulation performance for the recorded configuration, not validation of the original game balance.

The report records the required three-minute run, entity samples, five memory cycles, environment, and limitations. Five-second memory cycles do not represent five full matches. JavaScript heap does not measure total process memory or GPU memory. Physical mobile performance remains unverified.
