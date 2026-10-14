import test from 'node:test';
import assert from 'node:assert/strict';
import {ADVENTURE_LEVELS,ADVENTURE_WEAPONS,DUNGEON_ZONES} from '../app/adventure-levels.ts';
import {AdventureEngine,ADVENTURE_STEP} from '../app/adventure-engine.ts';
import {createDefaultSave,sanitizeSave} from '../app/game-logic.ts';
import {playDungeonLevel} from './helpers/dungeon-autoplay.mjs';
import {dungeonGame,tickDungeon,quietEvents} from './helpers/dungeon-fixtures.mjs';
test('25 authored levels form five distinct zones with five boss finales and finite valid spawns',()=>{
 assert.equal(ADVENTURE_LEVELS.length,25);assert.equal(new Set(ADVENTURE_LEVELS.map(l=>l.name)).size,25);
 assert.equal(new Set(DUNGEON_ZONES.map(z=>z.palette.floor)).size,5);
 assert.deepEqual(DUNGEON_ZONES.map(z=>z.weapon),['sabre','pistol','shotgun','launcher','arc']);
 for(const z of DUNGEON_ZONES)assert.equal(ADVENTURE_LEVELS.filter(l=>l.zone===z.id).length,5);
 for(const l of ADVENTURE_LEVELS){const e=dungeonGame(l.id);assert.ok(e.canStand(e.player.x,e.player.y));assert.ok(e.enemies.length<=36);assert.equal(e.bullets.length,64);
  for(const n of e.enemies)assert.ok(e.canStand(n.x,n.y),`spawn ${l.id}/${n.id}`);
  assert.equal(l.enemies.filter(n=>n.boss).length,l.stage===5?1:0);
  assert.ok(l.gates.some(g=>g.axis==='x'),`side passage ${l.id}`);assert.ok(l.tasks.length>0);
 }
});
test('weapons unlock at a zone entrance, locked weapons remain unavailable and cooldown is shared',()=>{
 for(const [id,weapon,tier]of [[1,'sabre',1],[6,'pistol',2],[11,'shotgun',3],[16,'launcher',4],[21,'arc',5]]){
  const unlocked=[],e=dungeonGame(id,{weaponTier:tier-1},{unlockWeapon:n=>unlocked.push(n)});assert.equal(e.weapon,weapon);assert.equal(e.weaponTier,tier);assert.deepEqual(unlocked,[tier]);
  if(tier<5)assert.equal(e.selectWeapon(DUNGEON_ZONES[tier].weapon),false);
  e.setInput(0,0,true);e.advance(ADVENTURE_STEP);const cooldown=e.punchCooldown;e.setInput(0,0,false);e.selectWeapon('fist');e.advance(ADVENTURE_STEP);assert.ok(e.punchCooldown>cooldown-.04);
 }
});
test('the basement opens the campaign after homecoming and rejects skipped, fractional and out-of-range levels',()=>{
 const e=new AdventureEngine(3,quietEvents);e.player.x=371;e.player.y=128;e.interact();assert.equal(e.phase,'levels');
 for(const id of [0,3,2.5,26,NaN])assert.equal(e.selectLevel(id),false);
 assert.equal(e.selectLevel(2),true);assert.equal(e.view().zone,1);assert.equal(e.view().stage,2);
});
test('the sabre strikes several visible foes and cannot cut through a solid pipe',()=>{
 const e=dungeonGame(1),r=e.levelData.rooms[0];e.player.x=r.x+r.w/2;e.player.y=r.y+r.h-130;
 for(const [i,n]of e.enemies.filter(n=>n.room===0).entries()){n.x=e.player.x+i*30;n.y=e.player.y-48;}
 e.setInput(0,0,true);e.advance(ADVENTURE_STEP);assert.ok(e.enemies.filter(n=>n.room===0).every(n=>n.hp===n.maxHp-2));assert.equal(e.punchCooldown,ADVENTURE_WEAPONS.sabre.cooldown);
 const wall=dungeonGame(1),cover=wall.levelData.solids.find(s=>s.kind==='pipe');wall.player.x=cover.x+cover.w/2;wall.player.y=cover.y-16;const n=wall.enemies[0];n.x=wall.player.x;n.y=cover.y+cover.h+16;wall.setInput(0,0,true);wall.advance(ADVENTURE_STEP);assert.equal(n.hp,3);
});
test('steam warns before hurting, dodge grants immunity, and a valve disables its room hazard',()=>{
 const e=dungeonGame(6),h=e.levelData.hazards[0];e.enemies.forEach(n=>n.hp=0);e.player.x=h.x+h.w/2;e.player.y=h.y+13;
 e.time=h.period-1.5-h.offset;assert.equal(e.dungeon.hazardPhase(0,e.time),'warning');tickDungeon(e,.05);assert.equal(e.player.hp,3);
 e.time=h.period-.7-h.offset;tickDungeon(e,ADVENTURE_STEP);assert.equal(e.player.hp,2);tickDungeon(e,.2);assert.equal(e.player.hp,2);
 e.invincible=0;e.setInput(0,-1,false);e.dodge();tickDungeon(e,.12);assert.equal(e.player.hp,2);
 const index=e.levelData.hazards.findIndex(n=>n.disabledBy!==undefined),trap=e.levelData.hazards[index];assert.equal(e.dungeon.activate(trap.disabledBy,e.time),true);assert.equal(e.dungeon.hazardPhase(index,4.5-trap.offset),'off');
});
test('barrels explode from travelling projectiles and one explosion cannot pay the same kill twice',()=>{
 const e=dungeonGame(11),b=e.barrels[0],n=e.enemies[0];n.x=b.x+30;n.y=b.y;n.hp=3;
 Object.assign(e.bullets[0],{x:b.x,y:b.y+35,vx:0,vy:-500,life:1,active:true,owner:'player',kind:'round',damage:1});tickDungeon(e,.1);
 assert.equal(b.active,false);assert.ok(b.explosion>0);assert.equal(n.hp,0);const coins=e.coins.filter(c=>c.active).length;
 Object.assign(e.bullets[0],{x:b.x,y:b.y,vx:0,vy:0,life:1,active:true,owner:'player'});tickDungeon(e,.05);assert.equal(e.coins.filter(c=>c.active).length,coins);
});
test('a closed sluice removes the real current; wet movement obeys collisions',()=>{
 const e=dungeonGame(16),water=e.levelData.currents.find(c=>c.disabledBy!==undefined);e.room=water.room??1;e.player.x=water.x+50;e.player.y=water.y+50;
 const before={...e.player};e.setInput(0,0,false);tickDungeon(e,.3);assert.ok(Math.hypot(e.player.x-before.x,e.player.y-before.y)>3);assert.ok(e.canStand(e.player.x,e.player.y));
 e.dungeon.activate(water.disabledBy,e.time);const stopped={...e.player};tickDungeon(e,.3);assert.equal(e.player.x,stopped.x);assert.equal(e.player.y,stopped.y);
});
test('v26 stores all 25 levels and six weapon states; legacy progress preserves earned old weapons and economy',()=>{
 for(const version of [21,22]){const s=sanitizeSave({...createDefaultSave(),version,storyCheckpoint:3,walletCoins:5432});assert.equal(s.storyCompletedLevel,1);assert.equal(s.walletCoins,5432);}
 for(const version of [23,24,25]){const s=sanitizeSave({...createDefaultSave(),version,storyCheckpoint:3,storyCompletedLevel:5,storyWeaponTier:2,healCount:3});assert.equal(s.storyCompletedLevel,5);assert.equal(s.storyWeaponTier,2);assert.equal(s.healCount,3);}
 const full=sanitizeSave({...createDefaultSave(),storyCheckpoint:3,storyCompletedLevel:25,storyWeaponTier:5});assert.equal(full.storyCompletedLevel,25);assert.equal(full.storyWeaponTier,5);
 const invalid=sanitizeSave({...full,storyCompletedLevel:999,storyWeaponTier:999});assert.equal(invalid.storyCompletedLevel,25);assert.equal(invalid.storyWeaponTier,5);
});
for(let id=1;id<=25;id++)test(`campaign level ${id} completes through ordinary 60 Hz inputs and its actual objectives`,()=>{
 const r=playDungeonLevel(id,{maxFrames:10000});assert.equal(r.e.dungeon.allDone,true);assert.equal(r.e.cleared[r.e.levelData.exit.room],true);assert.equal(r.e.phase,'levels');assert.ok(r.hearts>0);assert.ok(r.healed<=5);assert.ok(r.revived<=1);
 if(id>1)assert.deepEqual(r.completed,[id]);r.e.returnHome();assert.equal(r.e.area,'apartment');
});
