import './helpers/tsx-loader.mjs';import test from'node:test';import assert from'node:assert/strict';import React from'react';import{renderToStaticMarkup}from'react-dom/server';
import{firearmAim,firearmMuzzle,firearmTrajectory,FIREARMS,AIM_ASSIST_LIMIT}from'../app/dungeon-aim.ts';import{knopikRollPose,KNOPIK_ROLL_DURATION}from'../app/knopik-roll.ts';import{ADVENTURE_STEP}from'../app/adventure-engine.ts';import{NeighborhoodEngine}from'../app/neighborhood-engine.ts';import{defaultNeighborhoodProgress}from'../app/neighborhood-progress.ts';import{dungeonGame}from'./helpers/dungeon-fixtures.mjs';import{parseAdventureSvg}from'./helpers/adventure-svg-dom.mjs';import{svgMetrics}from'./helpers/runner-svg-dom.mjs';
const{AnimatedAdventureKnopik}=await import('../app/knopik-adventure-art.tsx');const{KnopikAnimator}=await import('../app/knopik-adventure-animation.ts');const{AdventureScene,AdventureRenderer}=await import('../app/adventure-artwork.tsx');
function gun(weapon='pistol') {const e=dungeonGame(6,{weaponTier:5}),r=e.levelData.rooms[0];e.enemies.forEach(n=>n.hp=0);e.barrels.forEach(b=>b.active=false);e.selectWeapon(weapon);Object.assign(e.player,{x:r.x+r.w/2,y:r.y+225,angle:0});return e;}
function target(e,degrees,distance=180){const n=e.enemies[0],angle=degrees*Math.PI/180;Object.assign(n,{id:991,hp:100,awake:true,room:e.room,x:e.player.x+Math.cos(angle)*distance,y:e.player.y+Math.sin(angle)*distance,mode:'recover',timer:10});return n;}

test('assist is a limited nudge inside the joystick cone and does not turn the player or lock onto the target',()=>{
 const e=gun();for(const degrees of[-24,-16,-6,6,16,24]){const n=target(e,degrees),a=firearmAim(e);assert.equal(a.target,n.id);assert.equal(e.player.angle,0);assert.equal(Math.sign(a.correction),Math.sign(degrees));assert.ok(Math.abs(a.correction)>0&&Math.abs(a.correction)<=AIM_ASSIST_LIMIT);assert.ok(Math.abs(a.angle)<Math.abs(degrees*Math.PI/180));}
 for(const degrees of[-31,31,90,180]){target(e,degrees);assert.equal(firearmAim(e).correction,0);}
});
test('dead, sleeping, distant, other-room or occluded enemies cannot steer the trajectory',()=>{
 const e=gun();const n=target(e,6);assert.ok(firearmAim(e).correction>0);
 for(const patch of[{hp:0},{awake:false},{room:e.room+1},{x:e.player.x+800}]){target(e,6);Object.assign(n,patch);assert.equal(firearmAim(e).correction,0);}
 target(e,6);e.barrels.push({active:true,x:e.player.x+90,y:e.player.y+9});assert.equal(firearmAim(e).correction,0);e.barrels.at(-1).active=false;assert.ok(firearmAim(e).correction>0);
 const cover=e.levelData.solids[0];Object.assign(e.player,{x:cover.x-50,y:cover.y+cover.h/2,angle:0});Object.assign(n,{x:cover.x+cover.w+50,y:e.player.y+5});assert.equal(firearmAim(e).correction,0);
});
test('each firearm shoots at the shown assisted direction, preserving shotgun spread and raw facing',()=>{
 for(const weapon of Object.keys(FIREARMS)){const e=gun(weapon);target(e,6);const aim=firearmAim(e),ray=firearmTrajectory(e),muzzle=firearmMuzzle(e);assert.ok(Math.abs(Math.atan2(ray.y-ray.startY,ray.x-ray.startX)-aim.angle)<1e-9);assert.equal(ray.startX,muzzle.x);e.setInput(0,0,true);e.advance(ADVENTURE_STEP);assert.equal(e.player.angle,0);const bullets=e.bullets.filter(b=>b.active&&b.owner==='player');assert.equal(bullets.length,FIREARMS[weapon].spread.length);for(const [i,b]of bullets.entries())assert.ok(Math.abs(Math.atan2(b.vy,b.vx)-aim.angle-FIREARMS[weapon].spread[i])<1e-9);}
});
test('the nudge can still miss and fired bullets do not bend after the target moves',()=>{
 const e=gun(),n=target(e,11,240);e.setInput(0,0,true);e.advance(ADVENTURE_STEP);e.setInput(0,0,false);const b=e.bullets.find(b=>b.active&&b.owner==='player'),velocity=[b.vx,b.vy];assert.ok(b);Object.assign(n,{x:n.x,y:n.y-60});for(let i=0;i<8;i++)e.advance(ADVENTURE_STEP);assert.deepEqual([b.vx,b.vy],velocity);assert.equal(n.hp,100);
});
test('visible trajectory changes with a nearby target but never alters facing',()=>{
 const e=gun(),svg=parseAdventureSvg(renderToStaticMarkup(React.createElement(AdventureScene,{area:'sewer',level:3}))),r=new AdventureRenderer(svg,false);r.resize(390,480);r.paint(e,true);const before=svg.querySelector('[data-aim-ray="0"]').getAttribute('d');target(e,6);r.paint(e);assert.notEqual(svg.querySelector('[data-aim-ray="0"]').getAttribute('d'),before);assert.equal(e.player.angle,0);
});
test('the shared roll replaces the standing rig, completes a full turn and restores the pose without allocating nodes',()=>{
 const e=gun(),svg=parseAdventureSvg(renderToStaticMarkup(React.createElement(AnimatedAdventureKnopik))),a=new KnopikAnimator(svg),created=svgMetrics.created;
 e.setInput(1,0,false);e.dodge();a.paint(e);assert.equal(svg.querySelector('[data-knopik-roll]').getAttribute('display'),'inline');assert.ok(svg.querySelectorAll('[data-direction]').every(n=>n.getAttribute('display')==='none'));assert.equal(knopikRollPose(.01,0).turns,360);
 const transforms=new Set();for(let i=0;i<14;i++){a.paint(e);transforms.add(svg.querySelector('[data-roll-spin]').getAttribute('transform'));e.advance(ADVENTURE_STEP);}a.paint(e);assert.ok(transforms.size>=8);assert.equal(e.dodgeTime,0);assert.equal(svg.querySelector('[data-knopik-roll]').getAttribute('display'),'none');assert.equal(svg.querySelectorAll('[data-direction]').filter(n=>n.getAttribute('display')==='inline').length,1);assert.equal(svgMetrics.created,created);
});
test('street roll starts in the current input direction, freezes on pause and has a reduced-motion pose',()=>{
 const e=new NeighborhoodEngine(defaultNeighborhoodProgress(),{change(){},progress(){},home(){},run(){},sound(){}});Object.assign(e.player,{x:500,y:910,angle:0});e.setInput(-1,0);e.dodge();assert.equal(e.player.angle,Math.PI);assert.equal(e.dodgeTime,KNOPIK_ROLL_DURATION);const svg=parseAdventureSvg(renderToStaticMarkup(React.createElement(AnimatedAdventureKnopik))),a=new KnopikAnimator(svg);a.paint(e.animationState);assert.match(svg.querySelector('[data-knopik-roll]').getAttribute('transform'),/scale\(-1/);e.pause();e.advance(1);assert.equal(e.dodgeTime,KNOPIK_ROLL_DURATION);a.paint(e.animationState,true);assert.equal(svg.querySelector('[data-roll-spin]').getAttribute('transform'),'rotate(0)');assert.equal(svg.querySelector('[data-roll-dust]').getAttribute('display'),'none');
});

test('inaccurate aim near the edge of the assistance cone still misses a stationary enemy',()=>{
 const e=gun(),n=target(e,24,180);e.setInput(0,0,true);e.advance(ADVENTURE_STEP);e.setInput(0,0,false);for(let i=0;i<35;i++)e.advance(ADVENTURE_STEP);assert.equal(n.hp,100);
});
test('assistance crosses the ±pi boundary correctly and fades at the edge instead of snapping',()=>{
 const e=gun(),r=e.levelData.rooms[0];e.player.x=r.x+r.w/2;e.player.angle=Math.PI;const n=e.enemies[0];Object.assign(n,{hp:100,awake:true,room:e.room,x:e.player.x+Math.cos(-Math.PI+.08)*150,y:e.player.y+Math.sin(-Math.PI+.08)*150});const a=firearmAim(e);assert.ok(a.correction>0&&a.correction<AIM_ASSIST_LIMIT);e.player.angle=0;target(e,29.9);const near=firearmAim(e).correction;target(e,26);assert.ok(near>=0&&near<firearmAim(e).correction*.1);
});
