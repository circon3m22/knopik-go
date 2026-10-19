import assert from 'node:assert/strict';
import test from 'node:test';
import { AdventureEngine, ADVENTURE_STEP, sanitizeStoryCheckpoint } from '../app/adventure-engine.ts';
import { createDefaultSave, sanitizeSave, SAVE_VERSION } from '../app/game-logic.ts';
import {prepareDungeonFinish} from './helpers/dungeon-fixtures.mjs';
import {ADVENTURE_LEVELS} from '../app/adventure-levels.ts';
import { playFirstChapter } from './helpers/adventure-autoplay.mjs';

function game(checkpoint = 0) {
  const saved = [], sounds = [], exits = [];
  const engine = new AdventureEngine(checkpoint, { change() {}, checkpoint: n => saved.push(n), sound: n => sounds.push(n), run: () => exits.push('run'), bar: () => exits.push('bar') });
  return { engine, saved, sounds, exits };
}
function tick(e, seconds) { for (let i = 0; i < Math.ceil(seconds * 60); i++) e.advance(ADVENTURE_STEP); }
function dialogue(e) { while (e.phase === 'dialogue') e.nextDialogue(); }
function start(e) { e.begin(); dialogue(e); }

test('the entire first chapter is reachable and beatable through real movement, attacks and dodges', () => {
  const result = playFirstChapter();
  assert.deepEqual(result.checkpoints, [1, 2, 3]); assert.equal(result.enemiesDefeated, ADVENTURE_LEVELS[0].enemies.length);
  assert.equal(result.returnArea, 'apartment'); assert.equal(result.phase, 'playing'); assert.ok(result.heartsAtVictory > 0);
});
test('invalid frame durations and movement values cannot corrupt simulation clocks or positions', () => {
  const { engine: e } = game(3); const before = { ...e.player };
  for (const delta of [NaN, Infinity, -1, 0]) e.advance(delta);
  assert.equal(e.time, 0); assert.deepEqual(e.player, before);
  e.setInput(NaN, Infinity, false); tick(e, .1); assert.deepEqual(e.player, before); assert.ok(Number.isFinite(e.time));
});

test('old saves preserve the economy and start the new chapter; story progress survives sanitization', () => {
  const old = sanitizeSave({ ...createDefaultSave(), version: 20, walletCoins: 4123, runnerBest: 1890, brainrotInventory: { tralalero: 4 }, storyCheckpoint: 3 });
  assert.equal(old.walletCoins, 4123); assert.equal(old.runnerBest, 1890); assert.equal(old.brainrotInventory.tralalero, 4); assert.equal(old.storyCheckpoint, 0);
  assert.equal(SAVE_VERSION, 37);
  for (const n of [0, 1, 2, 3]) assert.equal(sanitizeSave({ ...old, storyCheckpoint: n }).storyCheckpoint, n);
  for (const invalid of [null, '3', NaN, Infinity, {}, -4]) assert.equal(sanitizeStoryCheckpoint(invalid), 0);
  assert.equal(sanitizeStoryCheckpoint(8), 3);
});
test('opening is a timed film, freezes on pause and hands off directly to the first mission', () => {
 const {engine:e,saved,exits}=game();assert.equal(e.phase,'opening');assert.equal(e.view().dialogue,'');
 tick(e,2);const time=e.openingTime;e.pause();e.advance(10);assert.equal(e.openingTime,time);assert.equal(e.view().cinematic,true);
 e.resume();tick(e,22);assert.equal(e.area,'sewer');assert.equal(e.phase,'playing');assert.equal(e.view().dialogue,'');assert.deepEqual(saved,[1,2]);assert.deepEqual(exits,[]);
 const open=game(3);open.engine.player.x=692;open.engine.player.y=1032;open.engine.interact();assert.deepEqual(open.exits,['run']);
 open.engine.player.x=252;open.engine.player.y=350;open.engine.interact();assert.deepEqual(open.exits,['run','bar']);
});
test('skipping the opening is idempotent and checkpoint resumes have no tutorial dialogue', () => {
 const {engine:e,saved}=game();assert.equal(e.skipOpening(),true);assert.equal(e.skipOpening(),false);assert.equal(e.phase,'playing');assert.equal(e.player.hp,3);assert.equal(e.weapon,'fist');assert.deepEqual(saved,[1,2]);
 for(const checkpoint of [1,2,3]){const resumed=game(checkpoint).engine;resumed.begin();assert.equal(resumed.phase,'playing');assert.equal(resumed.view().dialogue,'');}
});
test('movement is normalized and deterministic at 30, 60 and 120 Hz', () => {
  const run = fps => { const { engine: e } = game(3); e.player.x = 692; e.player.y = 860; e.setInput(1, 1, false); for (let i = 0; i < fps * .5; i++) e.advance(1 / fps); return e.player; };
  assert.deepEqual(run(30), run(60)); assert.deepEqual(run(120), run(60));
  const { engine: e } = game(3); e.player.x = 692; e.player.y = 860; e.setInput(1, 1, false); tick(e, .5);
  assert.ok(Math.abs(Math.hypot(e.player.x - 692, e.player.y - 860) - 77) < .01);
});
test('walls, furniture, corridor gates and dodge collision prevent tunnelling', () => {
  const { engine: e } = game(3); e.player.x = 684; e.player.y = 427; e.setInput(-1, 0, false); e.dodge(); tick(e, .3);
  assert.ok(e.player.x >= 661); assert.equal(e.canStand(562, 422), false);
  const sewer = game(2).engine; start(sewer); const gate=sewer.levelData.gates[0],cover=sewer.levelData.solids[0],room=sewer.levelData.rooms[0]; assert.equal(sewer.canStand(gate.x+gate.w/2, gate.y+gate.h/2), false);
  sewer.cleared[0] = true; assert.equal(sewer.canStand(gate.x+gate.w/2, gate.y+gate.h/2), true);
  assert.equal(sewer.canStand(cover.x+cover.w/2, cover.y+cover.h/2), false); assert.equal(sewer.canStand(room.x-20, room.y+100), false);
});
test('melee respects range and solid geometry, with autoaim and hit recovery', () => {
  const { engine: e } = game(2); start(e);e.selectWeapon('fist');
  e.player.x = e.levelData.spawn.x; e.player.y = e.levelData.rooms[0].y+e.levelData.rooms[0].h-160; e.enemies[0].x = e.player.x; e.enemies[0].y = e.player.y+50; e.player.angle = -Math.PI / 2;
  e.setInput(0, 0, true); tick(e, ADVENTURE_STEP); assert.equal(e.enemies[0].hp, 2); assert.equal(e.enemies[0].mode, 'recover'); assert.equal(e.player.angle, Math.PI / 2);
  tick(e, .2); assert.equal(e.enemies[0].hp, 2);
  const wall = game(2).engine; start(wall); const cover=wall.levelData.solids.find(r=>r.kind==='pipe'); wall.player.x = cover.x+cover.w/2; wall.player.y = cover.y-15; wall.enemies[0].x = wall.player.x; wall.enemies[0].y = cover.y+cover.h+15; wall.setInput(0, 0, true); tick(wall, ADVENTURE_STEP); assert.equal(wall.enemies[0].hp, 3);
});
test('three distinct hits kill; temporary invulnerability prevents one attack eating all hearts', () => {
  const { engine: e } = game(2); start(e);
  e.enemies.forEach(enemy => enemy.hp = 0); e.cleared[0] = true;
  function bullet() { Object.assign(e.bullets[0], { x: e.player.x, y: e.player.y, vx: 0, vy: 0, active: true, life: 1 }); tick(e, ADVENTURE_STEP); }
  bullet(); assert.equal(e.player.hp, 2); bullet(); assert.equal(e.player.hp, 2);
  tick(e, 1.2); bullet(); assert.equal(e.player.hp, 1); tick(e, 1.2); bullet(); assert.equal(e.phase, 'dead');
  e.restart(); assert.equal(e.phase, 'playing'); assert.equal(e.player.hp, 3); assert.ok(e.enemies.every(enemy => enemy.hp > 0)); assert.ok(e.cleared.every(c => !c)); assert.ok(e.bullets.every(b => !b.active));
});
test('gun telegraphs a locked direction, shoots, and walls stop bullets', () => {
  const { engine: e, sounds } = game(2); start(e);
  const gun = e.enemies.find(enemy => enemy.kind === 'gun' && !enemy.wave), room=e.levelData.rooms[gun.room];
  e.cleared[0] = true; e.player.x = room.x+room.w/2; e.player.y = room.y+210; tick(e, .05);
  gun.x=e.player.x;gun.y=e.player.y-110;gun.timer = 0; tick(e, .1); assert.equal(gun.mode, 'windup');
  const angle = gun.attackAngle; e.player.x += 30; e.player.y -= 15; tick(e, .2); assert.equal(gun.attackAngle, angle);
  tick(e, .65); assert.ok(sounds.includes('shot')); assert.ok(e.bullets.some(b => b.active));
  const cover=e.levelData.solids[0];e.bullets.forEach(b => b.active = false); Object.assign(e.bullets[0], { x: cover.x+cover.w/2, y: cover.y-8, vx: 0, vy: 235, active: true, life: 2 }); tick(e, .1); assert.equal(e.bullets[0].active, false);
});
test('pause and dialogue freeze attacks, movement and damage without a resume time jump', () => {
  const { engine: e } = game(2); start(e); e.setInput(1, 0, true); tick(e, .1); e.pause();
  const before = structuredClone({ player: e.player, enemies: e.enemies, time: e.time }); e.advance(120); assert.deepEqual({ player: e.player, enemies: e.enemies, time: e.time }, before);
  e.resume(); tick(e, ADVENTURE_STEP); assert.equal(e.player.x, before.player.x); assert.ok(e.time - before.time < .02);
});
test('victory requires all mission rooms, saves once, and returns to an unlocked home', () => {
  const { engine: e, saved } = game(2); start(e);
  prepareDungeonFinish(e);
  tick(e, 1.25); assert.equal(e.phase, 'playing'); assert.equal(e.view().canFinish, true); assert.deepEqual(saved, []); assert.equal(e.finishLevel(), true); assert.equal(e.phase, 'homecoming'); assert.equal(e.checkpoint, 3); assert.deepEqual(saved, [3]); assert.equal(e.finishLevel(), false); e.advance(20); assert.deepEqual(saved, [3]);
  e.returnHome(); dialogue(e); assert.equal(e.area, 'apartment'); assert.equal(e.phase, 'playing'); assert.equal(e.player.hp, 3);
});
test('defeated Sahurs drop bounded coins; pickups credit exactly once and restart does not duplicate them', () => {
  let credited = 0;
  const e = new AdventureEngine(2, { change() {}, checkpoint() {}, sound() {}, run() {}, bar() {}, collect: n => credited += n }); start(e);
  e.player.x = e.levelData.spawn.x; e.player.y = e.levelData.rooms[0].y+e.levelData.rooms[0].h-170; const enemy = e.enemies[0]; enemy.x = e.player.x; enemy.y = e.player.y+40; enemy.hp = 1;
  e.setInput(0, 0, true); tick(e, ADVENTURE_STEP); e.setInput(0, 0, false);
  assert.equal(enemy.hp, 0); assert.equal(e.coins.filter(c => c.active).length, 3); assert.equal(credited, 0);
  e.player.x = enemy.x; e.player.y = enemy.y; tick(e, .35); assert.equal(credited, 3); assert.equal(e.view().coins, 3); assert.ok(e.coins.every(c => !c.active));
  tick(e, 1); assert.equal(credited, 3);
  e.phase = 'dead'; e.restart(); assert.equal(credited, 3); assert.equal(e.view().coins, 0); assert.ok(e.coins.every(c => !c.active)); assert.equal(e.coins.length, 40);
});
test('healing consumes one owned drink for one heart, including cleared dungeon rooms, and never spends at full health or on pause', () => {
  let stock = 2, uses = 0;
  const e = new AdventureEngine(2, { change() {}, checkpoint() {}, sound() {}, run() {}, bar() {}, consumeHeal() { if (!stock) return false; stock--; uses++; return true; } }); start(e);
  assert.equal(e.heal(), false); assert.equal(uses, 0);
  e.player.hp = 1; assert.equal(e.heal(), true); assert.equal(e.player.hp, 2); assert.equal(stock, 1);
  assert.equal(e.heal(), true); assert.equal(e.player.hp, 3); assert.equal(stock, 0);
  e.player.hp = 2; assert.equal(e.heal(), false); assert.equal(e.player.hp, 2);
  stock = 1; e.pause(); assert.equal(e.heal(), false); assert.equal(stock, 1); e.resume();
  e.enemies.forEach(enemy => enemy.hp = 0); assert.equal(e.heal(), true); assert.equal(stock, 0); assert.equal(e.player.hp, 3);
  e.phase = 'dead'; e.player.hp = 0; assert.equal(e.heal(), false); assert.equal(uses, 3);
});
test('an activated shield preserves location, kills, gates and coins on death and restores three hearts exactly once', () => {
  let stock = 1, used = 0, armed = 0;
  const e = new AdventureEngine(2, { change() {}, checkpoint() {}, sound() {}, run() {}, bar() {}, activateShield() { if (!stock) return false; stock--; armed++; return true; }, shieldUsed() { used++; } }); start(e);
  assert.equal(e.activateShield(), true); assert.equal(stock, 0); assert.equal(e.activateShield(), false); assert.equal(armed, 1);
  e.enemies.filter(enemy => enemy.room === 0).forEach(enemy => enemy.hp = 0); e.cleared[0] = true; e.collectedCoins = 3;
  const location = { x: e.player.x, y: e.player.y, area: e.area, checkpoint: e.checkpoint };
  const hit = () => { Object.assign(e.bullets[0], { x: e.player.x, y: e.player.y, vx: 0, vy: 0, active: true, life: 1 }); tick(e, ADVENTURE_STEP); };
  hit(); assert.equal(e.player.hp, 2); assert.equal(used, 0); assert.equal(e.shieldReady, true);
  tick(e, 1.2); hit(); assert.equal(e.player.hp, 1); assert.equal(used, 0);
  tick(e, 1.2); hit(); assert.equal(e.player.hp, 3); assert.equal(e.phase, 'playing'); assert.equal(used, 1); assert.equal(e.shieldReady, false);
  assert.deepEqual({ x: e.player.x, y: e.player.y, area: e.area, checkpoint: e.checkpoint }, location);
  assert.equal(e.collectedCoins, 3); assert.equal(e.cleared[0], true); assert.ok(e.enemies.filter(enemy => enemy.room === 0).every(enemy => enemy.hp === 0));
  hit(); tick(e, 1); hit(); assert.equal(e.player.hp, 3); assert.equal(e.view().revived, true);
  tick(e, 1.5); hit(); assert.equal(e.player.hp, 2); assert.equal(e.view().revived, false);
  tick(e, 1.2); hit(); tick(e, 1.2); hit(); assert.equal(e.phase, 'dead'); assert.equal(used, 1);
  e.restart(); assert.equal(e.shieldReady, false); assert.equal(e.activateShield(), false);
});
test('an already active saved shield enters the chapter without charging another item and cannot be armed while paused', () => {
  let armed = 0, used = 0;
  const e = new AdventureEngine(2, { change() {}, checkpoint() {}, sound() {}, run() {}, bar() {}, activateShield() { armed++; return true; }, shieldUsed() { used++; } }, { shield: true });
  assert.equal(e.view().shieldReady, true); start(e); assert.equal(e.activateShield(), false); assert.equal(armed, 0);
  e.enemies.forEach(enemy => enemy.hp = 0); e.player.hp = 1;
  Object.assign(e.bullets[0], { x: e.player.x, y: e.player.y, vx: 0, vy: 0, active: true, life: 1 }); tick(e, ADVENTURE_STEP);
  assert.equal(e.player.hp, 3); assert.equal(used, 1); assert.equal(armed, 0);
  e.pause(); assert.equal(e.activateShield(), false); assert.equal(armed, 0);
  e.resume(); assert.equal(e.activateShield(), true); assert.equal(armed, 1);
});
