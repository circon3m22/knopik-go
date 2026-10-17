import assert from 'node:assert/strict';
import test from 'node:test';
import {runnerDistrictRoute,runnerDistrictIndex,runnerPondWater,RUNNER_DISTRICT_LENGTH,RUNNER_WORLD_CYCLE,RUNNER_ZONES} from '../app/runner-districts.ts';
import {runnerPondPlan,runnerPondFalling} from '../app/runner-pond.ts';
import {RunnerEngine,runnerRouteElevation} from '../app/runner-engine.ts';
import {runnerSupportHeight} from '../app/runner-surfaces.ts';
const events={phase(){},coins(){},finish(){},sound(){},zone(){},route(){}};
function rng(seed) {return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}

test('seeded routes start in the city, shuffle every run/cycle and never change when revisited',()=>{
  const starts=new Set(),routes=new Set();
  for(let seed=1;seed<=100;seed++)for(let cycle=0;cycle<3;cycle++) {
    const route=runnerDistrictRoute(seed,cycle);
    assert.equal(route[0],0);assert.equal(route.length,RUNNER_ZONES.length);assert.equal(new Set(route).size,RUNNER_ZONES.length);
    assert.deepEqual(runnerDistrictRoute(seed,cycle),route);
    starts.add(route[1]);routes.add(route.join(','));
    for(let i=0;i<route.length;i++)assert.equal(runnerDistrictIndex(cycle*RUNNER_WORLD_CYCLE+i*420+20,seed),route[i]);
  }
  assert.equal(starts.size,RUNNER_ZONES.length-1);assert.ok(routes.size>200);
});

test('all roof ramps return to street height before a shuffled district boundary',()=>{
  for(let seed=1;seed<=32;seed++)for(let segment=0;segment<30;segment++) {
    const start=segment*420,zone=runnerDistrictIndex(start,seed);
    assert.equal(runnerRouteElevation(start,seed),0);
    assert.equal(runnerRouteElevation(start+415,seed),0);
    if(zone!==0)for(let p=0;p<420;p+=10)assert.equal(runnerRouteElevation(start+p,seed),0);
    else assert.ok(runnerRouteElevation(start+335,seed)>100);
  }
});

test('pond paths have real jumpable water gaps, adjacent landings and three entry/exit pontoons',()=>{
  const types=new Set();
  for(let seed=1;seed<=80;seed++) {
    const decks=runnerPondPlan(3360,rng(seed)),groups=new Map();
    for(const deck of decks){types.add(deck.variant);if(!groups.has(deck.z))groups.set(deck.z,[]);groups.get(deck.z).push(deck);}
    const rows=[...groups.values()].sort((a,b)=>a[0].z-b[0].z);
    assert.equal(rows[0].length,3);assert.equal(rows.at(-1).length,3);
    let lane=0,previous=rows[0][1];
    for(const row of rows.slice(1,-1)) {
      const deck=row[0],gap=deck.z-deck.depth/2-(previous.z+previous.depth/2);
      assert.ok(gap>=4.99&&gap<=10.01,`water gap ${gap}`);
      assert.ok(Math.abs(deck.lane-lane)<=1);
      assert.equal(runnerSupportHeight({kind:'floating',x:deck.lane*94,...deck},deck.z-6,deck.lane),24);
      assert.equal(runnerSupportHeight({kind:'floating',x:deck.lane*94,...deck},deck.z-6,deck.lane+1),-1);
      lane=deck.lane;previous=deck;
    }
    assert.ok(decks.every(x=>x.height===24&&x.depth>=26));
  }
  assert.equal(types.size,4);
});

test('water cannot behave like invisible ground, while jumping, support and flight remain safe',()=>{
  assert.equal(runnerPondWater(8*420),false);assert.equal(runnerPondWater(8*420+80),true);
  assert.equal(runnerPondWater(8*420+405),false);assert.equal(runnerPondWater(9*420+80),false);
  assert.equal(runnerPondFalling(true,-48,-10,false),true);
  for(const args of [[true,24,24,false],[true,-48,70,false],[true,-48,-10,true],[false,-48,-10,false]])assert.equal(runnerPondFalling(...args),false);
});

test('shuffled pond geometry contains boats and cherry banks, and business towers are tall without growing pools',()=>{
  for(let seed=1;seed<=24;seed++)for(const zone of [8,9]) {
    const sequence=runnerDistrictRoute(seed),start=sequence.indexOf(zone)*RUNNER_DISTRICT_LENGTH;
    const game=new RunnerEngine(events);
    Object.assign(game,{objects:[],seed,distance:start,randomState:seed,nextId:0,nextRow:start+20,nextScenery:start+4,nextCrossing:start+170,rowIndex:5,lastRowEnd:start,sceneryIndex:0,safeLane:0});
    game.generateAhead();
    const local=game.objects.filter(o=>o.district===zone);
    assert.ok(game.objects.length<768);
    for(const object of game.objects)assert.equal(object.district,game.districtAt(object.z));
    if(zone===8) {
      assert.ok(local.some(o=>o.kind==='floating')&&local.some(o=>o.kind==='cherry-tree'));
      assert.ok(local.every(o=>!['car','truck','building','city-block','crossing','fence','arch','cargo'].includes(o.kind)));
      for(const deck of local.filter(o=>o.kind==='floating'))assert.ok(local.some(o=>o.kind==='coin'&&o.x===deck.x&&Math.abs(o.z-deck.z)<deck.depth/2&&o.height===24));
    }else {
      assert.ok(local.some(o=>o.kind==='building'&&o.height>=580));
      assert.ok(local.some(o=>o.kind==='car'));
      assert.ok(local.filter(o=>o.kind==='building'||o.kind==='city-block').every(o=>o.height>=420&&o.depth>=42));
    }
  }
});
