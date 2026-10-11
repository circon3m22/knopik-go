import { MAX_LEVEL } from "./level-engine.ts";
import type { CaseReward } from "./case-engine.ts";
import type { CosmeticId, ThemeId } from "./cosmetic-engine.ts";

export type ProgressReward = CaseReward
  | { type: "case"; kind: "common" | "big"; amount: number; label: string }
  | { type: "cosmetic"; kind: CosmeticId; amount: 1; label: string }
  | { type: "theme"; kind: ThemeId; amount: 1; label: string };

export function progressReward(level: number): ProgressReward {
  const milestones: Record<number, ProgressReward> = {
    1: { type: "buff", kind: "food", amount: 3, label: "Корм ×3" },
    2: { type: "item", kind: "hat", amount: 1, label: "Доступ к тюбетейке" },
    3: { type: "case", kind: "common", amount: 1, label: "Обычный кейс" },
    4: { type: "item", kind: "mohawk", amount: 1, label: "Доступ к эрокезу" },
    5: { type: "theme", kind: "soda", amount: 1, label: "Доступ к Небесному" },
    8: { type: "cosmetic", kind: "bandana", amount: 1, label: "Доступ к платку" },
    12: { type: "theme", kind: "mint", amount: 1, label: "Доступ к Хамаму" },
    15: { type: "cosmetic", kind: "charm", amount: 1, label: "Доступ к ошейнику" },
    20: { type: "theme", kind: "night", amount: 1, label: "Доступ к Ночному" },
    24: { type: "case", kind: "big", amount: 2, label: "Большой кейс ×2" },
    100: { type: "case", kind: "big", amount: 5, label: "Большой кейс ×5" },
  };
  if (milestones[level]) return milestones[level];
  if (level % 10 === 0) return { type: "case", kind: "big", amount: 1, label: "Большой кейс" };
  if (level % 5 === 0) return { type: "upgrade", kind: level % 2 ? "hat" : "mohawk", amount: 1, label: level % 2 ? "Улучшение тюбетейки" : "Улучшение эрокеза" };
  if (level % 3 === 0) return { type: "coins", amount: 75 + level * 35, label: `${75 + level * 35} KC` };
  if (level % 2 === 0) return { type: "case", kind: "common", amount: 1 + Math.floor(level / 40), label: `Обычный кейс ×${1 + Math.floor(level / 40)}` };
  const kinds = ["drink", "pitbull", "cola", "tea", "shield"] as const;
  const kind = kinds[Math.floor(level / 2) % kinds.length];
  const names = { drink: "Живчик", pitbull: "Питбуль", cola: "Какао", tea: "Бергамот", shield: "Пепси" };
  const amount = 1 + Math.floor(level / 25);
  return { type: "buff", kind, amount, label: `${names[kind]} ×${amount}` };
}

export function sanitizeClaimedRewards(value: unknown): number[] {
  return Array.isArray(value) ? [...new Set(value.filter((level): level is number => Number.isInteger(level) && level >= 1 && level <= MAX_LEVEL))] : [];
}
