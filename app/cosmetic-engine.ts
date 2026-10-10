export const COSMETICS = {
  bandana: { name: "Платок тихони", price: 500, copy: "Кнопик отдыхает на 20% быстрее. Можно носить вместе с головным убором." },
  charm: { name: "Ошейник с жетоном", price: 750, copy: "+10% Knopik Coin за игры «Лайм» и «Матча». Можно носить вместе с головным убором." },
} as const;
export type CosmeticId = keyof typeof COSMETICS;

export const THEMES = {
  classic: { name: "Классика", price: 0, rgb: [247, 249, 252], copy: "Тот самый Кнопик. Чистый светлый экран." },
  soda: { name: "Небесный", price: 250, rgb: [224, 242, 251], copy: "Облака и пузырьки под настроение Кнопика." },
  mint: { name: "Хамам", price: 300, rgb: [234, 241, 237], copy: "Мрамор, мягкий пар и свет под настроение Кнопика." },
  night: { name: "Ночной", price: 400, rgb: [21, 36, 53], copy: "Луна и облака под настроение Кнопика." },
} as const;
export type ThemeId = keyof typeof THEMES;

export type ThemeMood = "calm" | "blue" | "yellow" | "red";
export function themeMood(state: string, recoveryReason: string, hasFatigue: boolean): Exclude<ThemeMood, "blue"> {
  if (state === "angry" || (state === "recovering" && recoveryReason === "bite")) return "red";
  if (state === "tired" || state === "warning" || (state === "recovering" && hasFatigue)) return "yellow";
  return "calm";
}


export function spendBalance(wallet: number, vault: number, price: number, source: "active" | "vault") {
  if (![wallet, vault, price].every(Number.isSafeInteger) || wallet < 0 || vault < 0 || price < 0) return null;
  if ((source === "active" ? wallet : vault) < price) return null;
  return { walletCoins: wallet - (source === "active" ? price : 0), vaultCoins: vault - (source === "vault" ? price : 0) };
}

export function cosmeticFatigueMultiplier(equipped: CosmeticId | null): number { return equipped === "bandana" ? .8 : 1; }
export function cosmeticGameReward(base: number, equipped: CosmeticId | null): number { return Math.floor(base * (equipped === "charm" ? 1.1 : 1)); }

export function sanitizeCosmetics(value: unknown): CosmeticId[] {
  return Array.isArray(value) ? [...new Set(value.filter((id): id is CosmeticId => id === "bandana" || id === "charm"))] : [];
}
export function sanitizeThemes(value: unknown): ThemeId[] {
  return ["classic", ...new Set(Array.isArray(value) ? value.filter((id): id is Exclude<ThemeId, "classic"> => id === "soda" || id === "mint" || id === "night") : [])];
}
