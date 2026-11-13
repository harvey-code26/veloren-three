# Progress tracker

Updated: 2026-11-13

| Milestone | Status | Evidence |
| --- | --- | --- |
| P0 Research & plan | Draft complete; awaiting user scope review | [PLAN.md](PLAN.md) |
| P1 Runtime, time step, movement and collision | **Core tests and CI build passed; browser hands-on review pending** | [P1 review](P1-REVIEW.md) |
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
- [ ] Pages hosting activated and deployment job succeeded.
- [ ] Remote HTTPS test field verified in browser.

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
