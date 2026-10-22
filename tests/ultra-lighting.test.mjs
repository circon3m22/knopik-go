import './helpers/tsx-loader.mjs';
import test from 'node:test';import assert from 'node:assert/strict';import {createElement as h} from 'react';import {renderToStaticMarkup as render} from 'react-dom/server';import sharp from 'sharp';
import {lightVisibility,lightRayDistance,objectShadow} from '../app/ultra-light-geometry.ts';
import {setGraphicsQuality} from '../app/graphics-quality.ts';
import {dungeonGame} from './helpers/dungeon-fixtures.mjs';
import {parseAdventureSvg} from './helpers/adventure-svg-dom.mjs';
import {resetSvgMetrics,svgMetrics,runnerSvgScene} from './helpers/runner-svg-dom.mjs';
import {NeighborhoodEngine} from '../app/neighborhood-engine.ts';import {defaultNeighborhoodProgress} from '../app/neighborhood-progress.ts';
import {RunnerEngine} from '../app/runner-engine.ts';import {RunnerRenderer} from '../app/runner-renderer.ts';
const {UltraRoomLighting}=await import('../app/ultra-room-lighting.tsx');
const {AdventureScene,AdventureRenderer}=await import('../app/adventure-artwork.tsx');
const {NeighborhoodScene,NeighborhoodRenderer}=await import('../app/neighborhood-artwork.tsx');

test('visibility rays stop at the first obstacle, keep the room bounds, and ignore the mounting footprint',()=>{
 const room={x:0,y:0,w:100,h:100},wall={x:45,y:0,w:8,h:80},light={x:20,y:50,radius:120,color:'#fff',strength:.5};
 assert.equal(lightRayDistance(light,1,0,wall),25);assert.equal(lightRayDistance(light,-1,0,wall),Infinity);assert.equal(lightRayDistance({x:20,y:90},1,0,wall),Infinity);
 const fan=lightVisibility(light,room,[wall]);assert.ok(fan.length<120);for(const p of fan)assert.ok(p.x>=0&&p.y>=0&&p.x<=100&&p.y<=100);assert.ok(fan.some(p=>p.x===45&&Math.abs(p.y-50)<.1));
 assert.deepEqual(lightVisibility(light,room,[{x:15,y:45,w:10,h:10}]),lightVisibility(light,room,[]));
 for(const x of [-100,200])for(const y of [-100,200]){const shape=objectShadow({x:40,y:40,w:20,h:20},{x,y});assert.doesNotMatch(shape,/NaN|Infinity/);assert.ok(shape.endsWith('Z'));}
});

test('the rendered light visibly illuminates the near side and does not leak through an opaque blocker',async()=>{
 const room={x:0,y:0,w:100,h:100},casters=[{x:45,y:0,w:8,h:80}];
 for(const x of [20,80]){
  const svg=render(h('svg',{xmlns:'http://www.w3.org/2000/svg',width:100,height:100},h('rect',{width:100,height:100,fill:'#405060'}),h(UltraRoomLighting,{prefix:'sample',rooms:[room],casters,lights:[{x,y:50,radius:120,color:'#ffdda0',strength:.7}]})));
  const {data,info}=await sharp(Buffer.from(svg)).ensureAlpha().raw().toBuffer({resolveWithObject:true});const brightness=xx=>data[(50*info.width+xx)*4]+data[(50*info.width+xx)*4+1]+data[(50*info.width+xx)*4+2];
  assert.ok((x===20?brightness(35)-brightness(65):brightness(65)-brightness(35))>50,'blocked side must stay darker');
 }
});

test('all 35 campaigns and eight homes retain their original surfaces and a bounded static lighting pass',()=>{
 setGraphicsQuality('ultra');try{
  for(let level=1;level<=35;level++){
   const e=dungeonGame(level),source=render(h(AdventureScene,{area:'sewer',level,layout:e.levelData})),svg=parseAdventureSvg(source);
   assert.ok(source.includes('source-bound-2'));assert.ok(source.includes('-level-floor'));assert.doesNotMatch(source,/NaN|Infinity|<feGaussianBlur\b|ultra-surface|materials-061/);
   assert.equal(svg.querySelectorAll('[data-ultra-source]').length,e.levelData.rooms.length*8);assert.equal(svg.querySelectorAll('[data-dungeon-effect]').length,36);
  }
  for(const theme of ['classic','soda','mint','night','bath','emerald','skyline','observatory']){const source=render(h(AdventureScene,{area:'apartment',theme}));assert.ok(source.includes('-home-planks'));assert.ok(source.includes('data-ultra-window-light'));assert.doesNotMatch(source,/NaN|Infinity|<feGaussianBlur\b/);}
 }finally{setGraphicsQuality('medium');}
});

test('quality switching removes the new pass, breakable props disappear with their finish, and paused rooms allocate no nodes',()=>{
 for(const quality of ['low','medium','high','very-high']){setGraphicsQuality(quality);const e=dungeonGame(7),source=render(h(AdventureScene,{area:'sewer',level:7,layout:e.levelData}));assert.ok(!source.includes('source-bound-2'));assert.ok(!source.includes('data-ultra-cover-finish'));}
 setGraphicsQuality('ultra');try{
  const e=dungeonGame(2),svg=parseAdventureSvg(render(h(AdventureScene,{area:'sewer',level:2,layout:e.levelData}))),r=new AdventureRenderer(svg,true);r.resize(390,700);r.paint(e,true);
  const index=e.levelData.solids.findIndex(s=>s.breakable);assert.ok(index>=0);e.dungeon.destroyed[index]=true;r.paint(e,true);assert.equal(svg.querySelectorAll('[data-dungeon-cover]')[index].getAttribute('display'),'none');
  resetSvgMetrics();for(let i=0;i<60;i++)r.paint(e,true);assert.equal(svgMetrics.created,0);assert.equal(svgMetrics.writes,0);
 }finally{setGraphicsQuality('medium');}
});

test('night lights follow real switches, distant lights are culled, and a paused city has no new writes',()=>{
 setGraphicsQuality('ultra');try{
  const e=new NeighborhoodEngine(defaultNeighborhoodProgress(),{change(){},progress(){},home(){},run(){},sound(){}}),svg=parseAdventureSvg(render(h(NeighborhoodScene,{night:true,prefix:'switches'}))),r=new NeighborhoodRenderer(svg,true,true);r.resize(390,700);r.paint(e,true);
  const before=svg.querySelectorAll('[data-lamp-glow]').map(n=>n.getAttribute('display'));e.progress.missions.lights.steps=7;r.paint(e,true);const after=svg.querySelectorAll('[data-lamp-glow]').map(n=>n.getAttribute('display'));assert.notDeepEqual(after,before);
  assert.ok(svg.querySelectorAll('[data-ground-chunk]').some(n=>n.getAttribute('display')==='none'));resetSvgMetrics();for(let i=0;i<60;i++)r.paint(e,true);assert.equal(svgMetrics.created,0);assert.equal(svgMetrics.writes,0);
 }finally{setGraphicsQuality('medium');}
});

test('Run reuses the facade finish after warmup and removes it when Ultra is turned off',()=>{
 const events={phase(){},coins(){},finish(){},sound(){},zone(){},route(){}},e=new RunnerEngine(events,{immortal:true});e.start();for(let i=0;i<60;i++)e.update(1/60);
 setGraphicsQuality('ultra');try{
  const svg=runnerSvgScene(),r=new RunnerRenderer(svg,'finish',true);r.render(e);const nodes=svg.querySelectorAll('[data-ultra-runner-finish]');assert.ok(nodes.length>0&&nodes.length<=108);assert.ok(nodes.some(n=>n.getAttribute('display')==='inline'));
  resetSvgMetrics();for(let i=0;i<30;i++)r.render(e);assert.equal(svgMetrics.created,0);assert.equal(svgMetrics.writes,0);setGraphicsQuality('very-high');r.render(e);assert.ok(nodes.every(n=>n.getAttribute('display')==='none'));
 }finally{setGraphicsQuality('medium');}
});
