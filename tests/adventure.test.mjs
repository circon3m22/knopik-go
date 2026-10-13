import assert from 'node:assert/strict';
import test from 'node:test';
import { AdventureEngine, ADVENTURE_STEP, sanitizeStoryCheckpoint } from '../app/adventure-engine.ts';
import { createDefaultSave, sanitizeSave, SAVE_VERSION } from '../app/game-logic.ts';
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
  assert.deepEqual(result.checkpoints, [1, 2, 3]); assert.equal(result.enemiesDefeated, 7);
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
  assert.equal(SAVE_VERSION, 25);
  for (const n of [0, 1, 2, 3]) assert.equal(sanitizeSave({ ...old, storyCheckpoint: n }).storyCheckpoint, n);
  for (const invalid of [null, '3', NaN, Infinity, {}, -4]) assert.equal(sanitizeStoryCheckpoint(invalid), 0);
  assert.equal(sanitizeStoryCheckpoint(8), 3);
});
test('opening begins seated, pauses for dialogue, and gates the bar and Run until victory', () => {
  const { engine: e, exits } = game();
  assert.equal(e.phase, 'title'); assert.equal(e.player.y, 378);
  const before = { ...e.player }; e.advance(10); assert.deepEqual(e.player, before);
  start(e); assert.equal(e.player.y, 425); assert.equal(e.phase, 'playing');
  e.player.x = 109; e.player.y = 119; e.interact(); assert.equal(e.phase, 'dialogue'); assert.deepEqual(exits, []);
  const open = game(3); open.engine.player.x = 109; open.engine.player.y = 119; open.engine.interact(); assert.deepEqual(open.exits, ['run']);
  open.engine.player.x = 89; open.engine.player.y = 163; open.engine.interact(); assert.deepEqual(open.exits, ['run', 'bar']);
});
test('door encounter teaches dodge before damage, then unlocks the basement', () => {
  const { engine: e, saved } = game(); start(e);
  e.player.x = 371; e.player.y = 124; e.interact(); dialogue(e); assert.equal(e.enemies.length, 1);
  e.setInput(0, 0, true); tick(e, .4); assert.equal(e.enemies[0].hp, 3); assert.equal(e.player.hp, 3);
  e.setInput(-1, 0, false); e.dodge(); assert.equal(e.dodged, true); tick(e, .24);
  e.player.x = 325; e.player.y = 155;
  for (let i = 0; i < 180 && e.phase === 'playing'; i++) { const enemy = e.enemies[0], dx = enemy.x - e.player.x, dy = enemy.y - e.player.y, d = Math.hypot(dx, dy); e.setInput(d > 34 ? dx / d : 0, d > 34 ? dy / d : 0, true); e.advance(ADVENTURE_STEP); }
  assert.equal(e.enemies[0].hp, 0); assert.deepEqual(saved, [1]); dialogue(e);
  e.player.x = 371; e.player.y = 128; e.interact(); assert.equal(e.area, 'basement'); dialogue(e);
  e.player.x = 240; e.player.y = 143; e.interact(); assert.equal(e.area, 'sewer'); assert.deepEqual(saved, [1, 2]);
});
test('movement is normalized and deterministic at 30, 60 and 120 Hz', () => {
  const run = fps => { const { engine: e } = game(3); e.player.x = 210; e.player.y = 450; e.setInput(1, 1, false); for (let i = 0; i < fps * .5; i++) e.advance(1 / fps); return e.player; };
  assert.deepEqual(run(30), run(60)); assert.deepEqual(run(120), run(60));
  const { engine: e } = game(3); e.player.x = 210; e.player.y = 450; e.setInput(1, 1, false); tick(e, .5);
  assert.ok(Math.abs(Math.hypot(e.player.x - 210, e.player.y - 450) - 63) < .01);
});
test('walls, furniture, corridor gates and dodge collision prevent tunnelling', () => {
  const { engine: e } = game(3); e.player.x = 232; e.player.y = 375; e.setInput(-1, 0, false); e.dodge(); tick(e, .3);
  assert.ok(e.player.x >= 209); assert.equal(e.canStand(110, 370), false);
  const sewer = game(2).engine; start(sewer); const gate=sewer.levelData.gates[0],cover=sewer.levelData.solids[0],room=sewer.levelData.rooms[0]; assert.equal(sewer.canStand(240, gate.y+6), false);
  sewer.cleared[0] = true; assert.equal(sewer.canStand(240, gate.y+6), true);
  assert.equal(sewer.canStand(cover.x+cover.w/2, cover.y+cover.h/2), false); assert.equal(sewer.canStand(room.x-20, room.y+100), false);
});
test('melee respects range and solid geometry, with autoaim and hit recovery', () => {
  const { engine: e } = game(2); start(e);
  e.player.x = 240; e.player.y = e.levelData.rooms[0].y+e.levelData.rooms[0].h-160; e.enemies[0].x = 240; e.enemies[0].y = e.player.y+50; e.player.angle = -Math.PI / 2;
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
  e.cleared[0] = true; e.player.x = 240; e.player.y = e.levelData.rooms[1].y+210; tick(e, .05);
  const gun = e.enemies.find(e => e.kind === 'gun' && e.room === 1); gun.x=240;gun.y=e.player.y-110;gun.timer = 0; tick(e, .1); assert.equal(gun.mode, 'windup');
  const angle = gun.attackAngle; e.player.x = 270; e.player.y -= 15; tick(e, .2); assert.equal(gun.attackAngle, angle);
  tick(e, .65); assert.ok(sounds.includes('shot')); assert.ok(e.bullets.some(b => b.active));
  const cover=e.levelData.solids[0];e.bullets.forEach(b => b.active = false); Object.assign(e.bullets[0], { x: cover.x+cover.w/2, y: cover.y-8, vx: 0, vy: 235, active: true, life: 2 }); tick(e, .1); assert.equal(e.bullets[0].active, false);
});
test('pause and dialogue freeze attacks, movement and damage without a resume time jump', () => {
  const { engine: e } = game(2); start(e); e.setInput(1, 0, true); tick(e, .1); e.pause();
  const before = structuredClone({ player: e.player, enemies: e.enemies, time: e.time }); e.advance(120); assert.deepEqual({ player: e.player, enemies: e.enemies, time: e.time }, before);
  e.resume(); tick(e, ADVENTURE_STEP); assert.equal(e.player.x, before.player.x); assert.ok(e.time - before.time < .02);
});
test('victory requires all three rooms, saves once, and returns to an unlocked home', () => {
  const { engine: e, saved } = game(2); start(e);
  for (let room = 0; room < 3; room++) { const r=e.levelData.rooms[room];e.player.x = 240; e.player.y = r.y+r.h-80; e.enemies.filter(enemy => enemy.room === room).forEach(enemy => enemy.hp = 0); tick(e, ADVENTURE_STEP); if (room < 2) assert.equal(e.phase, 'playing'); }
  tick(e, 1.25); assert.equal(e.phase, 'playing'); assert.equal(e.view().canFinish, true); assert.deepEqual(saved, []); assert.equal(e.finishLevel(), true); assert.equal(e.phase, 'won'); assert.equal(e.checkpoint, 3); assert.deepEqual(saved, [3]); assert.equal(e.finishLevel(), false); e.advance(20); assert.deepEqual(saved, [3]);
  e.returnHome(); dialogue(e); assert.equal(e.area, 'apartment'); assert.equal(e.phase, 'playing'); assert.equal(e.player.hp, 3);
});
test('defeated Sahurs drop bounded coins; pickups credit exactly once and death keeps earned coins', () => {
  let credited = 0;
  const e = new AdventureEngine(2, { change() {}, checkpoint() {}, sound() {}, run() {}, bar() {}, collect: n => credited += n }); start(e);
  e.player.x = 240; e.player.y = e.levelData.rooms[0].y+e.levelData.rooms[0].h-170; const enemy = e.enemies[0]; enemy.x = 240; enemy.y = e.player.y+40; enemy.hp = 1;
  e.setInput(0, 0, true); tick(e, ADVENTURE_STEP); e.setInput(0, 0, false);
  assert.equal(enemy.hp, 0); assert.equal(e.coins.filter(c => c.active).length, 3); assert.equal(credited, 0);
  e.player.x = enemy.x; e.player.y = enemy.y; tick(e, .35); assert.equal(credited, 3); assert.equal(e.view().coins, 3); assert.ok(e.coins.every(c => !c.active));
  tick(e, 1); assert.equal(credited, 3);
  e.phase = 'dead'; e.restart(); assert.equal(credited, 3); assert.equal(e.view().coins, 0); assert.ok(e.coins.every(c => !c.active)); assert.equal(e.coins.length, 40);
});
test('healing consumes one owned drink for one heart and never spends at full health, outside combat or on pause', () => {
  let stock = 2, uses = 0;
  const e = new AdventureEngine(2, { change() {}, checkpoint() {}, sound() {}, run() {}, bar() {}, consumeHeal() { if (!stock) return false; stock--; uses++; return true; } }); start(e);
  assert.equal(e.heal(), false); assert.equal(uses, 0);
  e.player.hp = 1; assert.equal(e.heal(), true); assert.equal(e.player.hp, 2); assert.equal(stock, 1);
  assert.equal(e.heal(), true); assert.equal(e.player.hp, 3); assert.equal(stock, 0);
  e.player.hp = 2; assert.equal(e.heal(), false); assert.equal(e.player.hp, 2);
  stock = 1; e.pause(); assert.equal(e.heal(), false); assert.equal(stock, 1); e.resume();
  e.enemies.forEach(enemy => enemy.hp = 0); assert.equal(e.heal(), false); assert.equal(stock, 1);
  e.phase = 'dead'; e.player.hp = 0; assert.equal(e.heal(), false); assert.equal(uses, 2);
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
