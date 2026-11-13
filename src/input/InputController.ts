import type { InputCommand } from '../core/types.ts';

/** Browser events are sampled exactly once for each simulation tick. */
export class InputController {
  private keys = new Set<string>();
  private jumpQueued = false;
  private resetQueued = false;
  yaw = 0;
  pitch = 0.37;
  distance = 7;
  onToggleDebug: (() => void) | undefined;

  private readonly canvas: HTMLCanvasElement;
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    window.addEventListener('keydown', this.keydown);
    window.addEventListener('keyup', this.keyup);
    window.addEventListener('blur', this.clear);
    document.addEventListener('visibilitychange', this.visibility);
    document.addEventListener('pointerlockchange', this.pointerLockChanged);
    document.addEventListener('mousemove', this.mouseMove);
    canvas.addEventListener('click', this.click);
    canvas.addEventListener('wheel', this.wheel, { passive: false });
  }
  private keydown = (e: KeyboardEvent) => {
    if (e.repeat && (e.code === 'Space' || e.code === 'KeyR' || e.code === 'F3')) return;
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
    if (e.code === 'Space' && !this.keys.has('Space')) this.jumpQueued = true;
    if (e.code === 'KeyR') this.resetQueued = true;
    if (e.code === 'F3') this.onToggleDebug?.();
    this.keys.add(e.code);
  };
  private keyup = (e: KeyboardEvent) => { this.keys.delete(e.code); };
  private clear = () => { this.keys.clear(); this.jumpQueued = false; this.resetQueued = false; };
  private visibility = () => { if (document.hidden) this.clear(); };
  private pointerLockChanged = () => { if (document.pointerLockElement !== this.canvas) this.clear(); };
  private mouseMove = (e: MouseEvent) => {
    if (document.pointerLockElement !== this.canvas) return;
    this.yaw -= e.movementX * 0.003;
    this.pitch = Math.max(-0.12, Math.min(1.1, this.pitch + e.movementY * 0.0023));
  };
  private click = () => { void this.canvas.requestPointerLock?.(); };
  private wheel = (e: WheelEvent) => {
    e.preventDefault();
    this.distance = Math.max(3, Math.min(12, this.distance + e.deltaY * 0.008));
  };

  consume(tick: number): InputCommand {
    if (this.keys.has('KeyQ')) this.yaw += 0.035;
    if (this.keys.has('KeyE')) this.yaw -= 0.035;
    const forward = Number(this.keys.has('KeyW') || this.keys.has('ArrowUp')) - Number(this.keys.has('KeyS') || this.keys.has('ArrowDown'));
    const sideways = Number(this.keys.has('KeyD') || this.keys.has('ArrowRight')) - Number(this.keys.has('KeyA') || this.keys.has('ArrowLeft'));
    const x = sideways * Math.cos(this.yaw) - forward * Math.sin(this.yaw);
    const z = -sideways * Math.sin(this.yaw) - forward * Math.cos(this.yaw);
    const jump = this.jumpQueued;
    const reset = this.resetQueued;
    this.jumpQueued = false;
    this.resetQueued = false;
    return { tick, moveX: x, moveZ: z, sprint: this.keys.has('ShiftLeft') || this.keys.has('ShiftRight'), jump, reset };
  }
  dispose(): void {
    window.removeEventListener('keydown', this.keydown);
    window.removeEventListener('keyup', this.keyup);
    window.removeEventListener('blur', this.clear);
    document.removeEventListener('visibilitychange', this.visibility);
    document.removeEventListener('pointerlockchange', this.pointerLockChanged);
    document.removeEventListener('mousemove', this.mouseMove);
    this.canvas.removeEventListener('click', this.click);
    this.canvas.removeEventListener('wheel', this.wheel);
  }
}
