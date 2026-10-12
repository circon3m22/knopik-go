import assert from 'node:assert/strict';
import test from 'node:test';
import { RunnerProjection } from '../app/runner-projection.ts';
import { projectRunnerPoint, runnerTerrainCrests } from '../app/runner-world.ts';
import { setRunnerAttribute, removeRunnerAttribute, setRunnerStyle } from '../app/runner-svg.ts';
import { RunnerRenderer } from '../app/runner-renderer.ts';
import { RunnerEngine } from '../app/runner-engine.ts';
import { RunnerArchitecture } from '../app/runner-architecture.ts';
import { runnerHasElevatedTerrain } from '../app/runner-terrain-range.ts';
import { runnerRouteElevation } from '../app/runner-engine.ts';
import { runnerSvgScene, svgDocument, svgMetrics, resetSvgMetrics } from './helpers/runner-svg-dom.mjs';

test('cached projection is pixel-identical through hills, flight, explicit floors and camera resets', () => {
  const projection = new RunnerProjection();
  for (const seed of [0,17,902]) for (const distance of [0,280,306,395,625,3350,4199,8400]) for (const flight of [0,.4,1]) {
    const camera = { height: 780, horizon: 248.125, distance, elevation: 94, seed, flight };
    projection.reset(camera);
    for (const z of [-25,-7.9,0,6,45.3,179,340,600,9999]) for (const x of [-1200,-180,0,178,1200]) for (const height of [0,26,300]) for (const floor of [undefined,0,140]) {
      assert.deepEqual(projection.project(x,z,height,floor), projectRunnerPoint(camera,x,z,height,floor));
    }
    const reused = [123]; assert.equal(projection.terrainCrests(600,reused),reused);
    assert.deepEqual(reused,runnerTerrainCrests(camera));
  }
});

test('absent attributes are removed once and can be restored, including empty attributes', () => {
  const node = { attrs:new Map([['transform','scale(1)']]), removals:0, getAttribute(k){return this.attrs.get(k)??null;}, setAttribute(k,v){this.attrs.set(k,v);}, removeAttribute(k){this.removals++;this.attrs.delete(k);} };
  for(let i=0;i<100;i++)removeRunnerAttribute(node,'clip-path');
  assert.equal(node.removals,0);
  for(let i=0;i<100;i++)removeRunnerAttribute(node,'transform');
  assert.equal(node.removals,1);
  setRunnerAttribute(node,'transform','');assert.equal(node.attrs.get('transform'),'');
  removeRunnerAttribute(node,'transform');setRunnerAttribute(node,'transform','scale(2)');
  assert.equal(node.attrs.get('transform'),'scale(2)');assert.equal(node.removals,2);
});

test('painting an unchanged prepared world creates, moves and removes no DOM nodes', () => {
  const previous = globalThis.document; globalThis.document = svgDocument();
  try {
    const engine = new RunnerEngine({phase(){},coins(){},finish(){},sound(){},zone(){},route(){}});
    const renderer = new RunnerRenderer(runnerSvgScene(),'performance');
    renderer.render(engine); resetSvgMetrics();
    for(let i=0;i<60;i++)renderer.render(engine);
    assert.equal(svgMetrics.created,0);assert.equal(svgMetrics.moves,0);assert.equal(svgMetrics.removals,0);
    assert.equal(svgMetrics.writes,0);
  } finally { globalThis.document = previous; }
});

test('overlapping window strokes retain painter order when a pooled façade changes height', () => {
  const previous = globalThis.document; globalThis.document = svgDocument();
  try {
    const architecture=new RunnerArchitecture(runnerSvgScene()),projection=new RunnerProjection();
    projection.reset({height:780,horizon:280.8,distance:0,elevation:0,seed:17});
    const object={id:1,kind:'building',x:-252,z:40,height:190,depth:22,variant:0,district:0,passed:false,activatedAt:-1};
    const draw=height=>{architecture.begin();const node=architecture.draw({...object,height},40,projection.project,'#abcdef',false,1);architecture.end();return node.querySelectorAll('path').filter(path=>path.getAttribute('visibility')==='visible'&&['#ebbf8b','#45475e'].includes(path.getAttribute('fill')));};
    const expected=Array.from({length:9},(_,i)=>i%5===0?'#ebbf8b':'#45475e');
    assert.deepEqual(draw(190).map(path=>path.getAttribute('fill')),expected);
    assert.deepEqual(draw(600).map(path=>path.getAttribute('fill')),expected);
    assert.deepEqual(draw(190).map(path=>path.getAttribute('fill')),expected);
  } finally { globalThis.document=previous; }
});

test('unchanged CSS colors never re-invalidate the SVG scene',()=>{
  let writes=0;const node={style:{setProperty(){writes++;}}};
  for(let i=0;i<200;i++){setRunnerStyle(node,'--run-sky','#aabbcc');setRunnerStyle(node,'--run-window','#ddeeff');}
  assert.equal(writes,2);setRunnerStyle(node,'--run-sky','#112233');assert.equal(writes,3);
});

test('flat-road fast path never skips a roof ramp, including shuffled cycle boundaries',()=>{
  for(const seed of [0,17,902])for(let distance=-30;distance<=9000;distance+=113) {
    const elevated=runnerHasElevatedTerrain(distance,seed);
    if(!elevated)for(let offset=-24;offset<=600;offset++)assert.equal(runnerRouteElevation(distance+offset,seed),0,`${seed}/${distance}/${offset}`);
  }
});

test('building meshes keep their identity when other buildings enter, leave or reorder',()=>{
  const previous=globalThis.document;globalThis.document=svgDocument();
  try {
    const svg=runnerSvgScene(),architecture=new RunnerArchitecture(svg),projection=new RunnerProjection();
    projection.reset({height:780,horizon:280.8,distance:0,elevation:0,seed:17});
    const a={id:1,kind:'building',x:-252,z:70,height:400,depth:22,variant:0,district:0,passed:false,activatedAt:-1},b={...a,id:2,x:252,z:100};
    const draw=object=>architecture.draw(object,object.z,projection.project,'#abcdef',false,1);
    architecture.begin([a,b]);const firstA=draw(a),firstB=draw(b);architecture.end();
    architecture.begin([a,b]);assert.equal(draw(b),firstB);assert.equal(draw(a),firstA);architecture.end();
    architecture.begin([a]);assert.equal(draw(a),firstA);architecture.end();assert.equal(firstB.getAttribute('display'),'none');
    assert.equal(svg.querySelectorAll('[data-runner-mesh="building"]').length,132);
  }finally{globalThis.document=previous;}
});
