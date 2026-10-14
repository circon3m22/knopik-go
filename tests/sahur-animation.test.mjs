import './helpers/tsx-loader.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import sharp from 'sharp';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {AdventureEngine,ADVENTURE_STEP} from '../app/adventure-engine.ts';
import {stableSahurFacing,sahurAnimationFrame} from '../app/sahur-animation.ts';
import {parseAdventureSvg} from './helpers/adventure-svg-dom.mjs';
import {resetSvgMetrics,svgMetrics} from './helpers/runner-svg-dom.mjs';
const {AdventureScene,AdventureRenderer}=await import('../app/adventure-artwork.tsx');
const events={change(){},checkpoint(){},sound(){},run(){},bar(){}};
function engine(){const e=new AdventureEngine(2,events);e.begin();while(e.phase==='dialogue')e.nextDialogue();return e;}

test('all 96 supplied frames share a sole and torso anchor with empty margins around every atlas cell',async()=>{
  const manifest=JSON.parse(readFileSync('public/sprites/sahur-standard-v1.json'));
  assert.equal(manifest.frames.length,96);assert.equal(new Set(manifest.frames.map(f=>`${f.row}/${f.column}`)).size,96);
  const {data,info}=await sharp('public/sprites/sahur-standard-v1.webp').ensureAlpha().raw().toBuffer({resolveWithObject:true});assert.equal(info.width,1344);assert.equal(info.height,3072);
  for(const f of manifest.frames){
    assert.equal(f.anchor.x+f.offset.x,112);assert.equal(f.anchor.y+f.offset.y,180);assert.ok(f.trunkWidth>=24);
    const ox=f.column*224,oy=f.row*192;let visible=0;
    for(let y=0;y<192;y++)for(let x=0;x<224;x++){const alpha=data[((oy+y)*info.width+ox+x)*4+3];if(alpha>=128)visible++;if(x===0||x===223||y===0||y===191)assert.equal(alpha,0,`${f.animation}/${f.direction}/${f.column} bleeds into adjacent frame`);}
    assert.ok(visible>7000,`${f.animation}/${f.direction}/${f.column} missing pixels`);
  }
});

test('gait follows actual movement at 30, 60 and 120 Hz, freezes on pause and settles when blocked',()=>{
  const run=fps=>{const e=engine(),r=e.levelData.rooms[0],n=e.enemies[0];e.enemies.forEach(other=>{if(other!==n)other.hp=0;});n.x=r.x+r.w/2;n.y=r.y+160;e.player.x=n.x;e.player.y=r.y+380;
    for(let i=0;i<fps*1.5;i++)e.advance(1/fps);return {e,n,pose:sahurAnimationFrame(n,'front')};};
  const results=[30,60,120].map(run);for(const result of results){assert.ok(result.n.walkDistance>60);assert.equal(result.n.moving,true);assert.equal(result.pose.row,2);}
  assert.deepEqual(results.map(r=>r.pose.column),[results[0].pose.column,results[0].pose.column,results[0].pose.column]);assert.ok(Math.abs(results[0].n.walkDistance-results[2].n.walkDistance)<1e-6);
  const {e,n}=results[0],before=n.walkDistance;e.pause();e.advance(30);assert.equal(n.walkDistance,before);e.resume();
  n.x=e.player.x;n.y=e.player.y-30;n.timer=0;e.advance(ADVENTURE_STEP);assert.equal(n.mode,'windup');assert.equal(n.moving,false);assert.equal(n.walkDistance,before);
});

test('the impact frame coincides with damage and all six strike frames are used in order',()=>{
  const e=engine(),n=e.enemies[0],r=e.levelData.rooms[0];e.enemies.forEach(other=>{if(other!==n)other.hp=0;});n.x=r.x+r.w/2;n.y=r.y+300;e.player.x=n.x;e.player.y=n.y+50;n.timer=0;
  const columns=[],sample=()=>{const c=sahurAnimationFrame(n,'front').column;if(columns.at(-1)!==c)columns.push(c);};
  let sawImpact=false;
  for(let i=0;i<80;i++){const hp=e.player.hp;e.advance(ADVENTURE_STEP);sample();if(e.player.hp<hp){assert.equal(n.mode,'recover');assert.equal(n.attackRecovery,true);assert.equal(sahurAnimationFrame(n,'front').column,3);sawImpact=true;}if(sawImpact&&columns.includes(5)&&columns.at(-1)===0)break;}
  assert.ok(sawImpact);assert.deepEqual(columns,[0,1,2,3,4,5,0]);
  n.attackRecovery=false;n.mode='recover';n.timer=.44;assert.equal(sahurAnimationFrame(n,'front').column,0,'being hit does not replay an attack');
});

test('facing hysteresis avoids boundary chatter and is continuous across -π and π',()=>{
  let facing='right';for(const degrees of [21,24,22,26,23,27]){facing=stableSahurFacing(degrees*Math.PI/180,facing);assert.equal(facing,'right');}
  facing=stableSahurFacing(30*Math.PI/180,facing);assert.equal(facing,'front-right');for(const degrees of [24,22,21,19])assert.equal(stableSahurFacing(degrees*Math.PI/180,facing),facing);
  assert.equal(stableSahurFacing(-179*Math.PI/180,'left'),'left');assert.equal(stableSahurFacing(NaN,'back'),'back');
});

test('one preloaded atlas changes viewBox without image swaps, node creation or extra motion at rest',()=>{
  const e=engine(),svg=parseAdventureSvg(renderToStaticMarkup(React.createElement(AdventureScene,{area:'sewer'}))),renderer=new AdventureRenderer(svg,false),n=e.enemies[0],node=svg.querySelector('[data-enemy="0"]'),frame=node.querySelector('[data-sahur-frame]'),image=frame.querySelector('image'),href=image.getAttribute('href');
  const anchors=['x','y','width','height'].map(k=>frame.getAttribute(k));resetSvgMetrics();
  for(let i=0;i<1000;i++){n.angle=i/25;n.walkDistance=i*.8;n.moving=true;renderer.paint(e);assert.equal(image.getAttribute('href'),href);assert.deepEqual(['x','y','width','height'].map(k=>frame.getAttribute(k)),anchors);}
  assert.equal(svgMetrics.created,0);n.moving=false;renderer.paint(e);const pose=frame.getAttribute('viewBox');for(let i=0;i<50;i++){e.time+=.1;renderer.paint(e);assert.equal(frame.getAttribute('viewBox'),pose);}
  n.moving=true;new AdventureRenderer(svg,true).paint(e);assert.equal(Number(frame.getAttribute('viewBox').split(' ')[0]),0);
  assert.match(svg.querySelector(`[data-enemy="${e.enemies.find(n=>n.kind==='gun').id}"]`).querySelector('[data-sahur-frame]').querySelector('image').getAttribute('href'),/sahur-gun-v1.webp$/,'gun Sahur uses its supplied sprite sheets');
  const bossEngine=new AdventureEngine(3,events,{completedLevel:5});bossEngine.selectLevel(5);const boss=bossEngine.enemies.find(n=>n.boss);const bossScene=parseAdventureSvg(renderToStaticMarkup(React.createElement(AdventureScene,{area:'sewer',level:5})));assert.equal(bossScene.querySelector(`[data-enemy="${boss.id}"]`).querySelector('[data-sahur-frame]'),null,'warden keeps vector art');
});
