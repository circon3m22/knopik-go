import './helpers/tsx-loader.mjs';
import test from 'node:test';import assert from 'node:assert/strict';import {createElement as h} from 'react';import {renderToStaticMarkup as render} from 'react-dom/server';import sharp from 'sharp';
import {setGraphicsQuality} from '../app/graphics-quality.ts';import {parseAdventureSvg} from './helpers/adventure-svg-dom.mjs';import {resetSvgMetrics,svgMetrics} from './helpers/runner-svg-dom.mjs';import {dungeonGame} from './helpers/dungeon-fixtures.mjs';
import {NeighborhoodEngine} from '../app/neighborhood-engine.ts';import {defaultNeighborhoodProgress} from '../app/neighborhood-progress.ts';import {NEIGHBORHOOD_LAMPS} from '../app/neighborhood-map.ts';
const {ultraRoomSources}=await import('../app/ultra-light-sources.ts');
const {UltraMistPatch}=await import('../app/ultra-haze-art.tsx');const {UltraAtmosphereRenderer}=await import('../app/ultra-atmosphere-renderer.ts');
const {AdventureScene}=await import('../app/adventure-artwork.tsx');const {NeighborhoodScene,NeighborhoodRenderer}=await import('../app/neighborhood-artwork.tsx');
const room={x:0,y:0,w:240,h:180},patch={prefix:'test-fog',room,color:'#bfd7dc',density:.28,seed:3};
const serialize=n=>`<${n.tag}${[...n.attrs].filter(([k])=>!k.startsWith('style:')).map(([k,v])=>` ${k}="${String(v).replaceAll('&','&amp;').replaceAll('"','&quot;')}"`).join('')}>${n.textContent}${n.children.map(serialize).join('')}</${n.tag}>`;
function checkClips(svg){for(const node of svg.querySelectorAll('[data-ultra-haze-patch]')){const value=node.getAttribute('clip-path');if(value)assert.ok(svg.querySelector(`[id="${value.slice(5,-1)}"]`),value);assert.ok(+node.getAttribute('opacity')<=.46);assert.equal(node.getAttribute('pointer-events'),'none');}}

test('native haze visibly lifts the shadows while retaining the contrast and sharp pixel edges below it',async()=>{
 const images=[];
 for(const fog of [false,true]){
  const svg=parseAdventureSvg(render(h('svg',{xmlns:'http://www.w3.org/2000/svg',width:240,height:180},...Array.from({length:12},(_,i)=>h('rect',{key:i,x:i*20,width:20,height:180,fill:i%2?'#96aaa5':'#293b44'})),fog&&h(UltraMistPatch,patch))));
  if(fog)new UltraAtmosphereRenderer(svg).paint(0,{x:0,y:0,w:240,h:180});images.push(await sharp(Buffer.from(serialize(svg))).removeAlpha().raw().toBuffer());
 }
 const red=(image,x,y)=>image[(y*240+x)*3];assert.ok(red(images[1],85,110)>red(images[0],85,110)+5);
 const before=red(images[0],65,110)-red(images[0],85,110),after=red(images[1],65,110)-red(images[1],85,110);assert.ok(after>before*.7);assert.ok(after<before);
});

test('all 35 campaigns have room-bound haze and two source-lit volumes with shared gradients',()=>{
 setGraphicsQuality('ultra');try{for(let level=1;level<=35;level++){
  const e=dungeonGame(level),source=render(h(AdventureScene,{area:'sewer',level,layout:e.levelData})),svg=parseAdventureSvg(source),fog=svg.querySelector('[data-ultra-interior-haze]');
  assert.ok(fog);assert.equal(fog.querySelectorAll('[data-ultra-haze-patch]').length,e.levelData.rooms.length*3+e.levelData.gates.length);assert.equal(fog.querySelectorAll('[data-ultra-passage-haze]').length,e.levelData.gates.length);assert.equal(fog.querySelectorAll('radialGradient').length,2);checkClips(svg);
  const floorClip=fog.getAttribute('clip-path');assert.ok(floorClip);assert.equal(svg.querySelector('[data-ultra-volume-veil]').getAttribute('clip-path'),floorClip);assert.equal(svg.querySelector('[data-ultra-event-lights]').getAttribute('clip-path'),floorClip);assert.ok(svg.querySelector(`[id="${floorClip.slice(5,-1)}"]`));
  const shafts=fog.querySelectorAll('[data-ultra-fog-shaft]');assert.equal(shafts.length,e.levelData.rooms.length*2);
  const lights=e.levelData.rooms.flatMap(room=>ultraRoomSources(room,e.levelData.palette.accent).slice(6));
  shafts.forEach((shaft,i)=>{assert.equal(+shaft.getAttribute('data-fog-emitter-x'),lights[i].x);assert.equal(+shaft.getAttribute('data-fog-emitter-y'),lights[i].y);assert.ok(shaft.parent.getAttribute('clip-path'));});
  assert.doesNotMatch(serialize(fog),/NaN|Infinity|<filter\b|<feGaussianBlur\b|<image\b|<feTurbulence\b/);
  assert.ok(svg.children.indexOf(fog)>svg.children.indexOf(svg.querySelector('[data-actors]')));assert.ok(svg.children.indexOf(fog)<svg.children.indexOf(svg.querySelector('[data-firearm-aim]')));
 }}finally{setGraphicsQuality('medium');}
});

test('dense overlapping mist retains pixel contrast and its light cones do not drift away from the emitter',async()=>{
 const images=[];let svg;
 for(const fog of [false,true]){
  svg=parseAdventureSvg(render(h('svg',{xmlns:'http://www.w3.org/2000/svg',width:240,height:180},...Array.from({length:12},(_,i)=>h('rect',{key:i,x:i*20,width:20,height:180,fill:i%2?'#96aaa5':'#293b44'})),fog&&h('g',{},h(UltraMistPatch,{...patch,density:.4}),...[0,1].map(i=>h(UltraMistPatch,{...patch,prefix:'dense-'+i,lit:true,density:.32,seed:i*7,shaft:{x:35+i*170,y:10,angle:i?115:65,reach:160,width:45,aperture:10}}))))));
  const renderer=new UltraAtmosphereRenderer(svg),shafts=svg.querySelectorAll('[data-ultra-fog-shaft]'),fixed=shafts.map(n=>n.getAttribute('transform'));renderer.paint(0,{x:0,y:0,w:240,h:180});
  images.push(await sharp(Buffer.from(serialize(svg))).removeAlpha().raw().toBuffer());renderer.paint(20,{x:0,y:0,w:240,h:180});assert.deepEqual(shafts.map(n=>n.getAttribute('transform')),fixed);
 }
 const red=(im,x,y)=>im[(y*240+x)*3],before=red(images[0],65,110)-red(images[0],85,110),after=red(images[1],65,110)-red(images[1],85,110);
 assert.ok(red(images[1],85,110)>red(images[0],85,110)+12);assert.ok(after>before*.45,`${after}/${before}`);
});

test('all home themes, the opening apartment and basement reference valid existing fog clips',()=>{
 setGraphicsQuality('ultra');try{
  for(const theme of ['classic','night','soda','mint','bath','emerald','skyline','observatory']){const svg=parseAdventureSvg(render(h(AdventureScene,{area:'apartment',theme})));assert.ok(svg.querySelectorAll('[data-ultra-haze-patch]').length>=12);checkClips(svg);}
  for(const area of ['apartment','basement']){const svg=parseAdventureSvg(render(h(AdventureScene,{area,legacyHome:true,theme:'night'})));assert.equal(svg.querySelectorAll('[data-ultra-haze-patch]').length,3);checkClips(svg);}
 }finally{setGraphicsQuality('medium');}
});

test('two mist layers drift at 12 Hz, stop on pause/reduced motion and skip offscreen patches without new nodes',()=>{
 const svg=parseAdventureSvg(render(h('svg',{},h(UltraMistPatch,patch),h(UltraMistPatch,{...patch,prefix:'far',room:{...room,x:1500}})))),r=new UltraAtmosphereRenderer(svg),camera={x:0,y:0,w:300,h:220};r.paint(0,camera);const bodies=svg.querySelectorAll('[data-ultra-haze-drift]'),before=bodies[0].getAttribute('transform');
 assert.equal(bodies[2].getAttribute('transform'),null);resetSvgMetrics();for(let n=1;n<=60;n++)r.paint(n/60,camera);assert.ok(svgMetrics.writes<=52,JSON.stringify(svgMetrics));assert.equal(svgMetrics.created,0);assert.notEqual(bodies[0].getAttribute('transform'),before);assert.equal(bodies[2].getAttribute('transform'),null);
 resetSvgMetrics();for(let n=0;n<60;n++)r.paint(1,camera);assert.equal(svgMetrics.writes,0);r.paint(5,camera,true);resetSvgMetrics();r.paint(500,camera,true);assert.equal(svgMetrics.writes,0);
 r.paint(500,{...camera,x:1500},true);assert.ok(bodies[2].getAttribute('transform'));assert.equal(svgMetrics.created,0);
});

test('a switched-off source does not animate its mist and turning it on restores both layers',()=>{
 const svg=parseAdventureSvg(render(h('svg',{},h('g',{'data-ultra-lamp-corona':'fog-lamp',display:'none'},h(UltraMistPatch,{...patch,lamp:'fog-lamp'}))))),r=new UltraAtmosphereRenderer(svg),camera={x:0,y:0,w:300,h:220},source=svg.querySelector('[data-ultra-lamp-corona]'),fog=svg.querySelector('[data-ultra-haze-patch]');
 r.paint(0,camera);assert.equal(fog.getAttribute('display'),'none');assert.equal(fog.querySelector('[data-ultra-haze-drift]').getAttribute('transform'),null);
 source.setAttribute('display','inline');r.paint(0,camera);assert.equal(fog.getAttribute('display'),'inline');assert.ok(fog.querySelector('[data-ultra-haze-drift]').getAttribute('transform'));
 source.setAttribute('display','none');r.paint(1,camera);resetSvgMetrics();for(let n=0;n<60;n++)r.paint(n+2,camera);assert.equal(svgMetrics.writes,0);assert.equal(svgMetrics.created,0);
});

test('street fog has a fixed budget, follows real switches, fits the lamp chunks and freezes with the scene',()=>{
 setGraphicsQuality('ultra');try{const e=new NeighborhoodEngine(defaultNeighborhoodProgress(),{change(){},progress(){},home(){},run(){},sound(){}});Object.assign(e.player,{x:650,y:700});const svg=parseAdventureSvg(render(h(NeighborhoodScene,{night:true,prefix:'fog-city'}))),r=new NeighborhoodRenderer(svg,true,true);r.resize(390,650);r.paint(e,true);
  assert.equal(svg.querySelector('[data-ultra-street-haze]').querySelectorAll('[data-ultra-haze-patch]').length,24);assert.equal(svg.querySelectorAll('[data-haze-lamp]').length,NEIGHBORHOOD_LAMPS.length);
  for(const node of svg.querySelectorAll('[data-haze-lamp]')){const chunk=node.parent.parent,x=+node.getAttribute('data-haze-x'),y=+node.getAttribute('data-haze-y');assert.ok(x>=+chunk.getAttribute('data-x'));assert.ok(y>=+chunk.getAttribute('data-y'));assert.ok(x+(+node.getAttribute('data-haze-w'))<=+chunk.getAttribute('data-x')+(+chunk.getAttribute('data-w')));assert.ok(y+(+node.getAttribute('data-haze-h'))<=+chunk.getAttribute('data-y')+(+chunk.getAttribute('data-h')));}
  const nearby=svg.querySelector('[data-haze-lamp="lamp-0"]');assert.equal(nearby.getAttribute('display'),'none');e.progress.missions.lights.steps=7;r.paint(e,true);assert.equal(nearby.getAttribute('display'),'inline');
  resetSvgMetrics();for(let n=0;n<60;n++)r.paint(e,true);assert.equal(svgMetrics.writes,0);assert.equal(svgMetrics.created,0);assert.ok(svg.querySelectorAll('[data-ultra-haze-patch]').some(n=>n.getAttribute('display')==='none'));
 }finally{setGraphicsQuality('medium');}
 for(const q of ['low','medium','high','very-high']){setGraphicsQuality(q);assert.doesNotMatch(render(h(AdventureScene,{area:'sewer',level:2})),/data-ultra-haze|mist-6/);assert.doesNotMatch(render(h(NeighborhoodScene,{night:true,prefix:'no-fog'})),/data-ultra-haze|mist-6/);}setGraphicsQuality('medium');
});
