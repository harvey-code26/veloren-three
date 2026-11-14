import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import { VOXLoader } from 'three/addons/loaders/VOXLoader.js';

const root=resolve(import.meta.dirname,'..');
const manifest=JSON.parse(await readFile(resolve(root,'assets/veloren-human-female.json'),'utf8'));
const loader=new VOXLoader();
const byId=new Map();
for(const asset of manifest.files){
  const file=await readFile(resolve(root,'public/veloren',asset.path));
  const arr=file.buffer.slice(file.byteOffset,file.byteOffset+file.byteLength);
  const chunks=loader.parse(arr);
  assert.ok(chunks?.length>=1, asset.path+' has no VOX models');
  const chunk=chunks[0];
  assert.ok(chunk.data?.length>0 && chunk.data.length%4===0,asset.path+' has bad XYZI data');
  assert.ok(chunk.size.x>0 && chunk.size.y>0 && chunk.size.z>0,asset.path+' invalid size');
  for(let i=0;i<chunk.data.length;i+=4){
    const [x,y,z,color]=chunk.data.slice(i,i+4);
    assert.ok(x<chunk.size.x && y<chunk.size.y && z<chunk.size.z,asset.path+' invalid position');
    assert.ok(color>0 && color<256,asset.path+' bad color index');
  }
  byId.set(asset.id,chunk);
  console.log('[model]',asset.id,chunk.data.length/4+' voxels',chunk.size);
}
const plan=[
  ['head',[-7,-1,-2],[0,-2,17.5]],
  ['eyes',[-5,6,0],[0,-2,17.5]],
  ['hair',[-8,-5,-2],[0,-2,17.5]],
  ['chest',[-7,-3.5,1],[0,0,8]],
  ['belt',[-5,-3.5,2],[0,0,6]],
  ['pants',[-5,-3.5,0],[0,0,3]],
  ['hand',[-1.5,-1.5,-2.5],[-7,-.25,8.5]],
  ['hand',[-1.5,-1.5,-2.5],[7,-.25,8.5]],
  ['foot',[-2.5,-3.5,-2],[-3.4,.5,2]],
  ['foot',[-2.5,-3.5,-2],[3.4,.5,2]],
  ['shoulder',[-4,-3.5,0],[-5,0,13]],
  ['shoulder',[-1,-3.5,0],[5,0,13]],
];
const mins=[Infinity,Infinity,Infinity],maxs=[-Infinity,-Infinity,-Infinity];
let n=0;
for(const [id,off,pivot] of plan){
  const chunk=byId.get(id);assert.ok(chunk,'Missing rig segment '+id);
  for(let i=0;i<chunk.data.length;i+=4){
    for(let axis=0;axis<3;axis++){
      const v=chunk.data[i+axis]+off[axis]+pivot[axis];
      mins[axis]=Math.min(mins[axis],v);
      maxs[axis]=Math.max(maxs[axis],v+1);
    }
    n++;
  }
}
assert.equal(plan.length,12);
assert.equal(n,2249,'Expected stable original character model voxel count');
assert.ok(maxs[2]-mins[2]>20 && maxs[2]-mins[2]<35,'Model height out of range');
assert.ok(maxs[0]-mins[0]>10 && maxs[0]-mins[0]<25,'Model width out of range');
assert.ok(mins[2]>=-0.001,'Feet extend below ground');
console.log('[model] original 12-piece character verified', { voxels:n, min:mins, max:maxs });
