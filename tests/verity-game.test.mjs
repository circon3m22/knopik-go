import assert from "node:assert/strict";
import test from "node:test";
import { VerityField } from "../app/verity-engine.ts";
import { BrainrotEngine } from "../app/brainrot-engine.ts";

test("Verity reflects from the paddle according to contact position and a miss costs a life",()=>{
  const field=new VerityField(()=>.5);
  field.ball={x:176,y:382,vx:20,vy:280};
  assert.ok(field.update(1/60,3,160).some(e=>e.type==="bounce"));
  assert.ok(field.ball.vy<0);assert.ok(field.ball.vx>0);
  const game=new BrainrotEngine("verity",()=>.5);game.start();game.time=3;
  game.verity.ball={x:25,y:452,vx:20,vy:280};
  game.update(1/60);assert.equal(game.lives,2);assert.equal(game.verity.ball.y,370);
  const snap=game.snapshot();game.pause();game.update(.05);assert.equal(game.verity.ball.y,snap.verity.ball.y);
});

test("brick collision reflects the ball and does not double-charge armored bricks in one update",()=>{
  const field=new VerityField(()=>.5);
  field.blocks=[{id:1,x:140,y:100,hp:2,cursed:false,hit:0}];
  field.ball={x:160,y:132,vx:5,vy:-300};
  const first=field.update(.05,3,160);assert.equal(field.blocks[0].hp,1);assert.ok(field.ball.vy>0);assert.ok(!first.some(e=>e.type==="collect"));
  field.ball={x:160,y:132,vx:5,vy:-300};
  const second=field.update(.05,3.1,160);assert.ok(second.some(e=>e.type==="collect"));assert.equal(field.blocks.length,0);
});

test("glitch protects against cursed blocks and laser beams; the laser gap is safe without it",()=>{
  for(const powered of [false,true]){
    const field=new VerityField(()=>.5);field.blocks=[{id:1,x:140,y:100,hp:1,cursed:true,hit:0}];
    field.ball={x:160,y:132,vx:5,vy:-300};if(powered)field.activate();
    const events=field.update(1/60,3,160);assert.equal(events.some(e=>e.type==="hurt"),!powered);assert.ok(events.some(e=>e.type==="collect"));
  }
  for(const [x,powered,hurts] of [[60,false,true],[160,false,false],[60,true,false]]){
    const field=new VerityField(()=>.5);field.lasers=[{id:99,x:160,at:3,width:100}];field.ball={x,y:242,vx:5,vy:280};if(powered)field.activate();
    assert.equal(field.update(1/60,3.1,160).some(e=>e.type==="hurt"),hurts);
  }
});

test("laser warnings precede activation, expire, and board refill keeps a bounded field",()=>{
  const field=new VerityField(()=>.5);
  field.update(1/60,7,160);assert.equal(field.lasers.length,1);assert.ok(field.lasers[0].at>7);assert.equal(field.lasers[0].width>80,true);
  field.update(1/60,9,160);assert.equal(field.lasers.length,0);
  field.blocks=[];field.update(1/60,9.1,160);assert.equal(field.stage,2);assert.equal(field.blocks.length,24);
  for(let i=0;i<7200;i++){
    const time=2+i/120;field.update(1/120,time,Math.max(48,Math.min(272,field.ball.x)));
    assert.ok(Object.values(field.ball).every(Number.isFinite));assert.ok(field.blocks.length<=24);assert.ok(field.lasers.length<=2);
  }
});

test("glitch has a real cooldown and one cached result, including a zero-reward preparation exit",()=>{
  const game=new BrainrotEngine("verity",()=>.5);game.start();game.time=2.01;
  assert.equal(game.action(),true);assert.equal(game.action(),false);assert.equal(game.cooldown,4.4);
  game.update(.05);assert.ok(game.verity.power>0);assert.ok(game.verity.power<.9);
  game.score=620;const result=game.finish();assert.equal(result.reward,11160);game.score=1000;assert.deepEqual(game.finish(),result);
  const ready=new BrainrotEngine("verity");assert.deepEqual(ready.finish(),{score:0,reward:0});
});
