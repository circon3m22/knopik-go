export const BRAINROT_KINDS = ["tralalero", "ballerina", "bombardiro", "verity"] as const;
export type BrainrotKind = typeof BRAINROT_KINDS[number];
export type DrinkGameKind = "lime" | "matcha" | BrainrotKind;
export type BrainrotInventory = Record<BrainrotKind, number>;
export type BrainrotStats = Record<BrainrotKind, { plays: number; best: number }>;
export const createBrainrotInventory = (): BrainrotInventory => ({ tralalero: 0, ballerina: 0, bombardiro: 0, verity: 0 });
export const createBrainrotStats = (): BrainrotStats => ({ tralalero: { plays: 0, best: 0 }, ballerina: { plays: 0, best: 0 }, bombardiro: { plays: 0, best: 0 }, verity: { plays: 0, best: 0 } });
export function isBrainrotKind(kind: DrinkGameKind): kind is BrainrotKind { return BRAINROT_KINDS.some(value => value === kind); }

export const DRINK_GAMES = {
  lime: { name: "Лайм", title: "Точный бросок", price: 40, maximumReward: 120 },
  matcha: { name: "Матча", title: "Помни вкус", price: 60, maximumReward: 160 },
  tralalero: { name: "Тралалеро", title: "Кроссовки в море", price: 1500, maximumReward: 4500 },
  ballerina: { name: "Балерина", title: "Каппучино в ритм", price: 2500, maximumReward: 7500 },
  bombardiro: { name: "Бомбардиро", title: "Арбузный налёт", price: 4000, maximumReward: 12000 },
  verity: { name: "Верити", title: "Комната глитча", price: 6000, maximumReward: 18000 },
} as const;

export const LIME_ROUNDS = 25;
export const MEMORY_ROUNDS = 25;
export const MEMORY_INITIAL_LENGTH = 5;
export const LIME_MAX_SCORE = LIME_ROUNDS * 100;
export const LIME_WINDOW_MS = 3_600;

export function memorySequenceLength(round: number): number {
  return MEMORY_INITIAL_LENGTH + Math.min(MEMORY_ROUNDS - 1, Math.max(0, Math.floor(round)));
}

export function memoryFlashTiming(round: number) {
  return { on: Math.max(240, 520 - round * 12), gap: Math.max(100, 180 - round * 3) };
}

export function limeRoundWindow(round: number): number {
  return Math.max(2_200, LIME_WINDOW_MS - Math.max(0, round) * 65);
}

// A triangle wave keeps the cursor inside the track, independent of frame rate.
export function limePosition(elapsed: number, round: number): number {
  const period = Math.max(590, 1_100 - Math.max(0, round) * 22);
  // Reverse every second throw; a fresh level cannot be played from muscle memory alone.
  const phase = ((Math.max(0, elapsed) + (round % 2 ? period / 2 : 0)) % period) / period;
  return (phase <= .5 ? phase * 2 : (1 - phase) * 2) * 100;
}

export function limeTarget(round: number, random: () => number = Math.random) {
  return { center: 24 + Math.min(.999999, Math.max(0, random())) * 52, width: Math.max(7, 14 - round * .3) };
}

export function limeTargetCenter(elapsed: number, round: number, center: number): number {
  if (round < 5) return center;
  const amplitude = Math.min(14, 5 + (round - 5) * .45);
  return Math.min(87, Math.max(13, center + Math.sin(Math.max(0, elapsed) / (500 - round * 7) + round) * amplitude));
}

export function scoreLime(position: number, center: number, width: number): number {
  if (![position, center, width].every(Number.isFinite) || width <= 0) return 0;
  const distance = Math.abs(position - center) / (width / 2);
  return distance > 1 ? 0 : Math.round(25 + 75 * (1 - distance));
}

export function limeReward(scores: readonly number[]): number {
  const total = scores.slice(0, LIME_ROUNDS).reduce((sum, score) => sum + (Number.isFinite(score) ? Math.min(100, Math.max(0, score)) : 0), 0);
  return Math.floor(total / (LIME_ROUNDS * 100) * DRINK_GAMES.lime.maximumReward);
}

export function createMemorySequence(random: () => number = Math.random): number[] {
  const sequence: number[] = [];
  for (let i = 0; i < memorySequenceLength(MEMORY_ROUNDS - 1); i++) {
    const roll = Math.min(.999999, Math.max(0, random()));
    // Neighbouring flashes differ, so there is always a clear visual boundary.
    const previous = sequence[i - 1];
    const pick = Math.floor(roll * (i === 0 ? 9 : 8));
    sequence.push(i === 0 || pick < previous ? pick : pick + 1);
  }
  return sequence;
}

export function memoryReward(completedRounds: number): number {
  const completed = Math.min(MEMORY_ROUNDS, Math.max(0, Math.floor(Number.isFinite(completedRounds) ? completedRounds : 0)));
  return Math.floor(DRINK_GAMES.matcha.maximumReward * Math.pow(completed / MEMORY_ROUNDS, 1.2));
}

// The parent owns this ledger: a panel callback can consume and settle only once.
export type DrinkRoundLedger = { kind: DrinkGameKind; phase: "ready" | "playing" | "settled"; bet?:number };

export function commitDrinkRound(ledger: DrinkRoundLedger, count: number): boolean {
  if (ledger.phase !== "ready" || !Number.isFinite(count) || count < 1) return false;
  ledger.phase = "playing";
  return true;
}

export function settleDrinkRound(ledger: DrinkRoundLedger, kind: DrinkGameKind, requestedReward: number): number | null {
  if (ledger.phase !== "playing" || ledger.kind !== kind) return null;
  ledger.phase = "settled";
  return Number.isFinite(requestedReward) ? Math.min(DRINK_GAMES[kind].maximumReward, Math.max(0, Math.floor(requestedReward))) : 0;
}
