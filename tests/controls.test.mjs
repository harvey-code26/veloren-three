import test from 'node:test';
import assert from 'node:assert/strict';
import { VelorenControls } from '../src/input/VelorenControls.ts';
import { Simulation } from '../src/core/Simulation.ts';
import { FixtureCollisionWorld } from '../src/physics/CollisionWorld.ts';
import { TEST_GROUND } from '../src/world/TestGround.ts';

test('Veloren profile: default is run; B toggles walking once per key press', () => {
  const controls = new VelorenControls();
  assert.equal(controls.consume(1).sprint, true);
  controls.press('KeyB');
  assert.equal(controls.consume(2).sprint, false);
  controls.press('KeyB'); // OS key repeat
  assert.equal(controls.consume(3).sprint, false);
  controls.release('KeyB'); controls.press('KeyB');
  assert.equal(controls.consume(4).sprint, true);
});

test('Shift means sneak, not sprint, and R / E are reserved', () => {
  const controls = new VelorenControls();
  controls.press('ShiftLeft');
  const c = controls.consume(1);
  assert.equal(c.sneak, true);
  assert.equal(c.sprint, false);
  controls.press('KeyR'); controls.press('KeyE');
  assert.equal(controls.consume(2).reset, false);
});

test('L free look freezes movement bearing and restores view on exit', () => {
  const controls = new VelorenControls();
  controls.press('KeyW');
  const before = controls.consume(1);
  controls.press('KeyL');
  controls.look(300, -80);
  const detached = controls.consume(2);
  assert.ok(Math.abs(before.moveX-detached.moveX)<1e-9);
  assert.ok(Math.abs(before.moveZ-detached.moveZ)<1e-9);
  assert.ok(Math.abs(controls.yaw)>0.1);
  controls.release('KeyL'); controls.press('KeyL');
  assert.ok(Math.abs(controls.yaw)<1e-9);
  assert.equal(controls.freeLook, false);
});

test('0 and wheel switch camera modes between third and first person', () => {
  const controls = new VelorenControls();
  assert.equal(controls.cameraMode, 'third');
  assert.equal(controls.distance, 10);
  controls.press('Digit0');
  assert.equal(controls.cameraMode, 'first');
  controls.release('Digit0'); controls.press('Digit0');
  assert.equal(controls.cameraMode, 'third');
  controls.zoom(-2000);
  assert.equal(controls.cameraMode, 'first');
  controls.zoom(100);
  assert.equal(controls.cameraMode, 'third');
});

test('period starts auto-walk; movement key interrupts it', () => {
  const controls = new VelorenControls();
  controls.press('Period');
  const c = controls.consume(1);
  assert.ok(Math.abs(c.moveZ + 1)<1e-9);
  controls.press('KeyA');
  const d = controls.consume(2);
  assert.equal(controls.autoWalk, false);
  assert.ok(Math.abs(d.moveX+1)<1e-9);
  assert.ok(Math.abs(d.moveZ)<1e-9);
});

test('jump and middle-roll use one-shot commands and clear on blur', () => {
  const controls = new VelorenControls();
  controls.press('Space'); controls.queueRoll();
  assert.equal(controls.consume(1).jump, true);
  assert.equal(controls.consume(2).roll, false);
  controls.release('Space'); controls.press('Space'); controls.clear();
  assert.equal(controls.consume(3).jump, false);
});

test('middle-roll performs a collision-aware timed burst, then stops', () => {
  const sim = new Simulation(new FixtureCollisionWorld(TEST_GROUND.map(x=>x.box)));
  for(let tick=1;tick<=8;tick++)sim.step({tick,moveX:0,moveZ:0,sprint:true,jump:false,reset:false},1/60);
  assert.equal(sim.snapshot().grounded,true);
  sim.step({tick:9,moveX:0,moveZ:1,sprint:true,jump:false,roll:true,reset:false},1/60);
  assert.equal(sim.snapshot().rolling,true);
  for(let tick=10;tick<=42;tick++)sim.step({tick,moveX:0,moveZ:0,sprint:true,jump:false,reset:false},1/60);
  assert.equal(sim.snapshot().rolling,false);
});
