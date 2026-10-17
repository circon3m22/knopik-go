import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareDungeonFinish} from './helpers/dungeon-fixtures.mjs';
import { AdventureEngine, ADVENTURE_STEP } from '../app/adventure-engine.ts';
const events={change(){},checkpoint(){},sound(){},run(){},bar(){}};
function dialogue(e){while(e.phase==='dialogue')e.nextDialogue();}
function tick(e,seconds){for(let i=0;i<Math.ceil(seconds*60);i++)e.advance(ADVENTURE_STEP);}
// Isolate completion transitions; full combat remains covered by the autoplay tests.
function finish(e){
  prepareDungeonFinish(e);
  assert.equal(e.phase,'playing');assert.equal(e.view().canFinish,true);assert.equal(e.finishLevel(),true);
}

test('the first homecoming plays once; completed level one is closed and the next route opens',()=>{
  const completed=[];
  const e=new AdventureEngine(2,{...events,levelComplete:n=>completed.push(n)});e.begin();dialogue(e);finish(e);
  assert.equal(e.phase,'homecoming');assert.equal(e.completedLevel,1);assert.deepEqual(completed,[1]);
  tick(e,5);assert.equal(e.area,'apartment');assert.equal(e.phase,'playing');dialogue(e);
  assert.equal(e.selectLevel(1),false);assert.equal(e.selectLevel(2),true);dialogue(e);finish(e);assert.equal(e.phase,'levels');assert.equal(e.area,'sewer');
  e.returnHome();assert.equal(e.area,'apartment');assert.equal(e.phase,'playing');assert.deepEqual(completed,[1,2]);
});

test('successive levels save once, freeze at selection and start the next level without a homecoming',()=>{
  const completed=[],unlocked=[];
  const e=new AdventureEngine(3,{...events,levelComplete:n=>completed.push(n),unlockWeapon:n=>unlocked.push(n)});
  assert.equal(e.selectLevel(2),true);dialogue(e);
  for(let id=2;id<=35;id++){
    assert.equal(e.level,id);assert.equal(e.selectLevel(id===35?1:id+1),false,'cannot change level during combat');
    finish(e);assert.equal(e.phase,'levels');assert.equal(e.area,'sewer');assert.equal(e.completedLevel,id);
    const snapshot=structuredClone({player:e.player,time:e.time,enemies:e.enemies,coins:e.collectedCoins});e.advance(10);
    assert.deepEqual({player:e.player,time:e.time,enemies:e.enemies,coins:e.collectedCoins},snapshot);
    if(id<35){assert.equal(e.selectLevel(id+1),true);assert.equal(e.area,'sewer');assert.equal(e.phase,'playing');dialogue(e);assert.equal(e.player.hp,3);assert.ok(e.enemies.every(n=>n.hp>0));}
  }
  assert.deepEqual(completed,Array.from({length:34},(_,i)=>i+2));assert.deepEqual(unlocked,[1,2,3,4,5,6,7]);assert.equal(e.selectLevel(36),false);
  e.closeLevels();assert.equal(e.area,'apartment');assert.equal(e.phase,'playing');assert.equal(e.completedLevel,35);
});

test('pause resumes the same fight or exits immediately without unlocking an unfinished level',()=>{
  let credited=0;const completed=[];
  const e=new AdventureEngine(3,{...events,collect:n=>credited+=n,levelComplete:n=>completed.push(n)});e.selectLevel(2);dialogue(e);
  e.player.hp=2;e.setInput(1,0,true);tick(e,.1);e.pause();
  const before=structuredClone({player:e.player,enemies:e.enemies,time:e.time});e.advance(10);assert.deepEqual({player:e.player,enemies:e.enemies,time:e.time},before);
  e.resume();assert.equal(e.phase,'playing');assert.equal(e.area,'sewer');assert.equal(e.player.hp,2);
  // An earned drop is credited once on exit; the unfinished level grants no progress.
  e.coins[0].active=true;e.coins[0].x=e.player.x+100;e.coins[0].y=e.player.y;
  e.pause();e.exitToApartment();assert.equal(e.area,'apartment');assert.equal(e.phase,'playing');assert.equal(credited,1);
  assert.equal(e.completedLevel,1);assert.deepEqual(completed,[]);assert.equal(e.player.hp,3);assert.ok(e.bullets.every(b=>!b.active));
  e.exitToApartment();assert.equal(credited,1);assert.equal(e.selectLevel(3),false);assert.equal(e.selectLevel(2),true);dialogue(e);assert.ok(e.enemies.every(n=>n.hp>0));
});

test('exiting a paused level introduction or the basement preserves the first chapter gate',()=>{
  const e=new AdventureEngine(3,events);e.selectLevel(2);assert.equal(e.phase,'playing');e.pause();e.exitToApartment();assert.equal(e.area,'apartment');assert.equal(e.phase,'playing');e.nextDialogue();assert.equal(e.phase,'playing');
  const first=new AdventureEngine(1,events);first.begin();dialogue(first);first.pause();first.exitToApartment();assert.equal(first.area,'apartment');assert.equal(first.phase,'playing');assert.equal(first.completedLevel,0);
  assert.equal(first.selectLevel(2),false);first.player.x=371;first.player.y=119;first.interact();assert.equal(first.area,'basement');
});
