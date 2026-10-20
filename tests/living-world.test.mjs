import './helpers/tsx-loader.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {NeighborhoodEngine} from '../app/neighborhood-engine.ts';
import {defaultNeighborhoodProgress,sanitizeNeighborhoodProgress} from '../app/neighborhood-progress.ts';
import {NEIGHBORHOOD_POINTS} from '../app/neighborhood-map.ts';
import {RESIDENT_ROUTES} from '../app/neighborhood-crowd.ts';
import {parseAdventureSvg} from './helpers/adventure-svg-dom.mjs';
import {resetSvgMetrics,svgMetrics} from './helpers/runner-svg-dom.mjs';
import {createDefaultSave,sanitizeSave} from '../app/game-logic.ts';
const {NeighborhoodScene,NeighborhoodRenderer}=await import('../app/neighborhood-artwork.tsx');
function game(progress=defaultNeighborhoodProgress()){const saves=[];const e=new NeighborhoodEngine(progress,{change(){},progress:p=>saves.push(p),home(){},run(){},sound(){}});return {e,saves};}
function at(e,id){const p=NEIGHBORHOOD_POINTS.find(p=>p.id===id);Object.assign(e.player,{x:p.x,y:p.y});}
function tick(e,n){for(let i=0;i<Math.round(n*60);i++)e.advance(1/60);}
test('new outings rotate one request at a time, include quiet visits, and do not reroll on pause or Run return',()=>{
 let {e}=game();e.beginVisit();assert.equal(e.progress.visits,1);assert.equal(e.progress.offer,null);assert.equal(e.view().missions.length,0);
 assert.equal(e.trackMission('garden'),false);at(e,'gardener');e.interact();assert.equal(e.progress.missions.garden.status,0);e.closeDialogue();
 const offered=[];for(let visit=2;visit<=10;visit++){e=game(e.progress).e;e.beginVisit();if(visit%3===0)assert.equal(e.progress.offer,null);if(e.progress.offer)offered.push(e.progress.offer);assert.ok(e.view().missions.filter(m=>m.status===0).length<=1);const snapshot=JSON.stringify(e.progress);assert.equal(e.beginVisit(),false);e.pause();e.resume();assert.equal(JSON.stringify(e.progress),snapshot);}
 assert.equal(new Set(offered).size,6);
});
test('accepted tasks survive new outings and two pending stories pause new requests without removing old work',()=>{
 const p=defaultNeighborhoodProgress();p.visits=4;p.missions.garden={status:1,steps:2};p.missions.cat={status:1,steps:1};p.tracked='garden';const {e}=game(p);e.beginVisit();assert.equal(e.progress.offer,null);assert.equal(e.progress.missions.garden.steps,2);assert.equal(e.progress.missions.cat.steps,1);assert.equal(e.progress.tracked,'garden');
 const saved=sanitizeSave({...createDefaultSave(),storyCheckpoint:3,storyCompletedLevel:25,storyWeaponTier:5,neighborhood:e.progress});assert.equal(saved.storyCompletedLevel,25);assert.equal(saved.storyWeaponTier,5);assert.equal(saved.neighborhood.visits,5);
 const invalid=sanitizeNeighborhoodProgress({...p,visits:Infinity,offer:'unknown',offerCursor:NaN});assert.equal(invalid.visits,0);assert.equal(invalid.offer,null);assert.equal(invalid.offerCursor,0);
});
for(const [id,point]of [['garden','bed-one'],['lights','repair-home'],['shore','litter-one'],['photos','photo-tree'],['delivery','neighbor'],['cat','cat']])test(`${id} animates a timed action, freezes on pause and commits exactly once at the end`,()=>{
 const p=defaultNeighborhoodProgress();p.missions[id]={status:1,steps:id==='cat'?1:0};p.tracked=id;const {e,saves}=game(p);at(e,point);assert.equal(e.interact(),true);assert.ok(e.action);assert.equal(e.progress.missions[id].steps,id==='cat'?1:0);tick(e,.8);assert.ok(e.action);e.pause();const before=e.action.elapsed;tick(e,2);assert.equal(e.action.elapsed,before);e.resume();tick(e,6);assert.equal(e.action,null);assert.equal(saves.length,1);assert.ok(e.progress.missions[id].steps>0);const steps=e.progress.missions[id].steps;e.closeDialogue();at(e,point);e.interact();assert.equal(e.progress.missions[id].steps,steps);if(id!=='delivery')assert.equal(saves.length,1);
});
test('walking away cancels watering and a reload never grants an unfinished repair',()=>{
 const p=defaultNeighborhoodProgress();p.missions.garden.status=1;p.missions.lights.status=1;const {e,saves}=game(p);at(e,'bed-one');e.interact();tick(e,1);e.setInput(1,0);assert.equal(e.action,null);assert.equal(e.progress.missions.garden.steps,0);assert.equal(saves.length,0);e.clearInput();at(e,'repair-home');e.interact();tick(e,2);const restored=game(e.progress).e;assert.equal(restored.action,null);assert.equal(restored.progress.missions.lights.steps,0);
});
test('choosing another story in the paused journal cancels unfinished work without granting its step',()=>{
 const p=defaultNeighborhoodProgress();p.missions.garden.status=1;p.missions.lights.status=1;const {e}=game(p);at(e,'bed-one');e.interact();tick(e,1);e.pause();assert.equal(e.trackMission('lights'),true);assert.equal(e.action,null);e.resume();tick(e,5);assert.equal(e.progress.missions.garden.steps,0);assert.equal(e.progress.tracked,'lights');
});
for(const point of ['badge','pebble','secret'])test(`${point} is lifted visibly and becomes a saved find only after its animation`,()=>{
 const p=defaultNeighborhoodProgress();p.quest=1;const {e,saves}=game(p);at(e,point);e.interact();assert.equal(e.action?.kind,'search');tick(e,1);assert.equal(saves.length,0);e.setInput(1,0);assert.equal(e.action,null);e.clearInput();at(e,point);e.interact();tick(e,3);assert.equal(saves.length,1);assert.equal(e.action,null);if(point==='badge')assert.equal(e.progress.quest,2);else assert.equal(e.progress[point],true);
});
test('people keep walking during a conversation while Knopik waits; explicit pause freezes the crowd',()=>{
 const {e}=game();at(e,'neighbor');e.interact();const player={...e.player},crowd=JSON.stringify(e.crowd.residents);tick(e,1);assert.deepEqual(e.player,player);assert.notEqual(JSON.stringify(e.crowd.residents),crowd);e.pause();const stopped=JSON.stringify(e.crowd.residents);tick(e,1);assert.equal(JSON.stringify(e.crowd.residents),stopped);
});
test('all pedestrian routes clear buildings, benches and lamps; people move with deterministic steps and stop when paused',()=>{
 const {e}=game();assert.equal(e.crowd.residents.length,33);
 for(const r of RESIDENT_ROUTES)for(let i=1;i<r.path.length;i++){const a=r.path[i-1],b=r.path[i],n=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/4);for(let j=0;j<=n;j++)assert.ok(e.canStand(a[0]+(b[0]-a[0])*j/n,a[1]+(b[1]-a[1])*j/n,11),r.id+' route');}
 tick(e,12);assert.ok(e.crowd.residents.filter(r=>r.route).every(r=>r.walkDistance>100));assert.ok(e.crowd.residents.filter(r=>r.route).every(r=>e.canStand(r.x,r.y,11)));e.pause();const snap=JSON.stringify(e.crowd.residents);tick(e,10);assert.equal(JSON.stringify(e.crowd.residents),snap);
 const run=fps=>{const {e}=game();for(let i=0;i<fps*3;i++)e.advance(1/fps);return e.crowd.residents.map(r=>[r.x,r.y,r.walkDistance]);};assert.deepEqual(run(30),run(60));assert.deepEqual(run(60),run(120));
});
test('resident arms and legs articulate; work tools follow Knopik hands while all SVG nodes are reused',()=>{
 const {e}=game(),svg=parseAdventureSvg(renderToStaticMarkup(React.createElement(NeighborhoodScene,{night:false,prefix:'living'}))),r=new NeighborhoodRenderer(svg,false,false);r.resize(480,680);e.player.x=750;e.player.y=800;r.paint(e,true);const person=svg.querySelector('[data-resident="street-neighbor"]'),arm=person.querySelector('[data-resident-arm="right"]'),leg=person.querySelector('[data-resident-leg="right"]');const old=[arm.getAttribute('transform'),leg.getAttribute('transform')];tick(e,.3);r.paint(e);assert.notDeepEqual([arm.getAttribute('transform'),leg.getAttribute('transform')],old);
 e.progress.missions.garden.status=1;at(e,'bed-one');e.interact();resetSvgMetrics();for(let i=0;i<150;i++){e.advance(1/60);r.paint(e,true);}assert.equal(svgMetrics.created,0);assert.equal(svg.querySelector('[data-work-water]').getAttribute('display'),'inline');assert.ok(svg.querySelector('[data-work-held]').getAttribute('transform').includes('translate'));assert.equal(e.progress.missions.garden.steps,0);e.pause();const hand=svg.querySelector('[data-work-held]').getAttribute('transform');tick(e,1);r.paint(e);assert.equal(svg.querySelector('[data-work-held]').getAttribute('transform'),hand);
});
