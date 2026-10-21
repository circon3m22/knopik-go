import './helpers/tsx-loader.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {createElement as h} from 'react';
import {renderToStaticMarkup as render} from 'react-dom/server';
import {readFileSync} from 'node:fs';
import sharp from 'sharp';
import postcss from 'postcss';
import {pixelMaterialLayers,ultraMaterialCacheSize} from '../app/ultra-pixel-material.ts';
import {lightVisibilityPath} from '../app/ultra-light-geometry.ts';
import {ultraCombatPaths} from '../app/ultra-combat-fx.ts';
import {vaultCoinPose} from '../app/vault-coin-physics.ts';
import {setGraphicsQuality} from '../app/graphics-quality.ts';
import {ARCADE_CATALOG} from '../app/arcade-catalog.ts';
import {emptyBuffStock} from '../app/buff-shelf-engine.ts';
import {defaultLaboratory} from '../app/laboratory-engine.ts';
import {parseAdventureSvg} from './helpers/adventure-svg-dom.mjs';
import {SvgNode,runnerSvgScene,svgDocument,resetSvgMetrics,svgMetrics} from './helpers/runner-svg-dom.mjs';
import {dungeonGame} from './helpers/dungeon-fixtures.mjs';
const {UltraSceneRenderer}=await import('../app/ultra-scene-renderer.ts');
const {AdventureScene,AdventureRenderer}=await import('../app/adventure-artwork.tsx');
const {ArcadeLibrary}=await import('../app/arcade-library.tsx');
const {ArcadeGameCover}=await import('../app/arcade-game-cover.tsx');
const {knopikMotion}=await import('../app/knopik-adventure-animation.ts');
const read=name=>readFileSync(new URL('../app/'+name,import.meta.url),'utf8');
const palette={base:'#7e8c86',dark:'#354a50',light:'#d7d9ba',accent:'#a8b889'};

test('material tiles cover every pixel exactly once, have distinct relief and reuse bounded cached paths',()=>{
 const fingerprints=new Set();
 for(const kind of ['stone','brick','wood','metal','porcelain','crystal','moss','asphalt','plaster']){
  const layers=pixelMaterialLayers(kind,palette,3),pixels=new Uint8Array(4096);
  assert.equal(pixelMaterialLayers(kind,palette,3),layers);assert.ok(layers.length>1&&layers.length<=36);
  for(const layer of layers){assert.match(layer.fill,/^#[0-9a-f]{6}$/);for(const m of layer.d.matchAll(/M(\d+) (\d+)h(\d+)v1h-\d+Z/g))for(let x=+m[1];x<+m[1]+ +m[3];x++){assert.ok(x<64&&+m[2]<64);pixels[+m[2]*64+x]++;}}
  assert.ok(pixels.every(n=>n===1),kind+' has no transparent seams or overdraw');fingerprints.add(JSON.stringify(layers));
 }
 assert.equal(fingerprints.size,9);
 for(let i=0;i<60;i++)pixelMaterialLayers('stone',palette,i);
 assert.ok(ultraMaterialCacheSize()<=48);
});

test('light actually stops at an obstacle and reaches the background again after removal',async()=>{
 const room={x:0,y:0,w:200,h:200},light={x:30,y:100,radius:180},box={x:70,y:70,w:25,h:60};
 const raster=async boxes=>sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><path d="${lightVisibilityPath(light,room,boxes)}" fill="white"/></svg>`)).ensureAlpha().raw().toBuffer();
 const occluded=await raster([box]),open=await raster([]),alpha=(buffer,x,y)=>buffer[(y*200+x)*4+3];
 assert.equal(alpha(occluded,130,100),0);assert.equal(alpha(open,130,100),255);assert.equal(alpha(occluded,50,100),255);assert.equal(alpha(occluded,120,20),255);
 assert.doesNotMatch(lightVisibilityPath(light,room,[box]),/NaN|Infinity/);
});

test('Ultra light responds to a destroyed cover; static and reduced frames do not allocate or rewrite',()=>{
 setGraphicsQuality('ultra');
 try{
  const e=dungeonGame(2),svg=parseAdventureSvg(render(h(AdventureScene,{area:'sewer',level:2,layout:e.levelData}))),renderer=new UltraSceneRenderer(svg);
  svg.setAttribute('viewBox','0 0 5000 5000');renderer.paint(e,false);
  const clips=svg.querySelectorAll('[data-ultra-light-clip]'),before=clips.map(n=>n.getAttribute('d'));
  const index=e.levelData.solids.findIndex(s=>s.breakable);assert.ok(index>=0);e.dungeon.hitCover(index,999,e.time);renderer.paint(e,false);
  assert.ok(clips.some((n,i)=>n.getAttribute('d')!==before[i]));
  assert.ok(svg.querySelectorAll(`[data-ultra-caster="${index}"]`).every(n=>n.getAttribute('display')==='none'));
  resetSvgMetrics();for(let i=0;i<100;i++)renderer.paint(e,false);assert.equal(svgMetrics.writes,0);assert.equal(svgMetrics.created,0);
  renderer.paint(e,true);resetSvgMetrics();for(let i=0;i<60;i++){e.time+=1/60;renderer.paint(e,true);}assert.equal(svgMetrics.writes,0);
  for(const node of svg.querySelectorAll('[data-ultra-atmosphere]'))node.setAttribute('display','none');resetSvgMetrics();e.time+=1;renderer.paint(e,false);assert.equal(svgMetrics.writes,0);
 }finally{setGraphicsQuality('medium');}
});

test('Ultra effects have hollow shock waves and a fixed pool with no offscreen writes',async()=>{
 const paths=ultraCombatPaths('blast',.02,68,1),image=await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="-50 -50 100 100"><path d="${paths.ground}" fill="white" fill-rule="evenodd"/></svg>`)).ensureAlpha().raw().toBuffer();
 assert.equal(image[(50*100+50)*4+3],0,'shock wave does not fill the centre');assert.ok(image.some((n,i)=>i%4===3&&n>0));
 for(const kind of ['blast','hit','spark','dash','heal','shell'])for(const age of [0,.1,.3,.7,1.2]){const p=ultraCombatPaths(kind,age,68,3);assert.doesNotMatch(JSON.stringify(p),/NaN|Infinity/);assert.ok(p.opacity>=0&&p.opacity<=1);assert.deepEqual(p,ultraCombatPaths(kind,age,68,3));}
 setGraphicsQuality('ultra');
 try{const e=dungeonGame(2),svg=parseAdventureSvg(render(h(AdventureScene,{area:'sewer',level:2,layout:e.levelData}))),renderer=new AdventureRenderer(svg,false);renderer.resize(390,700);
  Object.assign(e.effects.pool[0],{active:true,kind:'blast',x:-10000,y:-10000,age:.1,radius:68,seed:1});renderer.paint(e,true);
  const n=svg.querySelector('[data-dungeon-effect="0"]');assert.ok(n);assert.equal(n.getAttribute('display'),'none');const attrs=[...n.attrs];renderer.paint(e,true);assert.deepEqual([...n.attrs],attrs);assert.equal(svg.querySelectorAll('[data-dungeon-effect]').length,36);
 }finally{setGraphicsQuality('medium');}
});

test('quarter poses keep separated grounded feet, shared wrists and three distinct useful actions',()=>{
 const e=dungeonGame(5),states=new Set();
 for(const facing of ['front-right','front-left','back-right','back-left']){
  e.moving=false;e.punchTime=0;e.weapon='fist';const idle=knopikMotion(e,facing);assert.equal(idle.legs[0].foot.y,-4);assert.equal(idle.legs[1].foot.y,3);assert.equal(idle.quarterAction,'idle');
  e.moving=true;e.walkDistance=14;states.add(knopikMotion(e,facing).quarterAction);
  e.weapon='rifle';e.punchTime=.08;states.add(knopikMotion(e,facing).quarterAction);
  e.moving=false;e.punchTime=0;e.dodgeTime=.2;states.add(knopikMotion(e,facing).quarterAction);e.dodgeTime=0;
  assert.doesNotMatch(JSON.stringify(knopikMotion(e,facing)),/NaN|Infinity/);
 }
 assert.deepEqual([...states],['walk','focus','burst']);
});

test('Run Ultra adds projected road relief and limits reflections to suitable surfaces without changing the run',async()=>{
 const {RunnerEngine}=await import('../app/runner-engine.ts'),{RunnerRenderer}=await import('../app/runner-renderer.ts');
 const previous=globalThis.document;globalThis.document=Object.assign(svgDocument(),{documentElement:{dataset:{}}});
 try{
  setGraphicsQuality('ultra');const e=new RunnerEngine({phase(){},coins(){},finish(){},sound(){},zone(){},route(){}},{immortal:true,night:true});e.start();
  const svg=runnerSvgScene(),reflections=new SvgNode();reflections.setAttribute('data-runner-ultra-reflections','');for(let i=0;i<16;i++)reflections.append(new SvgNode('path'));svg.append(reflections);
  const r=new RunnerRenderer(svg,'ultra-test'),state=JSON.stringify({objects:e.objects,distance:e.distance});e.districtAt=()=>0;r.render(e);
  assert.ok(reflections.children.every(n=>n.getAttribute('opacity')==='0'));
  const road=svg.querySelector('[data-runner-road-details]');assert.ok(road.children.some(n=>n.getAttribute('d')?.includes('M')));
  e.districtAt=()=>5;r.render(e);assert.ok(reflections.children.every(n=>+n.getAttribute('opacity')>0));
  resetSvgMetrics();for(let i=0;i<10;i++)r.render(e);assert.equal(svgMetrics.created,0);assert.equal(JSON.stringify({objects:e.objects,distance:e.distance}),state);
 }finally{globalThis.document=previous;setGraphicsQuality('medium');}
});

test('all 17 games have different native pixel covers and missing stock cannot start a round',()=>{
 const covers=ARCADE_CATALOG.map(g=>render(h(ArcadeGameCover,{kind:g.id})));assert.equal(new Set(covers).size,17);
 for(let i=0;i<covers.length;i++){assert.ok(covers[i].includes(`data-game-cover="${ARCADE_CATALOG[i].id}"`));assert.doesNotMatch(covers[i],/<image|<filter|<.*Gradient|NaN|undefined/);}
 const noop=()=>{},props={stock:emptyBuffStock(),laboratory:defaultLaboratory(),balance:1000,resting:false,busy:false,records:{},onPlay:noop,onBuy:noop,onBrew:noop,onUseBuff:noop,onClose:noop,onNavigate:noop};
 const locked=render(h(ArcadeLibrary,props)),ready=render(h(ArcadeLibrary,{...props,stock:Object.fromEntries(Object.keys(props.stock).map(k=>[k,1]))}));
 assert.equal((locked.match(/Нет в запасе/g)||[]).length,17);assert.equal((ready.match(/Играть · 1 напиток/g)||[]).length,17);
 assert.ok(ready.includes('Игры'));assert.ok(!ready.includes('>Настройки<'));assert.ok(!ready.includes('>Припасы<'));
});

test('coins accelerate downwards, converge on the safe and finish without a persistent particle loop',()=>{
 const target={x:290,y:620};
 for(let i=0;i<44;i++){
  const delay=(i*73%420)/1000,duration=.8+(i*19%33)/100;
  const a=vaultCoinPose(i,delay+.1,390,target),b=vaultCoinPose(i,delay+.2,390,target),c=vaultCoinPose(i,delay+.3,390,target),land=vaultCoinPose(i,delay+duration,390,target);
  assert.ok(a.y<b.y&&b.y<c.y);assert.ok(c.y-b.y>b.y-a.y);assert.ok(Math.abs(land.x-target.x)<.001);assert.ok(Math.abs(land.y-target.y)<.001);assert.equal(vaultCoinPose(i,2,390,target).visible,false);
  for(let t=0;t<2;t+=.03){const p=vaultCoinPose(i,t,390,target);assert.ok(Object.values(p).every(v=>typeof v==='boolean'||Number.isFinite(v)));assert.ok(p.flip>=.13&&p.flip<=1);assert.ok(p.opacity>=0&&p.opacity<=1);}
 }
 const component=read('vault-deposit-rain.tsx');assert.match(component,/return\(\)=>cancelAnimationFrame\(frame\)/);assert.match(component,/prefers-reduced-motion:reduce/);assert.doesNotMatch(component,/setInterval|setState|updateCoins|setVaultCoins/);
});

test('all eight menu palettes retain readable opaque navigation and the requested header order',()=>{
 const css=postcss.parse(read('menu-readability.css')),palettes=[];
 css.walkRules(r=>{const d=Object.fromEntries(r.nodes.filter(n=>n.type==='decl').map(n=>[n.prop,n.value]));if(d['--menu-card-rgb'])palettes.push(d);});assert.equal(palettes.length,8);
 const lum=c=>{const rgb=c.startsWith('#')?c.slice(1).match(/../g).map(v=>parseInt(v,16)):c.split(' ').map(Number);return rgb.map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);};
 for(const p of palettes)for(const key of ['--menu-ink','--menu-muted']){const a=lum(p[key]),b=lum(p['--menu-card-rgb']);assert.ok((Math.max(a,b)+.05)/(Math.min(a,b)+.05)>=4.5,key);}
 const source=read('knopik-go.tsx');assert.ok(source.indexOf('className="tap-header-tools"')<source.indexOf('className="tap-quick-actions"'));assert.ok(source.indexOf('className="tap-quick-actions"')<source.indexOf('className="tap-buffs"'));assert.match(source,/progress-compact-title[\s\S]{0,100}levelState.level/);
 assert.doesNotMatch(read('tap-menu.css'),/display:contents|width:62px|grid-template-rows:23px 15px/,'the former single-row layout must not constrain the full-width progress button');
 assert.doesNotMatch(read('patch-061.css'),/backdrop-filter/);
});
