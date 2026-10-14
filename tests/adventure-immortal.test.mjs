import test from 'node:test';
import assert from 'node:assert/strict';
import {AdventureEngine,ADVENTURE_STEP} from '../app/adventure-engine.ts';
const events={change(){},checkpoint(){},sound(){},run(){},bar(){}};
function game(level,immortal=true,extra={}){const e=new AdventureEngine(3,{...events,...extra},{completedLevel:25,immortal,shield:true});e.selectLevel(level);while(e.phase==='dialogue')e.nextDialogue();return e;}
function tick(e,seconds){for(let i=0;i<Math.ceil(seconds*60);i++)e.advance(ADVENTURE_STEP);}
function shot(e){Object.assign(e.bullets[0],{x:e.player.x,y:e.player.y,vx:0,vy:0,life:1,active:true,owner:'enemy'});e.advance(ADVENTURE_STEP);}

test('immortality blocks Sahur clubs and bullets without consuming an armed shield',()=>{
  let used=0;const e=game(1,true,{shieldUsed(){used++;}}),n=e.enemies[0],r=e.levelData.rooms[0];e.enemies.forEach(other=>{if(other!==n)other.hp=0;});n.x=r.x+r.w/2;n.y=r.y+250;e.player.x=n.x;e.player.y=n.y+50;n.mode='windup';n.timer=0;n.attackAngle=Math.PI/2;
  e.advance(ADVENTURE_STEP);assert.equal(n.mode,'recover');assert.equal(e.player.hp,3);
  for(let i=0;i<4;i++){shot(e);tick(e,1.2);}assert.equal(e.player.hp,3);assert.equal(e.phase,'playing');assert.equal(e.shieldReady,true);assert.equal(used,0);
});

test('immortality also protects against active steam and exploding barrels',()=>{
  const steam=game(6),jet=steam.levelData.jets[0];steam.player.x=jet.x+jet.w/2;steam.player.y=jet.y+13;steam.time=jet.offset<4?4.2-jet.offset:9.2-jet.offset;tick(steam,.1);assert.equal(steam.jetPhase(0),'active');assert.equal(steam.player.hp,3);
  const barrels=game(11),barrel=barrels.barrels[0];barrels.player.x=barrel.x+35;barrels.player.y=barrel.y;Object.assign(barrels.bullets[0],{x:barrel.x,y:barrel.y+35,vx:0,vy:-500,life:1,active:true,owner:'player'});tick(barrels,.1);assert.equal(barrel.active,false);assert.ok(barrel.explosion>0);assert.equal(barrels.player.hp,3);
});

test('immortality protects against the warden and survives area changes',()=>{
  const e=game(25),boss=e.enemies.find(n=>n.boss);e.cleared.fill(true);e.room=boss.room;e.player.x=boss.x;e.player.y=boss.y+65;boss.mode='windup';boss.timer=0;boss.attackAngle=Math.PI/2;boss.hp=6;e.advance(ADVENTURE_STEP);assert.equal(e.player.hp,3);assert.ok(e.bullets.filter(b=>b.active).length>=5);
  e.pause();e.exitToApartment();assert.equal(e.selectLevel(1),true);while(e.phase==='dialogue')e.nextDialogue();shot(e);assert.equal(e.player.hp,3);
});

test('turning the existing cheat off restores normal damage immediately and default games stay vulnerable',()=>{
  const e=game(1);shot(e);assert.equal(e.player.hp,3);e.setImmortal(false);shot(e);assert.equal(e.player.hp,2);e.setImmortal(true);tick(e,1.2);shot(e);assert.equal(e.player.hp,2);
  const normal=game(1,false);shot(normal);assert.equal(normal.player.hp,2);
});
