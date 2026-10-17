import './helpers/tsx-loader.mjs';
import test from 'node:test';import assert from 'node:assert/strict';
import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';
import {CoopEngine} from '../app/coop-engine.ts';
import {CoopHostMotion,CoopLocalMotion,CoopRemotePose} from '../app/coop-motion.ts';
import {VaultGesture} from '../app/vault-gesture.ts';
import {loginFailureMessage} from '../app/login-error.ts';
import {ignoreGameKey} from '../app/game-input-guard.ts';
import {RunnerFrameBudget} from '../app/runner-frame-budget.ts';
import {planProgressClaims,progressReward} from '../app/progress-engine.ts';
import {BrainrotEngine} from '../app/brainrot-engine.ts';
import {memoryPadNeighbor} from '../app/drink-game-engine.ts';
import {startVisibleClock} from '../app/use-visible-clock.ts';
import {runnerFrameRateActive,subscribeFrameRate} from '../app/frame-rate.ts';
const {AdventureScene,AdventureRenderer}=await import('../app/adventure-artwork.tsx');
import {dungeonGame} from './helpers/dungeon-fixtures.mjs';
import {parseAdventureSvg} from './helpers/adventure-svg-dom.mjs';
import {resetSvgMetrics,svgMetrics} from './helpers/runner-svg-dom.mjs';

test('remote smoothing never caches authoritative health, including repeated falls and revives',()=>{
 const pose=new CoopRemotePose();let p={x:0,y:0,angle:0,hp:3};
 for(const hp of [3,2,0,2,1,0,2,3]){p={...p,x:p.x+4,hp};const visual=pose.sample(p,1/60);assert.equal(visual.hp,hp);assert.ok(Number.isFinite(visual.x));}
});
test('delayed paths from before a fall cannot drag the revived guest back',()=>{
 const host=new CoopEngine(123),guest=new CoopEngine(123),motion=new CoopHostMotion(),local=new CoopLocalMotion();
 local.reconcile(guest,host.snapshot(),0);local.record(guest.actors[1]);const old=local.packet(guest.actors[1]);
 assert.ok(motion.accept(host,old,0));
 host.actors[1].player.hp=0;motion.syncLife(host);const deadPosition={...host.actors[1].player};
 assert.equal(motion.accept(host,old,50),false);assert.deepEqual(host.actors[1].player,deadPosition);
 host.actors[1].player.hp=2;motion.syncLife(host);assert.equal(motion.revision,2);
 assert.equal(motion.accept(host,old,100),false);
 local.reconcile(guest,host.snapshot(),motion.revision);local.record(guest.actors[1]);assert.ok(motion.accept(host,local.packet(guest.actors[1]),150));
});
test('a second touch cannot steal or finish a vault transfer and cancelled gestures pay nothing',()=>{
 const g=new VaultGesture();assert.ok(g.begin(1,10,0,200));assert.equal(g.begin(2,20,0,200),false);
 assert.equal(g.move(2,200),null);assert.equal(g.finish(2),null);assert.equal(g.move(1,140),130/140);
 assert.equal(g.finish(1),true);assert.equal(g.finish(1),null);
 assert.ok(g.begin(3,0,0,200));g.move(3,200);assert.equal(g.finish(3,true),false);
 assert.equal(g.begin(4,150,0,200),false);
});
test('network failures, rate limits and invalid credentials have distinct actionable login messages',()=>{
 assert.match(loginFailureMessage({code:'invalid_credentials',status:400}),/пароль/);
 assert.match(loginFailureMessage(new TypeError('Failed to fetch')),/интернет/);
 assert.match(loginFailureMessage({status:429}),/Слишком много/);
 assert.match(loginFailureMessage({status:503}),/временно/);
 assert.doesNotMatch(loginFailureMessage({name:'AbortError'}),/Неверный/);
});
test('game shortcuts leave editable fields and browser combinations alone',()=>{
 const e={target:null,ctrlKey:false,metaKey:false,altKey:false};assert.equal(ignoreGameKey(e),false);
 assert.equal(ignoreGameKey({...e,ctrlKey:true}),true);
 assert.equal(ignoreGameKey({...e,target:{closest:()=>({})}}),true);
});
test('30 and 45 FPS limits do not incorrectly lower auto raster quality on an idle GPU',()=>{
 for(const cap of [30,45,60]){const b=new RunnerFrameBudget();for(let i=0;i<500;i++){const now=1+i*1000/cap;if(b.due(now,cap))b.painted(now,4);}assert.equal(b.pixelRatio(4,'auto'),1.25);}
});
test('claim-all reserves the actual three-shield limit and every shield milestone can fit an empty shelf',()=>{
 const stock={common:0,big:0,food:0,drink:0,pitbull:0,cola:0,tea:0,shield:2};
 const plan=planProgressClaims(100,[],stock);let count=stock.shield;
 for(const n of plan.levels){const r=progressReward(n);if(r.type==='buff'&&r.kind==='shield')count+=r.amount;}
 assert.ok(count<=3);assert.ok(plan.blocked.some(n=>{const r=progressReward(n);return r.type==='buff'&&r.kind==='shield';}));
 for(let n=1;n<=100;n++){const r=progressReward(n);if(r.type==='buff'&&r.kind==='shield')assert.ok(r.amount<=3);}
 assert.equal(progressReward(79).amount,3);
 const others=Array.from({length:100},(_,i)=>i+1).filter(n=>n!==79);
 assert.deepEqual(planProgressClaims(100,others,{...stock,shield:0}).levels,[79]);
});
test('a paused long rhythm note can be held again without an extra hit or ghost hold',()=>{
 const e=new BrainrotEngine('ballerina',()=>.5);e.start();const note=e.objects.find(n=>n.hold);e.objects=[note];e.time=note.at;
 assert.ok(e.action(note.lane));assert.ok(note.holding);assert.ok(e.pause());assert.ok(e.resume());
 e.time+=.1;assert.ok(e.action(note.lane));for(let i=0;i<30;i++)e.update(1/60);
 assert.ok(note.done);const score=e.score;e.release(note.lane);e.update(.01);assert.equal(e.score,score);
});
test('memory board keyboard navigation keeps focus inside the 3x3 board',()=>{
 assert.equal(memoryPadNeighbor(0,'ArrowLeft'),0);assert.equal(memoryPadNeighbor(2,'ArrowRight'),2);
 assert.equal(memoryPadNeighbor(4,'ArrowUp'),1);assert.equal(memoryPadNeighbor(4,'ArrowDown'),7);
 assert.equal(memoryPadNeighbor(8,'Home'),0);assert.equal(memoryPadNeighbor(0,'End'),8);assert.equal(memoryPadNeighbor(-1,'ArrowDown'),null);
});
test('hidden wall-clock panels stop polling and catch up immediately on return',()=>{
 const doc=new EventTarget();doc.hidden=false;const intervals=new Map();let serial=0,updates=0;
 const oldSet=globalThis.setInterval,oldClear=globalThis.clearInterval;
 globalThis.setInterval=callback=>{intervals.set(++serial,callback);return serial;};globalThis.clearInterval=id=>intervals.delete(id);
 try{const stop=startVisibleClock(()=>updates++,1000,doc);assert.equal(updates,1);assert.equal(intervals.size,1);
  doc.hidden=true;doc.dispatchEvent(new Event('visibilitychange'));assert.equal(intervals.size,0);
  doc.hidden=false;doc.dispatchEvent(new Event('visibilitychange'));assert.equal(updates,2);assert.equal(intervals.size,1);stop();assert.equal(intervals.size,0);
 }finally{globalThis.setInterval=oldSet;globalThis.clearInterval=oldClear;}
});
test('overlapping worlds cannot turn off each other’s FPS source or leave a redundant RAF sampler',()=>{
 const oldDoc=globalThis.document,oldRaf=globalThis.requestAnimationFrame,oldCancel=globalThis.cancelAnimationFrame;
 const doc=new EventTarget();doc.hidden=false;globalThis.document=doc;let serial=0;const rafs=new Map();
 globalThis.requestAnimationFrame=f=>{rafs.set(++serial,f);return serial;};globalThis.cancelAnimationFrame=id=>rafs.delete(id);
 const a=Symbol(),b=Symbol();let stop;
 try{stop=subscribeFrameRate(()=>{});assert.equal(rafs.size,1);runnerFrameRateActive(true,a);assert.equal(rafs.size,0);
  runnerFrameRateActive(true,b);runnerFrameRateActive(false,a);assert.equal(rafs.size,0);
  runnerFrameRateActive(false,b);assert.equal(rafs.size,1);
  doc.hidden=true;doc.dispatchEvent(new Event('visibilitychange'));assert.equal(rafs.size,0);
 }finally{runnerFrameRateActive(false,a);runnerFrameRateActive(false,b);stop?.();globalThis.document=oldDoc;globalThis.requestAnimationFrame=oldRaf;globalThis.cancelAnimationFrame=oldCancel;}
});
test('stationary world frames do not rewrite static SVG or reorder depth layers',()=>{
 const e=dungeonGame(8),svg=parseAdventureSvg(renderToStaticMarkup(React.createElement(AdventureScene,{area:'sewer',level:8,layout:e.levelData}))),r=new AdventureRenderer(svg,true);
 r.resize(390,520);r.paint(e,true);resetSvgMetrics();for(let i=0;i<120;i++)r.paint(e,true);
 assert.equal(svgMetrics.created,0);assert.equal(svgMetrics.moves,0);assert.equal(svgMetrics.writes,0);
});
