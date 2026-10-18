import type { AdventureEngine } from "./adventure-engine.ts";
import type { AdventureWeapon } from "./adventure-levels.ts";
export const FIREARMS = {
  crossbow:{speed:620,life:1,damage:3,spread:[0],kind:"bolt"},
  rifle:{speed:1000,life:.74,damage:4,spread:[0],kind:"piercing"},
  pistol: { speed: 730, life: .78, damage: 1, spread: [0], kind: "round" },
  shotgun: { speed: 710, life: .46, damage: 2, spread: [-.2, -.1, 0, .1, .2], kind: "pellet" },
  launcher: { speed: 640, life: .8, damage: 4, spread: [0], kind: "grenade" },
} as const;
export type Firearm = keyof typeof FIREARMS;
export function isFirearm(weapon: AdventureWeapon): weapon is Firearm { return weapon === "pistol" || weapon === "shotgun" || weapon === "launcher" || weapon === "crossbow" || weapon === "rifle"; }
export const AIM_ASSIST_CONE = 30 * Math.PI / 180;
export const AIM_ASSIST_LIMIT = 4 * Math.PI / 180;
export const PISTOL_LOCK_CONE = 50 * Math.PI / 180;
const angleDifference=(a:number,b:number)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
/** A small nudge around the player's own aim. No target lock or prediction. */
export function firearmAim(engine:AdventureEngine){
  return selectFirearmTarget(engine,AIM_ASSIST_CONE,false);
}
/** The pistol snaps the actual shot to a visible enemy; the guide keeps its soft nudge. */
export function firearmShotAim(engine:AdventureEngine){
  return engine.weapon==="pistol"?selectFirearmTarget(engine,PISTOL_LOCK_CONE,true):firearmAim(engine);
}
function selectFirearmTarget(engine:AdventureEngine,cone:number,lock:boolean){
  const raw=engine.player.angle;
  if(!isFirearm(engine.weapon))return {angle:raw,target:null as number|null,correction:0};
  const range=FIREARMS[engine.weapon].speed*FIREARMS[engine.weapon].life;
  let score=Infinity,best:number|null=null,correction=0;
  for(const enemy of engine.enemies){
    if(enemy.hp<=0||enemy.awake===false||enemy.room!==engine.room)continue;
    const dx=enemy.x-engine.player.x,dy=enemy.y-engine.player.y,distance=Math.hypot(dx,dy);
    if(distance<28||distance>range)continue;
    const delta=angleDifference(Math.atan2(dy,dx),raw),offset=Math.abs(delta);
    if(offset>cone+1e-9)continue;
    const candidate=offset/cone+distance/range*.1;
    if(candidate>=score||!engine.lineClear(engine.player,enemy))continue;
    // Barrels intercept bullets even though they are not walking obstacles.
    if(engine.barrels.some(b=>{if(!b.active)return false;const t=((b.x-engine.player.x)*dx+(b.y-engine.player.y)*dy)/(distance*distance);return t>0&&t<1&&Math.hypot(b.x-engine.player.x-dx*t,b.y-engine.player.y-dy*t)<18;}))continue;
    const edge=Math.max(0,Math.min(1,(cone-offset)/(cone*.35)));
    score=candidate;best=enemy.id;correction=lock?delta:Math.max(-AIM_ASSIST_LIMIT,Math.min(AIM_ASSIST_LIMIT,delta*.5))*edge;
  }
  return {angle:raw+correction,target:best,correction};
}
export function firearmMuzzle(engine: AdventureEngine, angle=firearmAim(engine).angle) {
  const p = engine.player,dx=Math.cos(angle),dy=Math.sin(angle);
  let x = p.x, y = p.y;
  for (let d = 3; d <= 24; d += 3) {
    const distance = Math.min(23, d); x = p.x + dx * distance; y = p.y + dy * distance;
    if (!engine.canStand(x, y, 2)) return { x, y, blocked: true };
  }
  return { x, y, blocked: false };
}
/** Preview the guide. The pistol's actual shot may turn further toward its target. */
export function firearmTrajectory(engine: AdventureEngine, spread = 0, aimAngle=firearmAim(engine).angle, muzzle=firearmMuzzle(engine,aimAngle)) {
  if (!isFirearm(engine.weapon) || muzzle.blocked) return { ...muzzle, startX: engine.player.x, startY: engine.player.y };
  const gun = FIREARMS[engine.weapon], angle = aimAngle + spread, range = gun.speed * gun.life,dx=Math.cos(angle),dy=Math.sin(angle);
  let x = muzzle.x, y = muzzle.y;
  for (let d = 3; d <= range + 3; d += 3) {
    const distance = Math.min(d, range); x = muzzle.x + dx * distance; y = muzzle.y + dy * distance;
    if (!engine.canStand(x, y, 2) || engine.barrels.some(b => b.active && Math.hypot(b.x-x,b.y-y) < 15) || engine.enemies.some(e => e.hp > 0 && e.awake !== false && e.room === engine.room && Math.hypot(e.x-x,e.y-y) < (e.boss ? 23 : 15))) return { x, y, startX: muzzle.x, startY: muzzle.y, blocked: true };
  }
  return { x, y, startX: muzzle.x, startY: muzzle.y, blocked: false };
}
