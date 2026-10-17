import test from 'node:test';import assert from 'node:assert/strict';
import {nextCoopRoute,CoopAutoAdvance} from '../app/coop-progression.ts';

test('all campaign routes continue in order, followed by Abyss; endless modes retain their mode',()=>{
 for(let level=1;level<35;level++)assert.deepEqual(nextCoopRoute('campaign',level),{mode:'campaign',level:level+1});
 assert.deepEqual(nextCoopRoute('campaign',35),{mode:'abyss',level:1});
 for(const mode of ['arcade','abyss']){
  assert.deepEqual(nextCoopRoute(mode,1),{mode,level:2});assert.deepEqual(nextCoopRoute(mode,9998),{mode,level:9999});assert.equal(nextCoopRoute(mode,9999),null);
 }
});
test('victory automatically advances after two seconds, once despite render ticks and slow requests',()=>{
 const p=new CoopAutoAdvance();assert.equal(p.due(0,false),false);assert.equal(p.due(500,true),false);assert.equal(p.due(2499,true),false);assert.equal(p.due(2500,true),true);
 for(let time=2516;time<10000;time+=16)assert.equal(p.due(time,true),false);
 p.settle(true,10000);assert.equal(p.due(20000,true),false);
});
test('disconnect/pause cancels countdown; failed transitions retry with a delay',()=>{
 const p=new CoopAutoAdvance();p.due(0,true);assert.equal(p.due(1000,false),false);assert.equal(p.due(10000,true),false);assert.equal(p.due(12000,true),true);
 p.settle(false,12500);assert.equal(p.due(16499,true),false);assert.equal(p.due(16500,true),true);
});
