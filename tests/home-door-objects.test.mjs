import './helpers/tsx-loader.mjs';
import test from 'node:test';import assert from 'node:assert/strict';
import React from 'react';import{renderToStaticMarkup}from'react-dom/server';
import{HOME_DOORWAYS,createHomeDoors,homeDoorBlocks,homeDoorPose,stepHomeDoors}from'../app/home-doors.ts';
import{AdventureEngine,ADVENTURE_STEP}from'../app/adventure-engine.ts';
import{parseAdventureSvg}from'./helpers/adventure-svg-dom.mjs';import{resetSvgMetrics,svgMetrics}from'./helpers/runner-svg-dom.mjs';
const{AdventureScene,AdventureRenderer}=await import('../app/adventure-artwork.tsx');
const silent={change(){},checkpoint(){},sound(){},run(){},bar(){}};
test('an opened leaf remains a solid object at its actual rotated position, while the doorway is clear',()=>{
 for(let i=0;i<HOME_DOORWAYS.length;i++)for(const angle of[-1.43,1.43]){
  const d=HOME_DOORWAYS[i],doors=createHomeDoors();doors[i].angle=angle;const p=homeDoorPose(i,angle),a=p.rotation*Math.PI/180;
  assert.equal(homeDoorBlocks(doors,p.x+Math.cos(a)*d.length*.65,p.y+Math.sin(a)*d.length*.65,13),true,`${d.id}: cannot walk through its open leaf`);
  assert.equal(homeDoorBlocks(doors,d.x,d.y,13),false,`${d.id}: the open doorway is usable`);
 }
});
test('a door cannot sweep through a stationary player, then returns to its frame once its swing is clear',()=>{
 const doors=createHomeDoors();doors[0].angle=1.43;doors[0].sign=1;const player={x:400,y:340};assert.equal(homeDoorBlocks(doors,player.x,player.y,13),false);
 for(let i=0;i<180;i++){stepHomeDoors(doors,player,{x:0,y:0},ADVENTURE_STEP);assert.equal(homeDoorBlocks(doors,player.x,player.y,13),false);}
 assert.ok(doors[0].angle>.2);Object.assign(player,{x:350,y:360});for(let i=0;i<150;i++)stepHomeDoors(doors,player,{x:0,y:0},ADVENTURE_STEP);assert.equal(doors[0].angle,0);
});
test('the hallway door opens toward either room and its collider never sweeps through the walking player',()=>{
 for(const direction of[-1,1]){const e=new AdventureEngine(3,silent);Object.assign(e.player,{x:692,y:direction>0?620:708});assert.ok(e.canStand(e.player.x,e.player.y));e.setInput(0,direction,false);for(let i=0;i<60;i++){e.advance(ADVENTURE_STEP);assert.ok(e.canStand(e.player.x,e.player.y));}assert.ok(Math.sign(e.homeDoors[2].angle)===direction);assert.ok(direction>0?e.player.y>720:e.player.y<600);}
});
test('side leaves have a real top surface in every theme and stay visible during swings in both directions',()=>{
 for(const theme of['classic','soda','mint','bath','night','emerald']){
  const e=new AdventureEngine(3,silent),svg=parseAdventureSvg(renderToStaticMarkup(React.createElement(AdventureScene,{area:'apartment',theme}))),renderer=new AdventureRenderer(svg,false);
  assert.equal(svg.querySelectorAll('[data-home-side-door]').length,4);assert.equal(svg.querySelectorAll('[data-home-side-frame]').length,4);assert.equal(svg.querySelectorAll('[data-home-door-shadow]').length,6);assert.equal(svg.querySelectorAll('[data-home-door-cap]').length,2);
  for(const angle of[0,-.7,-1.43,.7,1.43]){for(const d of e.homeDoors)d.angle=angle;renderer.paint(e,true);for(const leaf of svg.querySelectorAll('[data-home-door-projection="plan"]')){const[a,b,c,d]=leaf.getAttribute('transform').match(/-?\d+(?:\.\d+)?/g).map(Number);assert.ok(Math.abs(a*d-b*c)>.999,'a closed side door must never collapse into an invisible line');}}
 }
});
test('door thickness, shadow and depth follow the same hinge and reuse existing world nodes',()=>{
 const e=new AdventureEngine(3,silent),svg=parseAdventureSvg(renderToStaticMarkup(React.createElement(AdventureScene,{area:'apartment'}))),renderer=new AdventureRenderer(svg,false);Object.assign(e.player,{x:530,y:340});renderer.paint(e,true);
 const object=svg.querySelector('[data-home-door-object="bar-living"]'),shadow=object.querySelector('[data-home-door-shadow]'),actors=svg.querySelector('[data-actors]'),player=svg.querySelector('[data-player]'),oldShadow=shadow.getAttribute('transform'),cap=svg.querySelector('[data-home-door-cap="living-hall"]'),oldCap=cap.getAttribute('d');assert.ok(actors.children.indexOf(object)>actors.children.indexOf(player));
 resetSvgMetrics();e.homeDoors[0].angle=-1.43;e.homeDoors[2].angle=.9;renderer.paint(e,true);assert.notEqual(shadow.getAttribute('transform'),oldShadow);assert.notEqual(cap.getAttribute('d'),oldCap);assert.ok(actors.children.indexOf(object)<actors.children.indexOf(player));assert.equal(svgMetrics.created,0);
});
