import './helpers/tsx-loader.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {NeighborhoodEngine} from '../app/neighborhood-engine.ts';
import {NEIGHBORHOOD_POINTS,NEIGHBORHOOD_BUILDINGS,NEIGHBORHOOD_LAMPS,neighborhoodActorMatrix,neighborhoodLight} from '../app/neighborhood-map.ts';
import {defaultNeighborhoodProgress} from '../app/neighborhood-progress.ts';
import {createDefaultSave,sanitizeSave} from '../app/game-logic.ts';
const {NeighborhoodScene,NeighborhoodRenderer}=await import('../app/neighborhood-artwork.tsx');
const {ApartmentKeepsakes}=await import('../app/apartment-keepsakes.tsx');
import {parseAdventureSvg} from './helpers/adventure-svg-dom.mjs';
import {runnerAtmosphere} from '../app/runner-atmosphere.ts';
import {RunnerEngine,RUNNER_INTRO_DURATION} from '../app/runner-engine.ts';
import {readFileSync} from 'node:fs';
function game(progress=defaultNeighborhoodProgress()){const saves=[],exits=[];const engine=new NeighborhoodEngine(progress,{change(){},progress:p=>saves.push(p),home:()=>exits.push('home'),run:()=>exits.push('run'),sound(){}});return {engine,saves,exits};}
function settle(e){while(e.action)e.advance(1/60);}
function go(e,id){const p=NEIGHBORHOOD_POINTS.find(p=>p.id===id);assert.ok(e.canStand(p.x,p.y),id+' standing position');e.player.x=p.x;e.player.y=p.y;return p;}
function walkTo(e,id){
 const target=NEIGHBORHOOD_POINTS.find(p=>p.id===id),sx=Math.round(e.player.x/20)*20,sy=Math.round(e.player.y/20)*20;
 const q=[[sx,sy]],parents=new Map([[sx+'/'+sy,null]]);let finish=null;
 for(let i=0;i<q.length;i++){const [x,y]=q[i];if(Math.hypot(x-target.x,y-target.y)<27){finish=[x,y];break;}for(const [dx,dy]of[[20,0],[-20,0],[0,20],[0,-20]]){const key=(x+dx)+'/'+(y+dy);if(parents.has(key)||!e.canStand(x+dx,y+dy)||!e.canStand(x+dx/2,y+dy/2))continue;parents.set(key,[x,y]);q.push([x+dx,y+dy]);}}
 assert.ok(finish,id+' walking route');const route=[];for(let p=finish;p;p=parents.get(p[0]+'/'+p[1]))route.unshift(p);
 let frames=0;for(const [x,y]of route){let guard=0;while(Math.hypot(x-e.player.x,y-e.player.y)>1.8){assert.ok(guard++<100,'not stuck');e.setInput(x-e.player.x,y-e.player.y);e.advance(1/60);frames++;}}e.clearInput();assert.equal(e.nearestPoint()?.id,id);return frames;
}

test('all neighborhood activities are connected to the doorstep with player-radius collision clearance',()=>{
 const {engine:e}=game(),step=20,queue=[[400,660]],visited=new Set(['400/660']);
 for(let i=0;i<queue.length;i++){const [x,y]=queue[i];for(const [dx,dy] of [[step,0],[-step,0],[0,step],[0,-step]]){const nx=x+dx,ny=y+dy,key=nx+'/'+ny;if(visited.has(key)||!e.canStand(nx,ny)||!e.canStand(x+dx/2,y+dy/2))continue;visited.add(key);queue.push([nx,ny]);}}
 assert.ok(queue.length>4000);
 for(const p of NEIGHBORHOOD_POINTS)assert.ok(queue.some(([x,y])=>Math.hypot(x-p.x,y-p.y)<32),p.id+' reachable');
 assert.ok(queue.some(([x,y])=>x<450&&y>1550),'western return passage');assert.ok(queue.some(([x,y])=>x>2050&&y>1350),'park-to-river passage');
});
test('the river, houses and benches block walking; the boardwalk is open and has no exit into water',()=>{
 const {engine:e}=game();assert.equal(e.canStand(410,400),false);assert.equal(e.canStand(1555,555),false);assert.equal(e.canStand(1000,1800),false);assert.equal(e.canStand(1990,1760),true);assert.equal(e.canStand(1990,1830),false);
 e.player.x=410;e.player.y=610;e.setInput(0,-1);for(let i=0;i<600;i++)e.advance(1/60);assert.ok(e.player.y>=583);assert.ok(e.canStand(e.player.x,e.player.y));
});
test('the complete neighbor story awards exactly one postcard and survives a reload',()=>{
 const {engine:e,saves}=game();go(e,'neighbor');assert.equal(e.interact(),true);assert.equal(e.progress.quest,1);assert.equal(e.interact(),false);e.closeDialogue();go(e,'badge');e.interact();settle(e);assert.equal(e.progress.quest,2);e.closeDialogue();go(e,'neighbor');e.interact();assert.equal(e.progress.quest,3);e.closeDialogue();e.interact();assert.equal(saves.length,3);
 const saved=sanitizeSave({...createDefaultSave(),neighborhood:e.progress});assert.equal(saved.neighborhood.quest,3);const restored=game(saved.neighborhood);go(restored.engine,'neighbor');restored.engine.interact();assert.equal(restored.saves.length,0);
});
test('a full stroll plays the story, finds both souvenirs, visits the boardwalk and walks home using normal input',()=>{
 const {engine:e,exits}=game();let frames=0;
 for(const id of ['neighbor','badge','secret','pebble','river','neighbor','home']){frames+=walkTo(e,id);assert.equal(e.interact(),true,id);settle(e);if(e.view().dialogue)e.closeDialogue();}
 assert.equal(e.progress.quest,3);assert.equal(e.progress.pebble,true);assert.equal(e.progress.secret,true);assert.deepEqual(exits,['home']);assert.ok(frames>1000);assert.ok(e.walkDistance>4000);
});
test('found river and park souvenirs cannot be claimed repeatedly and appear in the apartment',()=>{
 const {engine:e,saves}=game();for(const id of ['pebble','secret']){go(e,id);e.interact();settle(e);e.closeDialogue();assert.notEqual(e.nearestPoint()?.id,id);}assert.equal(saves.length,2);
 const art=renderToStaticMarkup(React.createElement(ApartmentKeepsakes,{items:{...e.progress,quest:3},night:true}));for(const id of ['postcard','lantern','pebble'])assert.ok(art.includes(`data-keepsake="${id}"`));
});
test('old saves retain money, story levels and equipment while starting with an empty district history',()=>{
 const old=sanitizeSave({...createDefaultSave(),version:23,walletCoins:9837,vaultCoins:1357,storyCheckpoint:3,storyCompletedLevel:5,storyWeaponTier:2,runnerBest:1940,neighborhood:{quest:3,pebble:true,secret:true}});
 assert.equal(old.version,30);assert.equal(old.walletCoins,9837);assert.equal(old.vaultCoins,1357);assert.equal(old.storyCompletedLevel,5);assert.equal(old.storyWeaponTier,2);assert.equal(old.runnerBest,1940);assert.deepEqual(old.neighborhood,defaultNeighborhoodProgress());
});
test('pausing, dialogue and invalid values stop movement without replaying held input on resume',()=>{
 const {engine:e}=game();e.setInput(1,1);e.advance(.1);e.pause();const p={...e.player};e.advance(1);assert.deepEqual(e.player,p);e.resume();e.advance(.1);assert.deepEqual(e.player,p);
 for(const dt of [NaN,Infinity,-1,0])e.advance(dt);assert.ok(Number.isFinite(e.time));e.setInput(NaN,Infinity);e.advance(.1);assert.deepEqual(e.player,p);
 go(e,'neighbor');e.interact();e.setInput(1,0);const start={...e.player};e.advance(.1);assert.deepEqual(e.player,start);e.closeDialogue();e.advance(.1);assert.deepEqual(e.player,start);
});
test('Run requires the street interaction and returns with a stopped walking input',()=>{
 const {engine:e,exits}=game();assert.equal(e.interact(),true);assert.deepEqual(exits,['home']);go(e,'run');e.setInput(1,0);assert.deepEqual(exits,['home']);e.interact();assert.equal(e.paused,true);assert.deepEqual(exits,['home','run']);e.resume();const before={...e.player};e.advance(.1);assert.deepEqual(e.player,before);
 const source=readFileSync(new URL('../app/knopik-go.tsx',import.meta.url),'utf8');assert.ok(source.includes('setAdventureOpen(false); setNeighborhoodOpen(true)'));assert.ok(source.includes('suspended={runnerOpen}'));assert.ok(source.includes('if (!neighborhoodOpen) setAdventureOpen(true)'));
});
test('night streets have lit windows and pools of lantern light; the dog brightens near an actual lamp',()=>{
 const night=renderToStaticMarkup(React.createElement(NeighborhoodScene,{night:true,prefix:'night-check'})),day=renderToStaticMarkup(React.createElement(NeighborhoodScene,{night:false,prefix:'day-check'}));assert.ok(night.includes('data-ground-lights'));assert.ok(!day.includes('data-ground-lights'));assert.ok(night.includes('url(#night-check-actor-light)'));assert.ok(!day.includes('filter="url(#day-check-actor-light)"'));
 assert.equal(NEIGHBORHOOD_BUILDINGS.filter(b=>b.floors>=3&&b.floors<=4).length,8);assert.ok(NEIGHBORHOOD_LAMPS.length>=12);const l=NEIGHBORHOOD_LAMPS[0];assert.ok(neighborhoodLight(l.x,l.y)>neighborhoodLight(1800,1300));assert.notEqual(neighborhoodActorMatrix(0),neighborhoodActorMatrix(1));
});
test('night remains night in Run for the full day cycle and the old balcony scene is absent',()=>{
 for(const seconds of [0,20,70,140,210,1000]){const a=runnerAtmosphere(seconds,17,true);assert.equal(a.phase,1);assert.equal(a.night,1);assert.equal(a.illumination,.56);}
 const source=readFileSync(new URL('../app/runner-artwork.tsx',import.meta.url),'utf8');assert.ok(!source.includes('Balcony'));assert.ok(source.includes('StreetStartBack'));
 const e=new RunnerEngine({phase(){},coins(){},finish(){},sound(){},zone(){},route(){}});e.start();for(let i=0;i<Math.ceil(RUNNER_INTRO_DURATION*60)+1;i++)e.update(1/60);assert.equal(e.phase,'running');assert.equal(e.jumpAge,-1);assert.equal(e.height,0);
});
test('the camera follows both axes, culls distant sprites and lights the face consistently with world position',()=>{
 const {engine:e}=game(),svg=parseAdventureSvg(renderToStaticMarkup(React.createElement(NeighborhoodScene,{night:true,prefix:'renderer-check'}))),r=new NeighborhoodRenderer(svg,true,true);r.resize(390,650);r.paint(e,true);const initial=svg.getAttribute('viewBox'),shade=svg.querySelector('[data-actor-light]').getAttribute('values');
 e.player.x=2150;e.player.y=1600;r.paint(e,true);assert.notEqual(svg.getAttribute('viewBox'),initial);assert.notEqual(svg.querySelector('[data-actor-light]').getAttribute('values'),shade);assert.equal(svg.querySelector('[data-world-object="home"]').getAttribute('display'),'none');
 const count=svg.querySelectorAll('path').length;for(let i=0;i<120;i++)r.paint(e);assert.equal(svg.querySelectorAll('path').length,count);assert.ok(svg.querySelector('[data-neighborhood-player]').getAttribute('transform').includes('2150'));
});
