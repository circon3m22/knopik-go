import {type CoopSnapshot,type CoopEngine,readCoopSnapshot} from "./coop-engine.ts";
import type {AdventureEnemy,AdventureBullet} from "./adventure-engine.ts";
import type {DungeonEffect} from "./dungeon-runtime.ts";

type EnemyTuple=[number,number,number,number,AdventureEnemy["mode"],number,number,number,boolean,number,number,number,boolean,boolean,number];
type BulletTuple=[number,number,number,number,number,number,AdventureBullet["owner"],AdventureBullet["kind"],number,number,number];
type EffectTuple=[number,number,number,number,DungeonEffect["kind"],number,number];
type LinkTuple=[number,number,number,number,number,number];
type Wire={format:"coop-1";v:1;seed:number;round:number;seq:number;time:number;phase:CoopSnapshot["phase"];actors:CoopSnapshot["actors"];e:EnemyTuple[];b:BulletTuple[];fx:EffectTuple[];arcs:LinkTuple[];cleared:number;visited:number;destroyed:number[];covers:[number,number][]};
const pos=(n:number)=>Math.round(n*100)/100;
const time=(n:number)=>Math.round(n*10000)/10000;
/** Static map data and inactive pool entries are already present on both devices. */
export function packCoopSnapshot(s:CoopSnapshot):Wire{
 return {format:"coop-1",v:s.v,seed:s.seed,round:s.round,seq:s.seq,time:time(s.time),phase:s.phase,actors:s.actors,
  e:s.enemies.map(e=>[pos(e.x),pos(e.y),time(e.angle),e.hp,e.mode,time(e.timer),time(e.flash),time(e.attackAngle),e.moving,pos(e.walkDistance),time(e.windupDuration),time(e.recoveryDuration),e.attackRecovery,e.awake!==false,e.attackCount??0]),
  b:s.bullets.flatMap((b,i)=>b.active?[[i,pos(b.x),pos(b.y),pos(b.vx),pos(b.vy),time(b.life),b.owner,b.kind,b.damage??1,b.maxLife??1,b.splash??0] as BulletTuple]:[]),
  fx:s.effects.flatMap((e,i)=>e.active?[[i,pos(e.x),pos(e.y),time(e.age),e.kind,e.seed,e.radius] as EffectTuple]:[]),
  arcs:s.links.flatMap((l,i)=>l.active?[[i,pos(l.x),pos(l.y),pos(l.tx),pos(l.ty),time(l.age)] as LinkTuple]:[]),
  cleared:s.cleared.reduce((bits,v,i)=>bits|(v?1<<i:0),0),visited:s.visited.reduce((bits,v,i)=>bits|(v?1<<i:0),0),destroyed:s.destroyed.flatMap((v,i)=>v?[i]:[]),covers:s.coverHp.flatMap((v,i)=>v!==null?[[i,v] as [number,number]]:[])};
}
export function unpackCoopSnapshot(value:unknown,engine:CoopEngine):CoopSnapshot|null{
 if(!value||typeof value!=="object")return null;
 const w=value as Wire;
 if(w.format!=="coop-1"||!Array.isArray(w.e)||w.e.length!==engine.enemies.length||!Array.isArray(w.b)||w.b.length>64||!Array.isArray(w.fx)||w.fx.length>36||!Array.isArray(w.arcs)||w.arcs.length>12||!Array.isArray(w.destroyed)||w.destroyed.length>engine.levelData.solids.length||!Array.isArray(w.covers)||w.covers.length>engine.levelData.solids.length||!Number.isInteger(w.cleared)||w.cleared<0||w.cleared>255||!Number.isInteger(w.visited)||w.visited<0||w.visited>255)return null;
 try{
  const enemies=engine.enemies.map((e,i)=>{const [x,y,angle,hp,mode,timer,flash,attackAngle,moving,walkDistance,windupDuration,recoveryDuration,attackRecovery,awake,attackCount]=w.e[i];return {...e,x,y,angle,hp,mode,timer,flash,attackAngle,moving,walkDistance,windupDuration,recoveryDuration,attackRecovery,awake,attackCount};});
  const bullets=engine.bullets.map(b=>({...b,active:false}));
  const effects=engine.effects.pool.map(e=>({...e,active:false})),links=engine.effects.links.map(l=>({...l,active:false}));
  for(const [i,x,y,vx,vy,life,owner,kind,damage,maxLife,splash] of w.b){if(!Number.isInteger(i)||i<0||i>=64)return null;Object.assign(bullets[i],{active:true,x,y,vx,vy,life,owner,kind,damage,maxLife,splash});}
  for(const [i,x,y,age,kind,seed,radius] of w.fx){if(!Number.isInteger(i)||i<0||i>=36)return null;Object.assign(effects[i],{active:true,x,y,age,kind,seed,radius});}
  for(const [i,x,y,tx,ty,age] of w.arcs){if(!Number.isInteger(i)||i<0||i>=12)return null;Object.assign(links[i],{active:true,x,y,tx,ty,age});}
  const destroyed=engine.levelData.solids.map(()=>false),coverHp:(number|null)[]=engine.levelData.solids.map(s=>s.breakable?3:null);
  for(const i of w.destroyed){if(!Number.isInteger(i)||i<0||i>=destroyed.length)return null;destroyed[i]=true;}
  for(const [i,hp] of w.covers){if(!Number.isInteger(i)||i<0||i>=coverHp.length||!Number.isFinite(hp))return null;coverHp[i]=hp;}
  const state={v:w.v,seed:w.seed,round:w.round,seq:w.seq,time:w.time,phase:w.phase,actors:w.actors,enemies,bullets,cleared:Array.from({length:8},(_,i)=>!!(w.cleared&(1<<i))),visited:Array.from({length:8},(_,i)=>!!(w.visited&(1<<i))),destroyed,coverHp,effects,links};
  return readCoopSnapshot(state,engine);
 }catch{return null;}
}
