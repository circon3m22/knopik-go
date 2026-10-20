import './helpers/tsx-loader.mjs';
import test from 'node:test';import assert from 'node:assert/strict';
import {createElement as h} from 'react';import{renderToStaticMarkup as render}from'react-dom/server';
import{ExpeditionDrinkRound,relicTraps,ruinSequence}from'../app/expedition-drink-engine.ts';
import{createDefaultSave,sanitizeSave,SAVE_VERSION}from'../app/game-logic.ts';
import{ADVENTURE_LEVELS}from'../app/adventure-levels.ts';
import{DungeonRuntime}from'../app/dungeon-runtime.ts';
import{KNOPIK_SKINS,purchaseKnopikSkin}from'../app/knopik-skins.ts';
import{CASINO_GAMES,settleCasinoRound,commitCasinoRound}from'../app/casino-engine.ts';
import{arcadeSettlement}from'../app/arcade-economy.ts';
const {ExpeditionRoomArt}=await import('../app/expedition-room-art.tsx');
const {ExpeditionDrinkGame}=await import('../app/expedition-drink-game.tsx');

test('ruin memory consumes a fixed sequence; wrong, showing and duplicate inputs cannot award wins',()=>{
 const r=new ExpeditionDrinkRound('hibiscus',()=>.3);assert.ok(r.start());assert.equal(r.start(),false);assert.equal(r.pick(0),false);r.revealDone();
 for(const cell of [...r.sequence])assert.ok(r.pick(cell));assert.equal(r.phase,'settled');assert.equal(r.factor,1.9);assert.equal(r.pick(0),false);assert.equal(r.abandon(),false);
 const lose=new ExpeditionDrinkRound('hibiscus',()=>.3);lose.start();lose.revealDone();lose.pick((lose.sequence[0]+1)%9);assert.equal(lose.factor,0);assert.equal(lose.phase,'settled');
 for(const seed of[0,.3,.999999]){const seq=ruinSequence(()=>seed);assert.equal(seq.length,4);assert.ok(seq.every((n,i)=>n>=0&&n<9&&(!i||n!==seq[i-1])));assert.ok(relicTraps(()=>seed).every(n=>n>=0&&n<3));}
});
test('all relic paths have fixed traps, bounded cashout and one settlement',()=>{
 for(let a=0;a<3;a++)for(let b=0;b<3;b++)for(let c=0;c<3;c++){
  const r=new ExpeditionDrinkRound('tonic',()=>.4);r.start();const traps=[...r.traps];for(const choice of[a,b,c])r.pick(choice);
  assert.deepEqual(r.traps,traps);assert.equal(r.phase,'settled');assert.ok([0,2.5].includes(r.factor));assert.equal(r.cashout(),false);assert.equal(r.pick(1),false);
 }
 const r=new ExpeditionDrinkRound('tonic',()=>0);r.start();assert.equal(r.cashout(),false);assert.equal(r.pick(-1),false);r.pick(1);assert.ok(r.cashout());assert.equal(r.factor,1.25);
 for(const kind of['hibiscus','tonic']){const ledger={kind,phase:'ready',bet:0,doubled:false};assert.ok(commitCasinoRound(ledger,1,500,100));const value=settleCasinoRound(ledger,kind,1e9);assert.equal(value,100*CASINO_GAMES[kind].maxMultiplier);assert.equal(settleCasinoRound(ledger,kind,100),null);assert.ok(arcadeSettlement(value,100,50000,49999).profit<2);}
});
test('survey shares visited rooms and repair only progresses near a living participating player',()=>{
 for(const kind of['repair','survey']){
  const level=ADVENTURE_LEVELS.find(l=>l.tasks.some(t=>t.kind===kind)),index=level.tasks.findIndex(t=>t.kind===kind),task=level.tasks[index];
  const runtime=new DungeonRuntime(level,{wave(){},blast(){},effect(){},sound(){},damage(){},trapEnemies(){},done(){return false;}});
  assert.ok(runtime.activate(index,0));runtime.step(2,2,{x:0,y:0},0,[]);if(kind==='repair')assert.equal(runtime.tasks[index].progress,0);
  if(kind==='repair'){runtime.step(task.duration+1,10,{x:0,y:0},0,[],[{room:task.room,player:{x:task.x,y:task.y}}]);}
  else for(let room=0;room<level.rooms.length;room++)runtime.step(.02,room,{x:0,y:0},room,[]);
  assert.ok(runtime.tasks[index].done);assert.equal(runtime.activate(index,20),false);
 }
});
test('Save38 preserves old possessions and roundtrips the explorer and both new drinks',()=>{
 assert.equal(SAVE_VERSION,38);const old={...createDefaultSave(),version:37,walletCoins:12345,vaultCoins:45678,auraCoins:69,seenSahurs:['grunt'],weaponUpgrades:{rifle:2},storyWeaponTier:7,storyCompletedLevel:35};
 const migrated=sanitizeSave(old);assert.equal(migrated.walletCoins,12345);assert.equal(migrated.vaultCoins,45678);assert.equal(migrated.weaponUpgrades.rifle,2);assert.deepEqual(migrated.seenSahurs,['grunt']);assert.equal(migrated.casinoInventory.hibiscus,0);
 const bought=purchaseKnopikSkin(migrated.ownedSkins,migrated.auraCoins,'explorer');assert.equal(KNOPIK_SKINS.explorer.price,69);assert.equal(bought.auraCoins,0);assert.equal(purchaseKnopikSkin(bought.ownedSkins,0,'explorer').auraCoins,0);
 const saved=sanitizeSave(JSON.parse(JSON.stringify({...migrated,...bought,casinoInventory:{...migrated.casinoInventory,hibiscus:2,tonic:3}})));assert.equal(saved.activeSkin,'explorer');assert.equal(saved.casinoInventory.tonic,3);assert.equal(saved.casinoInventory.hibiscus,2);
});
test('all 35 levels have bounded material detail; new cabinets render without numeric or layout placeholders',()=>{
 for(const level of ADVENTURE_LEVELS)for(const quality of['low','medium','high','very-high','ultra']){
  const html=render(h(ExpeditionRoomArt,{level,room:0,quality}));assert.doesNotMatch(html,/NaN|Infinity|undefined|<filter|<image|<animate/);const nodes=(html.match(/<path/g)||[]).length;assert.ok(nodes<=(quality==='low'?1:6));assert.ok(html.includes('data-room-use='));
 }
 for(const kind of['hibiscus','tonic']){const html=render(h(ExpeditionDrinkGame,{kind,skin:'explorer',balance:777777777,canChooseBet:true,stats:{plays:0,wins:0,best:0},onCommit(){return true;},onResolve(){},onClose(){},onDouble(){return false;},onSound(){}}));assert.doesNotMatch(html,/NaN|Infinity|undefined/);assert.ok(html.includes('type="range"'));assert.ok(html.includes(CASINO_GAMES[kind].title));}
});


test('new objectives show actual progress in the rendered world and material details use room culling',async()=>{
 const {dungeonGame}=await import('./helpers/dungeon-fixtures.mjs');
 const {AdventureScene,AdventureRenderer}=await import('../app/adventure-artwork.tsx');
 const {parseAdventureSvg}=await import('./helpers/adventure-svg-dom.mjs');
 for(const kind of['repair','survey']){
  const level=ADVENTURE_LEVELS.find(l=>l.tasks.some(t=>t.kind===kind)),e=dungeonGame(level.id),index=level.tasks.findIndex(t=>t.kind===kind);
  e.dungeon.activate(index,0);e.dungeon.tasks[index].progress=2;
  const root=parseAdventureSvg(render(h(AdventureScene,{area:'sewer',level:level.id}))),renderer=new AdventureRenderer(root,false);renderer.paint(e,true);
  const card=root.querySelector(`[data-dungeon-task="${index}"]`);assert.equal(card.querySelector('[data-task-running]').getAttribute('display'),'inline');assert.ok(Number(card.querySelector('[data-task-progress]').getAttribute('stroke-dasharray').split(' ')[0])>0);
  const art=parseAdventureSvg(render(h(ExpeditionRoomArt,{level,room:0,quality:'high'})));assert.equal(art.getAttribute('data-room-detail'),'0');
 }
});
