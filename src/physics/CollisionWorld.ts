import type { Vec3 } from '../core/types.ts';
export type Axis = keyof Vec3;
export type AABB = { min: Vec3; max: Vec3 };
export interface CollisionWorld {
  querySolidBoxes(bounds: AABB): readonly AABB[];
  isRegionReady(bounds: AABB): boolean;
}
export const PLAYER_RADIUS = 0.32;
export const PLAYER_HEIGHT = 1.72;
const EPS = 1e-8;

export function playerBounds(p: Vec3): AABB {
  return { min: { x: p.x - PLAYER_RADIUS, y: p.y, z: p.z - PLAYER_RADIUS },
    max: { x: p.x + PLAYER_RADIUS, y: p.y + PLAYER_HEIGHT, z: p.z + PLAYER_RADIUS } };
}
const overlaps = (a0: number, a1: number, b0: number, b1: number) =>
  a0 < b1 - EPS && a1 > b0 + EPS;
export function intersects(a: AABB, b: AABB): boolean {
  return (['x', 'y', 'z'] as const).every(axis => overlaps(a.min[axis], a.max[axis], b.min[axis], b.max[axis]));
}

/** Swept axis interval against static boxes; blocks high-speed tunneling. */
export function sweepAxis(position: Vec3, axis: Axis, desired: number, world: CollisionWorld): { distance: number; collided: boolean } {
  if (!desired) return { distance: 0, collided: false };
  const start = playerBounds(position);
  const region: AABB = {
    min: { ...start.min }, max: { ...start.max },
  };
  if (desired > 0) region.max[axis] += desired;
  else region.min[axis] += desired;
  if (!world.isRegionReady(region)) return { distance: 0, collided: true };
  let distance = desired;
  for (const obstacle of world.querySolidBoxes(region)) {
    const other = (['x', 'y', 'z'] as const).filter(a => a !== axis);
    if (!other.every(a => overlaps(start.min[a], start.max[a], obstacle.min[a], obstacle.max[a]))) continue;
    if (desired > 0 && start.max[axis] <= obstacle.min[axis] + EPS) {
      const gap = obstacle.min[axis] - start.max[axis];
      if (gap < distance) distance = Math.max(0, gap);
    } else if (desired < 0 && start.min[axis] >= obstacle.max[axis] - EPS) {
      const gap = obstacle.max[axis] - start.min[axis];
      if (gap > distance) distance = Math.min(0, gap);
    } else if (overlaps(start.min[axis], start.max[axis], obstacle.min[axis], obstacle.max[axis])) {
      distance = 0; // Defensive: prevent travel when already embedded.
    }
  }
  return { distance, collided: Math.abs(distance - desired) > EPS };
}

export class FixtureCollisionWorld implements CollisionWorld {
  readonly boxes: readonly AABB[];
  constructor(boxes: readonly AABB[]) { this.boxes = boxes; }
  querySolidBoxes(bounds: AABB): readonly AABB[] {
    return this.boxes.filter(b => intersects(bounds, b));
  }
  isRegionReady(_bounds: AABB): boolean { return true; }
}
