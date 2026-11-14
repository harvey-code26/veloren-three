# Veloren original character model — credits and provenance

Selection: Human Female + Cloth Blue armor, no helmet.
These are genuine upstream `.vox` model pieces, not generated look-alikes. See [machine-checked manifest](../assets/veloren-human-female.json).

| Part | Original path under `assets/voxygen/voxel/` |
| --- | --- |
| VOX | `figure/head/human/female.vox` |
| VOX | `figure/eyes/general/female_default-0.vox` |
| VOX | `figure/hair/human/female-0.vox` |
| VOX | `armor/cloth_blue/chest.vox` |
| VOX | `armor/cloth_blue/pants.vox` |
| VOX | `armor/cloth_blue/belt.vox` |
| VOX | `armor/cloth_blue/hand.vox` |
| VOX | `armor/cloth_blue/foot.vox` |
| VOX | `armor/cloth_blue/shoulder_0.vox` |

Source: [Veloren repository pinned snapshot](https://github.com/veloren/veloren/commit/cd75076cf157d47c97bdf21c5bd7012cc4959dfc), Veloren contributors.
License: [upstream GPL-3.0-or-later](https://github.com/veloren/veloren/blob/cd75076cf157d47c97bdf21c5bd7012cc4959dfc/LICENSE), with per-file exceptions listed in [assets/credits.ron](https://github.com/veloren/veloren/blob/cd75076cf157d47c97bdf21c5bd7012cc4959dfc/assets/credits.ron). The chosen nine files are not listed among the special noncommercial model exceptions in that snapshot; upstream credits state an unlisted asset defaults to GPLv3. Preserve upstream attribution and observe GPL obligations when distributing.

Offsets from `humanoid_head_manifest.ron`, `humanoid_armor_*_manifest.ron`, skeleton data from `voxygen/anim/src/character/mod.rs`. HumanOne skin, Oak hair and CornflowerBlue eyes from `humanoid_color_manifest.ron`. Animation is an approximate Three.js implementation, not the complete Rust procedural animation.

`tools/sync-veloren-assets.mjs` downloads the exact original blobs and checks Git blob SHA-1, size and VOX magic. The downloaded binary files go to `public/veloren/`, ignored by Git but packaged under `dist/veloren/` during deployment. No live raw.githubusercontent.com requests are needed by the published demo.

Independent demonstration; not associated with or endorsed by Veloren.

Model geometry verification: `npm run assets:verify` parses all nine source VOX files and checks the twelve-part logical bounds and expected 2,249 input voxels before the build. This does not by itself prove browser frame rendering.
