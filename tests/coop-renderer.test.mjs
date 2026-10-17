import './helpers/tsx-loader.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {CoopEngine} from '../app/coop-engine.ts';
import {idleCoopControls} from '../app/coop-protocol.ts';
import {CoopRemotePose} from '../app/coop-motion.ts';
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

test('a fallen teammate stands up after a real revive with the host smoothing path enabled',()=>{
 for(const fallen of [0,1]){
  const e=new CoopEngine(123),slot=fallen===0?1:0;
  const svg=parseAdventureSvg(renderToStaticMarkup(React.createElement(AdventureScene,{layout:e.levelData,area:'sewer',coop:{slot,self:'Self',partner:'Friend'}})));
  const renderer=new AdventureRenderer(svg,false),pose=new CoopRemotePose();renderer.resize(390,520);
  e.enemies.forEach(n=>n.hp=0);e.levelData.hazards.length=0;
  const helper=e.actors[slot],friend=e.actors[fallen];Object.assign(friend.player,{...helper.player,hp:0});
  const paint=()=>{const companion=e.companion(fallen);companion.player=pose.sample(companion.player,1/60);e.forPlayer(slot,()=>renderer.paint(e,false,companion));};
  paint();assert.match(svg.querySelector('[data-coop-partner-body]').getAttribute('transform'),/rotate\(90\)/);
  e.setControls(slot,{...idleCoopControls(),interact:true});for(let n=0;n<125;n++)e.advance(1/60);
  assert.equal(friend.player.hp,2);paint();
  assert.equal(svg.querySelector('[data-coop-partner-body]').getAttribute('transform'),'translate(0 0)');
  assert.equal(svg.querySelector('[data-coop-partner-down]').getAttribute('display'),'none');
  assert.equal(svg.querySelector('[data-coop-partner]').getAttribute('opacity'),'1');
  const nameY=Number(svg.querySelector('[data-coop-partner-name]').getAttribute('y'))+friend.player.y*.82;
  assert.ok(helper.player.y*.82-105-nameY>=26,'nearby player labels stay vertically separated');
  friend.player.x+=10;friend.moving=true;paint();
  assert.equal(svg.querySelector('[data-coop-partner-body]').getAttribute('transform'),'translate(0 0)');
 }
});

test('both native SVG rigs show their own clothing and both cape waves without adding frame nodes',()=>{
 const setup={mode:'campaign',level_id:25,host_equipment:{hat:true,mohawk:false,accessory:'bandana'},guest_equipment:{hat:false,mohawk:true,accessory:'cape'}};
 const e=new CoopEngine(123,1,()=>{},setup);
 const svg=parseAdventureSvg(renderToStaticMarkup(React.createElement(AdventureScene,{layout:e.levelData,area:'sewer',level:25,coop:{slot:0,self:'Foma',partner:'Proclick'}})));
 const renderer=new AdventureRenderer(svg,false);renderer.resize(390,520);
 e.setControls(1,{...idleCoopControls(),weapon:'arc',energy:1});renderer.paint(e,false,e.companion(1));
 const host=svg.querySelector('[data-player-body]'),guest=svg.querySelector('[data-coop-partner-body]');
 for(const [rig,gear] of [[host,setup.host_equipment],[guest,setup.guest_equipment]]){
  assert.equal(rig.querySelector('[data-worn="hat"]').getAttribute('display'),gear.hat?'inline':'none');
  assert.equal(rig.querySelector('[data-worn="mohawk"]').getAttribute('display'),gear.mohawk?'inline':'none');
  assert.equal(rig.querySelector('[data-worn="bandana"]').getAttribute('display'),gear.accessory==='bandana'?'inline':'none');
 }
 assert.equal(svg.querySelector('[data-coop-energy]').querySelector('[data-energy-wave]').getAttribute('display'),'inline');
 Object.assign(e.actors[0].energyWave,{active:true,age:.45});e.actors[1].energyWave.age=.2;
 renderer.paint(e,false,e.companion(1));const spark=svg.querySelector('[data-coop-energy]').querySelector('[data-energy-spark="0"]'),pose=spark.getAttribute('transform');
 e.actors[0].energyWave.age=.1;renderer.paint(e,false,e.companion(1));assert.equal(spark.getAttribute('transform'),pose,'one wave cannot animate the other player’s particles');
 resetSvgMetrics();for(let n=0;n<30;n++){e.advance(1/60);renderer.paint(e,false,e.companion(1));}assert.equal(svgMetrics.created,0);
});
