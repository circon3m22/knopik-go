import assert from 'node:assert/strict';
import test from 'node:test';
import {FrameRateTracker} from '../app/frame-rate.ts';

test('runner meter counts 30 completed paints even on a 120Hz interface',()=>{
 const tracker=new FrameRateTracker();tracker.setRunner(true);let sample;
 for(let i=0;i<=120;i++) {
  assert.equal(tracker.record(100+i*1000/120,false),null);
  if(i%4===0)sample=tracker.record(100+i*1000/120,true,4)??sample;
 }
 assert.equal(sample.fps,30);assert.equal(sample.meanMs,4);assert.ok(Math.abs(sample.maxGapMs-1000/30)<.001);
});
test('pause and resumed measurements exclude the time spent in a stopped chase',()=>{
 const tracker=new FrameRateTracker();tracker.setRunner(true);tracker.record(100,true);tracker.record(200,true);
 tracker.setRunner(false);let sample;
 for(let i=0;i<=60;i++)sample=tracker.record(10000+i*1000/60,false)??sample;
 assert.equal(sample.fps,60);assert.equal(sample.runner,false);
 tracker.setRunner(true);tracker.record(30000,true);
 for(let i=1;i<=10;i++)sample=tracker.record(30000+i*100,true,45)??sample;
 assert.equal(sample.fps,10);assert.equal(sample.runner,true);
});
