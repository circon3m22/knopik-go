import assert from 'node:assert/strict';
import test from 'node:test';
import {RunnerEngine,runnerDistrict,RUNNER_LANE_WIDTH} from '../app/runner-engine.ts';
import {RUNNER_ZONES,RUNNER_WORLD_CYCLE,runnerDistrictLight,runnerWeatherExposure} from '../app/runner-districts.ts';
import {runnerAtmosphere} from '../app/runner-atmosphere.ts';
import {runnerSupportHeight,runnerJumpObstacle} from '../app/runner-surfaces.ts';
import {RunnerFrameBudget} from '../app/runner-frame-budget.ts';
import {setRunnerAttribute,removeRunnerAttribute} from '../app/runner-svg.ts';

const events={phase(){},coins(){},finish(){},sound(){},zone(){},route(){}};
function geometry(seed,distance) {
  // Build static future geometry only, without start(), update() or a game session.
  const game=new RunnerEngine(events);
  Object.assign(game,{objects:[],seed:0,distance,randomState:seed,nextId:0,nextRow:distance+32,nextScenery:distance+9,nextCrossing:distance+170,rowIndex:0,sceneryIndex:0,lastRowEnd:distance+12,lastMandatory:-10,safeLane:0});
  game.generateAhead();return game;
}
test('park has no houses or traffic cars; hedges support running and have a roof coin trail',()=>{
  const seen=new Set();
  for(let seed=1;seed<=24;seed++) {
    const game=geometry(seed,2940),park=game.objects.filter(o=>o.district===7);
    park.forEach(o=>seen.add(o.kind));
    assert.ok(park.every(o=>!['building','city-block','car','truck','crossing'].includes(o.kind)));
    for(const hedge of park.filter(o=>o.kind==='hedge')) {
      assert.equal(runnerSupportHeight(hedge,hedge.z-6,hedge.x/RUNNER_LANE_WIDTH),52);
      assert.equal(runnerSupportHeight(hedge,hedge.z+hedge.depth,hedge.x/RUNNER_LANE_WIDTH),-1);
      assert.equal(runnerSupportHeight(hedge,hedge.z-6,hedge.x/RUNNER_LANE_WIDTH+1),-1);
      assert.ok(park.some(o=>o.kind==='coin'&&o.x===hedge.x&&Math.abs(o.z-hedge.z)<15&&o.height===52));
    }
    for(const low of park.filter(o=>o.kind==='thorn'||o.kind==='mower')) assert.ok(runnerJumpObstacle(low.kind)&&low.height+4<485**2/(2*1280));
    assert.ok(game.objects.length<768);
  }
  for(const kind of ['park-tree','mower','hedge','thorn','arch','sahur'])assert.ok(seen.has(kind),kind);
});
test('Chinese market has its own obstacle set and a clear lane or common feasible action',()=>{
  const hazards=['cargo','sahur','fence','arch'];
  for(let seed=1;seed<=20;seed++) {
    const game=geometry(seed,2520),market=game.objects.filter(o=>o.district===6);
    assert.ok(market.some(o=>o.kind==='building')&&market.some(o=>o.kind==='stall'));
    assert.ok(market.every(o=>!['car','truck','crossing','barrier','mower'].includes(o.kind)));
    for(let z=2560;z<2920;z++) {
      const row=market.filter(o=>hazards.includes(o.kind)&&Math.abs(o.z-z)<o.depth/2+1);
      const lanes=new Set(row.map(o=>o.x/RUNNER_LANE_WIDTH));
      if(lanes.size===3)assert.ok(row.every(o=>o.kind===row[0].kind)&&['fence','arch'].includes(row[0].kind));
    }
  }
});
test('all thirteen districts keep day/night transitions and exterior rain; tunnel shelters rainfall',()=>{
  assert.equal(RUNNER_ZONES.length,13);assert.equal(runnerDistrict(RUNNER_WORLD_CYCLE),0);
  const lightest=runnerAtmosphere(130),darkest=runnerAtmosphere(52),storm=runnerAtmosphere(180),rain=runnerAtmosphere(198);
  assert.ok(lightest.illumination>darkest.illumination);
  assert.ok(storm.rain>0&&rain.rain>0);
  for(let zone=0;zone<RUNNER_ZONES.length;zone++) {
    assert.ok(runnerDistrictLight(zone,lightest.illumination)>runnerDistrictLight(zone,darkest.illumination));
    assert.equal(runnerWeatherExposure(zone)*rain.rain>0,zone!==5);
  }
  const sunset=runnerAtmosphere(0);assert.equal(sunset.phase,0);assert.ok(parseInt(sunset.sky.slice(1,3),16)>parseInt(sunset.sky.slice(5,7),16));
});
test('heavy scenes adapt raster density without imposing a 30 FPS ceiling',()=>{
  const budget=new RunnerFrameBudget();assert.equal(budget.pixelRatio(3),1);
  for(let i=0;i<210;i++){assert.ok(budget.due(i*17));budget.painted(i*17,24);}
  assert.equal(budget.fps,60);assert.equal(budget.pixelRatio(3),.75);
  assert.ok(budget.due(210*17+1));budget.reset();assert.ok(budget.due(0));
});
test('cached SVG attributes avoid repeated mutations and do not lose a restored terrain clip',()=>{
  const attrs=new Map();let writes=0;
  const node={setAttribute(k,v){writes++;attrs.set(k,v);},removeAttribute(k){attrs.delete(k);}};
  for(let i=0;i<120;i++){setRunnerAttribute(node,'display','none');setRunnerAttribute(node,'fill','#c0ffee');}
  assert.equal(writes,2);
  setRunnerAttribute(node,'clip-path','url(#hill)');removeRunnerAttribute(node,'clip-path');setRunnerAttribute(node,'clip-path','url(#hill)');
  assert.equal(attrs.get('clip-path'),'url(#hill)');assert.equal(writes,4);
});
test('rebinding renderer callbacks retains the prepared world, seed, balance and distance',()=>{
  const game=geometry(71,3000),world=game.objects,seed=game.seed;
  game.coins=17;game.setEvents({...events});
  assert.equal(game.objects,world);assert.equal(game.seed,seed);assert.equal(game.distance,3000);assert.equal(game.coins,17);
});

test('a 13 ms renderer keeps 60 paintings and reduces medium density to reserve input headroom',()=>{
 const budget=new RunnerFrameBudget();for(let i=0;i<600;i++)budget.painted(i*1000/60,13);
 assert.equal(budget.fps,60);assert.equal(budget.pixelRatio(3),.75);
});

test('automatic density notices GPU stalls even with cheap JS, then recovers without oscillation',()=>{
 const budget=new RunnerFrameBudget();for(let i=0;i<210;i++)budget.painted(i*34,3);
 assert.equal(budget.pixelRatio(3),.75);let now=210*34;
 for(let i=0;i<300;i++){now+=1000/60;budget.painted(now,3);}assert.equal(budget.pixelRatio(3),.75);
 for(let i=0;i<700;i++){now+=1000/60;budget.painted(now,3);}assert.equal(budget.pixelRatio(3),1.25);
 // A long pause is not measured as a slow frame when resuming.
 budget.reset();budget.painted(now+60000,3);assert.equal(budget.pixelRatio(3),1.25);
});

test('sharp and fast are explicit stable choices and never upscale a low density screen',()=>{
 for(const mode of ['sharp','fast']){
  const b=new RunnerFrameBudget();assert.equal(b.pixelRatio(3,mode),mode==='sharp'?2.5:.65);
  for(let i=0;i<600;i++)b.painted(i*34,40);
  assert.equal(b.pixelRatio(3,mode),mode==='sharp'?2.5:.65);assert.equal(b.fps,60);
  assert.equal(b.pixelRatio(.8,mode),mode==='sharp'?.8:.65);assert.equal(b.pixelRatio(NaN,mode),mode==='sharp'?1:.65);
  assert.equal(b.pixelRatio(3,'auto'),1);
 }
});
