import test from 'node:test';import assert from 'node:assert/strict';
import {dungeonGame,prepareDungeonFinish,tickDungeon} from './helpers/dungeon-fixtures.mjs';
import {AdventureEngine} from '../app/adventure-engine.ts';import {HOMECOMING_DURATION,homecomingFrame} from '../app/adventure-homecoming.ts';
import {HOME_SPAWN} from '../app/apartment-world.ts';
test('the first victory freezes combat, saves once and automatically reveals home at every refresh rate',()=>{
 for(const fps of [30,60,120]){
  const completed=[],saved=[];let paid=0;const e=dungeonGame(1,{}, {levelComplete:n=>completed.push(n),checkpoint:n=>saved.push(n),collect:n=>paid+=n});prepareDungeonFinish(e);assert.equal(e.finishLevel(),true);assert.equal(e.phase,'homecoming');
  const snapshot=structuredClone({player:e.player,enemies:e.enemies,time:e.time,paid});e.setInput(1,1,true);assert.equal(e.finishLevel(),false);
  for(let i=0;i<3*fps;i++)e.advance(1/fps);
  assert.equal(e.phase,'homecoming');assert.deepEqual({player:e.player,enemies:e.enemies,time:e.time,paid},snapshot);
  for(let i=0;i<Math.ceil((HOMECOMING_DURATION-3+.1)*fps);i++)e.advance(1/fps);
  assert.equal(e.phase,'playing');assert.equal(e.area,'apartment');assert.equal(e.player.x,HOME_SPAWN.x);assert.equal(e.player.y,HOME_SPAWN.y);
  assert.deepEqual(saved,[3]);assert.deepEqual(completed,[1]);assert.equal(paid,snapshot.paid);assert.equal(e.selectLevel(1),false);
  const resumed=new AdventureEngine(3,{change(){},checkpoint(){},sound(){},run(){},bar(){}},{completedLevel:1});assert.equal(resumed.phase,'playing');assert.equal(resumed.area,'apartment');
 }
});
test('the title appears only after blackout and disappears before the home reveal',()=>{
 assert.deepEqual(homecomingFrame(0),{black:0,logo:0});assert.equal(homecomingFrame(.9).black,1);assert.equal(homecomingFrame(.9).logo,0);
 assert.equal(homecomingFrame(2.5).logo,1);assert.deepEqual(homecomingFrame(HOMECOMING_DURATION),{black:1,logo:0});
 for(const t of [NaN,Infinity,-10,0,2,6])for(const v of Object.values(homecomingFrame(t)))assert.ok(Number.isFinite(v)&&v>=0&&v<=1);
});
