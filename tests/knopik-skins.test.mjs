import './helpers/tsx-loader.mjs';
import test from 'node:test';import assert from 'node:assert/strict';
import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';
import {KNOPIK_SKINS,purchaseKnopikSkin,KnopikSkinPainter,knopikSkinColor,knopikEyePalette} from '../app/knopik-skins.ts';
import {createDefaultSave,sanitizeSave} from '../app/game-logic.ts';
import {CoopEngine,readCoopSnapshot} from '../app/coop-engine.ts';
import {readCoopEquipment,COOP_PROTOCOL} from '../app/coop-protocol.ts';
import {packCoopSnapshot,unpackCoopSnapshot} from '../app/coop-wire.ts';
import {parseAdventureSvg} from './helpers/adventure-svg-dom.mjs';
const {paintWardrobePreview}=await import('../app/wardrobe-preview.ts');
import {cloneRunnerScene} from '../app/runner-scene-model.ts';
const {PixelDog}=await import('../app/pixel-artwork.tsx');
const {AnimatedAdventureKnopik}=await import('../app/knopik-adventure-art.tsx');
const {AdventureScene,AdventureRenderer}=await import('../app/adventure-artwork.tsx');
const {RunnerDog}=await import('../app/runner-artwork.tsx');
const gear=skin=>({skin,hat:true,mohawk:false,accessory:'cape'});
const setup={mode:'campaign',level_id:25,host_equipment:gear('shiba-white'),guest_equipment:gear('shiba-black')};
const fills=root=>root.querySelectorAll('[fill]').map(n=>n.getAttribute('fill'));

test('each paid Shiba costs exactly 49 AURA; selecting an owned skin never charges twice',()=>{
 let state={ownedSkins:['classic'],auraCoins:98};
 for(const skin of ['shiba-white','shiba-black']){
  assert.equal(KNOPIK_SKINS[skin].price,49);const before=state.auraCoins;
  state=purchaseKnopikSkin(state.ownedSkins,state.auraCoins,skin);assert.equal(state.auraCoins,before-49);assert.equal(state.activeSkin,skin);
  const again=purchaseKnopikSkin(state.ownedSkins,state.auraCoins,skin);assert.equal(again.auraCoins,state.auraCoins);assert.deepEqual(again.ownedSkins,state.ownedSkins);
 }
 assert.equal(state.auraCoins,0);assert.equal(purchaseKnopikSkin(['classic'],48,'shiba-white'),null);assert.equal(purchaseKnopikSkin(['classic'],-1,'shiba-white'),null);assert.equal(purchaseKnopikSkin(['classic'],49.5,'shiba-black'),null);assert.equal(purchaseKnopikSkin(['classic'],100,'fake'),null);
 assert.equal(purchaseKnopikSkin(state.ownedSkins,0,'classic').activeSkin,'classic');
});
test('Save33 keeps purchased skins and Aura together, preserves Save32 progress and rejects unowned selection',()=>{
 const save={...createDefaultSave(),auraCoins:51,ownedSkins:['classic','shiba-white','fake','shiba-white'],activeSkin:'shiba-white',walletCoins:123,vaultCoins:456};
 const result=sanitizeSave(JSON.parse(JSON.stringify(save)));assert.deepEqual(result.ownedSkins,['classic','shiba-white']);assert.equal(result.activeSkin,'shiba-white');assert.equal(result.auraCoins,51);
 assert.equal(sanitizeSave({...save,activeSkin:'shiba-black'}).activeSkin,'classic');
 const previous=sanitizeSave({...save,version:32});assert.equal(previous.auraCoins,51);assert.equal(previous.walletCoins,123);assert.equal(previous.vaultCoins,456);assert.deepEqual(previous.ownedSkins,['classic']);assert.equal(previous.activeSkin,'classic');
});
test('tap portraits draw distinct native SVG fur while retaining dark eyes and worn accessories',()=>{
 for(const skin of ['classic','shiba-white','shiba-black']){
  const svg=parseAdventureSvg(renderToStaticMarkup(React.createElement(PixelDog,{skin,ears:true,outfit:{hat:true,mohawk:false,accessory:'cape',hatBounce:0,mohawkSwing:0}})));
  assert.ok(fills(svg).includes(knopikSkinColor('#d69a5b',skin)));assert.ok(fills(svg).includes('#312b27'));
  assert.ok(!renderToStaticMarkup(React.createElement(PixelDog,{skin,ears:true})).includes('<image'));
 }
});
test('all eight avatar angles and rolls use the chosen fur; a rebuilt wardrobe painter can change skins again',()=>{
 const root=parseAdventureSvg(renderToStaticMarkup(React.createElement('svg',{},React.createElement(AnimatedAdventureKnopik))));
 for(const skin of ['shiba-white','shiba-black','classic'])for(let i=0;i<8;i++){
  paintWardrobePreview(root,gear(skin),i*Math.PI/4);assert.ok(fills(root.querySelector('[data-knopik-skin]')).includes(knopikSkinColor('#d69a5b',skin)));assert.ok(fills(root.querySelector('[data-knopik-roll]')).includes(knopikSkinColor('#d69a5b',skin)));
 }
 assert.ok(!fills(root.querySelector('[data-knopik-skin]')).includes(knopikSkinColor('#d69a5b','shiba-black')));
});
test('both clients retain different skins through authoritative snapshots, rendering and host recovery',()=>{
 const host=new CoopEngine(123,2,()=>{},setup),guest=new CoopEngine(123,2,()=>{},setup);
 const s=unpackCoopSnapshot(JSON.parse(JSON.stringify(packCoopSnapshot(host.snapshot()))),guest);assert.ok(s);guest.applySnapshot(s);
 assert.deepEqual(guest.actors.map(a=>a.equipment.skin),['shiba-white','shiba-black']);
 const restore=readCoopSnapshot(JSON.parse(JSON.stringify(host.snapshot())),guest);assert.ok(restore);guest.applySnapshot(restore);
 for(const slot of [0,1]){
  const svg=parseAdventureSvg(renderToStaticMarkup(React.createElement(AdventureScene,{layout:guest.levelData,area:'sewer',level:25,coop:{slot,self:'Self',partner:'Partner'}})));
  const renderer=new AdventureRenderer(svg,true);renderer.resize(390,520);guest.forPlayer(slot,()=>renderer.paint(guest,true,guest.companion(slot===0?1:0)));
  assert.ok(fills(svg.querySelector('[data-player-body]')).includes(knopikSkinColor('#d69a5b',guest.actors[slot].equipment.skin)));
  assert.ok(fills(svg.querySelector('[data-coop-partner-body]')).includes(knopikSkinColor('#d69a5b',guest.actors[slot===0?1:0].equipment.skin)));
 }
 assert.equal(readCoopEquipment({...gear('shiba-black'),skin:'fake'}),null);assert.equal(COOP_PROTOCOL,5);
});
test('Run cached head, tail, hands, feet and roll symbols receive the selected fur and cache stamp',()=>{
 const root=parseAdventureSvg(renderToStaticMarkup(React.createElement('svg',{},React.createElement('defs'),React.createElement(RunnerDog))));
 const wrap=(n,parent=null)=>{const e={localName:n.tag,attributes:[...n.attrs].map(([name,value])=>({name,value})),style:{length:0},id:n.id,textContent:n.textContent,getBBox:()=>({x:-60,y:-150,width:120,height:160}),hasAttribute:k=>n.attrs.has(k),closest:s=>s==='defs'&&(n.tag==='defs'||parent?.closest(s))?e:null};e.children=n.children.map(c=>wrap(c,e));return e;};
 const scene=cloneRunnerScene(wrap(root),()=>({x:0,y:0,width:360,height:680}));
 const painter=new KnopikSkinPainter(scene,id=>scene.ownerDocument.ids.get(id)??null);
 for(const skin of ['shiba-white','shiba-black','classic']){
  painter.paint(skin);const symbols=[...scene.ownerDocument.ids].filter(([id])=>id.startsWith('canvas-rig-'));
  assert.ok(symbols.length>=7);for(const [id,art] of symbols){assert.equal(art.getAttribute('data-knopik-skin'),skin,id);if(id==='canvas-rig-head')assert.ok(art.querySelectorAll('[fill]').some(n=>n.getAttribute('fill')===knopikSkinColor('#d69a5b',skin)));}
 }
});


test('tap torso follows the head palette, eyes change with skin and clothing keeps its own colours',()=>{
 const eyes=[];
 for(const skin of ['classic','shiba-white','shiba-black'])for(const mood of ['calm','warning','rage']){
  const svg=parseAdventureSvg(renderToStaticMarkup(React.createElement(PixelDog,{skin,mood,ears:true,outfit:{hat:true,mohawk:false,accessory:'cape'}})));
  const body=svg.querySelector('[data-tap-body]');assert.equal(body.getAttribute('data-tap-body'),skin);
  assert.deepEqual(fills(body),['#a36d40','#d69a5b','#f4e5c7','#fff1d4'].map(fill=>knopikSkinColor(fill,skin)));
  assert.ok(fills(svg.querySelector('[data-tap-worn="cape"]')).includes('#4b5c90'));
  assert.ok(fills(svg).includes(mood==='warning'?knopikEyePalette(skin).iris:mood==='rage'?knopikEyePalette(skin).light:knopikEyePalette(skin).pupil));
  if(mood==='calm')eyes.push(knopikEyePalette(skin).iris);
 }
 assert.equal(new Set(eyes).size,3);
});
