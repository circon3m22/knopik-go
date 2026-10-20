import './helpers/tsx-loader.mjs';
import test from 'node:test';import assert from 'node:assert/strict';import React from 'react';import {renderToStaticMarkup as render} from 'react-dom/server';
import {CITY_LIFE_ACTORS,cityLifePose} from '../app/neighborhood-city-life.ts';
import {NeighborhoodEngine} from '../app/neighborhood-engine.ts';
import {NeighborhoodCrowd} from '../app/neighborhood-crowd.ts';
import {defaultNeighborhoodProgress} from '../app/neighborhood-progress.ts';
import {setGraphicsQuality} from '../app/graphics-quality.ts';
import {parseAdventureSvg} from './helpers/adventure-svg-dom.mjs';
import {resetSvgMetrics,svgMetrics} from './helpers/runner-svg-dom.mjs';
const {NeighborhoodScene,NeighborhoodRenderer}=await import('../app/neighborhood-artwork.tsx');
const {CityLifeArtwork}=await import('../app/neighborhood-city-life-art.tsx');
const {streetPalette}=await import('../app/neighborhood-props.tsx');
const game=()=>new NeighborhoodEngine(defaultNeighborhoodProgress(),{change(){},progress(){},home(){},run(){},sound(){}});
const tick=(e,n)=>{for(let i=0;i<n;i++)e.advance(1/60);};
function scene(reduced=false){const e=game();Object.assign(e.player,{x:650,y:800});const svg=parseAdventureSvg(render(React.createElement(NeighborhoodScene,{night:false,prefix:'alive'}))),r=new NeighborhoodRenderer(svg,false,reduced);r.resize(480,520);r.paint(e,true);return {e,svg,r};}

test('ambient fauna stays bounded and river traffic never enters the walkable shore',()=>{
 const ids=new Set(CITY_LIFE_ACTORS.map(a=>a.id));assert.equal(ids.size,CITY_LIFE_ACTORS.length);assert.ok(ids.size<50);
 for(const a of CITY_LIFE_ACTORS)for(let time=0;time<240;time+=.31){const p=cityLifePose(a,time,{x:620,y:780});assert.ok(Object.values(p).every(Number.isFinite));assert.ok(p.alpha>=0&&p.alpha<=1);if(a.kind==='boat'||a.kind==='duck'){assert.ok(p.y>1815&&p.y<2017);assert.ok(p.x>0&&p.x<4800);}}
 const bird=CITY_LIFE_ACTORS.find(a=>a.kind==='pigeon'),near=cityLifePose(bird,0,{x:bird.x+10,y:bird.y});assert.ok(near.lift>20);assert.equal(cityLifePose(bird,0,{x:-1000,y:-1000}).lift,0);
});

test('reduced motion freezes all ambient poses and the low tier adds no ambient art',()=>{
 for(const a of CITY_LIFE_ACTORS)assert.deepEqual(cityLifePose(a,5,{x:600,y:750},true),cityLifePose(a,400,{x:600,y:750},true));
 try{setGraphicsQuality('low');assert.equal(render(React.createElement(CityLifeArtwork,{p:streetPalette(false)})),'');setGraphicsQuality('medium');const medium=render(React.createElement(CityLifeArtwork,{p:streetPalette(false)}));setGraphicsQuality('ultra');const ultra=render(React.createElement(CityLifeArtwork,{p:streetPalette(true)}));assert.ok(ultra.length>medium.length);assert.doesNotMatch(medium+ultra,/<(?:image|filter|animate|linearGradient|radialGradient)\b/);}finally{setGraphicsQuality('medium');}
});

test('visible birds move, distant boats receive no pose writes and frame updates reuse every node',()=>{
 setGraphicsQuality('high');try{
  const {e,svg,r}=scene(),bird=svg.querySelector('[data-city-life="pigeon-0"]'),boat=svg.querySelector('[data-city-life="river-skiff"]');assert.equal(bird.getAttribute('display'),'inline');assert.equal(boat.getAttribute('display'),'none');const before=bird.getAttribute('transform'),hidden=boat.querySelector('[data-life-body]').getAttribute('transform'),progress=JSON.stringify(e.progress);
  resetSvgMetrics();for(let i=0;i<180;i++){e.advance(1/60);r.paint(e,true);const nodes=svg.querySelector('[data-depth-layer]').children;for(let j=1;j<nodes.length;j++)assert.ok(+nodes[j-1].getAttribute('data-depth')<=+nodes[j].getAttribute('data-depth'));}
  assert.equal(svgMetrics.created,0);assert.notEqual(bird.getAttribute('transform'),before);assert.equal(boat.querySelector('[data-life-body]').getAttribute('transform'),hidden);assert.equal(JSON.stringify(e.progress),progress);
  e.pause();r.paint(e,true);resetSvgMetrics();for(let i=0;i<90;i++){e.advance(1/60);r.paint(e,true);}assert.equal(svgMetrics.writes,0);assert.equal(svgMetrics.moves,0);
 }finally{setGraphicsQuality('medium');}
});

test('ambient rendering works after leaving a distant district and reduced motion never animates the wind',()=>{
 setGraphicsQuality('ultra');try{
  const {e,svg,r}=scene(true);Object.assign(e.player,{x:2800,y:1670});r.paint(e,true);const boat=svg.querySelector('[data-city-life="river-skiff"]');assert.equal(boat.getAttribute('display'),'inline');const before=boat.getAttribute('transform');tick(e,120);r.paint(e,true);assert.equal(boat.getAttribute('transform'),before);for(const crown of svg.querySelectorAll('[data-tree-crown]'))assert.ok(!crown.getAttribute('transform'));
  Object.assign(e.player,{x:650,y:800});r.paint(e,true);assert.equal(boat.getAttribute('display'),'none');Object.assign(e.player,{x:2800,y:1670});r.paint(e,true);assert.equal(boat.getAttribute('display'),'inline');
 }finally{setGraphicsQuality('medium');}
});

test('pedestrians yield without leaving their route and resume when the path is clear',()=>{
 const c=new NeighborhoodCrowd(),r=c.residents.find(r=>r.id==='street-neighbor');Object.assign(r,{x:600,y:785,waypoint:1,rest:0});const before=r.walkDistance;
 for(let i=0;i<90;i++)c.step(1/60,{x:620,y:785},()=>true);assert.equal(r.x,600);assert.equal(r.moving,false);assert.equal(r.activity,'wait');assert.equal(r.walkDistance,before);
 c.step(1/60,{x:620,y:900},()=>true);assert.ok(r.x>600);assert.equal(r.activity,undefined);assert.equal(r.y,785);
});

test('readers and joggers pause for their own activities and return to walking',()=>{
 for(const[id,activity]of[['street-reader','read'],['park-jogger','stretch']]){
  const c=new NeighborhoodCrowd(),r=c.residents.find(r=>r.id===id),last=r.route.path.length-1,end=r.route.path[last];Object.assign(r,{x:end[0],y:end[1],waypoint:last,direction:1,rest:0});c.step(1/60,{x:-1000,y:-1000},()=>true);assert.equal(r.activity,activity);assert.equal(r.moving,false);
  for(let i=0;i<240;i++)c.step(1/60,{x:-1000,y:-1000},()=>true);assert.equal(r.activity,undefined);assert.equal(r.moving,true);
 }
});

test('a reading pose immediately shows and hides its book without waiting for another animation frame',()=>{
 setGraphicsQuality('medium');const {e,svg,r}=scene();const reader=e.crowd.residents.find(p=>p.id==='street-reader');Object.assign(reader,{x:650,y:800,moving:false,activity:'read'});r.paint(e,true);const book=svg.querySelector('[data-resident="street-reader"]').querySelector('[data-resident-reading]');assert.equal(book.getAttribute('display'),'inline');reader.activity=undefined;r.paint(e,true);assert.equal(book.getAttribute('display'),'none');
});
