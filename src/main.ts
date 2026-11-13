import * as THREE from 'three';
import { FixedStepClock } from './core/FixedStepClock.ts';
import { Simulation } from './core/Simulation.ts';
import { InputController } from './input/InputController.ts';
import { FixtureCollisionWorld } from './physics/CollisionWorld.ts';
import { addTestGround, createTestAvatar } from './render/TestScene.ts';
import { ThirdPersonCamera } from './render/ThirdPersonCamera.ts';
import { TEST_GROUND } from './world/TestGround.ts';
import './style.css';

const app = document.querySelector<HTMLElement>('#app');
if (!app) throw new Error('Missing #app');
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0xbed8d6);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
app.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xc0dfde);
scene.fog = new THREE.Fog(0xc0dfde, 30, 90);
scene.add(new THREE.HemisphereLight(0xf2f9ff, 0x718069, 2.25));
const sun = new THREE.DirectionalLight(0xffeed1, 2.4);
sun.position.set(14, 23, 9);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -34; sun.shadow.camera.right = 34;
sun.shadow.camera.top = 34; sun.shadow.camera.bottom = -34;
sun.shadow.normalBias = 0.025;
scene.add(sun);

const obstacles = addTestGround(scene);
const avatar = createTestAvatar(scene);
const orbit = new ThirdPersonCamera();
const clock = new FixedStepClock(60, 5);
const simulation = new Simulation(new FixtureCollisionWorld(TEST_GROUND.map(f => f.box)));
const input = new InputController(renderer.domElement);

const overlay = document.createElement('div');
overlay.className = 'hud';
overlay.innerHTML = `
  <section class="panel brand"><small>VE L O R E N · THREE</small><h1>底层运动测试场</h1>
  <p>P1 · 运动学角色 + 手工碰撞体。体素世界、战斗、资源尚未接入。</p></section>
  <section id="debug" class="panel debug"><h2>模拟状态 <kbd>F3</kbd></h2><pre id="metrics">初始化中</pre></section>
  <section class="panel controls"><strong>操作说明</strong><p><kbd>W A S D</kbd> 移动　<kbd>Space</kbd> 跳跃　<kbd>Shift</kbd> 冲刺</p>
  <p>点击画面锁定鼠标并转动镜头；<kbd>Esc</kbd> 释放；<kbd>Q E</kbd> 备用转向；滚轮调距离</p>
  <p><kbd>R</kbd> 返回出生点　<kbd>F3</kbd> 开关调试面板</p></section>`;
app.appendChild(overlay);
const debugPanel = overlay.querySelector<HTMLElement>('#debug');
const metrics = overlay.querySelector<HTMLElement>('#metrics');
if (!debugPanel || !metrics) throw new Error('Missing diagnostics');
input.onToggleDebug = () => { debugPanel.hidden = !debugPanel.hidden; };

function resize(): void {
  const w = Math.max(1, window.innerWidth); const h = Math.max(1, window.innerHeight);
  orbit.resize(w, h);
  renderer.setSize(w, h, false);
}
window.addEventListener('resize', resize);
resize();

let previousFrameTime: number | null = null;
let frames = 0;
let statsTime = 0;
let elapsed = 0;
let fps = 0;
let simulationMs = 0;
const renderPosition = new THREE.Vector3();
function frame(nowMs: number): void {
  if (document.hidden) {
    previousFrameTime = null;
    clock.reset();
    return;
  }
  const dt = previousFrameTime === null ? 0 : Math.max(0, (nowMs - previousFrameTime) / 1000);
  previousFrameTime = nowMs;
  const start = performance.now();
  const result = clock.advance(dt, step => {
    simulation.step(input.consume(simulation.snapshot().tick + 1), step);
  });
  simulationMs = performance.now() - start;
  const state = simulation.snapshot();
  renderPosition.set(
    THREE.MathUtils.lerp(state.previous.x, state.position.x, result.alpha),
    THREE.MathUtils.lerp(state.previous.y, state.position.y, result.alpha),
    THREE.MathUtils.lerp(state.previous.z, state.position.z, result.alpha),
  );
  avatar.group.position.copy(renderPosition);
  const speed = Math.hypot(state.velocity.x, state.velocity.z);
  if (speed > 0.2) avatar.group.rotation.y = Math.atan2(-state.velocity.x, -state.velocity.z);
  elapsed += Math.min(dt, 0.1) * (state.grounded ? 1 : 0);
  avatar.animate(state.grounded ? speed : 0, elapsed);
  orbit.update({ x: renderPosition.x, y: renderPosition.y, z: renderPosition.z }, input.yaw, input.pitch, input.distance, obstacles);
  renderer.render(scene, orbit.camera);

  frames++; statsTime += dt;
  if (statsTime >= 0.4) {
    fps = Math.round(frames / statsTime);
    frames = 0; statsTime = 0;
    metrics!.textContent = `FPS             ${fps}\n模拟 tick        ${state.tick} (目标 60 Hz)\n本帧模拟步数      ${result.steps}\n模拟耗时          ${simulationMs.toFixed(2)} ms\n位置 x/y/z        ${state.position.x.toFixed(2)} / ${state.position.y.toFixed(2)} / ${state.position.z.toFixed(2)}\n水平速度          ${speed.toFixed(2)} m/s\n竖直速度          ${state.velocity.y.toFixed(2)} m/s\n接地              ${state.grounded ? '是' : '否'}\n累计碰撞          ${state.collisions}\n丢弃模拟时间      ${clock.droppedSeconds.toFixed(2)} s\n绘制调用          ${renderer.info.render.calls}`;
  }
}
window.addEventListener('blur', () => { previousFrameTime = null; clock.reset(); });
document.addEventListener('visibilitychange', () => { if (document.hidden) { previousFrameTime = null; clock.reset(); } });
renderer.setAnimationLoop(frame);
