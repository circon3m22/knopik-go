import './helpers/tsx-loader.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
const { AdventureScene, AdventureRenderer } = await import('../app/adventure-artwork.tsx');
import { AdventureEngine } from '../app/adventure-engine.ts';
import { adventureFacing, projectAdventureY } from '../app/adventure-projection.ts';
import { parseAdventureSvg } from './helpers/adventure-svg-dom.mjs';
import { resetSvgMetrics, svgMetrics } from './helpers/runner-svg-dom.mjs';
import { THEMES } from '../app/cosmetic-engine.ts';

const events = { change() {}, checkpoint() {}, sound() {}, run() {}, bar() {} };
test('every owned background has its own apartment; night, sky, hammam and bath render distinct interiors', () => {
  const outputs = [];
  for (const theme of Object.keys(THEMES)) {
    const markup = renderToStaticMarkup(React.createElement(AdventureScene, { area: 'apartment', theme }));
    assert.ok(markup.includes(`data-apartment-theme="${theme}"`)); assert.ok(markup.includes('home-window')); assert.ok(markup.includes('МИНИ-БАР')); outputs.push(markup);
  }
  assert.equal(new Set(outputs).size, 6);
});
function scene(reducedMotion = true) { const engine = new AdventureEngine(2, events), svg = parseAdventureSvg(renderToStaticMarkup(React.createElement(AdventureScene, { area: 'sewer' }))); const renderer = new AdventureRenderer(svg, reducedMotion); renderer.resize(390, 530); return { engine, svg, renderer }; }
test('both characters show backs moving up, faces moving down, and mirrored side profiles', () => {
  const { engine: e, svg, renderer } = scene();
  const body = svg.querySelector('[data-player-body]'), enemy = svg.querySelector('[data-enemy-body]');
  for (const [angle, pose] of [[-Math.PI / 2, 'back'], [Math.PI / 2, 'front'], [0, 'side'], [Math.PI, 'side']]) {
    e.player.angle = e.enemies[0].angle = angle; renderer.paint(e, true);
    for (const actor of [body, enemy]) { for (const frame of actor.querySelectorAll('[data-direction]')) assert.equal(frame.getAttribute('display'), frame.getAttribute('data-direction') === pose ? 'inline' : 'none'); }
    assert.equal(body.getAttribute('transform'), 'translate(0 0)');
    assert.equal(body.querySelector('[data-direction="side"]').getAttribute('transform'), angle === Math.PI ? 'scale(-1 1)' : 'scale(1 1)');
  }
  assert.equal(adventureFacing(-Math.PI / 4), 'back-right'); assert.equal(adventureFacing(Math.PI / 4), 'front-right');
  for (const angle of [Math.PI / 4, -Math.PI / 4, Math.PI * 3 / 4, -Math.PI * 3 / 4]) {
    e.player.angle = e.enemies[0].angle = angle; renderer.paint(e, true);
    const facing = adventureFacing(angle), pose = facing.startsWith('front') ? 'front-diagonal' : 'back-diagonal';
    for (const actor of [body, enemy]) for (const frame of actor.querySelectorAll('[data-direction]')) assert.equal(frame.getAttribute('display'), frame.getAttribute('data-direction') === pose ? 'inline' : 'none');
  }
});
test('perspective uses one projection for scenery, actors and bullets, and sorts sprites by their feet', () => {
  const { engine: e, svg, renderer } = scene(); e.player.y = 1100; e.enemies[0].y = 1050; e.enemies[1].y = 1150;
  Object.assign(e.bullets[0], { active: true, x: 230, y: 1000, vx: 100, vy: 0 }); renderer.paint(e, true);
  assert.equal(svg.querySelector('[data-environment]').getAttribute('transform'), 'scale(1 0.82)');
  assert.equal(svg.querySelector('[data-player]').getAttribute('transform'), `translate(240.00 ${projectAdventureY(1100).toFixed(2)})`);
  assert.match(svg.querySelector('[data-bullet="0"]').getAttribute('transform'), /translate\(230 820\)/);
  const actors = svg.querySelector('[data-actors]').children; assert.ok(actors.indexOf(svg.querySelector('[data-enemy="0"]')) < actors.indexOf(svg.querySelector('[data-player]'))); assert.ok(actors.indexOf(svg.querySelector('[data-player]')) < actors.indexOf(svg.querySelector('[data-enemy="1"]')));
});
test('long rendering reuses sprite and bullet nodes, including rotation, room changes and resize', () => {
  const { engine: e, svg, renderer } = scene(); resetSvgMetrics();
  for (let i = 0; i < 600; i++) { e.player.angle = i / 10; e.player.y = 100 + i * 2; renderer.paint(e); if (i % 100 === 0) renderer.resize(i % 200 ? 320 : 844, i % 200 ? 568 : 390); }
  assert.equal(svgMetrics.created, 0); assert.equal(svg.querySelectorAll('[data-enemy]').length, 7); assert.equal(svg.querySelectorAll('[data-bullet]').length, 24);
  assert.equal(svg.querySelectorAll('[data-coin]').length, 40);
  const viewBox = svg.getAttribute('viewBox').split(' ').map(Number); assert.ok(viewBox.every(Number.isFinite)); assert.ok(viewBox[1] >= 0);
});
test('detailed diagonal hands and clubs animate around their own joints in all four orientations', () => {
  const { engine: e, svg, renderer } = scene(false);
  const body = svg.querySelector('[data-player-body]'), enemy = svg.querySelector('[data-enemy="0"]');
  const bat = enemy.querySelector('[data-bat]'); assert.equal(e.enemies[0].kind, 'bat');
  for (const angle of [Math.PI / 4, -Math.PI / 4, Math.PI * 3 / 4, -Math.PI * 3 / 4]) {
    e.player.angle = e.enemies[0].angle = angle;
    const facing = adventureFacing(angle), pose = facing.startsWith('front') ? 'front-diagonal' : 'back-diagonal';
    const frame = body.querySelector(`[data-direction="${pose}"]`), fist = frame.querySelector('[data-fist]');
    const weapon = bat.querySelector(`[data-direction="${pose}"]`).querySelector('[data-weapon]');
    e.punchTime = 0; e.enemies[0].mode = 'chase'; renderer.paint(e, true);
    assert.equal(fist.getAttribute('transform'), 'translate(35 -51)');
    assert.equal(frame.getAttribute('transform'), facing.endsWith('-left') ? 'scale(-1 1)' : 'scale(1 1)');
    e.punchTime = .1; e.enemies[0].mode = 'windup'; e.enemies[0].timer = .3; renderer.paint(e, true);
    assert.equal(fist.getAttribute('transform'), `translate(51 ${pose === 'back-diagonal' ? -70 : -38})`);
    assert.equal(weapon.getAttribute('transform'), 'rotate(-27.5 52 -74)');
    e.enemies[0].mode = 'recover'; e.enemies[0].timer = .65; renderer.paint(e, true);
    assert.equal(weapon.getAttribute('transform'), 'rotate(45 52 -74)');
    e.punchTime = 0; e.enemies[0].mode = 'chase'; renderer.paint(e, true);
    assert.equal(fist.getAttribute('transform'), 'translate(35 -51)');
    assert.equal(weapon.getAttribute('transform'), 'rotate(0 52 -74)');
  }
});
test('diagonal legs alternate in local resolution and settle together when movement or motion stops', () => {
  const { engine: e, svg, renderer } = scene(false); e.time = .08; e.moving = true;
  const feet = svg.querySelector('[data-player-body]').querySelector('[data-direction="front-diagonal"]').querySelector('[data-feet]');
  const legs = feet.querySelectorAll('[data-step-leg]'); renderer.paint(e, true);
  assert.equal(feet.getAttribute('transform'), 'translate(0 0)');
  for (const leg of legs) assert.equal(leg.getAttribute('transform'), `translate(0 ${Math.sin(e.time * 16) * 4 * Number(leg.getAttribute('data-step-leg'))})`);
  e.moving = false; renderer.paint(e, true);
  for (const leg of legs) assert.equal(leg.getAttribute('transform'), 'translate(0 0)');
  e.moving = true; new AdventureRenderer(svg, true).paint(e, true);
  for (const leg of legs) assert.equal(leg.getAttribute('transform'), 'translate(0 0)');
});
test('the apartment camera zooms gently, follows the player, and stays within room edges',()=>{
  const e=new AdventureEngine(3,events),svg=parseAdventureSvg(renderToStaticMarkup(React.createElement(AdventureScene,{area:'apartment'}))),r=new AdventureRenderer(svg,false);r.resize(390,280);
  e.player.x=60;e.player.y=170;r.paint(e,true);const left=svg.getAttribute('viewBox').split(' ').map(Number);assert.equal(left[2],400);assert.equal(left[0],0);assert.equal(left[1],0);
  e.player.x=420;e.player.y=520;r.paint(e);const moving=svg.getAttribute('viewBox').split(' ').map(Number);assert.ok(moving[0]>0&&moving[0]<80);assert.ok(moving[1]>0);
  for(let i=0;i<120;i++)r.paint(e);const end=svg.getAttribute('viewBox').split(' ').map(Number);assert.ok(end[0]<=80);assert.ok(end[1]+end[3]<=492.01);assert.ok(end[0]+end[2]<=480);
});
test('all new level scenes expose the matching gates and mechanics, while bath furniture includes flame and steam layers',()=>{
  const bath=renderToStaticMarkup(React.createElement(AdventureScene,{area:'apartment',theme:'bath'}));assert.ok(bath.includes('home-stove-flame-back'));assert.ok(bath.includes('home-stove-flame-front'));assert.ok(bath.includes('home-steam-puff'));
  for(const id of [2,3,4,5]){const svg=parseAdventureSvg(renderToStaticMarkup(React.createElement(AdventureScene,{area:'sewer',level:id})));assert.equal(svg.querySelectorAll('[data-gate]').length,id+1);assert.ok(svg.querySelector(`[data-level-scenery="${id}"]`));}
});
