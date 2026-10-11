import assert from 'node:assert/strict';
import test from 'node:test';
import { RunnerEngine } from '../app/runner-engine.ts';
import { RUNNER_FIREWORK_SECONDS, runnerFlightHeight, runnerGroundChaser } from '../app/runner-power-engine.ts';
const events={phase(){},coins(){},finish(){},sound(){},zone(){},route(){}};

test('magnet pickups refresh thirty gameplay seconds; flight is seven seconds and cannot stack',()=>{
  // Exercise pickup state only; no runner is started or advanced.
  const game=new RunnerEngine(events);
  game.collectPowerup('magnet-pickup'); assert.equal(game.magnetSeconds,0);
  game.phase='running'; game.elapsed=12;
  game.collectPowerup('magnet-pickup'); assert.equal(game.magnetSeconds,30); assert.equal(game.magnetic,true);
  game.elapsed=30; assert.equal(game.magnetSeconds,12);
  game.collectPowerup('magnet-pickup'); assert.equal(game.magnetSeconds,30);
  game.elapsed=61; assert.equal(game.magnetic,false);
  game.height=62; game.collectPowerup('firework-pickup'); assert.equal(game.flightSeconds,7); assert.equal(game.rolling,false);
  const coins=game.objects.filter(o=>o.kind==='coin' && o.height===210).length;
  assert.equal(coins,15); game.flightAge=3; game.collectPowerup('firework-pickup'); assert.equal(game.flightSeconds,4);
  assert.equal(game.objects.filter(o=>o.kind==='coin' && o.height===210).length,coins);
  game.pause(); game.collectPowerup('magnet-pickup'); assert.equal(game.elapsed,61);
  assert.equal(game.flightSeconds,4);
});

test('flight rises from a car roof and lands smoothly on changing support',()=>{
  assert.equal(RUNNER_FIREWORK_SECONDS,7);
  assert.equal(runnerFlightHeight(0,62,0),62);
  assert.equal(runnerFlightHeight(7,62,62),62);
  assert.equal(runnerFlightHeight(7,0,0),0);
  for(const age of [0,.75,5.6,7]) {
    const centre=runnerFlightHeight(age,62,62),near=runnerFlightHeight(Math.max(0,age-.001),62,62);
    assert.ok(Math.abs(centre-near)<.02,'no snap at phase boundary');
  }
  for(let age=0;age<=7;age+=.02) assert.ok(runnerFlightHeight(age,62,0)>=0 && runnerFlightHeight(age,62,0)<=214);
});

test('ground chaser dodges tall obstacles, jumps fences and rolls through full arches',()=>{
  const object=(kind,lane,z,height=56)=>({kind,x:lane*94,z,height,depth:3});
  assert.equal(runnerGroundChaser([object('cargo',0,9)],0,22,0).lane,-1);
  const fences=[-1,0,1].map(lane=>object('fence',lane,6));
  assert.ok(runnerGroundChaser(fences,0,22,0).height>80);
  assert.equal(runnerGroundChaser(fences,30,22,0).height,0);
  const arches=[-1,0,1].map(lane=>object('arch',lane,2));
  const pose=runnerGroundChaser(arches,0,22,0);
  assert.ok(pose.rollAge>=0); assert.equal(pose.height,0);
  assert.ok(runnerGroundChaser([object('cargo',0,2),object('truck',-1,2)],0,22,0).lane===1);
});

test('road speed pads have short gameplay timers and override rather than stack',()=>{
  const game=new RunnerEngine(events); game.phase='running'; game.elapsed=5;
  game.collectPowerup('boost-pickup'); assert.equal(game.speedSeconds,4); assert.equal(game.speedEffect,'boost');
  game.elapsed=7; game.collectPowerup('slow-pickup'); assert.equal(game.speedSeconds,3); assert.equal(game.speedEffect,'slow');
  game.elapsed=10; assert.equal(game.speedSeconds,0);
});
