import test from 'node:test';
import assert from 'node:assert/strict';
import { CharacterMotion, dampYaw, shortestYaw } from '../src/render/CharacterMotion.ts';

const neutral = (overrides={}) => ({
  speed:0, forward:0, strafe:0, verticalSpeed:0,
  grounded:true, rolling:false, sneaking:false, walking:false, lookYaw:0, ...overrides,
});
const close=(x,y,tol=1e-6)=>assert.ok(Math.abs(x-y)<tol,`Expected ${x} ≈ ${y}`);

test('idle breathing continues even if distance phase is stationary',()=>{
  const solver=new CharacterMotion();
  let a=solver.step(neutral(),1/60);
  for(let i=0;i<60;i++)solver.step(neutral(),1/60);
  const b=solver.step(neutral(),1/60);
  assert.equal(a.state,'idle');assert.equal(b.state,'idle');
  close(a.phase,b.phase);
  assert.ok(Math.abs(a.chestBob-b.chestBob)>0.05);
});
test('travel-driven phase stays consistent for 30/60/144 fps schedules',()=>{
  const poses=[];
  for(const rate of [30,60,144]){
    const s=new CharacterMotion();
    let last;
    for(let i=0;i<10*rate;i++)last=s.step(neutral({speed:5,forward:5}),1/rate);
    poses.push(last);
  }
  for(let i=1;i<poses.length;i++)close(shortestYaw(poses[0].phase,poses[i].phase),0,1e-5);
});
test('left and right feet alternate and never move downward from rest',()=>{
  const s=new CharacterMotion();
  for(let i=0;i<180;i++){
    const p=s.step(neutral({speed:8,forward:8}),1/60);
    assert.ok(p.leftFoot.lift>=0 && p.rightFoot.lift>=0);
    if(i>30){
      assert.ok(Math.abs(p.leftFoot.forward+p.rightFoot.forward)<1e-8);
      assert.ok(Math.abs(p.leftFoot.pitch+p.rightFoot.pitch)<1e-8);
    }
  }
});
test('walking backwards reverses fore-aft gait while preserving the limb identities',()=>{
  const run=new CharacterMotion(),back=new CharacterMotion();
  let a,b;for(let i=0;i<57;i++){a=run.step(neutral({speed:4,forward:4}),1/60);b=back.step(neutral({speed:4,forward:-4}),1/60);}
  close(a.leftFoot.forward,-b.leftFoot.forward);
  close(a.rightFoot.forward,-b.rightFoot.forward);
  assert.ok(a.leftFoot.lift>=0 && b.rightFoot.lift>=0);
});
test('rise, fall, landing and walk states transition cleanly',()=>{
  const s=new CharacterMotion();
  for(let i=0;i<15;i++)s.step(neutral(),1/60);
  let p=s.step(neutral({grounded:false,verticalSpeed:6}),1/60);assert.equal(p.state,'rise');
  for(let i=0;i<8;i++)s.step(neutral({grounded:false,verticalSpeed:4}),1/60);
  p=s.step(neutral({grounded:false,verticalSpeed:-3}),1/60);assert.equal(p.state,'fall');
  p=s.step(neutral(),1/60);assert.equal(p.state,'idle');assert.ok(p.landing>0);
  p=s.step(neutral({speed:2,forward:2,walking:true}),1/60);assert.equal(p.state,'walk');
  p=s.step(neutral({speed:2,forward:2,sneaking:true}),1/60);assert.equal(p.state,'sneak');
});
test('roll rotates one full turn and returns smoothly to zero',()=>{
  const s=new CharacterMotion();
  for(let i=0;i<5;i++)s.step(neutral(),1/60);
  let prev=0;
  for(let i=0;i<24;i++){
    const p=s.step(neutral({rolling:true}),1/60);
    assert.equal(p.state,'roll');
    assert.ok(p.rollAngle<=prev+1e-10);
    prev=p.rollAngle;
  }
  close(prev,-2*Math.PI,1e-6);
  close(s.step(neutral(),1/60).rollAngle,0);
});
test('shortest-arc facing avoids long wraparound turn',()=>{
  const from=Math.PI-0.01,to=-Math.PI+0.01;
  close(shortestYaw(from,to),0.02);
  let angle=from;
  for(let i=0;i<60;i++)angle=dampYaw(angle,to,12,1/60);
  assert.ok(Math.abs(shortestYaw(angle,to))<0.00001);
});
test('gait phase stays frozen when stationary, but resets on explicit reset',()=>{
  const s=new CharacterMotion();
  for(let i=0;i<70;i++)s.step(neutral({speed:4,forward:4}),1/60);
  const a=s.step(neutral(),1/60);
  for(let i=0;i<70;i++)s.step(neutral(),1/60);
  close(a.phase,s.step(neutral(),1/60).phase);
  s.reset();
  close(s.step(neutral(),1/60).phase,0);
});
