import { AdventureEngine, type AdventureActor, type AdventureEnemy, type AdventureBullet, type AdventureChest, type AdventureCoin, type AdventureInput, type AdventureSound } from "./adventure-engine.ts";
import { generateArcadeDungeon } from "./arcade-dungeon.ts";
import { generateEndlessDungeon,abyssRandom } from "./endless-dungeon.ts";
import type { AdventureLevel } from "./dungeon-campaign.ts";
import { type KnopikEquipment } from "./knopik-equipment-state.ts";
import { adventureLevel,WEAPON_ORDER,type AdventureWeapon } from "./adventure-levels.ts";
import type { DungeonRuntime,DungeonEffect, ArcLink } from "./dungeon-runtime.ts";
import { COOP_PROTOCOL,defaultCoopSetup,readCoopEquipment, type CoopSetup,type CoopSlot, type CoopControls } from "./coop-protocol.ts";

export type CoopActor = {
  player:AdventureActor; room:number; weapon:AdventureWeapon; moving:boolean; walkDistance:number;
  punchSerial:number; invincible:number; dodgeTime:number; dodgeCooldown:number; dodgeX:number; dodgeY:number;
  punchTime:number; punchCooldown:number; punchCooldownDuration:number; input:AdventureInput; reviveProgress:number; equipment:KnopikEquipment; interacting:boolean;actionSerial:number;energySerial:number;energyCooldown:number;energyWave:AdventureEngine["energyWave"];energyHits:number[];
};
type RuntimeState=Pick<DungeonRuntime,"tasks"|"mines"|"lastTrapHit"|"medkits"|"geometryRevision"|"notice"|"noticeUntil">;
export type CoopSnapshot = {v:4;mode:CoopSetup["mode"];level_id:number;runtime:RuntimeState;barrels:AdventureEngine["barrels"];chests:AdventureChest[];coins:AdventureCoin[];collectedCoins:number;seed:number;round:number;seq:number;time:number;phase:"playing"|"paused"|"dead"|"won";actors:[CoopActor,CoopActor];enemies:AdventureEnemy[];bullets:AdventureBullet[];cleared:boolean[];visited:boolean[];destroyed:boolean[];coverHp:(number|null)[];effects:DungeonEffect[];links:ArcLink[]};
const distance=(a:{x:number;y:number},b:{x:number;y:number})=>Math.hypot(a.x-b.x,a.y-b.y);

export function generateCoopDungeon(seed:number,segment=0):AdventureLevel {
  const level=generateArcadeDungeon(seed,segment);
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
  guestOwnsMovement=false;
  private predictedDodge=0;
  private sounds:AdventureSound[];
  private playSound:(kind:AdventureSound)=>void;
  drainSounds(){return this.sounds.splice(0,8);}
  readonly setup:CoopSetup;
  readonly seed:number;
  readonly round:number;
  override get levelData(){return this.coopLayout??super.levelData;}
  constructor(seed:number,round=1,sound:(kind:AdventureSound)=>void=()=>{},setup:CoopSetup=defaultCoopSetup()){
    const sounds:AdventureSound[]=[];
    const playSound=(kind:AdventureSound)=>{sound(kind);if(sounds.length<8)sounds.push(kind);};
    super(3,{change(){},checkpoint(){},sound:playSound,run(){},bar(){}},{completedLevel:1,weaponTier:setup.mode==="arcade"?2:setup.mode==="abyss"?5:0,random:abyssRandom(seed)});
    this.sounds=sounds;this.playSound=playSound;
    this.seed=seed;this.round=round;this.setup=structuredClone(setup);
    this.coopLayout=setup.mode==="campaign"?adventureLevel(setup.level_id):setup.mode==="abyss"?generateEndlessDungeon(seed,setup.level_id):generateCoopDungeon(seed,setup.level_id-1);
    if(setup.mode==="arcade"){this.phase="levels";this.startArcade();this.weapon="pistol";}
    else {this.level=this.coopLayout.id;if(setup.mode==="abyss")this.endlessData=generateEndlessDungeon(seed,setup.level_id);this.loadArea("sewer");}
    // Co-op keeps all loot inside this world; it never calls personal save callbacks.
    this.ingredientPickups=[];this.equipment={...setup.host_equipment};
    const first=this.capture();
    const second=structuredClone(first);second.equipment={...setup.guest_equipment};
    for(const offset of [-64,64,-80,80,-42,42])if(this.canStand(first.player.x+offset,first.player.y)){second.player.x+=offset;break;}
    this.actors=[first,second];
  }
  private capture():CoopActor {
    return {player:this.player,room:this.room,weapon:this.weapon,moving:this.moving,walkDistance:this.walkDistance,punchSerial:this.punchSerial,invincible:this.invincible,dodgeTime:this.dodgeTime,dodgeCooldown:this.dodgeCooldown,dodgeX:this.dodgeX,dodgeY:this.dodgeY,punchTime:this.punchTime,punchCooldown:this.punchCooldown,punchCooldownDuration:this.punchCooldownDuration,input:this.input,equipment:this.equipment,energyCooldown:this.energyCooldown,energyWave:this.energyWave,energyHits:[...this.energyHits],actionSerial:this.actors?.[this.actionSlot]?.actionSerial??0,energySerial:this.actors?.[this.actionSlot]?.energySerial??0,interacting:this.actors?.[this.actionSlot]?.interacting??false,reviveProgress:this.actors?.[this.actionSlot]?.reviveProgress??0};
  }
  private restoreActor(actor:CoopActor){const {energyHits,...fields}=actor;Object.assign(this,fields);this.energyHits=new Set(energyHits);}
  forPlayer<T>(slot:CoopSlot,action:()=>T):T {
    const outer=this.capture(),previous=this.actionSlot;
    this.actionSlot=slot;this.restoreActor(this.actors[slot]);
    try{return action();}finally{Object.assign(this.actors[slot],this.capture());this.restoreActor(outer);this.actionSlot=previous;}
  }
  setControls(slot:CoopSlot,controls:CoopControls,dodge=false){
    this.controls[slot]=controls;
    this.forPlayer(slot,()=>{
      this.setInput(controls.x,controls.y,controls.attack);
      if(this.player.hp<=0)return;
      this.selectWeapon(controls.weapon);
      if(dodge)this.dodge();
      if(controls.energy>this.actors[slot].energySerial){this.actors[slot].energySerial=controls.energy;this.activateEnergyWave();}
    });
  }
  clearControls(){for(const slot of [0,1] as const){this.controls[slot]=null;this.forPlayer(slot,()=>this.setInput(0,0,false));}}
  override get levelGoalsDone(){return !!this.actors&&(this.setup.mode==="arcade"?this.cleared.every(Boolean):!!this.cleared[this.levelData.exit.room]&&!!this.dungeon?.allDone);}
  override get canFinishLevel(){return this.phase==="playing"&&this.levelGoalsDone&&this.actors.every(a=>a.player.hp>0&&distance(a.player,this.levelData.exit)<105);}
  override finishLevel(){if(!this.canFinishLevel)return false;this.phase="won";this.playSound("win");this.clearControls();return true;}
  override interact(){
    if(this.phase!=="playing"||this.player.hp<=0)return;
    if(this.canFinishLevel){this.finishLevel();return;}
    const task=this.dungeon?.nearby(this.player.x,this.player.y)??-1;
    if(task>=0)this.dungeon?.activate(task,this.time);else this.openChest();
  }
  get availableWeapons(){return WEAPON_ORDER.filter(w=>(this.level>2||w==="fist")&&this.weaponTier>=({fist:0,sabre:1,pistol:2,shotgun:3,launcher:4,arc:5,crossbow:6,rifle:7}[w]));}
  get coopObjective(){return this.levelGoalsDone?"Вместе подойдите к подъёмнику":this.dungeon?.tasks.length&&!this.dungeon.allDone?this.dungeon.objective():"Победите охрану и доберитесь до подъёмника";}
  get coopInteraction(){const fallen=this.actors[this.actionSlot===0?1:0];if(fallen.player.hp<=0&&distance(this.player,fallen.player)<70)return "Помочь · держи E";const task=this.dungeon?.nearby(this.player.x,this.player.y)??-1;return task>=0?this.levelData.tasks[task].label+" · E":this.chests.some(c=>!c.opened&&this.cleared[c.room]&&distance(this.player,c)<68)?"Открыть сундук · E":"Действие / помощь · E";}
  protected override hazardDamage(player?:{x:number;y:number}){const slot=this.actors.findIndex(a=>a.player===player);if(slot>=0)this.forPlayer(slot as CoopSlot,()=>this.hurt());}

  protected override hurt(){
    if(this.phase!=="playing"||this.player.hp<=0||this.invincible>0)return;
    this.player.hp=Math.max(0,this.player.hp-1);this.invincible=1.1;this.playSound("hit");
    this.effects.burst("hit",this.player.x,this.player.y,30);
    if(this.player.hp===0){this.setInput(0,0,false);this.moving=false;this.dodgeTime=0;}
  }
  moveGuestPath(path:{x:number;y:number}[],angle:number){
    const actor=this.actors[1],position={...actor.player};let moved=0;
    for(const target of path){
      const before={...position};this.move(position,target.x-position.x,target.y-position.y);
      if(distance(position,target)>.1)return false;
      moved+=distance(before,position);
    }
    Object.assign(actor.player,{x:position.x,y:position.y,angle});
    actor.moving=moved>.05;actor.walkDistance+=moved;
    return true;
  }
  private playerStep(dt:number){
    this.energyCooldown=Math.max(0,this.energyCooldown-dt);this.stepEnergyWave(dt);
    if(this.player.hp<=0){this.moving=false;return;}
    const before={...this.player};
    this.invincible=Math.max(0,this.invincible-dt);this.dodgeCooldown=Math.max(0,this.dodgeCooldown-dt);
    this.punchCooldown=Math.max(0,this.punchCooldown-dt);this.punchTime=Math.max(0,this.punchTime-dt);
    const remoteMovement=this.actionSlot===1&&this.guestOwnsMovement;
    if(this.dodgeTime>0){this.dodgeTime=Math.max(0,this.dodgeTime-dt);if(!remoteMovement)this.move(this.player,this.dodgeX*440*dt,this.dodgeY*440*dt);}
    else {
      if(Math.hypot(this.input.x,this.input.y)>.1)this.player.angle=Math.atan2(this.input.y,this.input.x);
      if(!remoteMovement)this.walk(this.input.x,this.input.y,dt);
      if(this.input.attack)this.punch();
    }
    const moved=distance(before,this.player);this.moving=remoteMovement?this.actors[1].moving:moved>.05;this.walkDistance+=moved;
    const room=this.levelData.rooms.findIndex(r=>this.player.x>=r.x&&this.player.x<=r.x+r.w&&this.player.y>=r.y&&this.player.y<=r.y+r.h);
    if(room>=0)this.room=room;
    if(this.dungeon)this.dungeon.visited[this.room]=true;
    const kit=this.levelData.medkits.findIndex((k,i)=>this.dungeon?.medkits[i]&&this.player.hp<3&&distance(this.player,k)<32);
    if(kit>=0&&this.dungeon){this.dungeon.medkits[kit]=false;this.player.hp++;this.playSound("heal");this.effects.burst("heal",this.player.x,this.player.y,38);}
    const pressed=!!this.controls[this.actionSlot]?.interact,actor=this.actors[this.actionSlot];
    const fallen=this.actors[this.actionSlot===0?1:0];
    const action=this.controls[this.actionSlot]?.action??0,newAction=action>actor.actionSerial||pressed&&!actor.interacting;
    actor.actionSerial=Math.max(actor.actionSerial,action);
    if(newAction&&!(fallen.player.hp===0&&distance(this.player,fallen.player)<70))this.interact();actor.interacting=pressed;
    if(this.controls[this.actionSlot]?.interact&&fallen.player.hp===0&&distance(this.player,fallen.player)<70&&this.lineClear(this.player,fallen.player)&&!this.moving){
      fallen.reviveProgress+=dt;
      if(fallen.reviveProgress>=2){fallen.player.hp=2;fallen.invincible=2;fallen.reviveProgress=0;this.playSound("revive");this.effects.burst("heal",fallen.player.x,fallen.player.y,38);}
    }else fallen.reviveProgress=0;
  }
  protected override step(dt:number){
    this.time+=dt;this.effects.step(dt);this.impactStop=0;
    for(const slot of [0,1] as const)this.forPlayer(slot,()=>this.playerStep(dt));
    const living=this.actors.filter(a=>a.player.hp>0);
    if(living.length)this.dungeon?.step(dt,this.time,living[0].player,living[0].room,this.enemies,living);
    for(const b of this.barrels)b.explosion=Math.max(0,b.explosion-dt);
    for(const c of this.coins)if(c.active){c.age+=dt;for(const actor of living){const d=distance(actor.player,c);if(actor.equipment.accessory==="charm"&&d>=42&&d<160&&this.lineClear(c,actor.player)){const pull=Math.min(d,250*dt)/d;c.x+=(actor.player.x-c.x)*pull;c.y+=(actor.player.y-c.y)*pull;}if(c.age>.22&&distance(actor.player,c)<42)this.collectCoin(c);}}
    // Advance shared drops once, toward the closest living teammate.
    if(living.length){const drop=this.chests.find(c=>c.drop.active)?.drop;const target=drop?living.reduce((a,b)=>distance(a.player,drop)<distance(b.player,drop)?a:b):living[0];this.forPlayer(this.actors.indexOf(target) as CoopSlot,()=>this.stepChestDrops(dt));}
    for(const enemy of this.enemies){
      const targets=this.actors.map((a,i)=>({a,slot:i as CoopSlot})).filter(t=>t.a.player.hp>0&&t.a.room===enemy.room).sort((a,b)=>distance(enemy,a.a.player)-distance(enemy,b.a.player));
      if(!targets.length){enemy.moving=false;enemy.flash=Math.max(0,enemy.flash-dt);continue;}
      const target=targets[0];
      this.navigation.beginStep(this.levelData.rooms[enemy.room],`coop:${enemy.room}:${this.dungeon?.geometryRevision??0}`);
      this.navigationCrowd=this.enemies.filter(e=>e.room===enemy.room&&e.hp>0&&e.awake!==false);
      this.forPlayer(target.slot,()=>this.enemyStep(enemy,dt));
    }
    for(const b of this.bullets){
      if(!b.active)continue;
      b.life-=dt;const n=Math.max(1,Math.ceil(Math.hypot(b.vx,b.vy)*dt/3));
      for(let i=0;i<n&&b.active;i++){
        b.x+=b.vx*dt/n;b.y+=b.vy*dt/n;
        const barrel=this.barrels.find(a=>a.active&&distance(a,b)<15);
        if(barrel){b.active=false;this.explodeBarrel(barrel);}
        else if(b.life<=0||!this.canStand(b.x,b.y,2)){
          b.active=false;
          if(b.kind==="grenade")this.explodeAt(b.x,b.y,b.splash??95,b.damage??3);
          else if(b.owner==="player"){const cover=this.levelData.solids.findIndex((s,j)=>!this.dungeon?.destroyed[j]&&b.x>s.x-3&&b.x<s.x+s.w+3&&b.y>s.y-3&&b.y<s.y+s.h+3);if(cover>=0)this.dungeon?.hitCover(cover,b.damage??1,this.time);}
        }else if(b.owner==="player"){
          const e=this.enemies.find(e=>e.hp>0&&e.awake!==false&&!b.hitIds?.includes(e.id)&&distance(e,b)<(e.boss?23:15));
          if(e){b.hitIds??=[];b.hitIds.push(e.id);b.active=b.kind==="piercing"&&b.hitIds.length<3;if(b.kind==="grenade")this.explodeAt(b.x,b.y,b.splash??116,b.damage??4);else {this.hitEnemy(e,b.damage??1,Math.atan2(b.vy,b.vx));if(b.kind==="bolt"&&e.hp>0){e.mode="recover";e.timer=.9;}}}
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
    this.restoreActor(this.actors[0]);
  }
  protected override explodeAt(x:number,y:number,r:number,damage:number){
    this.effects.burst("blast",x,y,r);this.playSound("blast");this.dungeon?.damageCovers(x,y,r,damage,this.time);
    for(const e of this.enemies)if(e.hp>0&&e.awake!==false&&distance(e,{x,y})<r)this.hitEnemy(e,damage,Math.atan2(e.y-y,e.x-x),true);
    for(const slot of [0,1] as const)if(distance(this.actors[slot].player,{x,y})<r*.75)this.forPlayer(slot,()=>this.hurt());
    for(const b of this.barrels)if(b.active&&distance(b,{x,y})<r)this.explodeBarrel(b);
  }
  private walk(x:number,y:number,dt:number){
    const current=this.levelData.currents.find(r=>this.player.x>=r.x&&this.player.x<=r.x+r.w&&this.player.y>=r.y&&this.player.y<=r.y+r.h&&(r.disabledBy===undefined||!this.dungeon?.tasks[r.disabledBy].done));
    this.move(this.player,x*154*dt*(current?.72:1),y*154*dt*(current?.72:1));
    if(current)this.move(this.player,current.dx*30*dt,current.dy*30*dt);
  }
  predict(slot:CoopSlot,controls:CoopControls,dt:number){
    if(this.phase!=="playing"||this.actors[slot].player.hp<=0)return;
    this.forPlayer(slot,()=>{
      const before={...this.player},elapsed=Math.min(.05,dt),n=Math.max(1,Math.hypot(controls.x,controls.y));
      this.setInput(controls.x/n,controls.y/n,controls.attack);this.selectWeapon(controls.weapon);
      if(controls.dodge>this.predictedDodge){this.predictedDodge=controls.dodge;this.dodge();}
      if(this.dodgeTime>0){this.move(this.player,this.dodgeX*440*elapsed,this.dodgeY*440*elapsed);this.dodgeTime=Math.max(0,this.dodgeTime-elapsed);}
      else{if(n>.1&&(controls.x||controls.y))this.player.angle=Math.atan2(controls.y,controls.x);this.walk(controls.x/n,controls.y/n,elapsed);}
      this.dodgeCooldown=Math.max(0,this.dodgeCooldown-elapsed);this.punchCooldown=Math.max(0,this.punchCooldown-elapsed);this.punchTime=Math.max(0,this.punchTime-elapsed);this.invincible=Math.max(0,this.invincible-elapsed);
      this.moving=distance(before,this.player)>.05;this.walkDistance+=distance(before,this.player);
      const room=this.levelData.rooms.findIndex(r=>this.player.x>=r.x&&this.player.x<=r.x+r.w&&this.player.y>=r.y&&this.player.y<=r.y+r.h);if(room>=0)this.room=room;
    });
  }
  snapshot():CoopSnapshot {
    const d=this.dungeon!;
    return structuredClone({v:COOP_PROTOCOL,mode:this.setup.mode,level_id:this.setup.level_id,runtime:{tasks:d.tasks,mines:d.mines,lastTrapHit:d.lastTrapHit,medkits:d.medkits,geometryRevision:d.geometryRevision,notice:d.notice,noticeUntil:d.noticeUntil},barrels:this.barrels,chests:this.chests,coins:this.coins,collectedCoins:this.collectedCoins,seed:this.seed,round:this.round,seq:++this.sequence,time:this.time,phase:this.phase as CoopSnapshot["phase"],actors:this.actors,enemies:this.enemies,bullets:this.bullets,cleared:this.cleared,visited:this.dungeon?.visited??this.cleared.map(()=>false),destroyed:this.dungeon?.destroyed??[],coverHp:(this.dungeon?.coverHp??[]).map(n=>Number.isFinite(n)?n:null),effects:this.effects.pool,links:this.effects.links});
  }
  applySnapshot(s:CoopSnapshot){
    if(s.seed!==this.seed||s.round!==this.round||s.mode!==this.setup.mode||s.level_id!==this.setup.level_id)return;
    this.sequence=Math.max(this.sequence,s.seq);this.time=s.time;this.phase=s.phase;this.actors=structuredClone(s.actors);this.enemies=structuredClone(s.enemies);this.bullets=structuredClone(s.bullets);this.cleared=[...s.cleared];
    this.barrels=structuredClone(s.barrels);this.chests=structuredClone(s.chests);this.coins=structuredClone(s.coins);this.collectedCoins=s.collectedCoins;
    if(this.dungeon){Object.assign(this.dungeon,structuredClone(s.runtime));this.dungeon.visited=[...s.visited];this.dungeon.destroyed=[...s.destroyed];this.dungeon.coverHp=s.coverHp.map(n=>n??Infinity);}
    this.effects.pool=structuredClone(s.effects);this.effects.links=structuredClone(s.links);
    this.restoreActor(this.actors[0]);
  }
  companion(slot:CoopSlot){return {...this.actors[slot],slot,area:"sewer" as const,checkpoint:3,tutorialOpened:true};}
}

/** Reject malformed / incompatible worlds before they reach SVG or collision code. */
export function readCoopSnapshot(value:unknown,engine:CoopEngine):CoopSnapshot|null {
  if(!value||typeof value!=="object")return null;
  const s=value as CoopSnapshot;
  if(s.v!==COOP_PROTOCOL||s.seed!==engine.seed||s.round!==engine.round||s.mode!==engine.setup.mode||s.level_id!==engine.setup.level_id||!Number.isSafeInteger(s.seq)||s.seq<1||!Number.isFinite(s.time)||s.time<0||!["playing","paused","dead","won"].includes(s.phase)||!Array.isArray(s.actors)||s.actors.length!==2||!Array.isArray(s.enemies)||s.enemies.length!==engine.levelData.enemies.length||!Array.isArray(s.bullets)||s.bullets.length!==64||!Array.isArray(s.cleared)||s.cleared.length!==engine.levelData.rooms.length||!Array.isArray(s.visited)||s.visited.length!==engine.levelData.rooms.length||!Array.isArray(s.destroyed)||s.destroyed.length!==engine.levelData.solids.length||!Array.isArray(s.coverHp)||s.coverHp.length!==s.destroyed.length||!Array.isArray(s.effects)||s.effects.length!==36||!Array.isArray(s.links)||s.links.length!==12)return null;
  for(const a of s.actors)if(!a||!a.player||!a.input||![a.player.x,a.player.y,a.player.angle,a.player.hp,a.room,a.punchSerial,a.invincible,a.dodgeTime,a.dodgeCooldown,a.dodgeX,a.dodgeY,a.punchTime,a.punchCooldown,a.punchCooldownDuration,a.walkDistance,a.reviveProgress,a.input.x,a.input.y].every(Number.isFinite)||a.player.hp<0||a.player.hp>3||Math.abs(a.player.x)>20000||Math.abs(a.player.y)>20000||typeof a.input.attack!=="boolean"||typeof a.moving!=="boolean"||!Number.isInteger(a.room)||a.room<0||a.room>=engine.levelData.rooms.length||!WEAPON_ORDER.includes(a.weapon)||!readCoopEquipment(a.equipment)||typeof a.interacting!=="boolean"||!Number.isSafeInteger(a.actionSerial)||a.actionSerial<0||!Number.isSafeInteger(a.energySerial)||a.energySerial<0||!Number.isFinite(a.energyCooldown)||!a.energyWave||![a.energyWave.x,a.energyWave.y,a.energyWave.age,a.energyWave.room,a.energyWave.damage].every(Number.isFinite)||typeof a.energyWave.active!=="boolean"||!Array.isArray(a.energyHits)||!a.energyHits.every(Number.isSafeInteger))return null;
  for(const e of s.enemies)if(!e||![e.x,e.y,e.angle,e.hp,e.maxHp,e.timer,e.attackAngle,e.flash,e.walkDistance,e.windupDuration,e.recoveryDuration].every(Number.isFinite)||!["chase","windup","recover","charge"].includes(e.mode)||typeof e.moving!=="boolean"||typeof e.attackRecovery!=="boolean"||!Number.isInteger(e.room)||e.room<0||e.room>=engine.levelData.rooms.length)return null;
  for(const b of s.bullets)if(!b||![b.x,b.y,b.vx,b.vy,b.life].every(Number.isFinite)||typeof b.active!=="boolean"||(b.hitIds!==undefined&&(!Array.isArray(b.hitIds)||b.hitIds.length>3||!b.hitIds.every(id=>Number.isInteger(id)&&id>=0&&id<engine.enemies.length))))return null;
  for(const e of s.effects)if(!e||![e.x,e.y,e.age,e.seed,e.radius].every(Number.isFinite)||typeof e.active!=="boolean")return null;
  for(const l of s.links)if(!l||![l.x,l.y,l.tx,l.ty,l.age].every(Number.isFinite)||typeof l.active!=="boolean")return null;
  if(!s.cleared.every(v=>typeof v==="boolean")||!s.visited.every(v=>typeof v==="boolean")||!s.destroyed.every(v=>typeof v==="boolean")||!s.coverHp.every(v=>v===null||Number.isFinite(v)))return null;
  const d=s.runtime,expected=engine.dungeon!;
  if(!d||!Array.isArray(d.tasks)||d.tasks.length!==expected.tasks.length||!d.tasks.every(t=>t&&typeof t.done==="boolean"&&typeof t.active==="boolean"&&[t.progress,t.blastAt,t.wave].every(Number.isFinite))||!Array.isArray(d.mines)||d.mines.length!==expected.mines.length||!d.mines.every(m=>m&&Number.isFinite(m.armedAt)&&typeof m.spent==="boolean")||!Array.isArray(d.medkits)||d.medkits.length!==expected.medkits.length||!d.medkits.every(v=>typeof v==="boolean")||!Array.isArray(d.lastTrapHit)||d.lastTrapHit.length!==expected.lastTrapHit.length||!d.lastTrapHit.every(Number.isFinite)||!Number.isSafeInteger(d.geometryRevision)||typeof d.notice!=="string"||d.notice.length>200||!Number.isFinite(d.noticeUntil))return null;
  if(!Array.isArray(s.barrels)||s.barrels.length!==engine.barrels.length||!s.barrels.every(b=>b&&[b.x,b.y,b.room,b.explosion].every(Number.isFinite)&&typeof b.active==="boolean")||!Array.isArray(s.coins)||s.coins.length!==40||!s.coins.every(c=>c&&[c.x,c.y,c.age].every(Number.isFinite)&&typeof c.active==="boolean")||!Number.isFinite(s.collectedCoins)||!Array.isArray(s.chests)||s.chests.length!==engine.chests.length||!s.chests.every((c,i)=>c&&c.x===engine.chests[i].x&&c.y===engine.chests[i].y&&c.room===engine.chests[i].room&&JSON.stringify(c.loot)===JSON.stringify(engine.chests[i].loot)&&typeof c.opened==="boolean"&&Number.isFinite(c.openedAt)&&c.drop&&[c.drop.x,c.drop.y,c.drop.z,c.drop.age,c.drop.landX,c.drop.landY].every(Number.isFinite)&&[c.drop.active,c.drop.claimed,c.drop.homing].every(v=>typeof v==="boolean")))return null;
  // Whitelist actor fields before forPlayer assigns their context to the engine.
  const actors=s.actors.map(a=>({player:{x:a.player.x,y:a.player.y,angle:a.player.angle,hp:a.player.hp},room:a.room,weapon:a.weapon,moving:a.moving,walkDistance:a.walkDistance,punchSerial:a.punchSerial,invincible:a.invincible,dodgeTime:a.dodgeTime,dodgeCooldown:a.dodgeCooldown,dodgeX:a.dodgeX,dodgeY:a.dodgeY,punchTime:a.punchTime,punchCooldown:a.punchCooldown,punchCooldownDuration:a.punchCooldownDuration,input:{x:a.input.x,y:a.input.y,attack:a.input.attack},reviveProgress:a.reviveProgress,equipment:readCoopEquipment(a.equipment)!,interacting:a.interacting,actionSerial:a.actionSerial,energySerial:a.energySerial,energyCooldown:a.energyCooldown,energyWave:{active:a.energyWave.active,x:a.energyWave.x,y:a.energyWave.y,age:a.energyWave.age,room:a.energyWave.room,damage:a.energyWave.damage},energyHits:[...a.energyHits]})) as [CoopActor,CoopActor];
  return {...s,actors,runtime:{tasks:d.tasks.map(t=>({done:t.done,active:t.active,progress:t.progress,blastAt:t.blastAt,wave:t.wave})),mines:d.mines.map(m=>({armedAt:m.armedAt,spent:m.spent})),lastTrapHit:[...d.lastTrapHit],medkits:[...d.medkits],geometryRevision:d.geometryRevision,notice:d.notice,noticeUntil:d.noticeUntil}};
}
