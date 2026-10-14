import './helpers/tsx-loader.mjs';
import test from 'node:test';import assert from 'node:assert/strict';import React from 'react';import{renderToStaticMarkup}from'react-dom/server';
import {ADVENTURE_LEVELS} from '../app/adventure-levels.ts';import{dungeonGame}from'./helpers/dungeon-fixtures.mjs';import{parseAdventureSvg}from'./helpers/adventure-svg-dom.mjs';
const {DungeonMapArt}=await import('../app/dungeon-map-art.tsx');const{DistrictMap}=await import('../app/neighborhood-map-art.tsx');
test('all 25 maps contain the real rooms, current objective, player and lift within fitted bounds',()=>{
 for(const level of ADVENTURE_LEVELS){const e=dungeonGame(level.id),view=e.view(),svg=parseAdventureSvg(renderToStaticMarkup(React.createElement(DungeonMapArt,{level,view,player:e.player,cleared:e.cleared,gates:level.gates.map((_,i)=>e.gateOpen(i))})));const[x,y,w,h]=svg.getAttribute('viewBox').split(' ').map(Number);assert.ok(w>300&&h>300);assert.equal(svg.querySelectorAll('[data-map-room]').length,level.rooms.length);for(const r of level.rooms)assert.ok(r.x>=x&&r.y>=y&&r.x+r.w<=x+w&&r.y+r.h<=y+h);assert.equal(svg.querySelectorAll('[data-map-player]').length,1);assert.equal(svg.querySelectorAll('[data-map-goal]').length,1);assert.equal(svg.querySelectorAll('[data-map-exit]').length,1);assert.ok(svg.getAttribute('aria-label').includes(view.objective));}
});
test('day and night district maps show real buildings and preserve the tracked mission coordinates',()=>{
 for(const night of[false,true]){const svg=parseAdventureSvg(renderToStaticMarkup(React.createElement(DistrictMap,{night,player:{x:1330,y:780},goal:{x:1750,y:1610}})));assert.equal(svg.querySelectorAll('[data-map-building]').length,8);assert.equal(svg.querySelector('[data-map-goal]').getAttribute('transform'),'translate(1750 1610)');assert.equal(svg.querySelector('[data-map-player]').getAttribute('cx'),'1330');assert.equal(svg.querySelector('[data-map-player]').getAttribute('cy'),'780');}
});
