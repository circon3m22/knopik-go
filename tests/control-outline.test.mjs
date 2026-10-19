import './helpers/tsx-loader.mjs';
import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import postcss from 'postcss';import sharp from 'sharp';
import {createElement as h} from 'react';import {renderToStaticMarkup as render} from 'react-dom/server';
import {parseAdventureSvg} from './helpers/adventure-svg-dom.mjs';
const {GameControlSurface}=await import('../app/game-control-surface.tsx');
const {GameControlRim}=await import('../app/game-control-rim.tsx');
const cssSource=readFileSync(new URL('../app/gameplay-control-art.css',import.meta.url),'utf8'),css=postcss.parse(cssSource),svg=readFileSync(new URL('../public/ui/game-control-frame.svg',import.meta.url),'utf8'),frame=(await import('../app/game-control-frame.ts')).CONTROL_FRAME;
const declarations=selector=>{const values={};css.walkRules(r=>{if(r.selector===selector)for(const d of r.nodes)if(d.type==='decl')values[d.prop]=d.value;});return values;};

test('native outline is a direct button child above the glass; disabled controls cannot fade it',()=>{
 const root=parseAdventureSvg(render(h('button',{'data-game-control':'attack',disabled:true},h(GameControlSurface,null,h('span',{'data-cooldown-fill':''}))))),surface=root.querySelector('[class="game-control-surface"]'),rim=root.querySelector('[data-control-outline="native"]');
 assert.equal(rim.parent,root);assert.equal(surface.parent,root);assert.equal(surface.querySelector('[data-control-outline="native"]'),null);
 assert.equal(rim.querySelectorAll('svg').length,4);assert.equal(rim.querySelectorAll('path').length,8);assert.equal(rim.children.length,8);
 const values=declarations('.adventure-game [data-game-control]>.game-control-rim');
 assert.equal(values.display,'grid');assert.equal(values['z-index'],'3');assert.equal(values.opacity,'1');assert.equal(values['pointer-events'],'none');assert.equal(values['backdrop-filter'],'none');
 assert.equal(values['grid-template-columns'],'12px minmax(0,1fr) 12px');
 css.walkRules(r=>{if(r.selector.includes(':disabled')&&r.selector.includes('>:not'))assert.ok(r.selector.includes('.game-control-rim'),'disabled fade must exclude the entire native rim');});
 assert.doesNotMatch(cssSource,/--control-edge-image:|border-image(?:-source|-slice)?:|data:image/,'the frame must not depend on an image-painted border');
});

test('all five graphics tiers share the same opaque edges; upper tiers promote only the separate rim',()=>{
 const selector='.adventure-game .game-control-rim>.is-';
 for(const[side,dark,light]of[['top','top','bottom'],['right','right','left'],['bottom','bottom','top'],['left','left','right']]){const edge=declarations(selector+side);assert.equal(edge['border-'+dark],'1px solid #263d46');assert.equal(edge['border-'+light],'2px solid #a8b6ac');}
 const fixed=declarations('.adventure-game [data-game-control]>.game-control-rim');
 for(const quality of['low','medium','high','very-high','ultra']){const result={...fixed};css.walkRules(r=>{if(!r.selector.includes('.game-control-rim')||!r.selector.includes(`[data-knopik-graphics="${quality}"]`))return;for(const d of r.nodes)if(d.type==='decl'){assert.equal(d.prop,'transform','quality must never hide or replace an edge');result[d.prop]=d.value;}});assert.equal(result.display,'grid');assert.equal(result.opacity,'1');assert.equal(result.visibility,'inherit','the rim must follow hidden pause/map chrome');if(!['low','medium'].includes(quality))assert.equal(result.transform,'translateZ(0)');}
 assert.deepEqual(frame.paths,[...svg.matchAll(/<path fill="([^"]+)" fill-rule="evenodd" d="([^"]+)"/g)].map(([,fill,d])=>({fill,d})));
});

test('native SVG corners and CSS edge geometry form a continuous hollow frame at square, narrow and wide control sizes',async()=>{
 const markup=render(h(GameControlRim)),corners=[...markup.matchAll(/<svg\b[^>]*>.*?<\/svg>/g)].map(m=>m[0]);
 const cornerImages=await Promise.all(corners.map(source=>sharp(Buffer.from(source.replace('<svg ','<svg xmlns="http://www.w3.org/2000/svg" '))).png().toBuffer()));
 const rect=(w,h,color)=>sharp({create:{width:w,height:h,channels:4,background:color}}).png().toBuffer();
 for(const[w,h]of[[48,48],[42,44],[207,40],[147,147],[90,30]]){
  const layers=cornerImages.map((input,i)=>({input,left:i%2?w-12:0,top:i>=2?h-12:0}));
  for(const[x,y,rw,rh,color]of[[12,0,w-24,1,'#263d46'],[12,1,w-24,2,'#a8b6ac'],[12,h-1,w-24,1,'#263d46'],[12,h-3,w-24,2,'#a8b6ac'],[0,12,1,h-24,'#263d46'],[1,12,2,h-24,'#a8b6ac'],[w-1,12,1,h-24,'#263d46'],[w-3,12,2,h-24,'#a8b6ac']])layers.push({input:await rect(rw,rh,color),left:x,top:y});
  const actual=await sharp({create:{width:w,height:h,channels:4,background:'#0000'}}).composite(layers).raw().toBuffer(),alpha=(x,y)=>actual[(y*w+x)*4+3];
  assert.equal(alpha(Math.floor(w/2),Math.floor(h/2)),0);assert.equal(alpha(0,0),0);
  for(let x=12;x<w-12;x++)for(let inset=0;inset<3;inset++){assert.equal(alpha(x,inset),255);assert.equal(alpha(x,h-1-inset),255);}
  for(let y=12;y<h-12;y++)for(let inset=0;inset<3;inset++){assert.equal(alpha(inset,y),255);assert.equal(alpha(w-1-inset,y),255);}
  if(w===48)assert.deepEqual(actual,await sharp(Buffer.from(svg)).ensureAlpha().raw().toBuffer(),'native pieces must exactly match the authored master');
 }
});
