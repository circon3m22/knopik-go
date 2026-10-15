import './helpers/tsx-loader.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { AdventureEngine, ADVENTURE_STEP } from '../app/adventure-engine.ts';
import { ADVENTURE_WEAPONS } from '../app/adventure-levels.ts';
import { EMPTY_EQUIPMENT } from '../app/knopik-equipment-state.ts';
import { ENERGY_WAVE } from '../app/knopik-combat-equipment.ts';
import { AdventureCooldownPainter } from '../app/adventure-cooldown.ts';
import { dungeonGame, quietEvents, tickDungeon } from './helpers/dungeon-fixtures.mjs';
import { parseAdventureSvg } from './helpers/adventure-svg-dom.mjs';
import { resetSvgMetrics, svgMetrics } from './helpers/runner-svg-dom.mjs';
const { DungeonEnergyArtwork, DungeonEnergyRenderer } = await import('../app/dungeon-energy-art.tsx');
const { AdventureEnergyButton } = await import('../app/adventure-energy-button.tsx');
const { PauseSettingsButton } = await import('../app/game-settings-access.tsx');

function arena(events = {}) {
  const e = dungeonGame(6, { weaponTier: 5, immortal: true }, events);
  e.enemies.forEach(n => n.hp = 0); e.barrels.forEach(n => n.active = false);
  Object.assign(e.player, { x: 494, y: 948, angle: 0 });
  return e;
}
function wear(e, patch) { e.setEquipment({ ...EMPTY_EQUIPMENT, ...patch }); }
function foe(e, i = 0, patch = {}) {
  const n = e.enemies[i];
  Object.assign(n, { x: e.player.x + 80, y: e.player.y, hp: 20, maxHp: 20, awake: true, room: 0, mode: 'recover', timer: 100, role: 'grunt', boss: false, ...patch });
  return n;
}
function fire(e, weapon) { e.selectWeapon(weapon); e.setInput(0, 0, true); e.advance(ADVENTURE_STEP); e.setInput(0, 0, false); }

test('mohawk speeds only melee, goggles only ranged; unworn gear has no effect and surge combines with either', () => {
  for (const weapon of Object.keys(ADVENTURE_WEAPONS)) for (const accessory of [null, 'goggles']) for (const mohawk of [false, true]) for (const surge of [false, true]) {
    const e = arena({ consumeSurge: () => true }); wear(e, { accessory, mohawk }); if (surge) e.activateSurge();
    fire(e, weapon);
    const melee = weapon === 'fist' || weapon === 'sabre';
    const expected = ADVENTURE_WEAPONS[weapon].cooldown * (melee ? mohawk ? .8 : 1 : accessory === 'goggles' ? .85 : 1) * (surge ? .65 : 1);
    assert.equal(e.punchCooldown, expected); assert.equal(e.punchCooldownDuration, expected);
  }
});

test('tubeteika shortens roll recovery without lengthening the roll or invulnerability', () => {
  const bare = arena(), hat = arena(); wear(hat, { hat: true }); bare.dodge(); hat.dodge();
  assert.equal(hat.dodgeCooldown, bare.dodgeCooldown * .8);
  assert.equal(hat.dodgeTime, bare.dodgeTime); assert.equal(hat.invincible, bare.invincible);
  tickDungeon(hat, .54); assert.equal(hat.view().dodgeReady, true);
  tickDungeon(bare, .54); assert.equal(bare.view().dodgeReady, false);
});

test('bandana heals two hearts for exactly one stocked item, never overheals or consumes an unavailable heal', () => {
  let stock = 2, used = 0;
  const e = arena({ consumeHeal() { if (!stock) return false; stock--; used++; return true; } });
  wear(e, { accessory: 'bandana' }); e.player.hp = 1;
  assert.equal(e.heal(), true); assert.equal(e.player.hp, 3); assert.equal(used, 1);
  assert.equal(e.heal(), false); assert.equal(used, 1);
  wear(e, {}); e.player.hp = 1; e.heal(); assert.equal(e.player.hp, 2); assert.equal(used, 2);
  wear(e, { accessory: 'bandana' }); assert.equal(e.heal(), false); assert.equal(e.player.hp, 2);
});

test('collar pulls distant coins along clear paths and credits each coin once; walls stop its magnet', () => {
  for (const collar of [false, true]) {
    let earned = 0; const e = arena({ collect: n => earned += n }); wear(e, { accessory: collar ? 'charm' : null });
    const coin = e.coins[0]; Object.assign(coin, { x: e.player.x + 110, y: e.player.y, age: .3, active: true });
    tickDungeon(e, .5); assert.equal(earned, collar ? 1 : 0); assert.equal(coin.active, !collar);
    tickDungeon(e, .5); assert.equal(earned, collar ? 1 : 0);
  }
  const e = arena(); wear(e, { accessory: 'charm' }); Object.assign(e.player, { x: 175, y: 940 });
  const coin = e.coins[0]; Object.assign(coin, { x: 255, y: 940, age: .3, active: true });
  assert.equal(e.lineClear(e.player, coin), false); tickDungeon(e, .3);
  assert.equal(coin.x, 255); assert.equal(coin.active, true);
});

test('cape wave expands in all directions and hits each enemy once, including armoured enemies behind the player', () => {
  const e = arena(); wear(e, { accessory: 'cape' });
  const enemies = Array.from({ length: 8 }, (_, i) => foe(e, i, { x: e.player.x + Math.cos(i * Math.PI / 4) * 90, y: e.player.y + Math.sin(i * Math.PI / 4) * 90, role: i ? 'grunt' : 'armored' }));
  assert.equal(e.activateEnergyWave(), true); tickDungeon(e, .1); enemies.forEach(n => assert.equal(n.hp, 20));
  tickDungeon(e, .2); enemies.forEach(n => assert.equal(n.hp, 16));
  tickDungeon(e, .5); enemies.forEach(n => assert.equal(n.hp, 16)); assert.equal(e.energyWave.active, false);
});

test('energy wave respects cover, range, sleeping enemies and room boundaries', () => {
  const e = arena(); wear(e, { accessory: 'cape' });
  const asleep = foe(e, 0, { awake: false }), otherRoom = foe(e, 1, { room: 1 }), far = foe(e, 2, { x: e.player.x + 245 });
  // A pillar is directly between these two valid positions.
  Object.assign(e.player, { x: 175, y: 940 }); const covered = foe(e, 3, { x: 255, y: 940 });
  assert.equal(e.lineClear(e.player, covered), false); e.activateEnergyWave(); tickDungeon(e, 1);
  for (const n of [asleep, otherRoom, far, covered]) assert.equal(n.hp, 20);
});

test('cape disperses hostile rounds and grenades without exploding them or consuming friendly shots', () => {
  const e = arena(); wear(e, { accessory: 'cape' }); e.player.hp = 2;
  for (let i = 0; i < 3; i++) Object.assign(e.bullets[i], { x: e.player.x + 70, y: e.player.y, vx: 0, vy: 0, life: 10, active: true, owner: i === 2 ? 'player' : 'enemy', kind: i === 1 ? 'grenade' : 'round', splash: 116 });
  e.activateEnergyWave(); tickDungeon(e, .25);
  assert.equal(e.bullets[0].active, false); assert.equal(e.bullets[1].active, false); assert.equal(e.bullets[2].active, true); assert.equal(e.player.hp, 2);
});

test('wave requires a worn cape and live combat; cooldown lasts thirty simulation seconds and freezes on pause', () => {
  const e = arena(); assert.equal(e.activateEnergyWave(), false); wear(e, { accessory: 'cape' });
  assert.equal(e.activateEnergyWave(), true); assert.equal(e.energyCooldown, 30); assert.equal(e.activateEnergyWave(), false);
  tickDungeon(e, 10); e.pause(); const left = e.energyCooldown, age = e.energyWave.age; e.advance(40);
  assert.equal(e.energyCooldown, left); assert.equal(e.energyWave.age, age); assert.equal(e.activateEnergyWave(), false);
  e.resume(); tickDungeon(e, 19); assert.equal(e.activateEnergyWave(), false);
  tickDungeon(e, 1); assert.equal(e.energyCooldown, 0); assert.equal(e.activateEnergyWave(), true);
  const home = new AdventureEngine(3, quietEvents); wear(home, { accessory: 'cape' }); assert.equal(home.activateEnergyWave(), false);
  e.phase = 'dead'; assert.equal(e.activateEnergyWave(), false);
});

test('changing outfit, weapon, area or restarting cannot refill cape energy; area transitions clear the visual wave', () => {
  const e = arena(); wear(e, { accessory: 'cape' }); e.activateEnergyWave(); tickDungeon(e, .1);
  const left = e.energyCooldown; wear(e, {}); wear(e, { accessory: 'cape' }); e.selectWeapon('arc'); assert.equal(e.energyCooldown, left);
  e.pause(); e.exitToApartment(); assert.equal(e.energyCooldown, left); assert.equal(e.energyWave.active, false);
  e.selectLevel(6); assert.equal(e.energyCooldown, left); e.phase = 'dead'; e.restart(); assert.equal(e.energyCooldown, left);
});

test('surge snapshots wave damage at activation without changing its thirty-second recovery', () => {
  const e = arena({ consumeSurge: () => true }); wear(e, { accessory: 'cape' }); const n = foe(e);
  e.activateSurge(); e.activateEnergyWave(); e.surgeTime = 0; tickDungeon(e, .3);
  assert.equal(n.hp, 12); assert.ok(e.energyCooldown > 29); assert.equal(ENERGY_WAVE.cooldown, 30);
});

test('attack fill uses the actual shot interval across weapon switches and does not notify React on every cooldown tick', () => {
  let changes = 0; const e = arena({ change: () => changes++ }); fire(e, 'launcher'); const duration = e.punchCooldownDuration;
  e.selectWeapon('pistol'); assert.equal(e.punchCooldownDuration, duration); changes = 0; tickDungeon(e, .3);
  assert.ok(changes < 3, `Expected sparse state changes, got ${changes}`);
  const fill = { style: {} }, time = { textContent: '' }, attributes = {}, button = { querySelector: s => s.includes('fill') ? fill : time, setAttribute: (k, v) => attributes[k] = v };
  const painter = new AdventureCooldownPainter(); painter.paintButton(button, 30, 30); assert.equal(fill.style.transform, 'scaleY(0)'); assert.equal(time.textContent, '30с');
  painter.paintButton(button, 15, 30); assert.equal(fill.style.transform, 'scaleY(0.5)'); assert.equal(attributes['data-cooldown-state'], 'charging');
  painter.paintButton(button, 0, 30); assert.equal(fill.style.transform, 'scaleY(1)'); assert.equal(time.textContent, 'Готово'); assert.equal(attributes['data-cooldown-state'], 'ready');
});

test('energy animation reuses its pixel artwork throughout expansion, pause and reduced motion', () => {
  for (const reduced of [false, true]) {
    const e = arena(); wear(e, { accessory: 'cape' }); e.activateEnergyWave();
    const svg = parseAdventureSvg(renderToStaticMarkup(React.createElement('svg', null, React.createElement(DungeonEnergyArtwork))));
    const renderer = new DungeonEnergyRenderer(svg, reduced); resetSvgMetrics();
    for (let i = 0; i < 40; i++) { e.advance(ADVENTURE_STEP); renderer.paint(e); }
    assert.equal(svgMetrics.created, 0); assert.equal(svg.querySelector('[data-energy-wave]').getAttribute('display'), 'none');
    assert.equal(svg.querySelectorAll('[data-energy-spark]').length, 12);
    if (reduced) assert.equal(svg.querySelector('[data-energy-flash]').getAttribute('opacity'), '0');
  }
});

test('cape button has a separate accessible action, and settings inherits the same pause action class', () => {
  const button = renderToStaticMarkup(React.createElement(AdventureEnergyButton, { disabled: true, onActivate() {} }));
  assert.match(button, /data-cooldown-fill/); assert.match(button, /disabled/); assert.match(button, /Энергетическая волна плаща/);
  const settings = renderToStaticMarkup(React.createElement(PauseSettingsButton, { className: 'adventure-secondary' }));
  assert.match(settings, /class="pause-settings-button adventure-secondary"/);
});
