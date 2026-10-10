export type DrinkGameKind = "lime" | "matcha";

export const DRINK_GAMES = {
  lime: { name: "Лайм", title: "В самый сок", price: 40, maximumReward: 120 },
  matcha: { name: "Матча", title: "Помни вкус", price: 60, maximumReward: 160 },
} as const;

export const LIME_ROUNDS = 5;
export const MEMORY_ROUNDS = 5;
export const LIME_WINDOW_MS = 5_000;

// A triangle wave keeps the cursor inside the track, independent of frame rate.
export function limePosition(elapsed: number, round: number): number {
  const period = Math.max(1_200, 2_000 - Math.max(0, round) * 170);
  const phase = (Math.max(0, elapsed) % period) / period;
  return (phase <= .5 ? phase * 2 : (1 - phase) * 2) * 100;
}

export function limeTarget(round: number, random: () => number = Math.random) {
  return { center: 30 + Math.min(.999999, Math.max(0, random())) * 40, width: Math.max(18, 30 - round * 3) };
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
  for (let i = 0; i < MEMORY_ROUNDS + 1; i++) {
    const roll = Math.min(.999999, Math.max(0, random()));
    // Neighbouring flashes differ, so there is always a clear visual boundary.
    const previous = sequence[i - 1];
    const pick = Math.floor(roll * (i === 0 ? 9 : 8));
    sequence.push(i === 0 || pick < previous ? pick : pick + 1);
  }
  return sequence;
}

export function memoryReward(completedRounds: number): number {
  const rewards = [0, 15, 40, 70, 110, 160];
  return rewards[Math.min(MEMORY_ROUNDS, Math.max(0, Math.floor(Number.isFinite(completedRounds) ? completedRounds : 0)))];
}

// The parent owns this ledger: a panel callback can consume and settle only once.
export type DrinkRoundLedger = { kind: DrinkGameKind; phase: "ready" | "playing" | "settled" };

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
