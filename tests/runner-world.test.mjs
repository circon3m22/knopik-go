import assert from 'node:assert/strict';
import test from 'node:test';
import { RunnerEngine, RUNNER_LANE_WIDTH, runnerRouteElevation } from '../app/runner-engine.ts';
import { projectRunnerPoint, runnerTerrainCrests } from '../app/runner-world.ts';

test('far road never acquires an artificial upward bend above the horizon', () => {
  const camera={height:680,horizon:244.8,distance:0,elevation:0};
  for(let z=0;z<=600;z+=5) assert.ok(projectRunnerPoint(camera,0,z).y>=244.5,`z=${z}`);
  const flat={...camera,distance:700};
  for(const z of [180,400,600]) {
    const expected=Math.round((flat.horizon+flat.height*.58*30/(30+z))*2)/2;
    assert.equal(projectRunnerPoint(flat,0,z).y,expected);
  }
});

test('scenery follows street elevation; hill crests hide lower geometry beyond the slope', () => {
  const camera={height:680,horizon:244.8,distance:300,elevation:runnerRouteElevation(306)};
  const road=projectRunnerPoint(camera,0,6),decor=projectRunnerPoint(camera,178,6),house=projectRunnerPoint(camera,252,6);
  assert.equal(decor.y,road.y); assert.equal(house.y,road.y);
  assert.ok(projectRunnerPoint(camera,178,6,0,0).y>decor.y+40,'old hard-coded floor placed decoration far below the street');
  const hill={...camera,distance:400,elevation:180},crests=runnerTerrainCrests(hill);
  assert.equal(crests.length,75);
  crests.forEach((y,i)=>{ if(i) assert.ok(y<=crests[i-1]); });
  assert.ok(crests.every(Number.isFinite));
});

test('streets favour low obstacles; full blockades have a common feasible action and recovery space', () => {
  // Constructor only builds geometry. This does not start or simulate a runner session.
  const events={phase(){},coins(){},finish(){},sound(){},zone(){},route(){}};
  const blockedKinds=['cargo','truck','car','barrier','fence','arch','gap','sahur'];
  const totals={low:0,roll:0,high:0,mandatory:0,powerups:0};
  for(let seed=0;seed<20;seed++) {
    const game=new RunnerEngine(events);
    Object.assign(game,{seed:seed+1,randomState:seed+1,objects:[],nextRow:32,nextScenery:9,nextCrossing:170,nextId:0,rowIndex:0,sceneryIndex:0,lastRowEnd:12,lastMandatory:-10,safeLane:0,nextPowerupRow:4});game.generateAhead();
    const obstacles=game.objects.filter(o=>blockedKinds.includes(o.kind));
    assert.equal(Math.min(...obstacles.map(o=>o.z)),32);
    assert.ok(obstacles.filter(o=>o.z<125).length>=6);
    for(let z=25;z<590;z+=1) {
      const row=obstacles.filter(o=>Math.abs(o.z-z)<=o.depth/2+1);
      const occupied=new Set(row.map(o=>Math.round(o.x/RUNNER_LANE_WIDTH)));
      if(occupied.size===3) {
        assert.ok(row.every(o=>o.kind===row[0].kind && o.z===row[0].z));
        assert.ok(['fence','arch'].includes(row[0].kind),`no jumpable/rollable passage at ${z}`);
      }
    }
    const first=obstacles.filter(o=>o.z===32);
    assert.equal(first.length,2);
    const open=[-1,0,1].find(lane=>first.every(o=>o.x!==lane*RUNNER_LANE_WIDTH));
    assert.equal(Math.abs(open),1,'first switch is one neighbouring lane');
    assert.ok(game.objects.some(o=>o.kind==='coin' && o.z>25 && o.z<39 && Math.abs(o.x-open*RUNNER_LANE_WIDTH)<1));
    for(const o of obstacles) totals[['barrier','fence','gap'].includes(o.kind)?'low':o.kind==='arch'?'roll':'high']++;
    for(const o of obstacles.filter(o=>o.x===0)) {
      const row=obstacles.filter(other=>other.z===o.z);
      if(row.length!==3) continue;
      totals.mandatory++;
      const before=obstacles.filter(other=>other.z<o.z);
      const priorEnd=Math.max(...before.map(other=>other.z+other.depth/2));
      const after=obstacles.filter(other=>other.z>o.z);
      const nextStart=Math.min(...after.map(other=>other.z-other.depth/2));
      const arrival=Math.sqrt(22**2+2*.19*o.z);
      assert.ok((o.z-priorEnd)/arrival>=.78,'room to prepare for forced action');
      assert.ok((nextStart-o.z)/arrival>=1.05,'room to recover after forced action');
      if(o.kind==='fence') assert.ok(o.height>44 && o.height+4<485**2/(2*1280));
    }
    for(const power of game.objects.filter(o=>o.kind.endsWith('-pickup'))) {
      totals.powerups++;
      assert.ok(obstacles.every(o=>Math.abs(o.z-power.z)>6 || o.x!==power.x),'pickup on a clear approach');
    }
  }
  assert.ok(totals.low>totals.roll && totals.roll>totals.high,JSON.stringify(totals));
  assert.ok(totals.mandatory>=20 && totals.powerups>=20);
});
