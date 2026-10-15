import { canAccessKnopikGo } from "./go-access.ts";
import { clampDifficulty } from "./difficulty-engine.ts";
export const OFFLINE_ACCOUNT_KEY = "knopik-go:offline-account:v1";
export type OfflineAccount = { userId: string; username: string; isAdmin: boolean; revision: number; difficulty: number; verifiedAt: number };

/** Local identity restores this device only; Supabase independently checks every write. */
export function parseOfflineAccount(raw: string | null): OfflineAccount | null {
  try {
    const value = JSON.parse(raw ?? "null");
    if (!value || !canAccessKnopikGo(value.userId) || typeof value.username !== "string" || !Number.isSafeInteger(value.revision) || value.revision < 0 || typeof value.verifiedAt !== "number" || value.verifiedAt <= 0) return null;
    return {userId:value.userId,username:value.username,isAdmin:value.isAdmin===true,revision:value.revision,difficulty:clampDifficulty(value.difficulty),verifiedAt:value.verifiedAt};
  } catch { return null; }
}
export function readOfflineAccount(): OfflineAccount | null {
  try { return parseOfflineAccount(localStorage.getItem(OFFLINE_ACCOUNT_KEY)); } catch { return null; }
}
export function rememberOfflineAccount(account: {userId:string;username:string;isAdmin:boolean}, revision:number, difficulty:number) {
  try { localStorage.setItem(OFFLINE_ACCOUNT_KEY,JSON.stringify({...account,revision,difficulty,verifiedAt:Date.now()})); } catch { /* Gameplay still keeps its in-memory save. */ }
}
export function forgetOfflineAccount() {
  try { localStorage.removeItem(OFFLINE_ACCOUNT_KEY); } catch { /* No storage in private browsers. */ }
}
export function deviceIsOffline() { return typeof navigator !== "undefined" && navigator.onLine === false; }
