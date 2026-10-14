import { KNOPIK_ROLL_DURATION } from "./knopik-roll.ts";
import { isFirearm, FIREARMS, firearmMuzzle, firearmAim } from "./dungeon-aim.ts";
import { OPENING_DURATION, OPENING_CUES } from "./adventure-opening.ts";
/** The first chapter uses the same fixed 60 Hz simulation on every display. */
import { adventureLevel, dungeonZone, sanitizeCompletedLevel, sanitizeWeaponTier, ADVENTURE_WEAPONS, type AdventureWeapon, type DungeonSpawn } from "./adventure-levels.ts";
import { DungeonRuntime, DungeonEffects } from "./dungeon-runtime.ts";
import type { ApartmentDestination } from "./apartment-interactions.ts";
import { adventureChestPositions, rollAdventureLoot, type AdventureLoot, type AdventureLootBuff } from "./adventure-loot.ts";
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
export type AdventureView = { area: AdventureArea; phase: AdventurePhase; cinematic: boolean; hp: number; checkpoint: number; room: number; defeated: number; total: number; coins: number; lostCoins: number; objective: string; interaction: string; dialogue: string; speaker: string; dodged: boolean; dodgeReady: boolean; canHeal: boolean; shieldReady: boolean; revived: boolean; level: number; completedLevel: number; roomCount: number; weapon: AdventureWeapon; weaponTier: number; weaponReady: boolean; canFinish: boolean; zone:number;stage:number;tasksDone:number;tasksTotal:number;notice:string;roomName:string;visited:boolean[];goal:{x:number;y:number}|null };
export type AdventureEvents = { change: (view: AdventureView) => void; checkpoint: (value: number) => void; sound: (kind: AdventureSound) => void; run: () => void; bar: () => void; collect?: (amount: number) => void; lootBuff?: (kind: AdventureLootBuff) => boolean; consumeHeal?: () => boolean; activateShield?: () => boolean; shieldUsed?: () => void; death?: () => number; buySupply?: (kind: "heal" | "pepsi") => boolean; levelComplete?: (level: number) => void; unlockWeapon?: (tier: number) => void };
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
  get levelData() { return adventureLevel(this.level); }
  room = 0;
  cleared = [false, false, false];
  time = 0;
  moving = false;
  walkDistance = 0;
  punchSerial = 0;
  invincible = 0;
  shieldReady = false;
  reviveTime = 0;
  dodgeTime = 0;
  dodgeCooldown = 0;
  punchTime = 0;
  punchCooldown = 0;
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
  constructor(checkpoint: number, events: AdventureEvents, options: { shield?: boolean; completedLevel?: number; weaponTier?: number; immortal?: boolean; random?: () => number } = {}) {
    this.events = events;
    this.random = options.random ?? Math.random;
    this.shieldReady = options.shield === true;
    this.immortal = options.immortal === true;
    this.checkpoint = sanitizeStoryCheckpoint(checkpoint);
    this.completedLevel = Math.max(this.checkpoint >= 3 ? 1 : 0, sanitizeCompletedLevel(options.completedLevel));
    this.weaponTier = sanitizeWeaponTier(options.weaponTier);
    this.tutorialOpened = this.checkpoint > 0;
    this.dodged = this.checkpoint > 0;
    if (this.checkpoint === 1) this.loadArea("basement");
    if (this.checkpoint === 2) this.loadArea("sewer");
    this.phase = this.checkpoint === 0 ? "opening" : "playing";
    if (this.checkpoint === 3) this.player.y = 421;
  }
  view(): AdventureView {
    return {
      area: this.area, phase: this.phase, cinematic: this.phase === "opening" || this.phase === "paused" && this.pausedPhase === "opening", hp: this.player.hp, checkpoint: this.checkpoint,
      room: this.room, defeated: this.enemies.filter(e => e.hp <= 0&&e.awake!==false).length,
      total: this.enemies.filter(e=>e.awake!==false).length, objective: this.objective(),
      coins: this.collectedCoins, lostCoins: this.lostCoins,
      canFinish: this.canFinishLevel,
      interaction: this.interaction(), dialogue: this.dialogues[this.dialogueIndex] ?? "",
      speaker: this.area === "apartment" && !this.tutorialOpened ? "Кнопик" : "Под домом",
      dodged: this.dodged, dodgeReady: this.dodgeCooldown <= 0,
      canHeal: this.phase === "playing" && this.player.hp > 0 && this.player.hp < 3 && (this.area === "sewer" || this.enemies.some(e => e.hp > 0)),
      shieldReady: this.shieldReady, revived: this.reviveTime > 0,
      level: this.level, completedLevel: this.completedLevel, roomCount: this.levelData.rooms.length, weapon: this.weapon, weaponTier: this.weaponTier, weaponReady: this.punchCooldown <= 0,
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
    this.area = area; this.phase = "playing"; this.room = 0; this.enemies = []; this.moving = false; this.walkDistance = 0; this.punchSerial = 0;
    this.player = { x: area==="sewer"?this.levelData.spawn.x:240, y: area === "sewer" ? this.levelData.spawn.y : area === "basement" ? 410 : 421, angle: -Math.PI / 2, hp: 3 };
    this.cleared = this.levelData.rooms.map(() => false); this.invincible = this.dodgeTime = this.dodgeCooldown = this.punchCooldown = this.punchTime = this.accumulator = 0;
    for (const b of this.bullets) b.active = false;
    for (const coin of this.coins) coin.active = false;
    this.collectedCoins = 0; this.lostCoins = 0; this.reviveTime = 0;
    this.effects.reset();this.impactStop=0;this.dungeon=null;
    // A death keeps claimed rewards and unopened contents; restarting cannot reroll a chest.
    this.chests = area !== "sewer" ? [] : preserveChests ? this.chests : adventureChestPositions(this.levelData).map(c => ({ ...c, opened: false, openedAt: -1, loot: rollAdventureLoot(this.level, this.random()),drop:{active:false,claimed:false,x:c.x,y:c.y,z:0,age:0,landX:c.x,landY:c.y,homing:false} }));
    this.barrels = area === "sewer" ? this.levelData.barrels.map(b => ({ ...b, active: true, explosion: 0 })) : [];
    if (area === "sewer") {
      const weapon=dungeonZone(this.level).weapon,tier=ADVENTURE_WEAPONS[weapon].tier;
      if(tier>this.weaponTier){this.weaponTier=tier;this.events.unlockWeapon?.(tier);}this.weapon=weapon;
      this.enemies = this.levelData.enemies.map((e,i) => {const hp=e.boss?14+this.levelData.zone*4:(e.kind==="gun"?2:3)+Math.floor((this.levelData.zone-1)/2)+(e.role==="armored"?2:0);return { ...this.spawn(i,e.kind,e.room,e.x,e.y),...e,hp,maxHp:hp,awake:!e.wave };});
      this.dungeon=new DungeonRuntime(this.levelData,{wave:(task,wave)=>this.wakeWave(task,wave),blast:(x,y,r,damage)=>this.explodeAt(x,y,r,damage),effect:(kind,x,y,r)=>this.effects.burst(kind,x,y,r),sound:()=>this.events.sound("door"),damage:()=>this.hurt(),trapEnemies:(x,y,w,h)=>{for(const e of this.enemies)if(e.hp>0&&e.awake!==false&&inside(e.x,e.y,{x,y,w,h}))this.hitEnemy(e,2,0);},done:()=>this.levelGoalsDone});
      this.dungeon.visited[0]=true;
    }
    this.notify();
  }
  private interaction() {
    const p = this.player;
    if (this.area === "apartment") {
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
  private collectChestDrop(chest:AdventureChest){
    const drop=chest.drop;if(!drop.active||drop.claimed)return;
    drop.claimed=true;drop.active=false;
    const loot=chest.loot;
    if(loot.kind==="buff"&&this.events.lootBuff?.(loot.buff))this.events.sound("heal");
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
    const action = destination === "bar" ? "Мини-бар · сны" : destination === "street" ? "Выйти на улицу" : destination === "basement" ? this.completedLevel >= 1 ? "Выбрать уровень" : this.tutorialOpened ? "Спуститься в подвал" : "Открыть дверь" : "";
    if (!action) return false;
    this.setInput(0,0,false); this.performInteraction(action); return true;
  }
  private performInteraction(action: string) {
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
    this.dodgeTime = KNOPIK_ROLL_DURATION; this.dodgeCooldown = .66; this.invincible = Math.max(this.invincible, .28);this.effects.burst("dash",this.player.x,this.player.y,30);
    this.dodged = true; this.events.sound("dodge"); this.notify();
  }
  buySupply(kind: "heal" | "pepsi") {
    if (this.phase !== "playing" || this.player.hp <= 0 || !["heal", "pepsi"].includes(kind) || !(this.area === "sewer" || this.area === "apartment" && this.enemies.some(e => e.hp > 0))) return false;
    return this.events.buySupply?.(kind) ?? false;
  }
  heal() {
    if (!this.view().canHeal || !this.events.consumeHeal?.()) return false;
    this.player.hp++; this.effects.burst("heal", this.player.x, this.player.y, 38); this.events.sound("heal"); this.notify(); return true;
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
    if (!Number.isInteger(id) || id < 1 || id > 25 || id > this.completedLevel+1 || !["levels","playing"].includes(this.phase) || this.completedLevel < 1 || this.area !== "apartment" && !(this.area === "sewer" && this.phase === "levels")) return false;
    this.level = id;
    this.loadArea("sewer"); return true;
  }
  selectWeapon(weapon: AdventureWeapon) {
    if (this.phase !== "playing" || this.area !== "sewer" || !(weapon in ADVENTURE_WEAPONS) || ADVENTURE_WEAPONS[weapon].tier>this.weaponTier) return false;
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
      return this.checkpoint >= 3 ? "Твой дом · мини-бар, улица и подвал" : this.tutorialOpened ? "↑ Спустись в подвал" : "↑ Подойди к двери подвала";
    }
    if (this.area === "basement") return "↑ Найди пролом в северной стене";
    return this.canFinishLevel ? "Подъёмник готов · нажми «Завершить»" : this.levelGoalsDone?"Найди подъёмник · можно собрать оставшуюся добычу":this.dungeon?.objective()??"Исследуй тоннели";
  }
  canStand(x: number, y: number, radius = 13) {
    if(!Number.isFinite(x)||!Number.isFinite(y)||!Number.isFinite(radius)||radius<0)return false;
    const floors = this.area === "sewer" ? this.levelData.floors : [this.area === "apartment" ? { x: 28, y: 108, w: 424, h: 440 } : { x: 36, y: 102, w: 408, h: 352 }];
    for (let a = 0; a < 8; a++) if (!floors.some(r => inside(x + Math.cos(a * Math.PI / 4) * radius, y + Math.sin(a * Math.PI / 4) * radius, r))) return false;
    const solids = this.area === "apartment" ? APARTMENT_SOLIDS : this.area === "basement" ? BASEMENT_SOLIDS : this.levelData.solids;
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
    if (targets[0] && !isFirearm(weapon)) this.player.angle = Math.atan2(targets[0].y - this.player.y, targets[0].x - this.player.x);
    this.punchSerial++; this.punchTime = weapon === "sabre" ? .32 : weapon === "fist" ? .24 : .2; this.punchCooldown = stats.cooldown; this.events.sound(weapon==="arc"?"arc":weapon==="shotgun"?"shotgun":ranged?"shot":"punch");
    if(ranged){
      const x=this.player.x+Math.cos(this.player.angle)*23,y=this.player.y+Math.sin(this.player.angle)*23;
      if(weapon==="arc"){
        let origin:{x:number;y:number}=this.player;const hit=new Set<number>();
        for(let n=0;n<4;n++){const target=this.enemies.filter(e=>e.hp>0&&e.awake!==false&&e.room===this.room&&!hit.has(e.id)&&distance(origin,e)<(n?160:stats.range)&&this.lineClear(origin,e)).sort((a,b)=>distance(origin,a)-distance(origin,b))[0];if(!target)break;hit.add(target.id);this.effects.arc(origin.x,origin.y,target.x,target.y);this.hitEnemy(target,stats.damage,this.player.angle,true);origin=target;}
        if(!hit.size)this.effects.arc(x,y,x+Math.cos(this.player.angle)*110,y+Math.sin(this.player.angle)*110);
      } else if (isFirearm(weapon)) {
        const gun = FIREARMS[weapon], aim = firearmAim(this), muzzle = firearmMuzzle(this,aim.angle);
        if (muzzle.blocked) {
          if (weapon === "launcher") this.explodeAt(muzzle.x, muzzle.y, 116, 4);
          else { const cover = this.levelData.solids.findIndex((s,i)=>!this.dungeon?.destroyed[i]&&overlap(muzzle.x,muzzle.y,3,s)); if(cover>=0)this.dungeon?.hitCover(cover,gun.damage*gun.spread.length,this.time); this.effects.burst("spark",muzzle.x,muzzle.y,18); }
        } else for (const spread of gun.spread) this.fire(muzzle.x,muzzle.y,aim.angle+spread,gun.speed,"player",gun.kind,gun.damage,gun.life,weapon==="launcher"?116:0);
      }
      this.effects.burst("shell",this.player.x,this.player.y,14);return;
    }
    for (const barrel of this.barrels) if (barrel.active && distance(this.player,barrel) < stats.range) this.explodeBarrel(barrel);
    for (const e of targets) {
      const dot = Math.cos(this.player.angle) * (e.x - this.player.x) + Math.sin(this.player.angle) * (e.y - this.player.y);
      if (distance(e, this.player) > stats.range || dot < (weapon === "sabre" ? -distance(e,this.player)*.15 : -12)) continue;
      this.hitEnemy(e,stats.damage,this.player.angle);
    }
  }
  private hitEnemy(enemy: AdventureEnemy, damage: number, angle: number,ignoreArmor=false) {
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
    barrel.active=false; barrel.explosion=.65;this.explodeAt(barrel.x,barrel.y,112,4);
  }
  private hurt() {
    if (this.phase !== "playing" || this.immortal || this.canFinishLevel || this.invincible > 0) return;
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
    if (e.mode === "recover") { if (e.timer <= 0) {e.mode = "chase";e.attackRecovery=false;} return; }
    e.angle = angle;
    if ((e.boss ? d < (this.levelData.zone>=2?330:125) : e.role==="charger"?d<200:e.kind === "bat" ? d < 69 : d < 360) && e.timer <= 0 && this.lineClear(e, this.player)) {
      e.mode = "windup"; e.attackAngle = angle; e.timer = e.boss ? .9 : e.role==="charger"?.7:(e.kind === "gun" ? .8 : .56)*(1-(this.levelData.zone-1)*.055); e.windupDuration=e.timer;e.attackRecovery=false;return;
    }
    if (e.kind === "gun" && d < 158 && this.lineClear(e, this.player)) return;
    const speed = (e.kind === "gun" ? 54 : e.role==="charger"?94:73)*(1+(this.levelData.zone-1)*.07);
    const ox = e.x, oy = e.y; this.move(e, Math.cos(angle) * speed * dt, Math.sin(angle) * speed * dt);
    if (length(e.x - ox, e.y - oy) < speed * dt * .35) {
      // Try both sides of a pillar; enemies cannot hit through its collision box.
      const turn = e.id % 2 ? 1 : -1;
      this.move(e, Math.cos(angle + turn * Math.PI / 2) * speed * dt, Math.sin(angle + turn * Math.PI / 2) * speed * dt);
    }
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
    this.time += dt;
    this.effects.step(dt);
    this.stepChestDrops(dt);
    if(this.impactStop>0){this.impactStop=Math.max(0,this.impactStop-dt);return;}
    this.reviveTime = Math.max(0, this.reviveTime - dt);
    this.invincible = Math.max(0, this.invincible - dt); this.dodgeCooldown = Math.max(0, this.dodgeCooldown - dt);
    this.punchCooldown = Math.max(0, this.punchCooldown - dt); this.punchTime = Math.max(0, this.punchTime - dt);
    if (this.dodgeTime > 0) { this.dodgeTime = Math.max(0, this.dodgeTime - dt); this.move(this.player, this.dodgeX * 440 * dt, this.dodgeY * 440 * dt); }
    else {
      if (length(this.input.x, this.input.y) > .1) this.player.angle = Math.atan2(this.input.y, this.input.x);
      const current = this.area === "sewer" ? this.levelData.currents.find(r=>inside(this.player.x,this.player.y,r)&&(r.disabledBy===undefined||!this.dungeon?.tasks[r.disabledBy].done)) : undefined;
      this.move(this.player, this.input.x * 154 * dt*(current ? .72 : 1), this.input.y * 154 * dt*(current ? .72 : 1));
      if (current) this.move(this.player,current.dx*30*dt,current.dy*30*dt);
      if (this.input.attack) this.punch();
    }
    const moved = length(this.player.x - previousX, this.player.y - previousY); this.moving = moved > .05; this.walkDistance += moved;
    for (const coin of this.coins) if (coin.active) { coin.age += dt; if (coin.age > .22 && distance(this.player, coin) < 42) this.collectCoin(coin); }
    if (this.area === "sewer") {
      const room = this.levelData.rooms.findIndex(r=>inside(this.player.x,this.player.y,r));
      if (room >= 0) this.room=room;
      this.dungeon?.step(dt,this.time,this.player,this.room,this.enemies);
      if (this.phase !== "playing") return;
      this.levelData.medkits.forEach((kit,i)=>{if(this.dungeon?.medkits[i]&&this.player.hp<3&&distance(this.player,kit)<32){this.dungeon.medkits[i]=false;this.player.hp++;this.effects.burst("heal",kit.x,kit.y,38);this.events.sound("heal");}});
      if (this.phase !== "playing") return;
    }
    for (const barrel of this.barrels) barrel.explosion=Math.max(0,barrel.explosion-dt);
    for (const e of this.enemies) { this.enemyStep(e, dt); if (this.phase !== "playing") return; }
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
