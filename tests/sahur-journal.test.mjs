import './helpers/tsx-loader.mjs';
import test from'node:test';import assert from'node:assert/strict';import{createElement as h}from'react';import{renderToStaticMarkup as render}from'react-dom/server';
import{encounteredSahurs,migrateSeenSahurs,sanitizeSeenSahurs}from'../app/sahur-journal.ts';import{createDefaultSave,sanitizeSave}from'../app/game-logic.ts';import{dungeonGame}from'./helpers/dungeon-fixtures.mjs';
const{HunterBestiary}=await import('../app/hunter-bestiary.tsx');

test('unseen creatures never render their names, portraits or tactics in the journal',()=>{
 const empty=render(h(HunterBestiary));assert.ok(empty.includes('Пока нет записей'));assert.ok(!empty.includes('data-journal-portrait'));
 const known=render(h(HunterBestiary,{seenSahurs:['grunt','charger']}));assert.ok(known.includes('Сахур с битой'));assert.ok(known.includes('Таран'));assert.ok(known.includes('ТАКТИКА'));for(const hidden of['Стрелок','Следопыт','Вожак','Броненосец','Подрывник'])assert.ok(!known.includes(hidden),hidden);assert.equal((known.match(/data-sahur-entry=/g)||[]).length,2);
});

test('encounters exclude sleeping reinforcements, distant enemies, dead enemies and the other room',()=>{
 const enemy={x:10,y:10,room:0,hp:2,kind:'bat',role:'grunt',awake:true};
 assert.deepEqual(encounteredSahurs([enemy,{...enemy,role:'stalker',awake:false},{...enemy,role:'marksman',room:1},{...enemy,role:'charger',x:1000},{...enemy,boss:true,hp:0}],0,{x:0,y:0}),['grunt']);
 const discoveries=[],e=dungeonGame(26,{immortal:true},{discoverSahur:k=>discoveries.push(k)});e.enemies.forEach(n=>n.hp=0);const r=e.levelData.rooms[0];e.player.x=r.x+r.w/2;e.player.y=r.y+r.h/2;Object.assign(e.enemies[0],{x:e.player.x+60,y:e.player.y,room:0,role:'stalker',awake:true,hp:20});
 e.advance(1/60);e.advance(1/60);assert.deepEqual(discoveries,['stalker']);
 Object.assign(e.enemies[0],{role:'marksman',room:1});e.advance(1/60);assert.deepEqual(discoveries,['stalker']);
});

test('known entries persist across saves; migration infers only completed routes and never future zones',()=>{
 const saved={...createDefaultSave(),seenSahurs:['stalker','grunt'],storyCompletedLevel:2};assert.deepEqual(sanitizeSave(JSON.parse(JSON.stringify(saved))).seenSahurs,['grunt','stalker']);
 const old=sanitizeSave({...saved,version:36,seenSahurs:['marksman']});assert.deepEqual(old.seenSahurs,migrateSeenSahurs(2));assert.ok(!old.seenSahurs.includes('marksman'));
 assert.deepEqual(sanitizeSeenSahurs(['grunt','fake','grunt']),['grunt']);assert.deepEqual(sanitizeSave({...saved,version:999}).seenSahurs,[]);
});
