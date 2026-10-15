import './helpers/tsx-loader.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {parseAdventureSvg} from './helpers/adventure-svg-dom.mjs';
const {AnimatedAdventureKnopik}=await import('../app/knopik-adventure-art.tsx');
const {paintWardrobePreview}=await import('../app/wardrobe-preview.ts');

test('the fitting room paints owned clothing and the correct complete avatar in all eight directions',()=>{
 const root=parseAdventureSvg(renderToStaticMarkup(React.createElement('svg',null,React.createElement(AnimatedAdventureKnopik))));
 for(const kind of ['hat','mohawk','bandana','charm','goggles','cape'])for(let turn=0;turn<8;turn++){
  const gear={hat:kind==='hat',mohawk:kind==='mohawk',accessory:['hat','mohawk'].includes(kind)?null:kind};
  paintWardrobePreview(root,gear,Math.PI/2-turn*Math.PI/4);
  assert.equal(root.querySelectorAll('[data-direction]').filter(n=>n.getAttribute('display')==='inline').length,1);
  const pieces=root.querySelectorAll(kind==='cape'?'[data-knopik-cape]':`[data-worn="${kind}"]`);
  assert.ok(pieces.length>0,kind);
  assert.ok(pieces.some(n=>n.getAttribute('display')==='inline'),kind+' must appear on preview');
 }
 paintWardrobePreview(root,{hat:false,mohawk:false,accessory:null},Math.PI/2);
 assert.ok(root.querySelectorAll('[data-worn]').every(n=>n.getAttribute('display')==='none'));
 assert.ok(root.querySelectorAll('[data-knopik-cape]').every(n=>n.getAttribute('display')==='none'));
});
