import './helpers/tsx-loader.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {dungeonGame,prepareDungeonFinish,tickDungeon} from './helpers/dungeon-fixtures.mjs';
import {ADVENTURE_LEVELS} from '../app/adventure-levels.ts';
import {dungeonExitTarget,exitPointerPose} from '../app/dungeon-navigation.ts';
import {parseAdventureSvg} from './helpers/adventure-svg-dom.mjs';
const {AdventureScene,AdventureRenderer}=await import('../app/adventure-artwork.tsx');
test('every level has a finite exit direction through open corridors from all its rooms',()=>{
 for(const l of ADVENTURE_LEVELS){const e=dungeonGame(l.id);prepareDungeonFinish(e);for(let room=0;room<l.rooms.length;room++){e.room=room;const r=l.rooms[room];e.player.x=r.x+r.w/2;e.player.y=r.y+r.h/2;const target=dungeonExitTarget(e);assert.ok(Number.isFinite(target.x)&&Number.isFinite(target.y));if(room===l.exit.room)assert.deepEqual(target,l.exit);else assert.ok(l.gates.some(g=>Math.abs(target.x-g.x-g.w/2)<=120.01&&Math.abs(target.y-g.y-g.h/2)<=120.01));}}
});
test('screen arrows stay within the visible camera on all four edges, including a short landscape screen',()=>{
 for(const h of [250,600,800])for(const t of [{x:-900,y:100},{x:2000,y:100},{x:200,y:-1000},{x:200,y:3000}]){const pose=exitPointerPose({x:0,y:0,w:480,h},{x:240,y:h/.82*.58},t);assert.ok(pose.x>=36&&pose.x<=444);assert.ok(pose.y>=0&&pose.y<h);assert.ok(Number.isFinite(pose.angle));}
 const right=exitPointerPose({x:0,y:0,w:480,h:680},{x:240,y:400},{x:1600,y:400});assert.ok(Math.abs(right.angle)<5);assert.equal(right.x,444);
});
test('the screen exit arrow appears after objectives and the final fight, and hides on pause or unfinished runs',()=>{
 const e=dungeonGame(25),svg=parseAdventureSvg(renderToStaticMarkup(React.createElement(AdventureScene,{area:'sewer',level:25}))),r=new AdventureRenderer(svg,true);r.resize(480,680);r.paint(e,true);const arrow=svg.querySelector('[data-exit-pointer]');assert.equal(arrow.getAttribute('display'),'none');prepareDungeonFinish(e);r.paint(e,true);assert.equal(arrow.getAttribute('display'),'inline');assert.ok(!/NaN|Infinity/.test(arrow.getAttribute('transform')));e.pause();r.paint(e);assert.equal(arrow.getAttribute('display'),'none');
});
test('uncollected chest drops survive death and reward once when they attract; finishing settles an opened drop',()=>{
 let paid=0;const e=dungeonGame(1,{}, {collect:n=>paid+=n});e.cleared[0]=true;const c=e.chests[0];e.player.x=c.x;e.player.y=c.y+32;e.openChest();assert.equal(paid,0);tickDungeon(e,.4);assert.equal(c.drop.active,true);e.phase='dead';e.restart();e.player.x=c.drop.x+40;e.player.y=c.drop.y;tickDungeon(e,2);assert.equal(paid,c.loot.amount);assert.equal(c.drop.claimed,true);tickDungeon(e,2);assert.equal(paid,c.loot.amount);
 prepareDungeonFinish(e);const last=e.chests.at(-1);e.player.x=last.x;e.player.y=last.y+32;e.openChest();assert.equal(last.drop.active,true);e.player.x=e.levelData.exit.x;e.player.y=e.levelData.exit.y+40;e.finishLevel();assert.equal(last.drop.claimed,true);assert.equal(paid,c.loot.amount+last.loot.amount);
});
