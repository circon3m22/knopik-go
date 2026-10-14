import './helpers/tsx-loader.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {AdventureEngine,ADVENTURE_STEP} from '../app/adventure-engine.ts';
import {openingFrame,OPENING_DURATION} from '../app/adventure-opening.ts';
import {NeighborhoodEngine} from '../app/neighborhood-engine.ts';
import {defaultNeighborhoodProgress} from '../app/neighborhood-progress.ts';
import {ADVENTURE_WEAPONS} from '../app/adventure-levels.ts';
import {firearmMuzzle,firearmTrajectory,FIREARMS} from '../app/dungeon-aim.ts';
import {dungeonGame,quietEvents,tickDungeon} from './helpers/dungeon-fixtures.mjs';
import {parseAdventureSvg} from './helpers/adventure-svg-dom.mjs';
import {svgMetrics} from './helpers/runner-svg-dom.mjs';
const {AdventureScene,AdventureRenderer}=await import('../app/adventure-artwork.tsx');
const {NeighborhoodScene}=await import('../app/neighborhood-artwork.tsx');
const {AdventureOpeningRenderer}=await import('../app/adventure-opening-renderer.ts');
const {GameMovementStick}=await import('../app/game-movement-stick.tsx');
function street(){return new NeighborhoodEngine(defaultNeighborhoodProgress(),{change(){},progress(){},home(){},run(){},sound(){}});}
function tick(e,s,fps=60){for(let i=0;i<Math.round(s*fps);i++)e.advance(1/fps);}

test('opening has four finite, caption-free shots and invalid timestamps stay finite',()=>{
  assert.deepEqual([1,4,8,11].map(t=>openingFrame(t).shot),[0,1,2,3]);
  for(const t of [NaN,Infinity,-1,0,OPENING_DURATION,100]){const f=openingFrame(t);assert.ok(f.shot>=0&&f.shot<4);assert.ok(f.fade>=0&&f.fade<=1);assert.ok(Number.isFinite(f.progress));}
});
test('watching or skipping the film starts exactly one clean mission without paying or spending',()=>{
  for(const skip of [false,true]){
    const checkpoints=[],sounds=[];let collected=0,stockCalls=0;
    const e=new AdventureEngine(0,{...quietEvents,checkpoint:n=>checkpoints.push(n),sound:s=>sounds.push(s),collect:n=>collected+=n,consumeHeal:()=>{stockCalls++;return true;}});
    e.setInput(1,1,true);e.dodge();assert.equal(e.heal(),false);assert.equal(e.buySupply('heal'),false);
    if(skip)e.skipOpening();else tick(e,14);
    assert.equal(e.phase,'playing');assert.equal(e.area,'sewer');assert.equal(e.level,1);assert.equal(e.player.hp,3);assert.equal(e.collectedCoins,0);
    assert.equal(collected,0);assert.equal(stockCalls,0);assert.deepEqual(checkpoints,[1,2]);assert.equal(e.view().dialogue,'');assert.equal(e.skipOpening(),false);
    if(!skip){assert.equal(sounds.filter(s=>s==='knock').length,2);assert.equal(sounds.filter(s=>s==='blast').length,1);}
  }
});
test('opening renderers reuse nodes through all cuts and screen sizes',()=>{
  const roots=[parseAdventureSvg(renderToStaticMarkup(React.createElement(NeighborhoodScene,{night:true,prefix:'opening-test'}))),...['apartment','basement','sewer'].map(area=>parseAdventureSvg(renderToStaticMarkup(React.createElement(AdventureScene,{area,level:1,theme:'night'}))))];
  const renderer=new AdventureOpeningRenderer(roots,false);renderer.resize(390,844);renderer.paint(0);const created=svgMetrics.created;
  for(let frame=0;frame<=132;frame++){renderer.paint(frame/10);for(const root of roots){assert.ok(root.getAttribute('viewBox').split(' ').map(Number).every(Number.isFinite));}}
  renderer.resize(844,390);renderer.paint(12);assert.equal(svgMetrics.created,created);
});
test('street dodge uses real direction, rolls the rig, respects cooldown and works while movement stays held',()=>{
  const e=street();Object.assign(e.player,{x:500,y:910});e.setInput(1,0);assert.equal(e.dodge(),true);assert.ok(e.animationState.dodgeTime>0);assert.equal(e.dodge(),false);
  const x=e.player.x;tick(e,.21);assert.ok(e.player.x-x>85);assert.equal(e.dodgeTime,0);const after=e.player.x;tick(e,.1);assert.ok(e.player.x>after);
  e.pause();assert.equal(e.dodge(),false);const cooldown=e.dodgeCooldown;tick(e,1);assert.equal(e.dodgeCooldown,cooldown);e.resume();tick(e,.6);assert.equal(e.dodge(),true);
});
test('street dash is deterministic at 30/60/120 Hz and cannot cross buildings or river edges',()=>{
  const run=fps=>{const e=street();Object.assign(e.player,{x:730,y:760});e.setInput(1,0);e.dodge();tick(e,.5,fps);return e.player;};
  assert.deepEqual(run(30),run(60));assert.deepEqual(run(120),run(60));
  const e=street();Object.assign(e.player,{x:1400,y:1680});assert.ok(e.canStand(e.player.x,e.player.y));e.setInput(0,1);e.dodge();tick(e,.3);assert.ok(e.canStand(e.player.x,e.player.y));assert.ok(e.player.y<=1684);
});
test('movement stick preserves a second-pointer release path and its own reusable SVG thumb',()=>{
  const ref={current:null},events=[];const root=GameMovementStick({disabled:false,nubRef:ref,onDown:e=>events.push(e.pointerId),onMove(){},onRelease:e=>events.push(-e.pointerId)}),button=root.props.children[0];
  button.props.onPointerDown({pointerId:4});button.props.onPointerCancel({pointerId:4});assert.deepEqual(events,[4,-4]);assert.equal(button.props.children[1].props.ref,ref);
});

function gunGame(weapon,id=3){const e=dungeonGame(id,{weaponTier:5});e.enemies.forEach(n=>n.hp=0);e.barrels.forEach(b=>b.active=false);e.selectWeapon(weapon);const r=e.levelData.rooms[0];e.player.x=r.x+r.w/2;e.player.y=r.y+r.h-78;e.player.angle=0;return e;}
test('enemies outside the assistance cone cannot turn a shot and released joystick keeps the last direction',()=>{
  for(const weapon of Object.keys(FIREARMS)){
    const e=gunGame(weapon),enemy=e.enemies[0];Object.assign(enemy,{hp:20,x:e.player.x-70,y:e.player.y-70,mode:'recover',timer:5});
    e.setInput(.6,-.8,false);e.advance(ADVENTURE_STEP);const angle=e.player.angle;e.setInput(0,0,true);e.advance(ADVENTURE_STEP);
    assert.equal(e.player.angle,angle);const bullets=e.bullets.filter(b=>b.active&&b.owner==='player');assert.equal(bullets.length,FIREARMS[weapon].spread.length);
    for(const [i,b]of bullets.entries())assert.ok(Math.abs(Math.atan2(b.vy,b.vx)-angle-FIREARMS[weapon].spread[i])<1e-9);
    assert.equal(enemy.hp,20);
  }
});
test('sabre, shotgun and launcher reloads have the requested exact durations and switching cannot bypass them',()=>{
  assert.equal(ADVENTURE_WEAPONS.sabre.cooldown,.84);assert.equal(ADVENTURE_WEAPONS.shotgun.cooldown,1.16);assert.equal(ADVENTURE_WEAPONS.launcher.cooldown,2.46);
  for(const weapon of ['sabre','shotgun','launcher']){
    const e=gunGame(weapon);e.setInput(0,0,true);e.advance(ADVENTURE_STEP);assert.equal(e.punchSerial,1);tickDungeon(e,ADVENTURE_WEAPONS[weapon].cooldown-.05);assert.equal(e.punchSerial,1);
    e.selectWeapon('fist');e.advance(ADVENTURE_STEP);assert.equal(e.punchSerial,1);tickDungeon(e,.1);assert.ok(e.punchSerial>=2);
  }
});
test('trajectories clip to actual cover, update after destruction and blocked muzzles cannot fire through it',()=>{
  const e=gunGame('pistol',11),index=e.levelData.solids.findIndex(s=>s.breakable),cover=e.levelData.solids[index];
  e.player.x=cover.x-35;e.player.y=cover.y+cover.h/2;e.player.angle=0;assert.ok(e.canStand(e.player.x,e.player.y));
  const ray=firearmTrajectory(e);assert.ok(ray.x<=cover.x+3);assert.ok(ray.x>=cover.x-5);
  e.dungeon.destroyed[index]=true;assert.ok(firearmTrajectory(e).x>cover.x+cover.w);e.dungeon.destroyed[index]=false;
  e.player.x=cover.x-14;assert.ok(e.canStand(e.player.x,e.player.y));assert.equal(firearmMuzzle(e).blocked,true);e.setInput(0,0,true);e.advance(ADVENTURE_STEP);
  assert.equal(e.bullets.filter(b=>b.active&&b.owner==='player').length,0);
});
test('aim rays and launcher blast footprint follow facing, hide on pause and never create DOM during paint',()=>{
  const e=gunGame('shotgun',11),svg=parseAdventureSvg(renderToStaticMarkup(React.createElement(AdventureScene,{area:'sewer',level:11}))),renderer=new AdventureRenderer(svg,false);renderer.resize(390,480);renderer.paint(e,true);const created=svgMetrics.created;
  assert.equal(svg.querySelector('[data-firearm-aim]').getAttribute('display'),'inline');const before=svg.querySelector('[data-aim-ray="2"]').getAttribute('d');e.player.angle=-Math.PI/2;renderer.paint(e);assert.notEqual(svg.querySelector('[data-aim-ray="2"]').getAttribute('d'),before);
  e.selectWeapon('launcher');renderer.paint(e);assert.equal(svg.querySelector('[data-aim-blast]').getAttribute('display'),'inline');
  for(let i=0;i<100;i++)renderer.paint(e);assert.equal(svgMetrics.created,created);e.pause();renderer.paint(e);assert.equal(svg.querySelector('[data-firearm-aim]').getAttribute('display'),'none');
});
