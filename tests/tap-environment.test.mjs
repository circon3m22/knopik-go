import './helpers/tsx-loader.mjs';
import test from 'node:test';import assert from 'node:assert/strict';
import {createElement as h} from 'react';import {renderToStaticMarkup as render} from 'react-dom/server';
import {readFileSync} from 'node:fs';import postcss from 'postcss';
import sharp from 'sharp';
import {THEMES} from '../app/cosmetic-engine.ts';
import {GRAPHICS_QUALITIES,setGraphicsQuality,VISUAL_PROFILES} from '../app/graphics-quality.ts';
const {TapEnvironment,trackSceneVisibility}=await import('../app/skyline-environments.tsx');

test('live scenery follows document visibility and releases its listener on unmount',()=>{
 const source=new EventTarget();source.hidden=false;const scene={dataset:{}};
 const stop=trackSceneVisibility(scene,source);assert.equal(scene.dataset.sceneVisibility,'visible');
 source.hidden=true;source.dispatchEvent(new Event('visibilitychange'));assert.equal(scene.dataset.sceneVisibility,'hidden');
 source.hidden=false;source.dispatchEvent(new Event('visibilitychange'));assert.equal(scene.dataset.sceneVisibility,'visible');
 stop();assert.equal(scene.dataset.sceneVisibility,undefined);
 source.hidden=true;source.dispatchEvent(new Event('visibilitychange'));assert.equal(scene.dataset.sceneVisibility,undefined);
});

test('redrawn rooms have eight distinct opaque native compositions and retain every original theme name',async()=>{
 const {TapEnvironmentArt}=await import('../app/tap-environment-art.tsx');
 const names={classic:'Классика',soda:'Небесный',mint:'Хамам',night:'Ночной',bath:'Турецкая баня',emerald:'Изумруд',skyline:'Небесный пентхаус',observatory:'Обсерватория'};
 assert.deepEqual(Object.fromEntries(Object.entries(THEMES).map(([id,t])=>[id,t.name])),names);
 for(const detail of[0,1,4]){const drawings=new Set(),geometry=new Set();for(const theme of Object.keys(THEMES)){
  const source='<svg xmlns="http://www.w3.org/2000/svg" width="160" height="320" viewBox="0 0 160 320">'+render(h(TapEnvironmentArt,{theme,detail}))+'</svg>';
  assert.ok(source.includes('data-tap-art-revision="rooms-2"'));
  geometry.add([...source.matchAll(/\sd="([^"]+)"/g)].map(m=>m[1]).join('|'));
  const {data}=await sharp(Buffer.from(source)).ensureAlpha().raw().toBuffer({resolveWithObject:true});drawings.add(data.toString('base64'));for(let i=3;i<data.length;i+=4)assert.equal(data[i],255,theme+' must have no holes');
 }assert.equal(drawings.size,8);assert.equal(geometry.size,8,'different scenes must not be recolors of a shared drawing');}
});

test('all backgrounds preserve the pixel grid and have bounded animated clusters and drawing budgets',()=>{
 const counts={};
 try{for(const {id:quality}of GRAPHICS_QUALITIES){setGraphicsQuality(quality);counts[quality]=0;
  for(const theme of Object.keys(THEMES)){
   const svg=render(h(TapEnvironment,{theme,animate:true}));
   assert.match(svg,/viewBox="0 0 160 320"/);assert.ok(svg.includes(`data-scene-animated="${theme!=='classic'}"`));
   assert.ok(svg.includes(`data-detail="${VISUAL_PROFILES[quality].detail}"`));
   assert.doesNotMatch(svg,/<(?:image|linearGradient|radialGradient|filter|circle|ellipse)\b|NaN|undefined/);
   const shapes=(svg.match(/<(?:path|rect)\b/g)||[]).length,motions=(svg.match(/data-scene-motion=/g)||[]).length;
   counts[quality]+=shapes;
   assert.ok(theme==='classic'?motions===0:motions>=1&&motions<=({low:1,medium:1,high:2,'very-high':3,ultra:3}[quality]),`${theme}/${quality}: ${motions}`);
   if(quality==='low'||quality==='medium')assert.ok(shapes<=35,`${theme}/${quality}: too many drawing nodes (${shapes})`);
   for(const mood of ['blue','yellow','red'])assert.doesNotMatch(render(h(TapEnvironment,{theme,mood,animate:true})),/NaN|undefined/);
   assert.match(render(h(TapEnvironment,{theme})),/data-scene-animated="false"/,'thumbnails stay static');
  }
 }assert.ok(counts.medium<=200,'eight medium backgrounds stay below the drawing budget');
 assert.ok(counts.low<counts.medium&&counts.medium<counts.high&&counts.high<counts['very-high']&&counts['very-high']<counts.ultra);
 const night=render(h(TapEnvironment,{theme:'night'})),observatory=render(h(TapEnvironment,{theme:'observatory'}));
 assert.match(night,/data-scene-detail="night-city"/);assert.doesNotMatch(night,/brass-telescope|observatory-stars/);
 assert.match(observatory,/data-scene-feature="brass-telescope"/);assert.match(observatory,/data-scene-feature="observatory-stars"/);
 const classic=render(h(TapEnvironment,{theme:'classic'}));assert.doesNotMatch(classic,/M0 0h160v5H0Zm0 315|M7 7h26v2H9v24H7/,'the former frame and its corner ornaments are gone');
 }finally{setGraphicsQuality('medium');}
});

test('ambient CSS touches opacity and transforms only and pauses under overlays and reduced motion',()=>{
 const css=postcss.parse(readFileSync(new URL('../app/tap-environment.css',import.meta.url),'utf8'));
 let keyframes=0,hidden=false,covered=false,reduced=false;
 css.walkAtRules('keyframes',rule=>{keyframes++;rule.walkDecls(d=>assert.ok(['opacity','transform'].includes(d.prop),d.prop));});
 css.walkRules(rule=>{
  if(rule.selector.includes('data-scene-visibility="hidden"'))hidden=rule.nodes.some(d=>d.prop==='animation-play-state'&&d.value==='paused'&&d.important);
  if(rule.selector.includes('data-tap-scene-paused="true"'))covered=rule.nodes.some(d=>d.prop==='animation-play-state'&&d.value==='paused'&&d.important);
  if(rule.parent.type==='atrule'&&rule.parent.params==='(prefers-reduced-motion:reduce)')reduced=rule.nodes.some(d=>d.prop==='animation'&&d.value==='none'&&d.important);
 });
 assert.equal(keyframes,4);assert.ok(hidden&&covered&&reduced);
 const source=readFileSync(new URL('../app/skyline-environments.tsx',import.meta.url),'utf8');assert.doesNotMatch(source,/requestAnimationFrame|setInterval|setTimeout/);
 const game=readFileSync(new URL('../app/knopik-go.tsx',import.meta.url),'utf8');assert.match(game,/data-tap-scene-paused=\{tapScenePaused/);assert.match(game,/<PixelScene theme=\{activeTheme\} mood=\{backgroundMood\} animate/);
});

test('classic is one light solid color in every graphics mode and shop thumbnail',async()=>{
 try{for(const {id}of GRAPHICS_QUALITIES){setGraphicsQuality(id);for(const animate of[false,true]){
  const svg=render(h(TapEnvironment,{theme:'classic',animate}));assert.equal((svg.match(/<(?:path|rect)\b/g)||[]).length,1);assert.doesNotMatch(svg,/scene-motion|data-scene-animated="true"/);
  const {data}=await sharp(Buffer.from(svg)).resize(40,80).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  for(let i=0;i<data.length;i+=4)assert.deepEqual([...data.subarray(i,i+4)],[245,236,217,255]);
 }}}finally{setGraphicsQuality('medium');}
});
