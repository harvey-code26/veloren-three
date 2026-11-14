import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdir, stat } from 'node:fs/promises';
import assert from 'node:assert/strict';

const base = 'http://127.0.0.1:4173/veloren-three/';
const server = spawn('npm', ['run','preview','--','--host','127.0.0.1','--port','4173','--strictPort'], {
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
  await ready();
  browser=await chromium.launch({headless:true,args:[
    '--no-sandbox','--enable-webgl','--use-gl=angle',
    '--use-angle=swiftshader','--enable-unsafe-swiftshader',
    '--disable-dev-shm-usage',
  ]});
  const page=await browser.newPage({viewport:{width:1280,height:800},deviceScaleFactor:1});
  const errors=[];
  const failed=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  page.on('response',r=>{if(r.status()>=400)failed.push(r.status()+' '+r.url());});
  const response=await page.goto(base,{waitUntil:'domcontentloaded',timeout:25000});
  assert.equal(response?.status(),200,'Preview HTML must load');
  await page.waitForFunction(
    () => (document.querySelector('#asset-status')?.textContent??'').includes('装配完成'),
    undefined,{timeout:30000},
  ).catch(async err=>{
    throw new Error('Character model did not assemble: '+await page.locator('#asset-status').innerText()+' '+err.message);
  });
  await page.waitForTimeout(350);
  assert.equal(await page.locator('canvas').count(),1,'Exactly one WebGL canvas');
  await page.screenshot({path:'artifacts/p1-3-spawn.png'});
  // Browser input smoke: movement and third->first person transition.
  await page.locator('canvas').click({position:{x:900,y:400}});
  await page.keyboard.down('w');
  await page.waitForTimeout(600);
  await page.keyboard.up('w');
  await page.waitForTimeout(180);
  await page.screenshot({path:'artifacts/p1-3-moving.png'});
  await page.keyboard.press('0');
  await page.waitForTimeout(580);
  const debug=await page.locator('#metrics').innerText();
  assert.match(debug,/第一人称/,'Pressing 0 should switch to first-person');
  await page.screenshot({path:'artifacts/p1-3-first-person.png'});
  for(const filename of ['p1-3-spawn.png','p1-3-moving.png','p1-3-first-person.png']) {
    assert.ok((await stat('artifacts/'+filename)).size>8000,'Empty screenshot '+filename);
  }
  assert.deepEqual(failed,[],'No failed HTTP resources');
  assert.deepEqual(errors,[],'No browser JS or WebGL errors');
  console.log('[smoke] original Veloren model assembled, keyboard/camera worked, screenshots captured');
} finally {
  await browser?.close();
  server.kill('SIGTERM');
}
