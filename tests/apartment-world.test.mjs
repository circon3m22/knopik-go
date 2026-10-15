import './helpers/tsx-loader.mjs';
import test from 'node:test';import assert from 'node:assert/strict';
import React from 'react';import{renderToStaticMarkup}from'react-dom/server';
import {AdventureEngine,ADVENTURE_STEP} from '../app/adventure-engine.ts';
import {AURA_MACHINE} from "../app/aura-machine.ts";
import {HOME_ROOMS,HOME_CORRIDORS,HOME_SPAWN,HOME_ENTRY} from '../app/apartment-world.ts';
import {NeighborhoodEngine}from'../app/neighborhood-engine.ts';import{defaultNeighborhoodProgress}from'../app/neighborhood-progress.ts';
import {defaultLaboratory,LAB_SOURCES,harvestLaboratory,canHarvest}from'../app/laboratory-engine.ts';
import {parseAdventureSvg}from'./helpers/adventure-svg-dom.mjs';import{resetSvgMetrics,svgMetrics}from'./helpers/runner-svg-dom.mjs';
const{AdventureScene,AdventureRenderer}=await import('../app/adventure-artwork.tsx');const{ApartmentMap}=await import('../app/apartment-map.tsx');
const silent={change(){},checkpoint(){},sound(){},run(){},bar(){}};
function route(e,goal){
 const angles=e.homeDoors.map(d=>d.angle);e.homeDoors.forEach(d=>d.angle=1.43);
 const start={x:e.player.x,y:e.player.y},queue=[start],seen=new Set([`${start.x}:${start.y}`]),parents=new Map();let found=null;
 for(let at=0;at<queue.length;at++){const p=queue[at];if(Math.hypot(p.x-goal.x,p.y-goal.y)<15){found=p;break;}for(const [dx,dy]of[[16,0],[-16,0],[0,16],[0,-16]]){const n={x:p.x+dx,y:p.y+dy},key=`${n.x}:${n.y}`;if(seen.has(key)||[.25,.5,.75,1].some(t=>!e.canStand(p.x+dx*t,p.y+dy*t)))continue;seen.add(key);parents.set(key,p);queue.push(n);}}
 e.homeDoors.forEach((d,i)=>d.angle=angles[i]);
 assert.ok(found,`No walkable route to ${goal.x},${goal.y}`);const result=[goal];for(let p=found;p;p=parents.get(`${p.x}:${p.y}`))result.push(p);return result.reverse();
}
function walk(e,path){for(const p of path){let guard=0;while(Math.hypot(e.player.x-p.x,e.player.y-p.y)>2.8){assert.ok(guard++<50,`Stuck at ${e.player.x},${e.player.y} toward ${p.x},${p.y}`);e.setInput(p.x-e.player.x,p.y-e.player.y,false);e.advance(ADVENTURE_STEP);assert.ok(e.canStand(e.player.x,e.player.y));}}e.setInput(0,0,false);}
test('all six rooms and every functional station are reachable from the living room using actual movement',()=>{
 const targets=[{...AURA_MACHINE.approach,room:'vault',action:'aura'},{x:252,y:350,room:'bar',action:'bar'},{x:692,y:1032,room:'hall',action:'street'},{x:1134,y:884,room:'vault',action:'vault'},{x:252,y:864,room:'wardrobe',action:'wardrobe'},{x:1135,y:490,room:'laboratory',action:'laboratory'},{...HOME_SPAWN,room:'living'}];
 for(const target of targets){const calls=[],e=new AdventureEngine(3,{...silent,bar:()=>calls.push('bar'),run:()=>calls.push('street'),homePanel:r=>calls.push(r)});assert.ok(e.canStand(e.player.x,e.player.y));walk(e,route(e,target));assert.equal(e.view().homeRoom,target.room);if(target.action){const p={...e.player};assert.equal(e.interactDestination(target.action),true);assert.deepEqual(calls,[target.action]);assert.deepEqual(e.player,p);if(target.action!=='street'){assert.equal(e.phase,'paused');e.advance(10);assert.deepEqual(e.player,p);e.resume();}}}
});
test('all corridor floors are visible rectangles with dimensions, matching the physical apartment and its map',()=>{
 const svg=parseAdventureSvg(renderToStaticMarkup(React.createElement(AdventureScene,{area:'apartment'}))),corridors=svg.querySelectorAll('[data-home-corridor]');assert.equal(corridors.length,HOME_CORRIDORS.length);corridors.forEach(n=>{assert.ok(Number(n.getAttribute('width'))>0);assert.ok(Number(n.getAttribute('height'))>0);});assert.equal(svg.querySelectorAll('[data-home-room]').length,6);
 const map=parseAdventureSvg(renderToStaticMarkup(React.createElement(ApartmentMap,{player:HOME_SPAWN,onClose(){}})));for(const n of map.querySelectorAll('rect')){assert.ok(Number(n.getAttribute('width'))>0);assert.ok(Number(n.getAttribute('height'))>0);}
});
test('returning from the street starts in the hall, and room walls and furniture stop a roll',()=>{
 const e=new AdventureEngine(3,silent);e.enterHomeFromStreet();assert.equal(e.view().homeRoom,'hall');assert.deepEqual({x:e.player.x,y:e.player.y},HOME_ENTRY);assert.ok(e.canStand(e.player.x,e.player.y));
 Object.assign(e.player,{x:1015,y:774,angle:0});assert.ok(e.canStand(e.player.x,e.player.y));e.dodge();for(let i=0;i<20;i++)e.advance(ADVENTURE_STEP);assert.ok(e.player.x<1048);assert.equal(e.canStand(1134,774),false);assert.equal(e.canStand(480,650),false);
});
test('the vault displays real saved money and day/night rendering reuses room furniture across travel',()=>{
 const e=new AdventureEngine(3,silent),svg=parseAdventureSvg(renderToStaticMarkup(React.createElement(AdventureScene,{area:'apartment',theme:'night',vaultBalance:123456}))),r=new AdventureRenderer(svg,false);r.resize(390,500);r.paint(e,true);assert.equal(svg.querySelector('[data-home-vault-balance]').textContent,'123 456');const light=svg.querySelector('[data-home-actor-light]');Object.assign(e.player,{x:692,y:560});r.paint(e,true);const dark=light.getAttribute('values');Object.assign(e.player,{x:680,y:302});r.paint(e,true);assert.notEqual(light.getAttribute('values'),dark);resetSvgMetrics();for(let i=0;i<120;i++){e.player.x=HOME_ROOMS[i%6].x+212;e.player.y=HOME_ROOMS[i%6].y+300;r.paint(e);}assert.equal(svgMetrics.created,0);assert.ok(svg.querySelectorAll('[data-home-prop-y]').length>20);
});
test('street ingredients require the full animated gathering action and survive pause without duplicate rewards',()=>{
 let lab=defaultLaboratory(),gathers=0;const source=LAB_SOURCES[1],e=new NeighborhoodEngine(defaultNeighborhoodProgress(),{change(){},progress(){},home(){},run(){},sound(){},canHarvest:id=>canHarvest(lab,id,1000000),gather:id=>{const next=harvestLaboratory(lab,id,1000000);if(!next)return false;lab=next;gathers++;return true;}});Object.assign(e.player,{x:source.x+25,y:source.y+30});assert.ok(e.canStand(e.player.x,e.player.y));assert.equal(e.nearestPoint().id,source.id);assert.equal(e.interact(),true);assert.equal(e.action.kind,'search');assert.equal(e.interact(),false);for(let i=0;i<60;i++)e.advance(ADVENTURE_STEP);assert.equal(gathers,0);e.pause();e.advance(10);assert.equal(gathers,0);e.resume();for(let i=0;i<120;i++)e.advance(ADVENTURE_STEP);assert.equal(gathers,1);assert.equal(lab.materials.leaf,3);assert.equal(e.action,null);assert.notEqual(e.nearestPoint()?.id,source.id);
});
test('ordinary doors block when closed and open to either side when Knopik walks into them',()=>{
 const e=new AdventureEngine(3,silent);Object.assign(e.player,{x:530,y:340});assert.equal(e.canStand(472,340),false);
 e.setInput(-1,0,false);for(let i=0;i<54;i++)e.advance(ADVENTURE_STEP);assert.ok(e.player.x<450);assert.ok(e.homeDoors[0].angle>1);Object.assign(e.player,{x:350,y:360});e.setInput(0,0,false);for(let i=0;i<120;i++)e.advance(ADVENTURE_STEP);assert.ok(Math.abs(e.homeDoors[0].angle)<.01);assert.equal(e.canStand(472,340),false);
 Object.assign(e.player,{x:410,y:340});e.setInput(1,0,false);for(let i=0;i<54;i++)e.advance(ADVENTURE_STEP);assert.ok(e.player.x>490);assert.ok(e.homeDoors[0].angle< -1);
 e.pause();const doors=structuredClone(e.homeDoors);e.advance(10);assert.deepEqual(e.homeDoors,doors);
});
test('the hallway is below the living room, both large windows replace the old northern exit, and doors have pooled panels',()=>{
 const r=Object.fromEntries(HOME_ROOMS.map(r=>[r.id,r]));for(const id of ['wardrobe','hall','vault'])assert.ok(r[id].y>r.living.y);assert.equal(r.hall.x,r.living.x);
 const e=new AdventureEngine(3,silent),svg=parseAdventureSvg(renderToStaticMarkup(React.createElement(AdventureScene,{area:'apartment'}))),renderer=new AdventureRenderer(svg,false);assert.equal(svg.querySelectorAll('[data-home-big-window]').length,2);assert.equal(svg.querySelectorAll('[data-home-door-leaf]').length,6);const door=svg.querySelector('[data-home-door-leaf]'),closed=door.getAttribute('transform');e.homeDoors[0].angle=1.2;resetSvgMetrics();renderer.paint(e,true);assert.notEqual(door.getAttribute('transform'),closed);assert.equal(svgMetrics.created,0);
});
test('walking toward the front door opens it and exits once; returning inside does not immediately bounce back outside',()=>{
 let exits=0;const e=new AdventureEngine(3,{...silent,run:()=>exits++});Object.assign(e.player,HOME_ENTRY);e.setInput(0,1,false);for(let i=0;i<70;i++)e.advance(ADVENTURE_STEP);assert.equal(exits,1);assert.equal(e.phase,'paused');e.advance(10);assert.equal(exits,1);
 const returning=new AdventureEngine(3,{...silent,run:()=>exits++});returning.enterHomeFromStreet();returning.setInput(0,1,false);for(let i=0;i<24;i++)returning.advance(ADVENTURE_STEP);returning.setInput(0,0,false);for(let i=0;i<60;i++)returning.advance(ADVENTURE_STEP);assert.equal(exits,1);assert.equal(returning.view().homeRoom,'hall');assert.ok(Math.abs(returning.homeDoors[5].angle)>.2);
 returning.setInput(0,-1,false);for(let i=0;i<60;i++)returning.advance(ADVENTURE_STEP);assert.equal(returning.phase,'playing');assert.ok(returning.player.y<1000);
});
test('leaving the first unfinished mission opens the expanded home and its basement restarts level one without unlocking completed progress',()=>{
 const e=new AdventureEngine(2,silent);assert.equal(e.completedLevel,0);e.pause();e.exitToApartment();assert.equal(e.area,'apartment');assert.equal(e.expandedHome,true);assert.deepEqual({x:e.player.x,y:e.player.y},HOME_SPAWN);Object.assign(e.player,{x:840,y:740});assert.equal(e.interactDestination('basement'),true);assert.equal(e.area,'sewer');assert.equal(e.level,1);assert.equal(e.completedLevel,0);assert.equal(e.weapon,'fist');e.enterHomeFromStreet();assert.equal(e.area,'apartment');assert.deepEqual({x:e.player.x,y:e.player.y},HOME_ENTRY);assert.equal(e.completedLevel,0);
});
test('the two living-room windows show different places and have exactly one sun by day or one moon at night',()=>{
 for(const theme of ['classic','soda','mint','bath','night','emerald']){const svg=parseAdventureSvg(renderToStaticMarkup(React.createElement(AdventureScene,{area:'apartment',theme})));assert.equal(svg.querySelectorAll('[data-home-window-view="courtyard"]').length,1);assert.equal(svg.querySelectorAll('[data-home-window-view="park"]').length,1);assert.equal(svg.querySelectorAll('[data-home-sun]').length,theme==='night'?0:1);assert.equal(svg.querySelectorAll('[data-home-moon]').length,theme==='night'?1:0);}
});

test('the expanded living room no longer has the removed mini-bar collision; keepsakes occupy its former wall space',()=>{
 const e=new AdventureEngine(3,silent);
 assert.equal(e.expandedHome,true);
 for(const [x,y] of [[515,270],[550,280],[575,280]])assert.equal(e.canStand(x,y,0),true,`Old mini-bar still blocks ${x},${y}`);
 const progress=defaultNeighborhoodProgress();progress.quest=3;
 const svg=parseAdventureSvg(renderToStaticMarkup(React.createElement(AdventureScene,{area:'apartment',keepsakes:progress})));
 const shelf=svg.querySelector('[data-apartment-keepsakes]');
 assert.ok(shelf,'Keepsakes must still be rendered');
 assert.equal(shelf.parent.getAttribute('data-home-keepsakes-placement'),'');
 assert.equal(shelf.parent.getAttribute('transform'),'translate(-174 -42) scale(.74)');
 assert.equal(svg.querySelectorAll('[data-home-furniture="mini-bar"]').length,0);
});
