import * as THREE from 'three';
import { VOXLoader } from 'three/addons/loaders/VOXLoader.js';
import manifest from '../../assets/veloren-human-female.json';
import { CharacterMotion, type MotionInput, type CharacterPose } from './CharacterMotion.ts';

/** Original Veloren VOX pieces; simplified original-code Three.js articulated rig. */
export interface AvatarVisual {
  group: THREE.Group;
  animate(input: MotionInput, dt: number): CharacterPose;
  reset(): void;
}
type VoxChunk = {size:{x:number;y:number;z:number};data:Uint8Array;palette:number[]};
type Color3 = readonly [number, number, number];
const MODEL_PATHS = new Map(manifest.files.map(f=>[f.id,f.path]));
const originalColor = {
  skin:[228,173,146] as Color3, skinDark:[222,166,142] as Color3,
  skinLight:[239,182,153] as Color3, hair:[107,76,51] as Color3,
  eyeDark:[13,47,64] as Color3,eyeLight:[18,66,90] as Color3,
  eyeWhite:[255,255,255] as Color3,
};
const loader = new VOXLoader();
const geometry = new THREE.BoxGeometry(1,1,1);
const material = new THREE.MeshStandardMaterial({roughness:0.96,metalness:0,flatShading:true});
const matrix = new THREE.Matrix4();
const position = new THREE.Vector3();
const color = new THREE.Color();
const rot = new THREE.Quaternion();
const unit = new THREE.Vector3(1,1,1);
function pigment(i:number,rgba:number,kind:'material'|'hair'|'normal'):Color3{
  if(kind==='material'){
    const mapped:Record<number,Color3>={
      1:originalColor.skin,2:originalColor.hair,3:originalColor.eyeDark,
      4:originalColor.eyeLight,5:originalColor.skinDark,
      6:originalColor.skinLight,8:originalColor.eyeWhite,
    };
    if(mapped[i])return mapped[i];
  }
  const raw:Color3=[rgba&255,(rgba>>>8)&255,(rgba>>>16)&255];
  if(kind==='hair' && raw[0]===raw[1] && raw[1]===raw[2]){
    return originalColor.hair.map(c=>Math.min(255,Math.round(c*raw[0]/178))) as unknown as Color3;
  }
  return raw;
}
function meshVox(c:VoxChunk,kind:'material'|'hair'|'normal',mirror=false):THREE.InstancedMesh{
  if(!c?.data || !c?.size || c.data.length%4!==0 || !c.data.length)throw Error('Invalid Veloren VOX');
  const mesh=new THREE.InstancedMesh(geometry,material,c.data.length/4);
  for(let i=0;i<c.data.length;i+=4){
    const [vx,vy,vz,ci]=[c.data[i]!,c.data[i+1]!,c.data[i+2]!,c.data[i+3]!];
    if(vx>=c.size.x||vy>=c.size.y||vz>=c.size.z||ci===0)throw Error('Out of bounds voxel');
    // Veloren coordinates: x / forward y / up z => Three x / up y / back z.
    position.set((mirror?c.size.x-1-vx:vx)+0.5,vz+0.5,-vy-0.5);
    matrix.compose(position,rot,unit);mesh.setMatrixAt(i/4,matrix);
    const rgb=pigment(ci,c.palette[ci]??0xffffffff,kind);
    color.setRGB(rgb[0]/255,rgb[1]/255,rgb[2]/255,THREE.SRGBColorSpace);
    mesh.setColorAt(i/4,color);
  }
  mesh.instanceMatrix.needsUpdate=true;
  if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
  mesh.castShadow=true;mesh.receiveShadow=true;mesh.frustumCulled=false;
  mesh.computeBoundingBox();
  return mesh;
}
function joint(parent:THREE.Object3D,x=0,z=0,y=0):THREE.Group{
  const j=new THREE.Group();j.position.set(x,z,-y);parent.add(j);return j;
}
async function attach(parent:THREE.Object3D,id:string,offset:readonly[number,number,number],
 kind:'material'|'hair'|'normal'='material',mirror=false):Promise<void>{
  const path=MODEL_PATHS.get(id);if(!path)throw Error('Unknown model '+id);
  const chunks=await loader.loadAsync(import.meta.env.BASE_URL+'veloren/'+path) as unknown as VoxChunk[];
  if(!chunks?.[0])throw Error('No model in '+path);
  const mesh=meshVox(chunks[0],kind,mirror);
  mesh.position.set(offset[0],offset[2],-offset[1]);
  mesh.name='Veloren original '+path;
  parent.add(mesh);
}
export async function createVelorenCharacter():Promise<AvatarVisual>{
  const root=new THREE.Group();
  root.name='Veloren Human Female (original VOX)';
  // Roll about the body's approximate centre, never around the sole of a foot.
  // Pivot height is expressed in upstream ~25-unit skeleton coordinates.
  const bodyPivot=joint(root,0,12);
  const torso=joint(bodyPivot,0,-12);
  const chest=joint(torso,0,8),head=joint(chest,0,9.5,-2);
  const belt=joint(chest,0,-2),pants=joint(chest,0,-5);
  const leftHand=joint(chest,-7,0.5,-0.25),rightHand=joint(chest,7,0.5,-0.25);
  const leftFoot=joint(torso,-3.4,2,0.5),rightFoot=joint(torso,3.4,2,0.5);
  const leftShoulder=joint(chest,-5,5),rightShoulder=joint(chest,5,5);
  // Original manifest offsets: humanoid_head_manifest + humanoid_armor_*_manifest.
  await Promise.all([
    attach(head,'head',[-7,-1,-2]),
    attach(head,'eyes',[-5,6,0]),
    attach(head,'hair',[-8,-5,-2],'hair'),
    attach(chest,'chest',[-7,-3.5,1]),
    attach(belt,'belt',[-5,-3.5,2]),
    attach(pants,'pants',[-5,-3.5,0]),
    attach(leftHand,'hand',[-1.5,-1.5,-2.5],'material',true),
    attach(rightHand,'hand',[-1.5,-1.5,-2.5]),
    attach(leftFoot,'foot',[-2.5,-3.5,-2],'material',true),
    attach(rightFoot,'foot',[-2.5,-3.5,-2]),
    attach(leftShoulder,'shoulder',[-4,-3.5,0],'material',true),
    attach(rightShoulder,'shoulder',[-1,-3.5,0]),
  ]);
  root.updateMatrixWorld(true);
  const box=new THREE.Box3().setFromObject(root);
  const h=box.max.y-box.min.y;
  if(!Number.isFinite(h)||h<10)throw Error('Veloren rig dimensions invalid: '+h);
  root.scale.setScalar(1.72/h);
  bodyPivot.position.y-=box.min.y;
  const baseLeft=leftFoot.position.clone(),baseRight=rightFoot.position.clone();
  const pivotY=bodyPivot.position.y;
  const motion=new CharacterMotion();
  return {
    group:root,
    reset(){ motion.reset(); },
    animate(input:MotionInput,dt:number):CharacterPose{
      const pose=motion.step(input,dt);
      // Stable bilateral joints: never transfer a mesh to the opposite foot.
      leftFoot.position.copy(baseLeft);
      rightFoot.position.copy(baseRight);
      leftFoot.position.y += pose.leftFoot.lift;
      rightFoot.position.y += pose.rightFoot.lift;
      leftFoot.position.z -= pose.leftFoot.forward;
      rightFoot.position.z -= pose.rightFoot.forward;
      leftFoot.rotation.x=pose.leftFoot.pitch;
      rightFoot.rotation.x=pose.rightFoot.pitch;
      leftHand.rotation.x=pose.leftArmPitch;
      rightHand.rotation.x=pose.rightArmPitch;
      leftShoulder.rotation.x=pose.leftArmPitch*0.22;
      rightShoulder.rotation.x=pose.rightArmPitch*0.22;
      chest.position.y=8+pose.chestBob;
      head.position.y=9.5+pose.headBob;
      head.rotation.y=pose.headLookYaw;
      head.rotation.z=Math.sin(pose.phase)*pose.locomotion*0.018;
      bodyPivot.position.y=pivotY+pose.rollLift;
      bodyPivot.rotation.set(pose.rollAngle+pose.torsoPitch,0,pose.torsoRoll);
      return pose;
    }
  };
}
