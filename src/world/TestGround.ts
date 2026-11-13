import type { AABB } from '../physics/CollisionWorld.ts';
export interface Fixture { name: string; box: AABB; color: number }
const item = (name: string, min: [number, number, number], max: [number, number, number], color: number): Fixture => ({
  name, box: { min: { x: min[0], y: min[1], z: min[2] }, max: { x: max[0], y: max[1], z: max[2] } }, color,
});
export const TEST_GROUND: readonly Fixture[] = [
  item('ground', [-26, -1, -26], [26, 0, 26], 0x8ba77c),
  item('wall-north', [-26, 0, -26], [26, 4, -25.4], 0x7b938a),
  item('wall-south', [-26, 0, 25.4], [26, 4, 26], 0x7b938a),
  item('wall-east', [25.4, 0, -26], [26, 4, 26], 0x7b938a),
  item('wall-west', [-26, 0, -26], [-25.4, 4, 26], 0x7b938a),
  item('low-wall', [-4, 0, -4], [4, 1.5, -3.55], 0xb3a48a),
  item('wide-platform', [6, 0, -13], [13, 2.5, -6], 0xb5a184),
  item('jump-block', [-12, 0, -8], [-8, 0.75, -4], 0xc6b08e),
  item('pillar-1', [-2, 0, -13], [-0.9, 3.1, -11.9], 0x809bad),
  item('pillar-2', [2, 0, -13], [3.1, 3.1, -11.9], 0x809bad),
  item('roof', [-2, 2.3, -13], [3.1, 2.6, -11.9], 0x809bad),
  item('corridor-left', [-12, 0, 3], [-10, 2.5, 11], 0x91a7a8),
  item('corridor-right', [-8.9, 0, 3], [-6.9, 2.5, 11], 0x91a7a8),
];
