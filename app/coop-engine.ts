import { AdventureEngine, type AdventureActor, type AdventureEnemy, type AdventureBullet, type AdventureInput, type AdventureSound } from "./adventure-engine.ts";
import { generateArcadeDungeon } from "./arcade-dungeon.ts";
import type { AdventureLevel } from "./dungeon-campaign.ts";
import { EMPTY_EQUIPMENT } from "./knopik-equipment-state.ts";
import type { AdventureWeapon } from "./adventure-levels.ts";
import type { DungeonEffect, ArcLink } from "./dungeon-runtime.ts";
import { COOP_PROTOCOL, type CoopSlot, type CoopControls } from "./coop-protocol.ts";

export type CoopActor = {
  player:AdventureActor; room:number; weapon:AdventureWeapon; moving:boolean; walkDistance:number;
  punchSerial:number; invincible:number; dodgeTime:number; dodgeCooldown:number; dodgeX:number; dodgeY:number;
  punchTime:number; punchCooldown:number; punchCooldownDuration:number; input:AdventureInput; reviveProgress:number;
};
export type CoopSnapshot = {v:1;seed:number;round:number;seq:number;time:number;phase:"playing"|"paused"|"dead"|"won";actors:[CoopActor,CoopActor];enemies:AdventureEnemy[];bullets:AdventureBullet[];cleared:boolean[];visited:boolean[];destroyed:boolean[];coverHp:(number|null)[];effects:DungeonEffect[];links:ArcLink[]};
const distance=(a:{x:number;y:number},b:{x:number;y:number})=>Math.hypot(a.x-b.x,a.y-b.y);

export function generateCoopDungeon(seed:number):AdventureLevel {
  const level=generateArcadeDungeon(seed,0);
  level.name="Вылазка вдвоём";level.intro="Зачистите восемь залов и вместе доберитесь до выхода.";
  level.roomNames=level.rooms.map((_,i)=>`Совместная вылазка · зал ${i+1}`);
  // A consistent starting difficulty; the same three weapons are available to both.
  level.zone=1;level.stage=1;level.feature="Кооператив · 2 игрока";
  return level;
}

/** Only the room host advances this world. Both actors use the original combat and collision code. */
export class CoopEngine extends AdventureEngine {
  private coopLayout:AdventureLevel|null=null;
  actors:[CoopActor,CoopActor];
  private controls:[CoopControls|null,CoopControls|null]=[null,null];
  private actionSlot:CoopSlot=0;
  private sequence=0;
  private sounds:AdventureSound[];
  private playSound:(kind:AdventureSound)=>void;
  drainSounds(){return this.sounds.splice(0,8);}
  readonly seed:number;
  readonly round:number;
  override get levelData(){return this.coopLayout??super.levelData;}
  constructor(seed:number,round=1,sound:(kind:AdventureSound)=>void=()=>{}){
    const sounds:AdventureSound[]=[];
    const playSound=(kind:AdventureSound)=>{sound(kind);if(sounds.length<8)sounds.push(kind);};
    super(3,{change(){},checkpoint(){},sound:playSound,run(){},bar(){}},{completedLevel:1,weaponTier:2,random:()=>seed/0xffffffff});
    this.sounds=sounds;this.playSound=playSound;
    this.seed=seed;this.round=round;this.coopLayout=generateCoopDungeon(seed);
    this.phase="levels";this.startArcade();this.weapon="pistol";
    const first=this.capture();
    const second=structuredClone(first);
    for(const offset of [-64,64,-80,80,-42,42])if(this.canStand(first.player.x+offset,first.player.y)){second.player.x+=offset;break;}
    this.actors=[first,second];
  }
  private capture():CoopActor {
    return {player:this.player,room:this.room,weapon:this.weapon,moving:this.moving,walkDistance:this.walkDistance,punchSerial:this.punchSerial,invincible:this.invincible,dodgeTime:this.dodgeTime,dodgeCooldown:this.dodgeCooldown,dodgeX:this.dodgeX,dodgeY:this.dodgeY,punchTime:this.punchTime,punchCooldown:this.punchCooldown,punchCooldownDuration:this.punchCooldownDuration,input:this.input,reviveProgress:this.actors?.[this.actionSlot]?.reviveProgress??0};
  }
  forPlayer<T>(slot:CoopSlot,action:()=>T):T {
    const outer=this.capture(),previous=this.actionSlot;
    this.actionSlot=slot;Object.assign(this,this.actors[slot]);
    try{return action();}finally{Object.assign(this.actors[slot],this.capture());Object.assign(this,outer);this.actionSlot=previous;}
  }
  setControls(slot:CoopSlot,controls:CoopControls,dodge=false){
    this.controls[slot]=controls;
    this.forPlayer(slot,()=>{
      this.setInput(controls.x,controls.y,controls.attack);
      if(this.player.hp<=0)return;
      this.selectWeapon(controls.weapon);
      if(dodge)this.dodge();
    });
  }
  clearControls(){for(const slot of [0,1] as const){this.controls[slot]=null;this.forPlayer(slot,()=>this.setInput(0,0,false));}}
  override get levelGoalsDone(){return !!this.actors&&this.cleared.every(Boolean);}
  override get canFinishLevel(){return this.phase==="playing"&&this.levelGoalsDone&&this.actors.every(a=>a.player.hp>0&&distance(a.player,this.levelData.exit)<105);}
  override finishLevel(){if(!this.canFinishLevel)return false;this.phase="won";this.playSound("win");this.clearControls();return true;}
  override interact(){if(this.canFinishLevel)this.finishLevel();}
  protected override hurt(){
    if(this.phase!=="playing"||this.player.hp<=0||this.invincible>0)return;
    this.player.hp=Math.max(0,this.player.hp-1);this.invincible=1.1;this.playSound("hit");
    this.effects.burst("hit",this.player.x,this.player.y,30);
    if(this.player.hp===0){this.setInput(0,0,false);this.moving=false;this.dodgeTime=0;}
  }
  private playerStep(dt:number){
    if(this.player.hp<=0){this.moving=false;return;}
    const before={...this.player};
    this.invincible=Math.max(0,this.invincible-dt);this.dodgeCooldown=Math.max(0,this.dodgeCooldown-dt);
    this.punchCooldown=Math.max(0,this.punchCooldown-dt);this.punchTime=Math.max(0,this.punchTime-dt);
    if(this.dodgeTime>0){this.dodgeTime=Math.max(0,this.dodgeTime-dt);this.move(this.player,this.dodgeX*440*dt,this.dodgeY*440*dt);}
    else {
      if(Math.hypot(this.input.x,this.input.y)>.1)this.player.angle=Math.atan2(this.input.y,this.input.x);
      this.move(this.player,this.input.x*154*dt,this.input.y*154*dt);
      if(this.input.attack)this.punch();
    }
    const moved=distance(before,this.player);this.moving=moved>.05;this.walkDistance+=moved;
    const room=this.levelData.rooms.findIndex(r=>this.player.x>=r.x&&this.player.x<=r.x+r.w&&this.player.y>=r.y&&this.player.y<=r.y+r.h);
    if(room>=0)this.room=room;
    if(this.dungeon)this.dungeon.visited[this.room]=true;
    const fallen=this.actors[this.actionSlot===0?1:0];
    if(this.controls[this.actionSlot]?.interact&&fallen.player.hp===0&&distance(this.player,fallen.player)<70&&this.lineClear(this.player,fallen.player)&&!this.moving){
      fallen.reviveProgress+=dt;
      if(fallen.reviveProgress>=2){fallen.player.hp=2;fallen.invincible=2;fallen.reviveProgress=0;this.playSound("revive");this.effects.burst("heal",fallen.player.x,fallen.player.y,38);}
    }else fallen.reviveProgress=0;
  }
  protected override step(dt:number){
    this.time+=dt;this.effects.step(dt);this.impactStop=0;
    for(const slot of [0,1] as const)this.forPlayer(slot,()=>this.playerStep(dt));
    for(const enemy of this.enemies){
      const targets=this.actors.map((a,i)=>({a,slot:i as CoopSlot})).filter(t=>t.a.player.hp>0&&t.a.room===enemy.room).sort((a,b)=>distance(enemy,a.a.player)-distance(enemy,b.a.player));
      if(!targets.length){enemy.moving=false;enemy.flash=Math.max(0,enemy.flash-dt);continue;}
      const target=targets[0];
      this.navigation.beginStep(this.levelData.rooms[enemy.room],`coop:${enemy.room}:${this.dungeon?.geometryRevision??0}`);
      this.forPlayer(target.slot,()=>this.enemyStep(enemy,dt));
    }
    for(const b of this.bullets){
      if(!b.active)continue;
      b.life-=dt;const n=Math.max(1,Math.ceil(Math.hypot(b.vx,b.vy)*dt/3));
      for(let i=0;i<n&&b.active;i++){
        b.x+=b.vx*dt/n;b.y+=b.vy*dt/n;
        if(b.life<=0||!this.canStand(b.x,b.y,2)){
          b.active=false;
          if(b.kind==="grenade")this.blast(b.x,b.y,b.splash??95,b.damage??3);
          else if(b.owner==="player"){const cover=this.levelData.solids.findIndex((s,j)=>!this.dungeon?.destroyed[j]&&b.x>s.x-3&&b.x<s.x+s.w+3&&b.y>s.y-3&&b.y<s.y+s.h+3);if(cover>=0)this.dungeon?.hitCover(cover,b.damage??1,this.time);}
        }else if(b.owner==="player"){
          const e=this.enemies.find(e=>e.hp>0&&e.awake!==false&&distance(e,b)<15);
          if(e){b.active=false;this.hitEnemy(e,b.damage??1,Math.atan2(b.vy,b.vx));}
        }else if(b.kind!=="grenade"){
          const slot=this.actors.findIndex(a=>a.player.hp>0&&distance(a.player,b)<15);
          if(slot>=0){b.active=false;this.forPlayer(slot as CoopSlot,()=>this.hurt());}
        }
      }
    }
    for(let room=0;room<this.cleared.length;room++)if(this.enemies.filter(e=>e.room===room&&e.awake!==false).every(e=>e.hp<=0))this.cleared[room]=true;
    if(this.actors.every(a=>a.player.hp<=0)){this.phase="dead";this.clearControls();}
    if(this.canFinishLevel)this.finishLevel();
    // The public base actor is always host; rendering uses forPlayer without changing simulation ownership.
    Object.assign(this,this.actors[0]);
  }
  private blast(x:number,y:number,r:number,damage:number){
    this.effects.burst("blast",x,y,r);this.dungeon?.damageCovers(x,y,r,damage,this.time);
    for(const e of this.enemies)if(e.hp>0&&distance(e,{x,y})<r){e.hp=Math.max(0,e.hp-damage);e.flash=.15;}
    for(const slot of [0,1] as const)if(distance(this.actors[slot].player,{x,y})<r*.75)this.forPlayer(slot,()=>this.hurt());
  }
  predict(slot:CoopSlot,controls:CoopControls,dt:number){
    if(this.phase!=="playing"||this.actors[slot].player.hp<=0)return;
    this.forPlayer(slot,()=>{
      const before={...this.player},elapsed=Math.min(.05,dt),n=Math.max(1,Math.hypot(controls.x,controls.y));
      if(this.dodgeTime>0){this.move(this.player,this.dodgeX*440*elapsed,this.dodgeY*440*elapsed);this.dodgeTime=Math.max(0,this.dodgeTime-elapsed);}
      else{if(n>.1&&(controls.x||controls.y))this.player.angle=Math.atan2(controls.y,controls.x);this.move(this.player,controls.x/n*154*elapsed,controls.y/n*154*elapsed);}
      this.dodgeCooldown=Math.max(0,this.dodgeCooldown-elapsed);this.punchCooldown=Math.max(0,this.punchCooldown-elapsed);this.punchTime=Math.max(0,this.punchTime-elapsed);this.invincible=Math.max(0,this.invincible-elapsed);
      this.moving=distance(before,this.player)>.05;this.walkDistance+=distance(before,this.player);
    });
  }
  snapshot():CoopSnapshot {
    return structuredClone({v:COOP_PROTOCOL,seed:this.seed,round:this.round,seq:++this.sequence,time:this.time,phase:this.phase as CoopSnapshot["phase"],actors:this.actors,enemies:this.enemies,bullets:this.bullets,cleared:this.cleared,visited:this.dungeon?.visited??this.cleared.map(()=>false),destroyed:this.dungeon?.destroyed??[],coverHp:(this.dungeon?.coverHp??[]).map(n=>Number.isFinite(n)?n:null),effects:this.effects.pool,links:this.effects.links});
  }
  applySnapshot(s:CoopSnapshot){
    if(s.seed!==this.seed||s.round!==this.round)return;
    this.sequence=Math.max(this.sequence,s.seq);this.time=s.time;this.phase=s.phase;this.actors=structuredClone(s.actors);this.enemies=structuredClone(s.enemies);this.bullets=structuredClone(s.bullets);this.cleared=[...s.cleared];
    if(this.dungeon){this.dungeon.visited=[...s.visited];this.dungeon.destroyed=[...s.destroyed];this.dungeon.coverHp=s.coverHp.map(n=>n??Infinity);}
    this.effects.pool=structuredClone(s.effects);this.effects.links=structuredClone(s.links);
    Object.assign(this,this.actors[0]);
  }
  companion(slot:CoopSlot){return {...this.actors[slot],slot,area:"sewer" as const,checkpoint:3,tutorialOpened:true,equipment:EMPTY_EQUIPMENT};}
}

/** Reject malformed / incompatible worlds before they reach SVG or collision code. */
export function readCoopSnapshot(value:unknown,engine:CoopEngine):CoopSnapshot|null {
  if(!value||typeof value!=="object")return null;
  const s=value as CoopSnapshot;
  if(s.v!==COOP_PROTOCOL||s.seed!==engine.seed||s.round!==engine.round||!Number.isSafeInteger(s.seq)||s.seq<1||!Number.isFinite(s.time)||s.time<0||!["playing","paused","dead","won"].includes(s.phase)||!Array.isArray(s.actors)||s.actors.length!==2||!Array.isArray(s.enemies)||s.enemies.length!==engine.levelData.enemies.length||!Array.isArray(s.bullets)||s.bullets.length!==64||!Array.isArray(s.cleared)||s.cleared.length!==8||!Array.isArray(s.visited)||s.visited.length!==8||!Array.isArray(s.destroyed)||s.destroyed.length!==engine.levelData.solids.length||!Array.isArray(s.coverHp)||s.coverHp.length!==s.destroyed.length||!Array.isArray(s.effects)||s.effects.length!==36||!Array.isArray(s.links)||s.links.length!==12)return null;
  for(const a of s.actors)if(!a||!a.player||!a.input||![a.player.x,a.player.y,a.player.angle,a.player.hp,a.room,a.punchSerial,a.invincible,a.dodgeTime,a.dodgeCooldown,a.dodgeX,a.dodgeY,a.punchTime,a.punchCooldown,a.punchCooldownDuration,a.walkDistance,a.reviveProgress,a.input.x,a.input.y].every(Number.isFinite)||a.player.hp<0||a.player.hp>3||Math.abs(a.player.x)>20000||Math.abs(a.player.y)>20000||typeof a.input.attack!=="boolean"||typeof a.moving!=="boolean"||!Number.isInteger(a.room)||a.room<0||a.room>7||!["fist","sabre","pistol"].includes(a.weapon))return null;
  for(const e of s.enemies)if(!e||![e.x,e.y,e.angle,e.hp,e.maxHp,e.timer,e.attackAngle,e.flash,e.walkDistance,e.windupDuration,e.recoveryDuration].every(Number.isFinite)||!["chase","windup","recover","charge"].includes(e.mode)||typeof e.moving!=="boolean"||typeof e.attackRecovery!=="boolean"||!Number.isInteger(e.room)||e.room<0||e.room>7)return null;
  for(const b of s.bullets)if(!b||![b.x,b.y,b.vx,b.vy,b.life].every(Number.isFinite)||typeof b.active!=="boolean")return null;
  for(const e of s.effects)if(!e||![e.x,e.y,e.age,e.seed,e.radius].every(Number.isFinite)||typeof e.active!=="boolean")return null;
  for(const l of s.links)if(!l||![l.x,l.y,l.tx,l.ty,l.age].every(Number.isFinite)||typeof l.active!=="boolean")return null;
  if(!s.cleared.every(v=>typeof v==="boolean")||!s.visited.every(v=>typeof v==="boolean")||!s.destroyed.every(v=>typeof v==="boolean")||!s.coverHp.every(v=>v===null||Number.isFinite(v)))return null;
  // Whitelist actor fields before forPlayer assigns their context to the engine.
  const actors=s.actors.map(a=>({player:{x:a.player.x,y:a.player.y,angle:a.player.angle,hp:a.player.hp},room:a.room,weapon:a.weapon,moving:a.moving,walkDistance:a.walkDistance,punchSerial:a.punchSerial,invincible:a.invincible,dodgeTime:a.dodgeTime,dodgeCooldown:a.dodgeCooldown,dodgeX:a.dodgeX,dodgeY:a.dodgeY,punchTime:a.punchTime,punchCooldown:a.punchCooldown,punchCooldownDuration:a.punchCooldownDuration,input:{x:a.input.x,y:a.input.y,attack:a.input.attack},reviveProgress:a.reviveProgress})) as [CoopActor,CoopActor];
  return {...s,actors};
}
