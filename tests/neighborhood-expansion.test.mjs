import './helpers/tsx-loader.mjs';
import test from 'node:test';import assert from 'node:assert/strict';import React from 'react';import{renderToStaticMarkup as render}from'react-dom/server';
import {NeighborhoodEngine} from '../app/neighborhood-engine.ts';
import {NEIGHBORHOOD_BOUNDS,NEIGHBORHOOD_BUILDINGS,NEIGHBORHOOD_BOARDWALKS,NEIGHBORHOOD_SOLIDS,NEIGHBORHOOD_POINTS,NEIGHBORHOOD_OBJECTS} from '../app/neighborhood-map.ts';
import {defaultNeighborhoodProgress} from '../app/neighborhood-progress.ts';
import {GRAPHICS_QUALITIES,setGraphicsQuality} from '../app/graphics-quality.ts';
import {parseAdventureSvg} from './helpers/adventure-svg-dom.mjs';
import {svgMetrics,resetSvgMetrics} from './helpers/runner-svg-dom.mjs';
const {NeighborhoodScene,NeighborhoodRenderer}=await import('../app/neighborhood-artwork.tsx');
const {CityBuilding}=await import('../app/neighborhood-city-props.tsx');
const {streetPalette}=await import('../app/neighborhood-props.tsx');
const {DistrictMap,DistrictAtlas}=await import('../app/neighborhood-map-art.tsx');
const events={change(){},progress(){},home(){},run(){},sound(){}};
const game=()=>new NeighborhoodEngine(defaultNeighborhoodProgress(),events);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function naive(x,y,r){
 if(x<25+r||x>NEIGHBORHOOD_BOUNDS.w-25-r||y<175+r||y>NEIGHBORHOOD_BOUNDS.h-r)return false;
 if(y>1697-r&&!NEIGHBORHOOD_BOARDWALKS.some(d=>x>d.x+r&&x<d.x+d.w-r&&y<d.y+d.h-r))return false;
 return !NEIGHBORHOOD_SOLIDS.some(s=>Math.hypot(x-clamp(x,s.x,s.x+s.w),y-clamp(y,s.y,s.y+s.h))<r-.00001);
}

test('the district doubles its real area and new houses never overlap another building',()=>{
 assert.equal(NEIGHBORHOOD_BOUNDS.w*NEIGHBORHOOD_BOUNDS.h,2400*2050*2);
 assert.equal(NEIGHBORHOOD_BUILDINGS.length,15);assert.equal(NEIGHBORHOOD_BOARDWALKS.length,2);
 assert.equal(new Set(NEIGHBORHOOD_OBJECTS.map(o=>o.id)).size,NEIGHBORHOOD_OBJECTS.length);
 for(const a of NEIGHBORHOOD_BUILDINGS)for(const b of NEIGHBORHOOD_BUILDINGS){if(a===b)continue;assert.ok(a.x+a.w<=b.x||b.x+b.w<=a.x||a.y<=b.y-b.h||b.y<=a.y-a.h,`${a.id} overlaps ${b.id}`);}
});

test('indexed collision matches an independent complete scan at corners, both piers and 16000 points',()=>{
 const e=game();let seed=23379;const rnd=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/2**32);
 for(let i=0;i<16000;i++){const x=rnd()*4900-50,y=rnd()*2100,r=[0,5,11,13,27][i%5];assert.equal(e.canStand(x,y,r),naive(x,y,r),`${x}/${y}/${r}`);}
 for(const s of NEIGHBORHOOD_SOLIDS)for(const r of[11,13,24])for(const x of[s.x-r,s.x,s.x+s.w,s.x+s.w+r])for(const y of[s.y-r,s.y,s.y+s.h,s.y+s.h+r])assert.equal(e.canStand(x,y,r),naive(x,y,r));
 assert.equal(e.canStand(4000,1770),true);assert.equal(e.canStand(4000,1840),false);assert.equal(e.canStand(4200,1770),false);
});

function walk(e,target){
 const sx=Math.round(e.player.x/20)*20,sy=Math.round(e.player.y/20)*20,q=[[sx,sy]],parents=new Map([[sx+'/'+sy,null]]);let end;
 for(let i=0;i<q.length;i++){const[x,y]=q[i];if(Math.hypot(x-target.x,y-target.y)<22){end=q[i];break;}for(const[dx,dy]of[[20,0],[-20,0],[0,20],[0,-20]]){const nx=x+dx,ny=y+dy,key=nx+'/'+ny;if(!parents.has(key)&&e.canStand(nx,ny)&&e.canStand(x+dx/2,y+dy/2)){parents.set(key,q[i]);q.push([nx,ny]);}}}
 assert.ok(end,target.id+' reachable');const route=[];for(let p=end;p;p=parents.get(p[0]+'/'+p[1]))route.unshift(p);
 for(const[x,y]of route){let frames=0;while(Math.hypot(x-e.player.x,y-e.player.y)>1.7){assert.ok(frames++<80,target.id+' movement stuck');e.setInput(x-e.player.x,y-e.player.y);e.advance(1/60);assert.ok(e.canStand(e.player.x,e.player.y));}}
 e.clearInput();assert.ok(Math.hypot(e.player.x-target.x,e.player.y-target.y)<24);
}

test('a normal-input walk visits all new places, uses the second pier and returns home without losing progress',()=>{
 const e=game();e.progress.quest=3;e.progress.pebble=true;e.progress.missions.photos={status:1,steps:3};
 for(const id of ['bookseller','greenhouse','florist','square-clock','baker','east-bench','east-river','home']){
  const point=NEIGHBORHOOD_POINTS.find(p=>p.id===id);walk(e,point);assert.equal(e.nearestPoint()?.id,id);assert.ok(e.interact());e.closeDialogue();
 }
 assert.ok(e.walkDistance>9000);assert.equal(e.progress.quest,3);assert.equal(e.progress.pebble,true);assert.equal(e.progress.missions.photos.steps,3);
});

test('quality scales authored detail while every unique facade stays a small batch of layered paths',()=>{
 try{const counts={};for(const{id}of GRAPHICS_QUALITIES){setGraphicsQuality(id);const svg=render(React.createElement(NeighborhoodScene,{night:true,prefix:'quality'}));assert.doesNotMatch(svg,/NaN|undefined|<image\b/);counts[id]=(svg.match(/<(?:path|rect|ellipse)\b/g)||[]).length;}
 assert.ok(counts.low<counts.medium*.65,JSON.stringify(counts));assert.ok(counts.ultra>counts.medium);
 for(const b of NEIGHBORHOOD_BUILDINGS){const art=render(React.createElement(CityBuilding,{object:b,p:streetPalette(false),detail:4}));assert.ok((art.match(/<path\b/g)||[]).length<90);assert.ok(art.includes('data-window-count'));assert.doesNotMatch(art,/<(?:image|filter|linearGradient|radialGradient)\b/);}
 }finally{setGraphicsQuality('medium');}
});

test('the distant district and material chunks are hidden, depth remains sorted, and painting allocates no nodes',()=>{
 setGraphicsQuality('ultra');try{
  const e=game(),svg=parseAdventureSvg(render(React.createElement(NeighborhoodScene,{night:true,prefix:'culling'}))),renderer=new NeighborhoodRenderer(svg,true,true);renderer.resize(390,650);renderer.paint(e,true);
  assert.equal(svg.querySelector('[data-world-object="botanic-house"]').getAttribute('display'),'none');
  assert.ok(svg.querySelectorAll('[data-ground-chunk]').filter(n=>n.getAttribute('display')==='none').length>50);
  for(const house of NEIGHBORHOOD_BUILDINGS.filter(b=>b.x>=0)){
   const index=Math.floor(house.x/400)+Math.floor((house.y-180)/400)*12,chunk=svg.querySelector(`[data-material-chunk="${index}"]`);
   assert.ok(chunk);assert.ok(+chunk.getAttribute('data-x')<=house.x);assert.ok(+chunk.getAttribute('data-x')+(+chunk.getAttribute('data-w'))>=house.x+house.w+40,house.id+' shadow stays visible across chunk boundaries');
  }
  Object.assign(e.player,{x:4000,y:700});renderer.paint(e,true);assert.equal(svg.querySelector('[data-world-object="home"]').getAttribute('display'),'none');assert.equal(svg.querySelector('[data-world-object="botanic-house"]').getAttribute('display'),'inline');
  resetSvgMetrics();for(let i=0;i<120;i++){e.advance(1/60);renderer.paint(e,true);const nodes=svg.querySelector('[data-depth-layer]').children;for(let j=1;j<nodes.length;j++)assert.ok(+nodes[j-1].getAttribute('data-depth')<=+nodes[j].getAttribute('data-depth'));}
  assert.equal(svgMetrics.created,0);
  const [x,,w]=svg.getAttribute('viewBox').split(' ').map(Number);assert.ok(x>2400&&x+w<=4800);
  renderer.paint(e,true);resetSvgMetrics();for(let i=0;i<60;i++)renderer.paint(e,true);assert.equal(svgMetrics.writes,0,'a still scene must not rewrite attributes');assert.equal(svgMetrics.moves,0);
 }finally{setGraphicsQuality('medium');}
});

test('atlas overview and both readable halves preserve real world coordinates and landmarks',()=>{
 for(const sector of['all','west','east']){const source=render(React.createElement(DistrictMap,{night:false,sector,player:{x:4000,y:1700},goal:{x:3375,y:1120}})),svg=parseAdventureSvg(source);assert.equal(svg.querySelectorAll('[data-map-building]').length,15);assert.equal(svg.querySelectorAll('[data-map-landmark]').length,3);assert.equal(svg.querySelector('[data-map-player]').getAttribute('transform'),'translate(4000 1700)');assert.equal(svg.querySelector('[data-map-goal]').getAttribute('transform'),'translate(3375 1120)');assert.equal(svg.getAttribute('viewBox'),sector==='all'?'0 0 4800 2050':sector==='west'?'0 0 2400 2050':'2400 0 2400 2050');}
 const east=render(React.createElement(DistrictAtlas,{night:false,player:{x:4000,y:600},goal:null}));assert.match(east,/aria-pressed="true">Кленовый/);assert.ok(east.includes('viewBox="2400 0 2400 2050"'));
});
