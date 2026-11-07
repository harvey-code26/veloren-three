# Engineering decision log

## D-0001 — Browser-first architecture

**Proposed, not yet user-approved.** Start with a standalone desktop-browser single-player vertical slice. Use TypeScript for simulation and Three.js for rendering. Keep state and collision queries independent of Three.js objects.

## D-0002 — First reference snapshot

Use Veloren mirror commit `cd75076cf157d47c97bdf21c5bd7012cc4959dfc` (2026-10-30) as the static-research reference until explicitly changed. GitLab is the primary upstream repository, GitHub a mirror.

## D-0003 — Asset provenance

Do not bulk-copy Veloren assets. Record source path, upstream commit, attribution, exact license and additional restrictions for every imported item.

## D-0004 — Simulation timing

60 Hz fixed-step simulation is a *proposal*, not a claim about Veloren's native server tick. Validate in P1 using identical recorded inputs under different rendering frame rates.

## D-0005 — Scope labels

Use `Not started`, `In progress`, `Technical verification passed`, `Awaiting user review`, `Needs changes`, and `Accepted`. Starter rendering does not count as movement/physics completion.
