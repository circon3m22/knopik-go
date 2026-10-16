import './helpers/tsx-loader.mjs';
import test from 'node:test';import assert from 'node:assert/strict';
import {createElement as h} from 'react';import {renderToStaticMarkup as render} from 'react-dom/server';
import {GRAPHICS_QUALITIES,VISUAL_PROFILES,graphicsModes,migrateGraphicsQuality,setGraphicsQuality} from '../app/graphics-quality.ts';
import {createDefaultSave,sanitizeSave} from '../app/game-logic.ts';
import {AdventureEngine} from '../app/adventure-engine.ts';
import {RunnerFrameBudget} from '../app/runner-frame-budget.ts';
import {parseAdventureSvg} from './helpers/adventure-svg-dom.mjs';
const {AdventureScene,AdventureRenderer}=await import('../app/adventure-artwork.tsx');
const {NeighborhoodScene}=await import('../app/neighborhood-artwork.tsx');
const quiet={change(){},checkpoint(){},sound(){},run(){},bar(){}};
const nodes=html=>(html.match(/<[a-zA-Z]/g)||[]).length;
test('legacy preferences migrate to four global tiers without changing money, skins or progress',()=>{
 const save=createDefaultSave();save.walletCoins=12345;save.vaultCoins=888;save.storyCompletedLevel=12;
 for(const [world,runner,expected] of [['fast','auto','low'],['soft','auto','medium'],['rich','sharp','medium'],['ultra','auto','high'],['cinematic','auto','very-high']]){
  const legacy={...save,settings:{...save.settings,graphicsQuality:undefined,worldGraphics:world,graphics:runner}};
  const result=sanitizeSave(legacy);assert.equal(result.settings.graphicsQuality,expected);assert.equal(result.walletCoins,12345);assert.equal(result.vaultCoins,888);assert.equal(result.storyCompletedLevel,12);
 }
 assert.equal(migrateGraphicsQuality('low','ultra','cinematic'),'low');
 assert.equal(sanitizeSave({...save,settings:{...save.settings,fpsPosition:'top'}}).settings.fpsPosition,'top');
 assert.equal(sanitizeSave({...save,settings:{...save.settings,fpsPosition:'broken'}}).settings.fpsPosition,'bottom');
 assert.equal(GRAPHICS_QUALITIES.length,4);assert.deepEqual(graphicsModes('high'),{world:'ultra',runner:'ultra'});
});
test('low emits substantially fewer actual world nodes; very high adds real ground shadows and lights',()=>{
 const counts={};
 try{for(const quality of GRAPHICS_QUALITIES.map(q=>q.id)){
  setGraphicsQuality(quality);
  const apartment=render(h(AdventureScene,{area:'apartment',theme:'classic',legacyHome:false}));
  const dungeon=render(h(AdventureScene,{area:'sewer',level:8}));
  const street=render(h(NeighborhoodScene,{night:true,prefix:'test-quality'}));
  counts[quality]={apartment:nodes(apartment),dungeon:nodes(dungeon),street:nodes(street)};
  if(quality==='low'){assert.ok(apartment.includes('data-low-world="apartment"'));assert.ok(street.includes('data-low-world="street"'));assert.ok(!apartment.includes('data-premium-world'));assert.ok(street.includes('data-mission-marker'));}
  if(quality==='very-high')for(const html of [apartment,dungeon,street])assert.ok(html.includes('data-premium-world'));
 }
 for(const scene of ['apartment','dungeon','street']){assert.ok(counts.low[scene]<counts.medium[scene]*.9,JSON.stringify(counts));assert.ok(counts['very-high'][scene]>counts.high[scene]);}
 }finally{setGraphicsQuality('medium');}
});
test('every tier retains gate/hazard pools and world collision geometry',()=>{
 const engine=new AdventureEngine(3,quiet,{completedLevel:8,weaponTier:3});engine.phase='levels';engine.selectLevel(9);
 const before=JSON.stringify({player:engine.player,enemies:engine.enemies,solids:engine.levelData.solids});
 try{for(const {id}of GRAPHICS_QUALITIES){
  setGraphicsQuality(id);const svg=parseAdventureSvg(render(h(AdventureScene,{area:'sewer',level:9,layout:engine.levelData})));
  const renderer=new AdventureRenderer(svg,id==='low');renderer.resize(390,700);renderer.paint(engine,true);
  assert.equal(svg.querySelectorAll('[data-gate]').length,engine.levelData.gates.length);assert.equal(svg.querySelectorAll('[data-dungeon-hazard]').length,engine.levelData.hazards.length);
  assert.equal(JSON.stringify({player:engine.player,enemies:engine.enemies,solids:engine.levelData.solids}),before);
 }}finally{setGraphicsQuality('medium');}
});
test('raster budgets keep old Ultra at high and sharply reduce low without changing the simulation cap',()=>{
 const b=new RunnerFrameBudget();assert.equal(b.pixelRatio(4,'fast'),.65);assert.equal(b.pixelRatio(4,'ultra'),3);assert.equal(b.pixelRatio(4,'cinematic'),3.5);
 assert.equal(b.fps,60);assert.ok(VISUAL_PROFILES.low.particles<VISUAL_PROFILES.medium.particles);
});
test('Run changes only presentation and reuses its very-high shadow pool across frames',async()=>{
 const {RunnerEngine}=await import('../app/runner-engine.ts');const {RunnerRenderer}=await import('../app/runner-renderer.ts');
 const {runnerSvgScene,svgDocument,resetSvgMetrics,svgMetrics}=await import('./helpers/runner-svg-dom.mjs');
 const previous=globalThis.document;globalThis.document=Object.assign(svgDocument(),{documentElement:{dataset:{}}});
 try{
  const engine=new RunnerEngine({phase(){},coins(){},finish(){},sound(){},zone(){},route(){}},{immortal:true});engine.start();for(let i=0;i<180;i++)engine.update(1/60);
  const world=JSON.stringify(engine.objects),distance=engine.distance,svg=runnerSvgScene(),renderer=new RunnerRenderer(svg,'quality');
  for(const quality of ['low','high','very-high','medium','very-high']){
   setGraphicsQuality(quality);renderer.render(engine);
   assert.equal(JSON.stringify(engine.objects),world);assert.equal(engine.distance,distance);
   const shadows=svg.querySelectorAll('[data-premium-shadow]');
   if(quality==='very-high')assert.ok(shadows.length>0);
   if(quality==='medium')assert.ok(shadows.every(n=>n.getAttribute('display')==='none'));
  }
  resetSvgMetrics();for(let i=0;i<5;i++)renderer.render(engine);assert.equal(svgMetrics.created,0,'no per-frame shadow allocation');
 }finally{globalThis.document=previous;setGraphicsQuality('medium');}
});
