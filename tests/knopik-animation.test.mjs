import './helpers/tsx-loader.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {AdventureEngine,ADVENTURE_STEP} from '../app/adventure-engine.ts';
import {parseAdventureSvg} from './helpers/adventure-svg-dom.mjs';
import {resetSvgMetrics,svgMetrics} from './helpers/runner-svg-dom.mjs';
const {AnimatedAdventureKnopik}=await import('../app/knopik-adventure-art.tsx');
const {KnopikAnimator,knopikMotion}=await import('../app/knopik-adventure-animation.ts');
const {RunnerDog,RUNNER_ART_REVISION}=await import('../app/runner-artwork.tsx');
const events={change(){},checkpoint(){},sound(){},run(){},bar(){}};
const angles=[['right',0],['front-right',Math.PI/4],['front',Math.PI/2],['front-left',Math.PI*3/4],['left',Math.PI],['back-left',-Math.PI*3/4],['back',-Math.PI/2],['back-right',-Math.PI/4]];

test('Knopik uses native pixel paths in all eight views; fists remain compact around their shoulders',()=>{
  const e=new AdventureEngine(2,events),svg=parseAdventureSvg(renderToStaticMarkup(React.createElement(AnimatedAdventureKnopik))),animator=new KnopikAnimator(svg);
  assert.equal(svg.querySelectorAll('image').length,0);assert.equal(svg.querySelectorAll('[data-knopik-rig]').length,5);
  for(const [facing,angle]of angles){e.player.angle=angle;
    for(const serial of [1,2])for(const time of [.24,.2,.12,.02,0]){e.punchSerial=serial;e.punchTime=time;animator.paint(e);const p=knopikMotion(e,facing);
      for(const arm of p.arms)assert.ok(Math.hypot(arm.hand.x-arm.shoulder.x,arm.hand.y-arm.shoulder.y)<=40,'a fist must not stretch more than 20 world units from the shoulder');
      const active=svg.querySelectorAll('[data-direction]').filter(n=>n.getAttribute('display')==='inline');assert.equal(active.length,1);
      const transform=active[0].querySelector('[data-knopik-hand]').getAttribute('transform');assert.ok(!/NaN|Infinity/.test(transform));
    }
  }
});

test('player gait comes from real travel at 30/60/120 Hz, freezes at walls and on pause',()=>{
  const run=fps=>{const e=new AdventureEngine(3,events);e.player.x=210;e.player.y=440;e.setInput(0,1,false);for(let i=0;i<fps*.4;i++)e.advance(1/fps);return e;};
  const [a,b,c]=[30,60,120].map(run);assert.equal(a.walkDistance,b.walkDistance);assert.equal(c.walkDistance,b.walkDistance);assert.deepEqual(knopikMotion(a,'front'),knopikMotion(c,'front'));
  a.pause();const walk=a.walkDistance;a.advance(10);assert.equal(a.walkDistance,walk);a.resume();a.player.x=28+13;a.setInput(-1,0,false);a.advance(ADVENTURE_STEP);assert.equal(a.moving,false);assert.equal(a.walkDistance,walk);
});

test('sabre and pistol share a wrist with their gripping paw in every direction, with recoil and an actual firing flash',()=>{
  const e=new AdventureEngine(3,events,{completedLevel:20});e.selectLevel(21);while(e.phase==='dialogue')e.nextDialogue();
  const svg=parseAdventureSvg(renderToStaticMarkup(React.createElement(AnimatedAdventureKnopik))),animator=new KnopikAnimator(svg);
  for(const weapon of ['sabre','pistol','shotgun','launcher','arc'])for(const [facing,angle]of angles){e.selectWeapon(weapon);e.player.angle=angle;e.punchTime=weapon==='sabre'?.32:.17;animator.paint(e);const pose=knopikMotion(e,facing),rig=svg.querySelector(`[data-knopik-rig="${pose.rig}"]`),hand=rig.querySelector('[data-knopik-arm="near"]').querySelector('[data-knopik-hand]');
    assert.equal(hand.getAttribute('transform'),`translate(${pose.arms[1].hand.x} ${pose.arms[1].hand.y})`);
    assert.equal(hand.querySelector('[data-knopik-tool]').getAttribute('transform'),`rotate(${pose.arms[1].toolAngle})`);assert.match(hand.querySelector('[data-knopik-paw]').getAttribute('transform'),new RegExp(`rotate\\(${pose.arms[1].toolAngle}\\)`));
    assert.equal(hand.querySelector(`[data-held="${weapon}"]`).getAttribute('display'),'inline');
  }
  e.weapon='pistol';e.punchTime=0;e.punchCooldown=0;e.setInput(0,0,true);e.advance(ADVENTURE_STEP);assert.ok(e.bullets.some(n=>n.active&&n.owner==='player'));animator.paint(e);
  assert.ok(svg.querySelectorAll('[data-knopik-muzzle]').some(n=>n.getAttribute('display')==='inline'));e.setInput(0,0,false);for(let i=0;i<20;i++)e.advance(ADVENTURE_STEP);animator.paint(e);const p=knopikMotion(e,'back');assert.equal(p.muzzle,false);
});

test('native animation keeps its pieces, settles at rest, and reduced motion freezes gait while retaining combat signals',()=>{
  const e=new AdventureEngine(2,events),svg=parseAdventureSvg(renderToStaticMarkup(React.createElement(AnimatedAdventureKnopik))),a=new KnopikAnimator(svg);resetSvgMetrics();
  for(let i=0;i<500;i++){e.player.angle=i/40;e.walkDistance=i;e.moving=true;a.paint(e);}assert.equal(svgMetrics.created,0);
  e.player.angle=Math.PI/4;e.moving=false;a.paint(e);const wrist=svg.querySelector('[data-knopik-rig="front-diagonal"]').querySelector('[data-knopik-hand]'),rest=wrist.getAttribute('transform');e.time+=10;a.paint(e);assert.equal(wrist.getAttribute('transform'),rest);
  e.moving=true;a.paint(e,true);assert.equal(wrist.getAttribute('transform'),rest);
});

test('Run shares the new Shiba head and tail, including a full face on looking back and its cached rig hooks',()=>{
  const svg=parseAdventureSvg(renderToStaticMarkup(React.createElement(RunnerDog)));assert.match(RUNNER_ART_REVISION,/shiba/);
  for(const part of ['head','turn','tail','pose','leg-left','leg-right','arm-left','arm-right','roll','firework','collar'])assert.ok(svg.querySelector(`[data-runner-${part}]`));
  assert.equal(svg.querySelectorAll('image').length,0);assert.ok(svg.querySelector('[data-runner-turn]').querySelectorAll('path').length>20);assert.ok(svg.querySelector('[data-runner-tail]').querySelector('[data-knopik-tail]'));
});
