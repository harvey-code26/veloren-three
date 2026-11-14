import type { InputCommand } from '../core/types.ts';
import { VelorenControls, type CameraMode } from './VelorenControls.ts';

/** DOM adapter for the Veloren keyboard profile. Presses are consumed once/tick. */
export class InputController {
  private readonly controls = new VelorenControls();
  private readonly canvas: HTMLCanvasElement;
  onToggleDebug: (() => void) | undefined;
  onToggleControls: (() => void) | undefined;
  private ignoreInitialMouseDelta = false;
  private pointerLockGraceUntil = 0;
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
    canvas.addEventListener('mousedown', this.mouseDown);
    canvas.addEventListener('contextmenu', this.contextMenu);
  }
  get yaw(): number { return this.controls.yaw; }
  get pitch(): number { return this.controls.pitch; }
  get distance(): number { return this.controls.distance; }
  get cameraMode(): CameraMode { return this.controls.cameraMode; }
  get freeLook(): boolean { return this.controls.freeLook; }
  get walking(): boolean { return this.controls.walking; }
  get autoWalk(): boolean { return this.controls.autoWalk; }
  get sneaking(): boolean { return this.controls.sneaking; }

  private keydown = (e: KeyboardEvent) => {
    const managed = ['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight',
      'Digit0','Period','Comma','KeyB','KeyL','F1','F3','Home'];
    if (managed.includes(e.code)) e.preventDefault();
    if (e.repeat && ['F1','F3','Comma'].includes(e.code)) return;
    if (e.code === 'F1') { this.onToggleControls?.(); return; }
    if (e.code === 'F3') { this.onToggleDebug?.(); return; }
    if (e.code === 'Comma') {
      if (document.pointerLockElement === this.canvas) document.exitPointerLock();
      else this.lockPointer();
      return;
    }
    this.controls.press(e.code);
  };
  private keyup = (e: KeyboardEvent) => this.controls.release(e.code);
  private clear = () => this.controls.clear();
  private visibility = () => { if (document.hidden) this.clear(); };
  private pointerLockChanged = () => {
    if (document.pointerLockElement === this.canvas) {
      this.ignoreInitialMouseDelta = true;
      this.pointerLockGraceUntil = performance.now() + 180;
    }
    else { this.ignoreInitialMouseDelta = false; this.clear(); }
  };
  private mouseMove = (e: MouseEvent) => {
    if (document.pointerLockElement === this.canvas) {
      // The first delta after pointer lock can be a bogus large cursor warp.
      if (this.ignoreInitialMouseDelta) { this.ignoreInitialMouseDelta = false; return; }
      if (performance.now() < this.pointerLockGraceUntil) return;
      // OS/browser cursor warps can yield a single very large delta even
      // after the initial grace period. Ignore implausible spikes; normal
      // motion remains unmodified.
      if (Math.abs(e.movementX)>120 || Math.abs(e.movementY)>120) return;
      this.controls.look(e.movementX, e.movementY);
    }
  };
  private lockPointer(): void {
    void Promise.resolve(this.canvas.requestPointerLock?.()).catch(() => {});
  }
  private click = () => this.lockPointer();
  private wheel = (e: WheelEvent) => { e.preventDefault(); this.controls.zoom(e.deltaY); };
  private mouseDown = (e: MouseEvent) => {
    if (e.button !== 1) return;
    e.preventDefault();
    this.controls.queueRoll(); // Veloren middle-click roll, simplified P1 movement.
  };
  private contextMenu = (e: MouseEvent) => e.preventDefault();
  consume(tick: number): InputCommand { return this.controls.consume(tick); }
  dispose(): void {
    window.removeEventListener('keydown', this.keydown);
    window.removeEventListener('keyup', this.keyup);
    window.removeEventListener('blur', this.clear);
    document.removeEventListener('visibilitychange', this.visibility);
    document.removeEventListener('pointerlockchange', this.pointerLockChanged);
    document.removeEventListener('mousemove', this.mouseMove);
    this.canvas.removeEventListener('click', this.click);
    this.canvas.removeEventListener('wheel', this.wheel);
    this.canvas.removeEventListener('mousedown', this.mouseDown);
    this.canvas.removeEventListener('contextmenu', this.contextMenu);
  }
}
