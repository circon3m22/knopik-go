import { SAVE_VERSION, sanitizeSave, type SaveData } from "./game-logic.ts";

export type PendingProgress = {
  save: SaveData;
  baseRevision: number;
  savedAt: number;
};

export type RecoveryDecision = "cloud" | "pending" | "conflict";

export function hasUnsupportedSaveVersion(save: unknown): boolean {
  if (!save || typeof save !== "object" || Array.isArray(save)) return true;
  const value = (save as { version?: unknown }).version;
  return !Number.isSafeInteger(value) || Number(value) < 1 || Number(value) > SAVE_VERSION;
}

export function sameSave(a: unknown, b: unknown): boolean {
  return JSON.stringify(sanitizeSave(a)) === JSON.stringify(sanitizeSave(b));
}

export function chooseRecovery(
  serverSave: unknown,
  serverRevision: number,
  pending: PendingProgress | null,
): RecoveryDecision {
  if (!pending || sameSave(pending.save, serverSave)) return "cloud";
  return pending.baseRevision === serverRevision ? "pending" : "conflict";
}

/** The server RPC returns its current row even when CAS fails. */
export function acknowledgedSave(
  row: { revision: number; source_id: string | null; save: unknown },
  expectedRevision: number,
  sourceId: string,
  sentSave: unknown,
): boolean {
  return Number(row.revision) === expectedRevision + 1 &&
    row.source_id === sourceId &&
    sameSave(row.save, sentSave);
}
