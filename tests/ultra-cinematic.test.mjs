import './helpers/tsx-loader.mjs';
import test from 'node:test';import assert from 'node:assert/strict';import {createElement as h} from 'react';import {renderToStaticMarkup as render} from 'react-dom/server';import sharp from 'sharp';
import {actorRadiance} from '../app/ultra-actor-light.ts';import {areaLightOpacity,lightVisibility,lightPolygon} from '../app/ultra-light-geometry.ts';
import {setGraphicsQuality} from '../app/graphics-quality.ts';import {parseAdventureSvg} from './helpers/adventure-svg-dom.mjs';import {resetSvgMetrics,svgMetrics} from './helpers/runner-svg-dom.mjs';import {dungeonGame} from './helpers/dungeon-fixtures.mjs';
import {CoopEngine} from '../app/coop-engine.ts';import {firearmMuzzle} from '../app/dungeon-aim.ts';
import {NeighborhoodEngine} from '../app/neighborhood-engine.ts';import {defaultNeighborhoodProgress} from '../app/neighborhood-progress.ts';
const {UltraActorLightRenderer}=await import('../app/ultra-actor-renderer.ts');const {UltraActorLightDefs}=await import('../app/ultra-actor-art.tsx');const {UltraAreaWash}=await import('../app/ultra-area-light-art.tsx');const {AnimatedAdventureKnopik}=await import('../app/knopik-adventure-art.tsx');
const {AdventureScene,AdventureRenderer}=await import('../app/adventure-artwork.tsx');const {NeighborhoodScene,NeighborhoodRenderer}=await import('../app/neighborhood-artwork.tsx');
const lamp={x:-70,y:-60,height:80,radius:260,color:'#ffbc79',strength:.7},point={x:0,y:0};
const diagonal=s=>s.matrix.split(' ').map(Number).filter((_,i)=>[0,6,12].includes(i));
const serialize=n=>`<${n.tag}${[...n.attrs].filter(([k])=>!k.startsWith('style:')).map(([k,v])=>` ${k}="${String(v).replaceAll('&','&amp;').replaceAll('"','&quot;')}"`).join('')}>${n.textContent}${n.children.map(serialize).join('')}</${n.tag}>`;
function apply(svg,sample){svg.querySelector('[data-ultra-actor-matrix]').setAttribute('values',sample.matrix);const rim=svg.querySelector('[data-ultra-actor-rim]'),offset=svg.querySelector('[data-ultra-actor-offset]');rim.setAttribute('flood-color',sample.color);rim.setAttribute('flood-opacity',sample.opacity);offset.setAttribute('dx',sample.dx);offset.setAttribute('dy',sample.dy);}

test('actor lighting has source color, direction, occlusion, falloff, bounded exposure and no rim on a fallen actor',()=>{
 const lit=actorRadiance(point,[lamp],[],true),dark=actorRadiance(point,[lamp],[{x:-45,y:-60,w:10,h:60}],true),far=actorRadiance({x:200,y:0},[lamp],[],true);
 assert.ok(diagonal(lit)[0]>diagonal(dark)[0]);assert.equal(lit.dx,'2');assert.equal(lit.dy,'2');assert.equal(lit.color,lamp.color);assert.equal(dark.opacity,'0.000');assert.equal(far.opacity,'0.000');
 assert.equal(actorRadiance(point,[lamp],[],true,false,true).opacity,'0.000');
 for(const s of [lit,dark,far,actorRadiance(lamp,[lamp],[],true),actorRadiance(point,[{...lamp,strength:50}],[],false)]){assert.doesNotMatch(JSON.stringify(s),/NaN|Infinity/);assert.ok(diagonal(s).every(v=>v>=.48&&v<=1.18));}
 assert.ok(diagonal(actorRadiance(point,[],[],false,true))[0]>diagonal(actorRadiance(point,[],[{x:-60,y:-40,w:40,h:40}],false,true))[0]);
});

test('native character-local shading keeps the alpha silhouette and visibly separates warm and cool light',async()=>{
 const outputs=[];
 for(const l of [lamp,{...lamp,x:70,color:'#86cfff'}]){
  const source=render(h('svg',{xmlns:'http://www.w3.org/2000/svg',width:144,height:144,viewBox:'-72 -112 144 144'},h('defs',{},h(UltraActorLightDefs,{prefix:'sprite'})),h('g',{filter:'url(#sprite-actor-surface-0)'},h(AnimatedAdventureKnopik)))),svg=parseAdventureSvg(source);apply(svg,actorRadiance(point,[l],[],true));
  const {data,info}=await sharp(Buffer.from(serialize(svg))).ensureAlpha().raw().toBuffer({resolveWithObject:true});const totals=[0,0,0],alpha=[];for(let i=0;i<data.length;i+=info.channels){for(let c=0;c<3;c++)totals[c]+=data[i+c];alpha.push(data[i+3]);}outputs.push({totals,alpha});
 }
 assert.ok(outputs[0].totals[0]>outputs[1].totals[0]);assert.ok(outputs[1].totals[2]>outputs[0].totals[2]);assert.deepEqual(outputs[0].alpha,outputs[1].alpha);
});

test('area samples preserve light energy and produce a penumbra beyond a hard blocker',async()=>{
 for(const alpha of [.01,.22,.36,.7,.98]){const composed=1-[.56,.22,.22].reduce((v,w)=>v*(1-areaLightOpacity(alpha,w)),1);assert.ok(Math.abs(composed-alpha)<1e-12);}
 const room={x:0,y:0,w:250,h:200},light={x:90,y:25,radius:230,color:'#ffffff',strength:.7,aperture:40},casters=[{x:120,y:60,w:20,h:70}],images=[];
 for(const area of [false,true]){
  const prefix='area',shape=lightPolygon(lightVisibility(light,room,casters));
  const source=render(h('svg',{xmlns:'http://www.w3.org/2000/svg',width:250,height:200},h('rect',{width:250,height:200,fill:'#000'}),h('defs',{},h('clipPath',{id:'central'},h('path',{d:shape})),h('radialGradient',{id:prefix+'-falloff'},...[0,.22,.6,1].map((offset,i)=>h('stop',{key:i,offset,stopColor:light.color,stopOpacity:areaLightOpacity(light.strength*[1,.75,.22,0][i],area?.56:1)})))),area&&h(UltraAreaWash,{prefix,light,room,casters}),h('circle',{cx:light.x,cy:light.y,r:light.radius,fill:'url(#area-falloff)',clipPath:'url(#central)'})));
  images.push(await sharp(Buffer.from(source)).removeAlpha().raw().toBuffer());
 }
 let softened=0;for(let y=140;y<190;y++)for(let x=140;x<250;x++){const i=(y*250+x)*3;if(images[0][i]===0&&images[1][i]>1&&images[1][i]<100)softened++;}assert.ok(softened>30,`penumbra pixels: ${softened}`);
});

function actorFixture(){const e=dungeonGame(12),svg=parseAdventureSvg(render(h('svg',{},h('defs',{},h(UltraActorLightDefs,{prefix:'model',partner:true}))))),r=new UltraActorLightRenderer(svg);return {e,svg,r};}
test('character sampling is bounded to 12 Hz, freezes on pause and reacts to geometry changes without new nodes',()=>{
 const {e,svg,r}=actorFixture(),room=e.levelData.rooms[0];Object.assign(e.player,{x:room.x+90,y:room.y+100});r.paintAdventure(e,0);
 resetSvgMetrics();for(let n=1;n<=60;n++){e.time=n/60;e.player.x+=.9;r.paintAdventure(e,0);}assert.equal(svgMetrics.created,0);assert.ok(svgMetrics.writes<=72,JSON.stringify(svgMetrics));
 resetSvgMetrics();for(let n=0;n<60;n++)r.paintAdventure(e,0);assert.equal(svgMetrics.writes,0);
 const stub={area:'sewer',level:1,levelData:{rooms:[{x:0,y:0,w:280,h:200}],floors:[{x:0,y:0,w:280,h:200}],bounds:{x:0,w:280},height:200,solids:[{x:55,y:0,w:10,h:200}],palette:{accent:'#ff9966'}},dungeon:{geometryRevision:0,destroyed:[false]},time:1,player:{x:90,y:100,hp:3},effects:{pool:[]},weapon:'paw',punchTime:0};
 r.paintAdventure(stub,0);const before=svg.querySelector('[data-ultra-actor-matrix]').getAttribute('values');stub.dungeon.destroyed[0]=true;stub.dungeon.geometryRevision++;r.paintAdventure(stub,0);assert.notEqual(svg.querySelector('[data-ultra-actor-matrix]').getAttribute('values'),before);
});

test('muzzle light reaches the character, fades and respects reduced motion and the crossbow',()=>{
 const {e,svg,r}=actorFixture();const angle=[0,Math.PI/2,Math.PI,-Math.PI/2].find(a=>!firearmMuzzle(e,a).blocked);assert.notEqual(angle,undefined);e.weapon='pistol';e.punchTime=0;r.paintAdventure(e,angle);const baseline=svg.querySelector('[data-ultra-actor-matrix]').getAttribute('values');
 e.punchTime=.2;e.punchSerial=5;r.paintAdventure(e,angle);assert.notEqual(svg.querySelector('[data-ultra-actor-matrix]').getAttribute('values'),baseline);r.paintAdventure(e,angle,true);assert.equal(svg.querySelector('[data-ultra-actor-matrix]').getAttribute('values'),baseline);e.weapon='crossbow';r.paintAdventure(e,angle);assert.equal(svg.querySelector('[data-ultra-actor-matrix]').getAttribute('values'),baseline);
});

test('co-op has independent shaders and reviving a teammate restores both upright pose and rim immediately',()=>{
 setGraphicsQuality('ultra');try{const e=new CoopEngine(123),svg=parseAdventureSvg(render(h(AdventureScene,{layout:e.levelData,area:'sewer',coop:{slot:0,self:'Self',partner:'Friend'}}))),r=new AdventureRenderer(svg,true),partner=e.actors[1].player;
  const paint=()=>e.forPlayer(0,()=>r.paint(e,true,e.companion(1)));paint();assert.equal(svg.querySelectorAll('[data-ultra-actor-shader]').length,2);assert.match(svg.querySelector('[data-player-body]').getAttribute('filter'),/actor-surface-0/);assert.match(svg.querySelector('[data-coop-partner-body]').getAttribute('filter'),/actor-surface-1/);
  const local=svg.querySelectorAll('[data-ultra-actor-matrix]')[0].getAttribute('values');partner.hp=0;paint();assert.match(svg.querySelector('[data-coop-partner-body]').getAttribute('transform'),/rotate\(90\)/);assert.equal(svg.querySelectorAll('[data-ultra-actor-rim]')[1].getAttribute('flood-opacity'),'0.000');
  partner.hp=2;paint();assert.equal(svg.querySelector('[data-coop-partner-body]').getAttribute('transform'),'translate(0 0)');assert.equal(svg.querySelectorAll('[data-ultra-actor-matrix]')[0].getAttribute('values'),local);assert.ok(+svg.querySelectorAll('[data-ultra-actor-rim]')[1].getAttribute('flood-opacity')>0);
 }finally{setGraphicsQuality('medium');}
});

test('every campaign has fixed area fixtures and bounded shaders while all four lower modes create none',()=>{
 setGraphicsQuality('ultra');try{for(let level=1;level<=35;level++){const e=dungeonGame(level),source=render(h(AdventureScene,{area:'sewer',level,layout:e.levelData})),svg=parseAdventureSvg(source);assert.equal(svg.querySelectorAll('[data-ultra-actor-shader]').length,1);assert.equal(svg.querySelectorAll('[data-ultra-area-wash]').length,e.levelData.rooms.length*2);assert.equal(svg.querySelectorAll('[data-ultra-ceiling-wash]').length,e.levelData.rooms.length);assert.doesNotMatch(source,/NaN|Infinity|<feGaussianBlur\b/);}}
 finally{setGraphicsQuality('medium');}
 for(const quality of ['low','medium','high','very-high']){setGraphicsQuality(quality);const svg=parseAdventureSvg(render(h(AdventureScene,{area:'apartment',theme:'night'}))),r=new UltraActorLightRenderer(svg);assert.equal(r.enabled,false);assert.doesNotMatch(render(h(NeighborhoodScene,{night:true,prefix:'lower'})),/data-ultra-actor-shader|cinematic-5/);}setGraphicsQuality('medium');
});

test('street actor light follows real lamp switches, new water stays within culled river chunks and pause writes nothing',()=>{
 setGraphicsQuality('ultra');try{const progress=defaultNeighborhoodProgress(),e=new NeighborhoodEngine(progress,{change(){},progress(){},home(){},run(){},sound(){}});Object.assign(e.player,{x:650,y:700});const svg=parseAdventureSvg(render(h(NeighborhoodScene,{night:true,prefix:'cinema'}))),r=new NeighborhoodRenderer(svg,true,true);r.paint(e,true);const before=svg.querySelector('[data-ultra-actor-matrix]').getAttribute('values');e.progress.missions.lights.steps=7;r.paint(e,true);assert.notEqual(svg.querySelector('[data-ultra-actor-matrix]').getAttribute('values'),before);
  for(const node of svg.querySelectorAll('[data-ultra-water-fresnel]'))assert.ok(+node.getAttribute('cy')-+node.getAttribute('ry')>=1715);for(const node of svg.querySelectorAll('[data-ultra-water-ribbon]'))assert.ok(node.parent.getAttribute('data-ultra-air-patch')!==null);
  resetSvgMetrics();for(let n=0;n<60;n++)r.paint(e,true);assert.equal(svgMetrics.created,0);assert.equal(svgMetrics.writes,0);
 }finally{setGraphicsQuality('medium');}
});
