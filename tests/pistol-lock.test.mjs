import test from 'node:test';import assert from 'node:assert/strict';
import {firearmAim,firearmShotAim,PISTOL_LOCK_CONE} from '../app/dungeon-aim.ts';
import {ADVENTURE_STEP} from '../app/adventure-engine.ts';
import {dungeonGame,tickDungeon} from './helpers/dungeon-fixtures.mjs';
function lane(degrees){const e=dungeonGame(6,{immortal:true}),r=e.levelData.rooms[0],a=degrees*Math.PI/180,n=e.enemies[0];e.enemies.forEach(n=>n.hp=0);e.barrels.forEach(b=>b.active=false);e.selectWeapon('pistol');let placed=false;
 for(let y=r.y+45;y<r.y+r.h-45&&!placed;y+=24)for(let x=r.x+45;x<r.x+r.w-45;x+=24){const target={x:x+Math.cos(a)*180,y:y+Math.sin(a)*180};if(e.canStand(x,y)&&e.canStand(target.x,target.y)&&e.lineClear({x,y},target)){Object.assign(e.player,{x,y,angle:0});Object.assign(n,target,{hp:2,maxHp:2,room:0,awake:true,mode:'recover',timer:10,attackRecovery:false});placed=true;break;}}
 assert.ok(placed);return {e,n};}
test('pistol shots hit visible enemies throughout the 50-degree sector even when the drawn guide does not reach them',()=>{
 assert.ok(Math.abs(PISTOL_LOCK_CONE-50*Math.PI/180)<1e-12);for(const degrees of[-50,-44,-24,0,24,44,50]){const{e,n}=lane(degrees),aim=firearmShotAim(e);assert.equal(aim.target,n.id);assert.ok(Math.abs(aim.angle-degrees*Math.PI/180)<1e-9);if(Math.abs(degrees)>30)assert.equal(firearmAim(e).correction,0);e.setInput(0,0,true);e.advance(ADVENTURE_STEP);e.setInput(0,0,false);assert.equal(e.player.angle,0);tickDungeon(e,.6);assert.equal(n.hp,1,`target at ${degrees} degrees`);}
});
test('pistol target lock respects the sector, walls, living targets, rooms, sleep and maximum projectile range',()=>{
 for(const degrees of[-51,51,90,180]){const{e}=lane(degrees);assert.equal(firearmShotAim(e).target,null);}
 for(const patch of[{hp:0},{awake:false},{room:1},{x:100000}]){const{e,n}=lane(44);Object.assign(n,patch);assert.equal(firearmShotAim(e).target,null);}
 const{e,n}=lane(0),cover=e.levelData.solids[0];Object.assign(e.player,{x:cover.x-50,y:cover.y+cover.h/2,angle:0});Object.assign(n,{x:cover.x+cover.w+50,y:e.player.y});assert.equal(firearmShotAim(e).target,null);
});
test('pistol lock wraps around the angle boundary and prioritizes the target closest to the player aim',()=>{
 const wrapped=lane((-Math.PI+.1)*180/Math.PI);wrapped.e.player.angle=Math.PI-.1;assert.ok(Math.abs(firearmShotAim(wrapped.e).correction-.2)<1e-9);
 const{e,n}=lane(0);
 const another=e.enemies[1];e.player.angle=0;Object.assign(n,{x:e.player.x+150,y:e.player.y+10});Object.assign(another,{x:e.player.x+140,y:e.player.y+90,hp:2,room:e.room,awake:true});assert.equal(firearmShotAim(e).target,n.id);
});
