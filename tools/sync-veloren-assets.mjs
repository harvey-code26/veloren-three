#!/usr/bin/env node
// Fetch a small, pinned set of real Veloren model parts; verify each Git blob ID.
// Source repo and git blobs are recorded in assets/veloren-human-female.json.
import { readFile, writeFile, mkdir, rename, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { get } from 'node:https';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(await readFile(join(root, 'assets/veloren-human-female.json'), 'utf8'));
const targetRoot = join(root, 'public', 'veloren');
const gitBlob = buffer => createHash('sha1').update(Buffer.from(`blob ${buffer.length}\0`)).update(buffer).digest('hex');

async function fetchBytes(url, redirects = 2) {
  return new Promise((resolve, reject) => {
    const req = get(url, {
      headers: { 'user-agent': 'veloren-three-asset-sync/0.1', 'accept': 'application/octet-stream' },
      timeout: 20000,
    }, res => {
      const code = res.statusCode ?? 0;
      if (code >= 300 && code < 400 && res.headers.location && redirects > 0) {
        res.resume();
        fetchBytes(new URL(res.headers.location, url).toString(), redirects - 1).then(resolve, reject);
      } else if (code !== 200) {
        res.resume();
        reject(new Error(`HTTP ${code}: ${url}`));
      } else {
        const chunks = [];
        res.on('data', chunk => chunks.push(chunk));
        res.on('end', () => resolve(Buffer.concat(chunks)));
        res.on('error', reject);
      }
    });
    req.on('timeout', () => req.destroy(new Error(`Timeout: ${url}`)));
    req.on('error', reject);
  });
}

for (const file of manifest.files) {
  if (!/^[a-z0-9/_-]+\.vox$/.test(file.path) || file.path.includes('..')) {
    throw new Error(`Unsafe asset path: ${file.path}`);
  }
  const destination = join(targetRoot, file.path);
  let bytes;
  try { bytes = await readFile(destination); } catch { /* first download */ }
  if (bytes && gitBlob(bytes) === file.gitBlob) {
    console.log(`[asset] verified existing ${file.path}`);
    continue;
  }
  const url = `https://raw.githubusercontent.com/${manifest.sourceRepository}/${manifest.sourceCommit}/assets/voxygen/voxel/${file.path}`;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      bytes = await fetchBytes(url);
      if (bytes.length !== file.size || bytes.toString('ascii', 0, 4) !== 'VOX ') {
        throw new Error(`Invalid VOX payload (${bytes.length} bytes): ${file.path}`);
      }
      if (gitBlob(bytes) !== file.gitBlob) throw new Error(`Git blob SHA mismatch: ${file.path}`);
      break;
    } catch (err) {
      if (attempt === 2) throw err;
      console.warn(`[asset] retry ${file.path}: ${err.message}`);
      await new Promise(r => setTimeout(r, 750 * (attempt + 1)));
    }
  }
  await mkdir(dirname(destination), { recursive: true });
  const temporary = destination + '.tmp';
  try {
    await writeFile(temporary, bytes);
    await rename(temporary, destination);
  } finally {
    await rm(temporary, { force: true });
  }
  console.log(`[asset] downloaded and verified ${file.path} (${bytes.length} bytes)`);
}
console.log(`[asset] ${manifest.files.length} original Veloren VOX files ready`);
