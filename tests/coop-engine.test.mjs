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
 assert.equal(readCoopControls({...controls(),weapon:'laser'}),null);assert.equal(readCoopControls({...controls(),dodge:-1}),null);
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

const loadout={hat:true,mohawk:false,accessory:'bandana'},partnerLoadout={hat:false,mohawk:true,accessory:'cape'};
const setup=(mode,level_id)=>({mode,level_id,host_equipment:loadout,guest_equipment:partnerLoadout});

test('all 25 campaign routes retain their tasks, bosses, weapon tiers and two valid spawn points',async()=>{
 const {adventureLevel,ADVENTURE_WEAPONS}=await import('../app/adventure-levels.ts');
 const {packCoopSnapshot,unpackCoopSnapshot}=await import('../app/coop-wire.ts');
 for(let id=1;id<=25;id++){
  const e=new CoopEngine(51,3,()=>{},setup('campaign',id));
  assert.equal(e.levelData,adventureLevel(id));assert.equal(e.dungeon.tasks.length,e.levelData.tasks.length);
  assert.ok(e.actors.every(a=>e.canStand(a.player.x,a.player.y)),`spawn level ${id}`);
  assert.ok(Math.hypot(e.actors[0].player.x-e.actors[1].player.x,e.actors[0].player.y-e.actors[1].player.y)>25);
  assert.equal(e.availableWeapons.at(-1),e.weapon);assert.equal(e.weaponTier,ADVENTURE_WEAPONS[e.weapon].tier);
  const guest=new CoopEngine(51,3,()=>{},setup('campaign',id));
  const state=unpackCoopSnapshot(JSON.parse(JSON.stringify(packCoopSnapshot(e.snapshot()))),guest);assert.ok(state,`wire level ${id}`);guest.applySnapshot(state);
  assert.deepEqual(guest.actors.map(a=>a.equipment),[loadout,partnerLoadout]);assert.deepEqual(guest.dungeon.tasks,e.dungeon.tasks);assert.deepEqual(guest.barrels,e.barrels);
  assert.equal(readCoopSnapshot(e.snapshot(),new CoopEngine(51,3,()=>{},setup('campaign',id%25+1))),null);
 }
});

test('both teammates complete task dependencies and reach every campaign lift using ordinary movement',async()=>{
 const {dungeonPath}=await import('./helpers/dungeon-autoplay.mjs');
 // This checks routes, shared objectives and two-player completion. Combat is tested separately above.
 for(let id=1;id<=25;id++){
  const e=new CoopEngine(51,3,()=>{},setup('campaign',id));let paths=[[],[]],lastGoal='',age=0;
  e.actors.forEach(a=>{a.invincible=10000;});
  for(let frame=0;frame<24000&&e.phase==='playing';frame++){
   emptyRoom(e);
   const index=e.dungeon.goal(),task=e.levelData.tasks[index],state=e.dungeon.tasks[index];
   const key=task?`${index}:${state.active}:${state.done}`:'exit';
   if(key!==lastGoal||age++>100){paths=[[],[]];age=0;lastGoal=key;}
   for(const slot of [0,1]){
    const actor=e.actors[slot],goal=task??e.levelData.exit;
    let interact=false;
    if(task&&Math.hypot(actor.player.x-task.x,actor.player.y-task.y)<64&&e.dungeon.available(index))interact=true;
    const hold=task&&state.active&&task.kind==='hold'&&Math.hypot(actor.player.x-task.x,actor.player.y-task.y)<155;
    if(!paths[slot].length&&!hold)paths[slot]=e.forPlayer(slot,()=>dungeonPath(e,goal,task?45:70,false));
    const path=paths[slot];while(path.length&&Math.hypot(path[0].x-actor.player.x,path[0].y-actor.player.y)<8)path.shift();
    const point=!hold&&path[0];e.setControls(slot,controls({weapon:actor.weapon,interact,x:point?point.x-actor.player.x:0,y:point?point.y-actor.player.y:0}));
   }
   step(e);
  }
  assert.equal(e.phase,'won',`campaign ${id}: ${JSON.stringify({actors:e.actors.map(a=>[a.player.x,a.player.y]),tasks:e.dungeon.tasks})}`);
  assert.equal(e.dungeon.allDone,true);assert.ok(e.actors.every(a=>e.canStand(a.player.x,a.player.y)));
  assert.equal(e.completedLevel,1,'co-op never writes personal campaign completion');
 }
});

test('Abyss floors and later arcade sectors use deterministic maps and round-trip full dungeon state',async()=>{
 const {packCoopSnapshot,unpackCoopSnapshot}=await import('../app/coop-wire.ts');
 for(const [mode,id] of [['abyss',1],['abyss',3],['abyss',5],['abyss',20],['abyss',1234],['arcade',2],['arcade',50]]){
  const e=new CoopEngine(777,2,()=>{},setup(mode,id)),guest=new CoopEngine(777,2,()=>{},setup(mode,id));
  assert.deepEqual(e.levelData,guest.levelData);assert.ok(e.actors.every(a=>e.canStand(a.player.x,a.player.y)));
  if(mode==='abyss'){assert.equal(e.endlessFloor,id);assert.equal(e.weapon,'arc');assert.equal(e.levelData.enemies.some(e=>e.boss),id%5===0);}
  const task=e.dungeon.tasks[0];if(task){task.done=true;e.dungeon.geometryRevision++;}
  if(e.dungeon.mines[0])e.dungeon.mines[0].spent=true;
  if(e.dungeon.medkits[0])e.dungeon.medkits[0]=false;
  if(e.barrels[0])e.barrels[0].active=false;
  const state=unpackCoopSnapshot(JSON.parse(JSON.stringify(packCoopSnapshot(e.snapshot()))),guest);assert.ok(state);guest.applySnapshot(state);
  for(const field of ['tasks','mines','medkits','geometryRevision'])assert.deepEqual(guest.dungeon[field],e.dungeon[field]);
 }
});

test('each outfit affects only its owner, including attack, dodge and independent cape waves',async()=>{
 const {clothingRollCooldown,clothingAttackMultiplier,ENERGY_WAVE}=await import('../app/knopik-combat-equipment.ts');
 const e=new CoopEngine(321,1,()=>{},setup('campaign',25));emptyRoom(e);safePair(e);
 for(const slot of [0,1]){e.setControls(slot,controls({weapon:'fist',attack:true}));step(e);assert.equal(e.actors[slot].punchCooldownDuration,.58*clothingAttackMultiplier(e.actors[slot].equipment,'fist'));e.setControls(slot,controls(),true);assert.equal(e.actors[slot].dodgeCooldown,clothingRollCooldown(e.actors[slot].equipment));}
 step(e,30);e.setControls(0,controls({energy:1}));e.setControls(1,controls({energy:1}));
 assert.equal(e.actors[0].energyWave.active,false);assert.equal(e.actors[1].energyWave.active,true);assert.equal(e.actors[1].energyCooldown,ENERGY_WAVE.cooldown);
 step(e,10);const remaining=e.actors[1].energyCooldown;e.setControls(1,controls({energy:1}));assert.equal(e.actors[1].energyCooldown,remaining,'a held/lost packet cannot retrigger a wave');
 const state=readCoopSnapshot(JSON.parse(JSON.stringify(e.snapshot())),new CoopEngine(321,1,()=>{},setup('campaign',25)));assert.ok(state);assert.deepEqual(state.actors.map(a=>a.equipment),[loadout,partnerLoadout]);
});

test('the guest can operate a shared mechanism; hold progress counts time once for two players',()=>{
 const e=new CoopEngine(12,1,()=>{},setup('campaign',1));emptyRoom(e);
 const index=e.levelData.tasks.findIndex(t=>t.kind==='hold'),task=e.levelData.tasks[index];
 e.dungeon.tasks.forEach((s,i)=>{if(i<index)s.done=true;});
 for(const a of e.actors){Object.assign(a.player,{x:task.x,y:task.y+40});a.room=task.room;a.invincible=999;}
 e.setControls(1,controls({interact:true}));step(e);assert.equal(e.dungeon.tasks[index].active,true);
 e.setControls(1,controls());step(e,60);assert.ok(e.dungeon.tasks[index].progress>1&&e.dungeon.tasks[index].progress<1.04);
});

test('a guest tap shorter than one input interval still activates its task exactly once',()=>{
 const e=new CoopEngine(12,1,()=>{},setup('campaign',1));emptyRoom(e);
 const task=e.levelData.tasks[0];Object.assign(e.actors[1].player,{x:task.x,y:task.y+30});e.actors[1].room=task.room;
 e.setControls(1,controls({action:1,interact:false}));step(e);assert.equal(e.dungeon.tasks[0].done,true);
 const revision=e.dungeon.geometryRevision;step(e,10);assert.equal(e.dungeon.geometryRevision,revision);
});

test('shared hazards hit both players once; a spent mine cannot detonate after snapshot recovery',async()=>{
 const e=new CoopEngine(12,1,()=>{},setup('campaign',11));emptyRoom(e);
 const i=e.levelData.hazards.findIndex(h=>h.kind==='mine'),h=e.levelData.hazards[i];assert.ok(h);
 for(const a of e.actors){Object.assign(a.player,{x:h.x+13,y:h.y+13});a.room=h.room;}
 step(e,55);assert.equal(e.dungeon.mines[i].spent,true);assert.deepEqual(e.actors.map(a=>a.player.hp),[2,2]);
 const guest=new CoopEngine(12,1,()=>{},setup('campaign',11)),state=readCoopSnapshot(JSON.parse(JSON.stringify(e.snapshot())),guest);assert.ok(state);guest.applySnapshot(state);
 step(guest,90);assert.equal(guest.dungeon.mines[i].spent,true);assert.deepEqual(guest.actors.map(a=>a.player.hp),[2,2]);
});

test('boss reinforcements wake once and preserve their state on the guest',async()=>{
 const {packCoopSnapshot,unpackCoopSnapshot}=await import('../app/coop-wire.ts');
 for(const id of [5,10,15,20,25]){
  const e=new CoopEngine(12,1,()=>{},setup('campaign',id)),boss=e.enemies.find(e=>e.boss);assert.ok(boss);
  const p=e.actors[1];p.room=boss.room;Object.assign(p.player,{x:boss.x+140,y:boss.y});p.invincible=999;
  boss.hp=Math.floor(boss.maxHp/2);step(e);assert.equal(boss.reinforced,true);assert.ok(e.enemies.filter(e=>e.trigger===-1).every(e=>e.awake));
  const guest=new CoopEngine(12,1,()=>{},setup('campaign',id)),state=unpackCoopSnapshot(JSON.parse(JSON.stringify(packCoopSnapshot(e.snapshot()))),guest);assert.ok(state);guest.applySnapshot(state);assert.equal(guest.enemies.find(e=>e.boss).reinforced,true);
 }
});
