# Veloren Three

A step-by-step Three.js / TypeScript exploration of voxel open-world RPG systems, inspired by [Veloren](https://veloren.net/).

> Independent learning and engineering project. Not an official Veloren browser port.

## Status

**P0 — Research and planning:** initial documentation committed. **P1 — Core simulation:** not started. The starter scene only verifies that the rendering toolchain loads.

- [Full research, architecture and milestone checklist](docs/PLAN.md)
- [Development decisions](docs/DECISIONS.md)
- [Progress tracker](docs/PROGRESS.md)

## Run locally

Requirements: Node.js 22+ and npm.

```bash
npm install
npm run dev
```

Open the URL printed by Vite. This is a **render-only bootstrap**, not yet a playable demo.

```bash
npm run typecheck
npm run build
```

## Development rules

- Keep simulation and gameplay data separate from Three.js rendering.
- Deliver a runnable, tested checkpoint at every major milestone.
- Track changes and test evidence in `docs/PROGRESS.md`.
- Review licenses of individual Veloren assets before importing them.

Veloren's code is GPL-3.0-or-later, and individual media assets can have different terms. This repository does **not** currently contain copied Veloren code or media. The license of this independently authored starter is not yet declared; decide the distribution license before incorporating upstream code or publishing derivative builds.
