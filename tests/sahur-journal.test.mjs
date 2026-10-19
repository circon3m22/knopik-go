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

test('field notes keep the portrait in the heading and leave both descriptions a full-width row',async()=>{
 const {parseAdventureSvg}=await import('./helpers/adventure-svg-dom.mjs');
 const {SAHUR_KINDS}=await import('../app/sahur-journal.ts');
 const html=render(h(HunterBestiary,{seenSahurs:SAHUR_KINDS}));assert.doesNotMatch(html,/hunter-bestiary/);
 const root=parseAdventureSvg(html),cards=root.querySelectorAll('[data-sahur-entry]');assert.equal(cards.length,8);
 for(const card of cards){
  assert.deepEqual(card.children.map(n=>n.tag),['header','p','section']);
  const portrait=card.children[0].children[0];assert.equal(portrait.tag,'svg');assert.equal(portrait.getAttribute('viewBox'),'-90 -130 180 180');
  assert.ok(card.children[1].textContent.length>20);assert.ok(card.children[2].querySelector('p').textContent.length>20);
 }
 const counter=root.querySelector('[class="journal-discoveries"]');assert.equal(counter.children.length,8);assert.ok(counter.children.every(n=>n.getAttribute('data-filled')==='true'));
 const {readFileSync}=await import('node:fs');const postcss=(await import('postcss')).default;
 const old=readFileSync(new URL('../app/hunter-update.css',import.meta.url),'utf8');assert.doesNotMatch(old,/\.hunter-bestiary/,'retired two-column details selectors must be removed');
 const css=postcss.parse(readFileSync(new URL('../app/dungeon-expedition.css',import.meta.url),'utf8'));
 const declarations={};css.walkRules('.journal-card-list',r=>r.walkDecls(d=>declarations[d.prop]=d.value));assert.equal(declarations['grid-template-columns'],'minmax(0,1fr)');
});

test('weapon cards show the current upgraded values and rules remain separate readable articles',async()=>{
 const {GuideWeapons,GuideRules,DungeonGuide}=await import('../app/hunter-bestiary.tsx');
 const {parseAdventureSvg}=await import('./helpers/adventure-svg-dom.mjs');
 const {ADVENTURE_WEAPONS}=await import('../app/adventure-levels.ts');
 const upgrades={...createDefaultSave().weaponUpgrades,fist:3},item=ADVENTURE_WEAPONS.fist;
 const root=parseAdventureSvg(render(h(GuideWeapons,{weaponTier:0,upgrades}))),cards=root.querySelector('[class="journal-card-list"]').children;
 assert.equal(cards.length,1);const values=cards[0].querySelectorAll('dd').map(n=>n.textContent);
 assert.deepEqual(values,[(item.damage*1.45).toLocaleString('ru-RU',{maximumFractionDigits:2}),(item.cooldown*.88).toLocaleString('ru-RU',{maximumFractionDigits:2})+' с']);
 assert.equal(cards[0].querySelectorAll('[data-filled="true"]').length,3);
 const rules=parseAdventureSvg(render(h(GuideRules)));assert.equal(rules.querySelector('[class="journal-card-list"]').children.length,7);
 const guide=parseAdventureSvg(render(h(DungeonGuide,{seenSahurs:[],weaponTier:0}))),nav=guide.querySelector('[class="journal-tabs"]'),region=guide.querySelector('[role="region"]');
 assert.equal(nav.children.length,3);assert.equal(nav.children.filter(n=>n.getAttribute('aria-pressed')==='true').length,1);
 assert.equal(region.getAttribute('aria-labelledby'),nav.children[0].id);assert.ok(nav.children.every(n=>n.getAttribute('aria-controls')===region.id));
});
