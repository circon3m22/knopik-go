import './helpers/tsx-loader.mjs';
import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {DamageHealthTracker,playDamagePulse} from '../app/damage-pulse-state.ts';
import {dungeonGame} from './helpers/dungeon-fixtures.mjs';
import {CoopEngine} from '../app/coop-engine.ts';
import {packCoopSnapshot,unpackCoopSnapshot} from '../app/coop-wire.ts';
import postcss from 'postcss';
test('real damage emits once, including a shield revival, and protection or pause emits nothing',()=>{
 let pulses=0;const e=dungeonGame(3,{}, {damage:()=>pulses++});e.enemies.forEach(n=>n.hp=0);
 const shot=()=>{Object.assign(e.bullets[0],{x:e.player.x,y:e.player.y,vx:0,vy:0,active:true,life:1,owner:'enemy',kind:'round'});e.advance(1/60);};
 shot();assert.equal(e.player.hp,2);assert.equal(pulses,1);shot();assert.equal(pulses,1);
 e.invincible=0;e.player.hp=1;e.shieldReady=true;shot();assert.equal(e.player.hp,3);assert.equal(pulses,2);
 e.invincible=0;e.setImmortal(true);shot();assert.equal(pulses,2);e.setImmortal(false);e.pause();e.hurt();assert.equal(pulses,2);
});
test('online pulse tracks only local authoritative damage, not first snapshots, repeats, healing or a hurt teammate',()=>{
 const e=new CoopEngine(19),host=new DamageHealthTracker(),guest=new DamageHealthTracker();
 const sample=()=>{const s=unpackCoopSnapshot(JSON.parse(JSON.stringify(packCoopSnapshot(e.snapshot()))),e);return [host.sample(s.actors[0].player.hp),guest.sample(s.actors[1].player.hp)];};
 assert.deepEqual(sample(),[false,false]);e.forPlayer(1,()=>e.hurt());assert.deepEqual(sample(),[false,true]);assert.deepEqual(sample(),[false,false]);
 e.actors[1].player.hp=3;assert.deepEqual(sample(),[false,false]);assert.equal(guest.sample(NaN),false);assert.equal(guest.sample(2),true);
 const joinedWounded=new DamageHealthTracker();assert.equal(joinedWounded.sample(1),false);
});
test('pulse restarts without forced layout, timers or a render loop and uses only a one-second opacity envelope',()=>{
 const attrs=new Map(),node={getAttribute:k=>attrs.get(k),setAttribute:(k,v)=>attrs.set(k,v)};
 playDamagePulse(null);playDamagePulse(node);assert.equal(attrs.get('data-damage-pulse'),'a');playDamagePulse(node);assert.equal(attrs.get('data-damage-pulse'),'b');playDamagePulse(node);assert.equal(attrs.get('data-damage-pulse'),'a');
 const root=postcss.parse(readFileSync(new URL('../app/damage-pulse.css',import.meta.url),'utf8'));let duration=false;
 root.walkDecls('animation-duration',d=>{assert.equal(d.value,'1000ms');duration=true;});assert.ok(duration);
 root.walkAtRules('keyframes',rule=>rule.walkDecls(d=>assert.equal(d.prop,'opacity')));
 root.walkDecls('pointer-events',d=>assert.equal(d.value,'none'));
 const source=readFileSync(new URL('../app/damage-pulse-state.ts',import.meta.url),'utf8');assert.doesNotMatch(source,/requestAnimationFrame|setTimeout|setInterval|getBoundingClientRect|offsetWidth/);
});
