import './helpers/tsx-loader.mjs';
import test from 'node:test';import assert from 'node:assert/strict';
import {createElement as h} from 'react';import {renderToStaticMarkup as render} from 'react-dom/server';import sharp from 'sharp';
import {parseAdventureSvg} from './helpers/adventure-svg-dom.mjs';
import {setGraphicsQuality} from '../app/graphics-quality.ts';
const {GraphicsQualityPicker}=await import('../app/graphics-quality-picker.tsx');
const {GraphicsQualityPreview}=await import('../app/graphics-quality-preview.tsx');

test('three labelled radio cards show distinct examples and retain exactly one selection after legacy settings',()=>{
 for(const [stored,selected] of [['low','low'],['medium','medium'],['high','ultra'],['very-high','ultra'],['ultra','ultra']]){
  const root=parseAdventureSvg(render(h(GraphicsQualityPicker,{value:stored,onSelect(){}}))),radios=root.querySelectorAll('[type="radio"]');
  assert.equal(root.tag,'fieldset');assert.deepEqual(root.querySelectorAll('strong').map(n=>n.textContent),['Низкая','Средняя','Высокая']);
  assert.equal(radios.length,3);assert.equal(new Set(radios.map(n=>n.getAttribute('name'))).size,1);
  assert.equal(radios.filter(n=>n.getAttribute('checked')!==null).length,1);assert.equal(radios.find(n=>n.getAttribute('checked')!==null).getAttribute('value'),selected);
  for(const radio of radios){for(const key of ['aria-labelledby','aria-describedby'])assert.ok(root.querySelector(`[id="${radio.getAttribute(key)}"]`));assert.equal(radio.parent.querySelector('svg').getAttribute('aria-hidden'),'true');}
  const ids=root.querySelectorAll('[id]').map(n=>n.id);assert.equal(new Set(ids).size,ids.length);
  for(const n of root.querySelectorAll('[fill]')){const ref=n.getAttribute('fill').match(/^url\(#(.+)\)$/);if(ref)assert.ok(root.querySelector(`[id="${ref[1]}"]`));}
 }
});

test('the static pixel examples visibly differ without depending on the selected global renderer',async()=>{
 const frames=[];try{for(const quality of ['low','medium','ultra']){
  setGraphicsQuality('low');const source=render(h(GraphicsQualityPreview,{quality})),low=parseAdventureSvg(source);
  setGraphicsQuality('ultra');const high=parseAdventureSvg(render(h(GraphicsQualityPreview,{quality})));
  const normalize=s=>s.replace(/_R_\w+_/g,'_id_');assert.equal(normalize(source),normalize(render(h(GraphicsQualityPreview,{quality}))));
  assert.ok(low.querySelectorAll('path').length<90);assert.equal(low.querySelectorAll('path').length,high.querySelectorAll('path').length);
  if(quality==='ultra'){assert.equal(low.querySelectorAll('[data-ultra-fog-shaft]').length,1);assert.equal(low.querySelectorAll('[data-ultra-haze-patch]').length,1);}else assert.equal(low.querySelectorAll('[data-ultra-haze-patch]').length,0);
  assert.doesNotMatch(source,/<filter\b|<image\b|<animate\b|NaN|Infinity/);
  const image=await sharp(Buffer.from(source.replace('<svg ','<svg xmlns="http://www.w3.org/2000/svg" width="352" height="224" '))).removeAlpha().raw().toBuffer();frames.push(image);
 }
 for(const [a,b] of [[0,1],[1,2]]){let changed=0;for(let p=0;p<frames[a].length;p+=3)if(Math.abs(frames[a][p]-frames[b][p])+Math.abs(frames[a][p+1]-frames[b][p+1])+Math.abs(frames[a][p+2]-frames[b][p+2])>12)changed++;assert.ok(changed>500,`${a}/${b}: ${changed} changed pixels`);}
 }finally{setGraphicsQuality('medium');}
});
