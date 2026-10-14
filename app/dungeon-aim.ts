import type { AdventureEngine } from "./adventure-engine.ts";
import type { AdventureWeapon } from "./adventure-levels.ts";
export const FIREARMS = {
  pistol: { speed: 730, life: .78, damage: 1, spread: [0], kind: "round" },
  shotgun: { speed: 710, life: .46, damage: 2, spread: [-.2, -.1, 0, .1, .2], kind: "pellet" },
  launcher: { speed: 640, life: .8, damage: 4, spread: [0], kind: "grenade" },
} as const;
export type Firearm = keyof typeof FIREARMS;
export function isFirearm(weapon: AdventureWeapon): weapon is Firearm { return weapon === "pistol" || weapon === "shotgun" || weapon === "launcher"; }
export function firearmMuzzle(engine: AdventureEngine) {
  const p = engine.player;
  let x = p.x, y = p.y;
  for (let d = 3; d <= 24; d += 3) {
    const distance = Math.min(23, d); x = p.x + Math.cos(p.angle) * distance; y = p.y + Math.sin(p.angle) * distance;
    if (!engine.canStand(x, y, 2)) return { x, y, blocked: true };
  }
  return { x, y, blocked: false };
}
/** Predicts the physical ray; it never changes the actor's aim. */
export function firearmTrajectory(engine: AdventureEngine, spread = 0) {
  const muzzle = firearmMuzzle(engine);
  if (!isFirearm(engine.weapon) || muzzle.blocked) return { ...muzzle, startX: engine.player.x, startY: engine.player.y };
  const gun = FIREARMS[engine.weapon], angle = engine.player.angle + spread, range = gun.speed * gun.life;
  let x = muzzle.x, y = muzzle.y;
  for (let d = 3; d <= range + 3; d += 3) {
    const distance = Math.min(d, range); x = muzzle.x + Math.cos(angle) * distance; y = muzzle.y + Math.sin(angle) * distance;
    if (!engine.canStand(x, y, 2) || engine.barrels.some(b => b.active && Math.hypot(b.x-x,b.y-y) < 15) || engine.enemies.some(e => e.hp > 0 && e.awake !== false && e.room === engine.room && Math.hypot(e.x-x,e.y-y) < (e.boss ? 23 : 15))) return { x, y, startX: muzzle.x, startY: muzzle.y, blocked: true };
  }
  return { x, y, startX: muzzle.x, startY: muzzle.y, blocked: false };
}
