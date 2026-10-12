import test from 'node:test';
import assert from 'node:assert/strict';
import { AdventureEngine, ADVENTURE_STEP } from '../app/adventure-engine.ts';
import { ADVENTURE_LEVELS, ADVENTURE_WEAPONS } from '../app/adventure-levels.ts';
import { createDefaultSave, sanitizeSave } from '../app/game-logic.ts';
import { playLevel } from './helpers/adventure-level-autoplay.mjs';
const events = { change() {}, checkpoint() {}, sound() {}, run() {}, bar() {} };
function game(id) { const e = new AdventureEngine(3, events, { completedLevel: 5 }); assert.equal(e.selectLevel(id), true); while (e.phase==='dialogue') e.nextDialogue(); return e; }
function tick(e,seconds) { for(let i=0;i<Math.ceil(seconds*60);i++) e.advance(ADVENTURE_STEP); }
test('five increasing levels have distinct mechanics, valid spawns, connected exits and bounded pools',()=>{
  assert.deepEqual(ADVENTURE_LEVELS.map(l=>l.rooms.length),[3,4,5,6,7]);
  assert.equal(new Set(ADVENTURE_LEVELS.map(l=>l.mechanic)).size,5);
  for(const level of ADVENTURE_LEVELS) {
    const e=game(level.id); assert.equal(e.enemies.length,level.enemies.length); assert.ok(e.enemies.length<=32); assert.ok(e.canStand(e.player.x,e.player.y));
    for (const enemy of e.enemies) assert.ok(e.canStand(enemy.x,enemy.y),`spawn ${level.id}/${enemy.id}`);
    for (let i=0;i<level.gates.length;i++) { const gate=level.gates[i]; assert.equal(e.canStand(240,gate.y+6),false); e.cleared[i]=true; assert.equal(e.canStand(240,gate.y+6),true); }
    e.cleared.fill(true);
    for(let y=level.rooms.at(-1).y+25;y<level.rooms[0].y+level.rooms[0].h-20;y+=4) assert.ok(e.canStand(240,y),`central route ${level.id}/${y}`);
    if(level.id>1) assert.ok(level.enemies.length>ADVENTURE_LEVELS[level.id-2].enemies.length);
  }
});
test('the basement door opens selection after the first victory and locked levels cannot be entered',()=>{
  const e=new AdventureEngine(3,events); e.player.x=371;e.player.y=128;e.interact();
  assert.equal(e.area,'apartment');assert.equal(e.phase,'levels');assert.equal(e.selectLevel(3),false);assert.equal(e.selectLevel(0),false);assert.equal(e.selectLevel(2.5),false);
  e.closeLevels(); assert.equal(e.phase,'playing'); assert.equal(e.selectLevel(2),true);assert.equal(e.area,'sewer');assert.equal(e.view().roomCount,4);
});
test('level two grants an animated area sabre, with two damage and a shared cooldown across weapon changes',()=>{
  const e=game(2);assert.equal(e.weapon,'sabre');assert.equal(e.weaponTier,1);assert.equal(e.selectWeapon('pistol'),false);
  e.player.x=240;e.player.y=e.levelData.rooms[0].y+70;
  e.enemies[0].x=215;e.enemies[0].y=e.player.y-35;e.enemies[1].x=265;e.enemies[1].y=e.player.y-35;e.enemies[2].x=240;e.enemies[2].y=e.player.y-50;
  e.setInput(0,0,true);tick(e,ADVENTURE_STEP);assert.ok(e.enemies.slice(0,3).every(enemy=>enemy.hp===1));assert.ok(e.punchTime>.3);assert.equal(e.punchCooldown,ADVENTURE_WEAPONS.sabre.cooldown);
  const hp=e.enemies[0].hp;e.selectWeapon('fist');tick(e,.4);assert.equal(e.enemies[0].hp,hp);e.setInput(0,0,false);
});
test('level three grants a pistol with travelling projectiles, and bullets never hurt the firing player',()=>{
  const e=game(3);assert.equal(e.weapon,'pistol');assert.equal(e.weaponTier,2);assert.equal(e.selectWeapon('sabre'),true);e.selectWeapon('pistol');
  const r=e.levelData.rooms[0];e.player.x=240;e.player.y=r.y+250;const enemy=e.enemies[2];enemy.x=240;enemy.y=r.y+105;
  e.setInput(0,0,true);tick(e,ADVENTURE_STEP);e.setInput(0,0,false);assert.ok(e.bullets.some(b=>b.active && b.owner==='player'));assert.equal(enemy.hp,3);
  tick(e,.28);assert.equal(enemy.hp,2);assert.equal(e.player.hp,3);
});
test('pump steam gives a warning before damage, while dash immunity crosses an active jet',()=>{
  const e=game(2),jet=e.levelData.jets[0];e.player.x=240;e.player.y=jet.y+13;
  e.time=2.9;assert.equal(e.jetPhase(0),'warning');tick(e,.05);assert.equal(e.player.hp,3);
  e.time=3.65;tick(e,ADVENTURE_STEP);assert.equal(e.player.hp,2);tick(e,.2);assert.equal(e.player.hp,2);
  e.invincible=0;e.dodgeCooldown=0;e.setInput(0,-1,false);e.dodge();tick(e,.12);assert.equal(e.player.hp,2);
});
test('powder barrels explode from real projectiles, harm nearby enemies, and cannot pay a kill twice',()=>{
  const e=game(3),b=e.barrels[0];const enemy=e.enemies[0];enemy.x=b.x+30;enemy.y=b.y;
  Object.assign(e.bullets[0],{x:b.x,y:b.y+35,vx:0,vy:-500,life:1,active:true,owner:'player'});tick(e,.1);
  assert.equal(b.active,false);assert.ok(b.explosion>0);assert.equal(enemy.hp,0);const coins=e.coins.filter(c=>c.active).length;
  Object.assign(e.bullets[0],{x:b.x,y:b.y,vx:0,vy:0,life:1,active:true,owner:'player'});tick(e,.05);assert.equal(e.coins.filter(c=>c.active).length,coins);
});
test('flood current changes real movement while preserving wall and gate collision',()=>{
  const e=game(4),water=e.levelData.currents[0];e.player.x=240;e.player.y=water.y+40;
  const start={...e.player};e.setInput(0,0,false);tick(e,.5);assert.ok(e.player.x>start.x);assert.ok(e.player.y<start.y);assert.ok(e.canStand(e.player.x,e.player.y));
});
test('the final warden has a circular telegraph and gains a three-shot fan below half health',()=>{
  const e=game(5),boss=e.enemies.find(enemy=>enemy.boss);assert.equal(boss.maxHp,12);assert.equal(boss.room,6);
  e.room=6;e.player.x=boss.x;e.player.y=boss.y+65;e.cleared.fill(true);boss.mode='windup';boss.timer=0;boss.attackAngle=Math.PI/2;boss.hp=6;
  tick(e,ADVENTURE_STEP);assert.equal(e.player.hp,2);assert.equal(e.bullets.filter(b=>b.active && b.owner==='enemy').length,3);
});
test('v21 and v22 saves keep their completed first level, and five-level progress and weapons survive reload',()=>{
  for(const version of [21,22]) {const s=sanitizeSave({...createDefaultSave(),version,storyCheckpoint:3,walletCoins:5432,vitaPowerCount:2});assert.equal(s.storyCompletedLevel,1);assert.equal(s.walletCoins,5432);assert.equal(s.vitaPowerCount,2);}
  const save=sanitizeSave(JSON.parse(JSON.stringify({...createDefaultSave(),storyCheckpoint:3,storyCompletedLevel:5,storyWeaponTier:2,healCount:3})));
  assert.equal(save.storyCompletedLevel,5);assert.equal(save.storyWeaponTier,2);assert.equal(save.healCount,3);
});
for(const id of [2,3,4,5]) test(`level ${id} can be completed using real inputs, earned weapons and purchased consumables`,()=>{
  const result=playLevel(id,id>=4?{budget:20000,healItems:5,shieldItems:1}:{});
  assert.equal(result.rooms,ADVENTURE_LEVELS[id-1].rooms.length);assert.equal(result.defeated,ADVENTURE_LEVELS[id-1].enemies.length);
  assert.deepEqual(result.completed,[id]);assert.equal(result.returnArea,'apartment');assert.ok(result.hearts>0);
  assert.ok(result.healed<=result.purchased.heals);assert.ok(result.revived<=result.purchased.shields);
});
test('crossing a cleared gate backwards keeps the ongoing fight active, with stable collisions at a pillar tangent',()=>{
  const e=game(5);e.cleared[0]=true;e.player.y=e.levelData.rooms[1].y+300;tick(e,ADVENTURE_STEP);assert.equal(e.room,1);
  e.player.y=e.levelData.rooms[0].y+40;tick(e,ADVENTURE_STEP);assert.equal(e.room,1);
  const cover=e.levelData.solids[1];assert.ok(e.canStand(cover.x+cover.w+13-1e-12,cover.y+15));
  assert.equal(e.canStand(cover.x+cover.w+12,cover.y+15),false);
});
