import { DRINK_GAMES } from "./drink-game-engine.ts";
import { spendBalance } from "./cosmetic-engine.ts";
import type { PotionKind } from "./pixel-artwork";

export const BUFF_CATALOG = {
  food: { name: "Корм", price: 150 },
  zhivchik: { name: "Живчик", price: 300 },
  pitbull: { name: "Питбуль", price: 200 },
  cocoa: { name: "Какао", price: 200 },
  bergamot: { name: "Бергамот", price: 300 },
  pepsi: { name: "Пепси", price: 5000 },
  ...DRINK_GAMES,
} as const;
export const BUFF_STOCK_LIMIT = 25;
export type BuffStock = Record<PotionKind, number>;
export const emptyBuffStock = (): BuffStock => ({ food:0,zhivchik:0,pitbull:0,cocoa:0,bergamot:0,pepsi:0,lime:0,matcha:0,tralalero:0,ballerina:0,bombardiro:0,verity:0 });

/** Buying only changes active money and stock. Activation is a separate action. */
export function purchaseShelfBuff(kind: PotionKind, stock: number, walletCoins: number, vaultCoins: number) {
  if (!Number.isFinite(stock) || stock < 0 || stock >= BUFF_STOCK_LIMIT) return null;
  const spent = spendBalance(walletCoins, vaultCoins, BUFF_CATALOG[kind].price, "active");
  return spent ? { ...spent, count: Math.floor(stock) + 1 } : null;
}
