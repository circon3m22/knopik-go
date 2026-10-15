import test from 'node:test';
import assert from 'node:assert/strict';
import {SahurNavigation} from '../app/sahur-navigation.ts';
import {dungeonGame,tickDungeon} from './helpers/dungeon-fixtures.mjs';
import {ADVENTURE_STEP} from '../app/adventure-engine.ts';
const bounds={x:0,y:0,w:720,h:560};
function maze(){let blocked=true;const wall={x:290,y:140,w:140,h:280};const stand=(x,y)=>x>=13&&x<=707&&y>=13&&y<=547&&(!blocked||Math.hypot(x-Math.max(wall.x,Math.min(wall.x+wall.w,x)),y-Math.max(wall.y,Math.min(wall.y+wall.h,y)))>=13);return {nav:new SahurNavigation(stand),stand,open(){blocked=false;}};}
function follow(nav,actor,goal,id,time,crowd,stand){const p=nav.waypoint(id,actor,goal,time,crowd),d=Math.hypot(p.x-actor.x,p.y-actor.y),speed=Math.min(90/60,d);if(d>.001){const x=actor.x+(p.x-actor.x)/d*speed,y=actor.y+(p.y-actor.y)/d*speed;assert.ok(stand(x,y),`route clipped cover at ${x},${y}`);actor.x=x;actor.y=y;}nav.moved(id,speed,ADVENTURE_STEP);}
test('two Sahurs find different complete paths around a large obstacle instead of sliding forever against it',()=>{
 const {nav,stand}=maze(),actors=[{x:100,y:260},{x:100,y:300}],goals=[{x:610,y:240},{x:610,y:320}],extents=[{min:560,max:0},{min:560,max:0}];
 for(let frame=0;frame<850;frame++){nav.beginStep(bounds,'room:0');for(let i=0;i<2;i++){follow(nav,actors[i],goals[i],i,frame/60,actors,stand);extents[i].min=Math.min(extents[i].min,actors[i].y);extents[i].max=Math.max(extents[i].max,actors[i].y);}}
 for(let i=0;i<2;i++)assert.ok(Math.hypot(actors[i].x-goals[i].x,actors[i].y-goals[i].y)<12,JSON.stringify(actors));assert.ok(extents[0].min<127);assert.ok(extents[1].max>433);assert.equal(nav.builds,1);assert.ok(nav.searches<60);
});
test('destroying cover invalidates the old route immediately; searches have a two-plan budget and one shared room grid',()=>{
 const {nav,open}=maze(),from={x:100,y:280},goal={x:610,y:280};nav.beginStep(bounds,'closed');const before=nav.waypoint(0,from,goal,0,[]);assert.notDeepEqual(before,goal);for(let i=1;i<20;i++)nav.waypoint(i,from,goal,0,[]);assert.equal(nav.searches,2);assert.equal(nav.builds,1);open();nav.beginStep(bounds,'open');assert.deepEqual(nav.waypoint(0,from,goal,.01,[]),goal);
});
test('a real Sahur walks around level furniture, reaches attack range and never crosses its collision geometry',()=>{
 const e=dungeonGame(1,{immortal:true});e.enemies.forEach(n=>n.hp=0);e.barrels.forEach(b=>b.active=false);const n=e.enemies[0],r=e.levelData.rooms[0];let pair;
 for(const s of e.levelData.solids.filter(s=>s.x>=r.x&&s.x+s.w<=r.x+r.w&&s.y>=r.y&&s.y+s.h<=r.y+r.h)){
  const a={x:s.x-45,y:s.y+s.h/2},b={x:s.x+s.w+45,y:a.y};if(e.canStand(a.x,a.y)&&e.canStand(b.x,b.y)&&!e.lineClear(a,b)){pair=[a,b];break;}
 }
 assert.ok(pair,'a reachable pair separated by actual level furniture');Object.assign(n,pair[0],{hp:100,maxHp:100,kind:'bat',role:undefined,boss:false,mode:'chase',timer:0,awake:true});Object.assign(e.player,pair[1]);let reached=false;
 for(let i=0;i<1800;i++){e.advance(ADVENTURE_STEP);assert.ok(e.canStand(n.x,n.y));if(Math.hypot(n.x-e.player.x,n.y-e.player.y)<80&&e.lineClear(n,e.player)){reached=true;break;}}
 assert.ok(reached,`Sahur stuck at ${n.x},${n.y}`);assert.ok(e.navigation.searches>0);e.pause();const p={x:n.x,y:n.y,searches:e.navigation.searches};e.advance(10);assert.deepEqual({x:n.x,y:n.y,searches:e.navigation.searches},p);
});
test('gunners retreat from a nearby player and strafe between telegraphed shots',()=>{
 const e=dungeonGame(6,{immortal:true});e.enemies.forEach(n=>n.hp=0);e.barrels.forEach(b=>b.active=false);const r=e.levelData.rooms[0],n=e.enemies[0];Object.assign(e.player,{x:r.x+r.w/2,y:r.y+225});Object.assign(n,{x:e.player.x+100,y:e.player.y,hp:100,maxHp:100,awake:true,kind:'gun',role:undefined,boss:false,mode:'chase',timer:5});assert.ok(e.canStand(n.x,n.y));const distance=()=>Math.hypot(n.x-e.player.x,n.y-e.player.y),start=distance();tickDungeon(e,1);assert.ok(distance()>start+20);assert.notEqual(n.y,e.player.y);
 n.mode='recover';n.attackRecovery=true;n.recoveryDuration=1.05;n.timer=.4;const p={x:n.x,y:n.y};tickDungeon(e,.2);assert.ok(Math.hypot(n.x-p.x,n.y-p.y)>3);
});
