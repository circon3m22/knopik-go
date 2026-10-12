import assert from 'node:assert/strict';
import test from 'node:test';
import {RunnerEngine} from '../app/runner-engine.ts';
import {runnerDistrictRoute} from '../app/runner-districts.ts';
import {RunnerTunnel} from '../app/runner-tunnel.ts';
import {runnerSvgScene,svgDocument} from './helpers/runner-svg-dom.mjs';
const events={phase(){},coins(){},finish(){},sound(){},zone(){},route(){}};
function geometry(seed,zone) {
  const start=runnerDistrictRoute(seed).indexOf(zone)*420,game=new RunnerEngine(events);
  Object.assign(game,{seed,objects:[],distance:start-45,randomState:seed,nextId:0,nextRow:start+32,nextScenery:start+4,nextCrossing:start+170,rowIndex:0,sceneryIndex:0,lastRowEnd:start+12,lastPattern:'',nextPowerupRow:4,lastMandatory:-10,safeLane:0});
  game.generateAhead();return {game,start,objects:game.objects.filter(o=>o.district===zone)};
}
test('park and pond have continuous near and distant tree rows on both banks',()=>{
  for(const seed of [17,902,8401])for(const zone of [7,8]) {
    const {game,start,objects}=geometry(seed,zone),kind=zone===7?'park-grove':'cherry-grove';
    for(const side of [-1,1]) {
      const groves=objects.filter(o=>o.kind===kind&&Math.sign(o.x)===side).toSorted((a,b)=>a.z-b.z);
      assert.ok(groves.length>=16);assert.ok(groves.some(o=>Math.abs(o.x)>900));
      assert.ok(groves.some(o=>o.z>start+360));
      for(let i=1;i<groves.length;i++)assert.ok(groves[i].z-groves[i-1].z<45);
    }
    assert.ok(game.objects.length<768);
  }
});
test('business district uses its own plazas, LED lights, signs, bridges and tower setbacks',()=>{
  for(const seed of [17,902,8401]) {
    const {objects}=geometry(seed,9);
    for(const kind of ['office-plaza','office-light','office-totem','office-link'])assert.ok(objects.some(o=>o.kind===kind),kind);
    assert.ok(objects.filter(o=>o.kind==='building').every(o=>Math.abs(o.x)>=330));
    assert.ok(new Set(objects.filter(o=>o.kind==='building').map(o=>Math.floor(o.height/150))).size>=3);
  }
});
test('each tunnel has one portal with no text and safely reuses the tunnel pool',()=>{
  const previous=globalThis.document;globalThis.document=svgDocument();
  try {
    for(const seed of [17,902,8401]) {
      const {game,objects}=geometry(seed,5),portals=objects.filter(o=>o.kind==='tunnel-entrance');
      assert.equal(portals.length,1);game.generateAhead();assert.equal(game.objects.filter(o=>o.kind==='tunnel-entrance').length,1);
      const svg=runnerSvgScene(),pool=new RunnerTunnel(svg),project=(x,z,h=0)=>({x,y:z-h,scale:1});
      for(const kind of ['tunnel-entrance','tunnel-wall','tunnel-entrance']) {
        pool.begin();const mesh=pool.draw({...portals[0],kind},70,project,15,false);pool.end();
        assert.equal(mesh.querySelectorAll('text').length,0);
        for(const path of mesh.querySelectorAll('path'))assert.doesNotMatch(path.getAttribute('d')??'',/NaN|Infinity/);
      }
      assert.equal(svg.querySelectorAll('[data-runner-mesh="tunnel"]').length,30);
    }
  }finally{globalThis.document=previous;}
});
