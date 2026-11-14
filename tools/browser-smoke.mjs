import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdir, stat } from 'node:fs/promises';
import assert from 'node:assert/strict';

const base = 'http://127.0.0.1:4173/veloren-three/';
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4173','--strictPort'], {
  env: process.env, stdio: ['ignore','pipe','pipe'],
});
let serverLogs = '';
for (const pipe of [server.stdout,server.stderr]) {
  pipe?.on('data', data => { serverLogs += String(data); });
}
async function ready() {
  for (let attempt = 0; attempt < 80; attempt++) {
    if (server.exitCode !== null) throw new Error('Preview server exited: '+serverLogs);
    try {
      const res=await fetch(base,{signal:AbortSignal.timeout(1000)});
      if (res.ok) return;
    } catch { /* wait for Vite preview */ }
    await new Promise(r=>setTimeout(r,250));
  }
  throw new Error('Preview server did not start: '+serverLogs);
}
let browser;
try {
  await mkdir('artifacts',{recursive:true});
  console.log('[smoke] launching preview');
  await ready();
  console.log('[smoke] preview ready');
  browser=await chromium.launch({headless:true,args:[
    '--no-sandbox','--enable-webgl','--use-gl=angle',
    '--use-angle=swiftshader','--enable-unsafe-swiftshader',
    '--disable-dev-shm-usage',
  ]});
  console.log('[smoke] Chromium started');
  const page=await browser.newPage({viewport:{width:1280,height:800},deviceScaleFactor:1});
  const errors=[];
  const failed=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  page.on('response',r=>{if(r.status()>=400)failed.push(r.status()+' '+r.url());});
  console.log('[smoke] loading site');
  const response=await page.goto(base,{waitUntil:'domcontentloaded',timeout:25000});
  assert.equal(response?.status(),200,'Preview HTML must load');
  await page.waitForFunction(
    () => (document.querySelector('#asset-status')?.textContent??'').includes('装配完成'),
    undefined,{timeout:30000},
  ).catch(async err=>{
    throw new Error('Character model did not assemble: '+await page.locator('#asset-status').innerText()+' '+err.message);
  });
  console.log('[smoke] original character assembled');
  await page.waitForTimeout(350);
  assert.equal(await page.locator('canvas').count(),1,'Exactly one WebGL canvas');
  await page.screenshot({path:'artifacts/p1-3-spawn.png'});
  console.log('[smoke] captured spawn');
  // Browser input smoke: movement and third->first person transition.
  // Keyboard movement is orthogonal to pointer lock. Keep the mouse
  // stationary during the straight-line motion check to avoid synthetic
  // Chromium cursor-warp events masquerading as game input.
  await page.keyboard.down('w');
  await page.waitForTimeout(600);
  await page.keyboard.up('w');
  await page.waitForTimeout(180);
  const moveState=await page.locator('#metrics').innerText();
  const heading=/角色朝向\s+(-?[\d.]+)°/.exec(moveState);
  assert.ok(heading,'Debug panel must expose character facing');
  assert.ok(Math.abs(Number(heading[1]))<35,'Straight W movement produced an unexpected facing direction: '+heading[1]);
  await page.screenshot({path:'artifacts/p1-3-moving.png'});
  console.log('[smoke] captured moving');
  await page.keyboard.press('0');
  await page.waitForTimeout(580);
  const debug=await page.locator('#metrics').innerText();
  assert.match(debug,/第一人称/,'Pressing 0 should switch to first-person');
  await page.screenshot({path:'artifacts/p1-3-first-person.png'});
  console.log('[smoke] captured first person');
  for(const filename of ['p1-3-spawn.png','p1-3-moving.png','p1-3-first-person.png']) {
    assert.ok((await stat('artifacts/'+filename)).size>8000,'Empty screenshot '+filename);
  }
  assert.deepEqual(failed,[],'No failed HTTP resources');
  assert.deepEqual(errors,[],'No browser JS or WebGL errors');
  console.log('[smoke] original Veloren model assembled, keyboard/camera worked, screenshots captured');
} finally {
  await browser?.close();
  server.kill('SIGTERM');
  server.stdout?.destroy();
  server.stderr?.destroy();
  console.log('[smoke] browser and preview shutdown requested');
}
