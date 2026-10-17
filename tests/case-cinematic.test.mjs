import './helpers/tsx-loader.mjs';
import test from 'node:test';import assert from 'node:assert/strict';
import {createElement as h} from 'react';import {renderToStaticMarkup as render} from 'react-dom/server';
import {readFileSync} from 'node:fs';
const {CaseOpening}=await import('../app/case-opening.tsx');
const rewards=[{type:'coins',amount:500,label:'500 KC'},{type:'aura',amount:1,label:'1 AURA'},{type:'buff',kind:'food',amount:1,label:'Корм'}];
test('field cache keeps accessible hold controls and shows the real precomputed rewards',()=>{
 for(const phase of ['ready','charging','burst','reward']){
  const html=render(h(CaseOpening,{sequence:{kind:'common',phase,rewardIndex:0,rewards:phase==='ready'?[]:rewards},onHold(){},onCancelHold(){},onAdvance(){},onClose(){}}));
  assert.ok(html.includes('hunter-cache'));assert.ok(html.includes('data-cache-phase="'+phase+'"'));
  if(phase==='reward'){assert.ok(html.includes('500 KC'));assert.ok(html.includes('Показать итог сразу'));assert.ok(!html.includes('Корм'));}
  else assert.ok(html.includes('aria-label="Удерживай, чтобы открыть кейс"'));
  if(phase==='burst')assert.ok(html.includes('disabled=""'));assert.ok(!html.includes('case-film-ray-wheel'));
 }
 assert.equal(rewards[0].amount,500,'rendering never applies or rerolls rewards');
 const css=readFileSync(new URL('../app/case-cinematic.css',import.meta.url),'utf8');assert.ok(css.includes('@media(prefers-reduced-motion:reduce)'));
});
