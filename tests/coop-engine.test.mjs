import test from 'node:test';
import assert from 'node:assert/strict';
import {CoopEngine,generateCoopDungeon,readCoopSnapshot} from '../app/coop-engine.ts';
import {idleCoopControls,CoopInputInbox,readCoopControls,normalizeCoopCode,coopInvite,readCoopRoom} from '../app/coop-protocol.ts';
const controls=(patch={})=>({...idleCoopControls(),...patch});
const step=(e,n=1)=>{for(let i=0;i<n;i++)e.advance(1/60);};
const emptyRoom=e=>{for(const enemy of e.enemies)enemy.hp=0;};
function safePair(e){const r=e.levelData.rooms[0];for(let y=r.y+100;y<r.y+r.h-70;y+=24)for(let x=r.x+70;x<r.x+r.w-100;x+=24)if(e.canStand(x,y)&&e.canStand(x+48,y)&&e.canStand(x+64,y)){e.actors[0].player.x=x;e.actors[0].player.y=y;e.actors[1].player.x=x+48;e.actors[1].player.y=y;return;}throw Error('No safe player pair');}

test('two actors move independently in one authoritative world, including diagonal speed',()=>{
 const e=new CoopEngine(123);emptyRoom(e);safePair(e);
 const a={...e.actors[0].player},b={...e.actors[1].player};
 e.setControls(0,controls({x:-1}));e.setControls(1,controls({x:1}));step(e,3);
 assert.ok(e.actors[0].player.x<a.x);assert.ok(e.actors[1].player.x>b.x);
 assert.equal(e.actors[0].player.y,a.y);assert.equal(e.actors[1].player.y,b.y);
 const prior=e.actors.map(a=>a.player.x);e.clearControls();step(e,3);assert.deepEqual(e.actors.map(a=>a.player.x),prior);
 assert.notEqual(e.actors[0].player,e.actors[1].player);
});
test('both actors damage the same enemies using their own weapon cooldowns',()=>{
 const e=new CoopEngine(123);emptyRoom(e);safePair(e);
 const enemy=e.enemies[0];Object.assign(enemy,{x:e.actors[0].player.x+24,y:e.actors[0].player.y,hp:30,maxHp:30,awake:true,room:0,mode:'recover',timer:9});
 e.setControls(0,controls({weapon:'fist',attack:true}));e.setControls(1,controls({weapon:'fist',attack:true}));step(e);
 assert.equal(enemy.hp,28);assert.equal(e.actors[0].punchSerial,1);assert.equal(e.actors[1].punchSerial,1);
 step(e);assert.equal(enemy.hp,28);
});
test('enemy projectiles damage the guest, not an unrelated host; no friendly fire',()=>{
 const e=new CoopEngine(12);emptyRoom(e);safePair(e);
 const p=e.actors[1].player,b=e.bullets[0];
 Object.assign(b,{active:true,x:p.x,y:p.y,vx:0,vy:0,life:2,owner:'enemy',kind:'round'});step(e);
 assert.equal(e.actors[0].player.hp,3);assert.equal(e.actors[1].player.hp,2);assert.equal(b.active,false);
 Object.assign(b,{active:true,x:p.x,y:p.y,vx:0,vy:0,life:2,owner:'player',kind:'round'});step(e);assert.equal(e.actors[1].player.hp,2);
});
test('melee enemies can target and down either player without ending the other actor\'s run',()=>{
 const e=new CoopEngine(123);emptyRoom(e);safePair(e);
 const p=e.actors[1].player;Object.assign(p,{hp:1});
 const enemy=e.enemies[0];Object.assign(enemy,{hp:3,x:p.x+25,y:p.y,room:0,kind:'bat',role:undefined,boss:false,awake:true,mode:'windup',timer:0,attackAngle:Math.PI});
 e.actors[0].player.x-=80;step(e);
 assert.equal(e.actors[1].player.hp,0);assert.equal(e.actors[0].player.hp,3);assert.equal(e.phase,'playing');
 const before={...p};e.setControls(1,controls({x:1,attack:true}),true);step(e,3);assert.equal(p.x,before.x);assert.equal(e.actors[1].punchSerial,0);
});
test('a live teammate must stay nearby and hold help for two seconds to revive',()=>{
 const e=new CoopEngine(123);emptyRoom(e);safePair(e);e.actors[1].player.hp=0;
 e.setControls(0,controls({interact:true}));step(e,60);assert.equal(e.actors[1].player.hp,0);assert.ok(e.actors[1].reviveProgress>.9);
 e.setControls(0,controls());step(e);assert.equal(e.actors[1].reviveProgress,0);
 e.setControls(0,controls({interact:true}));step(e,121);assert.equal(e.actors[1].player.hp,2);assert.ok(e.actors[1].invincible>1.9);
});
test('the expedition ends only when both are down; personal economy is never touched',()=>{
 const e=new CoopEngine(123);e.actors.forEach(a=>{a.player.hp=0;});step(e);assert.equal(e.phase,'dead');assert.equal(e.collectedCoins,0);assert.equal(e.completedLevel,1);assert.equal(e.chests.length,0);assert.equal(e.ingredientPickups.length,0);
});
test('victory needs all eight rooms and both living players at the exit',()=>{
 const e=new CoopEngine(123);emptyRoom(e);e.cleared.fill(true);const exit=e.levelData.exit;
 for(const a of e.actors)Object.assign(a.player,{x:exit.x,y:exit.y+60});
 e.actors[1].player.x-=300;assert.equal(e.finishLevel(),false);
 e.actors[1].player.x=exit.x;e.actors[1].player.hp=0;assert.equal(e.finishLevel(),false);
 e.actors[1].player.hp=1;assert.equal(e.finishLevel(),true);assert.equal(e.phase,'won');
});
test('host snapshots round-trip into the guest and survive host refresh without a sequence rollback',()=>{
 const host=new CoopEngine(321,4);safePair(host);host.setControls(1,controls({x:1,attack:true}));step(host,12);
 const world=JSON.parse(JSON.stringify(host.snapshot())),guest=new CoopEngine(321,4);
 assert.ok(readCoopSnapshot(world,guest));guest.applySnapshot(world);
 assert.deepEqual(guest.actors,host.actors);assert.deepEqual(guest.enemies,host.enemies);assert.deepEqual(guest.bullets,host.bullets);assert.deepEqual(guest.cleared,host.cleared);
 assert.ok(guest.snapshot().seq>world.seq);
});
test('rendering the guest cannot change host simulation ownership, health, inputs or weapons',()=>{
 const e=new CoopEngine(999);e.setControls(0,controls({weapon:'sabre'}));e.setControls(1,controls({weapon:'pistol'}));const before=e.snapshot();
 e.forPlayer(1,()=>{assert.equal(e.player,e.actors[1].player);assert.equal(e.weapon,'pistol');e.view();});
 const after=e.snapshot();delete before.seq;delete after.seq;assert.deepEqual(after,before);
});
test('malformed and incompatible worlds cannot reach the renderer',()=>{
 const e=new CoopEngine(1),state=e.snapshot();
 assert.equal(readCoopSnapshot({...state,seed:2},e),null);assert.equal(readCoopSnapshot({...state,round:7},e),null);
 assert.equal(readCoopSnapshot({...state,enemies:[]},e),null);
 state.actors[0].player.x=NaN;assert.equal(readCoopSnapshot(state,e),null);
});
test('seeded co-op layouts always start with two valid spawn locations and keep the solo arcade independent',()=>{
 for(let seed=1;seed<=100;seed++){
  const a=new CoopEngine(seed),b=generateCoopDungeon(seed);assert.deepEqual(a.levelData.rooms,b.rooms);assert.equal(a.levelData.rooms.length,8);assert.equal(a.levelData.gates.length,7);
  assert.ok(a.actors.every(p=>a.canStand(p.player.x,p.player.y)));assert.ok(Math.hypot(a.actors[0].player.x-a.actors[1].player.x,a.actors[0].player.y-a.actors[1].player.y)>=25);
 }
});
test('input packets reject stale sequences, normalize movement, and never replay a dodge',()=>{
 const inbox=new CoopInputInbox();assert.equal(inbox.accept(1,controls({x:3,y:4,dodge:1}),100),true);assert.equal(Math.hypot(inbox.controls.x,inbox.controls.y),1);
 assert.equal(inbox.takeDodge(),true);assert.equal(inbox.takeDodge(),false);assert.equal(inbox.accept(1,controls({dodge:2}),110),false);
 assert.equal(inbox.accept(2,controls({x:NaN}),120),false);assert.equal(inbox.fresh(1900),false);
 assert.equal(readCoopControls({...controls(),weapon:'launcher'}),null);assert.equal(readCoopControls({...controls(),dodge:-1}),null);
 assert.equal(normalizeCoopCode(' ab-c2 34 '),'ABC234');assert.equal(coopInvite('ABC234','https://example.com','/knopik-go'),'https://example.com/knopik-go/?coop=ABC234');assert.equal(readCoopRoom({code:'BAD'}),null);
});

test('wire snapshots omit inactive pools, preserve active bullets and shrink initial state by more than half',async()=>{
 const {packCoopSnapshot,unpackCoopSnapshot}=await import('../app/coop-wire.ts');
 const e=new CoopEngine(4321),s=e.snapshot(),packed=packCoopSnapshot(s);
 assert.ok(JSON.stringify(packed).length<JSON.stringify(s).length/2);
 const guest=new CoopEngine(4321);const unpacked=unpackCoopSnapshot(JSON.parse(JSON.stringify(packed)),guest);assert.ok(unpacked);assert.deepEqual(unpacked.actors,s.actors);
 Object.assign(e.bullets[42],{active:true,x:150,y:180,vx:20,vy:-15,life:.4,kind:'round',owner:'player',damage:1,maxLife:.7,splash:0});
 const active=unpackCoopSnapshot(packCoopSnapshot(e.snapshot()),guest);assert.deepEqual(active.bullets[42],e.bullets[42]);assert.equal(active.bullets.filter(b=>b.active).length,1);
 assert.equal(unpackCoopSnapshot({...packed,b:[[100,0,0,0,0,0]]},guest),null);
});

test('both players can reach the exit through generated corridors using ordinary 60 Hz movement',async()=>{
 const {dungeonPath}=await import('./helpers/dungeon-autoplay.mjs');
 for(const seed of [5,123,999]){
  const e=new CoopEngine(seed);emptyRoom(e);step(e);
  const paths=[0,1].map(slot=>e.forPlayer(slot,()=>dungeonPath(e,e.levelData.exit,70,false)));
  assert.ok(paths.every(p=>p.length>0));
  for(let frame=0;frame<10000&&e.phase==='playing';frame++){
   for(const slot of [0,1]){
    const actor=e.actors[slot],path=paths[slot];while(path.length&&Math.hypot(path[0].x-actor.player.x,path[0].y-actor.player.y)<8)path.shift();
    e.setControls(slot,controls(path.length?{x:path[0].x-actor.player.x,y:path[0].y-actor.player.y}:{}));
   }
   step(e);
  }
  assert.equal(e.phase,'won',`both players reach exit in seed ${seed}`);assert.ok(e.actors.every(a=>e.canStand(a.player.x,a.player.y)));
 }
});

test('guest prediction matches diagonal speed and the authoritative roll speed',()=>{
 const e=new CoopEngine(123);emptyRoom(e);safePair(e);let before={...e.actors[1].player};
 e.predict(1,controls({x:1,y:1}),1/60);assert.ok(Math.abs(Math.hypot(e.actors[1].player.x-before.x,e.actors[1].player.y-before.y)-154/60)<1e-8);
 e.setControls(1,controls({x:1}),true);before={...e.actors[1].player};e.predict(1,controls({x:1}),1/60);
 assert.ok(Math.abs(e.actors[1].player.x-before.x-440/60)<1e-8);
});
