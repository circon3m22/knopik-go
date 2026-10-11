export const CLOTHING_UNLOCK_LEVELS = { hat: 2, mohawk: 4, bandana: 8, charm: 15 } as const;
export const COSMETICS = {
  bandana: { name: "Платок", price: 5000, unlockLevel: CLOTHING_UNLOCK_LEVELS.bandana, copy: "Кнопик отдыхает на 20% быстрее. Можно носить вместе с головным убором." },
  charm: { name: "Золотой ошейник", price: 750, unlockLevel: CLOTHING_UNLOCK_LEVELS.charm, copy: "В погоне притягивает монеты с соседних полос и спасает от одного столкновения за забег. Магнит работает весь забег." },
} as const;
export type CosmeticId = keyof typeof COSMETICS;

export const THEMES = {
  classic: { name: "Классика", price: 0, unlockLevel: 0, rgb: [247, 249, 252], copy: "Тот самый Кнопик. Чистый светлый экран." },
  soda: { name: "Небесный", price: 10000, unlockLevel: 5, rgb: [224, 242, 251], copy: "Облака и пузырьки под настроение Кнопика." },
  mint: { name: "Хамам", price: 20000, unlockLevel: 12, rgb: [234, 241, 237], copy: "Мрамор, мягкий пар и свет под настроение Кнопика." },
  night: { name: "Ночной", price: 30000, unlockLevel: 20, rgb: [21, 36, 53], copy: "Луна и облака под настроение Кнопика." },
  bath: { name: "Турецкая баня", price: 60000, unlockLevel: 32, rgb: [210, 189, 160], copy: "Тёплый мрамор, мозаика и пар." },
  emerald: { name: "Изумруд", price: 250000, unlockLevel: 75, rgb: [18, 53, 47], copy: "Редкие кристаллы с переливающимися гранями." },
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

export function cosmeticFatigueMultiplier(equipped: CosmeticId | null, level = 1): number { return equipped === "bandana" ? .8 - (Math.min(5,Math.max(1,level))-1)*.08 : 1; }
export function cosmeticUpgradePrice(level:number):number { return level >= 5 ? 0 : Math.min(4,Math.max(1,Math.floor(level)))*2500; }
export function cosmeticEffect(kind:CosmeticId, level:number):string {
  return kind === "bandana" ? `Отдых на ${Math.round((1-cosmeticFatigueMultiplier(kind,level))*100)}% быстрее. Можно носить с головным убором.` : `Магнит с радиусом ${6+level-1} м и ${1+Math.floor((level-1)/2)} спасения за забег. Улучшения расширяют охват магнита.`;
}

export function sanitizeCosmetics(value: unknown): CosmeticId[] {
  return Array.isArray(value) ? [...new Set(value.filter((id): id is CosmeticId => id === "bandana" || id === "charm"))] : [];
}
export function sanitizeThemes(value: unknown): ThemeId[] {
  return ["classic", ...new Set(Array.isArray(value) ? value.filter((id): id is Exclude<ThemeId, "classic"> => typeof id === "string" && id !== "classic" && Object.hasOwn(THEMES,id)) : [])];
}
