import './helpers/tsx-loader.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {createElement as h} from 'react';
import {renderToStaticMarkup as render} from 'react-dom/server';
const {wagerRange,WagerSlider}=await import('../app/wager-slider.tsx');
import {ARCADE_CATALOG} from '../app/arcade-catalog.ts';
import {CASINO_KINDS} from '../app/casino-engine.ts';
const {MiniGamePanel}=await import('../app/mini-game-panel.tsx');
const {PitbullGame}=await import('../app/pitbull-game.tsx');
const {LimeGame}=await import('../app/lime-game.tsx');
const {DrinkGamePanel}=await import('../app/drink-game-panel.tsx');
const {BrainrotGame}=await import('../app/brainrot-game.tsx');
const {CasinoGame}=await import('../app/casino-game.tsx');
const {TeaTileArtwork}=await import('../app/tea-field-artwork.tsx');
const noop=()=>{},yes=()=>true;
function cabinet(game,balance,canChooseBet){
 const common={kind:game,balance,canChooseBet,best:0,onStart:yes,onClose:noop,onReplay:noop,onTick:noop,onSound:noop,onResolve:noop};
 if(CASINO_KINDS.includes(game))return h(CasinoGame,{...common,skin:'shiba-black',stats:{plays:0,wins:0,best:0},onCommit:yes,onDouble:yes});
 if(['cocoa','bergamot'].includes(game))return h(MiniGamePanel,{...common,kind:game==='cocoa'?'slots':'mines',difficulty:50,stats:{slotPlays:0,slotWins:0,minePlays:0,mineWins:0,mineLosses:0},onCommitBet:yes});
 if(game==='pitbull')return h(PitbullGame,{...common,phase:'selecting',skin:'classic',chance:50,bet:balance?100:0,multiplier:1.8,payout:0,result:null,rotation:0,spinNonce:0,duration:2000,message:'Выбери сектор',onChance:noop,onBet:noop,onSpin:noop});
 return h(game==='lime'?LimeGame:game==='matcha'?DrinkGamePanel:BrainrotGame,common);
}

test('stakes never exceed the balance, gambling requires a coin, and skill games preserve zero',()=>{
 assert.deepEqual(wagerRange(0,500),{min:0,max:0,value:0,progress:0});
 assert.deepEqual(wagerRange(1,100),{min:1,max:1,value:1,progress:0});
 assert.equal(wagerRange(100,0).value,1);
 assert.equal(wagerRange(100,0,true).value,0);
 assert.equal(wagerRange(100,52.9).value,52);
 assert.equal(wagerRange(100,101).value,100);
 for(const balance of [0,1,2,49,999,Number.MAX_SAFE_INTEGER,-1,NaN,Infinity,1.5])for(const amount of [-Infinity,-1,0,1,42.8,Number.MAX_SAFE_INTEGER,Infinity,NaN])for(const allowZero of [false,true]){
  const s=wagerRange(balance,amount,allowZero);
  assert.ok(Number.isSafeInteger(s.value)&&s.value>=s.min&&s.value<=s.max);
  assert.ok(Number.isFinite(s.progress)&&s.progress>=0&&s.progress<=100);
 }
});

test('independent accessible sliders have unique labels and no editable amount field',()=>{
 const html=render(h('div',null,h(WagerSlider,{balance:100,amount:50,onChange:noop}),h(WagerSlider,{balance:0,amount:0,onChange:noop,allowZero:true})));
 const labels=[...html.matchAll(/<label for="([^"]+)"/g)].map(m=>m[1]);
 assert.equal(new Set(labels).size,2);
 for(const id of labels)assert.ok(html.includes(`id="${id}"`));
 assert.equal((html.match(/type="range"/g)||[]).length,2);
 assert.doesNotMatch(html,/type="number"/);
 assert.match(html,/Без ставки/);
 assert.match(html,/disabled=""/);
});

test('all 15 games share the slider only with an equipped mohawk, including zero and maximum balances',()=>{
 assert.equal(ARCADE_CATALOG.length,15);
 for(const {id} of ARCADE_CATALOG)for(const balance of [0,Number.MAX_SAFE_INTEGER])for(const mohawk of [false,true]){
  const html=render(cabinet(id,balance,mohawk));
  assert.doesNotMatch(html,/\b(?:NaN|undefined)\b/,id);
  assert.equal((html.match(/aria-label="Размер ставки"/g)||[]).length,mohawk?1:0,`${id}: one shared bet range`);
  const numbers=(html.match(/type="number"/g)||[]).length;
  assert.equal(numbers,id==='currant'?1:0,`${id}: only the separate crash auto-cashout multiplier may be typed`);
  assert.doesNotMatch(html,/Точная сумма ставки|skill-wager-amount/);
  if(id==='bergamot'){
   assert.equal((html.match(/class="tea-tile /g)||[]).length,25);
   assert.match(html,/aria-label="Количество мин"/);
   assert.match(html,/>5 мин</);
   if(balance===0)assert.match(html,/<button class="casino-primary" type="button" disabled=""/);
  }
 }
});

test('Bergamot has five distinct tile states, with no blank leaf after reveal',()=>{
 const states=['closed','leaf','unpicked','mine','triggered'].map(state=>render(h(TeaTileArtwork,{state})));
 assert.equal(new Set(states).size,5);
 for(const svg of states){assert.match(svg,/viewBox="0 0 48 48"/);assert.match(svg,/shape-rendering="crispEdges"/);assert.doesNotMatch(svg,/<filter|<image/);}
});
