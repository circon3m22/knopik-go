import assert from 'node:assert/strict';
import test from 'node:test';
import {runnerAtmosphere,runnerMixColor} from '../app/runner-atmosphere.ts';
import {RunnerEngine,runnerDistrict,runnerRouteElevation} from '../app/runner-engine.ts';
test('all six weather phases blend continuously and repeat on the gameplay clock',()=>{
  const seen=new Set();let previous=runnerAtmosphere(0);
  for(let time=0;time<420;time+=.1){
    const state=runnerAtmosphere(time);seen.add(state.phase);
    assert.ok(state.rain>=0&&state.rain<=1&&state.night>=0&&state.night<=1.001);
    assert.ok(Math.abs(state.illumination-previous.illumination)<.013);
    assert.match(state.sky,/^#[0-9a-f]{6}$/);previous=state;
  }
  assert.equal(seen.size,6);assert.deepEqual(runnerAtmosphere(0),runnerAtmosphere(210));
  assert.deepEqual(runnerAtmosphere(112,123),runnerAtmosphere(112,123),'same paused clock, same sky');
  assert.equal(runnerMixColor('#000000','#ffffff',.5),'#808080');
});
test('six districts form a full cycle with a traffic tunnel and no railway through its walls',()=>{
  for(let zone=0;zone<6;zone++)assert.equal(runnerDistrict(zone*420),zone);
  assert.equal(runnerDistrict(2520),0);
  for(const distance of [0,290,400,600,1100])assert.equal(runnerRouteElevation(distance),runnerRouteElevation(distance+2520));
  const game=new RunnerEngine({phase(){},coins(){},finish(){},sound(){},zone(){},route(){}});
  // Generate future geometry without starting or advancing a run.
  game.objects=[];game.distance=2020;game.random=()=>.9;game.generateAhead();
  const tunnel=game.objects.filter(o=>o.district===5);
  assert.ok(tunnel.some(o=>o.kind==='tunnel-wall'));
  assert.ok(tunnel.some(o=>o.kind==='car'));
  assert.ok(tunnel.every(o=>!['building','crossing','boat'].includes(o.kind)));
});
