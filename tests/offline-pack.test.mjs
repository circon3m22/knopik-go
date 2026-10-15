import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {buildOfflinePack} from '../scripts/build-offline-pack.mjs';
test('the offline manifest includes never-visited game code, local fonts, sprites and ranged audio',async()=>{
 const root=await mkdtemp(path.join(os.tmpdir(),'knopik-pack-'));
 try{for(const name of ['index.html','run/index.html','_next/static/chunks/new-zone.js','fonts/tiny5.woff2','sprites/sahur.webp','audio/sahur.mp3','sw.js']){await mkdir(path.dirname(path.join(root,name)),{recursive:true});await writeFile(path.join(root,name),name==='sw.js'?'const CACHE_NAME = `${CACHE_PREFIX}__KNOPIK_OFFLINE_PACK_VERSION__`;':'bytes:'+name);}
 const pack=await buildOfflinePack(root,'/knopik-go');assert.ok(pack.bytes>0);assert.ok(pack.version);
 const urls=pack.assets.map(a=>a.url);for(const suffix of ['/','/run/','/_next/static/chunks/new-zone.js','/fonts/tiny5.woff2','/sprites/sahur.webp','/audio/sahur.mp3'])assert.ok(urls.includes('/knopik-go'+suffix));
 assert.ok(!urls.includes('/knopik-go/sw.js'));assert.ok(pack.assets.every(a=>/^[a-f0-9]{64}$/.test(a.sha256)));
 const swPath=path.join(root,'sw.js');
 assert.ok((await readFile(swPath,'utf8')).includes(pack.version));
 assert.equal((await buildOfflinePack(root,'/knopik-go')).version,pack.version);
 await writeFile(path.join(root,'_next/static/chunks/new-zone.js'),'updated');
 const updated=await buildOfflinePack(root,'/knopik-go');
 assert.notEqual(updated.version,pack.version);
 const generatedWorker=await readFile(swPath,'utf8');
 assert.ok(generatedWorker.includes(updated.version),'New deploy must change the actual service-worker script');
 assert.ok(!generatedWorker.includes(pack.version),'New deploy cannot reuse a previous cache name');
 }finally{await rm(root,{recursive:true,force:true});}
});
