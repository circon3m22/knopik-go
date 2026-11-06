import './helpers/tsx-loader.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {ADVENTURE_STEP} from '../app/adventure-engine.ts';
import {ADVENTURE_LEVELS} from '../app/adventure-levels.ts';
import {dungeonGame} from './helpers/dungeon-fixtures.mjs';
import {CoopEngine} from '../app/coop-engine.ts';
import {idleCoopControls,readCoopControls} from '../app/coop-protocol.ts';
import {parseAdventureSvg} from './helpers/adventure-svg-dom.mjs';
import {resetSvgMetrics,svgMetrics} from './helpers/runner-svg-dom.mjs';
const {AdventureScene,AdventureRenderer}=await import('../app/adventure-artwork.tsx');
const {AdventureVerity}=await import('../app/verity-adventure-art.tsx');
const {NeighborhoodScene,NeighborhoodRenderer}=await import('../app/neighborhood-artwork.tsx');
const {NeighborhoodEngine}=await import('../app/neighborhood-engine.ts');
const {defaultNeighborhoodProgress}=await import('../app/neighborhood-progress.ts');
const {RunnerRenderer}=await import('../app/runner-renderer.ts');
const {runnerSvgScene}=await import('./helpers/runner-svg-dom.mjs');
const {AnimatedAdventureKnopik}=await import('../app/knopik-adventure-art.tsx');
const {KnopikAnimator}=await import('../app/knopik-adventure-animation.ts');
const tick=(e,n)=>{for(let i=0;i<n;i++)e.advance(ADVENTURE_STEP);};
test('all 35 campaigns add two reachable Verities without removing Sahurs or exceeding the actor budget',()=>{
 const counts=[13,15,15,17,16,10,17,15,23,18,15,22,22,28,22,15,22,20,28,22,17,31,24,33,24,18,27,27,21,19,21,24,27,24,34];
 for(const l of ADVENTURE_LEVELS){const e=dungeonGame(l.id),verities=e.enemies.filter(n=>n.species==='verity');assert.equal(verities.length,2);assert.equal(e.enemies.length-verities.length,counts[l.id-1]);assert.ok(e.enemies.length<=36);for(const v of verities)assert.ok(e.canStand(v.x,v.y),`spawn ${l.id}/${v.id}`);}
});
test('manual mouse aim overrides autoaim while movement remains independent',()=>{
 const e=dungeonGame(6,{weaponTier:7}),r=e.levelData.rooms[0];e.player.x=r.x+r.w/2;e.player.y=r.y+r.h-90;e.enemies.forEach(n=>n.hp=0);e.selectWeapon('pistol');e.setAim(e.player.x-200,e.player.y);e.setInput(0,-1,true);tick(e,1);assert.ok(Math.cos(e.player.angle)<-.99);assert.ok(e.bullets.some(b=>b.active&&b.owner==='player'&&b.vx<0));
 e.setAim(NaN,Infinity);e.setInput(1,0,false);tick(e,1);assert.equal(e.player.angle,0);
});

test('Knopik looks along all eight travel directions while mouse shots retain their own aim',()=>{
 const e=dungeonGame(6,{weaponTier:7}),svg=parseAdventureSvg(renderToStaticMarkup(React.createElement(AnimatedAdventureKnopik))),animator=new KnopikAnimator(svg);
 e.enemies.forEach(n=>n.hp=0);e.selectWeapon('pistol');
 const directions=[['right',1,0],['front-right',1,1],['front',0,1],['front-left',-1,1],['left',-1,0],['back-left',-1,-1],['back',0,-1],['back-right',1,-1]];
 for(const [facing,x,y]of directions){e.setAim(e.player.x-x*400,e.player.y-y*400);e.setInput(x,y,false);tick(e,1);assert.equal(animator.paint(e),facing);assert.ok(Math.cos(e.player.angle-Math.atan2(-y,-x))>.99,'weapon aim stays opposite travel');}
 e.setAim(e.player.x-400,e.player.y);e.setInput(0,-1,true);e.punchCooldown=0;tick(e,1);assert.equal(animator.paint(e),'back');assert.ok(e.bullets.some(b=>b.active&&b.owner==='player'&&b.vx<0));
 e.setInput(-1,0,false);e.dodge();e.setInput(0,1,false);assert.equal(animator.paint(e),'left','the roll uses its committed travel direction');
});

test('both co-op actors derive travel facing from existing snapshot input without changing weapon aim',()=>{
 const e=new CoopEngine(17);e.setControls(0,{...idleCoopControls(),x:0,y:-1,aim:Math.PI});e.setControls(1,{...idleCoopControls(),x:1,y:0,aim:Math.PI/2});tick(e,2);
 for(const [slot,facing]of [[0,'back'],[1,'right']]){const svg=parseAdventureSvg(renderToStaticMarkup(React.createElement(AnimatedAdventureKnopik))),animator=new KnopikAnimator(svg);assert.equal(animator.paint(e.companion(slot)),facing);e.forPlayer(slot,()=>assert.equal(animator.paint(e),facing));}
 assert.ok(Math.cos(e.actors[0].player.angle)<-.99);assert.ok(Math.sin(e.actors[1].player.angle)>.99);
});
test('mouse hover targets the visible body while bullets still use its floor collision position',()=>{
 const e=dungeonGame(2),v=e.enemies.find(n=>n.species==='verity');e.room=v.room;
 e.aimAtCursor(v.x,v.y-52);assert.deepEqual(e.manualAim,{x:v.x,y:v.y});
 e.aimAtCursor(-999,-999);assert.deepEqual(e.manualAim,{x:-999,y:-999});
});
test('co-op carries finite mouse angles and keeps the two players aiming independently',()=>{
 const e=new CoopEngine(17),a={...idleCoopControls(),x:0,y:-1,aim:Math.PI},b={...idleCoopControls(),x:1,y:0,aim:Math.PI/2};
 const wire=JSON.parse(JSON.stringify(a));assert.equal(readCoopControls(wire).aim,Math.PI);assert.equal(readCoopControls({...wire,aim:NaN}),null);
 e.setControls(0,a);e.setControls(1,b);tick(e,2);
 assert.ok(Math.cos(e.actors[0].player.angle)<-.99);assert.ok(Math.sin(e.actors[1].player.angle)>.99);
 const snapshot=e.snapshot();e.forPlayer(0,()=>assert.ok(e.manualAim));assert.deepEqual(e.snapshot().actors,snapshot.actors);
});
test('Verity rolls sideways through ordinary collision and recovers; pausing freezes the roll',()=>{
 const e=dungeonGame(2),v=e.enemies.find(n=>n.species==='verity');e.player.x=v.x;e.player.y=v.y+120;e.room=v.room;e.enemies=e.enemies.filter(n=>n===v);v.rollCooldown=0;e.punchTime=.2;tick(e,1);assert.ok(v.rollTime>0);const x=v.x;tick(e,8);assert.notEqual(v.x,x);assert.ok(e.canStand(v.x,v.y));const before=structuredClone(v);e.pause();e.advance(2);assert.deepEqual(v,before);e.resume();tick(e,21);assert.equal(v.rollTime,0);assert.equal(v.mode,'recover');
});
test('wide cameras match 16:9 and ultrawide viewports and unproject the cursor using the same camera',()=>{
 for(const [w,h]of [[1366,650],[1920,900],[3440,1200],[960,380]]){const e=dungeonGame(2),svg=parseAdventureSvg(renderToStaticMarkup(React.createElement(AdventureScene,{area:'sewer',level:2,pcUltra:true})));const renderer=new AdventureRenderer(svg,false,true);renderer.resize(w,h);renderer.paint(e,true);const [x,y,width,height]=svg.getAttribute('viewBox').split(' ').map(Number);assert.ok(Math.abs(width/height-w/h)<.0001);assert.ok(width>=760);const p=renderer.worldPoint(.5,.5);assert.ok(Math.abs(p.x-x-width/2)<.02);assert.ok(Math.abs(p.y*.82-y-height/2)<.02);}
});

test('desktop cameras retain mouse projection through narrow, portrait, maximized and ultrawide resizes',()=>{
 const e=dungeonGame(2),svg=parseAdventureSvg(renderToStaticMarkup(React.createElement(AdventureScene,{area:'sewer',level:2}))),renderer=new AdventureRenderer(svg,false,true);
 for(const [w,h]of [[1920,1080],[800,600],[500,800],[1366,768],[3440,1440],[800,600]]){
  renderer.resize(w,h);renderer.paint(e,true);
  const [x,y,width,height]=svg.getAttribute('viewBox').split(' ').map(Number);
  assert.ok(Math.abs(width/height-w/h)<.0001,`${w}x${h} keeps uniform scale`);
  for(const [px,py]of [[0,0],[.2,.8],[1,1]]){const p=renderer.worldPoint(px,py);assert.ok(Math.abs(p.x-x-width*px)<.02);assert.ok(Math.abs(p.y*.82-y-height*py)<.02);}
 }
 const mobile=new AdventureRenderer(svg,false,false);mobile.resize(1920,1080);mobile.paint(e,true);assert.equal(Number(svg.getAttribute('viewBox').split(' ')[2]),480,'a wide touch device retains its original camera');
});

test('street and Run fill desktop windows below 960px without changing the touch camera',()=>{
 const street=new NeighborhoodEngine(defaultNeighborhoodProgress(),{change(){},progress(){},home(){},run(){},sound(){}});
 const svg=parseAdventureSvg(renderToStaticMarkup(React.createElement(NeighborhoodScene,{night:false}))),renderer=new NeighborhoodRenderer(svg,false,false,true);
 const runner=runnerSvgScene(),runRenderer=new RunnerRenderer(runner,'pc-test',false,true);
 for(const [w,h]of [[800,600],[1366,768],[1920,1080],[3440,1440]]){
  renderer.resize(w,h);renderer.paint(street,true);
  const view=svg.getAttribute('viewBox').split(' ').map(Number);assert.ok(Math.abs(view[2]/view[3]-w/h)<.0001,`street ${w}x${h}`);
  runner.getBoundingClientRect=()=>({width:w,height:h});runRenderer.resize();const runView=runner.getAttribute('viewBox').split(' ').map(Number);assert.ok(Math.abs(runView[2]/runView[3]-w/h)<.001,`Run ${w}x${h}`);
 }
 const touch=new RunnerRenderer(runner,'touch-test',false,false);assert.equal(Number(runner.getAttribute('viewBox').split(' ')[2]),360);assert.ok(touch);
});
test('Verity stays a circle throughout rolls and Ultra reuses its fixed effect nodes',()=>{
 const e=dungeonGame(2),svg=parseAdventureSvg(renderToStaticMarkup(React.createElement(AdventureScene,{area:'sewer',level:2,pcUltra:true}))),renderer=new AdventureRenderer(svg,false,true);renderer.resize(1600,800);const v=e.enemies.find(n=>n.species==='verity'),node=svg.querySelector(`[data-enemy="${v.id}"]`);assert.ok(node.querySelector('[data-verity-sphere]'));assert.doesNotMatch(renderToStaticMarkup(React.createElement('svg',null,React.createElement(AdventureVerity))),/<(?:circle|ellipse|radialGradient|linearGradient)\b/);assert.equal(node.querySelector('[data-verity-leg]'),null);
 for(const t of [.3,.2,.1,.01,0]){v.rollTime=t;renderer.paint(e,true);assert.ok(!node.querySelector('[data-verity-roll]').getAttribute('transform').includes('scale'));assert.equal(node.querySelector('[data-verity-sphere]').getAttribute('data-pixel-diameter'),'64');}
 resetSvgMetrics();for(let i=0;i<120;i++){e.effects.burst('blast',e.player.x,e.player.y,80);tick(e,1);renderer.paint(e);}assert.equal(svgMetrics.created,0);assert.equal(svg.querySelectorAll('[data-pc-effect]').length,36);assert.equal(e.effects.pool.length,36);const standard=renderToStaticMarkup(React.createElement(AdventureScene,{area:'sewer',level:2}));assert.ok(!standard.includes('data-pc-action'));
});
