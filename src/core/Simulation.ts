import { copy, vec, type InputCommand, type Vec3 } from './types.ts';
import { playerBounds, sweepAxis, type CollisionWorld } from '../physics/CollisionWorld.ts';

export interface SimulationSnapshot {
  tick: number;
  previous: Vec3;
  position: Vec3;
  velocity: Vec3;
  grounded: boolean;
  collisions: number;
  rolling: boolean;
}
const GRAVITY = 23;
const JUMP_SPEED = 8.4;
const MOVE_SPEED = 5.2;
const SPRINT_SPEED = 8.2;
const ACCEL_GROUND = 33;
const ACCEL_AIR = 9;
const SNEAK_SPEED = 2.35;
const ROLL_SPEED = 11.4;
const ROLL_DURATION = 0.40;
const ROLL_COOLDOWN = 0.8;
const moveToward = (v: number, target: number, delta: number) => v < target ? Math.min(v + delta, target) : Math.max(v - delta, target);

export class Simulation {
  private position: Vec3 = vec(0, 0, 8);
  private previous: Vec3 = copy(this.position);
  private velocity: Vec3 = vec();
  private grounded = false;
  private tick = 0;
  private collisions = 0;
  private rollTimer = 0;
  private rollCooldown = 0;
  private rollDirection: Vec3 = vec();
  private readonly world: CollisionWorld;
  constructor(world: CollisionWorld) { this.world = world; }

  reset(): void {
    this.position = vec(0, 0, 8);
    this.previous = copy(this.position);
    this.velocity = vec();
    this.grounded = false;
    this.collisions = 0;
    this.rollTimer = 0;
    this.rollCooldown = 0;
  }
  step(command: InputCommand, dt: number): void {
    if (command.tick !== this.tick + 1) throw new Error(`Unexpected tick ${command.tick}; expected ${this.tick + 1}`);
    this.tick++;
    if (command.reset) this.reset();
    this.previous = copy(this.position);

    const speed = command.sneak ? SNEAK_SPEED : command.sprint ? SPRINT_SPEED : MOVE_SPEED;
    const inputLen = Math.hypot(command.moveX, command.moveZ);
    const factor = inputLen > 1 ? 1 / inputLen : 1;
    this.rollCooldown = Math.max(0, this.rollCooldown - dt);
    if (command.roll && this.grounded && this.rollCooldown === 0) {
      const moving = inputLen > 0.01;
      const velocityLen = Math.hypot(this.velocity.x, this.velocity.z);
      const dirX = moving ? command.moveX / inputLen :
        velocityLen > 0.1 ? this.velocity.x / velocityLen : 0;
      const dirZ = moving ? command.moveZ / inputLen :
        velocityLen > 0.1 ? this.velocity.z / velocityLen : -1;
      this.rollDirection = vec(dirX, 0, dirZ);
      this.rollTimer = ROLL_DURATION;
      this.rollCooldown = ROLL_COOLDOWN;
    }
    if (this.rollTimer > 0) {
      this.velocity.x = this.rollDirection.x * ROLL_SPEED;
      this.velocity.z = this.rollDirection.z * ROLL_SPEED;
      this.rollTimer = Math.max(0, this.rollTimer - dt);
    } else {
      const accel = (this.grounded ? ACCEL_GROUND : ACCEL_AIR) * dt;
      this.velocity.x = moveToward(this.velocity.x, command.moveX * factor * speed, accel);
      this.velocity.z = moveToward(this.velocity.z, command.moveZ * factor * speed, accel);
    }

    if (command.jump && this.grounded && this.rollTimer === 0) {
      this.velocity.y = JUMP_SPEED;
      this.grounded = false;
    }
    this.velocity.y -= GRAVITY * dt;

    for (const axis of ['x', 'z', 'y'] as const) {
      const delta = this.velocity[axis] * dt;
      const hit = sweepAxis(this.position, axis, delta, this.world);
      this.position[axis] += hit.distance;
      if (hit.collided) {
        this.collisions++;
        if (axis === 'y' && delta < 0) this.grounded = true;
        this.velocity[axis] = 0;
      } else if (axis === 'y') {
        this.grounded = false;
      }
    }
    // Future streaming worlds can block movement before unloaded regions.
    if (!this.world.isRegionReady(playerBounds(this.position)) || this.position.y < -20) this.reset();
  }
  snapshot(): SimulationSnapshot {
    return { tick: this.tick, previous: copy(this.previous), position: copy(this.position), velocity: copy(this.velocity), grounded: this.grounded, collisions: this.collisions, rolling: this.rollTimer > 0 };
  }
}
