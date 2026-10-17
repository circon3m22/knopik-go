import './helpers/tsx-loader.mjs';
import test from 'node:test';import assert from 'node:assert/strict';
import {createElement as h} from 'react';import {renderToStaticMarkup as render} from 'react-dom/server';
const {HUNTER_CLOTHING}=await import('../app/hunter-clothing.tsx');
const {KnopikAnimator}=await import('../app/knopik-adventure-animation.ts');
import {knopikSkinColor} from '../app/knopik-skins.ts';
import {readCoopEquipment} from '../app/coop-protocol.ts';
import {CoopEngine} from '../app/coop-engine.ts';
import {packCoopSnapshot,unpackCoopSnapshot} from '../app/coop-wire.ts';
import {RunnerEngine} from '../app/runner-engine.ts';import {RunnerRenderer} from '../app/runner-renderer.ts';
import {cloneRunnerScene} from '../app/runner-scene-model.ts';
import {parseAdventureSvg} from './helpers/adventure-svg-dom.mjs';
const {AnimatedAdventureKnopik}=await import('../app/knopik-adventure-art.tsx');const {PixelDog}=await import('../app/pixel-artwork.tsx');const {RunnerScene}=await import('../app/runner-artwork.tsx');
const gear=accessory=>({skin:'hunter',hat:false,mohawk:false,accessory});
test('four Hunter wearables retain their own art in every direction and hunter fur restores cleanly',()=>{
 for(const kind of HUNTER_CLOTHING){
  assert.ok(readCoopEquipment(gear(kind)));const tap=render(h(PixelDog,{skin:'hunter',outfit:gear(kind),ears:true}));assert.ok(tap.includes('data-hunter-clothing="'+kind+'"'));assert.ok(tap.includes(knopikSkinColor('#d69a5b','hunter')));
  const root=parseAdventureSvg(render(h('svg',{},h(AnimatedAdventureKnopik)))),animator=new KnopikAnimator(root);
  for(let turn=0;turn<8;turn++){
   animator.paint({player:{x:0,y:0,hp:3,angle:turn*Math.PI/4},area:'sewer',weapon:'rifle',punchTime:0,punchSerial:0,moving:false,walkDistance:0,dodgeTime:0,equipment:gear(kind)},true);
   const worn=root.querySelectorAll('[data-hunter-clothing]').filter(n=>n.getAttribute('data-hunter-clothing')===kind);assert.ok(worn.length>=5);
   assert.ok(root.querySelectorAll('[fill]').some(n=>n.getAttribute('fill')===knopikSkinColor('#d69a5b','hunter')));
  }
  animator.paint({player:{x:0,y:0,hp:3,angle:0},area:'apartment',weapon:'fist',punchTime:0,punchSerial:0,moving:false,walkDistance:0,dodgeTime:0,equipment:{...gear(kind),skin:'classic'}},true);
  assert.ok(root.querySelectorAll('[fill]').some(n=>n.getAttribute('fill')==='#d69a5b'));assert.ok(root.querySelectorAll('[data-hunter-mark]').every(n=>n.getAttribute('display')==='none'));
 }
});
test('new campaign online retains hunter skin, different clothes, weapons and piercing hit history',()=>{
 const setup={mode:'campaign',level_id:35,host_equipment:gear('hunter-cloak'),guest_equipment:gear('raven-mask')},host=new CoopEngine(991,3,()=>{},setup),guest=new CoopEngine(991,3,()=>{},setup);
 host.bullets[0]={x:host.player.x,y:host.player.y,vx:1000,vy:0,life:.5,active:true,owner:'player',kind:'piercing',damage:4,maxLife:.74,hitIds:[0,1]};
 const packet=JSON.parse(JSON.stringify(packCoopSnapshot(host.snapshot()))),snapshot=unpackCoopSnapshot(packet,guest);assert.ok(snapshot);guest.applySnapshot(snapshot);
 assert.deepEqual(guest.actors.map(a=>a.equipment),[setup.host_equipment,setup.guest_equipment]);assert.deepEqual(guest.bullets[0].hitIds,[0,1]);assert.ok(guest.availableWeapons.includes('rifle'));
});
export function runnerSourceModel(){
 const source=parseAdventureSvg(render(h(RunnerScene,{sceneRef:{current:null},prefix:'hunter-test'})));
 const wrap=(n,parent=null)=>{const e={localName:n.tag,attributes:[...n.attrs].map(([name,value])=>({name,value})),style:{length:0},id:n.id,textContent:n.textContent,getBBox:()=>({x:-160,y:-360,width:320,height:380}),hasAttribute:k=>n.attrs.has(k),closest:s=>s==='defs'&&(n.tag==='defs'||parent?.closest(s))?e:null};e.children=n.children.map(c=>wrap(c,e));return e;};
 return cloneRunnerScene(wrap(source),()=>({x:0,y:0,width:390,height:780}));
}
test('actual Run scene resolves all new symbols and selected clothing through its Canvas/GPU source model',()=>{
 const scene=runnerSourceModel(),renderer=new RunnerRenderer(scene,'hunter-test');renderer.resize(390,780);
 for(const kind of HUNTER_CLOTHING){const e=new RunnerEngine({phase(){},coins(){},finish(){},sound(){},zone(){},route(){}},{skin:'hunter',accessory:kind,immortal:true});e.start();renderer.render(e);const outfits=scene.querySelectorAll('[data-runner-outfit]');assert.equal(outfits.filter(n=>n.getAttribute('display')==='inline').length,1);assert.equal(outfits.find(n=>n.getAttribute('display')==='inline').getAttribute('data-runner-outfit'),kind);}
 for(const node of scene.querySelectorAll('use')){const href=node.getAttribute('href');if(href?.startsWith('#'))assert.ok(scene.ownerDocument.ids.has(href.slice(1)),href);}
});
