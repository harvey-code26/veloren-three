# Progress tracker

Updated: 2026-11-14

| Milestone | Status | Evidence |
| --- | --- | --- |
| P0 Research & plan | Draft complete; awaiting user scope review | [PLAN.md](PLAN.md) |
| P1 Runtime, time step, movement and collision | **26 automated checks and Chromium smoke passed; hands-on original-game comparison pending** | [P1 review](P1-REVIEW.md), [P1.3](P1-3-ANIMATION.md) |
| P2 Voxel data, meshing and collision | Not started | — |
| P3 Seeded world, streaming and basic save | Not started | — |
| P4 Climb, swim, glide and stamina | Not started | — |
| P5 Licensed assets, animation and visual design | Not started | — |
| P6 Combat and enemy behavior | Not started | — |
| P7 Gathering, quests, inventory and persistence | Not started | — |
| P8 10–15 minute adventure slice | Not started | — |
| P9 Stability and release candidate | Not started | — |
| P10 Optional expansions | Deferred | — |

## Hosting

- [x] GitHub Pages automated build/deploy workflow added (with Vite subpath base).
- [x] Pages hosting enabled; deployment successful ([GitHub Actions successful rerun](https://github.com/harvey-code26/veloren-three/actions/runs/43443419909)).
- [ ] Remote browser gameplay smoke test: awaiting user hands-on review. GitHub deploy job reported success and the [published address](https://harvey-code26.github.io/veloren-three/); independent browser rendering check not yet recorded.

## P1.1 control & camera alignment (CI passed; hands-on pending)

- [x] Match source keybindings: B walk, Shift sneak, L free look, . auto-walk, 0 camera mode, comma cursor, middle-click roll.
- [x] Restore R/E/Ctrl to their reserved original meanings (no longer misuse R for respawn).
- [x] Implement camera mode change and free-look independent movement bearing.
- [x] Add pure input/control tests and simplified dodge movement.
- [x] 16/16 tests, TypeScript/Vite production build and GitHub Pages deployment green ([Validate](https://github.com/harvey-code26/veloren-three/actions/runs/43539307127), [Deploy](https://github.com/harvey-code26/veloren-three/actions/runs/43539307461)).
- [ ] Browser movement/camera user review and original-game comparison.

## P1.3 character motion and camera turn alignment

- [x] Isolate motion poses from rendering; feet remain on their respective body sides.\n- [x] Use distance-driven gait and continuous idle breathing with rise/fall/landing/roll states.\n- [x] Smooth avatar facing via shortest-angle turn; keep original control keys and free look.\n- [x] Add deterministic animation-state and foot-invariant tests.\n- [x] 26/26 automated tests and TypeScript/Vite build passed ([Validate](https://github.com/harvey-code26/veloren-three/actions/runs/43586574686)).
- [x] Headless Chromium loaded original VOX assets, captured three screenshots, replayed straight W movement and switched to first person; Pages deployed ([Deploy](https://github.com/harvey-code26/veloren-three/actions/runs/43586574665)).
- [ ] Compare animation timing and mouse look against native Veloren on a real gaming machine.

## P1.2 original Veloren character

- [x] Locate original Human Female head, hair, eyes, blue-cloth clothing and original pivot offsets.\n- [x] Pin nine original VOX files by Git blob SHA and add a reproducible build-time downloader.\n- [x] Replace the primitive avatar with an articulated assembly of original voxel parts.\n- [x] CI downloaded and SHA-verified 9 original VOX files; model geometry and 12-part assembly checks passed, and the site deployed ([successful run](https://github.com/harvey-code26/veloren-three/actions/runs/43549172476)).\n- [x] Original character renders in Chromium; three browser screenshots captured (CI artifact). Visual parity with native Veloren still requires hands-on inspection.\n- [ ] Compare procedural animation fidelity with original Veloren (currently simplified).

## P1 checklist

- [x] Fixed timestep (60 Hz) with bounded catch-up and blur reset.
- [x] Input command sequence and edge-triggered jump.
- [x] Standalone movement, jump, gravity and AABB sweep collision.
- [x] Third-person orbit camera and obstacle ray test implementation.
- [x] Purpose-built collision fixture scene and F3 diagnostics.
- [x] Local unit tests 9/9 and core-only TypeScript check.
- [x] GitHub CI TypeScript + Vite production build verified ([successful run](https://github.com/harvey-code26/veloren-three/actions/runs/43440686933)).
- [ ] Browser interaction and user feedback on feel.
- [ ] Real-device 20-minute smoke and performance run.

Next stop: P1 user experience review, then determine if any adjustments are required before P2.
