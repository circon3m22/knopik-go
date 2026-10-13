import type { AdventureLevel } from "./adventure-levels.ts";

export type AdventureLootBuff = "food" | "zhivchik" | "heal" | "pepsi";
export type AdventureLoot = { kind: "coins"; amount: number } | { kind: "buff"; buff: AdventureLootBuff };
export const ADVENTURE_LOOT_NAMES: Record<AdventureLootBuff, string> = { food: "Корм", zhivchik: "Живчик", heal: "Хилка", pepsi: "Щит Пепси" };
export function adventureChestPositions(level: AdventureLevel) {
  return level.rooms.map((r, room) => ({ room, x: r.x + r.w - 96, y: r.y + r.h - 56 }));
}
/** One roll per chest: 85% coins, 14% regular buffs, 1% resurrection shield. */
export function rollAdventureLoot(level: number, roll: number): AdventureLoot {
  const n = Number.isFinite(roll) ? Math.max(0, Math.min(1 - Number.EPSILON, roll)) : 0;
  if (n < .85) return { kind: "coins", amount: 25 + Math.floor(n / .85 * 36) + (Math.max(1, Math.min(5, Math.floor(level))) - 1) * 10 };
  return { kind: "buff", buff: n < .91 ? "food" : n < .95 ? "zhivchik" : n < .99 ? "heal" : "pepsi" };
}
