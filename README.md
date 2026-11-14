# Veloren Three

An independent Three.js + TypeScript experiment in reconstructing the foundational systems of [Veloren](https://veloren.net/). Not affiliated with the official game.

**Current milestone: P1.2 — real Veloren Human Female character (blue cloth outfit).** Terrain is still the P1 test fixture.

## Online preview

Deployment workflow: [Deploy to GitHub Pages](.github/workflows/deploy.yml). Published URL: <https://harvey-code26.github.io/veloren-three/> ([current P1.1 deployment](https://github.com/harvey-code26/veloren-three/actions/runs/43539307461)). See [deployment notes](docs/DEPLOYMENT.md).

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
| B | Toggle walk (run by default) |
| Shift | Sneak (slower) |
| Mouse wheel | Zoom / enter first-person |
| 0 | Toggle first/third person |
| L | Toggle free look |
| . | Toggle auto-walk |
| , | Toggle mouse cursor |
| Middle mouse | Simplified roll |
| F1 | Toggle help |
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
- [P1 review and testing route](docs/P1-REVIEW.md)
- [P1.1 Veloren control and camera alignment](docs/P1-CONTROLS.md)
- [Engineering decisions](docs/DECISIONS.md)

## Important boundaries

- Simulation is TypeScript data; Three.js only renders it.
- P1 uses handcrafted collision boxes. P2 will add voxels; P3 will add chunk streaming.
- Build-time asset sync downloads nine original Veloren VOX sources, verifies their exact Git blob SHA, and includes them in the built site. See [asset provenance](docs/ASSET-SOURCES.md).
- Veloren code is GPL-3.0-or-later and individual assets may have separate restrictions. Review licenses and attribution before any upstream reuse or publication of derivatives.
