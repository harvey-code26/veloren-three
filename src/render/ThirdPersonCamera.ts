import * as THREE from 'three';
import type { Vec3 } from '../core/types.ts';

/** Rendering-only orbit camera with a ray-tested obstruction check. */
export class ThirdPersonCamera {
  readonly camera = new THREE.PerspectiveCamera(60, 1, 0.05, 140);
  private readonly raycaster = new THREE.Raycaster();
  private readonly target = new THREE.Vector3();
  private readonly direction = new THREE.Vector3();

  update(position: Vec3, yaw: number, pitch: number, distance: number, obstacles: readonly THREE.Object3D[]): void {
    this.target.set(position.x, position.y + 1.34, position.z);
    this.direction.set(
      Math.sin(yaw) * Math.cos(pitch),
      Math.sin(pitch),
      Math.cos(yaw) * Math.cos(pitch),
    ).normalize();
    this.raycaster.set(this.target, this.direction);
    this.raycaster.near = 0;
    this.raycaster.far = distance;
    const hits = this.raycaster.intersectObjects(obstacles, false);
    const safeDistance = hits.length > 0 ? Math.max(0.3, hits[0].distance - 0.2) : distance;
    this.camera.position.copy(this.target).addScaledVector(this.direction, safeDistance);
    this.camera.lookAt(this.target);
  }

  resize(width: number, height: number): void {
    this.camera.aspect = Math.max(1, width) / Math.max(1, height);
    this.camera.updateProjectionMatrix();
  }
}
