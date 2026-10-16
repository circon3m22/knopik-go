import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {GAME_VERSION,GAME_RELEASES,GAME_RELEASE_STORAGE_KEY,claimGameRelease,parseGameVersion,compareGameVersions,nextGameVersion} from '../app/game-release.ts';
function storage(){const data=new Map();return {data,getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,value)};}
test('an installed update is announced once across remounts, launches and worker/network events',()=>{
 const s=storage();assert.equal(claimGameRelease(s,'0.2.0'),true);for(let i=0;i<10;i++)assert.equal(claimGameRelease(s,'0.2.0'),false);assert.equal(s.data.get(GAME_RELEASE_STORAGE_KEY),'0.2.0');
 assert.equal(claimGameRelease(s,'0.2.1'),true);assert.equal(claimGameRelease(s,'0.2.1'),false);assert.equal(claimGameRelease(s,'0.3.0'),true);
});
test('old clients never announce a downgrade or overwrite the most recent installed release',()=>{
 const s=storage();s.setItem(GAME_RELEASE_STORAGE_KEY,'1.0.0');assert.equal(claimGameRelease(s,'0.2.0'),false);assert.equal(s.getItem(GAME_RELEASE_STORAGE_KEY),'1.0.0');
 s.setItem(GAME_RELEASE_STORAGE_KEY,'0.1.0');assert.equal(claimGameRelease(s,'0.2.0'),true);
});
test('unavailable storage cannot make the update message appear repeatedly',()=>{
 const blocked={getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}};assert.equal(claimGameRelease(blocked),false);
 assert.equal(claimGameRelease({getItem:()=>null,setItem(){throw Error('full');}}),false);
 assert.equal(claimGameRelease(storage(),'bad'),false);
});
test('version, update and patch increment their own number and reset the following fields',()=>{
 assert.equal(nextGameVersion('0.2.0','patch'),'0.2.1');assert.equal(nextGameVersion('0.2.9','update'),'0.3.0');assert.equal(nextGameVersion('0.9.9','version'),'1.0.0');
 assert.equal(compareGameVersions('0.2.10','0.2.9'),1);assert.equal(compareGameVersions('0.2.0','0.2.0'),0);assert.equal(parseGameVersion('0.2'),null);
});
test('release history retains the first version and matches both package versions',()=>{
 assert.equal(GAME_RELEASES.find(r=>r.version==='0.2.0').title,'ONLINE UPDATE');assert.equal(GAME_RELEASES.at(-1).version,'0.1.0');
 for(let i=0;i<GAME_RELEASES.length;i++){const r=GAME_RELEASES[i];assert.ok(parseGameVersion(r.version));assert.ok(r.title&&r.changes.length);if(i)assert.equal(compareGameVersions(GAME_RELEASES[i-1].version,r.version),1);}
 const pkg=JSON.parse(readFileSync(new URL('../package.json',import.meta.url))),lock=JSON.parse(readFileSync(new URL('../package-lock.json',import.meta.url)));assert.equal(pkg.version,GAME_VERSION);assert.equal(lock.version,GAME_VERSION);assert.equal(lock.packages[''].version,GAME_VERSION);
});
test('future releases prepare their version and descriptions without mutating files during dry run',async()=>{
 const url=new URL('../app/game-releases.json',import.meta.url),before=readFileSync(url,'utf8');
 const {runGameRelease}=await import('../scripts/release-game.mjs');
 const result=runGameRelease(['patch','--title','Исправления','--change','Описание для игроков','--dry-run']);
 assert.equal(result.release.version,nextGameVersion(GAME_VERSION,'patch'));assert.deepEqual(result.release.changes,['Описание для игроков']);assert.equal(readFileSync(url,'utf8'),before);
});
