import './helpers/tsx-loader.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {parseAdventureSvg} from './helpers/adventure-svg-dom.mjs';
import {svgMetrics,resetSvgMetrics} from './helpers/runner-svg-dom.mjs';
const {PixelDog}=await import('../app/pixel-artwork.tsx');
const {AnimatedAdventureKnopik}=await import('../app/knopik-adventure-art.tsx');
const {KnopikAnimator}=await import('../app/knopik-adventure-animation.ts');

test('worn portrait accessories share face coordinates and remain attached in every emotion',()=>{
 for(const accessory of ['bandana','charm','goggles','cape'])for(const mood of ['calm','joy','rage','warning']){
  const svg=parseAdventureSvg(renderToStaticMarkup(React.createElement(PixelDog,{ears:true,mood,joy:mood==='joy'?4:0,rage:mood==='rage'?4:0,outfit:{accessory,hat:false,mohawk:false}})));
  assert.equal(svg.getAttribute('viewBox'),'0 0 128 144');assert.equal(svg.querySelectorAll(`[data-tap-worn="${accessory}"]`).length,1);
  const layer=svg.querySelector(`[data-tap-outfit="${accessory==='cape'?'behind':'front'}"]`);assert.ok(layer.querySelector(`[data-tap-worn="${accessory}"]`));
  if(accessory==='cape')assert.ok(svg.querySelector('[data-tap-cape-clasp]'));
 }
 // Shop/other portraits retain their existing head-only viewport.
 assert.match(renderToStaticMarkup(React.createElement(PixelDog)),/viewBox="0 0 128 128"/);
});

test('cloak panel, neck clasp and eyewear follow all eight directions and disappear during a roll',()=>{
 const body=parseAdventureSvg(renderToStaticMarkup(React.createElement('svg',null,React.createElement(AnimatedAdventureKnopik)))).children[0],animator=new KnopikAnimator(body);
 const state={player:{x:0,y:0,angle:Math.PI/2},area:'apartment',weapon:'fist',punchTime:0,punchSerial:0,walkDistance:0,moving:false,dodgeTime:0,checkpoint:3,tutorialOpened:false,time:1};
 resetSvgMetrics();
 for(const accessory of ['bandana','charm','goggles','cape'])for(let d=0;d<8;d++){
  state.player.angle=Math.PI/2-d*Math.PI/4;state.equipment={hat:false,mohawk:false,accessory};animator.paint(state);
  if(accessory==='cape'){
   const visible=body.querySelectorAll('[data-knopik-cape]').filter(n=>n.getAttribute('display')==='inline');assert.equal(visible.length,1);
   const back=animator.facing.startsWith('back');assert.equal(body.querySelector('[data-knopik-cape-clasp]').getAttribute('display'),back?'none':'inline');
   state.dodgeTime=.12;animator.paint(state);assert.ok(body.querySelectorAll('[data-knopik-cape]').every(n=>n.getAttribute('display')==='none'));assert.equal(body.querySelector('[data-knopik-cape-clasp]').getAttribute('display'),'none');state.dodgeTime=0;
  }
 }
 assert.equal(svgMetrics.created,0);
});
