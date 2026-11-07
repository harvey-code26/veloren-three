# Progress tracker

Updated: 2026-11-07

| Milestone | Status | Evidence |
| --- | --- | --- |
| P0 Research & plan | Draft complete; awaiting discussion | [PLAN.md](PLAN.md) |
| P1 Runtime, time step, movement and collision | Not started | — |
| P2 Voxel data, meshing and collision | Not started | — |
| P3 Seeded world, streaming and basic save | Not started | — |
| P4 Climb, swim, glide and stamina | Not started | — |
| P5 Licensed assets, animation and visual design | Not started | — |
| P6 Combat and enemy behavior | Not started | — |
| P7 Gathering, quests, inventory and persistence | Not started | — |
| P8 10–15 minute adventure slice | Not started | — |
| P9 Stability and release candidate | Not started | — |
| P10 Optional expansions | Deferred | — |

## Bootstrap (not a gameplay milestone)

- [x] Add initial full project plan as first commit.
- [x] Initialize a minimal TypeScript + Three.js + Vite scaffold.
- [ ] Run `npm install`, `npm run typecheck`, `npm run build` and inspect browser rendering on target hardware.
- [ ] Confirm initial device and browser baseline.

## Next technical task

Implement P1 fixed-step clock and reproducible input handling before character movement. Do not mark gameplay stages complete based on the render bootstrap alone.
