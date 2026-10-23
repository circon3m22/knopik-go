import './helpers/tsx-loader.mjs';
import test from 'node:test';import assert from 'node:assert/strict';import {createElement as h} from 'react';import {renderToStaticMarkup as render} from 'react-dom/server';import sharp from 'sharp';
import {setGraphicsQuality} from '../app/graphics-quality.ts';import {dungeonGame} from './helpers/dungeon-fixtures.mjs';import {parseAdventureSvg} from './helpers/adventure-svg-dom.mjs';import {resetSvgMetrics,svgMetrics} from './helpers/runner-svg-dom.mjs';
import {NeighborhoodEngine} from '../app/neighborhood-engine.ts';import {defaultNeighborhoodProgress} from '../app/neighborhood-progress.ts';import {NEIGHBORHOOD_LAMPS} from '../app/neighborhood-map.ts';
const {AdventureScene}=await import('../app/adventure-artwork.tsx');const {NeighborhoodScene,NeighborhoodRenderer}=await import('../app/neighborhood-artwork.tsx');
const {UltraMotes,UltraRadianceDefs,UltraSourceLayers}=await import('../app/ultra-radiance-art.tsx');const {UltraAtmosphereRenderer}=await import('../app/ultra-atmosphere-renderer.ts');const {UltraEventLightArt}=await import('../app/ultra-event-light-art.tsx');const {UltraEventLightRenderer}=await import('../app/ultra-event-light-renderer.ts');
const room={x:0,y:0,w:250,h:200},light={x:30,y:40,radius:190,color:'#ffe1a2',strength:.4};

test('wet and polished surfaces produce a stronger visible specular response than rough stone',async()=>{
 const totals={};for(const surface of ['matte','wood','wet','polished']){
  const source=render(h('svg',{xmlns:'http://www.w3.org/2000/svg',width:250,height:200},h('rect',{width:250,height:200,fill:'#304454'}),h(UltraRadianceDefs,{prefix:'finish',tint:light.color}),h(UltraSourceLayers,{prefix:'finish',room,light,surface})));
  const {data,info}=await sharp(Buffer.from(source)).raw().toBuffer({resolveWithObject:true});let sum=0;for(let y=35;y<105;y++)for(let x=45;x<165;x++)for(let c=0;c<3;c++)sum+=data[(y*info.width+x)*info.channels+c];totals[surface]=sum;
 }
 assert.ok(totals.wet>totals.matte*1.015,JSON.stringify(totals));assert.ok(totals.polished>totals.wet);assert.ok(totals.wood>totals.matte);
});

test('every campaign receives clipped light layers, motes and a veil while lower tiers contain none of them',()=>{
 setGraphicsQuality('ultra');try{for(let level=1;level<=35;level++){
  const e=dungeonGame(level),source=render(h(AdventureScene,{area:'sewer',level,layout:e.levelData})),svg=parseAdventureSvg(source);
  assert.equal(svg.querySelectorAll('[data-ultra-radiance]').length,e.levelData.rooms.length*8);assert.equal(svg.querySelectorAll('[data-ultra-event-light]').length,6);assert.equal(svg.querySelectorAll('[data-ultra-air-patch]').length,e.levelData.rooms.length);assert.ok(source.includes('data-ultra-volume-veil'));
  assert.doesNotMatch(source,/NaN|Infinity|<feGaussianBlur\b|mix-blend-mode/);for(const n of svg.querySelectorAll('[data-ultra-radiance]'))assert.ok(n.parent.getAttribute('clip-path'));
 }}finally{setGraphicsQuality('medium');}
 for(const q of ['low','medium','high','very-high']){setGraphicsQuality(q);const e=dungeonGame(2);assert.doesNotMatch(render(h(AdventureScene,{area:'sewer',level:2,layout:e.levelData})),/data-ultra-radiance|data-ultra-event-light|data-ultra-volume-veil|data-ultra-air-patch/);}setGraphicsQuality('medium');
});

test('the opening flat and basement use the same light stack without replacing their surfaces',()=>{
 setGraphicsQuality('ultra');try{for(const area of ['apartment','basement']){
  const source=render(h(AdventureScene,{area,legacyHome:true,theme:'night'}));assert.ok(source.includes('data-ultra-small-interior'));assert.ok(source.includes('data-ultra-radiance'));assert.doesNotMatch(source,/NaN|Infinity/);
 }}finally{setGraphicsQuality('medium');}
});

test('motes update at 12 Hz, freeze on pause/reduced motion and do not animate an offscreen patch',()=>{
 const svg=parseAdventureSvg(render(h('svg',{},h(UltraMotes,{room,index:0}),h(UltraMotes,{room:{...room,x:1200},index:1})))),r=new UltraAtmosphereRenderer(svg),camera={x:0,y:0,w:300,h:230};r.paint(0,camera);const hidden=svg.querySelectorAll('[data-ultra-air-drift]')[1];assert.equal(hidden.getAttribute('transform'),null);
 resetSvgMetrics();for(let i=1;i<=60;i++)r.paint(i/60,camera);assert.equal(svgMetrics.created,0);assert.ok(svgMetrics.writes<=26,JSON.stringify(svgMetrics));assert.equal(hidden.getAttribute('transform'),null);
 resetSvgMetrics();for(let i=0;i<60;i++)r.paint(1,camera);assert.equal(svgMetrics.writes,0);r.paint(8,camera,true);resetSvgMetrics();r.paint(300,camera,true);assert.equal(svgMetrics.writes,0);
 r.paint(300,{...camera,x:1200},true);assert.equal(svg.querySelectorAll('[data-ultra-air-patch]')[1].getAttribute('display'),'inline');assert.ok(hidden.getAttribute('transform'));
});

function eventScene(){const e=dungeonGame(2),svg=parseAdventureSvg(render(h('svg',{},h(UltraEventLightArt,{prefix:'event-test'})))),r=new UltraEventLightRenderer(svg);return {e,svg,r};}
const live=svg=>svg.querySelectorAll('[data-ultra-event-light]').filter(n=>n.getAttribute('display')==='inline');
test('shots illuminate locally, fade out, and do not create crossbow flashes or alter the simulation',()=>{
 setGraphicsQuality('ultra');try{const {e,svg,r}=eventScene();e.weapon='pistol';e.punchTime=.2;e.punchSerial=3;const before=JSON.stringify({p:e.player,effects:e.effects,bullets:e.bullets});r.paint(e,0);assert.ok(live(svg).some(n=>n.getAttribute('data-event-kind')==='muzzle'));assert.equal(JSON.stringify({p:e.player,effects:e.effects,bullets:e.bullets}),before);
  e.punchTime=.13;r.paint(e,0);assert.ok(+live(svg)[0].getAttribute('opacity')<.4);e.punchTime=0;r.paint(e,0);assert.equal(live(svg).length,0);e.weapon='crossbow';e.punchTime=.2;r.paint(e,0);assert.equal(live(svg).length,0);e.weapon='pistol';r.paint(e,0,true);assert.equal(live(svg).length,0);
 }finally{setGraphicsQuality('medium');}
});

test('explosion lights are pooled, disappear when spent, and rebuild visibility when a cover is destroyed',()=>{
 setGraphicsQuality('ultra');try{const {e,svg,r}=eventScene(),index=e.levelData.solids.findIndex(c=>c.breakable),cover=e.levelData.solids[index];assert.ok(index>=0);e.effects.burst('blast',cover.x-20,cover.y+cover.h/2,110);r.paint(e,0);const slot=live(svg)[0],clip=slot.querySelector('[data-ultra-event-clip]'),before=clip.getAttribute('d');e.dungeon.destroyed[index]=true;e.dungeon.geometryRevision++;r.paint(e,0);assert.notEqual(clip.getAttribute('d'),before);
  resetSvgMetrics();for(let i=0;i<60;i++)r.paint(e,0);assert.equal(svgMetrics.writes,0);assert.equal(svgMetrics.created,0);
  for(let i=0;i<30;i++)e.effects.burst('blast',e.player.x+i%3,e.player.y,60);resetSvgMetrics();r.paint(e,0);assert.ok(live(svg).length<=6);assert.equal(svgMetrics.created,0);e.effects.reset();r.paint(e,0);assert.equal(live(svg).length,0);
 }finally{setGraphicsQuality('medium');}
});

test('every lamp corona follows its ground light and all moving water stays beyond the river bank',()=>{
 setGraphicsQuality('ultra');try{const e=new NeighborhoodEngine(defaultNeighborhoodProgress(),{change(){},progress(){},home(){},run(){},sound(){}}),svg=parseAdventureSvg(render(h(NeighborhoodScene,{night:true,prefix:'coronas'}))),r=new NeighborhoodRenderer(svg,true,true);r.paint(e,true);
  assert.equal(svg.querySelectorAll('[data-ultra-lamp-corona]').length,NEIGHBORHOOD_LAMPS.length);
  for(const steps of [0,7]){e.progress.missions.lights.steps=steps;r.paint(e,true);for(const l of NEIGHBORHOOD_LAMPS){const display=svg.querySelector(`[data-lamp-glow="${l.id}"]`).getAttribute('display');assert.equal(svg.querySelector(`[data-ultra-lamp-corona="${l.id}"]`).getAttribute('display'),display);const reflection=svg.querySelector(`[data-ultra-lamp-reflection="${l.id}"]`);if(reflection)assert.equal(reflection.getAttribute('display'),display);}}
  const water=svg.querySelector('[data-ultra-water-radiance]');assert.ok(water);for(const n of water.querySelectorAll('[data-ultra-air-patch]'))assert.ok(+n.getAttribute('data-air-y')>=1715);
  resetSvgMetrics();for(let i=0;i<60;i++)r.paint(e,true);assert.equal(svgMetrics.created,0);assert.equal(svgMetrics.writes,0);
 }finally{setGraphicsQuality('medium');}
});
