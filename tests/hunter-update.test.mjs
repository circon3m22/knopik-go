import test from 'node:test';import assert from 'node:assert/strict';
import {ADVENTURE_LEVELS,DUNGEON_ZONES,WEAPON_ORDER} from '../app/adventure-levels.ts';
import {WorldCollisionIndex} from '../app/world-collision-index.ts';
import {createDefaultSave,sanitizeSave} from '../app/game-logic.ts';
import {planProgressClaims,progressReward} from '../app/progress-engine.ts';
import {RunnerEngine} from '../app/runner-engine.ts';
import {RUNNER_ZONES,runnerUpcomingDistrict,runnerDistrictRoute} from '../app/runner-districts.ts';
import {runnerJumpObstacle,runnerRollObstacle} from '../app/runner-surfaces.ts';
import {dungeonGame} from './helpers/dungeon-fixtures.mjs';
test('new campaign has ten different authored objective routes and keeps old progress and Abyss access',()=>{
 assert.equal(ADVENTURE_LEVELS.length,35);assert.equal(DUNGEON_ZONES.length,7);assert.equal(WEAPON_ORDER.length,8);
 const layouts=new Set();for(const l of ADVENTURE_LEVELS.slice(25)){layouts.add(JSON.stringify([l.rooms,l.tasks.map(t=>[t.kind,t.room,t.depends]),l.gates]));assert.ok(l.tasks.length>=2);assert.ok(l.roomNames.length===l.rooms.length);}
 assert.equal(layouts.size,10);
 for(const level of ADVENTURE_LEVELS){const reachable=new Set([0]),done=new Set();for(let n=0;n<level.rooms.length+level.tasks.length;n++){
  for(const gate of level.gates)if((gate.objective===undefined||Array.from({length:gate.objective+1},(_,i)=>i).every(i=>done.has(i)))&&(reachable.has(gate.from)||reachable.has(gate.to))){reachable.add(gate.from);reachable.add(gate.to);}
  level.tasks.forEach((task,i)=>{if(reachable.has(task.room)&&(task.depends??[]).every(d=>done.has(d)))done.add(i);});
 }assert.equal(done.size,level.tasks.length,'no objective is locked behind its own gate: '+level.id);assert.ok(reachable.has(level.exit.room));}

 const old=createDefaultSave();Object.assign(old,{version:34,storyCheckpoint:3,storyCompletedLevel:25,storyWeaponTier:5,walletCoins:1456,vaultCoins:999,auraCoins:73});
 const migrated=sanitizeSave(old);assert.equal(migrated.storyCompletedLevel,25);assert.equal(migrated.storyWeaponTier,5);assert.equal(migrated.walletCoins,1456);assert.equal(migrated.auraCoins,73);
 const full=sanitizeSave({...migrated,storyCompletedLevel:35,storyWeaponTier:7});assert.equal(full.storyCompletedLevel,35);assert.equal(full.storyWeaponTier,7);
 const e=dungeonGame(26);assert.equal(e.weapon,'crossbow');const rifle=dungeonGame(31);assert.equal(rifle.weapon,'rifle');
});
test('spatial broad phase retains every potentially colliding cover at corners and cell boundaries',()=>{
 let original=0,candidates=0;
 for(const level of ADVENTURE_LEVELS){const grid=new WorldCollisionIndex(level.floors,level.solids);
  for(const r of level.solids)for(const radius of [0,2,13,64])for(const [dx,dy] of [[0,0],[r.w/2,r.h/2],[-radius,0],[r.w+radius,r.h],[0,-radius]]){
   const x=r.x+dx,y=r.y+dy,cell=grid.at(x,y);assert.ok(cell);assert.ok(cell.solids.some(s=>s.rect===r));original+=level.solids.length;candidates+=cell.solids.length;
  }
  for(const floor of level.floors)for(const [x,y] of [[floor.x,floor.y],[floor.x+floor.w,floor.y+floor.h]])assert.ok(grid.at(x,y)?.floors.includes(floor));
 }
 assert.ok(candidates<original*.25,{candidates,original});
});
test('collect all reserves combined capacity, leaves full stacks unclaimed and never repeats a claimed level',()=>{
 const inventory={common:98,big:99,food:24,drink:25,pitbull:24,cola:25,tea:25,shield:25};
 const plan=planProgressClaims(35,[2,4],inventory),counts={...inventory};
 for(const level of plan.levels){assert.ok(![2,4].includes(level));const reward=progressReward(level);if(reward.type==='case'||reward.type==='buff'){const key=reward.kind;counts[key]+=reward.amount;assert.ok(counts[key]<=(reward.type==='case'?99:25));}}
 assert.ok(plan.blocked.length>0);assert.ok(plan.levels.some(n=>progressReward(n).type==='coins'));
 const repeat=planProgressClaims(35,[2,4,...plan.levels],counts);assert.deepEqual(repeat.levels,[]);assert.deepEqual(repeat.blocked,plan.blocked);
});
test('three new Run districts have dedicated scenery, unique hazards and a safe lane or feasible common action',()=>{
 assert.equal(RUNNER_ZONES.length,13);assert.equal(new Set(runnerDistrictRoute(543)).size,13);
 const hazards=new Set(['fallen-log','snag-arch','rockfall','stone-arch','timber-stack','saw-beam']);
 for(let district=10;district<=12;district++){
  const seen=new Set();for(let seed=1;seed<=15;seed++){
   const e=new RunnerEngine({phase(){},coins(){},finish(){},sound(){},zone(){},route(){}});
   const start=district*420;Object.assign(e,{objects:[],seed:0,distance:start,randomState:seed,nextId:0,nextRow:start+32,nextScenery:start+9,nextCrossing:start+170,rowIndex:0,sceneryIndex:0,lastRowEnd:start+12,lastMandatory:-10,safeLane:0});e.generateAhead();
   const local=e.objects.filter(o=>o.district===district);for(const o of local){seen.add(o.kind);assert.ok([o.x,o.z,o.height,o.depth].every(Number.isFinite));}
   assert.ok(!local.some(o=>['building','city-block','car','truck'].includes(o.kind)));
   for(const o of local.filter(o=>hazards.has(o.kind))){if(runnerJumpObstacle(o.kind))assert.ok(o.height+4<485**2/(2*1280));const row=local.filter(n=>hazards.has(n.kind)&&Math.abs(n.z-o.z)<Math.max(n.depth/2,1.1));if(new Set(row.map(n=>n.x)).size===3)assert.ok(row.every(n=>n.kind===row[0].kind)&&(runnerJumpObstacle(o.kind)||runnerRollObstacle(o.kind)));}
  }
  assert.ok(seen.has(district===11?'cliff':'pine'));assert.ok(seen.has(district===10?'snag-arch':district===11?'stone-arch':'saw-beam'));
 }
 const next=runnerUpcomingDistrict(417,0);assert.equal(next.meters,3);assert.equal(next.district,1);
});
test('rifle penetrates distinct targets once and bolt interrupts a surviving enemy',()=>{
 for(const [id,weapon] of [[26,'crossbow'],[31,'rifle']]){
  const e=dungeonGame(id),r=e.levelData.rooms[0];e.enemies.forEach(n=>n.hp=0);e.barrels.forEach(b=>b.active=false);e.levelData.hazards.forEach(h=>h.period=10000);
  const free=[];for(let y=r.y+80;y<r.y+r.h-100;y+=16)for(let x=r.x+50;x<r.x+r.w-260;x+=16)if([0,50,100,150,200].every(dx=>e.canStand(x+dx,y,3)))free.push({x,y});
  assert.ok(free.length);const p=free[Math.floor(free.length/2)];Object.assign(e.player,{...p,angle:0});
  const foes=e.enemies.slice(0,3);foes.forEach((n,i)=>Object.assign(n,{x:p.x+75+i*50,y:p.y,hp:20,maxHp:20,awake:true,room:0,boss:false,role:'grunt',mode:'recover',timer:10}));e.weapon=weapon;e.punch();
  for(let i=0;i<22;i++)e.advance(1/60);
  assert.ok(foes[0].hp<20);if(weapon==='rifle')assert.ok(foes.every(n=>n.hp===16));else {assert.equal(foes[0].hp,17);assert.equal(foes[1].hp,20);}
 }
});
