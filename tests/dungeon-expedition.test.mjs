import './helpers/tsx-loader.mjs';
import test from'node:test';import assert from'node:assert/strict';import{createElement as h}from'react';import{renderToStaticMarkup as render}from'react-dom/server';import sharp from'sharp';
import{dungeonGame}from'./helpers/dungeon-fixtures.mjs';import{emptyWeaponUpgrades}from'../app/weapon-progression.ts';import{HOME_ARMORY}from'../app/home-armory.ts';import{HOME_SOLIDS}from'../app/apartment-world.ts';import{APARTMENT_DESTINATIONS}from'../app/apartment-interactions.ts';import{parseAdventureSvg}from'./helpers/adventure-svg-dom.mjs';
const{DungeonCampaignMenu}=await import('../app/dungeon-menu.tsx');const{DungeonZoneBackdrop}=await import('../app/dungeon-zone-art.tsx');const{HomeArmoryArt}=await import('../app/home-armory-art.tsx');const{ArmoryRoom}=await import('../app/armory-room.tsx');

test('the fullscreen carousel contains seven separate five-level zones and only the next route is playable',()=>{
 for(const completed of[1,4,5,24,34,35]){const e=dungeonGame(Math.max(2,Math.min(35,completed+1)));e.completedLevel=completed;const root=parseAdventureSvg(render(h(DungeonCampaignMenu,{view:e.view(),zone:Math.min(7,Math.floor(completed/5)+1),onZone(){},onLevel(){},onClose(){}}))),zones=root.querySelectorAll('[data-zone]');assert.equal(zones.length,7);
  for(const zone of zones)assert.equal(zone.querySelectorAll('[data-level]').length,5);
  const enabled=root.querySelectorAll('[data-level]').filter(n=>n.getAttribute('disabled')===null);assert.equal(enabled.length,completed===35?0:1);if(enabled.length)assert.equal(Number(enabled[0].getAttribute('data-level')),completed+1);
 }
});

test('every zone has its own authored pixel silhouette and palette, without gradients, images or filter passes',async()=>{
 const hashes=new Set();for(let zone=1;zone<=7;zone++){const source=render(h(DungeonZoneBackdrop,{zone}));assert.ok(!/<(?:image|filter|linearGradient|radialGradient)\b/.test(source));const image=await sharp(Buffer.from(source.replace('<svg ','<svg xmlns="http://www.w3.org/2000/svg" width="160" height="300" '))).png().toBuffer();hashes.add(image.toString('base64'));}assert.equal(hashes.size,7);
});

test('the hall rack is a real obstacle and interaction, displays every slot and keeps closed weapons unpurchasable',()=>{
 assert.ok(HOME_SOLIDS.includes(HOME_ARMORY.body));assert.ok(APARTMENT_DESTINATIONS.some(d=>d.id==='armory'&&d.room==='hall'));
 for(const low of[false,true]){const svg=parseAdventureSvg(render(h(HomeArmoryArt,{theme:'night',weaponTier:2,upgrades:emptyWeaponUpgrades(),low}))),slots=svg.querySelectorAll('[data-rack-weapon]');assert.equal(slots.length,8);assert.equal(slots.filter(n=>n.getAttribute('data-rack-locked')==='true').length,5);}
 const root=parseAdventureSvg(render(h(ArmoryRoom,{theme:'classic',wallet:0,weaponTier:0,upgrades:emptyWeaponUpgrades(),onUpgrade(){throw Error('SSR cannot purchase');},onClose(){}})));assert.equal(root.querySelectorAll('[data-weapon-locked="true"]').length,7);assert.ok(root.querySelector('[class="home-room-primary"]').getAttribute('disabled')!==null);
 let selected;const e=dungeonGame(2,{}, {homePanel:id=>selected=id});e.pause();e.exitToApartment();e.player.x=650;e.player.y=790;e.phase='playing';assert.equal(e.interactDestination('armory'),true);assert.equal(selected,'armory');assert.equal(e.phase,'paused');
});
