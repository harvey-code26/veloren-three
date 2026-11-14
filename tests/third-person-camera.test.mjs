import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { ThirdPersonCamera } from '../src/render/ThirdPersonCamera.ts';

test('camera hides close-range avatar and returns to normal after obstruction clears',()=>{
  const camera=new ThirdPersonCamera();
  const box=new THREE.Mesh(new THREE.BoxGeometry(2,3,1));
  box.position.set(0,1.2,1.0);
  box.updateMatrixWorld(true);
  const origin={x:0,y:0,z:0};
  camera.update(origin,0,0.16,10,[box],'third',1/60);
  assert.ok(camera.effectiveDistance < 1.75);
  assert.equal(camera.shouldHideAvatar,true);
  for(let i=0;i<120;i++) camera.update(origin,0,0.16,10,[],'third',1/60);
  assert.ok(camera.effectiveDistance>8);
  assert.equal(camera.shouldHideAvatar,false);
});
test('first person must hide avatar and return to a safe third person range',()=>{
  const c=new ThirdPersonCamera();
  const o={x:0,y:0,z:0};
  c.update(o,0,0.1,0.1,[],'first',1/60);
  assert.equal(c.shouldHideAvatar,true);
  c.update(o,0,0.1,10,[],'third',1/60);
  assert.ok(c.effectiveDistance>0);
  for(let i=0;i<120;i++)c.update(o,0,0.1,10,[],'third',1/60);
  assert.ok(c.effectiveDistance>8);
  assert.equal(c.shouldHideAvatar,false);
});
