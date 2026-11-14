export interface Vec3 { x: number; y: number; z: number }
export interface InputCommand {
  tick: number;
  moveX: number;
  moveZ: number;
  sprint: boolean; // regular run, unless toggled to walking
  sneak?: boolean;
  roll?: boolean;
  jump: boolean; // edge-triggered, consumed once per press
  reset: boolean;
}
export const vec = (x = 0, y = 0, z = 0): Vec3 => ({ x, y, z });
export const copy = (v: Vec3): Vec3 => ({ x: v.x, y: v.y, z: v.z });
