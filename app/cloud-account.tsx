"use client";
import {loginFailureMessage} from './login-error';
import { deviceIsOffline, readOfflineAccount, rememberOfflineAccount, forgetOfflineAccount } from "./offline-account";
import { OfflineDownloadStatus } from "./offline-support";
import { shouldLoadCloudGame } from "./cloud-session-policy";
import { canAccessKnopikGo, isKnopikGoLogin, GO_ACCESS_DENIED } from "./go-access";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { PixelLogo } from "./pixel-artwork";
import { GameLoadingScreen } from "./game-loading-screen";
import { SAVE_KEY, sanitizeSave, type SaveData } from "./game-logic";
import {
  acknowledgedSave,
  chooseRecovery,
  hasUnsupportedSaveVersion,
  sameSave,
  type PendingProgress,
} from "./save-synchronization";
import { getSupabaseClient, usernameToEmail } from "./supabase-client";
import {
  DEFAULT_DIFFICULTY,
  clampDifficulty,
} from "./difficulty-engine";

type ProfileRow = {
  id: string;
  username: string;
  is_admin: boolean;
};

type GameSaveRow = {
  user_id: string;
  save: unknown;
  revision: number;
  source_id: string | null;
};

type PromoCodeRow = {
  id: string;
  code: string;
  amount: number;
  created_at: string;
  redeemed_by: string | null;
  redeemed_at: string | null;
};

type GameConfigRow = {
  difficulty: number;
};

export type CloudAccount = {
  userId: string;
  username: string;
  isAdmin: boolean;
};

export type CloudSyncState = "saved" | "saving" | "offline" | "error" | "conflict";

export type PromoCode = {
  id: string;
  code: string;
  amount: number;
  createdAt: string;
  redeemed: boolean;
  redeemedAt: string | null;
};

export type PromoResult = {
  message: string;
  amount?: number;
};

export type CloudGameSession = {
  account: CloudAccount;
  initialSave: SaveData;
  gameKey: string;
  syncState: CloudSyncState;
  difficulty: number;
  promoCodes: PromoCode[];
  saveProgress: (save: SaveData) => void;
  retrySave: () => Promise<boolean>;
  refreshPromoCodes: () => Promise<void>;
  updateDifficulty: (difficulty: number) => Promise<string>;
  createPromoCode: (code: string, amount: number) => Promise<string>;
  redeemPromoCode: (code: string) => Promise<PromoResult>;
  getDailyCase: () => Promise<import("./daily-case").DailyCaseStatus>;
  claimDailyCase: (save: SaveData) => Promise<import("./daily-case").DailyCaseStatus>;
  signOut: () => Promise<void>;
};

type CloudAccountGateProps = {
  children: (session: CloudGameSession) => ReactNode;
};

const SAVE_DELAY_MS = 2_000;
const RETRY_INITIAL_MS = 2_000;
const RETRY_MAX_MS = 30_000;
const MAX_PROMO_AMOUNT = 1_000_000_000;
const CLOUD_SOURCE_ID =
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `knopik-${Date.now()}-${Math.random().toString(16).slice(2)}`;

function localSaveKey(userId: string) {
  return `${SAVE_KEY}:${userId}`;
}

function pendingProgressKey(userId: string) {
  return `${SAVE_KEY}:pending:${userId}`;
}

function readLocalSave(userId: string): SaveData | null {
  try {
    const raw = localStorage.getItem(localSaveKey(userId));
    if (!raw) return null;
    const candidate: unknown = JSON.parse(raw);
    return hasUnsupportedSaveVersion(candidate) ? null : sanitizeSave(candidate);
  } catch {
    return null;
  }
}

function readPendingProgress(userId: string): PendingProgress | null {
  try {
    const raw = localStorage.getItem(pendingProgressKey(userId));
    if (!raw) return null;
    const record = JSON.parse(raw) as Partial<PendingProgress>;
    if (!Number.isSafeInteger(record.baseRevision) || Number(record.baseRevision) < 0) return null;
    if (hasUnsupportedSaveVersion(record.save)) return null;
    return {
      save: sanitizeSave(record.save),
      baseRevision: Number(record.baseRevision),
      savedAt: Number(record.savedAt) || Date.now(),
      attempt: record.attempt && !hasUnsupportedSaveVersion(record.attempt.save) && Number.isSafeInteger(record.attempt.revision) && record.attempt.revision >= 0 && typeof record.attempt.sourceId === "string"
        ? {...record.attempt,save:sanitizeSave(record.attempt.save)} : undefined,
    };
  } catch {
    return null;
  }
}

function rememberPendingProgress(userId: string, pending: PendingProgress): void {
  try {
    localStorage.setItem(pendingProgressKey(userId), JSON.stringify(pending));
  } catch {
    // Browser storage may be unavailable; the UI still reports sync failure.
  }
}

function keepConflictBackup(userId: string) {
  try {
    const raw = localStorage.getItem(pendingProgressKey(userId));
    if (raw) localStorage.setItem(`${SAVE_KEY}:conflict:${userId}:${Date.now()}`, raw);
  } catch {
    // Local storage is best-effort. Supabase still keeps every cloud revision.
  }
}

function forgetPendingProgress(userId: string) {
  try {
    localStorage.removeItem(pendingProgressKey(userId));
  } catch { /* Storage may be unavailable. */ }
}

function writeLocalSave(userId: string, save: SaveData) {
  try {
    localStorage.setItem(localSaveKey(userId), JSON.stringify(save));
  } catch {
    // Keep the in-memory copy; retrying cloud writes is handled separately.
  }
}

function normalizePromoCode(code: string) {
  return code.trim().toUpperCase();
}

function mapPromoCode(row: PromoCodeRow): PromoCode {
  return {
    id: row.id,
    code: row.code,
    amount: row.amount,
    createdAt: row.created_at,
    redeemed: Boolean(row.redeemed_by),
    redeemedAt: row.redeemed_at,
  };
}

export function CloudAccountGate({ children }: CloudAccountGateProps) {
  const [authLoading, setAuthLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [account, setAccount] = useState<CloudAccount | null>(null);
  const [initialSave, setInitialSave] = useState<SaveData | null>(null);
  const [gameRevision, setGameRevision] = useState(0);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginPending, setLoginPending] = useState(false);
  const [recoveryError, setRecoveryError] = useState("");
  const [conflictComparison, setConflictComparison] = useState<{ cloud: SaveData; local: SaveData } | null>(null);
  const [syncState, setSyncState] = useState<CloudSyncState>("saved");
  const [difficulty, setDifficulty] = useState(DEFAULT_DIFFICULTY);
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const attemptRef = useRef<PendingProgress["attempt"]>(undefined);
  const [sessionExpired,setSessionExpired] = useState(false);
  const offlineBootRef = useRef(false);
  const reconnectRequiredRef = useRef(false);
  const loggingOutRef = useRef(false);
  const reauthNeededRef = useRef(false);
  const difficultyRef = useRef(DEFAULT_DIFFICULTY);
  const accountRef = useRef<CloudAccount | null>(null);
  const latestSaveRef = useRef<SaveData | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryAttemptRef = useRef(0);
  const saveVersionRef = useRef(0);
  const flushedVersionRef = useRef(0);
  const cloudRevisionRef = useRef(0);
  const conflictRef = useRef(false);
  const flushInFlightRef = useRef<Promise<boolean> | null>(null);
  const rewardWriteLockRef = useRef(false);
  const flushProgressRef = useRef<(rewardFlush?: boolean) => Promise<boolean>>(async () => false);

  const refreshPromoCodes = useCallback(async () => {
    if (!accountRef.current?.isAdmin) return;
    const { data, error } = await getSupabaseClient()
      .from("knopik_go_promo_codes")
      .select("id, code, amount, created_at, redeemed_by, redeemed_at")
      .order("created_at", { ascending: false })
      .limit(200)
      .returns<PromoCodeRow[]>();
    if (!error) setPromoCodes((data ?? []).map(mapPromoCode));
  }, []);

  useEffect(() => {
    const supabase = getSupabaseClient();
    let active = true;

    const restoreIdentity = () => {
      const cached = readOfflineAccount();
      if (!active || !cached || !readLocalSave(cached.userId)) return false;
      offlineBootRef.current = true;
      reconnectRequiredRef.current = true;
      setUser(current => current?.id === cached.userId ? current : {id:cached.userId} as User);
      setAuthLoading(false);
      return true;
    };
    const timer = setTimeout(() => { if (active) restoreIdentity(); }, 3500);
    if (deviceIsOffline()) {
      clearTimeout(timer);
      if (!restoreIdentity()) {setAuthLoading(false);setLoginError("Для первого входа нужен интернет.");}
    } else {
      void supabase.auth.getUser().then(({ data }) => {
        clearTimeout(timer);
        if (!active) return;
        if (!data.user && restoreIdentity()) return;
        setUser(current => current?.id === data.user?.id ? current : data.user ?? null);
        setAuthLoading(false);
      }).catch(() => {clearTimeout(timer);if(active&&!restoreIdentity()){setAuthLoading(false);setLoginError("Нужен интернет для первого входа.");}});
    }

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      if (!session?.user && !loggingOutRef.current && (offlineBootRef.current || accountRef.current)) {
        reconnectRequiredRef.current = true;
        setSyncState(deviceIsOffline() ? "offline" : "error");
        return; // Expiry/network failure cannot discard unsent device progress.
      }
      setUser(current => current?.id === session?.user?.id ? current : session?.user ?? null);
      setAuthLoading(false);
      if (!session?.user || session.user.id !== accountRef.current?.userId) {
        if (session?.user && readOfflineAccount()?.userId !== session.user.id) forgetOfflineAccount();
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
        saveTimerRef.current = null;
        retryTimerRef.current = null;
        accountRef.current = null;
        latestSaveRef.current = null;
        setAccount(null);
        setInitialSave(null);
        setConflictComparison(null);
        setPromoCodes([]);
        setDifficulty(DEFAULT_DIFFICULTY);
      }
    });

    return () => {
      active = false;
      clearTimeout(timer);
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user || !shouldLoadCloudGame(accountRef.current?.userId, user.id)) return;
    const supabase = getSupabaseClient();
    const userId = user.id;
    let active = true;

    function restoreCachedGame() {
      const cached = readOfflineAccount();
      const local = readLocalSave(userId);
      if (!cached || cached.userId !== userId || !local) return false;
      const pending = readPendingProgress(userId);
      const nextAccount = {userId,username:cached.username,isAdmin:cached.isAdmin};
      accountRef.current = nextAccount;
      latestSaveRef.current = pending?.save ?? local;
      attemptRef.current = pending?.attempt;
      cloudRevisionRef.current = pending?.baseRevision ?? cached.revision;
      difficultyRef.current = cached.difficulty;
      saveVersionRef.current = pending ? 1 : 0;
      flushedVersionRef.current = 0;
      conflictRef.current = false;
      reconnectRequiredRef.current = true;
      setAccount(nextAccount);setInitialSave(pending?.save ?? local);
      setGameRevision(v=>v+1);setDifficulty(cached.difficulty);
      setSyncState(deviceIsOffline()?"offline":"saving");setAuthLoading(false);
      setLoginError("");
      if (!deviceIsOffline()) queueMicrotask(()=>{if(active)void flushProgressRef.current();});
      return true;
    }

    async function loadCloudAccount() {
      setAuthLoading(true);
      if ((offlineBootRef.current || deviceIsOffline()) && restoreCachedGame()) return;
      setLoginError("");
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, username, is_admin")
        .eq("id", userId)
        .single<ProfileRow>();
      if (!active) return;
      if (profileError || !profile) {
        if ((profileError?.message?.includes("fetch") || deviceIsOffline()) && restoreCachedGame()) return;
        setLoginError("Профиль игрока не найден.");
        setAuthLoading(false);
        return;
      }
      if (!canAccessKnopikGo(profile.id)) {
        accountRef.current = null;
        latestSaveRef.current = null;
        setAccount(null);
        setInitialSave(null);
        setLoginError(GO_ACCESS_DENIED);
        setAuthLoading(false);
        return;
      }
      const [
        { data: cloudSave, error: saveError },
        { data: gameConfig },
      ] = await Promise.all([
        supabase.from("knopik_go_saves")
          .select("user_id, save, revision, source_id")
          .eq("user_id", userId)
          .maybeSingle<GameSaveRow>(),
        supabase.from("knopik_go_config")
          .select("difficulty")
          .eq("id", true)
          .maybeSingle<GameConfigRow>(),
      ]);
      if (!active) return;
      if (saveError) {
        if ((saveError.message.includes("fetch") || deviceIsOffline()) && restoreCachedGame()) return;
        setLoginError("Не удалось загрузить прогресс из Supabase. Повтори попытку, данные не сбрасывались.");
        setAuthLoading(false);
        return;
      }
      // GO already has a separate save row; never interpret a missing row as
      // permission to create a new blank account or silently re-import TAP.
      if (!cloudSave) {
        setLoginError("Облачное сохранение GO не найдено. Автоматический сброс заблокирован. Обратись к администратору.");
        setAuthLoading(false);
        return;
      }
      if (hasUnsupportedSaveVersion(cloudSave.save)) {
        setLoginError("Версия или структура сохранения не поддерживается. Обнови игру; перезапись заблокирована.");
        setAuthLoading(false);
        return;
      }
      const serverRevision = Number(cloudSave.revision);
      if (!Number.isSafeInteger(serverRevision) || serverRevision < 0) {
        setLoginError("Ошибка версии облачного прогресса. Перезапись заблокирована.");
        setAuthLoading(false);
        return;
      }
      const serverSave = sanitizeSave(cloudSave.save);
      let pending = readPendingProgress(userId);
      if (!pending) {
        const oldBrowserSave = readLocalSave(userId);
        const confirmed = readOfflineAccount();
        const cleanDevice = confirmed?.userId === userId && confirmed.revision <= serverRevision;
        if (oldBrowserSave && !cleanDevice && !sameSave(oldBrowserSave, serverSave)) {
          // Older clients didn't mark unsynced progress. Preserve it for review
          // rather than overwriting the newer Supabase version.
          pending = {
            save: oldBrowserSave,
            baseRevision: serverRevision + 1,
            savedAt: Date.now(),
          };
          rememberPendingProgress(userId, pending);
        }
      }
      const choice = chooseRecovery(serverSave, serverRevision, pending, cloudSave.source_id);
      if (pending && choice === "cloud") forgetPendingProgress(userId);
      const loadedSave = choice === "pending" && pending ? pending.save : serverSave;
      attemptRef.current = undefined;
      if (choice === "pending" && pending) rememberPendingProgress(userId,{...pending,baseRevision:serverRevision,attempt:undefined});
      const nextAccount: CloudAccount = {
        userId: profile.id,
        username: profile.username,
        isAdmin: profile.is_admin,
      };
      accountRef.current = nextAccount;
      latestSaveRef.current = loadedSave;
      cloudRevisionRef.current = serverRevision;
      saveVersionRef.current = choice === "pending" ? 1 : 0;
      flushedVersionRef.current = 0;
      retryAttemptRef.current = 0;
      conflictRef.current = choice === "conflict";
      setConflictComparison(choice === "conflict" && pending
        ? { cloud: serverSave, local: pending.save }
        : null);
      writeLocalSave(userId, loadedSave);
      setAccount(nextAccount);
      setInitialSave(loadedSave);
      setGameRevision(current => current + 1);
      setSyncState(choice === "conflict" ? "conflict" : choice === "pending" ? "saving" : "saved");
      difficultyRef.current = clampDifficulty(gameConfig?.difficulty ?? DEFAULT_DIFFICULTY);
      setDifficulty(difficultyRef.current);
      rememberOfflineAccount(nextAccount,serverRevision,difficultyRef.current);
      offlineBootRef.current = false;
      reconnectRequiredRef.current = false;
      if (nextAccount.isAdmin) {
        const { data: codes } = await supabase.from("knopik_go_promo_codes")
          .select("id, code, amount, created_at, redeemed_by, redeemed_at")
          .order("created_at", { ascending: false })
          .limit(200)
          .returns<PromoCodeRow[]>();
        if (active) setPromoCodes((codes ?? []).map(mapPromoCode));
      } else {
        setPromoCodes([]);
      }
      if (active) {
        setAuthLoading(false);
        if (choice === "pending") queueMicrotask(() => {
          if (active) void flushProgressRef.current();
        });
      }
    }

    void loadCloudAccount().catch(() => {
      if (!active || restoreCachedGame()) return;
      setLoginError("Не удалось загрузить данные. Локальный прогресс сохранён.");setAuthLoading(false);
    });
    return () => { active = false; };
  }, [user]);

  const scheduleRetry = useCallback(() => {
    if (reauthNeededRef.current || deviceIsOffline() || conflictRef.current || retryTimerRef.current || !accountRef.current) return;
    retryAttemptRef.current += 1;
    const delay = Math.min(
      RETRY_MAX_MS,
      RETRY_INITIAL_MS * 2 ** Math.min(5, retryAttemptRef.current - 1),
    );
    retryTimerRef.current = setTimeout(() => {
      retryTimerRef.current = null;
      void flushProgressRef.current();
    }, delay);
  }, []);

  const reconcileDevice = useCallback(async () => {
    const account = accountRef.current;
    if (!account) return false;
    const client = getSupabaseClient();
    const {data:auth,error:authError} = await client.auth.getUser();
    if (authError || auth.user?.id !== account.userId) {
      if (!deviceIsOffline() && (!authError || authError.status===400 || authError.status===401 || authError.status===403)) {
        reauthNeededRef.current=true;setUsername(account.username);setSessionExpired(true);
      }
      throw new Error("Sign in to synchronize");
    }
    const {data:row,error} = await client.from("knopik_go_saves").select("user_id, save, revision, source_id").eq("user_id",account.userId).single<GameSaveRow>();
    if (accountRef.current?.userId !== account.userId) return false;
    if (error || !row || hasUnsupportedSaveVersion(row.save) || !Number.isSafeInteger(Number(row.revision))) throw new Error("Cloud save unavailable");
    const pending = saveVersionRef.current > flushedVersionRef.current && latestSaveRef.current
      ? {save:latestSaveRef.current,baseRevision:cloudRevisionRef.current,savedAt:Date.now(),attempt:attemptRef.current} : null;
    const choice = chooseRecovery(row.save,Number(row.revision),pending,row.source_id);
    if (choice === "conflict") {
      conflictRef.current=true;
      setConflictComparison({cloud:sanitizeSave(row.save),local:pending!.save});setSyncState("conflict");
      return false;
    }
    cloudRevisionRef.current=Number(row.revision);
    attemptRef.current=undefined;
    if(choice==="pending"&&pending)rememberPendingProgress(account.userId,{...pending,baseRevision:cloudRevisionRef.current,attempt:undefined});
    if (choice === "cloud") {
      const save=sanitizeSave(row.save);
      if (!sameSave(latestSaveRef.current,save)) {setInitialSave(save);setGameRevision(v=>v+1);}
      latestSaveRef.current=save;flushedVersionRef.current=saveVersionRef.current;
      writeLocalSave(account.userId,save);forgetPendingProgress(account.userId);
    }
    rememberOfflineAccount(account,cloudRevisionRef.current,difficultyRef.current);
    reconnectRequiredRef.current=false;offlineBootRef.current=false;
    return true;
  }, []);

  // Keep normal runner writes paced even when the game changes every frame.
  // Reward operations request an immediate complete flush before their RPC.
  const flushProgress = useCallback(async function flush(rewardFlush = false): Promise<boolean> {
    if (rewardWriteLockRef.current && !rewardFlush) return false;
    if (conflictRef.current) return false;
    if (deviceIsOffline()) {setSyncState("offline");return false;}
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = null;
    if (flushInFlightRef.current) {
      const finished = await flushInFlightRef.current;
      if (rewardFlush && finished && flushedVersionRef.current < saveVersionRef.current) return flush(true);
      return finished && flushedVersionRef.current >= saveVersionRef.current;
    }

    const operation = (async (): Promise<boolean> => {
      if (reconnectRequiredRef.current) {
        try {if (!await reconcileDevice()) return false;}
        catch {setSyncState(deviceIsOffline()?"offline":"error");scheduleRetry();return false;}
      }
      let writes = 0;
      while (flushedVersionRef.current < saveVersionRef.current && (rewardFlush || writes < 1)) {
        writes += 1;
        const currentAccount = accountRef.current;
        const latestSave = latestSaveRef.current;
        const version = saveVersionRef.current;
        const expectedRevision = cloudRevisionRef.current;
        if (!currentAccount || !latestSave) return false;

        setSyncState("saving");
        attemptRef.current={save:latestSave,revision:expectedRevision,sourceId:CLOUD_SOURCE_ID};
        rememberPendingProgress(currentAccount.userId,{save:latestSave,baseRevision:expectedRevision,savedAt:Date.now(),attempt:attemptRef.current});
        try {
          const { data, error } = await getSupabaseClient().rpc("save_knopik_go_progress", {
            new_save: latestSave,
            expected_revision: expectedRevision,
            save_source_id: CLOUD_SOURCE_ID,
          });
          if (accountRef.current?.userId !== currentAccount.userId) return false;
          if (error || !data) {
            reconnectRequiredRef.current = true;
            setSyncState(deviceIsOffline()?"offline":"error");
            scheduleRetry();
            return false;
          }
          const response = data as GameSaveRow;
          if (!acknowledgedSave(response, expectedRevision, CLOUD_SOURCE_ID, latestSave)) {
            conflictRef.current = true;
            if (!hasUnsupportedSaveVersion(response.save)) {
              setConflictComparison({ cloud: sanitizeSave(response.save), local: latestSaveRef.current ?? latestSave });
            }
            setSyncState("conflict");
            return false;
          }

          attemptRef.current=undefined;
          cloudRevisionRef.current = Number(response.revision);
          rememberOfflineAccount(currentAccount,cloudRevisionRef.current,difficultyRef.current);
          flushedVersionRef.current = version;
          retryAttemptRef.current = 0;
          if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
          retryTimerRef.current = null;
          if (version === saveVersionRef.current) {
            forgetPendingProgress(currentAccount.userId);
          } else if (latestSaveRef.current) {
            rememberPendingProgress(currentAccount.userId, {
              save: latestSaveRef.current,
              baseRevision: cloudRevisionRef.current,
              savedAt: Date.now(),
            });
          }
        } catch {
          reconnectRequiredRef.current = true;
          setSyncState(deviceIsOffline()?"offline":"error");
          scheduleRetry();
          return false;
        }
      }
      if (flushedVersionRef.current < saveVersionRef.current) {
        if (!rewardWriteLockRef.current && !saveTimerRef.current) {
          saveTimerRef.current = setTimeout(() => { void flush(); }, SAVE_DELAY_MS);
        }
        return !rewardFlush;
      }
      setSyncState("saved");
      return true;
    })();

    flushInFlightRef.current = operation;
    try {
      return await operation;
    } finally {
      if (flushInFlightRef.current === operation) flushInFlightRef.current = null;
    }
  }, [scheduleRetry, reconcileDevice]);

  flushProgressRef.current = flushProgress;

  const saveProgress = useCallback((save: SaveData) => {
    if (conflictRef.current) return;
    const currentAccount = accountRef.current;
    if (!currentAccount) return;
    const nextSave = sanitizeSave(save);
    if (latestSaveRef.current && sameSave(latestSaveRef.current, nextSave)) return;
    latestSaveRef.current = nextSave;
    writeLocalSave(currentAccount.userId, nextSave);
    rememberPendingProgress(currentAccount.userId, {
      save: nextSave,
      baseRevision: cloudRevisionRef.current,
      savedAt: Date.now(),
      attempt: attemptRef.current,
    });
    saveVersionRef.current += 1;
    setSyncState(deviceIsOffline()?"offline":"saving");
    if (deviceIsOffline() || rewardWriteLockRef.current || saveTimerRef.current || retryTimerRef.current) return;
    saveTimerRef.current = setTimeout(() => {
      void flushProgress();
    }, SAVE_DELAY_MS);
  }, [flushProgress]);

  const downloadPendingCopy = useCallback(() => {
    const current = accountRef.current;
    if (!current) return;
    const pending = readPendingProgress(current.userId);
    if (!pending) return;
    const blob = new Blob([JSON.stringify(pending, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `knopik-go-${current.username}-local-backup.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }, []);

  const useCloudCopy = useCallback(() => {
    const current = accountRef.current;
    if (!current) return;
    keepConflictBackup(current.userId);
    forgetPendingProgress(current.userId);
    window.location.reload();
  }, []);

  const [restoringSave, setRestoringSave] = useState(false);
  const restoreLocalCopy = useCallback(async () => {
    const current = accountRef.current;
    if (!current || restoringSave) return;
    const pending = readPendingProgress(current.userId);
    if (!pending) {
      setRecoveryError("Локальная копия не найдена.");
      return;
    }
    if (!window.confirm("Восстановить эту локальную копию в Supabase? Облачная версия будет заменена и сохранена в истории изменений. Рекомендуется сначала скачать локальную копию.")) return;
    setRestoringSave(true);
    setRecoveryError("");
    try {
      const { data: server, error } = await getSupabaseClient()
        .from("knopik_go_saves")
        .select("user_id, save, revision, source_id")
        .eq("user_id", current.userId)
        .single<GameSaveRow>();
      if (error || !server) throw new Error("Не удалось проверить облачное сохранение.");
      if (hasUnsupportedSaveVersion(server.save)) throw new Error("Облачная версия несовместима с игрой. Обнови клиент перед восстановлением.");
      const revision = Number(server.revision);
      const result = await getSupabaseClient().rpc("save_knopik_go_progress", {
        new_save: pending.save,
        expected_revision: revision,
        save_source_id: CLOUD_SOURCE_ID,
      });
      if (result.error || !result.data ||
          !acknowledgedSave(result.data as GameSaveRow, revision, CLOUD_SOURCE_ID, pending.save)) {
        throw new Error("Облачная версия изменилась. Загрузите страницу и проверьте копии ещё раз.");
      }
      keepConflictBackup(current.userId);
      forgetPendingProgress(current.userId);
      writeLocalSave(current.userId, pending.save);
      window.location.reload();
    } catch (error) {
      setRecoveryError(error instanceof Error ? error.message : "Не удалось восстановить локальную копию.");
    } finally {
      setRestoringSave(false);
    }
  }, [restoringSave]);

  const createPromoCode = useCallback(async (code: string, amount: number) => {
    const currentAccount = accountRef.current;
    if (!currentAccount?.isAdmin) return "Создавать промокоды может только администратор.";

    const normalizedCode = normalizePromoCode(code);
    const normalizedAmount = Math.floor(amount);
    if (!/^[A-Z0-9_-]{3,32}$/.test(normalizedCode)) {
      return "Код: 3–32 латинских символа, цифры, _ или -.";
    }
    if (!Number.isSafeInteger(normalizedAmount) || normalizedAmount < 1 || normalizedAmount > MAX_PROMO_AMOUNT) {
      return `Сумма должна быть от 1 до ${MAX_PROMO_AMOUNT.toLocaleString("ru-RU")}.`;
    }

    const { data, error } = await getSupabaseClient()
      .from("knopik_go_promo_codes")
      .insert({
        code: normalizedCode,
        amount: normalizedAmount,
        created_by: currentAccount.userId,
      })
      .select("id, code, amount, created_at, redeemed_by, redeemed_at")
      .single<PromoCodeRow>();

    if (error) {
      return error.code === "23505" ? "Такой промокод уже существует." : "Не удалось создать промокод.";
    }
    setPromoCodes((current) => [mapPromoCode(data), ...current]);
    return "Промокод создан.";
  }, []);

  const updateDifficulty = useCallback(async (nextDifficulty: number) => {
    const currentAccount = accountRef.current;
    if (!currentAccount?.isAdmin) return "Менять сложность может только администратор.";
    const normalized = clampDifficulty(nextDifficulty);
    const { data, error } = await getSupabaseClient()
      .from("knopik_go_config")
      .update({
        difficulty: normalized,
        updated_by: currentAccount.userId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", true)
      .select("difficulty")
      .single<GameConfigRow>();
    if (error || !data) return "Не удалось сохранить сложность.";
    setDifficulty(clampDifficulty(data.difficulty));
    return "Сложность сохранена.";
  }, []);

  const redeemPromoCode = useCallback(async (code: string): Promise<PromoResult> => {
    const currentAccount = accountRef.current;
    if (!currentAccount) return { message: "Сначала войди в аккаунт." };
    if (currentAccount.isAdmin) return { message: "Промокоды предназначены для другого игрока." };

    const normalizedCode = normalizePromoCode(code);
    if (!/^[A-Z0-9_-]{3,32}$/.test(normalizedCode)) {
      return { message: "Проверь формат промокода." };
    }

    if (!await flushProgress(true)) {
      return { message: "Сначала сохрани прогресс в Supabase. Награда не была списана." };
    }
    const beforeRewardVersion = saveVersionRef.current;
    const { data, error } = await getSupabaseClient().rpc("redeem_knopik_go_promo_code", {
      promo_code: normalizedCode,
    });
    if (error) return { message: error.message || "Не удалось применить промокод." };

    const result = data as { amount?: unknown; save?: unknown } | null;
    const amount = typeof result?.amount === "number" ? Math.max(0, Math.floor(result.amount)) : 0;
    if (!amount || !result?.save) return { message: "Не удалось получить награду." };

    const nextSave = sanitizeSave(result.save);
    cloudRevisionRef.current += 1;
    if(accountRef.current) rememberOfflineAccount(accountRef.current,cloudRevisionRef.current,difficultyRef.current); // Promo RPC updates the save and revision atomically.
    if (saveVersionRef.current !== beforeRewardVersion) {
      // Preserve any in-flight local play and apply only the new wallet balance.
      const local = latestSaveRef.current ?? nextSave;
      const combined = sanitizeSave({ ...local, walletCoins: nextSave.walletCoins });
      latestSaveRef.current = combined;
      saveVersionRef.current += 1;
      writeLocalSave(currentAccount.userId, combined);
      rememberPendingProgress(currentAccount.userId, {
        save: combined, baseRevision: cloudRevisionRef.current, savedAt: Date.now(),
      });
      setSyncState("saving");
      void flushProgressRef.current();
    } else {
      latestSaveRef.current = nextSave;
      writeLocalSave(currentAccount.userId, nextSave);
      saveVersionRef.current += 1;
      flushedVersionRef.current = saveVersionRef.current;
      forgetPendingProgress(currentAccount.userId);
      setSyncState("saved");
    }
    return { amount, message: `Начислено ${amount.toLocaleString("ru-RU")} монет.` };
  }, [flushProgress]);

  const getDailyCase = useCallback(async () => {
    const { parseDailyCase } = await import("./daily-case");
    const { data, error } = await getSupabaseClient().rpc("get_knopik_go_daily_case");
    if (error) throw new Error("Для ежедневного кейса нужно соединение с сервером.");
    return parseDailyCase(data);
  }, []);

  const claimDailyCase = useCallback(async (save: SaveData) => {
    const currentAccount = accountRef.current;
    if (!currentAccount) throw new Error("Сначала войди в аккаунт.");
    if (rewardWriteLockRef.current) throw new Error("Кейс уже запрашивается.");
    rewardWriteLockRef.current = true;
    try {
      saveProgress(save);
      const committed = await flushProgress(true);
      if (!committed || flushedVersionRef.current < saveVersionRef.current) {
        throw new Error("Прогресс ещё не сохранён. Проверь соединение и попробуй снова.");
      }
      const beforeRewardVersion = saveVersionRef.current;
      const { data, error } = await getSupabaseClient().rpc("claim_knopik_go_daily_case");
      if (error) throw new Error(error.message || "Не удалось получить ежедневный кейс.");
      const { parseDailyCase } = await import("./daily-case");
      const status = parseDailyCase(data);
      if (status.claimed) {
        const response = data as { save?: unknown };
        if (!response.save) throw new Error("Кейс начислен. Перезагрузи игру, чтобы обновить запас.");
        const nextSave = sanitizeSave(response.save);
        cloudRevisionRef.current += 1;
    if(accountRef.current) rememberOfflineAccount(accountRef.current,cloudRevisionRef.current,difficultyRef.current); // Server increments revision when a daily case is claimed.
        if (saveVersionRef.current !== beforeRewardVersion) {
          const local = latestSaveRef.current ?? nextSave;
          const combined = sanitizeSave({ ...local, commonCases: nextSave.commonCases });
          latestSaveRef.current = combined;
          saveVersionRef.current += 1;
          writeLocalSave(currentAccount.userId, combined);
          rememberPendingProgress(currentAccount.userId, {
            save: combined, baseRevision: cloudRevisionRef.current, savedAt: Date.now(),
          });
          setSyncState("saving");
        } else {
          latestSaveRef.current = nextSave;
          writeLocalSave(currentAccount.userId, nextSave);
          saveVersionRef.current += 1;
          flushedVersionRef.current = saveVersionRef.current;
          forgetPendingProgress(currentAccount.userId);
          setSyncState("saved");
        }
      }
      return status;
    } finally {
      rewardWriteLockRef.current = false;
      if (!conflictRef.current && flushedVersionRef.current < saveVersionRef.current) {
        void flushProgressRef.current();
      }
    }
  }, [flushProgress, saveProgress]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") void flushProgress();
    };
    const handlePageHide = () => void flushProgress();
    const handleOnline = () => {reconnectRequiredRef.current=true;if (!conflictRef.current) void flushProgress();};
    const handleOffline = () => {reconnectRequiredRef.current=true;setSyncState("offline");};
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("pagehide", handlePageHide);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    };
  }, [flushProgress]);

  async function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (deviceIsOffline()) {setLoginError("Первый вход в аккаунт требует интернета.");return;}
    if (!isKnopikGoLogin(username)) {
      setLoginError(GO_ACCESS_DENIED);
      return;
    }
    const email = usernameToEmail(username);
    if (!email) {
      setLoginError("Логин должен содержать от 3 до 32 латинских букв или цифр.");
      return;
    }
    if(sessionExpired && accountRef.current && email!==usernameToEmail(accountRef.current.username)){setLoginError("Войди в тот же аккаунт, чтобы отправить его прогресс.");return;}
    setLoginPending(true);
    setLoginError("");
    offlineBootRef.current=false;
    try{
      const {error}=await getSupabaseClient().auth.signInWithPassword({email,password});
      if(error)setLoginError(loginFailureMessage(error));
      else {reauthNeededRef.current=false;setSessionExpired(false);if(accountRef.current)void flushProgressRef.current();}
    }catch(error){setLoginError(loginFailureMessage(error));}
    finally{setLoginPending(false);}
  }

  const signOut = useCallback(async () => {
    if (!await flushProgress(true)) {
      setSyncState(conflictRef.current ? "conflict" : "error");
      return; // Never sign out while unsynced game progress remains.
    }
    loggingOutRef.current=true;
    forgetOfflineAccount();
    await getSupabaseClient().auth.signOut({scope:"local"});
    loggingOutRef.current=false;
  }, [flushProgress]);

  if (authLoading) {
    return <GameLoadingScreen />;
  }

  if (user && account?.userId === user.id && syncState === "conflict") {
    return (
      <main className="auth-screen go-auth pixel-game pixel-auth">
        <section className="auth-card" role="alert">
          <p className="auth-kicker" aria-label="Knopik GO"><PixelLogo /></p>
          <h1>Обнаружены разные сохранения</h1>
          <p>В Supabase находится другая версия прогресса GO. Автоматическая перезапись отключена.</p>
          <p>Локальная копия сохранена на этом устройстве. Сначала рекомендуется скачать её.</p>
          {conflictComparison && (
            <div className="go-compare-saves">
              <p><strong>Supabase:</strong> {conflictComparison.cloud.walletCoins.toLocaleString("ru-RU")} KC, {conflictComparison.cloud.totalTaps.toLocaleString("ru-RU")} тапов, глава {conflictComparison.cloud.storyCheckpoint}, рекорд бега {conflictComparison.cloud.runnerBest} м</p>
              <p><strong>Это устройство:</strong> {conflictComparison.local.walletCoins.toLocaleString("ru-RU")} KC, {conflictComparison.local.totalTaps.toLocaleString("ru-RU")} тапов, глава {conflictComparison.local.storyCheckpoint}, рекорд бега {conflictComparison.local.runnerBest} м</p>
            </div>
          )}
          <button type="button" onClick={downloadPendingCopy}>Скачать локальную копию</button>
          <button type="button" disabled={restoringSave} onClick={() => void restoreLocalCopy()}>
            {restoringSave ? "Восстановление…" : "Восстановить локальную копию в Supabase"}
          </button>
          <button type="button" disabled={restoringSave} onClick={useCloudCopy}>
            Продолжить с облачным сохранением
          </button>
          {recoveryError && <p className="auth-error" role="alert">{recoveryError}</p>}
          <p>Перед восстановлением облачная версия сохраняется в истории Supabase.</p>
        </section>
      </main>
    );
  }

  if (user && !account && loginError) {
    return (
      <main className="auth-screen go-auth pixel-game pixel-auth">
        <section className="auth-card" role="alert">
          <p className="auth-kicker" aria-label="Knopik GO"><PixelLogo /></p>
          <h1>Ошибка загрузки прогресса</h1>
          <p>{loginError}</p>
          <button type="button" onClick={() => window.location.reload()}>Повторить</button>
          <button type="button" onClick={() => void getSupabaseClient().auth.signOut()}>Выйти</button>
        </section>
      </main>
    );
  }

  if (sessionExpired || !user || !account || account.userId !== user.id || !canAccessKnopikGo(account.userId) || !initialSave) {
    return (
      <main className="auth-screen go-auth pixel-game pixel-auth">
        <form className="auth-card" onSubmit={submitLogin}>
          <p className="auth-kicker" aria-label="Knopik GO"><PixelLogo /></p>
          <h1>{sessionExpired?"Подтверди вход":"Кнопик ждёт."}</h1>
          {sessionExpired&&<p>Прогресс сохранён на телефоне. Войди снова, чтобы синхронизировать его.</p>}
          <p>Вход для Фомы и Proclick.</p>
          <label>
            <span>Логин</span>
            <input
              value={username}
              onChange={(event) => setUsername(event.currentTarget.value)}
              autoCapitalize="none"
              autoCorrect="off"
              autoComplete="username"
              required
            />
          </label>
          <label>
            <span>Пароль</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.currentTarget.value)}
              autoComplete="current-password"
              required
            />
          </label>
          <OfflineDownloadStatus/>
          {loginError && <p className="auth-error" role="alert">{loginError}</p>}
          {sessionExpired&&<button type="button" onClick={()=>setSessionExpired(false)}>Пока играть без синхронизации</button>}
          <button type="submit" disabled={loginPending}>
            {loginPending ? "Входим…" : "Войти"}
          </button>
        </form>
      </main>
    );
  }

  // The render prop receives callbacks; none of their refs are read while rendering.
  return children({
    account,
    initialSave,
    gameKey: `${account.userId}:${gameRevision}`,
    syncState,
    difficulty,
    promoCodes,
    saveProgress,
    retrySave: () => {reauthNeededRef.current=false;return flushProgress();},
    refreshPromoCodes,
    updateDifficulty,
    createPromoCode,
    redeemPromoCode,
    getDailyCase,
    claimDailyCase,
    signOut,
  });
}
