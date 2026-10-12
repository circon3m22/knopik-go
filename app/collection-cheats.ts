import { THEMES, COSMETICS, type ThemeId, type CosmeticId } from "./cosmetic-engine.ts";
import { BUFF_CATALOG, BUFF_STOCK_LIMIT } from "./buff-shelf-engine.ts";
import type { PotionKind } from "./pixel-artwork";
import type { SaveData } from "./game-logic";

type CollectionCheat = { code: string; label: string } & (
  { type: "clothing"; kind: "hat" | "mohawk" | CosmeticId } |
  { type: "theme"; kind: ThemeId } |
  { type: "buff"; kind: PotionKind } |
  { type: "case"; kind: "common" | "big" } |
  { type: "upgrade"; kind: "hat" | "mohawk" }
);

// Deliberately opaque: a code never contains the item's name or internal ID.
export const COLLECTION_CHEATS: readonly CollectionCheat[] = [
  { code: "R7V2", type: "clothing", kind: "hat", label: "Тюбетейка Хасбика" },
  { code: "N4Q8", type: "clothing", kind: "mohawk", label: "Ирокез" },
  { code: "K9X3", type: "clothing", kind: "bandana", label: COSMETICS.bandana.name },
  { code: "Z6P1", type: "clothing", kind: "charm", label: COSMETICS.charm.name },
  ...(["classic", "soda", "mint", "night", "bath", "emerald"] as const).map((kind, i) => ({
    code: ["V2M7", "Q8L4", "X3D9", "P6R2", "J4W8", "F9C5"][i], type: "theme" as const, kind, label: THEMES[kind].name,
  })),
  ...(["food", "zhivchik", "pitbull", "cocoa", "bergamot", "pepsi", "lime", "matcha", "tralalero", "ballerina", "bombardiro", "verity", "heal"] as const).map((kind, i) => ({
    code: ["B3N8", "T7H2", "D9S4", "W2F6", "L8G3", "C4Y9", "H6B1", "S3Z7", "M5T8", "Y9J2", "G2K6", "A8E4", "F2N9"][i], type: "buff" as const, kind, label: BUFF_CATALOG[kind].name,
  })),
  { code: "E5U9", type: "case", kind: "common", label: "Обычный кейс" },
  { code: "U1A6", type: "case", kind: "big", label: "Большой кейс" },
  { code: "O7I3", type: "upgrade", kind: "hat", label: "Улучшение тюбетейки" },
  { code: "I4O8", type: "upgrade", kind: "mohawk", label: "Улучшение ирокеза" },
];

export const BUFF_SAVE_FIELDS = {
  food: "foodCount", zhivchik: "drinkCount", pitbull: "pitbullCount", cocoa: "colaCount",
  bergamot: "teaCount", pepsi: "vitaPowerCount", heal: "healCount", lime: "limeCount", matcha: "matchaCount",
} as const;

export function grantCollectionCheat(code: string, isAdmin: boolean, save: SaveData): Partial<SaveData> | null {
  if (!isAdmin) return null;
  const entry = COLLECTION_CHEATS.find(item => item.code.toLowerCase() === code.trim().toLowerCase());
  if (!entry) return null;
  if (entry.type === "theme") return { ownedThemes: [...new Set([...save.ownedThemes, entry.kind])] };
  if (entry.type === "clothing") {
    if (entry.kind === "hat") return { hatOwned: true };
    if (entry.kind === "mohawk") return { mohawkOwned: true };
    return { ownedCosmetics: [...new Set([...save.ownedCosmetics, entry.kind])] };
  }
  if (entry.type === "case" || entry.type === "upgrade") {
    const field = entry.type === "case" ? entry.kind === "common" ? "commonCases" : "bigCases" : entry.kind === "hat" ? "hatUpgradeTokens" : "mohawkUpgradeTokens";
    return { [field]: Math.min(99, save[field] + 1) };
  }
  if (entry.kind in BUFF_SAVE_FIELDS) {
    const field = BUFF_SAVE_FIELDS[entry.kind as keyof typeof BUFF_SAVE_FIELDS];
    return { [field]: Math.min(BUFF_STOCK_LIMIT, save[field] + 1) };
  }
  const kind = entry.kind as keyof SaveData["brainrotInventory"];
  return { brainrotInventory: { ...save.brainrotInventory, [kind]: Math.min(BUFF_STOCK_LIMIT, save.brainrotInventory[kind] + 1) } };
}
