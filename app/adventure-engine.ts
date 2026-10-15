import { generateEndlessDungeon,type EndlessLevel } from "./endless-dungeon.ts";
import { defaultEndlessProgress,sanitizeEndlessProgress,type EndlessProgress,type EndlessPerk } from "./endless-progress.ts";
import { EMPTY_EQUIPMENT, type KnopikEquipment } from "./knopik-equipment-state.ts";
import { clothingAttackMultiplier, clothingHealHearts, clothingRollCooldown, ENERGY_WAVE } from "./knopik-combat-equipment.ts";
import { KNOPIK_ROLL_DURATION } from "./knopik-roll.ts";
import { isFirearm, FIREARMS, firearmMuzzle, firearmShotAim } from "./dungeon-aim.ts";
import { OPENING_DURATION, OPENING_CUES } from "./adventure-opening.ts";
/** The first chapter uses the same fixed 60 Hz simulation on every display. */
import { adventureLevel, dungeonZone, sanitizeCompletedLevel, sanitizeWeaponTier, ADVENTURE_WEAPONS, type AdventureWeapon, type DungeonSpawn } from "./adventure-levels.ts";
import { DungeonRuntime, DungeonEffects } from "./dungeon-runtime.ts";
import { APARTMENT_DESTINATIONS, type ApartmentDestination } from "./apartment-interactions.ts";
import { HOME_FLOORS,HOME_SOLIDS,HOME_SPAWN,HOME_ENTRY,homeRoomAt } from "./apartment-world.ts";
import { createHomeDoors, stepHomeDoors, homeDoorBlocks } from "./home-doors.ts";
import { SahurNavigation } from "./sahur-navigation.ts";
import { adventureChestPositions, rollAdventureLoot, type AdventureLoot, type AdventureLootBuff } from "./adventure-loot.ts";
import {dungeonIngredientPositions,type DungeonIngredient} from "./dungeon-ingredients.ts";
import {LAB_MATERIALS} from "./laboratory-engine.ts";
export type AdventureArea = "apartment" | "basement" | "sewer";
export type AdventurePhase = "title" | "opening" | "dialogue" | "playing" | "paused" | "dead" | "won" | "levels";
export type AdventureSound = "knock" | "punch" | "hit" | "dodge" | "shot" | "defeat" | "door" | "win" | "coin" | "heal" | "revive" | "blast" | "arc" | "shotgun";
export type Rect = { x: number; y: number; w: number; h: number };
export type AdventureActor = { x: number; y: number; angle: number; hp: number };
export type AdventureEnemy = AdventureActor & { id: number; kind: "bat" | "gun"; room: number; mode: "chase" | "windup" | "recover" | "charge"; timer: number; flash: number; attackAngle: number; boss?: boolean; maxHp: number; moving: boolean; walkDistance: number; windupDuration: number; recoveryDuration: number; attackRecovery: boolean; role?:DungeonSpawn["role"];awake?:boolean;wave?:number;trigger?:number;reinforced?:boolean;attackCount?:number };
export type AdventureBullet = { x: number; y: number; vx: number; vy: number; life: number; active: boolean; owner?: "player" | "enemy";kind?:"round"|"pellet"|"grenade";damage?:number;maxLife?:number;splash?:number };
export type AdventureCoin = { x: number; y: number; age: number; active: boolean };
export type AdventureChest = { x: number; y: number; room: number; opened: boolean; openedAt: number; loot: AdventureLoot; drop: {active:boolean;claimed:boolean;x:number;y:number;z:number;age:number;landX:number;landY:number;homing:boolean} };
export type AdventureInput = { x: number; y: number; attack: boolean };
export type AdventureView = { endlessFloor:number;endlessSeed:number;endlessBest:number;endlessResume:number;endlessAnomaly:string;endlessDescription:string;endlessBoss:boolean;endlessReward:number; area: AdventureArea; homeRoom: string; phase: AdventurePhase; cinematic: boolean; hp: number; checkpoint: number; room: number; defeated: number; total: number; coins: number; surgeSeconds:number; lostCoins: number; objective: string; interaction: string; dialogue: string; speaker: string; dodged: boolean; dodgeReady: boolean; canHeal: boolean; shieldReady: boolean; revived: boolean; level: number; completedLevel: number; roomCount: number; weapon: AdventureWeapon; weaponTier: number; weaponReady: boolean; energyReady: boolean; canFinish: boolean; zone:number;stage:number;tasksDone:number;tasksTotal:number;notice:string;roomName:string;visited:boolean[];goal:{x:number;y:number}|null };
export type AdventureEvents = { endlessProgress?: (progress:EndlessProgress)=>void; homePanel?: (room: "wardrobe"|"vault"|"laboratory") => void; laboratoryChest?: (level:number,room:number)=>void;laboratoryIngredient?: (level:number,room:number,material:DungeonIngredient["material"])=>boolean; change: (view: AdventureView) => void; checkpoint: (value: number) => void; sound: (kind: AdventureSound) => void; run: () => void; bar: () => void; collect?: (amount: number) => void; lootBuff?: (kind: AdventureLootBuff) => boolean; aura?: (amount:1)=>void; consumeHeal?: () => boolean; activateShield?: () => boolean; shieldUsed?: () => void; death?: () => number; buySupply?: (kind: "heal" | "pepsi") => boolean; consumeSurge?:()=>boolean; levelComplete?: (level: number) => void; unlockWeapon?: (tier: number) => void };
export const ADVENTURE_STEP = 1 / 60;
export const APARTMENT_SOLIDS: Rect[] = [
  { x: 50, y: 338, w: 146, h: 68 }, { x: 248, y: 350, w: 88, h: 54 },
  { x: 40, y: 196, w: 90, h: 48 }, { x: 340, y: 196, w: 100, h: 45 },
  { x: 340, y: 442, w: 94, h: 92 }, { x: 46, y: 470, w: 42, h: 46 },
];
export const BASEMENT_SOLIDS: Rect[] = [{ x: 52, y: 185, w: 72, h: 72 }, { x: 325, y: 265, w: 86, h: 66 }];
export const SEWER_ROOMS: Rect[] = adventureLevel(1).rooms;
export const SEWER_SOLIDS: Rect[] = adventureLevel(1).solids;
const length = (x: number, y: number) => Math.hypot(x, y);
const distance = (a: { x: number; y: number }, b: { x: number; y: number }) => length(a.x - b.x, a.y - b.y);
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
const inside = (x: number, y: number, r: Rect) => x >= r.x-1e-7 && x <= r.x + r.w+1e-7 && y >= r.y-1e-7 && y <= r.y + r.h+1e-7;
const overlap = (x: number, y: number, radius: number, r: Rect) => length(x - clamp(x, r.x, r.x + r.w), y - clamp(y, r.y, r.y + r.h)) < radius-1e-7;
export function sanitizeStoryCheckpoint(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? clamp(Math.floor(value), 0, 3) : 0;
}

export class AdventureEngine {
  area: AdventureArea = "apartment";
  phase: AdventurePhase = "title";
  player: AdventureActor = { x: 123, y: 378, angle: Math.PI / 2, hp: 3 };
  enemies: AdventureEnemy[] = [];
  bullets: AdventureBullet[] = Array.from({ length: 64 }, () => ({ x: 0, y: 0, vx: 0, vy: 0, life: 0, active: false }));
  coins: AdventureCoin[] = Array.from({ length: 40 }, () => ({ x: 0, y: 0, age: 0, active: false }));
  collectedCoins = 0;
  private lostCoins = 0;
  openingTime = 0;
  private openingCue = 0;
  chests: AdventureChest[] = [];
  ingredientPickups:(DungeonIngredient&{collected:boolean})[]=[];
  private claimedIngredients=new Set<string>();
  private random: () => number;
  private firstHomecomingPending = false;
  private immortal = false;
  checkpoint: number;
  level = 1;
  completedLevel = 0;
  weaponTier = 0;
  weapon: AdventureWeapon = "fist";
  barrels: { x: number; y: number; room: number; active: boolean; explosion: number }[] = [];
  dungeon: DungeonRuntime | null = null;
  effects = new DungeonEffects();
  impactStop=0;
  readonly navigation=new SahurNavigation((x,y)=>this.canStand(x,y,13));
  private navigationCrowd:AdventureEnemy[]=[];
  private navigationVersion=0;
  private endlessData:EndlessLevel|null=null;
  endlessProgress:EndlessProgress=defaultEndlessProgress();
  get levelData() { return this.endlessData ?? adventureLevel(this.level); }
  get endlessFloor() {return this.endlessData?.abyss.floor??0;}
  get endlessPerk() {return this.endlessData?this.endlessProgress.expedition?.perk??"none":"none";}
  private saveEndless(progress:EndlessProgress){this.endlessProgress=progress;this.events.endlessProgress?.(progress);}
  private loadEndlessFloor(){
    const expedition=this.endlessProgress.expedition;
    if(!expedition)return false;
    const previousWeapon=this.weapon;
    this.endlessData=generateEndlessDungeon(expedition.seed,expedition.floor);
    this.level=this.endlessData.id;
    this.loadArea("sewer");
    this.player.hp=expedition.hp;this.invincible=.75;
    if(previousWeapon!=="fist"&&ADVENTURE_WEAPONS[previousWeapon].tier<=this.weaponTier)this.weapon=previousWeapon;
    this.dungeon?.announce(`${this.endlessData.abyss.anomaly.name} · ${this.endlessData.abyss.boss?"БОСС":"глубина "+expedition.floor}`,this.time);
    this.notify();return true;
  }
  startEndless(fresh=false){
    if(this.completedLevel!==25||!(["levels","playing"].includes(this.phase))||this.area!=="apartment"&&!(this.area==="sewer"&&this.phase==="levels"))return false;
    if(fresh||!this.endlessProgress.expedition){
      const seed=Math.max(1,Math.floor(this.random()*0xffffffff));
      this.saveEndless({...this.endlessProgress,runs:this.endlessProgress.runs+1,expedition:{seed,floor:1,hp:3,perk:"none"}});
    }
    return this.loadEndlessFloor();
  }
  continueEndless(choice:"rest"|Exclude<EndlessPerk,"none">){
    if(this.phase!=="won"||!this.endlessData||!this.endlessProgress.expedition||!["rest","power","flow"].includes(choice))return false;
    const run=this.endlessProgress.expedition;
    this.saveEndless({...this.endlessProgress,expedition:{...run,hp:choice==="rest"?Math.min(3,run.hp+1):run.hp,perk:choice==="rest"?"none":choice}});
    return this.loadEndlessFloor();
  }
  get expandedHome() {return this.checkpoint>=2;}
  get homeRoom() {return homeRoomAt(this.player.x,this.player.y);}
  homeDoors = createHomeDoors();
  private homeExitGrace = 0;
  private leavingHome = false;
  enterHomeFromStreet(){
    if(!this.expandedHome)return;
    if(this.area!=="apartment")this.loadArea("apartment");
    Object.assign(this.player,HOME_ENTRY,{angle:-Math.PI/2});this.setInput(0,0,false);
    Object.assign(this.homeDoors[5],{angle:-1.43,sign:-1,hold:1});
    this.homeExitGrace=.85;this.leavingHome=false;this.notify();
  }
  room = 0;
  cleared = [false, false, false];
  time = 0;
  moving = false;
  walkDistance = 0;
  punchSerial = 0;
  invincible = 0;
  shieldReady = false;
  reviveTime = 0;
  equipment:KnopikEquipment=EMPTY_EQUIPMENT;
  setEquipment(value:KnopikEquipment){this.equipment=value;this.notify();}
  surgeTime = 0;
  energyCooldown = 0;
  energyWave = { active: false, x: 0, y: 0, age: 0, room: 0, damage: 4 };
  private energyHits = new Set<number>();
  dodgeTime = 0;
  dodgeCooldown = 0;
  punchTime = 0;
  punchCooldown = 0;
  punchCooldownDuration = 0;
  practiceStep = -1;
  setPracticeStep(step:number){
    const next=this.area==="sewer"&&this.level===1&&this.completedLevel<1&&step>=0&&step<6?step:-1;
    if(this.practiceStep===next)return;
    const wasPracticing=this.practiceStep>=0;this.practiceStep=next;this.setInput(0,0,false);
    if(next===2)this.dodged=false;
    if(next===3)this.player.hp=2;
    if(wasPracticing&&next<0)this.player.hp=3;
    this.notify();
  }
  dodged = false;
  tutorialOpened = false;
  private dodgeX = 0;
  private dodgeY = 0;
  private accumulator = 0;
  private lastView = "";
  private pausedPhase: AdventurePhase = "playing";
  private dialogueIndex = 0;
  private dialogues: string[] = [];
  private afterDialogue: (() => void) | null = null;
  private nextKnock = 0;
  private input: AdventureInput = { x: 0, y: 0, attack: false };
  private events: AdventureEvents;
  constructor(checkpoint: number, events: AdventureEvents, options: { endlessProgress?:EndlessProgress;shield?: boolean; completedLevel?: number; weaponTier?: number; immortal?: boolean; random?: () => number;claimedIngredients?:readonly string[] } = {}) {
    this.events = events;
    this.claimedIngredients=new Set(options.claimedIngredients??[]);
    this.random = options.random ?? Math.random;
    this.shieldReady = options.shield === true;
    this.immortal = options.immortal === true;
    this.checkpoint = sanitizeStoryCheckpoint(checkpoint);
    this.completedLevel = Math.max(this.checkpoint >= 3 ? 1 : 0, sanitizeCompletedLevel(options.completedLevel));
    this.weaponTier = sanitizeWeaponTier(options.weaponTier);
    this.endlessProgress=sanitizeEndlessProgress(options.endlessProgress,this.completedLevel===25);
    this.tutorialOpened = this.checkpoint > 0;
    this.dodged = this.checkpoint > 0;
    if (this.checkpoint === 1) this.loadArea("basement");
    if (this.checkpoint === 2) this.loadArea("sewer");
    this.phase = this.checkpoint === 0 ? "opening" : "playing";
    if (this.checkpoint === 3) Object.assign(this.player,HOME_SPAWN);
  }
  view(): AdventureView {
    return {
      endlessFloor:this.endlessFloor,endlessSeed:this.endlessData?.abyss.seed??0,endlessBest:this.endlessProgress.bestFloor,endlessResume:this.endlessProgress.expedition?.floor??0,endlessAnomaly:this.endlessData?.abyss.anomaly.name??"",endlessDescription:this.endlessData?.abyss.anomaly.description??"",endlessBoss:this.endlessData?.abyss.boss??false,endlessReward:this.endlessData?.abyss.reward??0,
      area: this.area, homeRoom:this.area==="apartment"&&this.expandedHome?this.homeRoom.id:"living", phase: this.phase, surgeSeconds: Math.ceil(Math.max(0,this.surgeTime-1e-8)), cinematic: this.phase === "opening" || this.phase === "paused" && this.pausedPhase === "opening", hp: this.player.hp, checkpoint: this.checkpoint,
      room: this.room, defeated: this.enemies.filter(e => e.hp <= 0&&e.awake!==false).length,
      total: this.enemies.filter(e=>e.awake!==false).length, objective: this.objective(),
      coins: this.collectedCoins, lostCoins: this.lostCoins,
      canFinish: this.canFinishLevel,
      interaction: this.interaction(), dialogue: this.dialogues[this.dialogueIndex] ?? "",
      speaker: this.area === "apartment" && !this.tutorialOpened ? "Кнопик" : "Под домом",
      dodged: this.dodged, dodgeReady: this.dodgeCooldown <= 0,
      canHeal: this.phase === "playing" && this.player.hp > 0 && this.player.hp < 3 && (this.area === "sewer" || this.enemies.some(e => e.hp > 0)),
      shieldReady: this.shieldReady, revived: this.reviveTime > 0,
      energyReady: this.energyCooldown <= 0,
      level: this.level, completedLevel: this.completedLevel, roomCount: this.levelData.rooms.length, weapon: this.weapon, weaponTier: this.area==="sewer"&&this.level<=2?0:this.weaponTier, weaponReady: this.punchCooldown <= 0,
      zone:this.levelData.zone,stage:this.levelData.stage,tasksDone:this.dungeon?.completed??0,tasksTotal:this.levelData.tasks.length,notice:this.dungeon&&this.time<this.dungeon.noticeUntil?this.dungeon.notice:"",roomName:this.levelData.roomNames[this.room],visited:[...(this.dungeon?.visited??[])],goal:this.area==="sewer"?this.dungeonGoal:null,
    };
  }
  private notify() { const v = this.view(), key = JSON.stringify(v); if (key !== this.lastView) { this.lastView = key; this.events.change(v); } }
  private save(value: number) { if (value > this.checkpoint) { this.checkpoint = value; this.events.checkpoint(value); } }
  begin() { if (this.phase === "title") { this.phase = this.checkpoint === 0 ? "opening" : "playing"; this.notify(); } }
  skipOpening() {
    if (this.phase !== "opening") return false;
    this.openingTime = OPENING_DURATION; this.tutorialOpened = true; this.dodged = true;
    this.save(1); this.save(2); this.loadArea("sewer"); this.setInput(0, 0, false); return true;
  }
  private openingStep(dt: number) {
    this.openingTime = Math.min(OPENING_DURATION, this.openingTime + dt);
    while (this.openingCue < OPENING_CUES.length && OPENING_CUES[this.openingCue].at <= this.openingTime) this.events.sound(OPENING_CUES[this.openingCue++].sound);
    if (this.openingTime + 1e-8 >= OPENING_DURATION) this.skipOpening();
  }
  private say(lines: string[], after?: () => void) {
    this.dialogues = lines; this.dialogueIndex = 0; this.afterDialogue = after ?? null;
    this.phase = "dialogue"; this.setInput(0, 0, false); this.notify();
  }
  nextDialogue() {
    if (this.phase !== "dialogue") return;
    if (++this.dialogueIndex >= this.dialogues.length) { this.phase = "playing"; const after = this.afterDialogue; this.afterDialogue = null; after?.(); }
    this.notify();
  }
  setInput(x: number, y: number, attack: boolean) {
    if (!Number.isFinite(x) || !Number.isFinite(y)) { x = 0; y = 0; }
    const n = Math.max(1, length(x, y)); this.input = { x: x / n, y: y / n, attack };
  }
  setImmortal(enabled: boolean) { this.immortal = enabled === true; }
  pause() {
    if (!["playing", "dialogue", "opening"].includes(this.phase)) return;
    this.pausedPhase = this.phase; this.phase = "paused"; this.setInput(0, 0, false); this.accumulator = 0; this.notify();
  }
  resume() { if (this.phase === "paused") { this.phase = this.pausedPhase; this.accumulator = 0; this.notify(); } }
  private spawn(id: number, kind: "bat" | "gun", room: number, x: number, y: number): AdventureEnemy {
    const hp = (kind === "gun" ? 2 : 3) + (this.area === "sewer" ? Math.floor((this.levelData.zone-1)/2) : 0);
    return { id, kind, room, x, y, angle: 0, hp, maxHp: hp, mode: "chase", timer: .3 + id * .13, flash: 0, attackAngle: 0, moving:false, walkDistance:0, windupDuration:.6, recoveryDuration:.78, attackRecovery:false };
  }
  private loadArea(area: AdventureArea, preserveChests = false) {
    if(area!=="sewer"){this.endlessData=null;this.level=Math.min(25,this.level);}
    this.area = area; this.phase = "playing"; this.room = 0; this.enemies = []; this.moving = false; this.walkDistance = 0; this.punchSerial = 0;
    this.player = { x: area==="sewer"?this.levelData.spawn.x:240, y: area === "sewer" ? this.levelData.spawn.y : area === "basement" ? 410 : 421, angle: -Math.PI / 2, hp: 3 };
    if(area==="apartment"&&this.expandedHome)Object.assign(this.player,HOME_SPAWN);
    this.homeDoors=createHomeDoors();this.homeExitGrace=0;this.leavingHome=false;
    this.navigation.reset();this.navigationVersion=0;
    this.cleared = this.levelData.rooms.map(() => false); this.invincible = this.dodgeTime = this.dodgeCooldown = this.punchCooldown = this.punchTime = this.accumulator = 0;
    for (const b of this.bullets) b.active = false;
    for (const coin of this.coins) coin.active = false;
    this.collectedCoins = 0; this.lostCoins = 0; this.reviveTime = 0; this.surgeTime=0;
    this.effects.reset();this.impactStop=0;this.dungeon=null;
    this.energyWave.active=false;this.energyHits.clear();this.punchCooldownDuration=0;this.practiceStep=-1;
    // A death keeps claimed rewards and unopened contents; restarting cannot reroll a chest.
    this.chests = area !== "sewer" ? [] : preserveChests ? this.chests : adventureChestPositions(this.levelData).map(c => ({ ...c, opened: false, openedAt: -1, loot: rollAdventureLoot(this.level, this.random()),drop:{active:false,claimed:false,x:c.x,y:c.y,z:0,age:0,landX:c.x,landY:c.y,homing:false} }));
    this.ingredientPickups=area==="sewer"?(preserveChests&&this.ingredientPickups.length?this.ingredientPickups:dungeonIngredientPositions(this.levelData).map(p=>({...p,collected:this.claimedIngredients.has(p.key)}))):[];
    this.barrels = area === "sewer" ? this.levelData.barrels.map(b => ({ ...b, active: true, explosion: 0 })) : [];
    if (area === "sewer") {
      const weapon=this.endlessData?"arc":this.level<=2?"fist":dungeonZone(this.level).weapon,tier=ADVENTURE_WEAPONS[weapon].tier;
      if(tier>this.weaponTier){this.weaponTier=tier;this.events.unlockWeapon?.(tier);}this.weapon=weapon;
      this.enemies = this.levelData.enemies.map((e,i) => {const hp=(e.boss?14+this.levelData.zone*4:(e.kind==="gun"?2:3)+Math.floor((this.levelData.zone-1)/2)+(e.role==="armored"?2:0))+(this.endlessData?Math.min(e.boss?28:8,Math.floor((this.endlessFloor-1)/(e.boss?2:6))):0);return { ...this.spawn(i,e.kind,e.room,e.x,e.y),...e,hp,maxHp:hp,awake:!e.wave };});
      this.dungeon=new DungeonRuntime(this.levelData,{wave:(task,wave)=>this.wakeWave(task,wave),blast:(x,y,r,damage)=>this.explodeAt(x,y,r,damage),effect:(kind,x,y,r)=>this.effects.burst(kind,x,y,r),sound:()=>this.events.sound("door"),damage:()=>this.hurt(),trapEnemies:(x,y,w,h)=>{for(const e of this.enemies)if(e.hp>0&&e.awake!==false&&inside(e.x,e.y,{x,y,w,h}))this.hitEnemy(e,2,0);},done:()=>this.levelGoalsDone});
      this.dungeon.visited[0]=true;
    }
    this.notify();
  }
  private interaction() {
    const p = this.player;
    if (this.area === "apartment") {
      if(this.expandedHome){const target=APARTMENT_DESTINATIONS.find(d=>d.room===this.homeRoom.id&&length(p.x-clamp(p.x,d.x,d.x+d.w),p.y-clamp(p.y,d.y,d.y+d.h))<100);return target?.label??"";}
      if (distance(p, { x: 371, y: 119 }) < 66 && !this.enemies.some(e => e.hp > 0)) return this.completedLevel >= 1 ? "Выбрать уровень" : this.tutorialOpened ? "Спуститься в подвал" : "Открыть дверь";
      const barDistance = length(p.x-clamp(p.x,40,136),p.y-clamp(p.y,147,244)), exitDistance = distance(p, { x: 109, y: 115 });
      if (barDistance < 55 && barDistance < exitDistance) return "Мини-бар · сны";
      if (exitDistance < 62) return "Выйти на улицу";
    }
    if (this.area === "basement") {
      if (distance(p, { x: 240, y: 114 }) < 70) return "Войти в пролом";
      if (distance(p, { x: 240, y: 424 }) < 50) return "Вернуться в квартиру";
    }
    if(this.area==="sewer"){
      if(this.canFinishLevel)return "Завершить уровень";
      const task=this.dungeon?.nearby(p.x,p.y)??-1;if(task>=0)return this.levelData.tasks[task].label;
      if(this.nearbyChest()>=0)return "Открыть сундук";
    }
    return "";
  }
  private nearbyChest() {
    return this.chests.findIndex(c => {
      const d = distance(this.player, c);
      // Stop the sight ray outside the chest's body; every side can be approached.
      return !c.opened && this.cleared[c.room] && d > 0 && d < 68 && this.lineClear(this.player, { x: c.x + (this.player.x-c.x)/d*42, y: c.y + (this.player.y-c.y)/d*30 });
    });
  }
  openChest() {
    if (this.phase !== "playing" || this.area !== "sewer") return false;
    const chest = this.chests[this.nearbyChest()];
    if (!chest) return false;
    chest.opened = true; chest.openedAt = this.time;
    const angle=Math.atan2(this.player.y-chest.y,this.player.x-chest.x);
    let landX=chest.x+Math.cos(angle)*43,landY=chest.y+Math.sin(angle)*43;
    if(!this.canStand(landX,landY,4))for(const turn of [Math.PI/2,-Math.PI/2,Math.PI]){const x=chest.x+Math.cos(angle+turn)*43,y=chest.y+Math.sin(angle+turn)*43;if(this.canStand(x,y,4)){landX=x;landY=y;break;}}
    Object.assign(chest.drop,{active:true,claimed:false,x:chest.x,y:chest.y,z:40,age:0,landX,landY,homing:false});
    this.events.sound("door");this.notify();return true;
  }
  private collectNearbyIngredients(){
    if(this.area!=="sewer"||this.phase!=="playing")return;
    for(const p of this.ingredientPickups){
      if(p.collected||distance(this.player,p)>=37)continue;
      if(!this.events.laboratoryIngredient?.(p.level,p.room,p.material))continue;
      p.collected=true;this.claimedIngredients.add(p.key);
      this.dungeon?.announce(`${LAB_MATERIALS[p.material].name} +1`,this.time);
      this.effects.burst("spark",p.x,p.y,24);this.events.sound("coin");this.notify();
    }
  }
  private collectChestDrop(chest:AdventureChest){
    const drop=chest.drop;if(!drop.active||drop.claimed)return;
    drop.claimed=true;drop.active=false;
    this.events.laboratoryChest?.(this.level,chest.room);
    const loot=chest.loot;
    if(loot.kind==="aura"){this.events.aura?.(1);this.events.sound("coin");}
    else if(loot.kind==="buff"&&this.events.lootBuff?.(loot.buff))this.events.sound("heal");
    else {const amount=loot.kind==="coins"?loot.amount:45+(this.level-1)*10;this.collectedCoins+=amount;this.events.collect?.(amount);this.events.sound("coin");}
    this.effects.burst(loot.kind==="buff"?"heal":"spark",this.player.x,this.player.y-32/.82,26);
  }
  private stepChestDrops(dt:number){
    for(const chest of this.chests){const d=chest.drop;if(!d.active)continue;d.age+=dt;
      if(d.age<.7){const p=Math.min(1,d.age/.7);d.x=chest.x+(d.landX-chest.x)*p;d.y=chest.y+(d.landY-chest.y)*p;d.z=40*(1-p)+26*p+Math.sin(p*Math.PI)*56;continue;}
      if(d.age<1.05){d.z=26+Math.sin(d.age*7)*3;continue;}
      const dx=this.player.x-d.x,dy=this.player.y-d.y,n=Math.hypot(dx,dy);
      if(n<310)d.homing=true;
      if(d.homing){const travel=Math.min(n,(150+Math.min(1.2,d.age-1.05)*520)*dt);if(n>0){d.x+=dx/n*travel;d.y+=dy/n*travel;}d.z+=Math.min(1,dt*7)*(38-d.z);if(n<14)this.collectChestDrop(chest);}
      else d.z=26+Math.sin(d.age*3.5)*3;
    }
  }
  get levelGoalsDone(){return this.area==="sewer"&&this.cleared[this.levelData.exit.room]&&!!this.dungeon?.allDone;}
  get dungeonGoal(){const index=this.dungeon?.goal()??-1;return index>=0?this.levelData.tasks[index]:this.levelData.exit;}
  gateOpen(index:number){const gate=this.levelData.gates[index];return !!gate&&(this.cleared[gate.from]||this.cleared[gate.to])&&(gate.objective===undefined||!!this.dungeon?.tasks.slice(0,gate.objective+1).every(t=>t.done));}
  wakeWave(task:number,wave:number){for(const e of this.enemies)if(e.trigger===task&&e.wave===wave&&e.awake===false){e.awake=true;e.timer=.55;e.mode="chase";this.cleared[e.room]=false;this.effects.burst("spark",e.x,e.y,30);}}
  get canFinishLevel() { return this.area === "sewer" && this.phase === "playing" && this.player.hp > 0 && this.levelGoalsDone&&distance(this.player,this.levelData.exit)<94; }
  finishLevel() {
    if (!this.canFinishLevel) return false;
    if(this.endlessData){
      const {abyss}=this.endlessData;
      this.collectRemainingCoins();
      this.collectedCoins+=abyss.reward;this.events.collect?.(abyss.reward);
      this.saveEndless({...this.endlessProgress,bestFloor:Math.max(this.endlessProgress.bestFloor,abyss.floor),floorsCleared:this.endlessProgress.floorsCleared+1,expedition:{seed:abyss.seed,floor:abyss.floor+1,hp:this.player.hp,perk:"none"}});
      this.phase="won";this.events.sound("win");this.setInput(0,0,false);this.notify();return true;
    }
    this.firstHomecomingPending = this.level === 1 && this.completedLevel < 1;
    this.collectRemainingCoins(); this.save(3);
    if (this.level > this.completedLevel) { this.completedLevel = this.level; this.events.levelComplete?.(this.level); }
    this.phase = this.firstHomecomingPending ? "won" : "levels";
    this.events.sound("win"); this.setInput(0, 0, false); this.notify(); return true;
  }
  interact() {
    if (this.phase !== "playing") return;
    this.performInteraction(this.interaction());
  }
  interactDestination(destination: ApartmentDestination) {
    if (this.phase !== "playing" || this.area !== "apartment" || this.enemies.some(e=>e.hp>0)) return false;
    if(this.expandedHome){
      const target=APARTMENT_DESTINATIONS.find(d=>d.id===destination&&d.room===this.homeRoom.id);if(!target)return false;
      this.setInput(0,0,false);
      if(destination==="basement"){if(this.completedLevel<1){this.level=1;this.loadArea("sewer");}else{this.phase="levels";this.notify();}}
      else if(destination==="street")this.events.run();
      else {this.pause();if(destination==="bar")this.events.bar();else this.events.homePanel?.(destination);}
      return true;
    }
    const action = destination === "bar" ? "Мини-бар · сны" : destination === "street" ? "Выйти на улицу" : destination === "basement" ? this.completedLevel >= 1 ? "Выбрать уровень" : this.tutorialOpened ? "Спуститься в подвал" : "Открыть дверь" : "";
    if (!action) return false;
    this.setInput(0,0,false); this.performInteraction(action); return true;
  }
  private performInteraction(action: string) {
    if(this.area==="apartment"&&this.expandedHome){const target=APARTMENT_DESTINATIONS.find(d=>d.label===action);if(target)this.interactDestination(target.id);return;}
    if(this.area==="sewer"&&this.dungeon){const index=this.dungeon.nearby(this.player.x,this.player.y);if(action==="Завершить уровень"){this.finishLevel();return;}if(index>=0){this.dungeon.activate(index,this.time);this.notify();return;}}
    if (action === "Открыть сундук") { this.openChest();
    } else if (action === "Открыть дверь") {
      this.tutorialOpened = true; this.events.sound("door");
      this.loadArea("basement");
    } else if (action === "Выбрать уровень") { this.phase = "levels"; this.setInput(0,0,false);
    } else if (action === "Спуститься в подвал") {
      this.collectRemainingCoins(); this.events.sound("door"); this.loadArea("basement");
    } else if (action === "Войти в пролом") {
      this.save(2); this.events.sound("door"); this.loadArea("sewer");
    } else if (action === "Вернуться в квартиру") this.loadArea("apartment");
    else if (action === "Выйти на улицу" || action === "Мини-бар · сны") {
      if (this.checkpoint < 3) this.say(["Сначала нужно разобраться с Сахурами под домом. После первого уровня откроются магазин, сны и прогулки по району."]);
      else { this.setInput(0, 0, false); if (action === "Выйти на улицу") this.events.run(); else this.events.bar(); }
    }
    this.notify();
  }
  dodge() {
    if (this.phase !== "playing" || this.dodgeCooldown > 0) return;
    const n = length(this.input.x, this.input.y);
    this.dodgeX = n > .1 ? this.input.x / n : Math.cos(this.player.angle);
    this.dodgeY = n > .1 ? this.input.y / n : Math.sin(this.player.angle);
    this.player.angle=Math.atan2(this.dodgeY,this.dodgeX);
    this.dodgeTime = KNOPIK_ROLL_DURATION; this.dodgeCooldown = clothingRollCooldown(this.equipment)*(this.endlessPerk==="flow"?.75:1); this.invincible = Math.max(this.invincible, .28);this.effects.burst("dash",this.player.x,this.player.y,30);
    this.dodged = true; this.events.sound("dodge"); this.notify();
  }
  // Combat has no purchase path; supplies must be stocked before entering.
  buySupply(kind: "heal" | "pepsi") { void kind; return false; }
  activateSurge(){
    if(this.phase!=="playing"||this.player.hp<=0||this.surgeTime>0||this.area!=="sewer"&&!this.enemies.some(e=>e.hp>0)||!this.events.consumeSurge?.())return false;
    this.surgeTime=7;this.effects.burst("heal",this.player.x,this.player.y,46);this.events.sound("heal");this.notify();return true;
  }
  heal() {
    if (!this.view().canHeal || !this.events.consumeHeal?.()) return false;
    this.player.hp=Math.min(3,this.player.hp+clothingHealHearts(this.equipment)); this.effects.burst("heal", this.player.x, this.player.y, 38); this.events.sound("heal"); this.notify(); return true;
  }
  activateEnergyWave() {
    if(this.phase!=="playing"||this.player.hp<=0||this.equipment.accessory!=="cape"||this.energyCooldown>0||this.dodgeTime>0||this.area!=="sewer"&&!this.enemies.some(e=>e.hp>0&&e.awake!==false))return false;
    this.energyCooldown=ENERGY_WAVE.cooldown;
    Object.assign(this.energyWave,{active:true,x:this.player.x,y:this.player.y,age:0,room:this.room,damage:ENERGY_WAVE.damage*(this.surgeTime>0?2:1)});
    this.energyHits.clear();this.events.sound("arc");this.notify();return true;
  }
  private stepEnergyWave(dt:number) {
    const wave=this.energyWave;if(!wave.active)return;
    wave.age=Math.min(ENERGY_WAVE.duration,wave.age+dt);
    const radius=ENERGY_WAVE.radius*Math.min(1,wave.age/(ENERGY_WAVE.duration*.8));
    // Cover and closed doors stop the wave. Sleeping waves and other rooms are untouched.
    for(const enemy of this.enemies)if(enemy.hp>0&&enemy.awake!==false&&enemy.room===wave.room&&!this.energyHits.has(enemy.id)&&distance(wave,enemy)<=radius&&this.lineClear(wave,enemy)){
      this.energyHits.add(enemy.id);this.hitEnemy(enemy,wave.damage,Math.atan2(enemy.y-wave.y,enemy.x-wave.x),true);
    }
    for(const bullet of this.bullets)if(bullet.active&&bullet.owner!=="player"&&distance(wave,bullet)<=radius&&this.lineClear(wave,bullet)){
      bullet.active=false;this.effects.burst("spark",bullet.x,bullet.y,14);
    }
    if(wave.age>=ENERGY_WAVE.duration)wave.active=false;
  }
  activateShield() {
    if (this.phase !== "playing" || this.player.hp <= 0 || this.shieldReady || !this.events.activateShield?.()) return false;
    this.shieldReady = true; this.notify(); return true;
  }
  closeLevels() {
    if (this.phase !== "levels") return;
    this.setInput(0,0,false);
    if (this.area === "sewer") this.loadArea("apartment");
    else { this.phase = "playing"; this.notify(); }
  }
  selectLevel(id: number) {
    if (!Number.isInteger(id) || id < 1 || id > 25 || id !== this.completedLevel+1 || !["levels","playing"].includes(this.phase) || this.completedLevel < 1 || this.area !== "apartment" && !(this.area === "sewer" && this.phase === "levels")) return false;
    this.endlessData=null;this.level = id;
    this.loadArea("sewer"); return true;
  }
  selectWeapon(weapon: AdventureWeapon) {
    if (this.phase !== "playing" || this.area !== "sewer" || !(weapon in ADVENTURE_WEAPONS) || (this.level<=2&&weapon!=="fist")||ADVENTURE_WEAPONS[weapon].tier>this.weaponTier) return false;
    this.weapon = weapon; this.notify(); return true;
  }
  jetPhase(index: number) { const jet=this.levelData.jets[index];if(!jet)return "off";const i=this.levelData.hazards.findIndex(h=>h.kind==="steam"&&h.x===jet.x&&h.y===jet.y);return this.dungeon?.hazardPhase(i,this.time)??"off"; }
  restart() {
    if (this.phase !== "dead") return;
    if (this.area === "sewer") this.loadArea("sewer", true);
    else { this.loadArea("apartment"); this.tutorialOpened = true; this.dodged = false; this.enemies = [this.spawn(0, "bat", 0, 371, 155)]; this.notify(); }
  }
  exitToApartment() {
    if (this.phase !== "paused") return;
    if (this.area === "apartment") { this.resume(); return; }
    this.collectRemainingCoins(); this.setInput(0,0,false);
    this.dialogues = []; this.afterDialogue = null; this.loadArea("apartment");
  }
  returnHome() {
    if (this.phase === "levels") { this.closeLevels(); return; }
    if (this.phase !== "won") return;
    this.firstHomecomingPending = false;
    this.setInput(0,0,false); this.loadArea("apartment");
  }
  private objective() {
    if (this.area === "apartment") {
      if (this.enemies.some(e => e.hp > 0)) return this.dodged ? "Зажми «Удар» рядом с Сахуром" : "Джойстик в сторону + «Кувырок»";
      return this.expandedHome ? this.homeRoom.hint : this.tutorialOpened ? "↑ Спустись в подвал" : "↑ Подойди к двери подвала";
    }
    if (this.area === "basement") return "↑ Найди пролом в северной стене";
    return this.canFinishLevel ? "Подъёмник готов · нажми «Завершить»" : this.levelGoalsDone?"Найди подъёмник · можно собрать оставшуюся добычу":this.dungeon?.objective()??"Исследуй тоннели";
  }
  canStand(x: number, y: number, radius = 13) {
    if(!Number.isFinite(x)||!Number.isFinite(y)||!Number.isFinite(radius)||radius<0)return false;
    if(this.area==="apartment"&&this.expandedHome&&homeDoorBlocks(this.homeDoors,x,y,radius))return false;
    const floors = this.area === "sewer" ? this.levelData.floors : this.area==="apartment"&&this.expandedHome?HOME_FLOORS:[this.area === "apartment" ? { x: 28, y: 108, w: 424, h: 440 } : { x: 36, y: 102, w: 408, h: 352 }];
    for (let a = 0; a < 8; a++) if (!floors.some(r => inside(x + Math.cos(a * Math.PI / 4) * radius, y + Math.sin(a * Math.PI / 4) * radius, r))) return false;
    const solids = this.area === "apartment" ? this.expandedHome?HOME_SOLIDS:APARTMENT_SOLIDS : this.area === "basement" ? BASEMENT_SOLIDS : this.levelData.solids;
    if (solids.some((r,i) => !(this.area==="sewer"&&this.dungeon?.destroyed[i])&&overlap(x, y, radius, r))) return false;
    if (this.area === "sewer") {
      for (let i = 0; i < this.levelData.gates.length; i++) if (!this.gateOpen(i) && overlap(x,y,radius,this.levelData.gates[i])) return false;
      if (this.barrels.some(b => b.active && length(b.x-x,b.y-y)<radius+12)) return false;
      if (this.chests.some(c => overlap(x,y,radius,{x:c.x-24,y:c.y-14,w:48,h:28}))) return false;
      if(this.levelData.tasks.some((t,i)=>!((t.kind==="key"||t.kind==="charge")&&this.dungeon?.tasks[i].done)&&overlap(x,y,radius,{x:t.x-21,y:t.y-16,w:42,h:25})))return false;
      if(overlap(x,y,radius,{x:this.levelData.exit.x-45,y:this.levelData.exit.y-12,w:90,h:22}))return false;
    }
    return true;
  }
  private move(actor: AdventureActor, dx: number, dy: number, radius = 13) {
    // Small substeps stop both dashes and fast projectiles tunnelling through walls.
    const n = Math.max(1, Math.ceil(length(dx, dy) / 5));
    for (let i = 0; i < n; i++) { if (this.canStand(actor.x + dx / n, actor.y, radius)) actor.x += dx / n; if (this.canStand(actor.x, actor.y + dy / n, radius)) actor.y += dy / n; }
  }
  lineClear(a: { x: number; y: number }, b: { x: number; y: number }) {
    const n = Math.ceil(length(b.x - a.x, b.y - a.y) / 6);
    // Aim through the same clearance a projectile needs around cover corners.
    for (let i = 1; i < n; i++) if (!this.canStand(a.x + (b.x - a.x) * i / n, a.y + (b.y - a.y) * i / n, 3)) return false;
    return true;
  }
  private punch() {
    if (this.punchCooldown > 0 || this.dodgeTime > 0) return;
    const weapon = this.area === "sewer" ? this.weapon : "fist", stats = ADVENTURE_WEAPONS[weapon],ranged=weapon!=="fist"&&weapon!=="sabre";
    const targets = this.enemies.filter(e => e.hp > 0 && e.awake!==false && e.room === this.room && distance(e, this.player) < stats.range+(!ranged?24:0) && this.lineClear(this.player, e)).sort((a, b) => distance(a, this.player) - distance(b, this.player));
    if (targets[0] && !ranged) this.player.angle = Math.atan2(targets[0].y - this.player.y, targets[0].x - this.player.x);
    this.punchSerial++; this.punchTime = weapon === "sabre" ? .32 : weapon === "fist" ? .24 : .2; this.punchCooldown = this.punchCooldownDuration = stats.cooldown*clothingAttackMultiplier(this.equipment,weapon)*(this.endlessPerk==="power"?.85:1)*(this.surgeTime>0?.65:1); this.events.sound(weapon==="arc"?"arc":weapon==="shotgun"?"shotgun":ranged?"shot":"punch");
    if(ranged){
      const x=this.player.x+Math.cos(this.player.angle)*23,y=this.player.y+Math.sin(this.player.angle)*23;
      if(weapon==="arc"){
        let origin:{x:number;y:number}=this.player;const hit=new Set<number>();
        for(let n=0;n<4;n++){const target=this.enemies.filter(e=>e.hp>0&&e.awake!==false&&e.room===this.room&&!hit.has(e.id)&&distance(origin,e)<(n?160:stats.range)&&this.lineClear(origin,e)).sort((a,b)=>distance(origin,a)-distance(origin,b))[0];if(!target)break;hit.add(target.id);this.effects.arc(origin.x,origin.y,target.x,target.y);this.hitEnemy(target,stats.damage*(this.surgeTime>0?2:1),Math.atan2(target.y-origin.y,target.x-origin.x),true);origin=target;}
        if(!hit.size)this.effects.arc(x,y,x+Math.cos(this.player.angle)*110,y+Math.sin(this.player.angle)*110);
      } else if (isFirearm(weapon)) {
        const gun = FIREARMS[weapon], aim = firearmShotAim(this), muzzle = firearmMuzzle(this,aim.angle);
        if (muzzle.blocked) {
          if (weapon === "launcher") this.explodeAt(muzzle.x, muzzle.y, 116, this.surgeTime>0?8:4);
          else { const cover = this.levelData.solids.findIndex((s,i)=>!this.dungeon?.destroyed[i]&&overlap(muzzle.x,muzzle.y,3,s)); if(cover>=0)this.dungeon?.hitCover(cover,gun.damage*gun.spread.length,this.time); this.effects.burst("spark",muzzle.x,muzzle.y,18); }
        } else for (const spread of gun.spread) this.fire(muzzle.x,muzzle.y,aim.angle+spread,gun.speed,"player",gun.kind,gun.damage*(this.surgeTime>0?2:1),gun.life,weapon==="launcher"?116:0);
      }
      this.effects.burst("shell",this.player.x,this.player.y,14);return;
    }
    for (const barrel of this.barrels) if (barrel.active && distance(this.player,barrel) < stats.range) this.explodeBarrel(barrel);
    for (const e of targets) {
      const dot = Math.cos(this.player.angle) * (e.x - this.player.x) + Math.sin(this.player.angle) * (e.y - this.player.y);
      if (distance(e, this.player) > stats.range || dot < (weapon === "sabre" ? -distance(e,this.player)*.15 : -12)) continue;
      this.hitEnemy(e,stats.damage*(this.surgeTime>0?2:1),this.player.angle);
    }
  }
  private hitEnemy(enemy: AdventureEnemy, damage: number, angle: number,ignoreArmor=false) {
    if(this.practiceStep>=0)return;
    if (enemy.hp <= 0 || enemy.awake===false) return;
    if(enemy.role==="armored"&&!ignoreArmor&&Math.cos(angle-enemy.angle)<-.2)damage=Math.max(1,Math.floor(damage*.5));
    enemy.hp = Math.max(0,enemy.hp-damage); enemy.flash = .15;
    if (!enemy.boss || enemy.mode !== "windup") { enemy.mode = "recover"; enemy.timer = enemy.boss ? .18 : .44; enemy.attackRecovery=false; }
    this.move(enemy,Math.cos(angle)*(enemy.boss?3:14),Math.sin(angle)*(enemy.boss?3:14));
    this.effects.burst(enemy.hp<=0?"blast":"hit",enemy.x,enemy.y,enemy.hp<=0?38:22);this.impactStop=Math.max(this.impactStop,.024);
    if (enemy.hp <= 0) this.dropCoins(enemy);
    this.events.sound(enemy.hp <= 0 ? "defeat" : "hit");
  }
  private fire(x: number, y: number, angle: number, speed: number, owner: "player" | "enemy",kind:AdventureBullet["kind"]="round",damage=1,life=owner==="player"?.95:2.6,splash=0) {
    const b = this.bullets.find(b=>!b.active); if (b) Object.assign(b,{x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,life,maxLife:life,active:true,owner,kind,damage,splash});
  }
  private explodeAt(x:number,y:number,radius:number,damage:number){
    this.effects.burst("blast",x,y,radius);this.events.sound("blast");this.impactStop=Math.max(this.impactStop,.038);
    for(const e of this.enemies)if(e.hp>0&&e.awake!==false&&distance(e,{x,y})<radius)this.hitEnemy(e,damage,Math.atan2(e.y-y,e.x-x),true);
    if(distance(this.player,{x,y})<radius*.75)this.hurt();
    this.dungeon?.damageCovers(x,y,radius,damage,this.time);
    for(const b of this.barrels)if(b.active&&distance(b,{x,y})<radius)this.explodeBarrel(b);
  }
  private explodeBarrel(barrel: (typeof this.barrels)[number]) {
    if (!barrel.active) return;
    barrel.active=false;this.navigationVersion++;barrel.explosion=.65;this.explodeAt(barrel.x,barrel.y,112,4);
  }
  private hurt() {
    if (this.phase !== "playing" || this.immortal || this.practiceStep>=0 || this.canFinishLevel || this.invincible > 0) return;
    this.player.hp--; this.invincible = 1.1; this.events.sound("hit");this.effects.burst("hit",this.player.x,this.player.y,30);
    if (this.player.hp <= 0) {
      if (this.shieldReady) {
        this.shieldReady = false; this.player.hp = 3; this.invincible = 2.4; this.reviveTime = 2.4;
        this.events.shieldUsed?.(); this.events.sound("revive");
      } else {
        this.phase = "dead"; this.setInput(0, 0, false);
        this.lostCoins = this.events.death?.() ?? 0;
      }
    }
  }
  private dropCoins(enemy: AdventureEnemy) {
    const count = enemy.boss ? 15 : enemy.kind === "gun" ? 5 : 3;
    for (let i = 0; i < count; i++) {
      const coin = this.coins.find(c => !c.active); if (!coin) break;
      const a = i * Math.PI * 2 / count + enemy.id, x = enemy.x + Math.cos(a) * 19, y = enemy.y + Math.sin(a) * 19;
      Object.assign(coin, { x: this.canStand(x, y, 4) ? x : enemy.x, y: this.canStand(x, y, 4) ? y : enemy.y, age: 0, active: true });
    }
  }
  private collectCoin(coin: AdventureCoin) {
    if (!coin.active) return;
    coin.active = false; this.collectedCoins++; this.events.collect?.(1); this.events.sound("coin");
  }
  private collectRemainingCoins() { for (const coin of this.coins) if (coin.active) this.collectCoin(coin); for(const chest of this.chests)this.collectChestDrop(chest); }
  private enemyStep(e: AdventureEnemy, dt: number) {
    e.moving = false;
    e.flash = Math.max(0, e.flash - dt);
    if (e.hp <= 0 || e.awake===false || e.room !== this.room) return;
    const d = distance(e, this.player), angle = Math.atan2(this.player.y - e.y, this.player.x - e.x);
    e.timer -= dt;
    if(e.boss&&!e.reinforced&&e.hp<=e.maxHp/2){e.reinforced=true;this.wakeWave(-1,1);this.dungeon?.announce("Вожак вызывает подкрепление!",this.time);}
    if(e.mode==="charge"){
      const ox=e.x,oy=e.y;this.move(e,Math.cos(e.attackAngle)*420*dt,Math.sin(e.attackAngle)*420*dt);e.moving=true;e.walkDistance+=distance(e,{x:ox,y:oy});
      if(distance(e,this.player)<36)this.hurt();if(e.timer<=0){e.mode="recover";e.timer=.65;e.recoveryDuration=.65;e.attackRecovery=true;}return;
    }
    if (e.mode === "windup") {
      if (e.timer <= 0) {
        if (e.boss) {
          const zone=this.levelData.zone,turn=(e.attackCount??0)%3;e.attackCount=(e.attackCount??0)+1;
          if((zone===4?d>58&&d<166:d<104)&&this.lineClear(e,this.player))this.hurt();
          if(zone>=2&&(turn!==0||e.hp<=e.maxHp/2))for(const spread of[-.36,-.18,0,.18,.36])this.fire(e.x,e.y,e.attackAngle+spread,290,"enemy");
          if(zone>=3||zone===2&&turn===2)this.fire(e.x,e.y,e.attackAngle,Math.min(620,d/.85),"enemy","grenade",3,.85,95);
          if(zone===5&&turn===1)for(let n=0;n<8;n++)this.fire(e.x,e.y,n*Math.PI/4,250,"enemy");
          this.effects.burst("spark",e.x,e.y,zone===4?145:95);this.events.sound("punch");
        } else if (e.kind === "bat") {
          if(e.role==="charger"){e.mode="charge";e.timer=.32;e.attackRecovery=false;return;}
          const dot = Math.cos(e.attackAngle) * (this.player.x - e.x) + Math.sin(e.attackAngle) * (this.player.y - e.y);
          if (d < 76 && dot > d * .3 && this.lineClear(e, this.player)) this.hurt();
        } else {
          if(e.role==="demolisher")this.fire(e.x,e.y,e.attackAngle,Math.min(530,d/.9),"enemy","grenade",2,.9,78);
          else this.fire(e.x,e.y,e.attackAngle,270,"enemy");
          this.events.sound("shot");
        }
        e.mode = "recover"; e.timer = (e.boss ? .95 : e.kind === "gun" ? 1.05 : .62)*(1-(this.levelData.zone-1)*.075); e.recoveryDuration=e.timer; e.attackRecovery=true;
      }
      return;
    }
    if (e.mode === "recover") {
      if (e.timer <= 0) {e.mode = "chase";e.attackRecovery=false;}
      else if(!(e.kind==="gun"&&e.attackRecovery&&e.timer<e.recoveryDuration*.5))return;
    }
    e.angle = angle;
    if (e.mode==="chase"&&(e.boss ? d < (this.levelData.zone>=2?330:125) : e.role==="charger"?d<200:e.kind === "bat" ? d < 69 : d < 360) && e.timer <= 0 && this.lineClear(e, this.player)) {
      e.mode = "windup"; e.attackAngle = angle; e.timer = e.boss ? .9 : e.role==="charger"?.7:(e.kind === "gun" ? .8 : .56)*(1-(this.levelData.zone-1)*.055); e.windupDuration=e.timer;e.attackRecovery=false;return;
    }
    const speed = (e.kind === "gun" ? 54 : e.role==="charger"?94:73)*(1+(this.levelData.zone-1)*.07)*(this.endlessData?1+Math.min(.22,this.endlessFloor*.004)+(this.endlessData.abyss.anomaly.id==="hunt"?.08:0):1);
    let goal={x:this.player.x,y:this.player.y};
    if(e.kind==="gun"&&!e.boss){
      const outward=angle+Math.PI,side=(Math.floor(this.time/2.6+e.id*.37)%2?1:-1)*75;
      goal={x:this.player.x+Math.cos(outward)*225-Math.sin(outward)*side,y:this.player.y+Math.sin(outward)*225+Math.cos(outward)*side};
    }else if(!e.boss&&d>110){
      const flank=e.id*2.399963+e.room*.7;
      goal={x:this.player.x+Math.cos(flank)*52,y:this.player.y+Math.sin(flank)*52};
    }
    const waypoint=this.navigation.waypoint(e.id,e,goal,this.time,this.navigationCrowd);
    const toX=waypoint.x-e.x,toY=waypoint.y-e.y,toLength=length(toX,toY);
    let dx=toLength>.5?toX/toLength:0,dy=toLength>.5?toY/toLength:0;
    for(const other of this.navigationCrowd)if(other!==e){
      const gap=distance(e,other);if(gap<38){const avoid=(1-gap/38)*.75,a=gap>.01?Math.atan2(e.y-other.y,e.x-other.x):e.id*2.4;dx+=Math.cos(a)*avoid;dy+=Math.sin(a)*avoid;}
    }
    const steering=length(dx,dy),ox=e.x,oy=e.y;
    if(steering>.01){dx/=steering;dy/=steering;this.move(e,dx*speed*dt,dy*speed*dt);if(toLength>.5)e.angle=Math.atan2(dy,dx);}
    this.navigation.moved(e.id,length(e.x-ox,e.y-oy),dt);
    for (const other of this.enemies) if (other !== e && other.hp > 0 && other.awake!==false && other.room === e.room) {
      const gap = distance(e, other); if (gap < 26 && gap > .01) this.move(e, (e.x - other.x) / gap, (e.y - other.y) / gap);
    }
    const moved=length(e.x-ox,e.y-oy);e.moving=moved>.001;e.walkDistance+=moved;
  }
  advance(seconds: number) {
    if (!Number.isFinite(seconds) || seconds <= 0) return;
    if (this.phase !== "playing" && this.phase !== "opening") { this.accumulator = 0; return; }
    this.accumulator += clamp(seconds, 0, .1);
    while (this.accumulator + 1e-9 >= ADVENTURE_STEP && (this.phase === "playing" || this.phase === "opening")) {
      const opening = this.phase === "opening";
      if (opening) this.openingStep(ADVENTURE_STEP); else this.step(ADVENTURE_STEP);
      this.accumulator = Math.max(0, this.accumulator - ADVENTURE_STEP);
      if (opening && this.phase !== "opening") break;
    }
    this.notify();
  }
  private step(dt: number) {
    const previousX = this.player.x, previousY = this.player.y;
    if(this.area==="apartment"&&this.expandedHome){
      this.homeExitGrace=Math.max(0,this.homeExitGrace-dt);
      const push=this.dodgeTime>0?{x:this.dodgeX,y:this.dodgeY}:this.input;
      stepHomeDoors(this.homeDoors,this.player,push,dt);
    }
    this.time += dt;this.surgeTime=Math.max(0,this.surgeTime-dt);if(this.surgeTime<1e-8)this.surgeTime=0;
    this.energyCooldown=Math.max(0,this.energyCooldown-dt);if(this.energyCooldown<1e-8)this.energyCooldown=0;
    this.effects.step(dt);
    this.stepChestDrops(dt);
    this.stepEnergyWave(dt);
    if(this.impactStop>0){this.impactStop=Math.max(0,this.impactStop-dt);return;}
    this.reviveTime = Math.max(0, this.reviveTime - dt);
    this.invincible = Math.max(0, this.invincible - dt); this.dodgeCooldown = Math.max(0, this.dodgeCooldown - dt);
    this.punchCooldown = Math.max(0, this.punchCooldown - dt); this.punchTime = Math.max(0, this.punchTime - dt);
    if (this.dodgeTime > 0) { this.dodgeTime = Math.max(0, this.dodgeTime - dt); this.move(this.player, this.dodgeX * 440 * dt, this.dodgeY * 440 * dt); }
    else {
      if (length(this.input.x, this.input.y) > .1) this.player.angle = Math.atan2(this.input.y, this.input.x);
      const current = this.area === "sewer" ? this.levelData.currents.find(r=>inside(this.player.x,this.player.y,r)&&(r.disabledBy===undefined||!this.dungeon?.tasks[r.disabledBy].done)) : undefined;
      this.move(this.player, this.input.x * 154 * dt*(this.surgeTime>0?1.5:1)*(current ? .72 : 1), this.input.y * 154 * dt*(this.surgeTime>0?1.5:1)*(current ? .72 : 1));
      if (current) this.move(this.player,current.dx*30*dt,current.dy*30*dt);
      if (this.input.attack) this.punch();
    }
    const moved = length(this.player.x - previousX, this.player.y - previousY); this.moving = moved > .05; this.walkDistance += moved;
    if(this.area==="apartment"&&this.expandedHome&&!this.leavingHome&&this.homeExitGrace<=0&&this.input.y>.1&&Math.abs(this.player.x-692)<35&&this.player.y>=1080&&Math.abs(this.homeDoors[5].angle)>.74){
      this.leavingHome=true;this.pause();this.events.sound("door");this.events.run();return;
    }
    for (const coin of this.coins) if (coin.active) {
      coin.age += dt;if(coin.age<=.22)continue;
      const d=distance(this.player,coin);
      if(this.equipment.accessory==="charm"&&d>=42&&d<160&&this.lineClear(coin,this.player)){
        const pull=Math.min(d,250*dt)/d;coin.x+=(this.player.x-coin.x)*pull;coin.y+=(this.player.y-coin.y)*pull;
      }
      if(distance(this.player,coin)<42)this.collectCoin(coin);
    }
    if (this.area === "sewer") {
      const room = this.levelData.rooms.findIndex(r=>inside(this.player.x,this.player.y,r));
      this.collectNearbyIngredients();
      if (room >= 0) this.room=room;
      if(this.practiceStep<0)this.dungeon?.step(dt,this.time,this.player,this.room,this.enemies);
      if (this.phase !== "playing") return;
      if(this.practiceStep<0)this.levelData.medkits.forEach((kit,i)=>{if(this.dungeon?.medkits[i]&&this.player.hp<3&&distance(this.player,kit)<32){this.dungeon.medkits[i]=false;this.player.hp++;this.effects.burst("heal",kit.x,kit.y,38);this.events.sound("heal");}});
      if (this.phase !== "playing") return;
    }
    for (const barrel of this.barrels) barrel.explosion=Math.max(0,barrel.explosion-dt);
    if(this.practiceStep<0){
      const bounds=this.area==="sewer"?this.levelData.rooms[this.room]:{x:28,y:108,w:424,h:440};
      this.navigation.beginStep(bounds,`${this.area}:${this.room}:${this.dungeon?.geometryRevision??0}:${this.navigationVersion}`);
      this.navigationCrowd.length=0;for(const e of this.enemies)if(e.hp>0&&e.awake!==false&&e.room===this.room)this.navigationCrowd.push(e);
      for (const e of this.enemies) { this.enemyStep(e, dt); if (this.phase !== "playing") return; }
    }
    for (const b of this.bullets) {
      if (!b.active) continue;
      b.life -= dt; const n = Math.max(1, Math.ceil(length(b.vx, b.vy) * dt / 3));
      for (let i = 0; i < n && b.active; i++) {
        b.x += b.vx * dt / n; b.y += b.vy * dt / n;
        const barrel = this.barrels.find(barrel=>barrel.active && distance(barrel,b)<15);
        if (barrel) { b.active=false; this.explodeBarrel(barrel); }
        else if (b.life <= 0 || !this.canStand(b.x, b.y, 2)) {
          b.active = false;if(b.kind==="grenade")this.explodeAt(b.x,b.y,b.splash??95,b.damage??3);
          else if(b.owner==="player"){const cover=this.levelData.solids.findIndex((s,j)=>!this.dungeon?.destroyed[j]&&overlap(b.x,b.y,3,s));if(cover>=0)this.dungeon?.hitCover(cover,b.damage??1,this.time);this.effects.burst("spark",b.x,b.y,15);}
        }
        else if (b.owner === "player") { const enemy = this.enemies.find(e=>e.hp>0 && e.awake!==false && e.room===this.room && distance(e,b)<(e.boss?23:15)); if (enemy) { b.active=false;if(b.kind==="grenade")this.explodeAt(b.x,b.y,b.splash??116,b.damage??4);else this.hitEnemy(enemy,b.damage??1,Math.atan2(b.vy,b.vx)); } }
        else if (b.kind!=="grenade"&&distance(this.player, b) < 15) { b.active = false; this.hurt(); }
      }
      if (this.phase !== "playing") return;
    }
    if (this.area === "apartment" && this.enemies.length && this.enemies.every(e => e.hp <= 0) && this.checkpoint === 0) {
      this.save(1); this.say(["Сахур повержен. Он оставил дверь открытой. Пора узнать, что творится под домом."]);
    }
    if (this.area === "apartment" && !this.tutorialOpened && this.time > this.nextKnock) { this.nextKnock = this.time + 3.6; this.events.sound("knock"); }
    if (this.area === "sewer" && !this.cleared[this.room] && this.enemies.filter(e => e.room === this.room && e.awake!==false).every(e => e.hp <= 0)) {
      this.cleared[this.room] = true; this.events.sound("door");
      if (this.canFinishLevel) for (const b of this.bullets) b.active = false;
    }
  }
}
