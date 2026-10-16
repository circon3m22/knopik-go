import test from 'node:test';import assert from 'node:assert/strict';
import {AdventureEngine,ADVENTURE_STEP} from '../app/adventure-engine.ts';
import {EXPEDITION_LOCATIONS,generateExpeditionDungeon} from '../app/expedition-locations.ts';
import {dungeonPath} from './helpers/dungeon-autoplay.mjs';
const quiet={change(){},checkpoint(){},sound(){},run(){},bar(){}};
for(const location of EXPEDITION_LOCATIONS)test(location.name+' has eight reachable rooms and preserves campaign/economy',()=>{
 let money=0;const e=new AdventureEngine(3,{...quiet,collect:n=>money+=n},{completedLevel:8,weaponTier:3});e.phase='levels';assert.equal(e.startArcade(location.id),true);
 assert.equal(e.levelData.location,location.id);assert.equal(e.levelData.rooms.length,8);assert.equal(e.chests.length,0);assert.equal(e.ingredientPickups.length,0);assert.equal(e.canStand(e.player.x,e.player.y),true);
 assert.deepEqual(generateExpeditionDungeon(location.id),e.levelData);
 for(const enemy of e.enemies)assert.equal(e.canStand(enemy.x,enemy.y),true,'enemy spawn');
 // This traversal check omits combat and follows normal 60 Hz movement, never teleports.
 e.enemies.forEach(n=>n.hp=0);e.cleared.fill(true);
 const rooms=[...e.levelData.rooms];
 for(const [roomIndex,r]of rooms.entries()){const goal={x:r.x+r.w/2,y:r.y+r.h/2},path=dungeonPath(e,goal,35,false,24);assert.ok(path.length,'route to room');
  for(const p of path){for(let frame=0;frame<90&&e.arcadeSegment===0&&Math.hypot(p.x-e.player.x,p.y-e.player.y)>9;frame++){e.setInput(p.x-e.player.x,p.y-e.player.y,false);e.advance(ADVENTURE_STEP);}if(e.arcadeSegment>0)break;}
  if(e.arcadeSegment>0){assert.equal(roomIndex,7,"only the final exit advances the route");break;}
  assert.ok(Math.hypot(goal.x-e.player.x,goal.y-e.player.y)<70,JSON.stringify({room:e.levelData.rooms.indexOf(r),goal,player:e.player,last:path.at(-1),distance:Math.hypot(goal.x-e.player.x,goal.y-e.player.y)}));
 }
 assert.equal(e.completedLevel,8);assert.equal(money,0);assert.equal(e.finishLevel(),false);e.restart();assert.equal(e.levelData.location,location.id);
 e.phase='levels';e.startArcade();assert.equal(e.levelData.location,undefined,'normal arcade remains independent');
});
