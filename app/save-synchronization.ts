import { SAVE_VERSION, sanitizeSave, type SaveData } from "./game-logic.ts";

export type PendingProgress = {
  save: SaveData;
  baseRevision: number;
  savedAt: number;
  attempt?: {save:SaveData;revision:number;sourceId:string};
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
  serverSourceId?: string | null,
): RecoveryDecision {
  if (!pending || sameSave(pending.save, serverSave)) return "cloud";
  if (pending.baseRevision === serverRevision) return "pending";
  const attempt = pending.attempt;
  if (attempt && serverSourceId === attempt.sourceId && attempt.revision === pending.baseRevision && acknowledgedSave(
    {revision:serverRevision,source_id:attempt.sourceId,save:serverSave},
    attempt.revision,attempt.sourceId,attempt.save,
  )) return "pending";
  return "conflict";
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
