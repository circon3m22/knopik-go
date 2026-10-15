import './helpers/tsx-loader.mjs';
import test from 'node:test';import assert from 'node:assert/strict';
import React from 'react';import{renderToStaticMarkup}from'react-dom/server';
import {defaultCombatTraining,grantCombatTrainingKit,advanceCombatTraining,sanitizeCombatTraining,TRAINING_CARDS} from '../app/adventure-training.ts';
import {OPENING_CAPTIONS,OPENING_CUTS,openingFrame} from '../app/adventure-opening.ts';
import {createDefaultSave,sanitizeSave} from '../app/game-logic.ts';
import {dungeonGame,tickDungeon} from './helpers/dungeon-fixtures.mjs';
const{AdventureOpeningCinema}=await import('../app/adventure-opening-cinema.tsx');
test('four short subtitles explain the neighbourhood, noise, basement and first mission',()=>{
 assert.equal(OPENING_CAPTIONS.length,4);for(let i=0;i<4;i++){assert.ok(OPENING_CAPTIONS[i].length>20&&OPENING_CAPTIONS[i].length<100);assert.equal(openingFrame(OPENING_CUTS[i]+.2).shot,i);}
 const markup=renderToStaticMarkup(React.createElement(AdventureOpeningCinema,{clock:{current:null},theme:'night'}));assert.match(markup,/class="opening-caption"/);assert.ok(markup.includes(OPENING_CAPTIONS[0]));assert.ok(!markup.includes('opening-skip'));
});
test('the starter kit grants one heal, shield and Zhivchik once, respects caps and persists across reload',()=>{
 const result=grantCombatTrainingKit(defaultCombatTraining(),{heal:0,pepsi:0,zhivchik:0});assert.deepEqual(result.stock,{heal:1,pepsi:1,zhivchik:1});assert.equal(grantCombatTrainingKit(result.training,result.stock),null);
 const saved=sanitizeSave({...createDefaultSave(),combatTraining:result.training,healCount:1,vitaPowerCount:1,drinkCount:1});assert.equal(grantCombatTrainingKit(saved.combatTraining,{heal:saved.healCount,pepsi:saved.vitaPowerCount,zhivchik:saved.drinkCount}),null);
 assert.deepEqual(grantCombatTrainingKit(defaultCombatTraining(),{heal:3,pepsi:3,zhivchik:25}).stock,{heal:3,pepsi:3,zhivchik:25});
});
test('practice freezes enemies and hazards while letting the real move, attack and roll controls work',()=>{
 const e=dungeonGame(1);e.setPracticeStep(0);const enemies=e.enemies.map(n=>({x:n.x,y:n.y,hp:n.hp,timer:n.timer})),tasks=structuredClone(e.dungeon.tasks),x=e.player.x;e.setInput(1,0,false);tickDungeon(e,.2);assert.ok(e.player.x>x);e.setInput(0,0,true);tickDungeon(e,.1);assert.ok(e.punchSerial>0);e.dodge();tickDungeon(e,.1);assert.ok(e.dodged);assert.deepEqual(e.enemies.map(n=>({x:n.x,y:n.y,hp:n.hp,timer:n.timer})),enemies);assert.deepEqual(e.dungeon.tasks,tasks);
});
test('the heal lesson uses one gifted heal; shield and surge use their actual inventory and effects',()=>{
 let heal=1,shield=1,surge=1;const e=dungeonGame(1,{}, {consumeHeal:()=>heal>0&&!!heal--,activateShield:()=>shield>0&&!!shield--,consumeSurge:()=>surge>0&&!!surge--});e.setPracticeStep(3);assert.equal(e.player.hp,2);assert.equal(e.heal(),true);assert.equal(e.player.hp,3);assert.equal(heal,0);e.setPracticeStep(4);assert.equal(e.activateShield(),true);assert.equal(shield,0);assert.equal(e.shieldReady,true);e.setPracticeStep(5);assert.equal(e.activateSurge(),true);assert.equal(surge,0);assert.equal(e.surgeTime,7);e.setPracticeStep(6);assert.equal(e.practiceStep,-1);assert.equal(e.player.hp,3);assert.equal(e.shieldReady,true);assert.equal(e.surgeTime,7);
});
test('skipping restores the practice heart, exits protection and never restarts training or gives another kit',()=>{
 const e=dungeonGame(1);e.setPracticeStep(3);assert.equal(e.player.hp,2);e.setPracticeStep(6);assert.equal(e.player.hp,3);const n=e.enemies.find(n=>n.awake!==false),timer=n.timer;tickDungeon(e,.2);assert.notEqual(n.timer,timer);
 let p={step:3,kit:true};p=advanceCombatTraining(p,6);assert.equal(advanceCombatTraining(p,0).step,6);assert.equal(grantCombatTrainingKit(p,{heal:0,pepsi:0,zhivchik:0}),null);assert.deepEqual(sanitizeCombatTraining(undefined,1),{step:6,kit:true});assert.equal(TRAINING_CARDS.length,6);
 const legacy=sanitizeSave({...createDefaultSave(),version:29,storyCheckpoint:3,storyCompletedLevel:19,healCount:2});assert.deepEqual(legacy.combatTraining,{step:6,kit:true});assert.equal(legacy.healCount,2);
});
