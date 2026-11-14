import * as THREE from 'three';
import type { Vec3 } from '../core/types.ts';
import type { CameraMode } from '../input/VelorenControls.ts';

/** Veloren-inspired third-person follow, first-person and obstruction handling. */
export class ThirdPersonCamera {
  readonly camera = new THREE.PerspectiveCamera(1.1 * 180 / Math.PI, 1, 0.0625, 180);
  private readonly raycaster = new THREE.Raycaster();
  private readonly target = new THREE.Vector3();
  private readonly desired = new THREE.Vector3();
  private readonly direction = new THREE.Vector3();
  private initialized = false;
  private smoothedDistance = 10;
  private avatarTooClose = false;
  get effectiveDistance(): number { return this.smoothedDistance; }
  get shouldHideAvatar(): boolean { return this.avatarTooClose; }
  update(
    position: Vec3, yaw: number, pitch: number, distance: number,
    obstacles: THREE.Object3D[], mode: CameraMode = 'third', dt = 1 / 60,
  ): void {
    const first = mode === 'first';
    this.desired.set(position.x, position.y + (first ? 1.58 : 1.36), position.z);
    if (!this.initialized || first) {
      this.target.copy(this.desired);
      this.initialized = true;
    } else {
      this.target.lerp(this.desired, 1 - Math.exp(-Math.max(0, dt) * 12));
    }
    if (first) {
      this.smoothedDistance = 0;
      this.avatarTooClose = true;
      this.direction.set(-Math.sin(yaw) * Math.cos(pitch), -Math.sin(pitch),
        -Math.cos(yaw) * Math.cos(pitch));
      this.camera.position.copy(this.target);
      this.camera.lookAt(this.target.clone().add(this.direction));
      return;
    }
    // Behind the player, matching movement direction. Positive pitch = look down.
    this.direction.set(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch),
      Math.cos(yaw) * Math.cos(pitch)).normalize();
    this.raycaster.set(this.target, this.direction);
    this.raycaster.near = 0;
    this.raycaster.far = distance;
    const hits = this.raycaster.intersectObjects(obstacles, false);
    const safe = hits.length ? Math.max(0.18, hits[0].distance - 0.24) : distance;
    // Move inward immediately to avoid wall clipping, outward with damping
    // to prevent abrupt zoom / head-sized avatar closeups.
    if (safe < this.smoothedDistance) this.smoothedDistance = safe;
    else this.smoothedDistance += (safe - this.smoothedDistance) *
      (1 - Math.exp(-Math.min(0.05, Math.max(0, dt)) * 9));
    this.avatarTooClose = this.smoothedDistance < 1.75;
    this.camera.position.copy(this.target).addScaledVector(this.direction, this.smoothedDistance);
    this.camera.lookAt(this.target);
  }
  resize(width: number, height: number): void {
    this.camera.aspect = Math.max(1, width) / Math.max(1, height);
    this.camera.updateProjectionMatrix();
  }
}
