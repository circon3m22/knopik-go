import test from 'node:test';
import assert from 'node:assert/strict';
import {ADVENTURE_LEVELS} from '../app/adventure-levels.ts';
import {dungeonGame} from './helpers/dungeon-fixtures.mjs';
import {dungeonPath} from './helpers/dungeon-autoplay.mjs';
test('all rooms, side branches, task approaches and chest fronts connect for the full player radius',()=>{
 for(const l of ADVENTURE_LEVELS){const e=dungeonGame(l.id);e.cleared.fill(true);e.dungeon.tasks.forEach(t=>t.done=true);
  const reachable=(goal,radius,label)=>{const path=dungeonPath(e,goal,radius,false,12);assert.ok(path.length&&Math.hypot(path.at(-1).x-goal.x,path.at(-1).y-goal.y)<radius,`${l.id}/${label}`);};
  for(const [i,r]of l.rooms.entries()){
   assert.ok(r.w>=640&&r.h>=500);const covers=l.solids.filter(s=>s.x>=r.x&&s.x+s.w<=r.x+r.w&&s.y>=r.y&&s.y+s.h<=r.y+r.h);assert.ok(covers.length>=5);assert.ok(new Set(covers.map(s=>s.kind)).size>=3);
   for(const s of covers){assert.ok(s.w<150&&s.h<150);assert.equal(e.canStand(s.x+s.w/2,s.y+s.h/2),false);}
   reachable({x:r.x+r.w/2,y:r.y+r.h-46},32,`room${i}`);
   for(const x of [r.x+46,r.x+r.w-46])reachable({x,y:r.y+r.h*.5},32,`flank${i}`);
   const c=e.chests[i];assert.equal(e.canStand(c.x,c.y),false);reachable({x:c.x,y:c.y+32},22,`chest${i}`);
  }
  for(const [i,t]of l.tasks.entries())reachable(t,60,`task${i}`);reachable(l.exit,75,'lift');
 }
});
test('160-wide horizontal and vertical gates block the actual passage and open from either cleared side',()=>{
 for(const l of ADVENTURE_LEVELS){const e=dungeonGame(l.id);e.dungeon.tasks.forEach(t=>t.done=true);
  for(const [i,g]of l.gates.entries()){
   assert.equal(g.axis==='x'?g.h:g.w,160);const x=g.x+g.w/2,y=g.y+g.h/2;assert.equal(e.canStand(x,y),false);e.cleared[g.from]=true;assert.equal(e.canStand(x,y),true);e.cleared[g.from]=false;e.cleared[g.to]=true;assert.equal(e.canStand(x,y),true);e.cleared[g.to]=false;
   assert.equal(e.gateOpen(i),false);
  }
 }
});
test('room detection tracks both axes and supports returning to earlier rooms; pillar tangents are stable',()=>{
 const e=dungeonGame(7);e.cleared.fill(true);for(const index of [2,1,0,3,0]){const r=e.levelData.rooms[index];e.player.x=r.x+r.w/2;e.player.y=r.y+r.h-46;e.advance(1/60);assert.equal(e.room,index);}
 const s=e.levelData.solids[0];assert.ok(e.canStand(s.x-13+1e-12,s.y+15));assert.equal(e.canStand(s.x-12,s.y+15),false);
 for(const value of [NaN,Infinity,-Infinity])assert.equal(e.canStand(value,200),false);
});
