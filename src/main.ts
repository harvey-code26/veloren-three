import * as THREE from 'three';
import { FixedStepClock } from './core/FixedStepClock.ts';
import { Simulation } from './core/Simulation.ts';
import { InputController } from './input/InputController.ts';
import { FixtureCollisionWorld } from './physics/CollisionWorld.ts';
import { addTestGround, createTestAvatar } from './render/TestScene.ts';
import { createVelorenCharacter, type AvatarVisual } from './render/VelorenCharacter.ts';
import { dampYaw, shortestYaw } from './render/CharacterMotion.ts';
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
const placeholder = createTestAvatar(scene);
let avatar: AvatarVisual | null = null;
placeholder.group.visible = false;
let avatarReady = false;
const orbit = new ThirdPersonCamera();
const clock = new FixedStepClock(60, 5);
const simulation = new Simulation(new FixtureCollisionWorld(TEST_GROUND.map(f => f.box)));
const input = new InputController(renderer.domElement);

const overlay = document.createElement('div');
overlay.className = 'hud';
overlay.innerHTML = `
  <section class="panel brand"><small>VE L O R E N · THREE</small><h1>底层运动测试场</h1>
  <p>P1.3 · 原版 VOX 人物 + 独立步态、空中及翻滚动作。</p><p id="asset-status" aria-live="polite">正在加载原作模型...</p></section>
  <section id="debug" class="panel debug"><h2>模拟状态 <kbd>F3</kbd></h2><pre id="metrics">初始化中</pre></section>
  <section class="panel controls"><strong>操作说明</strong><p><kbd>W A S D</kbd> 移动　<kbd>Space</kbd> 跳跃　<kbd>B</kbd> 切换步行</p>
  <p>鼠标控制视角、滚轮缩放至第一人称；<kbd>0</kbd> 切换第一/第三人称；<kbd>,</kbd> 释放/捕获鼠标</p>
  <p><kbd>B</kbd> 行走切换　<kbd>Shift</kbd> 潜行　<kbd>L</kbd> 自由观察　<kbd>.</kbd> 自动前进</p>
  <p>鼠标中键 简化翻滚　<kbd>F1</kbd> 帮助　<kbd>F3</kbd> 调试　<kbd>Home</kbd> 测试复位</p>
  <p><kbd>E</kbd> 交互 / <kbd>R</kbd> 收放武器 / <kbd>Ctrl</kbd> 滑翔：已预留，尚未实现</p></section>`;
app.appendChild(overlay);
const controlsPanel = overlay.querySelector<HTMLElement>('.controls');
const assetStatus = overlay.querySelector<HTMLElement>('#asset-status');
const debugPanel = overlay.querySelector<HTMLElement>('#debug');
const metrics = overlay.querySelector<HTMLElement>('#metrics');
if (!debugPanel || !metrics || !controlsPanel || !assetStatus) throw new Error('Missing diagnostics');
input.onToggleDebug = () => { debugPanel.hidden = !debugPanel.hidden; };
input.onToggleControls = () => { controlsPanel.hidden = !controlsPanel.hidden; };

void createVelorenCharacter().then(real => {
  scene.remove(placeholder.group); avatar = real; scene.add(real.group); avatarReady = true;
  assetStatus!.textContent = '原作人物装配完成 · Human Female / Cloth Blue';
}).catch(error => {
  console.error('Veloren original asset load failed', error);
  avatarReady = true; assetStatus!.classList.add('asset-error');
  assetStatus!.textContent = '原作资源加载失败，已显示测试占位人物';
});

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
let facingYaw=0;
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
    const command=input.consume(simulation.snapshot().tick+1);
    if (command.reset) { avatar?.reset(); facingYaw=input.yaw; }
    simulation.step(command,step);
  });
  simulationMs = performance.now() - start;
  const state = simulation.snapshot();
  renderPosition.set(
    THREE.MathUtils.lerp(state.previous.x, state.position.x, result.alpha),
    THREE.MathUtils.lerp(state.previous.y, state.position.y, result.alpha),
    THREE.MathUtils.lerp(state.previous.z, state.position.z, result.alpha),
  );
  const display = avatar?.group ?? placeholder.group;
  display.position.copy(renderPosition);
  display.visible = avatarReady && input.cameraMode !== 'first';
  const speed = Math.hypot(state.velocity.x,state.velocity.z);
  if (speed > 0.16) {
    facingYaw = dampYaw(facingYaw,Math.atan2(-state.velocity.x,-state.velocity.z),14,dt);
  } else if (input.cameraMode === 'first' && !input.freeLook) {
    facingYaw = dampYaw(facingYaw,input.yaw,14,dt);
  }
  display.rotation.y=facingYaw;
  elapsed += Math.min(dt,0.05);
  const forward=-Math.sin(facingYaw)*state.velocity.x-Math.cos(facingYaw)*state.velocity.z;
  const strafe=Math.cos(facingYaw)*state.velocity.x-Math.sin(facingYaw)*state.velocity.z;
  const pose=avatar?.animate({
    speed,forward,strafe,verticalSpeed:state.velocity.y,grounded:state.grounded,
    rolling:state.rolling,sneaking:input.sneaking,walking:input.walking,
    lookYaw:shortestYaw(facingYaw,input.yaw),
  },dt);
  if (!avatar && avatarReady) placeholder.animate(state.grounded?speed:0,elapsed);
  orbit.update({ x: renderPosition.x, y: renderPosition.y, z: renderPosition.z }, input.yaw, input.pitch, input.distance, obstacles, input.cameraMode, dt);
  renderer.render(scene, orbit.camera);

  frames++; statsTime += dt;
  if (statsTime >= 0.4) {
    fps = Math.round(frames / statsTime);
    frames = 0; statsTime = 0;
    metrics!.textContent = `动作              ${pose?.state ?? '模型加载中'}\n步态相位          ${pose?.phase.toFixed(2) ?? '-'}\n角色朝向          ${(facingYaw*180/Math.PI).toFixed(1)}°\n镜头              ${input.cameraMode === 'first' ? '第一人称' : '第三人称'}\n视角距离          ${input.distance.toFixed(1)} m\n行走模式          ${input.sneaking ? '潜行' : input.walking ? '步行' : '奔跑'}\n自由观察 / 自动走  ${input.freeLook ? '开启' : '关闭'} / ${input.autoWalk ? '开启' : '关闭'}\n翻滚              ${state.rolling ? '进行中' : '未触发'}\nFPS             ${fps}\n模拟 tick        ${state.tick} (目标 60 Hz)\n本帧模拟步数      ${result.steps}\n模拟耗时          ${simulationMs.toFixed(2)} ms\n位置 x/y/z        ${state.position.x.toFixed(2)} / ${state.position.y.toFixed(2)} / ${state.position.z.toFixed(2)}\n水平速度          ${speed.toFixed(2)} m/s\n竖直速度          ${state.velocity.y.toFixed(2)} m/s\n接地              ${state.grounded ? '是' : '否'}\n累计碰撞          ${state.collisions}\n丢弃模拟时间      ${clock.droppedSeconds.toFixed(2)} s\n绘制调用          ${renderer.info.render.calls}`;
  }
}
window.addEventListener('blur', () => { previousFrameTime = null; clock.reset(); });
document.addEventListener('visibilitychange', () => { if (document.hidden) { previousFrameTime = null; clock.reset(); } });
renderer.setAnimationLoop(frame);
