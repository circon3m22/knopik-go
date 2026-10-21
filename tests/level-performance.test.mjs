import './helpers/tsx-loader.mjs';
import test from 'node:test';import assert from 'node:assert/strict';
import {createElement as h} from 'react';import {renderToStaticMarkup as render} from 'react-dom/server';
import {reorderSvgChildren} from '../app/svg-depth-order.ts';
import {AdventureEngine} from '../app/adventure-engine.ts';
import {SvgNode,resetSvgMetrics,svgMetrics} from './helpers/runner-svg-dom.mjs';
import {parseAdventureSvg} from './helpers/adventure-svg-dom.mjs';
import {setGraphicsQuality} from '../app/graphics-quality.ts';
const {pixelBonePath}=await import('../app/knopik-adventure-animation.ts');
const {AdventureScene,AdventureRenderer}=await import('../app/adventure-artwork.tsx');
const {UpholsteredBench}=await import('../app/apartment-detail-furniture.tsx');
const {HomeMaterialTheme}=await import('../app/apartment-materials.tsx');
const {THEMES}=await import('../app/cosmetic-engine.ts');
const events={change(){},checkpoint(){},sound(){},run(){},bar(){}};

test('depth ordering moves a crossing actor once in either direction and preserves every subtree',()=>{
 const layer=new SvgNode(),nodes=Array.from({length:50},()=>new SvgNode());layer.append(...nodes);
 for(const desired of [[nodes[49],...nodes.slice(0,49)],nodes]){
  resetSvgMetrics();reorderSvgChildren(layer,desired);assert.deepEqual(layer.children,desired);
  assert.equal(svgMetrics.moves,1);assert.equal(svgMetrics.created,0);assert.equal(svgMetrics.removals,0);
 }
 let seed=17;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/2**32;};
 for(let i=0;i<60;i++){
  const desired=nodes.map(node=>({node,sort:random()})).sort((a,b)=>a.sort-b.sort).map(x=>x.node);
  reorderSvgChildren(layer,desired);assert.deepEqual(layer.children,desired);
  resetSvgMetrics();reorderSvgChildren(layer,desired);assert.equal(svgMetrics.moves,0);
 }
});

// Frozen pixel-by-pixel rasterizer from 0.5.0: an independent visual oracle for
// the faster edge search, including short/overlapping/zero-length segments.
function originalBone(points,width){
 const half=width/2,x0=Math.floor((Math.min(...points.map(p=>p.x))-half)/2)*2,x1=Math.ceil((Math.max(...points.map(p=>p.x))+half)/2)*2;
 const y0=Math.floor((Math.min(...points.map(p=>p.y))-half)/2)*2,y1=Math.ceil((Math.max(...points.map(p=>p.y))+half)/2)*2;let path='';
 for(let y=y0;y<y1;y+=2){let left=Infinity,right=-Infinity;for(let x=x0;x<x1;x+=2)for(let i=1;i<points.length;i++){
  const a=points[i-1],b=points[i],dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((x+1-a.x)*dx+(y+1-a.y)*dy)/Math.max(1,dx*dx+dy*dy)));
  if((x+1-a.x-dx*t)**2+(y+1-a.y-dy*t)**2<=half*half){left=Math.min(left,x);right=Math.max(right,x+2);break;}
 }if(Number.isFinite(left))path+=`M${left} ${y}h${right-left}v2h-${right-left}Z`;}return path;
}
test('faster articulated pixel limbs are byte-identical to the original rasterizer',()=>{
 let seed=210;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/2**32;};
 for(let i=0;i<300;i++){
  const points=Array.from({length:2+i%3},()=>({x:random()*70-35,y:random()*80-80}));if(i%11===0)points[1]={...points[0]};
  for(const width of [3,9,10,13,15])assert.equal(pixelBonePath(points,width),originalBone(points,width));
 }
});

test('medium keeps the same visible effects while omitting geometry it never displays; pools survive kind reuse',()=>{
 try{for(const quality of ['low','medium','high','very-high','ultra']){
  setGraphicsQuality(quality);const e=new AdventureEngine(2,events,{immortal:true}),svg=parseAdventureSvg(render(h(AdventureScene,{area:'sewer',engine:e}))),r=new AdventureRenderer(svg,false);
  assert.equal(svg.querySelectorAll('[data-dungeon-effect]').length,36);
  assert.equal(svg.querySelectorAll('[data-fx-fragment]').length,quality==='low'||quality==='medium'?0:288);
  for(const kind of ['blast','heal','hit','shell','blast']){
   e.effects.reset();e.effects.burst(kind,e.player.x,e.player.y,68);r.paint(e,true);
   const effect=svg.querySelector('[data-dungeon-effect="0"]');assert.equal(effect.getAttribute('display'),'inline');
   for(const [selector,on]of [['fire',kind==='blast'],['hit',kind==='hit'],['heal',kind==='heal']])assert.equal(effect.querySelector(`[data-fx-${selector}]`).getAttribute('display'),on?'inline':'none');
   e.effects.reset();r.paint(e);assert.equal(effect.getAttribute('display'),'none');
  }
 }}finally{setGraphicsQuality('medium');}
});

test('the repaired bar chaise has upright feet in every theme; the dressing bench stays horizontal',()=>{
 for(const theme of Object.keys(THEMES)){
  const draw=vertical=>parseAdventureSvg(render(h('svg',null,h(HomeMaterialTheme.Provider,{value:theme},h(UpholsteredBench,{vertical})))));
  const chaise=draw(true).querySelector('[data-home-furniture="lounge-chaise"]');
  assert.equal(chaise.getAttribute('transform'),null);assert.equal(chaise.getAttribute('data-home-footprint'),'0 -112 42 112');
  assert.ok(chaise.querySelector('[data-chaise-legs]'));assert.ok(!render(h(UpholsteredBench,{vertical:true})).includes('rotate(90)'));
  assert.ok(draw(false).querySelector('[data-home-furniture="dressing-bench"]'));
 }
});
