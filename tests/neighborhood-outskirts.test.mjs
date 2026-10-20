import './helpers/tsx-loader.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup as render} from 'react-dom/server';
import {NeighborhoodEngine} from '../app/neighborhood-engine.ts';
import {defaultNeighborhoodProgress} from '../app/neighborhood-progress.ts';
import {NEIGHBORHOOD_BOUNDS,NEIGHBORHOOD_BUILDINGS,NEIGHBORHOOD_OBJECTS,NEIGHBORHOOD_POINTS} from '../app/neighborhood-map.ts';
const {CITY_OUTSKIRTS,CITY_SCENERY_BOUNDS,cityCameraTarget}=await import('../app/neighborhood-outskirts.tsx');
const {EUROPEAN_HOUSE_HEIGHT,CityBuilding}=await import('../app/neighborhood-city-props.tsx');
const {CityGrassPattern,CityMeadows}=await import('../app/neighborhood-meadows.tsx');
const {LowStreetProp}=await import('../app/quality-world-art.tsx');
import {GRAPHICS_QUALITIES,setGraphicsQuality} from '../app/graphics-quality.ts';
const {streetPalette}=await import('../app/neighborhood-props.tsx');
const {NeighborhoodScene,NeighborhoodRenderer}=await import('../app/neighborhood-artwork.tsx');
import {parseAdventureSvg} from './helpers/adventure-svg-dom.mjs';
import {resetSvgMetrics,svgMetrics} from './helpers/runner-svg-dom.mjs';
const game=()=>new NeighborhoodEngine(defaultNeighborhoodProgress(),{change(){},progress(){},home(){},run(){},sound(){}});

test('the surrounding quarter uses real three-storey art without becoming a playable extension',()=>{
 assert.deepEqual(NEIGHBORHOOD_BOUNDS,{x:0,y:0,w:4800,h:2050});
 const houses=CITY_OUTSKIRTS.filter(o=>o.kind==='house');assert.equal(houses.length,34);
 const e=game();
 for(const o of CITY_OUTSKIRTS){assert.ok(!NEIGHBORHOOD_OBJECTS.some(p=>p.id===o.id));assert.ok(!NEIGHBORHOOD_POINTS.some(p=>p.id===o.id));}
 for(const o of [...NEIGHBORHOOD_BUILDINGS,...houses]){
  assert.equal(o.floors,3);assert.ok(o.w>=250&&o.w<=350);assert.ok(EUROPEAN_HOUSE_HEIGHT/o.w>1.2);
  const art=render(React.createElement(CityBuilding,{object:o,p:streetPalette(false),detail:4}));
  assert.match(art,/data-floor-count="3"/);assert.match(art,/data-window-count="8"/);
  assert.doesNotMatch(art,/<(?:image|filter|linearGradient|radialGradient)\b/);
  assert.equal(render(React.createElement(LowStreetProp,{object:o,p:streetPalette(false)})),render(React.createElement(CityBuilding,{object:o,p:streetPalette(false),detail:0})));
 }
 for(const o of houses){
  assert.ok(o.x+o.w<0||o.x>=4800||o.y<175||o.y-o.h>1815,o.id+' remains beyond the playable edge');
  assert.equal(e.canStand(o.x+o.w/2,o.y),false,o.id);
 }
});

test('walking and rolling toward every edge still stop within the original playable area',()=>{
 for(const[x,y,dx,dy]of[[60,900,-1,0],[4740,900,1,0],[1650,200,0,-1],[4000,1760,0,1]]){
  const e=game();Object.assign(e.player,{x,y});assert.ok(e.canStand(x,y));e.setInput(dx,dy);
  for(let i=0;i<360;i++){if(i%45===0)e.dodge();e.advance(1/60);assert.ok(e.canStand(e.player.x,e.player.y));}
  assert.ok(e.player.x>=38&&e.player.x<=4762);assert.ok(e.player.y>=188&&e.player.y<=1802);
 }
});

test('edge camera exposes neighboring scenery while its whole viewport retains ground coverage',()=>{
 const b=CITY_SCENERY_BOUNDS;
 for(const height of[220,520,880])for(const player of[{x:38,y:188},{x:4762,y:900},{x:4000,y:1802}]){
  const c=cityCameraTarget(player,480,height);
  assert.ok(c.x>=b.x&&c.x+480<=b.x+b.w);assert.ok(c.y>=b.y*.82&&c.y+height<=(b.y+b.h)*.82);
  if(player.x===38)assert.ok(c.x<0);if(player.x===4762)assert.ok(c.x+480>4800);
 }
});

test('background buildings cull with the main depth layer and idle frames do no extra DOM work',()=>{
 setGraphicsQuality('ultra');try{
  const e=game(),svg=parseAdventureSvg(render(React.createElement(NeighborhoodScene,{night:false,prefix:'beyond'}))),renderer=new NeighborhoodRenderer(svg,false,true);renderer.resize(390,740);renderer.paint(e,true);
  assert.equal(svg.querySelector('[data-city-backdrop="beyond-east-home"]').getAttribute('display'),'none');
  Object.assign(e.player,{x:4755,y:690});renderer.paint(e,true);
  assert.equal(svg.querySelector('[data-city-backdrop="beyond-east-home"]').getAttribute('display'),'inline');
  assert.equal(svg.querySelector('[data-city-backdrop="beyond-west"]').getAttribute('display'),'none');
  const layer=svg.querySelector('[data-depth-layer]');for(let i=1;i<layer.children.length;i++)assert.ok(+layer.children[i-1].getAttribute('data-depth')<=+layer.children[i].getAttribute('data-depth'));
  resetSvgMetrics();for(let i=0;i<90;i++)renderer.paint(e,true);assert.equal(svgMetrics.created,0);assert.equal(svgMetrics.writes,0);assert.equal(svgMetrics.moves,0);
 }finally{setGraphicsQuality('medium');}
});

test('all qualities have opaque pixel turf and higher qualities add batched foliage rather than filters',()=>{
 try{let previous=0;for(const{id}of GRAPHICS_QUALITIES){
  setGraphicsQuality(id);const p=streetPalette(false),pattern=render(React.createElement(CityGrassPattern,{p,prefix:'grass'})),meadows=render(React.createElement(CityMeadows,{p}));
  assert.match(pattern,/<rect width="224" height="176" fill="#[a-f0-9]+"/);assert.doesNotMatch(pattern+meadows,/<(?:image|filter|animate|linearGradient|radialGradient)\b/);
  assert.ok(pattern.length>previous);previous=pattern.length;
  if(id==='low')assert.equal(meadows,'');else{const plots=parseAdventureSvg(meadows).querySelectorAll('[data-meadow-plot]');assert.equal(plots.length,13);for(const plot of plots)assert.equal(plot.children.length,4);}
 }}finally{setGraphicsQuality('medium');}
});
