import './helpers/tsx-loader.mjs';
import test from 'node:test';import assert from 'node:assert/strict';import{readFileSync}from'node:fs';import postcss from'postcss';
import{setGraphicsQuality}from'../app/graphics-quality.ts';
import{registerControlBackdrop,refreshControlBackdrops}from'../app/game-control-backdrop.ts';

function fixture({supported=true}={}){
 const reduced={matches:false},document={hidden:false,defaultView:{CSS:{supports:()=>supported},matchMedia:()=>reduced}};
 const attributes=new Map(),world={ownerDocument:document,getAttribute:name=>attributes.get(name),style:{setProperty(){throw Error('restyled the whole SVG world');}}};
 const scene={closest:()=>world};
 function glass(){const values=new Map(),writes=[];return{ownerDocument:document,closest:()=>world,values,writes,style:{setProperty:(key,value)=>{values.set(key,value);writes.push([key,value]);},removeProperty:key=>values.delete(key)}};}
 return{world,scene,glass,document,reduced,attributes};
}

test('each painted frame invalidates every live glass sample locally, without touching scene geometry',()=>{
 const f=fixture(),a=f.glass(),b=f.glass(),stopA=registerControlBackdrop(a),stopB=registerControlBackdrop(b);
 try{
  setGraphicsQuality('high');refreshControlBackdrops(f.scene);assert.equal(a.values.get('--control-live-sample'),'0.01px');assert.deepEqual(a.writes,b.writes);
  refreshControlBackdrops(f.scene);assert.equal(a.values.get('--control-live-sample'),'0px');
  const late=f.glass(),stopLate=registerControlBackdrop(late);refreshControlBackdrops(f.scene);assert.equal(late.writes.length,1);stopLate();assert.equal(late.values.size,0);
  stopA();const count=a.writes.length;refreshControlBackdrops(f.scene);assert.equal(a.writes.length,count,'unmounted button must never be updated');assert.equal(b.writes.length,4);
 }finally{stopA();stopB();setGraphicsQuality('medium');}
});

test('low/medium, hidden UI, background tabs, reduced transparency and unsupported browsers do no refresh work',()=>{
 const f=fixture(),a=f.glass(),stop=registerControlBackdrop(a);
 try{
  for(const quality of ['low','medium']){setGraphicsQuality(quality);refreshControlBackdrops(f.scene);}assert.equal(a.writes.length,0);
  setGraphicsQuality('ultra');f.reduced.matches=true;refreshControlBackdrops(f.scene);f.reduced.matches=false;
  f.document.hidden=true;refreshControlBackdrops(f.scene);f.document.hidden=false;
  f.attributes.set('data-world-chrome-hidden','true');refreshControlBackdrops(f.scene);assert.equal(a.writes.length,0);
  f.attributes.set('data-world-chrome-hidden','false');refreshControlBackdrops(f.scene);assert.equal(a.writes.length,1);
  const old=fixture({supported:false}),g=old.glass(),unregister=registerControlBackdrop(g);refreshControlBackdrops(old.scene);assert.equal(g.writes.length,0);unregister();
 }finally{stop();setGraphicsQuality('medium');}
});

test('separate world instances cannot refresh one another and teardown removes the registry',()=>{
 const f=fixture(),other=fixture(),a=f.glass(),b=other.glass(),stop=registerControlBackdrop(a),stopOther=registerControlBackdrop(b);
 try{setGraphicsQuality('very-high');refreshControlBackdrops(f.scene);assert.equal(a.writes.length,1);assert.equal(b.writes.length,0);stop();refreshControlBackdrops(f.scene);assert.equal(a.writes.length,1);refreshControlBackdrops(other.scene);assert.equal(b.writes.length,1);}
 finally{stop();stopOther();setGraphicsQuality('medium');}
});

test('the changing filter value resolves on the glass and all world render loops refresh it after paint',()=>{
 const css=postcss.parse(readFileSync(new URL('../app/gameplay-control-art.css',import.meta.url),'utf8'));let sample=false;
 css.walkDecls('--world-control-blur',d=>{if(!d.value.includes('--control-live-sample'))return;sample=true;assert.ok(d.parent.selector.endsWith('.game-control-glass'),'ancestor variables would resolve before the local frame sample');});assert.ok(sample);
 const source=name=>readFileSync(new URL('../app/'+name,import.meta.url),'utf8');
 for(const file of ['adventure-game.tsx','neighborhood-game.tsx'])assert.match(source(file),/renderer\.paint\(engine\);refreshControlBackdrops\(svg\)/);
 assert.match(source('coop-game.tsx'),/renderer\.paint\(engine,false,companion\)\);\s*refreshControlBackdrops\(element\)/);
 assert.doesNotMatch(source('game-control-backdrop.ts'),/requestAnimationFrame\(|setInterval\(|getBoundingClientRect\(|querySelectorAll\(/);
});
