import './helpers/tsx-loader.mjs';
import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
import {barDrinkBlock} from '../app/bar-drink-access.ts';
const {BuffShelfItem}=await import('../app/buff-shelf-item.tsx');
test('all nine bar drinks route use and purchase separately, and found bottles can be used before unlocking their recipe',()=>{
 for(const kind of ['pitbull','cocoa','bergamot','lime','matcha','tralalero','ballerina','bombardiro','verity']){
  let used=0,bought=0;const reason=barDrinkBlock(kind,1,1000,false,false);assert.equal(reason,undefined);
  const card=BuffShelfItem({kind,count:1,canUse:!reason,canBuy:true,variant:'bar',recipeLocked:false,onUse:()=>used++,onBuy:()=>bought++});
  const [use,buy]=card.props.children;assert.equal(use.props.disabled,false);use.props.onClick();assert.equal(used,1);assert.equal(bought,0);buy.props.onClick();assert.equal(bought,1);
  const locked=BuffShelfItem({kind,count:1,canUse:true,canBuy:false,variant:'bar',recipeLocked:true,onUse:()=>used++,onBuy:()=>bought++});assert.equal(locked.props.children[0].props.disabled,false);assert.equal(locked.props.children[1].props.disabled,true);
 }
});
test('empty stock, missing stake and rest have visible reasons instead of a silent non-working drink',()=>{
 for(const kind of ['pitbull','cocoa','bergamot']){
  assert.match(barDrinkBlock(kind,0,100,false,false),/запасе/);assert.match(barDrinkBlock(kind,1,0,false,false),/KC/);assert.match(barDrinkBlock(kind,1,100,true,false),/отдыхает/);
 }
 for(const kind of ['lime','matcha','tralalero','ballerina','bombardiro','verity'])assert.equal(barDrinkBlock(kind,1,0,true,false),undefined);
 const reason=barDrinkBlock('cocoa',1,0,false,false),card=BuffShelfItem({kind:'cocoa',count:1,canUse:!reason,canBuy:false,useReason:reason,variant:'bar',onUse(){},onBuy(){}});
 assert.equal(card.props.children[0].props.children[2].props.children,reason);
});
test('both world controls have an emergency release watchdog if the OS drops pointerup',async()=>{
 for(const path of ['adventure-game.tsx','neighborhood-game.tsx']){const s=await readFile(new URL(`../app/${path}`,import.meta.url),'utf8');assert.ok(s.includes('Date.now()-stickLastActivity.current>12000'));assert.ok(s.includes('observeJoystickRelease(window'));}
});
