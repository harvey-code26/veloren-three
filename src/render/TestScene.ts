import * as THREE from 'three';
import { TEST_GROUND } from '../world/TestGround.ts';

/** Visuals are generated from the same fixture definitions used for collision. */
export function addTestGround(scene: THREE.Scene): THREE.Mesh[] {
  const colliders: THREE.Mesh[] = [];
  for (const fixture of TEST_GROUND) {
    const { min, max } = fixture.box;
    const geometry = new THREE.BoxGeometry(max.x - min.x, max.y - min.y, max.z - min.z);
    const material = new THREE.MeshStandardMaterial({ color: fixture.color, roughness: 0.92 });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = fixture.name;
    mesh.position.set((min.x + max.x) / 2, (min.y + max.y) / 2, (min.z + max.z) / 2);
    mesh.castShadow = fixture.name !== 'ground';
    mesh.receiveShadow = true;
    scene.add(mesh);
    colliders.push(mesh);
  }
  const grid = new THREE.GridHelper(52, 52, 0x69856d, 0x789b79);
  grid.position.y = 0.008;
  scene.add(grid);
  const axisMarker = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 0.08, 2),
    new THREE.MeshStandardMaterial({ color: 0xdabf7e }),
  );
  axisMarker.position.set(0, 0.045, 5);
  scene.add(axisMarker);
  return colliders;
}

export function createTestAvatar(scene: THREE.Scene): {
  group: THREE.Group;
  animate(speed: number, elapsed: number): void;
} {
  const group = new THREE.Group();
  const shirt = new THREE.MeshStandardMaterial({ color: 0x365f72, roughness: 0.9 });
  const skin = new THREE.MeshStandardMaterial({ color: 0xe7ba8a, roughness: 0.95 });
  const trouser = new THREE.MeshStandardMaterial({ color: 0x525565, roughness: 0.95 });
  function part(w: number, h: number, d: number, x: number, y: number, z: number, material: THREE.Material, parent: THREE.Object3D = group): THREE.Mesh {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    parent.add(mesh);
    return mesh;
  }
  part(0.7, 0.68, 0.4, 0, 1.04, 0, shirt);
  part(0.44, 0.44, 0.42, 0, 1.56, -0.03, skin);
  const armL = new THREE.Group(); const armR = new THREE.Group();
  armL.position.set(-0.46, 1.28, 0); armR.position.set(0.46, 1.28, 0);
  group.add(armL, armR);
  part(0.19, 0.58, 0.24, 0, -0.28, 0, shirt, armL);
  part(0.19, 0.58, 0.24, 0, -0.28, 0, shirt, armR);
  const legL = new THREE.Group(); const legR = new THREE.Group();
  legL.position.set(-0.18, 0.73, 0); legR.position.set(0.18, 0.73, 0);
  group.add(legL, legR);
  part(0.26, 0.69, 0.28, 0, -0.35, 0, trouser, legL);
  part(0.26, 0.69, 0.28, 0, -0.35, 0, trouser, legR);
  scene.add(group);
  return {
    group,
    animate(speed, elapsed) {
      const swing = Math.sin(elapsed * 10) * Math.min(0.62, speed * 0.08);
      legL.rotation.x = swing;
      legR.rotation.x = -swing;
      armL.rotation.x = -swing * 0.65;
      armR.rotation.x = swing * 0.65;
    },
  };
}
