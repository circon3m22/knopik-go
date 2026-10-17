import './helpers/tsx-loader.mjs';
import test from 'node:test';import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';import postcss from 'postcss';
import {createElement} from 'react';import {renderToStaticMarkup} from 'react-dom/server';
import {setGraphicsQuality} from '../app/graphics-quality.ts';
import {dungeonGame} from './helpers/dungeon-fixtures.mjs';
import {parseAdventureSvg} from './helpers/adventure-svg-dom.mjs';
const {AdventureScene,AdventureRenderer}=await import('../app/adventure-artwork.tsx');

test('walking down and firing keep identical camera framing at every graphics quality',()=>{
 const oldQuality='medium';
 try{
  for(const [width,height]of [[393,560],[320,430],[844,260]]){
   let expected;
   for(const quality of ['low','medium','high','very-high']){
    setGraphicsQuality(quality);
    const engine=dungeonGame(6,{immortal:true});assert.ok(engine.selectWeapon('pistol'));
    const svg=parseAdventureSvg(renderToStaticMarkup(createElement(AdventureScene,{area:'sewer',layout:engine.levelData,theme:'classic',level:6}))),renderer=new AdventureRenderer(svg,true),frames=[];
    renderer.resize(width,height);
    for(let frame=0;frame<180;frame++){
     engine.setInput(0,1,frame%30===0);engine.advance(1/60);
     if(frame%30===0){renderer.paint(engine,true);frames.push([svg.getAttribute('viewBox'),svg.querySelector('[data-player]').getAttribute('transform')]);}
    }
    assert.ok(engine.punchSerial>0,'actual shots were fired');
    if(!expected)expected=frames;else assert.deepEqual(frames,expected,`${quality}: camera and player pose stay in the original playfield`);
   }
  }
 }finally{setGraphicsQuality(oldQuality);}
});

test('lower glass styles cannot resize or shift the viewport, controls, camera overlays or hit targets',()=>{
 const root=postcss.parse(readFileSync(new URL('../app/gameplay-glass.css',import.meta.url),'utf8'));
 const allowed=new Set(['background','backdrop-filter','-webkit-backdrop-filter']);
 root.walkDecls(d=>assert.ok(allowed.has(d.prop),`geometry is outside cosmetic panel styles: ${d.prop}`));
 root.walkRules(r=>{assert.match(r.selector,/data-knopik-graphics=high/);assert.match(r.selector,/data-knopik-graphics=very-high/);assert.match(r.selector,/adventure-controls|bottom-bar/);});
});
