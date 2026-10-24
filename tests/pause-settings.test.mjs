import './helpers/tsx-loader.mjs';
import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createDefaultSave,sanitizeSave,SAVE_VERSION} from '../app/game-logic.ts';
import {RunnerEngine} from '../app/runner-engine.ts';
import {NeighborhoodEngine} from '../app/neighborhood-engine.ts';
import {defaultNeighborhoodProgress} from '../app/neighborhood-progress.ts';
import {dungeonGame,tickDungeon} from './helpers/dungeon-fixtures.mjs';
const {GamePreferences}=await import('../app/game-preferences.tsx');
const {GraphicsQualityPicker}=await import('../app/graphics-quality-picker.tsx');
const {GameSettingsAccess,PauseSettingsButton}=await import('../app/game-settings-access.tsx');
const silent={phase(){},coins(){},finish(){},sound(){},zone(){},route(){}};
function descendants(element,predicate){if(!element||typeof element!=='object')return [];return [...(predicate(element)?[element]:[]),...React.Children.toArray(element.props?.children).flatMap(e=>descendants(e,predicate))];}

test('graphics choices persist and version 28 migration preserves paid stock, balance and progress',()=>{
 const old={...createDefaultSave(),version:28,walletCoins:45678,vaultCoins:9012,healCount:3,vitaPowerCount:3,storyCompletedLevel:12,storyWeaponTier:3,runnerBest:8320,settings:{sound:false,vibration:false,suliman:false,yellow:false}};
 const migrated=sanitizeSave(old);assert.equal(migrated.version,SAVE_VERSION);assert.equal(migrated.walletCoins,old.walletCoins);assert.equal(migrated.vaultCoins,old.vaultCoins);assert.equal(migrated.storyCompletedLevel,12);assert.equal(migrated.runnerBest,8320);assert.equal(migrated.healCount,3);assert.equal(migrated.vitaPowerCount,3);assert.equal(migrated.settings.graphics,'auto');
 for(const graphics of ['auto','sharp','fast'])assert.equal(sanitizeSave({...migrated,settings:{...migrated.settings,graphics}}).settings.graphics,graphics);
 assert.equal(sanitizeSave({...migrated,settings:{...migrated.settings,graphics:'broken'}}).settings.graphics,'auto');
});

test('settings controls update only their own preference and expose touch sized accessible switches',()=>{
 let settings=createDefaultSave().settings;const render=()=>GamePreferences({settings,onChange:update=>{settings=update(settings);}});
 for(const name of ['Звук','Вибрация']){
  const toggle=descendants(render(),e=>e.props?.role==='switch'&&e.props['aria-label']===name)[0];assert.equal(toggle.props['aria-checked'],true);toggle.props.onClick();
 }
 assert.equal(settings.sound,false);assert.equal(settings.vibration,false);
 const runChoices=descendants(render(),e=>e.type===GraphicsQualityPicker)[0];
 assert.equal(runChoices.props.value,'medium');runChoices.props.onSelect('low');assert.equal(settings.graphics,'fast');assert.equal(settings.worldGraphics,'fast');assert.equal(settings.graphicsQuality,'low');assert.equal(settings.sound,false);
 descendants(render(),e=>e.type===GraphicsQualityPicker)[0].props.onSelect('ultra');assert.equal(settings.graphics,'extreme');assert.equal(settings.worldGraphics,'extreme');assert.equal(settings.graphicsQuality,'ultra');assert.equal(settings.sound,false);
 const html=renderToStaticMarkup(React.createElement(GameSettingsAccess.Provider,{value:{active:true,open(){}}},React.createElement(PauseSettingsButton)));
 assert.match(html,/Настройки/);assert.match(html,/type="button"/);assert.match(html,/aria-hidden="true"/);
});

test('applying Run options during pause preserves the clock, generated world, pickups and route',()=>{
 const e=new RunnerEngine(silent,{immortal:true});e.start();for(let i=0;i<200;i++)e.update(1/60);e.pause();
 const snapshot={distance:e.distance,elapsed:e.elapsed,coins:e.coins,objects:structuredClone(e.objects),seed:e.seed};
 for(const graphics of ['fast','sharp','auto']){
  const settings=sanitizeSave({...createDefaultSave(),settings:{...createDefaultSave().settings,graphics,vibration:false,sound:false}}).settings;
  e.setOptions({...e.options,immortal:settings.suliman});for(let i=0;i<180;i++)e.update(1/60);
  assert.equal(e.phase,'paused');assert.deepEqual({distance:e.distance,elapsed:e.elapsed,coins:e.coins,objects:e.objects,seed:e.seed},snapshot);
 }
 e.resume();e.update(1/60);assert.ok(e.distance>snapshot.distance);
});

test('paused dungeon pump and street job clocks stay frozen while preferences change',()=>{
 const dungeon=dungeonGame(1),i=dungeon.levelData.tasks.findIndex(t=>t.kind==='hold');dungeon.dungeon.tasks[0].done=dungeon.dungeon.tasks[1].done=true;dungeon.dungeon.activate(i,dungeon.time);dungeon.pause();
 const pump=structuredClone(dungeon.dungeon.tasks),time=dungeon.time;dungeon.setImmortal(true);tickDungeon(dungeon,10);assert.deepEqual(dungeon.dungeon.tasks,pump);assert.equal(dungeon.time,time);assert.equal(dungeon.phase,'paused');
 const street=new NeighborhoodEngine(defaultNeighborhoodProgress(),{change(){},progress(){},home(){},run(){},sound(){}});street.beginVisit();street.pause();const before=structuredClone({player:street.player,animation:street.animationState});for(let f=0;f<120;f++)street.advance(1/60);assert.equal(street.paused,true);assert.deepEqual({player:street.player,animation:street.animationState},before);
});

test('first pump has one guard and two small fist friendly waves that cannot overlap',()=>{
 const e=dungeonGame(1),runtime=e.dungeon,i=e.levelData.tasks.findIndex(t=>t.kind==='hold'),task=e.levelData.tasks[i];
 assert.equal(e.enemies.filter(n=>n.room===task.room&&!n.wave).length,1);
 const reinforcements=e.enemies.filter(n=>n.trigger===i);assert.equal(reinforcements.length,4);assert.ok(reinforcements.every(n=>n.role==='grunt'&&n.kind==='bat'));
 e.enemies.filter(n=>n.room===task.room&&!n.wave).forEach(n=>n.hp=0);runtime.tasks[0].done=runtime.tasks[1].done=true;assert.equal(runtime.activate(i,0),true);
 const first=reinforcements.filter(n=>n.wave===1),second=reinforcements.filter(n=>n.wave===2);assert.equal(first.length,2);assert.ok(first.every(n=>n.awake));assert.ok(second.every(n=>!n.awake));
 runtime.step(10,10,task,task.room,e.enemies);assert.equal(runtime.tasks[i].wave,1);assert.equal(runtime.tasks[i].done,false);
 first[0].hp=0;runtime.step(1,11,task,task.room,e.enemies);assert.equal(runtime.tasks[i].wave,1);
 first[1].hp=0;runtime.step(1,12,task,task.room,e.enemies);assert.equal(runtime.tasks[i].wave,2);assert.equal(runtime.tasks[i].done,false);assert.ok(second.every(n=>n.awake));
 runtime.step(1,13,task,task.room,e.enemies);assert.equal(runtime.tasks[i].done,false);second.forEach(n=>n.hp=0);runtime.step(1/60,14,task,task.room,e.enemies);assert.equal(runtime.tasks[i].done,true);assert.equal(runtime.activate(i,15),false);
});
