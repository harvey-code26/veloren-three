import test from 'node:test';
import assert from 'node:assert/strict';
import { FixedStepClock } from '../src/core/FixedStepClock.ts';
import { Simulation } from '../src/core/Simulation.ts';
import { FixtureCollisionWorld, playerBounds, sweepAxis } from '../src/physics/CollisionWorld.ts';
import { TEST_GROUND } from '../src/world/TestGround.ts';

const world = new FixtureCollisionWorld(TEST_GROUND.map(f => f.box));
const input = (tick, overrides = {}) => ({ tick, moveX: 0, moveZ: 0, sprint: false, jump: false, reset: false, ...overrides });

for (const hz of [30, 60, 144]) {
  test(`fixed clock runs exactly 600 ticks over 10s at ${hz}fps`, () => {
    const clock = new FixedStepClock();
    for (let f = 0; f < 10 * hz; f++) clock.advance(1 / hz, () => {});
    assert.equal(clock.simulatedTicks, 600);
  });
}
test('single-frame 1-second stall is capped to 5 ticks, reset discards backlog', () => {
  const clock = new FixedStepClock();
  const result = clock.advance(1, () => {});
  assert.equal(result.steps, 5);
  assert.ok(result.dropped > 0.9);
  clock.reset();
  assert.equal(clock.advance(0, () => {}).steps, 0);
});

test('identical input sequence is independent of frame cadence', () => {
  const endpoints = [30, 60, 144].map(hz => {
    const sim = new Simulation(world);
    const clock = new FixedStepClock();
    for (let i = 0; i < 10 * hz; i++) {
      clock.advance(1 / hz, dt => {
        const tick = sim.snapshot().tick + 1;
        sim.step(input(tick, { moveZ: -1, jump: tick === 15, sprint: tick > 120 }), dt);
      });
    }
    return sim.snapshot();
  });
  for (const s of endpoints) {
    assert.equal(s.tick, 600);
    assert.ok(Math.abs(s.position.x - endpoints[0].position.x) < 1e-6);
    assert.ok(Math.abs(s.position.y - endpoints[0].position.y) < 1e-6);
    assert.ok(Math.abs(s.position.z - endpoints[0].position.z) < 1e-6);
  }
});

test('standing on the floor and jumping only once per edge press', () => {
  const sim = new Simulation(world);
  for (let tick = 1; tick <= 6; tick++) sim.step(input(tick), 1 / 60);
  assert.equal(sim.snapshot().grounded, true);
  sim.step(input(7, { jump: true }), 1 / 60);
  assert.ok(sim.snapshot().velocity.y > 7);
  sim.step(input(8), 1 / 60);
  assert.ok(sim.snapshot().velocity.y < 8.4);
  assert.equal(sim.snapshot().grounded, false);
});

test('sweep cannot tunnel through a wall at high speed', () => {
  const pos = { x: 0, y: 0, z: 8 };
  const hit = sweepAxis(pos, 'z', -30, world);
  assert.equal(hit.collided, true);
  assert.ok(hit.distance > -30);
});

test('head collision stops upward travel', () => {
  const bounds = playerBounds({ x: 0, y: 0, z: -12.45 });
  assert.ok(bounds.max.y < 2.3);
  const hit = sweepAxis({ x: 0, y: 0, z: -12.45 }, 'y', 2, world);
  assert.equal(hit.collided, true);
  assert.ok(hit.distance < 1);
});

test('reset preserves tick order and places player at spawn', () => {
  const sim = new Simulation(world);
  sim.step(input(1, { moveZ: -1 }), 1 / 60);
  sim.step(input(2, { reset: true }), 1 / 60);
  const snapshot = sim.snapshot();
  assert.equal(snapshot.tick, 2);
  assert.equal(snapshot.position.z, 8);
});
