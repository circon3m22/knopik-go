import './helpers/tsx-loader.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {CoopEngine} from '../app/coop-engine.ts';
import {idleCoopControls} from '../app/coop-protocol.ts';
import {parseAdventureSvg} from './helpers/adventure-svg-dom.mjs';
import {resetSvgMetrics,svgMetrics} from './helpers/runner-svg-dom.mjs';
const {AdventureScene,AdventureRenderer}=await import('../app/adventure-artwork.tsx');
const {DungeonMapArt}=await import('../app/dungeon-map-art.tsx');
test('each device renders its own actor and the animated teammate with bounded SVG nodes and correct depth',()=>{
 const e=new CoopEngine(123),scenes=[0,1].map(slot=>parseAdventureSvg(renderToStaticMarkup(React.createElement(AdventureScene,{layout:e.levelData,area:'sewer',coop:{slot,self:slot?'Proclick':'Foma',partner:slot?'Foma':'Proclick'}}))));
 const renderers=scenes.map(svg=>new AdventureRenderer(svg,false));renderers.forEach(r=>r.resize(390,520));
 resetSvgMetrics();
 for(let frame=0;frame<120;frame++){
  e.setControls(0,{...idleCoopControls(),x:Math.sin(frame/30),y:Math.cos(frame/30),attack:true});e.setControls(1,{...idleCoopControls(),x:-Math.sin(frame/30),y:-Math.cos(frame/30),attack:true});e.advance(1/60);
  for(const slot of [0,1])e.forPlayer(slot,()=>renderers[slot].paint(e,false,e.companion(slot===0?1:0)));
 }
 assert.equal(svgMetrics.created,0);
 for(const [slot,svg]of scenes.entries()){
  assert.equal(svg.querySelectorAll('[data-player]').length,1);assert.equal(svg.querySelectorAll('[data-coop-partner]').length,1);
  assert.match(svg.querySelector('[data-player]').getAttribute('transform'),new RegExp(e.actors[slot].player.x.toFixed(2).replace('.','\\.')));
  assert.ok(!/NaN|Infinity/.test(svg.getAttribute('viewBox')));
  const actors=svg.querySelector('[data-actors]').children.filter(n=>n.getAttribute('data-player')!==null||n.getAttribute('data-coop-partner')!==null);
  assert.equal(actors.length,2);
 }
 e.actors[1].player.hp=0;e.forPlayer(0,()=>renderers[0].paint(e,false,e.companion(1)));
 assert.equal(scenes[0].querySelector('[data-coop-partner-down]').getAttribute('display'),'inline');
 assert.match(scenes[0].querySelector('[data-coop-partner-body]').getAttribute('transform'),/rotate\(90\)/);
});
test('the co-op map includes a named teammate marker and shared explored rooms',()=>{
 const e=new CoopEngine(1),markup=renderToStaticMarkup(React.createElement(DungeonMapArt,{level:e.levelData,view:e.view(),player:e.actors[0].player,partner:{...e.actors[1].player,name:'Proclick'},cleared:e.cleared,gates:e.levelData.gates.map((_,i)=>e.gateOpen(i))}));
 assert.match(markup,/data-map-partner/);assert.match(markup,/Proclick/);assert.match(markup,/data-map-player/);
});
