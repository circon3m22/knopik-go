import './helpers/tsx-loader.mjs';
import test from 'node:test';import assert from 'node:assert/strict';import {createElement as h} from 'react';import {renderToStaticMarkup as render} from 'react-dom/server';import sharp from 'sharp';
import {incidentRadiance,wallBounceSamples} from '../app/ultra-irradiance.ts';
import {cityWindowSeed,cityWindowKey} from '../app/city-window-light.ts';
import {NEIGHBORHOOD_OBJECTS} from '../app/neighborhood-map.ts';
import {setGraphicsQuality} from '../app/graphics-quality.ts';import {dungeonGame} from './helpers/dungeon-fixtures.mjs';import {parseAdventureSvg} from './helpers/adventure-svg-dom.mjs';import {resetSvgMetrics,svgMetrics} from './helpers/runner-svg-dom.mjs';
import {NeighborhoodEngine} from '../app/neighborhood-engine.ts';import {defaultNeighborhoodProgress} from '../app/neighborhood-progress.ts';
const {UltraIndirectLight,UltraObjectRadiance}=await import('../app/ultra-indirect-art.tsx');
const {UltraRoomLighting}=await import('../app/ultra-room-lighting.tsx');
const {AdventureScene,AdventureRenderer}=await import('../app/adventure-artwork.tsx');const {NeighborhoodScene,NeighborhoodRenderer}=await import('../app/neighborhood-artwork.tsx');
const room={x:0,y:0,w:280,h:200},light={x:30,y:100,radius:230,color:'#ffd28e',strength:.6},wall={x:130,y:0,w:10,h:200};

test('surface response faces real sources, decays with distance, and is blocked by intervening geometry',()=>{
 const normal={x:-1,y:0},near=incidentRadiance({x:60,y:100},normal,[light],[]),far=incidentRadiance({x:110,y:100},normal,[light],[]);
 assert.ok(near.energy>far.energy);assert.equal(incidentRadiance({x:60,y:100},{x:1,y:0},[light],[]),undefined);
 assert.equal(incidentRadiance({x:170,y:100},normal,[light],[wall]),undefined);
 assert.equal(incidentRadiance({x:280,y:100},normal,[light],[]),undefined);
 assert.deepEqual(incidentRadiance({x:60,y:100},normal,[light],[{x:20,y:90,w:20,h:20}]),near);
});

test('wall returns are bounded, live on walls and cannot illuminate the other side of a sealed divider',async()=>{
 const samples=wallBounceSamples(room,[light],[wall]);assert.ok(samples.length>0&&samples.length<=6);
 for(const s of samples){assert.ok(s.x<wall.x);assert.ok(s.energy>0&&s.energy<=.24);assert.ok([room.x+2,room.x+room.w-2].includes(s.x)||[room.y+2,room.y+room.h-2].includes(s.y));}
 const source=render(h('svg',{xmlns:'http://www.w3.org/2000/svg',width:280,height:200},h('rect',{width:280,height:200,fill:'#304050'}),h(UltraIndirectLight,{prefix:'return-test',room,lights:[light],casters:[wall]})));
 const {data,info}=await sharp(Buffer.from(source)).ensureAlpha().raw().toBuffer({resolveWithObject:true});const rgb=(x,y)=>[...data.subarray((y*info.width+x)*4,(y*info.width+x)*4+3)];
 assert.ok(rgb(8,100)[0]>48);assert.deepEqual(rgb(200,100),[48,64,80]);
 const svg=parseAdventureSvg(source);for(const n of svg.querySelectorAll('[data-ultra-wall-return]'))assert.ok(n.querySelector('[clip-path]'));
});

test('lit object edges use world-space occlusion and stay inside their own pixel footprint',()=>{
 const rect={x:80,y:80,w:36,h:44},props={rect,origin:{x:80,y:80},lights:[light],casters:[]};
 const svg=parseAdventureSvg(render(h('svg',{},h(UltraObjectRadiance,props)))),paths=svg.querySelectorAll('path');assert.ok(paths.length>0&&paths.length<=4);
 assert.ok(paths.every(p=>+p.getAttribute('opacity')>0&&+p.getAttribute('opacity')<=.74));
 assert.equal(parseAdventureSvg(render(h('svg',{},h(UltraObjectRadiance,{...props,casters:[{x:60,y:0,w:5,h:200}]})))).querySelectorAll('path').length,0);
});

test('each source shares its actual hue with the bloom and beam instead of tinting cool emitters amber',()=>{
 const lights=[light,{...light,x:200,color:'#88d5e8'}],svg=parseAdventureSvg(render(h('svg',{},h(UltraRoomLighting,{prefix:'tint-check',rooms:[room],lights,casters:[]}))));
 for(const [n,l]of lights.entries()){
  const source=svg.querySelector(`[data-ultra-source="0-${n}"]`);assert.equal(source.getAttribute('data-ultra-source-color'),l.color);
  const beam=source.querySelector('[data-ultra-soft-beam]'),id=beam.getAttribute('fill').slice(5,-1),gradient=svg.querySelector(`[id="${id}"]`);assert.ok(gradient);assert.ok(gradient.querySelectorAll('stop').filter(n=>n.getAttribute('stop-color')===l.color).length>=2);
 }
});

test('all 35 campaigns have bounded wall transport and prop edges, and destroyed props take their highlights with them',()=>{
 setGraphicsQuality('ultra');try{
  for(let level=1;level<=35;level++){
   const e=dungeonGame(level),source=render(h(AdventureScene,{area:'sewer',level,layout:e.levelData})),svg=parseAdventureSvg(source);
   assert.equal(svg.querySelectorAll('[data-ultra-indirect]').length,e.levelData.rooms.length);
   for(const n of svg.querySelectorAll('[data-ultra-indirect]'))assert.ok(n.querySelectorAll('[data-ultra-wall-return]').length<=6);
   assert.ok(svg.querySelectorAll('[data-ultra-object-radiance]').length>0);assert.doesNotMatch(source,/NaN|Infinity|<filter\b[^>]*radiant|<feGaussianBlur\b/);
  }
  const e=dungeonGame(12),svg=parseAdventureSvg(render(h(AdventureScene,{area:'sewer',level:12,layout:e.levelData}))),r=new AdventureRenderer(svg,true),index=e.levelData.solids.findIndex(s=>s.breakable&&s.kind!=='rubble'),node=svg.querySelectorAll('[data-dungeon-cover]')[index];
  assert.ok(node.querySelector('[data-ultra-object-radiance]'));r.paint(e,true);e.dungeon.destroyed[index]=true;r.paint(e,true);assert.equal(node.getAttribute('display'),'none');
  resetSvgMetrics();for(let n=0;n<30;n++)r.paint(e,true);assert.equal(svgMetrics.created,0);assert.equal(svgMetrics.writes,0);
 }finally{setGraphicsQuality('medium');}
});

test('home light catches furniture in every theme and lower qualities allocate no new radiance geometry',()=>{
 setGraphicsQuality('ultra');try{for(const theme of ['classic','night','soda','mint','bath','emerald','skyline','observatory']){
  const source=render(h(AdventureScene,{area:'apartment',theme})),svg=parseAdventureSvg(source);assert.ok(svg.querySelectorAll('[data-ultra-object-radiance]').length>=8);assert.ok(source.includes('data-ultra-window-glint'));assert.doesNotMatch(source,/NaN|Infinity/);
 }}finally{setGraphicsQuality('medium');}
 for(const quality of ['low','medium','high','very-high']){setGraphicsQuality(quality);for(const props of [{area:'apartment',theme:'night'},{area:'sewer',level:12}])assert.doesNotMatch(render(h(AdventureScene,props)),/radiant-4|data-ultra-indirect|data-ultra-object-radiance/);assert.doesNotMatch(render(h(NeighborhoodScene,{night:true})),/radiant-4|data-ultra-lamp-receiver/);}setGraphicsQuality('medium');
});

test('facade spill matches lit ground-floor windows, and foliage receivers switch with their lamp without frame allocations',()=>{
 setGraphicsQuality('ultra');try{
  const e=new NeighborhoodEngine(defaultNeighborhoodProgress(),{change(){},progress(){},home(){},run(){},sound(){}}),svg=parseAdventureSvg(render(h(NeighborhoodScene,{night:true,prefix:'radiant-city'}))),r=new NeighborhoodRenderer(svg,true,true);r.paint(e,true);
  for(const o of NEIGHBORHOOD_OBJECTS.filter(o=>o.kind==='house'))for(const col of [0,2])assert.equal(!!svg.querySelector(`[data-ultra-window-spill="${o.id}-${col}"]`),cityWindowKey(cityWindowSeed(o.id),2,col)%5!==0);
  const receivers=svg.querySelectorAll('[data-ultra-lamp-receiver]');assert.ok(receivers.length>0);
  for(const steps of [0,7]){e.progress.missions.lights.steps=steps;r.paint(e,true);for(const node of receivers){const id=node.getAttribute('data-ultra-lamp-receiver');assert.equal(node.getAttribute('display'),svg.querySelector(`[data-lamp-glow="${id}"]`).getAttribute('display'));}}
  resetSvgMetrics();for(let n=0;n<60;n++)r.paint(e,true);assert.equal(svgMetrics.created,0);assert.equal(svgMetrics.writes,0);
 }finally{setGraphicsQuality('medium');}
});
