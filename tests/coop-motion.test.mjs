import test from 'node:test';
import assert from 'node:assert/strict';
import {CoopEngine} from '../app/coop-engine.ts';
import {CoopLocalMotion,CoopHostMotion,CoopSnapshotBuffer} from '../app/coop-motion.ts';
import {CoopInputInbox,idleCoopControls} from '../app/coop-protocol.ts';

function pair(){
 const host=new CoopEngine(123),guest=new CoopEngine(123);
 host.enemies.forEach(e=>e.hp=0);
 const r=host.levelData.rooms[0];let found=false;
 for(let y=r.y+70;y<r.y+r.h-100&&!found;y+=16)for(let x=r.x+60;x<r.x+r.w-100&&!found;x+=16){
  if([0,40,80].every(dx=>[0,40,80].every(dy=>host.canStand(x+dx,y+dy)))){Object.assign(host.actors[1].player,{x:x+20,y:y+20});found=true;}
 }
 assert.ok(found);guest.applySnapshot(host.snapshot());return {host,guest};
}

for(const rtt of [150,400,700])test(`guest stops/turns immediately with ${rtt}ms RTT, jitter, loss and reordered packets`,()=>{
 const {host,guest}=pair(),local=new CoopLocalMotion(),motion=new CoopHostMotion(),inbox=new CoopInputInbox();
 local.reconcile(guest,host.snapshot(),0);
 const queue=[];let seq=0,lastState=0,dropped=0,reorders=0,lastInput=0;
 let c=idleCoopControls();
 const deliver=now=>{
  queue.sort((a,b)=>a.at-b.at);
  while(queue.length&&queue[0].at<=now){
   const p=queue.shift();
   if(p.type==='input'){
    if(p.seq<lastInput)reorders++;lastInput=Math.max(lastInput,p.seq);
    if(inbox.accept(p.seq,p.controls,now))motion.accept(host,p.motion,now);
   }else if(p.state.seq>lastState){lastState=p.state.seq;local.reconcile(guest,p.state,p.revision);}
  }
 };
 const schedule=(packet,tick,salt)=>{
  // Deterministic opposing delays reorder packets; drop every seventh input.
  if(packet.type==='input'&&packet.seq%7===0){dropped++;return;}
  const jitter=[75,-35,10,-25,60,-20][(tick+salt)%6];
  queue.push({...packet,at:tick*1000/60+rtt/2+jitter});
 };
 for(let tick=0;tick<360;tick++){
  const now=tick*1000/60,prior={...guest.actors[1].player};deliver(now);
  assert.deepEqual(guest.actors[1].player,prior,"network state must not change local pose");
  const segment=Math.floor(tick/12)%5;
  c={...c,x:segment===0?1:segment===2?-1:0,y:segment===1?1:segment===3?-1:0};
  const before={...guest.actors[1].player};
  guest.predict(1,c,1/60);local.record(guest.actors[1]);
  const p=guest.actors[1].player;
  assert.ok(Math.abs(p.x-before.x-c.x*154/60)<1e-7,`x responded in same frame ${tick}`);
  assert.ok(Math.abs(p.y-before.y-c.y*154/60)<1e-7,`y responded in same frame ${tick}`);
  if(tick%3===0)schedule({type:'input',seq:++seq,controls:{...c},motion:local.packet(guest.actors[1])},tick,1);
  host.setControls(1,inbox.controls,inbox.takeDodge());host.advance(1/60);
  if(tick%5===0)schedule({type:'state',state:host.snapshot(),revision:motion.revision},tick,2);
 }
 assert.ok(motion.active);assert.equal(motion.revision,0,'valid path needs no forced corrections');assert.ok(dropped>0);assert.ok(reorders>0);
 // Stop locally and drain traffic: delayed authoritative positions cannot drag it.
 c={...c,x:0,y:0};const stopped={...guest.actors[1].player};
 for(let tick=360;tick<450;tick++){
  const now=tick*1000/60;deliver(now);guest.predict(1,c,1/60);local.record(guest.actors[1]);
  if(tick%3===0)schedule({type:'input',seq:++seq,controls:{...c},motion:local.packet(guest.actors[1])},tick,1);
  host.setControls(1,inbox.controls);host.advance(1/60);
  if(tick%5===0)schedule({type:'state',state:host.snapshot(),revision:motion.revision},tick,2);
  assert.equal(guest.actors[1].player.x,stopped.x);assert.equal(guest.actors[1].player.y,stopped.y);
 }
 assert.ok(Math.hypot(host.actors[1].player.x-stopped.x,host.actors[1].player.y-stopped.y)<.01);
});

test('guest roll starts on its first frame, survives stale worlds and never auto-repeats',()=>{
 const {host,guest}=pair(),local=new CoopLocalMotion();local.reconcile(guest,host.snapshot(),0);
 const c={...idleCoopControls(),x:1,dodge:1},before=guest.actors[1].player.x;
 guest.predict(1,c,1/60);assert.ok(Math.abs(guest.actors[1].player.x-before-440/60)<1e-6);
 const cooldown=guest.actors[1].dodgeCooldown,position=guest.actors[1].player.x;
 local.reconcile(guest,host.snapshot(),0);assert.equal(guest.actors[1].player.x,position);assert.equal(guest.actors[1].dodgeCooldown,cooldown);
 for(let i=0;i<180;i++)guest.predict(1,{...c,x:0},1/60);
 assert.equal(guest.actors[1].dodgeTime,0);assert.equal(guest.actors[1].dodgeCooldown,0);
});

test('host owns health, defeat/revive and authoritative collision corrections',()=>{
 const {host,guest}=pair(),local=new CoopLocalMotion();local.reconcile(guest,host.snapshot(),0);
 guest.predict(1,{...idleCoopControls(),x:1},1/60);const own=guest.actors[1].player.x;
 host.actors[1].player.hp=2;local.reconcile(guest,host.snapshot(),0);assert.equal(guest.actors[1].player.hp,2);assert.equal(guest.actors[1].player.x,own);
 host.actors[1].player.hp=0;local.reconcile(guest,host.snapshot(),0);assert.deepEqual(guest.actors[1].player,host.actors[1].player);
 host.actors[1].player.hp=2;local.reconcile(guest,host.snapshot(),0);assert.deepEqual(guest.actors[1].player,host.actors[1].player);
 guest.actors[1].player.x+=5;local.record(guest.actors[1]);local.reconcile(guest,host.snapshot(),1);
 assert.equal(guest.actors[1].player.x,host.actors[1].player.x);assert.deepEqual(local.packet(guest.actors[1]).path,[]);
});

test('host rejects speed hacks, malformed motion and paths tunnelling through walls',()=>{
 const {host}=pair(),motion=new CoopHostMotion(),p={...host.actors[1].player};
 assert.equal(motion.accept(host,{path:[[1,p.x+1000,p.y]],angle:0,revision:0},0),false);
 assert.equal(host.actors[1].player.x,p.x);assert.equal(motion.revision,1);
 assert.equal(motion.accept(host,{path:[[2,NaN,p.y]],angle:0,revision:1},50),false);
 // Once rejected, old in-flight paths cannot cause repeated corrections.
 assert.equal(motion.accept(host,{path:[[3,p.x+1000,p.y]],angle:0,revision:0},100),false);assert.equal(motion.revision,1);
 const r=host.levelData.rooms[0];let cross=null;
 for(let y=r.y+20;y<r.y+r.h&&!cross;y+=8)for(let x=r.x+20;x<r.x+r.w&&!cross;x+=8){
  if(host.canStand(x,y)&&host.canStand(x+80,y)&&!host.canStand(x+40,y)){cross={x,y};}
 }
 assert.ok(cross);Object.assign(host.actors[1].player,cross);
 const blocked=new CoopHostMotion();assert.equal(blocked.accept(host,{path:[[1,cross.x+80,cross.y]],angle:0,revision:0},0),false);
 assert.equal(host.actors[1].player.x,cross.x);assert.equal(blocked.revision,1);
});

test('snapshot interpolation remains continuous across packet arrival boundaries',()=>{
 const {host}=pair(),buffer=new CoopSnapshotBuffer();
 for(const at of [0,80,160,240,320]){const s=host.snapshot();s.actors[0].player.x=at;buffer.push(s,at);}
 const position=now=>{const s=buffer.sample(now);return s.prev.actors[0].player.x+(s.next.actors[0].player.x-s.prev.actors[0].player.x)*s.t;};
 for(let at=200;at<=400;at++)assert.ok(Math.abs(position(at)-(at-120))<1e-8);
});

test('the same client path passes authoritative collisions on all 25 campaign maps and endless modes',()=>{
 for(const mode of ['campaign','arcade','abyss'])for(let level=1;level<=(mode==='campaign'?25:2);level++){
  const gear={hat:false,mohawk:false,accessory:null};
  const setup={mode,level_id:level,host_equipment:gear,guest_equipment:gear};
  const host=new CoopEngine(77,1,()=>{},setup),guest=new CoopEngine(77,1,()=>{},setup);
  const local=new CoopLocalMotion(),motion=new CoopHostMotion();local.reconcile(guest,host.snapshot(),0);
  for(let i=0;i<90;i++){
   const angle=Math.floor(i/15)*Math.PI/2,c={...idleCoopControls(),x:Math.cos(angle),y:Math.sin(angle)};
   guest.predict(1,c,1/60);local.record(guest.actors[1]);
   if(i%3===0)assert.equal(motion.accept(host,local.packet(guest.actors[1]),i*1000/60),true,`${mode} ${level}: path accepted`);
  }
  assert.equal(motion.revision,0);
 }
});

test('client-owned movement is not integrated twice; combat and damage remain on the host',()=>{
 const {host,guest}=pair(),motion=new CoopHostMotion(),local=new CoopLocalMotion();
 local.reconcile(guest,host.snapshot(),0);local.record(guest.actors[1]);assert.ok(motion.accept(host,local.packet(guest.actors[1]),0));
 const p=host.actors[1].player,before={...p};
 host.setControls(1,{...idleCoopControls(),x:1});host.advance(1/60);assert.equal(p.x,before.x);assert.equal(p.y,before.y);
 const enemy=host.enemies[0];Object.assign(enemy,{x:p.x+24,y:p.y,hp:10,maxHp:10,room:host.actors[1].room,awake:true,mode:'recover',timer:9});
 host.setControls(1,{...idleCoopControls(),weapon:'fist',attack:true});host.advance(1/60);assert.equal(enemy.hp,9);
 const bullet=host.bullets[0];Object.assign(bullet,{active:true,x:p.x,y:p.y,vx:0,vy:0,life:2,owner:'enemy',kind:'round'});
 host.advance(1/60);assert.equal(p.hp,2);
 local.reconcile(guest,host.snapshot(),0);assert.equal(guest.actors[1].player.hp,2);assert.equal(guest.enemies[0].hp,9);
});
