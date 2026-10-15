import './helpers/tsx-loader.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {AdventureEngine} from '../app/adventure-engine.ts';
import {APARTMENT_DESTINATIONS} from '../app/apartment-interactions.ts';
import {parseAdventureSvg} from './helpers/adventure-svg-dom.mjs';
const {AdventureScene,AdventureRenderer}=await import('../app/adventure-artwork.tsx');
const {ApartmentDestinationButton}=await import('../app/apartment-destination-button.tsx');
const {ApartmentBottleShelf}=await import('../app/apartment-bottle-shelf.tsx');
const events={change(){},checkpoint(){},sound(){},run(){},bar(){}};
function game(checkpoint=3){const exits=[];const e=new AdventureEngine(checkpoint,{...events,bar:()=>exits.push('bar'),run:()=>exits.push('street')});e.begin();while(e.phase==='dialogue')e.nextDialogue();return {e,exits};}

test('the bar and street have separate rooms; opening a room preserves the player position and pauses movement',()=>{
 const {e,exits}=game();Object.assign(e.player,{x:252,y:350});assert.ok(e.canStand(e.player.x,e.player.y));assert.equal(e.view().interaction,'Открыть бар');const p={...e.player};e.interact();assert.deepEqual(exits,['bar']);assert.equal(e.phase,'paused');assert.deepEqual(e.player,p);e.resume();Object.assign(e.player,{x:692,y:1032});assert.equal(e.view().interaction,'Выйти на улицу');e.interact();assert.deepEqual(exits,['bar','street']);
});
test('destinations require the matching room and preserve campaign and tutorial locks',()=>{
 const {e,exits}=game();assert.equal(e.interactDestination('bar'),false);Object.assign(e.player,{x:252,y:350});assert.equal(e.interactDestination('bar'),true);e.resume();assert.equal(e.interactDestination('street'),false);Object.assign(e.player,{x:692,y:1032});assert.equal(e.interactDestination('street'),true);assert.equal(e.interactDestination('basement'),true);assert.equal(e.phase,'levels');assert.equal(e.selectLevel(3),false);assert.deepEqual(exits,['bar','street']);
 const first=game(0);for(const id of ['bar','street','basement','vault','wardrobe','laboratory'])assert.equal(first.e.interactDestination(id),false);first.e.skipOpening();assert.equal(first.e.area,'sewer');assert.equal(first.e.interactDestination('bar'),false);
});
test('paused, dialogue, combat and invalid destination calls cannot open apartment exits',()=>{
 const {e,exits}=game();assert.equal(e.interactDestination('invalid'),false);e.pause();assert.equal(e.interactDestination('bar'),false);e.resume();e.selectLevel(2);assert.equal(e.interactDestination('street'),false);assert.equal(e.interactDestination('bar'),false);assert.deepEqual(exits,[]);
});
test('secondary touch activates a room once; keyboard works and disabled targets reject input',()=>{
 const {e,exits}=game();Object.assign(e.player,{x:252,y:350});let prevented=0;const b=ApartmentDestinationButton({destination:'bar',label:'Бар',disabled:false,onChoose:id=>e.interactDestination(id)});b.props.onPointerDown({button:0,isPrimary:false,pointerId:12,preventDefault(){prevented++;}});b.props.onClick({detail:1});assert.equal(prevented,1);assert.deepEqual(exits,['bar']);e.resume();b.props.onClick({detail:0});assert.deepEqual(exits,['bar','bar']);
 const disabled=ApartmentDestinationButton({destination:'street',label:'Улица',disabled:true,onChoose:id=>e.interactDestination(id)});disabled.props.onPointerDown({button:0,preventDefault(){throw new Error('disabled');}});disabled.props.onClick({detail:0});assert.equal(exits.length,2);
});
test('eight nonoverlapping furniture targets share the world projection and camera',()=>{
 for(const [i,a] of APARTMENT_DESTINATIONS.entries()){assert.ok(a.w>=60&&a.h*.82>=60);for(const b of APARTMENT_DESTINATIONS.slice(i+1))assert.ok(a.x+a.w<=b.x||b.x+b.w<=a.x||a.y+a.h<=b.y||b.y+b.h<=a.y);}
 const svg=parseAdventureSvg(renderToStaticMarkup(React.createElement(AdventureScene,{area:'apartment',onDestination(){}}))),e=game().e,r=new AdventureRenderer(svg,true);r.resize(390,280);assert.equal(svg.getAttribute('role'),'group');assert.equal(svg.querySelectorAll('foreignObject').length,APARTMENT_DESTINATIONS.length);assert.equal(svg.querySelectorAll('button').length,APARTMENT_DESTINATIONS.length);const target=svg.querySelector('[data-apartment-destination="bar"]'),frame=target.parent;assert.equal(frame.getAttribute('x'),'100');assert.equal(frame.parent.getAttribute('transform'),'scale(1 0.82)');assert.equal(target.getAttribute('type'),'button');r.paint(e,true);assert.ok(Number(svg.getAttribute('viewBox').split(' ')[0])>0);assert.equal(frame.getAttribute('x'),'100');
});

test('the bottle cabinet preserves all items in reading order, including a partial final shelf',()=>{
  const make=n=>renderToStaticMarkup(React.createElement(ApartmentBottleShelf,null,Array.from({length:n},(_,i)=>React.createElement('div',{key:i,'data-item':i},React.createElement('button',{type:'button'},`Бутылка ${i}`)))));
  for(const n of [8,9,10]){const markup=make(n);assert.equal((markup.match(/class="apartment-bar-row"/g)||[]).length,Math.ceil(n/3));assert.equal((markup.match(/type="button"/g)||[]).length,n);let previous=-1;for(let i=0;i<n;i++){const at=markup.indexOf(`data-item="${i}"`);assert.ok(at>previous);previous=at;}}
});
