import './helpers/tsx-loader.mjs';
import test from 'node:test';import assert from 'node:assert/strict';
import {createElement as h} from 'react';import {renderToStaticMarkup as render} from 'react-dom/server';import sharp from 'sharp';
import {lightFloorExit,lightVisibility} from '../app/ultra-light-geometry.ts';
import {actorRadiance} from '../app/ultra-actor-light.ts';
import {setGraphicsQuality} from '../app/graphics-quality.ts';
import {dungeonGame} from './helpers/dungeon-fixtures.mjs';
import {parseAdventureSvg} from './helpers/adventure-svg-dom.mjs';
const {UltraRoomLighting}=await import('../app/ultra-room-lighting.tsx');
const {UltraEventLightArt}=await import('../app/ultra-event-light-art.tsx');
const {UltraEventLightRenderer}=await import('../app/ultra-event-light-renderer.ts');
const {AdventureScene,AdventureRenderer}=await import('../app/adventure-artwork.tsx');
const rooms=[{x:0,y:0,w:100,h:100},{x:160,y:0,w:100,h:100}],corridor={x:80,y:40,w:100,h:20},floors=[...rooms,corridor],light={x:90,y:50,radius:200,color:'#ffe0a0',strength:.85};

test('rays cross connected thresholds and stop at walls, disconnected rooms and corridor obstacles',()=>{
 assert.equal(lightFloorExit(light,1,0,floors,200),170);
 assert.equal(lightFloorExit(light,1,0,[...floors].reverse(),200),170);
 assert.equal(lightFloorExit(light,1,0,rooms,200),10);
 assert.equal(lightFloorExit({...light,y:20},1,0,floors,200),10);
 assert.equal(lightFloorExit(light,-1,0,floors,200),90);
 assert.equal(lightFloorExit(light,1,0,floors,40),40);
 const ray=lightVisibility(light,rooms[0],[],floors).find(p=>Math.abs(p.y-50)<.1&&p.x>90);assert.equal(ray.x,260);
 const blocked=lightVisibility(light,rooms[0],[{x:125,y:40,w:10,h:20}],floors);assert.ok(blocked.every(p=>p.x<=125.1));
});

test('native lighting remains continuous at both thresholds without leaking onto the corridor walls',async()=>{
 const images=[];
 for(const connected of [false,true]){
  const source=render(h('svg',{xmlns:'http://www.w3.org/2000/svg',width:270,height:100},h('rect',{width:270,height:100,fill:'#263540'}),h(UltraRoomLighting,{prefix:'joined',rooms,lights:[{...light,x:60}],casters:[],floors:connected?floors:undefined})));
  images.push(await sharp(Buffer.from(source)).removeAlpha().raw().toBuffer());
 }
 const value=(image,x,y)=>image[(y*270+x)*3],joined=images[1];
 assert.ok(value(joined,108,50)>value(images[0],108,50)+20);
 assert.ok(value(joined,170,50)>value(images[0],170,50)+10);
 assert.ok(Math.abs(value(joined,98,50)-value(joined,102,50))<12,`${value(joined,98,50)}/${value(joined,102,50)}`);
 assert.ok(Math.abs(value(joined,158,50)-value(joined,162,50))<12,`${value(joined,158,50)}/${value(joined,162,50)}`);
 assert.equal(value(joined,125,20),value(images[0],125,20));
});

test('actor colour changes smoothly through the portal and rejects a light behind the neighbouring wall',()=>{
 const sample=(x,y,domain=floors)=>actorRadiance({x,y},[light],[],false,false,false,domain),channels=v=>v.matrix.split(' ').map(Number);
 const a=channels(sample(98,50)),b=channels(sample(102,50));for(const i of [0,6,12])assert.ok(Math.abs(a[i]-b[i])<.03);
 const ambient=actorRadiance({x:180,y:20},[],[],false);
 assert.deepEqual(sample(180,20),ambient);assert.notEqual(sample(180,50).matrix,ambient.matrix);
 assert.notEqual(actorRadiance({x:180,y:20},[light],[],false).matrix,ambient.matrix);
});

test('flash visibility reaches through a doorway and recomputes when a blocking object is added',()=>{
 setGraphicsQuality('ultra');try{
 const svg=parseAdventureSvg(render(h('svg',{},h(UltraEventLightArt,{prefix:'portal-flash'})))),renderer=new UltraEventLightRenderer(svg);
 const e={area:'sewer',level:1,weapon:'fist',levelData:{floors,solids:[]},dungeon:{geometryRevision:0,destroyed:[]},effects:{pool:[{active:true,kind:'blast',x:90,y:50,radius:110,age:0,seed:1}],links:[]}};
 renderer.paint(e,0);const clip=svg.querySelector('[data-ultra-event-clip]'),points=()=>[...clip.getAttribute('d').matchAll(/(?:M|L)([-\d.]+) ([-\d.]+)/g)].map(m=>({x:+m[1],y:+m[2]}));
 assert.ok(points().some(p=>p.x>160));e.levelData.solids.push({x:125,y:40,w:10,h:20});e.dungeon.geometryRevision++;renderer.paint(e,0);assert.ok(points().every(p=>p.x<=125.1));
 }finally{setGraphicsQuality('medium');}
});

test('every authored passage has continuous walkable light geometry in both directions',()=>{
 let checked=0;
 for(let level=1;level<=35;level++){
  const data=dungeonGame(level).levelData;
  for(const gate of data.gates)for(const index of [gate.from,gate.to]){
   const r=data.rooms[index],horizontal=gate.axis==='x',positive=horizontal?gate.x>r.x+r.w/2:gate.y>r.y+r.h/2;
   const p=horizontal?{x:positive?r.x+r.w-2:r.x+2,y:gate.y+gate.h/2}:{x:gate.x+gate.w/2,y:positive?r.y+r.h-2:r.y+2};
   const target=horizontal?Math.abs(gate.x+gate.w/2-p.x):Math.abs(gate.y+gate.h/2-p.y),reach=lightFloorExit(p,horizontal?positive?1:-1:0,horizontal?0:positive?1:-1,data.floors,1000);
   assert.ok(reach>target+4,`${level}/${gate.from}-${gate.to}/${index}: ${reach}/${target}`);checked++;
  }
 }
 assert.ok(checked>250);
});

test('changing the active room at a threshold keeps both connected light passes and the mist visible',()=>{
 setGraphicsQuality('ultra');try{for(const level of [2,7,12,17,22,27,32]){
  const e=dungeonGame(level),gate=e.levelData.gates[0];Object.assign(e.player,{x:gate.x+gate.w/2,y:gate.y+gate.h/2});
  const svg=parseAdventureSvg(render(h(AdventureScene,{area:'sewer',level,layout:e.levelData}))),r=new AdventureRenderer(svg,true);r.resize(390,700);
  let matrix;for(const active of [gate.from,gate.to]){e.room=active;r.paint(e,true);
   for(const room of [gate.from,gate.to])assert.equal(svg.querySelectorAll('[data-ultra-feature="indirect-light"]').find(n=>+n.getAttribute('data-room-detail')===room).getAttribute('display'),'inline');
   const current=svg.querySelector('[data-ultra-actor-matrix]').getAttribute('values');if(matrix)assert.equal(current,matrix);matrix=current;
   assert.ok(svg.querySelectorAll('[data-ultra-passage-haze]').some(n=>n.querySelector('[data-ultra-haze-patch]').getAttribute('display')==='inline'));
  }
 }}finally{setGraphicsQuality('medium');}
});
