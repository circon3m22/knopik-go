import './helpers/tsx-loader.mjs';
import test from 'node:test';import assert from 'node:assert/strict';
import{createElement as h}from'react';import{renderToStaticMarkup as render}from'react-dom/server';import sharp from'sharp';
import{WEAPON_ORDER}from'../app/adventure-levels.ts';import{KnopikSkinPainter}from'../app/knopik-skins.ts';
import{parseAdventureSvg}from'./helpers/adventure-svg-dom.mjs';
const{AdventureWeaponArt}=await import('../app/adventure-level-art.tsx');
const{WEAPON_DRAWINGS,WEAPON_MATERIALS}=await import('../app/dungeon-weapon-art.tsx');
const{AnimatedAdventureKnopik}=await import('../app/knopik-adventure-art.tsx');

test('every held weapon uses the same drawing as its icon, keeps firing nodes and ignores character fur recoloring',()=>{
 const rig=parseAdventureSvg(render(h(AnimatedAdventureKnopik))),palette=new Set(Object.values(WEAPON_MATERIALS));
 for(const weapon of WEAPON_ORDER.filter(w=>w!=='fist')){
  const icon=parseAdventureSvg(render(h(AdventureWeaponArt,{weapon,icon:true}))),master=icon.querySelector(`[data-weapon-art="${weapon}"]`),held=rig.querySelector(`[data-held="${weapon}"]`),drawing=held.querySelector(`[data-weapon-art="${weapon}"]`);
  const paths=root=>root.children.filter(n=>n.tagName==='path').map(n=>[n.getAttribute('fill'),n.getAttribute('d')]);
  assert.deepEqual(paths(master),paths(drawing),`${weapon}: icon must use the held master`);
  assert.ok(paths(master).every(([fill])=>palette.has(fill)));
  const before=paths(drawing);new KnopikSkinPainter(drawing).paint('shiba-black');assert.deepEqual(paths(drawing),before,`${weapon}: fur painter must not recolor steel/wood`);
  assert.equal(held.querySelectorAll('[data-knopik-muzzle]').length,weapon==='sabre'?0:1);
  assert.ok(!render(h(AdventureWeaponArt,{weapon,icon:true})).match(/<(?:image|filter|linearGradient|radialGradient)\b/));
 }
 assert.equal(Object.keys(WEAPON_DRAWINGS).length,7);
});

test('all inventory icons rasterize without touching or exceeding their viewBox edges',async()=>{
 for(const weapon of WEAPON_ORDER){
  const markup=render(h(AdventureWeaponArt,{weapon,icon:true})).replace('<svg ','<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" ');
  const{data,info}=await sharp(Buffer.from(markup)).ensureAlpha().raw().toBuffer({resolveWithObject:true});let pixels=0;
  for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++){
   const a=data[(y*info.width+x)*4+3];if(a){pixels++;assert.ok(x>0&&y>0&&x<255&&y<255,`${weapon}: artwork touches crop edge`);}
  }
  assert.ok(pixels>700,`${weapon}: visible drawing is missing`);
 }
});
