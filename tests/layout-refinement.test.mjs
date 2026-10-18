import './helpers/tsx-loader.mjs';
import test from 'node:test';import assert from 'node:assert/strict';
import {createElement as h} from 'react';import {renderToStaticMarkup as render} from 'react-dom/server';
import {ADVENTURE_LEVELS} from '../app/adventure-levels.ts';
import {layoutPixelText,pixelTextWidth} from '../app/pixel-text-layout.ts';
import {setGraphicsQuality} from '../app/graphics-quality.ts';
import {HOME_SOLIDS,HOME_CORRIDORS} from '../app/apartment-world.ts';
import {dungeonGame} from './helpers/dungeon-fixtures.mjs';
const {AdventureScene,AdventureRenderer}=await import('../app/adventure-artwork.tsx');
const {parseAdventureSvg}=await import('./helpers/adventure-svg-dom.mjs');

test('all 35 routes keep their complete room labels within world signs and map plates',()=>{
 for(const level of ADVENTURE_LEVELS)for(const [i,name]of level.roomNames.entries())for(const [text,width,height,font]of [[`${String(i+1).padStart(2,'0')} · ${name.toUpperCase()}`,260,38,17],[name,level.rooms[i].w-64,126,88]]){
  const l=layoutPixelText(text,width,height,font);
  assert.equal(l.lines.join(' '),text);assert.ok(l.lines.length<=2);
  assert.ok(l.lines.every(line=>pixelTextWidth(line,l.font)<=width+.01),`${level.id}/${name}`);
  assert.ok(l.lineHeight*l.lines.length<=height+.01);
 }
});

test('premium homes have unique architecture and furniture without moving doors, corridors or destinations',()=>{
 const solids=JSON.stringify(HOME_SOLIDS),corridors=JSON.stringify(HOME_CORRIDORS);
 try{for(const quality of ['low','medium','high','very-high','ultra']){
  setGraphicsQuality(quality);
  for(const theme of ['skyline','observatory']){
   const svg=parseAdventureSvg(render(h(AdventureScene,{area:'apartment',theme}))),renderer=new AdventureRenderer(svg,false);
   assert.equal(svg.querySelector('[data-home-edition-window]').getAttribute('data-home-edition-window'),theme==='skyline'?'panoramic-city':'planetarium');
   if(quality==='low')continue;
   assert.equal(svg.querySelectorAll('[data-home-edition-room]').length,6);
   assert.equal(svg.querySelectorAll('[data-home-edition-furniture]').length,2);
   assert.ok(svg.querySelector('[data-home-computer="interactive"]'));
   assert.equal(svg.querySelectorAll('[data-home-door-leaf]').length,6);
   assert.equal(svg.querySelectorAll('[data-home-corridor]').length,5);
   assert.ok(renderer);
  }
 }}finally{setGraphicsQuality('medium');}
 assert.equal(JSON.stringify(HOME_SOLIDS),solids);assert.equal(JSON.stringify(HOME_CORRIDORS),corridors);
});

test('HUD notifications preserve visited snapshots, publish objective changes and avoid idle duplicates',()=>{
 const changes=[],e=dungeonGame(6,{immortal:true},{change:v=>changes.push(v)});
 e.setInput(0,0,false);e.advance(1/60);const last=changes.at(-1),revision=e.viewRevision;
 for(let i=0;i<10;i++)e.advance(1/60);
 assert.equal(e.viewRevision,revision);
 const oldVisited=[...last.visited];e.dungeon.visited[1]=true;e.advance(1/60);
 assert.deepEqual(last.visited,oldVisited);assert.ok(changes.at(-1).visited[1]);
 const task=e.dungeon.goal(),goal=changes.at(-1).goal;
 assert.ok(e.dungeon.activate(task,e.time));e.advance(1/60);
 assert.notDeepEqual(changes.at(-1).goal,goal);
});
