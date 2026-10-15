import './helpers/tsx-loader.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {NeighborhoodEngine} from '../app/neighborhood-engine.ts';
import {NEIGHBORHOOD_POINTS,neighborhoodLight,neighborhoodLampOn} from '../app/neighborhood-map.ts';
import {NEIGHBORHOOD_MISSIONS,missionMask} from '../app/neighborhood-missions.ts';
import {defaultNeighborhoodProgress,sanitizeNeighborhoodProgress} from '../app/neighborhood-progress.ts';
import {createDefaultSave,sanitizeSave} from '../app/game-logic.ts';
import {parseAdventureSvg} from './helpers/adventure-svg-dom.mjs';
const {NeighborhoodScene,NeighborhoodRenderer}=await import('../app/neighborhood-artwork.tsx');
const {ApartmentKeepsakes}=await import('../app/apartment-keepsakes.tsx');
const {NeighborhoodJournal}=await import('../app/neighborhood-journal.tsx');
function game(progress=defaultNeighborhoodProgress()){const saves=[];return {saves,e:new NeighborhoodEngine(progress,{change(){},progress:p=>saves.push(p),home(){},run(){},sound(){}})};}
function at(e,id){const p=NEIGHBORHOOD_POINTS.find(p=>p.id===id);assert.ok(e.canStand(p.x,p.y),id+' clearance');Object.assign(e.player,{x:p.x,y:p.y});}
function settle(e){let n=0;while(e.action){assert.ok(n++<400);e.advance(1/60);}e.closeDialogue();}
function offerFixture(e,id){const m=NEIGHBORHOOD_MISSIONS.find(m=>m.giver===id&&e.progress.missions[m.id].status===0);if(m)e.progress.offer=m.id;}
function interact(e,id){offerFixture(e,id);at(e,id);assert.equal(e.nearestPoint()?.id,id);assert.ok(e.interact());settle(e);}
function walk(e,id){
 const target=NEIGHBORHOOD_POINTS.find(p=>p.id===id),first=[Math.round(e.player.x/20)*20,Math.round(e.player.y/20)*20],q=[first],parents=new Map([[first.join('/'),null]]);let finish;
 for(let i=0;i<q.length;i++){const [x,y]=q[i];if(Math.hypot(x-target.x,y-target.y)<24){finish=[x,y];break;}for(const [dx,dy]of[[20,0],[-20,0],[0,20],[0,-20]]){const next=[x+dx,y+dy],key=next.join('/');if(parents.has(key)||!e.canStand(...next)||!e.canStand(x+dx/2,y+dy/2))continue;parents.set(key,[x,y]);q.push(next);}}
 assert.ok(finish,id+' route');const route=[];for(let p=finish;p;p=parents.get(p.join('/')))route.unshift(p);
 for(const [x,y]of route){let guard=0;while(Math.hypot(x-e.player.x,y-e.player.y)>1.8){assert.ok(guard++<100,id+' unobstructed movement');e.setInput(x-e.player.x,y-e.player.y);e.advance(1/60);}}e.clearInput();assert.equal(e.nearestPoint()?.id,id);e.interact();settle(e);
}
test('all six new stories can be completed by walking their actual routes and reporting to the resident',()=>{
 let {e}=game(),distance=0;e.beginVisit();for(const m of NEIGHBORHOOD_MISSIONS){let visits=0;while(e.progress.offer!==m.id){assert.ok(visits++<16);distance+=e.walkDistance;e=game(e.progress).e;e.beginVisit();}e.trackMission(m.id);walk(e,m.giver);assert.equal(e.progress.missions[m.id].status,1);for(const action of m.actions)walk(e,action);assert.equal(e.progress.missions[m.id].steps,missionMask(m.id));assert.equal(e.progress.missions[m.id].status,1);walk(e,m.giver);assert.equal(e.progress.missions[m.id].status,2);}
 assert.ok(distance+e.walkDistance>12000);assert.equal(e.view().missions.filter(m=>m.status===2).length,6);
});
test('work points require an accepted task; duplicate steps and repeated reports cannot issue more rewards',()=>{
 const {e,saves}=game();at(e,'bed-one');assert.equal(e.interact(),false);assert.equal(saves.length,0);interact(e,'gardener');for(const a of ['bed-one','bed-two','bed-three'])interact(e,a);
 const count=saves.length;at(e,'bed-three');assert.equal(e.interact(),false);assert.equal(saves.length,count);interact(e,'gardener');assert.equal(saves.length,count+1);interact(e,'gardener');assert.equal(saves.length,count+1);
});
test('watering, shoreline cleanup and fixed lamps retain their independent steps through save reloads',()=>{
 const {e}=game();interact(e,'gardener');interact(e,'bed-two');interact(e,'caretaker');interact(e,'repair-home');interact(e,'fisher');interact(e,'litter-three');
 const saved=sanitizeSave({...createDefaultSave(),neighborhood:e.progress});const {e:restored}=game(saved.neighborhood);
 assert.equal(restored.progress.missions.garden.steps,2);assert.equal(restored.progress.missions.lights.steps,1);assert.equal(restored.progress.missions.shore.steps,4);
 assert.equal(neighborhoodLampOn('lamp-0',restored.progress),true);assert.equal(neighborhoodLampOn('lamp-3',restored.progress),false);
});
test('a saved progress event is detached from the mutable simulation; accepting another mission cannot alter older saves',()=>{
 const {e,saves}=game();interact(e,'gardener');const snapshot=JSON.stringify(saves[0]);interact(e,'bed-one');interact(e,'caretaker');assert.equal(JSON.stringify(saves[0]),snapshot);assert.equal(saves[0].missions.garden.steps,0);assert.equal(saves[0].missions.lights.status,0);
});
test('the selected cat mission takes priority at Rita while delivery and the original badge story stay independent',()=>{
 const {e}=game();interact(e,'kiosk');interact(e,'girl');e.trackMission('cat');interact(e,'kiosk');assert.equal(e.progress.missions.cat.steps,1);assert.equal(e.progress.missions.delivery.steps,0);interact(e,'cat');interact(e,'girl');e.trackMission('delivery');interact(e,'neighbor');assert.equal(e.progress.quest,0);interact(e,'kiosk');interact(e,'neighbor');assert.equal(e.progress.quest,1);
});
test('photography has three distinct captures, returns to Lena, and does not duplicate a completed shot',()=>{
 const {e}=game();interact(e,'photographer');for(const p of ['photo-home','photo-tree','photo-river']){const previous=e.photoSerial;interact(e,p);assert.equal(e.photoSerial,previous+1);at(e,p);e.interact();e.closeDialogue();assert.equal(e.photoSerial,previous+1);}assert.equal(e.progress.missions.photos.status,1);interact(e,'photographer');assert.equal(e.progress.missions.photos.status,2);
});
test('Plush cannot be fed before picking up his food at Rita; the dependency survives a reload',()=>{
 const {e,saves}=game();interact(e,'girl');const count=saves.length;interact(e,'cat');assert.equal(e.progress.missions.cat.steps,0);assert.equal(saves.length,count);
 const {e:restored}=game(e.progress);interact(restored,'kiosk');assert.equal(restored.progress.missions.cat.steps,1);interact(restored,'cat');assert.equal(restored.progress.missions.cat.steps,3);interact(restored,'girl');assert.equal(restored.progress.missions.cat.status,2);
});
test('old v24 saves preserve the original keepsakes and introduce empty new mission records',()=>{
 const old=sanitizeSave({...createDefaultSave(),version:24,walletCoins:18200,storyCheckpoint:3,storyCompletedLevel:4,neighborhood:{quest:3,pebble:true,secret:true}});
 assert.equal(old.version,30);assert.equal(old.walletCoins,18200);assert.equal(old.storyCompletedLevel,4);assert.equal(old.neighborhood.quest,3);assert.equal(old.neighborhood.pebble,true);assert.ok(Object.values(old.neighborhood.missions).every(m=>m.status===0));
 const bad=sanitizeNeighborhoodProgress({missions:{garden:{status:2,steps:0},photos:{status:1,steps:Infinity}},tracked:'unknown'});assert.equal(bad.missions.garden.status,1);assert.equal(bad.missions.photos.steps,0);assert.equal(bad.tracked,null);
});
test('completed mission rewards appear at home and the journal identifies both finished and active jobs',()=>{
 const progress=defaultNeighborhoodProgress();progress.quest=3;for(const m of NEIGHBORHOOD_MISSIONS)progress.missions[m.id]={status:2,steps:missionMask(m.id)};
 const art=renderToStaticMarkup(React.createElement(ApartmentKeepsakes,{items:progress}));for(const id of ['mint','rita-mug','light-badge','shell','photo-album','cat-portrait'])assert.ok(art.includes(`data-keepsake="${id}"`));
 const {e}=game(progress),journal=renderToStaticMarkup(React.createElement(NeighborhoodJournal,{missions:e.view().missions,badgeQuest:3,onTrack(){},onClose(){}}));assert.ok(journal.includes('Завершено 7 из 7'));assert.equal((journal.match(/neighborhood-mission-card/g)||[]).length,7);
});
test('world effects match the saved state: repaired light, watered plants, removed trash and a fed cat',()=>{
 const {e}=game(),svg=parseAdventureSvg(renderToStaticMarkup(React.createElement(NeighborhoodScene,{night:true,prefix:'jobs'}))),r=new NeighborhoodRenderer(svg,true,true);r.resize(480,680);r.paint(e,true);
 assert.equal(svg.querySelector('[data-lamp-glow="lamp-0"]').getAttribute('display'),'none');const dark=neighborhoodLight(650,645,e.progress);
 interact(e,'caretaker');interact(e,'repair-home');interact(e,'gardener');interact(e,'bed-one');interact(e,'fisher');interact(e,'litter-one');interact(e,'girl');interact(e,'kiosk');interact(e,'cat');r.paint(e,true);
 assert.equal(svg.querySelector('[data-lamp-glow="lamp-0"]').getAttribute('display'),'inline');assert.ok(neighborhoodLight(650,645,e.progress)>dark);assert.equal(svg.querySelector('[data-watered-bed="0"]').getAttribute('display'),'inline');assert.equal(svg.querySelector('[data-shore-litter="0"]').getAttribute('display'),'none');assert.equal(svg.querySelector('[data-cat-bowl]').getAttribute('display'),'inline');
});
