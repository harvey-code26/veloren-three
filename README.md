# Veloren Three

An independent Three.js + TypeScript experiment in reconstructing the foundational systems of [Veloren](https://veloren.net/). Not affiliated with the official game.

**Current milestone: P1 core movement test field.** It is a development fixture, not a voxel game yet.

## Online preview

Deployment workflow: [Deploy to GitHub Pages](.github/workflows/deploy.yml). Published URL: <https://harvey-code26.github.io/veloren-three/> ([GitHub Pages deployment confirmed](https://github.com/harvey-code26/veloren-three/actions/runs/43443419909)). See [deployment notes](docs/DEPLOYMENT.md).

## Run

Requires Node.js 22+ and npm.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. Click the scene to lock the cursor and rotate the camera with the mouse; press Esc to unlock it.

| Control | Action |
| --- | --- |
| W A S D / arrow keys | Move relative to camera |
| Mouse (after click) | Orbit camera |
| Space | Jump |
| B | Toggle walk (run by default) |\n| Shift | Sneak (slower) |
| Mouse wheel | Zoom / enter first-person |\n| 0 | Toggle first/third person |\n| L | Toggle free look |\n| . | Toggle auto-walk |\n| , | Toggle mouse cursor |\n| Middle mouse | Simplified roll |\n| F1 | Toggle help |
| Home | Reset to test spawn (developer-only) |
| F3 | Toggle debug panel |

## Test and build

```bash
npm run test
npm run typecheck:core
npm run build
```

`npm run test` runs deterministic simulation tests with Node's built-in test runner and TypeScript stripping. `npm run build` checks all TS modules and produces the Vite browser bundle. GitHub Actions also validates each push and stores the built `dist` artifact.

## Documentation

- [Research, architecture and P0–P10 checklist](docs/PLAN.md)
- [Current progress](docs/PROGRESS.md)
- [P1 review and testing route](docs/P1-REVIEW.md)\n- [P1.1 Veloren control and camera alignment](docs/P1-CONTROLS.md)
- [Engineering decisions](docs/DECISIONS.md)

## Important boundaries

- Simulation is TypeScript data; Three.js only renders it.
- P1 uses handcrafted collision boxes. P2 will add voxels; P3 will add chunk streaming.
- This repository currently contains original code and primitive test shapes only, no Veloren media.
- Veloren code is GPL-3.0-or-later and individual assets may have separate restrictions. Review licenses and attribution before any upstream reuse or publication of derivatives.
