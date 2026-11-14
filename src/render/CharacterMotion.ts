/**
 * P1.3 presentation-only animation model.
 * Veloren's run/idle/jump/roll Rust state organization informs the pose states,
 * but these equations are ours, not a verbatim translation.
 * All values below are in the original VOX skeleton's ~25-unit space.
 */
export type MotionState = 'idle' | 'walk' | 'run' | 'sneak' | 'rise' | 'fall' | 'roll';
export interface MotionInput {
  speed: number;
  forward: number;
  strafe: number;
  verticalSpeed: number;
  grounded: boolean;
  rolling: boolean;
  sneaking: boolean;
  walking: boolean;
  lookYaw: number;
}
export interface FootPose {
  lift: number;
  forward: number;
  pitch: number;
}
export interface CharacterPose {
  state: MotionState;
  phase: number;
  locomotion: number;
  leftFoot: FootPose;
  rightFoot: FootPose;
  leftArmPitch: number;
  rightArmPitch: number;
  chestBob: number;
  headBob: number;
  headLookYaw: number;
  torsoPitch: number;
  torsoRoll: number;
  rollAngle: number;
  rollLift: number;
  landing: number;
}
const TAU = Math.PI * 2;
const clamp = (value: number, a: number, b: number): number => Math.min(b, Math.max(a, value));
const smooth = (rate: number, dt: number): number => 1 - Math.exp(-rate * dt);

export function shortestYaw(from: number, to: number): number {
  return Math.atan2(Math.sin(to - from), Math.cos(to - from));
}
/** Exponential turn damping; shortest arc avoids 360-degree spins at ±pi. */
export function dampYaw(from: number, target: number, rate: number, dt: number): number {
  return from + shortestYaw(from, target) * smooth(rate, clamp(dt, 0, 0.05));
}

export class CharacterMotion {
  private time = 0;
  private travelPhase = 0;
  private locomotion = 0;
  private airWeight = 0;
  private groundLast = false;
  private rollLast = false;
  private rollTime = 0;
  private landingTime = 0;
  private current: MotionState = 'idle';

  reset(): void {
    this.time = this.travelPhase = this.locomotion = this.airWeight = 0;
    this.groundLast = this.rollLast = false;
    this.rollTime = this.landingTime = 0;
    this.current = 'idle';
  }

  step(input: MotionInput, deltaSeconds: number): CharacterPose {
    const dt = clamp(Number.isFinite(deltaSeconds) ? deltaSeconds : 0, 0, 0.05);
    const speed = clamp(Number.isFinite(input.speed) ? input.speed : 0, 0, 25);
    this.time += dt;
    const gaitTarget = input.grounded && !input.rolling ? clamp(speed / 5.4, 0, 1) : 0;
    this.locomotion += (gaitTarget - this.locomotion) * smooth(12, dt);
    this.airWeight += ((input.grounded ? 0 : 1) - this.airWeight) * smooth(16, dt);

    // Phase advances with distance, not number of frames. One full cycle: two steps.
    if (input.grounded && !input.rolling && speed > 0.08) {
      this.travelPhase = (this.travelPhase + speed * dt * TAU / 2.65) % TAU;
    }
    if (!this.groundLast && input.grounded && this.time > dt + 0.001) {
      this.landingTime = 0.18;
    }
    this.groundLast = input.grounded;
    this.landingTime = Math.max(0, this.landingTime - dt);
    const landing = this.landingTime > 0 ?
      Math.sin(Math.PI * (this.landingTime / 0.18)) : 0;

    if (input.rolling && !this.rollLast) this.rollTime = 0;
    if (input.rolling) this.rollTime = Math.min(0.4, this.rollTime + dt);
    this.rollLast = input.rolling;

    if (input.rolling) this.current = 'roll';
    else if (!input.grounded) this.current = input.verticalSpeed >= 0 ? 'rise' : 'fall';
    else if (speed < 0.16) this.current = 'idle';
    else if (input.sneaking) this.current = 'sneak';
    else if (input.walking) this.current = 'walk';
    else this.current = 'run';

    const phase = this.travelPhase;
    const sine = Math.sin(phase);
    const gait = this.locomotion * (1 - this.airWeight);
    // Both foot anchors are tied to their own skeleton joint: no x-crossing.
    // Pitch clearance and a nonnegative lift prevent heels from clipping
    // beneath the rest pose when the foot rotates about its ankle.
    const backwards = input.forward < -0.15 ? -1 : 1;
    const foot = (s: number): FootPose => {
      const swing = sine * s;
      const pitch = swing * 0.23 * gait * backwards;
      return {
        lift: Math.max(0, swing) * 1.55 * gait + Math.abs(pitch) * 1.15,
        forward: swing * 2.35 * gait * backwards,
        pitch,
      };
    };
    const leftFoot = foot(1);
    const rightFoot = foot(-1);
    let leftArmPitch = -sine * gait * 0.36;
    let rightArmPitch = sine * gait * 0.36;
    let torsoPitch = clamp(speed / 9, 0, 1) * 0.035 * gait;
    const torsoRoll = sine * gait * 0.018 +
      clamp(input.strafe / 8, -1, 1) * 0.04;
    const breathing = Math.sin(this.time * 1.65) * 0.15;
    let chestBob = breathing + Math.abs(sine) * 0.18 * gait - landing * 0.9;
    let headBob = -breathing * 0.2 + landing * 0.3;

    if (this.airWeight > 0.001) {
      const rise = input.verticalSpeed >= 0 ? 1 : 0;
      const fall = 1 - rise;
      const w = this.airWeight;
      leftFoot.lift += w * (1.25 + 0.35 * rise);
      rightFoot.lift += w * (1.25 + 0.45 * fall);
      leftFoot.pitch += w * (-0.24 * rise + 0.10 * fall);
      rightFoot.pitch += w * (0.20 * rise - 0.12 * fall);
      leftArmPitch += w * (-0.27);
      rightArmPitch += w * (-0.27);
      torsoPitch += w * (rise ? -0.10 : 0.07);
      chestBob += w * 0.22;
      headBob -= w * 0.15;
    }

    let rollAngle = 0;
    let rollLift = 0;
    if (input.rolling) {
      // Centre-of-mass roll, rather than rotating a figure around its feet.
      const t = clamp(this.rollTime / 0.4, 0, 1);
      const eased = t * t * (3 - 2 * t);
      rollAngle = -TAU * eased;
      rollLift = Math.sin(Math.PI * t) * 1.2;
      leftFoot.lift += 2.5; rightFoot.lift += 2.5;
      leftFoot.pitch = -0.35; rightFoot.pitch = -0.35;
      leftArmPitch = -0.9; rightArmPitch = -0.9;
      torsoPitch = 0;
      chestBob = -1.3;
      headBob = 0;
    }
    return {
      state: this.current, phase, locomotion: this.locomotion,
      leftFoot, rightFoot, leftArmPitch, rightArmPitch,
      chestBob, headBob, headLookYaw: clamp(input.lookYaw, -0.65, 0.65) * 0.45,
      torsoPitch, torsoRoll, rollAngle, rollLift, landing,
    };
  }
}
