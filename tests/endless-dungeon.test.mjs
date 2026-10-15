import './helpers/tsx-loader.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {AdventureEngine,ADVENTURE_STEP} from '../app/adventure-engine.ts';
import {generateEndlessDungeon} from '../app/endless-dungeon.ts';
import {defaultEndlessProgress} from '../app/endless-progress.ts';
import {createDefaultSave,sanitizeSave} from '../app/game-logic.ts';
import {prepareDungeonFinish,quietEvents} from './helpers/dungeon-fixtures.mjs';
import {pilotDungeon} from './helpers/dungeon-autoplay.mjs';
import {parseAdventureSvg} from './helpers/adventure-svg-dom.mjs';
import {resetSvgMetrics,svgMetrics} from './helpers/runner-svg-dom.mjs';
const {AdventureScene,AdventureRenderer}=await import('../app/adventure-artwork.tsx');
const {DungeonMap,DungeonCampaignMenu}=await import('../app/dungeon-menu.tsx');
const {EndlessCamp}=await import('../app/endless-menu.tsx');
function abyss(floor=1,seed=17171,events={}){
 const progress={...defaultEndlessProgress(),runs:1,expedition:{seed,floor,hp:3,perk:'none'}};
 const e=new AdventureEngine(3,{...quietEvents,...events},{completedLevel:25,weaponTier:5,endlessProgress:progress});
 assert.equal(e.startEndless(),true);return e;
}
test('the abyss unlocks only after all 25 campaign routes and never reopens a finished campaign level',()=>{
 for(const completedLevel of [0,1,10,24]){const e=new AdventureEngine(3,quietEvents,{completedLevel});assert.equal(e.startEndless(),false);}
 const e=new AdventureEngine(3,quietEvents,{completedLevel:25});assert.equal(e.selectLevel(25),false);assert.equal(e.startEndless(),true);assert.equal(e.endlessFloor,1);assert.equal(e.weaponTier,5);assert.equal(e.endlessProgress.runs,1);assert.equal(e.startEndless(),false);
});
test('seeded floors have diverse connected rooms, valid spawns and tasks, bounded pools and an endless frontier',()=>{
 const layouts=new Set(),anomalies=new Set(),zones=new Set();
 for(let seed=1;seed<=25;seed++)for(const floor of [1,2,3,4,5,6,9,10,15,20,25,80,1000,1000000]){
  const e=abyss(floor,seed),l=e.levelData;
  assert.ok(e.canStand(e.player.x,e.player.y),`spawn ${seed}/${floor}`);assert.ok(l.rooms.length>=5&&l.rooms.length<=7);assert.ok(l.enemies.length<=36);assert.equal(e.bullets.length,64);
  for(const n of e.enemies)assert.ok(e.canStand(n.x,n.y),`enemy ${seed}/${floor}/${n.id}`);
  for(const task of l.tasks)assert.ok([[0,45],[45,0],[-45,0],[0,-45]].some(([dx,dy])=>e.canStand(task.x+dx,task.y+dy)),`task approach ${seed}/${floor}`);
  assert.ok(l.gates.some(g=>g.axis==='x'));assert.equal(l.enemies.filter(n=>n.boss).length,floor%5===0?1:0);
  assert.ok(l.tasks.every((t,i)=>(t.depends??[]).every(j=>j<i)));assert.ok(l.tasks.every(t=>t.room!==l.exit.room));
  const reachable=new Set([0]);for(let i=0;i<l.rooms.length;i++)for(const g of l.gates)if(g.objective===undefined&&(reachable.has(g.from)||reachable.has(g.to))){reachable.add(g.from);reachable.add(g.to);}
  assert.ok(l.tasks.every(t=>reachable.has(t.room)),'no objective behind its own lock');
  layouts.add(JSON.stringify(l.rooms));anomalies.add(l.abyss.anomaly.id);zones.add(l.zone);
  assert.deepEqual(generateEndlessDungeon(seed,floor),l);
 }
 assert.ok(layouts.size>180);assert.equal(anomalies.size,4);assert.equal(zones.size,5);
});
test('a completed floor pays once, checkpoints the next floor and carries health and one chosen perk',()=>{
 let coins=0;const progress=[],campaign=[];const e=abyss(1,777,{collect:n=>coins+=n,endlessProgress:p=>progress.push(p),levelComplete:n=>campaign.push(n)});
 prepareDungeonFinish(e);e.player.hp=1;assert.equal(e.finishLevel(),true);const paid=coins;assert.equal(e.phase,'won');assert.equal(e.finishLevel(),false);assert.equal(coins,paid);assert.equal(e.endlessProgress.bestFloor,1);assert.equal(e.endlessProgress.expedition.floor,2);assert.equal(e.completedLevel,25);assert.deepEqual(campaign,[]);
 assert.equal(e.continueEndless('power'),true);assert.equal(e.endlessFloor,2);assert.equal(e.player.hp,1);assert.equal(e.endlessPerk,'power');
 e.setInput(0,0,true);e.advance(ADVENTURE_STEP);assert.ok(Math.abs(e.punchCooldown-1.2*.85)<.001);e.setInput(0,0,false);
 prepareDungeonFinish(e);e.finishLevel();assert.equal(e.continueEndless('rest'),true);assert.equal(e.player.hp,2);assert.equal(e.endlessPerk,'none');
 e.pause();e.exitToApartment();assert.equal(e.endlessFloor,0);assert.equal(e.endlessProgress.expedition.floor,3);assert.equal(e.startEndless(),true);assert.equal(e.endlessFloor,3);assert.equal(e.player.hp,2);assert.ok(progress.length>=4);
});
test('death burns the wallet, restart keeps the generated floor and chest rolls, and a new expedition preserves records',()=>{
 let burned=0;const e=abyss(10,9,{death:()=>{burned++;return 123;}}),layout=e.levelData,chests=e.chests.map(c=>c.loot);
 e.enemies.forEach(n=>{if(n.room===0){n.x=e.player.x;n.y=e.player.y-25;n.mode='windup';n.timer=0;n.attackAngle=Math.PI/2;}});e.player.hp=1;e.invincible=0;e.advance(ADVENTURE_STEP);assert.equal(e.phase,'dead');assert.equal(burned,1);e.restart();assert.equal(e.phase,'playing');assert.equal(e.levelData,layout);assert.deepEqual(e.chests.map(c=>c.loot),chests);
 prepareDungeonFinish(e);e.finishLevel();e.returnHome();assert.equal(e.startEndless(true),true);assert.equal(e.endlessFloor,1);assert.equal(e.endlessProgress.bestFloor,10);
});
test('v31 keeps frontier, record, gear and economy through offline JSON round trips; old saves migrate safely',()=>{
 const save={...createDefaultSave(),storyCompletedLevel:25,walletCoins:1234,endless:{bestFloor:13,floorsCleared:17,runs:2,expedition:{seed:777,floor:14,hp:2,perk:'flow'}}};
 const restored=sanitizeSave(JSON.parse(JSON.stringify(save)));assert.deepEqual(restored.endless,save.endless);assert.equal(restored.walletCoins,1234);
 const old=sanitizeSave({...save,version:30});assert.deepEqual(old.endless,defaultEndlessProgress());assert.equal(old.walletCoins,1234);assert.equal(old.storyCompletedLevel,25);
 assert.deepEqual(sanitizeSave({...save,storyCompletedLevel:24}).endless,defaultEndlessProgress());
 const e=new AdventureEngine(3,quietEvents,{completedLevel:25,weaponTier:5,endlessProgress:restored.endless});e.startEndless();assert.deepEqual(e.levelData,generateEndlessDungeon(777,14));assert.equal(e.player.hp,2);e.setInput(1,0,false);e.dodge();assert.ok(Math.abs(e.dodgeCooldown-.66*.75)<.001);
});
test('world geometry, actors, tasks and the pixel map all use the same generated floor without new frame nodes',()=>{
 const e=abyss(15,333),markup=renderToStaticMarkup(React.createElement(AdventureScene,{area:'sewer',level:e.level,layout:e.levelData})),svg=parseAdventureSvg(markup),renderer=new AdventureRenderer(svg,true);
 assert.equal(svg.querySelectorAll('[data-enemy]').length,e.enemies.length);assert.equal(svg.querySelectorAll('[data-dungeon-task]').length,e.levelData.tasks.length);assert.equal(svg.querySelectorAll('[data-dungeon-floor]').length,e.levelData.floors.length);
 renderer.resize(390,420);resetSvgMetrics();for(let i=0;i<120;i++){e.advance(ADVENTURE_STEP);renderer.paint(e);}assert.equal(svgMetrics.created,0);assert.ok(!/NaN|Infinity/.test(svg.getAttribute('viewBox')));
 const map=renderToStaticMarkup(React.createElement(DungeonMap,{view:e.view(),layout:e.levelData,player:e.player,cleared:e.cleared,gates:e.levelData.gates.map((_,i)=>e.gateOpen(i)),onClose(){}}));assert.equal((map.match(/data-map-room=/g)??[]).length,e.levelData.rooms.length);assert.ok(map.includes('БЕЗДНА'));
 const menu=renderToStaticMarkup(React.createElement(DungeonCampaignMenu,{view:e.view(),zone:5,onZone(){},onLevel(){},onClose(){},onEndless(){}}));assert.ok(menu.includes('Бездна'));assert.ok(menu.includes('Рекорд'));
 prepareDungeonFinish(e);e.finishLevel();const camp=renderToStaticMarkup(React.createElement(EndlessCamp,{view:e.view(),onContinue(){},onHome(){}}));assert.ok(camp.includes('Глубина 15 пройдена'));assert.ok(camp.includes('Передышка'));
});
for(const floor of [1,3,5,6,10,15])test(`generated floor ${floor} completes with actual 60 Hz controls, combat, traps and tasks`,()=>{
 let heals=3,shields=1;const e=abyss(floor,17171,{consumeHeal:()=>heals-->0,activateShield:()=>shields-->0});e.activateShield();
 const result=pilotDungeon(e,{maxFrames:18000,pathStep:32});assert.ok(result.hearts>0);assert.equal(e.finishLevel(),true);assert.equal(e.phase,'won');assert.equal(e.endlessProgress.bestFloor,floor);
});
