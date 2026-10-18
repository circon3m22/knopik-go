import './helpers/tsx-loader.mjs';
import test from 'node:test';import assert from 'node:assert/strict';
import {createElement as h} from 'react';import {renderToStaticMarkup as render} from 'react-dom/server';
import {arcadeSettlement,arcadeProfitFactor} from '../app/arcade-economy.ts';
import {generateRoomGraph} from '../app/dungeon-generation.ts';
import {generateArcadeDungeon} from '../app/arcade-dungeon.ts';
import {createDefaultSave,sanitizeSave} from '../app/game-logic.ts';
import {GRAPHICS_QUALITIES,setGraphicsQuality,VISUAL_PROFILES} from '../app/graphics-quality.ts';
import {RunnerInterpolation} from '../app/runner-interpolation.ts';
import {RunnerEngine} from '../app/runner-engine.ts';
import {FramePaintLimiter} from '../app/render-preferences.ts';
import {clothingRollCooldown} from '../app/knopik-combat-equipment.ts';
import {dungeonGame} from './helpers/dungeon-fixtures.mjs';
import {THEMES} from '../app/cosmetic-engine.ts';
import {readCoopEquipment} from '../app/coop-protocol.ts';
import {readFileSync} from 'node:fs';
import postcss from 'postcss';
const {TapEnvironment}=await import('../app/skyline-environments.tsx');
const {AdventureScene}=await import('../app/adventure-artwork.tsx');
const quiet={phase(){},coins(){},finish(){},sound(){},zone(){},route(){}};
const run=(accessory=null)=>{const e=new RunnerEngine(quiet,{accessory,immortal:true});e.phase='running';e.objects.length=0;e.generateAhead=()=>{};return e;};
test('arcade profit preserves principal and losses, shrinks with wealth, and cannot be reset by depositing or spending',()=>{
 assert.deepEqual(arcadeSettlement(100,100,500,0),{payout:100,profit:0});assert.deepEqual(arcadeSettlement(20,100,500,0),{payout:20,profit:0});
 const wins=[0,10000,50000].map(wealth=>arcadeSettlement(1e9,100,wealth,0).profit);assert.ok(wins[0]>wins[1]&&wins[1]>wins[2]);assert.ok(wins[2]<=16);
 assert.equal(arcadeSettlement(1e9,100,0,0).profit,2000);
 assert.ok(arcadeProfitFactor(0,40000)<.01);assert.equal(arcadeSettlement(1000,0,0,50000).profit,0);
 let earned=0;for(let i=0;i<100000;i++)earned+=arcadeSettlement(1e9,0,0,earned).profit;
 assert.ok(earned>10000&&earned<50000,`no wealth-independent infinite faucet: ${earned}`);
 for(const bad of [NaN,Infinity,-1])assert.equal(arcadeSettlement(bad,0,0,0).payout,0);
});
test('Save 35 upgrades without losing possessions, and new economy/Ultra/120/skin/boots/themes survive JSON roundtrips',()=>{
 const old={...createDefaultSave(),version:35,walletCoins:17000,vaultCoins:410000,ownedSkins:['classic','hunter'],activeSkin:'hunter'};delete old.arcadeProfit;
 const migrated=sanitizeSave(old);assert.equal(migrated.version,36);assert.equal(migrated.arcadeProfit,0);assert.equal(migrated.vaultCoins,410000);assert.equal(migrated.walletCoins,17000);
 const fresh={...migrated,arcadeProfit:12345,ownedSkins:['classic','glacier'],activeSkin:'glacier',ownedCosmetics:['sky-boots'],equippedCosmetic:'sky-boots',ownedThemes:['classic','skyline','observatory'],activeTheme:'observatory',settings:{...migrated.settings,graphicsQuality:'ultra',fpsLimit:120}};
 const restored=sanitizeSave(JSON.parse(JSON.stringify(fresh)));for(const key of ['arcadeProfit','activeSkin','equippedCosmetic','activeTheme'])assert.equal(restored[key],fresh[key]);assert.equal(restored.settings.fpsLimit,120);assert.equal(restored.settings.graphicsQuality,'ultra');
 assert.ok(readCoopEquipment({skin:'glacier',hat:false,mohawk:false,accessory:'sky-boots'}));
});
test('1000 generated graphs have unique cells, cardinal passages, branches and reachable farthest exits',()=>{
 const unique=new Set();let branched=0,loops=0;
 for(let seed=1;seed<=1000;seed++){
  const g=generateRoomGraph(seed);assert.deepEqual(g,generateRoomGraph(seed));assert.equal(new Set(g.grid.map(p=>p.join(','))).size,8);
  const reached=new Set([0]),degree=g.grid.map(()=>0);for(const [a,b]of g.links){assert.equal(Math.abs(g.grid[a][0]-g.grid[b][0])+Math.abs(g.grid[a][1]-g.grid[b][1]),1);degree[a]++;degree[b]++;}
  for(let i=0;i<8;i++)for(const [a,b]of g.links)if(reached.has(a)||reached.has(b)){reached.add(a);reached.add(b);}assert.equal(reached.size,8);assert.ok(g.exit>0);if(degree.some(n=>n>2))branched++;if(g.links.length>7)loops++;
  unique.add(JSON.stringify(g));const level=generateArcadeDungeon(seed,0);assert.ok(level.exit.room>0&&level.exit.room<8);assert.equal(level.rooms.length,8);
 }
 assert.ok(unique.size>950);assert.ok(branched>850);assert.ok(loops>100);
});
test('Hunter effects change real cooldown and hit protection; boots increase Run jump height without flight',()=>{
 assert.ok(clothingRollCooldown({hat:false,mohawk:false,accessory:'ranger-hood'})<clothingRollCooldown({hat:false,mohawk:false,accessory:null}));
 const e=dungeonGame(6,{immortal:false,equipment:{hat:false,mohawk:false,accessory:'hunter-armor'}});e.setEquipment({hat:false,mohawk:false,accessory:'hunter-armor'});e.hurt();assert.equal(e.player.hp,2);assert.equal(e.invincible,1.76);e.hurt();assert.equal(e.player.hp,2);
 let normal=0,superJump=0;for(const [accessory,record]of [[null,v=>normal=v],['sky-boots',v=>superJump=v]]){const e=run(accessory);e.input('jump');let maximum=0;for(let i=0;i<80;i++){e.update(1/120);maximum=Math.max(maximum,e.height);}record(maximum);assert.equal(e.flying,false);}
 assert.ok(superJump>normal*1.35&&superJump<normal*1.45,`${normal} -> ${superJump}`);
 const cloak=run('hunter-cloak'),plain=run();for(const e of [cloak,plain])e.collectPowerup('firework-pickup');for(let i=0;i<450;i++){cloak.update(1/60);plain.update(1/60);}assert.equal(plain.flying,false);assert.equal(cloak.flying,true);
});
test('120 Hz presentation interpolates actual movement and pausing still reaches the authoritative engine',()=>{
 const e=run(),view=new RunnerInterpolation();e.distance=100;view.capture(e);e.distance=102;const half=view.view(e,.5);assert.equal(half.distance,101);assert.equal(e.distance,102);half.pause();assert.equal(e.phase,'paused');view.reset();e.distance=0;assert.equal(view.view(e,0).distance,0);
 const limiter=new FramePaintLimiter();let paints=0;for(let i=0;i<120;i++)if(limiter.due(i*1000/120,120))paints++;assert.equal(paints,120);
});
test('eight authored themes scale detail; medium omits costly world lighting while Ultra adds geometry',()=>{
 const counts={};try{for(const quality of ['low','medium','ultra']){setGraphicsQuality(quality);const shapes=new Set();let contours=0;for(const theme of Object.keys(THEMES)){const svg=render(h(TapEnvironment,{theme}));assert.doesNotMatch(svg,/NaN|undefined/);shapes.add(svg);for(const path of svg.matchAll(/\bd="([^"]*)"/g))contours+=(path[1].match(/[Mm]/g)||[]).length;contours+=(svg.match(/<rect\b/g)||[]).length;}assert.equal(shapes.size,8);counts[quality]=contours;
  const world=render(h(AdventureScene,{area:'sewer',level:8}));if(quality==='medium')assert.ok(!world.includes('data-world-lighting'));if(quality==='ultra')assert.ok(world.includes('data-ultra-world'));
 }assert.ok(counts.ultra>counts.medium*2);assert.ok(VISUAL_PROFILES.medium.pixelRatio<=1);assert.equal(GRAPHICS_QUALITIES.length,5);}finally{setGraphicsQuality('medium');}
});
test('original theme names and order are preserved; pixel backgrounds fill the direct scene container',()=>{
 assert.deepEqual(Object.entries(THEMES).slice(0,6).map(([id,t])=>[id,t.name]),[['classic','Классика'],['soda','Небесный'],['mint','Хамам'],['night','Ночной'],['bath','Турецкая баня'],['emerald','Изумруд']]);
 for(const theme of Object.keys(THEMES)){const svg=render(h(TapEnvironment,{theme}));assert.match(svg,/viewBox="0 0 160 320"/);assert.match(svg,/data-pixel-grid="160"/);assert.doesNotMatch(svg,/<(?:linearGradient|radialGradient|filter|circle|ellipse|image)\b/);}
 const sheet=postcss.parse(readFileSync(new URL('../app/pixel-game.css',import.meta.url),'utf8'));let sizing;
 sheet.walkRules('.pixel-game .theme-decor > .pixel-scene',r=>{sizing={};r.walkDecls(d=>sizing[d.prop]=d.value);});
 assert.ok(sizing,'the single background is a direct child, not a removed mood wrapper');assert.equal(sizing.width,'100%');assert.equal(sizing.height,'100%');assert.equal(sizing.position,'absolute');assert.equal(sizing.inset,'0');
});
test('Run particle quality never changes generated rows, coins, collisions or the route seed',()=>{
 const descriptor=Object.getOwnPropertyDescriptor(globalThis,'crypto');Object.defineProperty(globalThis,'crypto',{configurable:true,value:{getRandomValues(a){a[0]=291770;return a;}}});
 try{let expected;for(const quality of ['low','medium','ultra']){setGraphicsQuality(quality);const e=new RunnerEngine(quiet,{immortal:true});e.start();for(let i=0;i<2400;i++)e.update(1/60);const state=JSON.stringify({seed:e.seed,distance:e.distance,coins:e.coins,objects:e.objects});if(expected)assert.equal(state,expected);else expected=state;}}
 finally{if(descriptor)Object.defineProperty(globalThis,'crypto',descriptor);else delete globalThis.crypto;setGraphicsQuality('medium');}
});
test('arcade branch exit advances only after every room is cleared and keeps health/weapon',()=>{
 const e=dungeonGame(6,{immortal:true});e.exitToApartment();e.phase='levels';assert.ok(e.startArcade());const layout=e.levelData;
 e.enemies.forEach(n=>n.hp=0);e.cleared.fill(true);e.cleared[(layout.exit.room+1)%8]=false;Object.assign(e.player,{x:layout.exit.x,y:layout.exit.y,hp:2});e.room=layout.exit.room;e.advanceArcadeBatch();assert.equal(e.arcadeSegment,0);
 e.cleared.fill(true);e.advanceArcadeBatch();assert.equal(e.arcadeSegment,1);assert.equal(e.arcadeCleared,8);assert.equal(e.player.hp,2);assert.notDeepEqual(e.levelData.rooms,layout.rooms);
});
