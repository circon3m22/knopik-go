import type {CoopActor,CoopEngine,CoopSnapshot} from "./coop-engine.ts";

type Point=[number,number,number];
type Motion={path:Point[];angle:number;revision:number};
const motorKeys=["moving","walkDistance","dodgeTime","dodgeCooldown","dodgeX","dodgeY"] as const;

/** The guest owns movement, never health, damage, loot or level objectives.
 * A short redundant path survives dropped/reordered packets and retains corners. */
export class CoopLocalMotion {
 private serial=0;
 private path:Point[]=[];
 private revision:number|null=null;
 private recordedAt=-Infinity;
 record(actor:CoopActor,now?:number){
  if(now!==undefined){if(now-this.recordedAt<16)return;this.recordedAt=now;}
  this.path.push([++this.serial,Math.round(actor.player.x*100)/100,Math.round(actor.player.y*100)/100]);
  if(this.path.length>48)this.path.shift();
 }
 packet(actor:CoopActor):Motion{return {path:this.path.map(p=>[...p]),angle:actor.player.angle,revision:this.revision??0};}
 reconcile(engine:CoopEngine,state:CoopSnapshot,revision:number|null){
  const before=engine.actors[1],next=state.actors[1];
  const keep=revision!==null&&this.revision===revision&&before.player.hp>0&&next.player.hp>0;
  engine.applySnapshot(state);
  if(keep&&engine.canStand(before.player.x,before.player.y)){
   const actor=engine.actors[1];
   actor.player.x=before.player.x;actor.player.y=before.player.y;actor.player.angle=before.player.angle;
   for(const key of motorKeys)Object.assign(actor,{[key]:before[key]});
   actor.room=before.room;
  }else this.path=[];
  this.revision=revision;
 }
}

/** Validate distance and sweep every segment through the authoritative geometry.
 * The budget absorbs packet jitter; it cannot accumulate unlimited teleport credit. */
export class CoopHostMotion {
 active=false;
 revision=0;
 private point=0;
 private at:number|null=null;
 private budget=160;
 private alive:boolean|null=null;
 syncLife(engine:CoopEngine){
  const alive=engine.actors[1].player.hp>0;
  if(this.alive!==null&&alive!==this.alive&&this.active){
   this.revision++;this.point=0;this.budget=160;this.at=null;
   engine.guestOwnsMovement=false;
  }
  this.alive=alive;
 }
 accept(engine:CoopEngine,value:unknown,now:number){
  this.syncLife(engine);
  if(!this.alive||engine.phase==='dead'||engine.phase==='won')return false;
  if(!value||typeof value!=="object")return false;
  const m=value as Motion;
  if(!Array.isArray(m.path)||!m.path.length||m.path.length>48||!Number.isFinite(m.angle)||!Number.isSafeInteger(m.revision)||m.revision!==this.revision)return false;
  let previous=0;
  for(const p of m.path){if(!Array.isArray(p)||p.length!==3||!Number.isSafeInteger(p[0])||p[0]<=previous||!p.every(Number.isFinite)||Math.abs(p[1])>20000||Math.abs(p[2])>20000)return false;previous=p[0];}
  const path=m.path.filter(p=>p[0]>this.point);if(!path.length)return false;
  this.active=true;engine.guestOwnsMovement=true;
  this.budget=Math.min(520,this.budget+Math.max(0,now-(this.at??now))*.48);this.at=now;
  this.point=path.at(-1)![0];
  const actor=engine.actors[1];let x=actor.player.x,y=actor.player.y,length=0;
  for(const [,px,py] of path){length+=Math.hypot(px-x,py-y);x=px;y=py;}
  if(length>this.budget||!engine.moveGuestPath(path.map(([,x,y])=>({x,y})),m.angle)){
   this.revision++;return false;
  }
  this.budget-=length;return true;
 }
}

/** Keep enough snapshots to interpolate across arrival boundaries, rather than
 * restarting a two-frame lerp on every network packet. */
export class CoopSnapshotBuffer {
 private frames:{at:number;state:CoopSnapshot}[]=[];
 push(state:CoopSnapshot,at:number){this.frames.push({at,state});if(this.frames.length>16)this.frames.shift();}
 sample(now:number){
  if(this.frames.length<2)return null;
  const at=now-120;
  let i=0;while(i<this.frames.length-2&&this.frames[i+1].at<=at)i++;
  const a=this.frames[i],b=this.frames[i+1],span=Math.max(1,b.at-a.at);
  return {prev:a.state,next:b.state,t:Math.max(0,Math.min(1+Math.min(80,span)/span,(at-a.at)/span))};
 }
}

export class CoopRemotePose {
 private pose:{x:number;y:number;angle:number}|null=null;
 sample(player:{x:number;y:number;angle:number;hp:number},dt:number){
  // Cache geometry only: spreading player here also cached hp=0 after a fall,
  // which then overrode the authoritative revived health forever.
  if(!this.pose||player.hp<=0||Math.hypot(player.x-this.pose.x,player.y-this.pose.y)>240)this.pose={x:player.x,y:player.y,angle:player.angle};
  const k=1-Math.exp(-24*dt);
  this.pose.x+=(player.x-this.pose.x)*k;this.pose.y+=(player.y-this.pose.y)*k;
  this.pose.angle+=Math.atan2(Math.sin(player.angle-this.pose.angle),Math.cos(player.angle-this.pose.angle))*k;
  return {...player,x:this.pose.x,y:this.pose.y,angle:this.pose.angle};
 }
}
