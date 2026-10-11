import assert from 'node:assert/strict';
import test from 'node:test';
import {RunnerEngine,RUNNER_PLAYER_Z} from '../app/runner-engine.ts';
import {runnerSupportHeight} from '../app/runner-surfaces.ts';
import {runnerPondPlan} from '../app/runner-pond.ts';
import {runnerDistrictRoute} from '../app/runner-districts.ts';
const noop=()=>{},events={phase:noop,coins:noop,finish:noop,sound:noop,zone:noop,route:noop};

test('long isolated runs keep all ten shuffled regions, bounded objects and one consistent coin ledger',()=>{
  for(const seed of [17,902,8401]) {
    let credited=0,finished=0;const visited=new Set();
    const game=new RunnerEngine({...events,coins:n=>credited+=n,finish:()=>finished++,zone:n=>visited.add(n)},{immortal:true});
    Object.assign(game,{objects:[],seed,randomState:seed,nextRow:32,nextScenery:9,nextCrossing:170,nextId:0,rowIndex:0,sceneryIndex:0,lastRowEnd:12,safeLane:0});
    game.generateAhead();const prepared=game.objects;game.start();assert.equal(game.objects,prepared);
    for(let frame=0;frame<600*60;frame++) {
      if(frame%70===0)game.input(game.lane===1?'left':'right');
      if(frame%91===0)game.input('jump');
      if(frame%139===0)game.input('roll');
      if(frame===18000){game.collectPowerup('firework-pickup');game.pause();const distance=game.distance,time=game.elapsed,flight=game.flightAge;for(let i=0;i<100;i++)game.update(1/60);assert.equal(game.distance,distance);assert.equal(game.elapsed,time);assert.equal(game.flightAge,flight);game.resume();}
      const previous=game.distance;game.update(1/60);
      assert.ok(game.distance>=previous);assert.ok(game.objects.length<=768&&game.particles.length<=72);
      assert.ok([game.distance,game.height,game.lanePosition,game.speed].every(Number.isFinite));
    }
    assert.equal(game.phase,'running');assert.equal(finished,0);assert.equal(visited.size,10);
    assert.equal(game.coins,credited);assert.ok(game.distance>28000);
  }
});

test('normal pond jumps can traverse boats without immortality, shield or invisible ground',()=>{
  for(const seed of [31,92,177]) {
    const game=new RunnerEngine(events);let randomState=seed;
    const random=()=>{randomState=(Math.imul(randomState,1664525)+1013904223)>>>0;return randomState/4294967296;};
    const start=3360,decks=runnerPondPlan(start,random);
    Object.assign(game,{seed:0,objects:decks.map((d,id)=>({id,kind:'floating',x:d.lane*94,z:d.z,depth:d.depth,height:d.height,variant:d.variant,district:8,passed:false,activatedAt:-1})),distance:start+6,phase:'running',elapsed:100,speed:41,height:24,platformHeight:24,grounded:true,nextRow:start+425,nextScenery:start+425,nextCrossing:start+600});
    let jumps=0;
    for(let frame=0;frame<2000&&game.distance<start+393;frame++) {
      const feet=game.distance+RUNNER_PLAYER_Z;
      const current=game.objects.find(o=>runnerSupportHeight(o,game.distance,game.lanePosition)>=0);
      if(current&&game.grounded&&current.z+current.depth/2-feet<6) {
        const next=game.objects.filter(o=>o.kind==='floating'&&o.z>current.z+.1).sort((a,b)=>a.z-b.z||Math.abs(a.x/94-game.lane)-Math.abs(b.x/94-game.lane))[0];
        if(next) {if(next.x/94<game.lane)game.input('left');else if(next.x/94>game.lane)game.input('right');game.input('jump');jumps++;}
      }
      game.update(1/60);assert.equal(game.phase,'running',`seed ${seed}, distance ${game.distance-start}, height ${game.height}`);
    }
    assert.ok(game.distance>=start+393&&jumps>=8);
  }
});

test('collision finishes once; replay rebuilds in the city, and invalid frame durations cannot corrupt a run',()=>{
  let completed=0;const game=new RunnerEngine({...events,finish:()=>completed++});game.start();
  for(let i=0;i<181;i++)game.update(1/60);
  assert.equal(game.phase,'running');const before={distance:game.distance,elapsed:game.elapsed};
  for(const dt of [0,-1,NaN,Infinity])game.update(dt);
  assert.deepEqual({distance:game.distance,elapsed:game.elapsed},before);
  game.objects=[{id:999,kind:'cargo',x:0,z:game.distance+6,height:102,depth:8,variant:0,district:0,passed:false,activatedAt:-1}];
  game.update(1/60);assert.equal(game.phase,'caught');
  for(let i=0;i<75;i++)game.update(1/60);
  game.close();game.close();assert.equal(completed,1);
  game.start();assert.equal(game.phase,'intro');assert.equal(game.distance,0);assert.equal(game.coins,0);
  assert.equal(runnerDistrictRoute(game.seed)[0],0);assert.ok(game.objects.some(o=>o.kind==='fence'));
});

test('full low blockades and arches remain passable at normal, medium and maximum speeds',()=>{
  for(const speed of [22,41,59])for(const kind of ['fence','barrier','mower','thorn','arch']) {
    const game=new RunnerEngine(events);
    Object.assign(game,{phase:'running',elapsed:speed===22?0:speed===41?100:220,speed,distance:1000,height:0,platformHeight:0,grounded:true,nextRow:2000,nextScenery:2000,nextCrossing:2000});
    game.objects=[-1,0,1].map((lane,id)=>({id,kind,x:lane*94,z:1006+speed*.3,height:kind==='arch'?100:56,depth:kind==='arch'?0:3,variant:0,district:0,passed:false,activatedAt:-1}));
    game.input(kind==='arch'?'roll':'jump');
    for(let frame=0;frame<42;frame++){game.update(1/60);assert.equal(game.phase,'running',`${kind}, speed ${speed}`);}
  }
});
