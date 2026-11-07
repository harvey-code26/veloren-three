import * as THREE from 'three';
import './style.css';

// Rendering bootstrap only. Gameplay/simulation state will be separate in P1.
const root = document.querySelector<HTMLDivElement>('#app');
if (!root) throw new Error('Missing #app root');

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setClearColor(0xcfe5e0);
root.append(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
camera.position.set(5, 4, 7);
camera.lookAt(0, 0.5, 0);

scene.add(new THREE.HemisphereLight(0xffffff, 0x71827c, 2));
const sun = new THREE.DirectionalLight(0xffffff, 2);
sun.position.set(5, 8, 4);
scene.add(sun);

const ground = new THREE.Mesh(
  new THREE.BoxGeometry(8, 0.4, 8),
  new THREE.MeshStandardMaterial({ color: 0x8aa77c, roughness: 1 }),
);
ground.position.y = -0.2;
scene.add(ground);

const marker = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshStandardMaterial({ color: 0xd9a16e, roughness: 0.85 }),
);
marker.position.y = 0.5;
scene.add(marker);

const overlay = document.createElement('aside');
overlay.className = 'overlay';
overlay.innerHTML = '<strong>Veloren Three</strong><span>P0 scaffold · renderer bootstrap</span><small>Movement, physics and world generation: not implemented</small>';
root.append(overlay);

function resize(): void {
  const width = Math.max(1, window.innerWidth);
  const height = Math.max(1, window.innerHeight);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
}
window.addEventListener('resize', resize);
resize();

function animate(): void {
  marker.rotation.y += 0.004; // Visual diagnostic, not gameplay simulation.
  renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);
