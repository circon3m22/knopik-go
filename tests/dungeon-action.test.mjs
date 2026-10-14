import './helpers/tsx-loader.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {dungeonGame,tickDungeon} from './helpers/dungeon-fixtures.mjs';
import {parseAdventureSvg} from './helpers/adventure-svg-dom.mjs';
import {resetSvgMetrics,svgMetrics} from './helpers/runner-svg-dom.mjs';
const {AdventureScene,AdventureRenderer}=await import('../app/adventure-artwork.tsx');
const {DungeonMap}=await import('../app/dungeon-menu.tsx');
test('visible floor and map rectangles have actual SVG dimensions, including every side passage',()=>{
 for(const id of [1,6,11,16,21,25]){
  const e=dungeonGame(id),scene=parseAdventureSvg(renderToStaticMarkup(React.createElement(AdventureScene,{area:'sewer',level:id})));
  const floors=scene.querySelectorAll('[data-dungeon-floor]');assert.equal(floors.length,e.levelData.floors.length);
  for(const n of floors){assert.ok(Number(n.getAttribute('width'))>=160);assert.ok(Number(n.getAttribute('height'))>=160);}
  const map=parseAdventureSvg(renderToStaticMarkup(React.createElement(DungeonMap,{view:e.view(),player:e.player,cleared:e.cleared,gates:e.levelData.gates.map((_,i)=>e.gateOpen(i)),onClose(){}})));
  const rectangles=map.querySelectorAll('rect');assert.ok(rectangles.length>=e.levelData.floors.length);
  for(const n of rectangles){assert.ok(Number(n.getAttribute('width'))>0);assert.ok(Number(n.getAttribute('height'))>0);}
 }
});
function firingLane(id){const e=dungeonGame(id),r=e.levelData.rooms[0];e.enemies.forEach(n=>n.hp=0);e.player.x=r.x+r.w/2;e.player.y=r.y+325;e.player.angle=-Math.PI/2;return e;}
test('shotgun emits five travelling pellets; shots damage targets and never collide with the firing player',()=>{
 const e=firingLane(11),n=e.enemies[2];Object.assign(n,{hp:12,maxHp:12,role:'grunt',x:e.player.x,y:e.player.y-125});e.setInput(0,0,true);tickDungeon(e,1/60);e.setInput(0,0,false);
 assert.equal(e.bullets.filter(b=>b.active&&b.kind==='pellet').length,5);assert.equal(n.hp,12);tickDungeon(e,.22);assert.ok(n.hp<12);assert.equal(e.player.hp,3);
});
test('launcher grenades cause area damage, break nearby cover and produce an actual blast effect',()=>{
 const e=firingLane(16),targets=e.enemies.filter(n=>n.room===0).slice(0,2);targets.forEach((n,i)=>Object.assign(n,{hp:3,role:'grunt',x:e.player.x+i*30,y:e.player.y-175}));
 e.setInput(0,0,true);tickDungeon(e,1/60);e.setInput(0,0,false);assert.ok(e.bullets.some(b=>b.active&&b.kind==='grenade'));tickDungeon(e,.36);assert.ok(targets.every(n=>n.hp===0));assert.ok(e.effects.pool.some(f=>f.active&&f.kind==='blast'&&f.radius===116));assert.equal(e.player.hp,3);
 const broken=dungeonGame(11),cover=broken.levelData.solids.findIndex(s=>s.breakable),s=broken.levelData.solids[cover];broken.explodeAt(s.x+s.w/2,s.y+s.h/2,116,4);assert.equal(broken.dungeon.destroyed[cover],true);assert.ok(broken.canStand(s.x+s.w/2,s.y+s.h/2));
});
test('the arc chains between four foes, ignores front armor and does not jump to a fifth target',()=>{
 const e=firingLane(21),targets=e.enemies.slice(0,5);targets.forEach((n,i)=>Object.assign(n,{room:0,awake:true,hp:8,role:'armored',x:e.player.x-70+i*30,y:e.player.y-125,angle:Math.PI/2}));
 e.setInput(0,0,true);tickDungeon(e,1/60);assert.equal(targets.filter(n=>n.hp===6).length,4);assert.equal(targets.filter(n=>n.hp===8).length,1);assert.equal(e.effects.links.filter(l=>l.active).length,4);
 const n=targets[0];n.hp=8;e.hitEnemy(n,4,-Math.PI/2);assert.equal(n.hp,6);n.hp=8;e.hitEnemy(n,4,Math.PI/2);assert.equal(n.hp,4);
});
test('battery tasks enforce dependencies and the exit gate remains locked until both batteries return',()=>{
 const e=dungeonGame(13),relay=2,gate=e.levelData.gates.findIndex(g=>g.objective===relay);e.cleared.fill(true);
 assert.equal(e.dungeon.activate(relay,e.time),false);assert.equal(e.gateOpen(gate),false);e.dungeon.activate(0,e.time);assert.equal(e.dungeon.activate(relay,e.time),false);e.dungeon.activate(1,e.time);assert.equal(e.gateOpen(gate),false);assert.equal(e.dungeon.activate(relay,e.time),true);assert.equal(e.gateOpen(gate),true);
});
test('hold missions summon two real waves, pause outside the console radius and require surviving attackers to be defeated',()=>{
 const e=dungeonGame(9),i=e.levelData.tasks.findIndex(t=>t.kind==='hold'),task=e.levelData.tasks[i];e.room=task.room;e.dungeon.activate(i,e.time);
 const first=e.enemies.filter(n=>n.trigger===i&&n.wave===1);assert.equal(first.length,3);assert.ok(first.every(n=>n.awake));assert.equal(e.cleared[task.room],false);
 const runtime=e.dungeon;runtime.step(5,5,{x:task.x+300,y:task.y},task.room,e.enemies);assert.equal(runtime.tasks[i].progress,0);
 runtime.step(7,12,{x:task.x+60,y:task.y},task.room,e.enemies);assert.equal(runtime.tasks[i].wave,2);runtime.step(20,32,{x:task.x+60,y:task.y},task.room,e.enemies);assert.equal(runtime.tasks[i].done,false);
 e.enemies.filter(n=>n.trigger===i).forEach(n=>n.hp=0);runtime.step(1/60,33,{x:task.x+60,y:task.y},task.room,e.enemies);assert.equal(runtime.tasks[i].done,true);
});
test('reinforcements waiting for their trigger do not push visible foes as invisible bodies',()=>{
 const e=dungeonGame(9),r=e.levelData.rooms[0],n=e.enemies[0],pending=e.enemies.find(n=>n.awake===false),x=r.x+r.w/2,y=r.y+225;
 e.enemies.forEach(other=>{if(other!==n&&other!==pending)other.hp=0;});e.player.x=x;e.player.y=y+160;Object.assign(n,{x,y,mode:'chase',timer:1});pending.room=1;
 e.enemyStep(n,1/60);const ordinary={x:n.x,y:n.y};Object.assign(n,{x,y,mode:'chase',timer:1});Object.assign(pending,{room:0,x,y:y+10});e.enemyStep(n,1/60);assert.deepEqual({x:n.x,y:n.y},ordinary);assert.equal(pending.awake,false);
});
test('charges provide an escape interval, damage enemies and clear their assigned cover only once',()=>{
 const e=dungeonGame(4),i=e.levelData.tasks.findIndex(t=>t.kind==='charge'),t=e.levelData.tasks[i],n=e.enemies.find(n=>n.room===t.room);n.x=t.x+50;n.y=t.y;n.hp=3;n.mode='recover';n.timer=10;e.room=t.room;e.player.x=t.x+180;e.player.y=t.y;
 assert.equal(e.dungeon.activate(i,e.time),true);tickDungeon(e,1);assert.equal(e.dungeon.tasks[i].done,false);tickDungeon(e,1);assert.equal(e.dungeon.tasks[i].done,true);assert.equal(n.hp,0);assert.equal(e.dungeon.destroyed[t.breaks],true);assert.equal(e.dungeon.activate(i,e.time),false);
});
test('a proximity mine gives 0.8 seconds to escape and detonates once',()=>{
 const e=dungeonGame(11),i=e.levelData.hazards.findIndex(h=>h.kind==='mine'),h=e.levelData.hazards[i];e.room=h.room;e.enemies.forEach(n=>n.hp=0);e.player.x=h.x+13;e.player.y=h.y+13;
 tickDungeon(e,1/60);assert.equal(e.dungeon.hazardPhase(i,e.time),'warning');assert.equal(e.player.hp,3);tickDungeon(e,.9);assert.equal(e.dungeon.mines[i].spent,true);assert.equal(e.player.hp,2);tickDungeon(e,2);assert.equal(e.player.hp,2);
});
test('effects, hazards, weapons and tasks render from physics using fixed node pools and freeze on pause',()=>{
 const e=dungeonGame(24),svg=parseAdventureSvg(renderToStaticMarkup(React.createElement(AdventureScene,{area:'sewer',level:24}))),renderer=new AdventureRenderer(svg,false),task=e.levelData.tasks[0];e.room=task.room;e.player.x=task.x+60;e.player.y=task.y;e.dungeon.activate(0,e.time);
 renderer.paint(e,true);assert.equal(svg.querySelector('[data-dungeon-task="0"]').querySelector('[data-charge-danger]').getAttribute('display'),'inline');assert.equal(svg.querySelectorAll('[data-dungeon-effect]').length,36);assert.equal(svg.querySelectorAll('[data-dungeon-arc]').length,12);assert.equal(svg.querySelectorAll('[data-bullet]').length,64);
 resetSvgMetrics();for(let n=0;n<300;n++){e.effects.burst('blast',e.player.x,e.player.y,100);e.effects.arc(e.player.x,e.player.y,task.x,task.y);e.effects.step(1/60);renderer.paint(e);}assert.equal(svgMetrics.created,0);assert.ok(e.effects.pool.length===36&&e.effects.links.length===12);
 e.pause();const before=structuredClone({effects:e.effects.pool,tasks:e.dungeon.tasks,time:e.time});e.advance(20);renderer.paint(e);assert.deepEqual({effects:e.effects.pool,tasks:e.dungeon.tasks,time:e.time},before);assert.equal(svg.getAttribute('data-game-phase'),'paused');
});
