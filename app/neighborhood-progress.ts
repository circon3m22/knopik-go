export type NeighborhoodProgress = { quest: 0 | 1 | 2 | 3; pebble: boolean; secret: boolean };
export function defaultNeighborhoodProgress(): NeighborhoodProgress { return { quest: 0, pebble: false, secret: false }; }
export function sanitizeNeighborhoodProgress(value: unknown): NeighborhoodProgress {
  if (!value || typeof value !== "object") return defaultNeighborhoodProgress();
  const v = value as Partial<NeighborhoodProgress>;
  return { quest: typeof v.quest === "number" && Number.isFinite(v.quest) ? Math.max(0, Math.min(3, Math.floor(v.quest))) as NeighborhoodProgress["quest"] : 0, pebble: v.pebble === true, secret: v.secret === true };
}
