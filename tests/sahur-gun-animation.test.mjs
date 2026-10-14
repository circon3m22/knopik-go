import './helpers/tsx-loader.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import sharp from 'sharp';
import {AdventureEngine,ADVENTURE_STEP} from '../app/adventure-engine.ts';
import {sahurAnimationFrame} from '../app/sahur-animation.ts';
const events={change(){},checkpoint(){},sound(){},run(){},bar(){}};
test('all 96 pistol Sahur cells retain a common body/sole anchor, unclipped muzzle flashes and clean cell margins',async()=>{
  const m=JSON.parse(readFileSync('public/sprites/sahur-gun-v1.json'));assert.equal(m.frames.length,96);assert.equal(m.cell.width,320);assert.equal(new Set(m.frames.map(f=>`${f.row}/${f.column}`)).size,96);
  const {data,info}=await sharp('public/sprites/sahur-gun-v1.webp').ensureAlpha().raw().toBuffer({resolveWithObject:true});assert.equal(info.width,1920);assert.equal(info.height,3072);

  for(const f of m.frames){assert.equal(f.anchor.x+f.offset.x,160);assert.equal(f.anchor.y+f.offset.y,180);let count=0;
    for(let y=0;y<192;y++)for(let x=0;x<320;x++){const alpha=data[((f.row*192+y)*info.width+f.column*320+x)*4+3];if(alpha>=128)count++;if(x===0||x===319||y===0||y===191)assert.equal(alpha,0,`${f.animation}/${f.direction}/${f.column} is clipped`);}assert.ok(count>6000);
  }
});
test('gun animation flashes exactly when a bullet is fired and walks through six frames from real travel',()=>{
  const e=new AdventureEngine(3,events);e.selectLevel(2);while(e.phase==='dialogue')e.nextDialogue();const n=e.enemies.find(n=>n.kind==='gun');e.room=n.room;e.enemies.forEach(other=>{if(other!==n)other.hp=0;});const r=e.levelData.rooms[e.room];
  n.x=r.x+r.w/2;n.y=r.y+220;e.player.x=n.x;e.player.y=n.y+175;n.mode='windup';n.attackAngle=Math.PI/2;n.timer=ADVENTURE_STEP;n.windupDuration=.8;
  assert.equal(sahurAnimationFrame(n,'front').column,2);e.advance(ADVENTURE_STEP);assert.ok(e.bullets.some(b=>b.active&&b.owner==='enemy'));assert.equal(sahurAnimationFrame(n,'front').column,3);
  const seen=[];for(let i=0;i<22;i++){const f=sahurAnimationFrame(n,'front');if(seen.at(-1)!==f.column)seen.push(f.column);e.advance(ADVENTURE_STEP);}assert.deepEqual(seen,[3,4,5,0]);
  n.mode='chase';n.attackRecovery=false;n.moving=true;for(let frame=0;frame<6;frame++){n.walkDistance=frame*5;assert.deepEqual(sahurAnimationFrame(n,'back-left'),{row:7,column:frame});}
});
