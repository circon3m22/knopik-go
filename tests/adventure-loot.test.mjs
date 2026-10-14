import {buffStockLimit} from "../app/buff-shelf-engine.ts";
import './helpers/tsx-loader.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {prepareDungeonFinish} from './helpers/dungeon-fixtures.mjs';
import {AdventureEngine,ADVENTURE_STEP} from '../app/adventure-engine.ts';
import {rollAdventureLoot} from '../app/adventure-loot.ts';
import {parseAdventureSvg} from './helpers/adventure-svg-dom.mjs';
import {resetSvgMetrics,svgMetrics} from './helpers/runner-svg-dom.mjs';
const {AdventureScene,AdventureRenderer}=await import('../app/adventure-artwork.tsx');
const events={change(){},checkpoint(){},sound(){},run(){},bar(){}};
function start(options={},extra={}){const e=new AdventureEngine(2,{...events,...extra},options);e.begin();while(e.phase==='dialogue')e.nextDialogue();return e;}
function settle(e){for(let n=0;n<150;n++)e.advance(ADVENTURE_STEP);}
function clear(e,room){e.room=room;const r=e.levelData.rooms[room];e.player.x=r.x+r.w/2;e.player.y=r.y+r.h-80;e.enemies.filter(n=>n.room===room).forEach(n=>n.hp=0);e.advance(ADVENTURE_STEP);}
function approach(e,index,dx=0,dy=32){const c=e.chests[index];e.player.x=c.x+dx;e.player.y=c.y+dy;assert.equal(e.canStand(e.player.x,e.player.y),true);}

test('chest loot is mostly bounded coins, with four distinct rarer buffs and a rarest shield',()=>{
  const counts={coins:0,food:0,zhivchik:0,heal:0,pepsi:0};
  for(let i=0;i<10000;i++){const loot=rollAdventureLoot(5,i/10000);counts[loot.kind==='coins'?'coins':loot.buff]++;if(loot.kind==='coins')assert.ok(loot.amount>=65&&loot.amount<=100);}
  assert.deepEqual(counts,{coins:8500,food:600,zhivchik:400,heal:400,pepsi:100});
  for(const n of [NaN,Infinity,-5,0])assert.deepEqual(rollAdventureLoot(1,n),{kind:'coins',amount:25});
  assert.deepEqual(rollAdventureLoot(1,1),{kind:'buff',buff:'pepsi'});
});

test('a chest unlocks with its room and opens from front, back or side, with exactly one payout',()=>{
  for(const [dx,dy]of [[0,32],[0,-32],[42,0],[-42,0]]){
    let paid=0;const e=start({random:()=>.4},{collect:n=>paid+=n});approach(e,0,dx,dy);
    assert.equal(e.openChest(),false);assert.equal(e.view().interaction,'');clear(e,0);approach(e,0,dx,dy);
    e.pause();assert.equal(e.openChest(),false);e.resume();assert.equal(e.view().interaction,'Открыть сундук');e.interact();assert.equal(paid,0);assert.equal(e.chests[0].drop.active,true);settle(e);
    assert.equal(e.chests[0].opened,true);assert.equal(paid,e.chests[0].loot.amount);assert.equal(e.openChest(),false);assert.equal(paid,e.collectedCoins);assert.equal(e.chests[0].drop.claimed,true);
  }
});

test('death retains claimed chests and unopened rolls; a new selected run creates new rewards',()=>{
  let paid=0,rolls=0;const e=start({random:()=>{rolls++;return .2;}},{collect:n=>paid+=n});clear(e,0);approach(e,0);e.openChest();settle(e);
  const loot=structuredClone(e.chests.map(c=>c.loot)),earned=paid;e.phase='dead';e.restart();assert.equal(rolls,e.chests.length);assert.equal(e.chests[0].opened,true);assert.deepEqual(e.chests.map(c=>c.loot),loot);
  clear(e,0);approach(e,0);assert.equal(e.openChest(),false);assert.equal(paid,earned);
  e.completedLevel=1;e.pause();e.exitToApartment();assert.equal(e.selectLevel(1),false);assert.equal(e.selectLevel(2),true);assert.ok(rolls>loot.length);assert.ok(e.chests.every(c=>!c.opened));
});

test('buff loot is added to stock without using it; full stock falls back to coins',()=>{
  for(const [roll,buff]of [[.87,'food'],[.93,'zhivchik'],[.97,'heal'],[.995,'pepsi']]){
    const limit=buffStockLimit(buff);let stock=limit-1,paid=0;const e=start({random:()=>roll},{collect:n=>paid+=n,lootBuff:kind=>{assert.equal(kind,buff);if(stock>=limit)return false;stock++;return true;}});
    e.player.hp=2;clear(e,0);approach(e,0);assert.equal(e.openChest(),true);settle(e);assert.equal(stock,limit);assert.equal(paid,0);assert.equal(e.player.hp,2);assert.equal(e.shieldReady,false);assert.equal(e.chests[0].loot.buff,buff);assert.equal(e.chests[0].drop.claimed,true);
    clear(e,1);approach(e,1);assert.equal(e.openChest(),true);settle(e);assert.equal(stock,limit);assert.equal(paid,45);assert.equal(e.chests[1].drop.claimed,true);
  }
});

test('the last kill leaves time to move and open loot, then explicit finish pays ground coins and saves once',()=>{
  let paid=0;const saved=[],completed=[];const e=start({random:()=>.2},{collect:n=>paid+=n,checkpoint:n=>saved.push(n),levelComplete:n=>completed.push(n)});
  assert.equal(e.finishLevel(),false);prepareDungeonFinish(e);assert.equal(e.view().canFinish,true);
  e.setInput(1,0,false);const x=e.player.x;for(let i=0;i<1800;i++)e.advance(ADVENTURE_STEP);assert.equal(e.phase,'playing');assert.ok(e.player.x>x);assert.deepEqual(saved,[]);assert.deepEqual(completed,[]);e.setInput(0,0,false);
  // Return to a chest in an earlier room before voluntarily ending the level.
  approach(e,0);assert.equal(e.openChest(),true);settle(e);approach(e,2);assert.equal(e.openChest(),true);settle(e);
  Object.assign(e.coins[0],{active:true,x:e.player.x-140,y:e.player.y,age:0});const before=paid;
  e.player.x=e.levelData.exit.x;e.player.y=e.levelData.exit.y+40;e.pause();assert.equal(e.finishLevel(),false);e.resume();assert.equal(e.finishLevel(),true);assert.equal(paid,before+1);assert.deepEqual(saved,[3]);assert.deepEqual(completed,[1]);assert.equal(e.phase,'won');assert.equal(e.finishLevel(),false);assert.equal(paid,before+1);
});

test('pixel chests sort by their feet, animate the lid, show lock/readiness and reuse all nodes',()=>{
  const e=start({random:()=>.3}),svg=parseAdventureSvg(renderToStaticMarkup(React.createElement(AdventureScene,{area:'sewer'}))),r=new AdventureRenderer(svg,false),c=svg.querySelector('[data-chest="0"]'),actors=svg.querySelector('[data-actors]');
  assert.equal(svg.querySelectorAll('[data-chest]').length,e.levelData.rooms.length);e.player.y=e.chests[0].y-40;r.paint(e,true);assert.ok(actors.children.indexOf(c)>actors.children.indexOf(svg.querySelector('[data-player]')));assert.equal(c.querySelector('[data-chest-lock]').getAttribute('display'),'inline');
  clear(e,0);approach(e,0);r.paint(e);assert.ok(actors.children.indexOf(c)<actors.children.indexOf(svg.querySelector('[data-player]')));assert.equal(c.querySelector('[data-chest-ready]').getAttribute('display'),'inline');e.openChest();r.paint(e);assert.equal(c.querySelector('[data-chest-lid]').getAttribute('transform'),'translate(0 0)');
  resetSvgMetrics();for(let i=0;i<60;i++){e.advance(ADVENTURE_STEP);r.paint(e);}assert.equal(svgMetrics.created,0);assert.equal(c.querySelector('[data-chest-lid]').getAttribute('transform'),'translate(0 -18)');assert.equal(c.querySelector('[data-chest-ready]').getAttribute('display'),'none');assert.equal(c.querySelector('[data-chest-interior]').getAttribute('display'),'inline');
  new AdventureRenderer(svg,true).paint(e);assert.equal(c.querySelector('[data-chest-lid]').getAttribute('transform'),'translate(0 -18)');
});
