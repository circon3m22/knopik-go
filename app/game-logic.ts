import { defaultCombatTraining,sanitizeCombatTraining,type CombatTraining } from "./adventure-training.ts";
import { defaultLaboratory,sanitizeLaboratory,type LaboratoryProgress } from "./laboratory-engine.ts";
import { BUFF_CATALOG } from "./buff-shelf-engine.ts";
import { sanitizeRunnerGraphics, type RunnerGraphicsMode } from "./runner-frame-budget.ts";
import { sanitizeCosmetics, sanitizeThemes, type CosmeticId, type ThemeId } from "./cosmetic-engine.ts";
import { LIME_MAX_SCORE, MEMORY_ROUNDS, BRAINROT_KINDS, createBrainrotInventory, createBrainrotStats, type BrainrotInventory, type BrainrotStats } from "./drink-game-engine.ts";
import { MAX_LEVEL, sanitizeLevelState } from "./level-engine.ts";
import { sanitizeClaimedRewards } from "./progress-engine.ts";
import { sanitizeStoryCheckpoint } from "./adventure-engine.ts";
import { sanitizeCompletedLevel, sanitizeWeaponTier } from "./adventure-levels.ts";
import { defaultNeighborhoodProgress, sanitizeNeighborhoodProgress, type NeighborhoodProgress } from "./neighborhood-progress.ts";

export type DogState = "calm" | "tired" | "warning" | "angry" | "recovering";

export type CoinState = {
  walletCoins: number;
  streakCoins: number;
};

export type GameSettings = {
  graphics: RunnerGraphicsMode;
  sound: boolean;
  vibration: boolean;
  suliman: boolean;
  yellow: boolean;
};

export type GameStats = {
  bestStreak: number;
  totalTaps: number;
  totalBites: number;
};

export type SaveData = {
  version: typeof SAVE_VERSION;
  neighborhood: NeighborhoodProgress;
  laboratory: LaboratoryProgress;
  combatTraining: CombatTraining;
  storyCheckpoint: number;
  storyCompletedLevel: number;
  storyWeaponTier: number;
  vaultCoins: number;
  walletCoins: number;
  foodCount: number;
  healCount: number;
  drinkCount: number;
  pitbullCount: number;
  colaCount: number;
  teaCount: number;
  ownedCosmetics: CosmeticId[];
  equippedCosmetic: CosmeticId | null;
  cosmeticLevels: Record<CosmeticId,number>;
  ownedThemes: ThemeId[];
  activeTheme: ThemeId;
  limeCount: number;
  matchaCount: number;
  limePlays: number;
  matchaPlays: number;
  limeBest: number;
  matchaBest: number;
  brainrotInventory: BrainrotInventory;
  brainrotStats: BrainrotStats;
  runnerBest: number;
  runnerRuns: number;
  runnerCoins: number;
  vitaPowerCount: number;
  vitaPowerShield: boolean;
  hatOwned: boolean;
  hatEquipped: boolean;
  mohawkOwned: boolean;
  mohawkEquipped: boolean;
  hatLevel: number;
  mohawkLevel: number;
  hatUpgradeTokens: number;
  mohawkUpgradeTokens: number;
  commonCases: number;
  bigCases: number;
  questIndex: number;
  earInteractionCount: number;
  hatInteractionCount: number;
  mohawkInteractionCount: number;
  hasbulaRedeemed: boolean;
  riskFatigueUntil: number;
  riskSpins: number;
  riskWins: number;
  riskLosses: number;
  slotPlays: number;
  slotWins: number;
  minePlays: number;
  mineWins: number;
  mineLosses: number;
  lastRiskBet: number;
  lastRiskChance: number;
  boostUntil: number;
  settings: GameSettings;
  tutorialSeen: boolean;
  bestStreak: number;
  totalTaps: number;
  totalBites: number;
  ultraFatigueUntil: number;
  level: number;
  levelCoins: number;
  lifetimeCoins: number;
  claimedLevelRewards: number[];
};

export const SAVE_KEY = "knopik-go:save";
export const SAVE_VERSION = 30 as const;

export function createDefaultSave(): SaveData {
  return {
    version: SAVE_VERSION,
    neighborhood: defaultNeighborhoodProgress(),
    laboratory: defaultLaboratory(),
    combatTraining: defaultCombatTraining(),
    storyCheckpoint: 0,
    storyCompletedLevel: 0,
    storyWeaponTier: 0,
    vaultCoins: 0,
    walletCoins: 0,
    foodCount: 0,
    healCount: 0,
    drinkCount: 0,
    pitbullCount: 0,
    colaCount: 0,
    teaCount: 0,
    ownedCosmetics: [],
    equippedCosmetic: null,
    cosmeticLevels: {bandana:1,charm:1,goggles:1,cape:1},
    ownedThemes: ["classic"],
    activeTheme: "classic",
    limeCount: 0,
    matchaCount: 0,
    limePlays: 0,
    matchaPlays: 0,
    limeBest: 0,
    matchaBest: 0,
    brainrotInventory: createBrainrotInventory(),
    brainrotStats: createBrainrotStats(),
    runnerBest: 0,
    runnerRuns: 0,
    runnerCoins: 0,
    vitaPowerCount: 0,
    vitaPowerShield: false,
    hatOwned: false,
    hatEquipped: false,
    mohawkOwned: false,
    mohawkEquipped: false,
    hatLevel: 1,
    mohawkLevel: 1,
    hatUpgradeTokens: 0,
    mohawkUpgradeTokens: 0,
    commonCases: 0,
    bigCases: 0,
    questIndex: 0,
    earInteractionCount: 0,
    hatInteractionCount: 0,
    mohawkInteractionCount: 0,
    hasbulaRedeemed: false,
    riskFatigueUntil: 0,
    riskSpins: 0,
    riskWins: 0,
    riskLosses: 0,
    slotPlays: 0,
    slotWins: 0,
    minePlays: 0,
    mineWins: 0,
    mineLosses: 0,
    lastRiskBet: 0,
    lastRiskChance: 50,
    boostUntil: 0,
    settings: { sound: true, vibration: true, suliman: false, yellow: false, graphics: "auto" },
    tutorialSeen: false,
    bestStreak: 0,
    totalTaps: 0,
    totalBites: 0,
    ultraFatigueUntil: 0,
    level: 0,
    levelCoins: 0,
    lifetimeCoins: 0,
    claimedLevelRewards: [],
  };
}

function safeInteger(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  return Math.min(Number.MAX_SAFE_INTEGER, Math.max(0, Math.floor(value)));
}

function legacyVaultCoins(value: unknown): number {
  if (!Array.isArray(value)) return 0;
  return safeInteger(
    value.slice(0, 500).reduce((total, item) => {
      if (!item || typeof item !== "object") return total;
      return total + safeInteger((item as { stored?: unknown }).stored);
    }, 0),
  );
}

function safeRiskChance(value: unknown): number {
  const chance = safeInteger(value);
  return chance >= 10 && chance <= 90 && chance % 10 === 0 ? chance : 50;
}

export function sanitizeSave(value: unknown): SaveData {
  if (!value || typeof value !== "object") return createDefaultSave();

  const candidate = value as Omit<Partial<SaveData>, "version"> & {
    version?: unknown;
    bankCoins?: unknown;
    walletCoins?: unknown;
    safes?: unknown;
    sound?: unknown;
    vibration?: unknown;
    suliman?: unknown;
    yellow?: unknown;
  };
  const settings =
    candidate.settings && typeof candidate.settings === "object"
      ? candidate.settings
      : {
          sound: candidate.sound,
          vibration: candidate.vibration,
          suliman: candidate.suliman,
          yellow: candidate.yellow,
          graphics: undefined,
        };
  const version = safeInteger(candidate.version);
  const isVersion = (minimum: number) =>
    version >= minimum && version <= SAVE_VERSION;

  const ownedCosmetics = isVersion(15) ? sanitizeCosmetics(candidate.ownedCosmetics) : [];
  const ownedThemes = isVersion(15) ? sanitizeThemes(candidate.ownedThemes) : ["classic"] as ThemeId[];
  const levelState = sanitizeLevelState({
    level: isVersion(4) ? Math.min(MAX_LEVEL, safeInteger(candidate.level)) : 0,
    progressCoins: isVersion(4) ? safeInteger(candidate.levelCoins) : 0,
    lifetimeCoins: isVersion(17) ? safeInteger(candidate.lifetimeCoins) : 0,
  });
  const brainrotInventory = createBrainrotInventory(), brainrotStats = createBrainrotStats();
  for (const kind of BRAINROT_KINDS) {
    if (!isVersion(20)) continue;
    brainrotInventory[kind] = Math.min(25, safeInteger(candidate.brainrotInventory?.[kind]));
    brainrotStats[kind] = { plays: safeInteger(candidate.brainrotStats?.[kind]?.plays), best: Math.min(1000, safeInteger(candidate.brainrotStats?.[kind]?.best)) };
  }
  const oldHeal=isVersion(22)?Math.min(25,safeInteger(candidate.healCount)):0,oldPepsi=isVersion(13)?Math.min(25,safeInteger(candidate.vitaPowerCount)):0;
  // Preserve the paid value of legacy stock when reducing the bag to three.
  const stockRefund=version<28?Math.max(0,oldHeal-3)*BUFF_CATALOG.heal.price+Math.max(0,oldPepsi-3)*BUFF_CATALOG.pepsi.price:0;
  return {
    brainrotInventory,
    laboratory: isVersion(30)?sanitizeLaboratory(candidate.laboratory):defaultLaboratory(),
    combatTraining: sanitizeCombatTraining(isVersion(30)?candidate.combatTraining:undefined,Math.max(sanitizeCompletedLevel(candidate.storyCompletedLevel),sanitizeStoryCheckpoint(candidate.storyCheckpoint)>=3?1:0)),
    neighborhood: isVersion(24) ? sanitizeNeighborhoodProgress(candidate.neighborhood) : defaultNeighborhoodProgress(),
    storyCheckpoint: isVersion(21) ? sanitizeStoryCheckpoint(candidate.storyCheckpoint) : 0,
    storyCompletedLevel: isVersion(23) ? Math.max(Math.min(isVersion(26)?25:5,sanitizeCompletedLevel(candidate.storyCompletedLevel)), sanitizeStoryCheckpoint(candidate.storyCheckpoint)>=3?1:0) : isVersion(21) && sanitizeStoryCheckpoint(candidate.storyCheckpoint)>=3 ? 1 : 0,
    storyWeaponTier: isVersion(23) ? Math.min(isVersion(26)?5:2,sanitizeWeaponTier(candidate.storyWeaponTier)) : 0,
    brainrotStats,
    ownedCosmetics,
    equippedCosmetic: candidate.equippedCosmetic && ownedCosmetics.includes(candidate.equippedCosmetic) ? candidate.equippedCosmetic : null,
    cosmeticLevels: {
      goggles:1,cape:1,
      bandana: ownedCosmetics.includes("bandana") ? Math.min(5,Math.max(1,safeInteger(candidate.cosmeticLevels?.bandana))) : 1,
      charm: ownedCosmetics.includes("charm") ? Math.min(5,Math.max(1,safeInteger(candidate.cosmeticLevels?.charm))) : 1,
    },
    ownedThemes,
    activeTheme: candidate.activeTheme && ownedThemes.includes(candidate.activeTheme) ? candidate.activeTheme : "classic",
    version: SAVE_VERSION,
    vaultCoins:
      isVersion(5)
        ? safeInteger(candidate.vaultCoins)
        : version >= 2 && version <= 4
          ? legacyVaultCoins(candidate.safes)
          : safeInteger(candidate.bankCoins),
    walletCoins:
      isVersion(7)
        ? Math.min(Number.MAX_SAFE_INTEGER,safeInteger(candidate.walletCoins)+stockRefund)
        : 0,
    foodCount:
      isVersion(6)
        ? Math.min(25, safeInteger(candidate.foodCount))
        : 0,
    healCount: isVersion(22) ? Math.min(3, safeInteger(candidate.healCount)) : 0,
    drinkCount:
      isVersion(8) ? Math.min(25, safeInteger(candidate.drinkCount)) : 0,
    pitbullCount:
      isVersion(9) ? Math.min(25, safeInteger(candidate.pitbullCount)) : 0,
    colaCount:
      isVersion(12) ? Math.min(25, safeInteger(candidate.colaCount)) : 0,
    teaCount:
      isVersion(12) ? Math.min(25, safeInteger(candidate.teaCount)) : 0,
    limeCount: isVersion(15) ? Math.min(25, safeInteger(candidate.limeCount)) : 0,
    matchaCount: isVersion(15) ? Math.min(25, safeInteger(candidate.matchaCount)) : 0,
    limePlays: isVersion(15) ? safeInteger(candidate.limePlays) : 0,
    matchaPlays: isVersion(15) ? safeInteger(candidate.matchaPlays) : 0,
    limeBest: isVersion(15) ? Math.min(LIME_MAX_SCORE, safeInteger(candidate.limeBest)) : 0,
    matchaBest: isVersion(15) ? Math.min(MEMORY_ROUNDS, safeInteger(candidate.matchaBest)) : 0,
    vitaPowerCount:
      isVersion(13) ? Math.min(3, safeInteger(candidate.vitaPowerCount)) : 0,
    vitaPowerShield:
      isVersion(13) && candidate.vitaPowerShield === true,
    hatOwned:
      isVersion(6) &&
      typeof candidate.hatOwned === "boolean"
        ? candidate.hatOwned
        : false,
    hatEquipped:
      isVersion(6) &&
      candidate.hatOwned === true &&
      !(isVersion(10) && candidate.mohawkOwned === true && candidate.mohawkEquipped !== false)
        ? candidate.hatEquipped !== false
        : false,
    mohawkOwned:
      isVersion(10) && typeof candidate.mohawkOwned === "boolean"
        ? candidate.mohawkOwned
        : false,
    mohawkEquipped:
      isVersion(10) && candidate.mohawkOwned === true
        ? candidate.mohawkEquipped !== false
        : false,
    hatLevel:
      isVersion(14) && candidate.hatOwned === true
        ? Math.min(5, Math.max(1, safeInteger(candidate.hatLevel)))
        : 1,
    mohawkLevel:
      isVersion(14) && candidate.mohawkOwned === true
        ? Math.min(5, Math.max(1, safeInteger(candidate.mohawkLevel)))
        : 1,
    hatUpgradeTokens:
      isVersion(14) ? Math.min(99, safeInteger(candidate.hatUpgradeTokens)) : 0,
    mohawkUpgradeTokens:
      isVersion(14) ? Math.min(99, safeInteger(candidate.mohawkUpgradeTokens)) : 0,
    commonCases:
      isVersion(14) ? Math.min(99, safeInteger(candidate.commonCases)) : 0,
    bigCases:
      isVersion(14) ? Math.min(99, safeInteger(candidate.bigCases)) : 0,
    questIndex:
      isVersion(14) ? Math.min(8, safeInteger(candidate.questIndex)) : 0,
    earInteractionCount:
      isVersion(15) ? safeInteger(candidate.earInteractionCount) : 0,
    hatInteractionCount:
      isVersion(15) ? safeInteger(candidate.hatInteractionCount) : 0,
    mohawkInteractionCount:
      isVersion(15) ? safeInteger(candidate.mohawkInteractionCount) : 0,
    hasbulaRedeemed:
      isVersion(11) && candidate.hasbulaRedeemed === true,
    riskFatigueUntil:
      isVersion(7)
        ? safeInteger(candidate.riskFatigueUntil)
        : 0,
    riskSpins: isVersion(7) ? safeInteger(candidate.riskSpins) : 0,
    riskWins: isVersion(7) ? safeInteger(candidate.riskWins) : 0,
    riskLosses: isVersion(7) ? safeInteger(candidate.riskLosses) : 0,
    slotPlays: isVersion(12) ? safeInteger(candidate.slotPlays) : 0,
    slotWins: isVersion(12) ? safeInteger(candidate.slotWins) : 0,
    minePlays: isVersion(12) ? safeInteger(candidate.minePlays) : 0,
    mineWins: isVersion(12) ? safeInteger(candidate.mineWins) : 0,
    mineLosses: isVersion(12) ? safeInteger(candidate.mineLosses) : 0,
    runnerBest: isVersion(18) ? safeInteger(candidate.runnerBest) : 0,
    runnerRuns: isVersion(18) ? safeInteger(candidate.runnerRuns) : 0,
    runnerCoins: isVersion(18) ? safeInteger(candidate.runnerCoins) : 0,
    lastRiskBet:
      isVersion(7) ? safeInteger(candidate.lastRiskBet) : 0,
    lastRiskChance:
      isVersion(7) ? safeRiskChance(candidate.lastRiskChance) : 50,
    boostUntil:
      isVersion(8) ? safeInteger(candidate.boostUntil) : 0,
    settings: {
      graphics: sanitizeRunnerGraphics(settings.graphics),
      sound:
        typeof settings.sound === "boolean" ? settings.sound : true,
      vibration:
        typeof settings.vibration === "boolean" ? settings.vibration : true,
      suliman:
        typeof settings.suliman === "boolean" ? settings.suliman : false,
      yellow:
        isVersion(10) && typeof settings.yellow === "boolean"
          ? settings.yellow
          : false,
    },
    tutorialSeen:
      isVersion(4) &&
      typeof candidate.tutorialSeen === "boolean"
        ? candidate.tutorialSeen
        : false,
    bestStreak: safeInteger(candidate.bestStreak),
    totalTaps: safeInteger(candidate.totalTaps),
    totalBites: safeInteger(candidate.totalBites),
    ultraFatigueUntil:
      isVersion(3)
        ? safeInteger(candidate.ultraFatigueUntil)
        : 0,
    level: levelState.level,
    levelCoins: levelState.progressCoins,
    lifetimeCoins: levelState.lifetimeCoins,
    claimedLevelRewards: isVersion(17) ? sanitizeClaimedRewards(candidate.claimedLevelRewards).filter(level => level <= levelState.level) : [],
  };
}

function randomInteger(
  minimum: number,
  maximum: number,
  random: () => number,
): number {
  const normalized = Math.min(0.999999999, Math.max(0, random()));
  return Math.floor(normalized * (maximum - minimum + 1)) + minimum;
}

export function pickBasePatience(random: () => number = Math.random): number {
  const roll = Math.min(0.999999999, Math.max(0, random()));

  if (roll < 0.08) return randomInteger(5, 9, random);
  if (roll < 0.75) return randomInteger(10, 50, random);
  if (roll < 0.95) return randomInteger(51, 80, random);
  return randomInteger(81, 100, random);
}

export function recoveryBonus(
  restMilliseconds: number,
  random: () => number = Math.random,
): number {
  const rest = Math.max(0, restMilliseconds);
  if (rest < 1_000) return 0;
  if (rest < 2_000) return randomInteger(0, 1, random);
  if (rest < 4_000) return randomInteger(2, 4, random);
  if (rest < 7_000) return randomInteger(6, 10, random);
  if (rest < 11_000) return randomInteger(12, 18, random);
  return randomInteger(20, 28, random);
}

export function createPatience(
  restMilliseconds: number,
  random: () => number = Math.random,
): number {
  return Math.min(
    128,
    pickBasePatience(random) + recoveryBonus(restMilliseconds, random),
  );
}

export function tapFatigue(random: () => number = Math.random): number {
  return 0.92 + Math.min(0.999999999, Math.max(0, random())) * 0.18;
}
