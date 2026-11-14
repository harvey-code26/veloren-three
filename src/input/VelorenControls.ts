import type { InputCommand } from '../core/types.ts';

/** Veloren default keyboard profile, referenced from voxygen/src/settings/control.rs.
 * World-space uses Y up and -Z forward; input remains independent of the renderer. */
export type CameraMode = 'third' | 'first';
const MOVEMENT = new Set(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowLeft','ArrowDown','ArrowRight']);
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export class VelorenControls {
  private held = new Set<string>();
  private jumpQueued = false;
  private rollQueued = false;
  private resetQueued = false;
  private movementYaw = 0;
  private savedPitch = 0;
  private previousThirdDistance = 10;
  yaw = 0;
  pitch = 0.16;
  distance = 10;
  cameraMode: CameraMode = 'third';
  freeLook = false;
  walking = false; // Veloren runs normally; B toggles walking.
  autoWalk = false;

  press(code: string): void {
    if (this.held.has(code)) return; // ignore OS key repeats for toggles
    this.held.add(code);
    if (MOVEMENT.has(code)) this.autoWalk = false;
    switch (code) {
      case 'Space': this.jumpQueued = true; break;
      case 'KeyB': this.walking = !this.walking; break;
      case 'KeyL': this.setFreeLook(!this.freeLook); break;
      case 'Period': this.autoWalk = !this.autoWalk; break;
      case 'Digit0': this.toggleCamera(); break;
      case 'Home': this.resetQueued = true; break; // Development-only reset: R is wield in Veloren.
    }
  }
  release(code: string): void { this.held.delete(code); }
  clear(): void {
    this.held.clear();
    this.jumpQueued = false;
    this.rollQueued = false;
    this.resetQueued = false;
    this.autoWalk = false;
  }
  get sneaking(): boolean { return this.held.has('ShiftLeft') || this.held.has('ShiftRight'); }
  get rollingQueued(): boolean { return this.rollQueued; }
  queueRoll(): void { this.rollQueued = true; }

  private setFreeLook(value: boolean): void {
    if (this.freeLook === value) return;
    if (value) {
      this.movementYaw = this.yaw;
      this.savedPitch = this.pitch;
    } else {
      // Veloren restores camera orientation when free look is disabled.
      this.yaw = this.movementYaw;
      this.pitch = this.savedPitch;
    }
    this.freeLook = value;
  }
  toggleCamera(): void {
    if (this.cameraMode === 'third') {
      this.previousThirdDistance = Math.max(2.35, this.distance);
      this.cameraMode = 'first';
      this.distance = 0.1;
    } else {
      this.cameraMode = 'third';
      this.distance = this.previousThirdDistance;
    }
  }
  look(dx: number, dy: number): void {
    this.yaw -= dx * 0.0026;
    this.pitch = clamp(this.pitch + dy * 0.0023, -1.48, 1.48);
  }
  zoom(deltaY: number): void {
    if (this.cameraMode === 'first') {
      if (deltaY > 0) {
        this.cameraMode = 'third';
        this.distance = 2.7;
        this.previousThirdDistance = 2.7;
      }
      return;
    }
    const next = this.distance + deltaY * 0.008;
    if (next < 2.35) {
      this.previousThirdDistance = 2.7;
      this.cameraMode = 'first';
      this.distance = 0.1;
    } else {
      this.distance = clamp(next, 2.35, 28);
      this.previousThirdDistance = this.distance;
    }
  }
  consume(tick: number): InputCommand {
    const fwdKey = Number(this.held.has('KeyW') || this.held.has('ArrowUp')) -
      Number(this.held.has('KeyS') || this.held.has('ArrowDown'));
    const forward = fwdKey + (fwdKey === 0 && this.autoWalk ? 1 : 0);
    const sideways = Number(this.held.has('KeyD') || this.held.has('ArrowRight')) -
      Number(this.held.has('KeyA') || this.held.has('ArrowLeft'));
    const yaw = this.freeLook ? this.movementYaw : this.yaw;
    const x = sideways * Math.cos(yaw) - forward * Math.sin(yaw);
    const z = -sideways * Math.sin(yaw) - forward * Math.cos(yaw);
    const command: InputCommand = {
      tick, moveX: x, moveZ: z, sprint: !this.walking && !this.sneaking,
      sneak: this.sneaking, jump: this.jumpQueued, roll: this.rollQueued,
      reset: this.resetQueued,
    };
    this.jumpQueued = false;
    this.rollQueued = false;
    this.resetQueued = false;
    return command;
  }
}
