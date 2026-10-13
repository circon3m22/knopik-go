"use client";
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

export type CloudSyncState = "saved" | "saving" | "error" | "conflict";

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
  const [recoveryPending, setRecoveryPending] = useState(false);
  const [recoveryError, setRecoveryError] = useState("");
  const [syncState, setSyncState] = useState<CloudSyncState>("saved");
  const [difficulty, setDifficulty] = useState(DEFAULT_DIFFICULTY);
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
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

    void supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      setUser(current => current?.id === data.user?.id ? current : data.user ?? null);
      setAuthLoading(false);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setUser(current => current?.id === session?.user?.id ? current : session?.user ?? null);
      setAuthLoading(false);
      if (!session?.user || session.user.id !== accountRef.current?.userId) {
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
        saveTimerRef.current = null;
        retryTimerRef.current = null;
        accountRef.current = null;
        latestSaveRef.current = null;
        setAccount(null);
        setInitialSave(null);
        setPromoCodes([]);
        setDifficulty(DEFAULT_DIFFICULTY);
      }
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user || !shouldLoadCloudGame(accountRef.current?.userId, user.id)) return;
    const supabase = getSupabaseClient();
    const userId = user.id;
    let active = true;

    async function loadCloudAccount() {
      setAuthLoading(true);
      setLoginError("");
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, username, is_admin")
        .eq("id", userId)
        .single<ProfileRow>();
      if (!active) return;
      if (profileError || !profile) {
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
        if (oldBrowserSave && !sameSave(oldBrowserSave, serverSave)) {
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
      const choice = chooseRecovery(serverSave, serverRevision, pending);
      if (pending && choice === "cloud") forgetPendingProgress(userId);
      const loadedSave = choice === "pending" && pending ? pending.save : serverSave;
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
      writeLocalSave(userId, loadedSave);
      setAccount(nextAccount);
      setInitialSave(loadedSave);
      setGameRevision(current => current + 1);
      setSyncState(choice === "conflict" ? "conflict" : choice === "pending" ? "saving" : "saved");
      setDifficulty(clampDifficulty(gameConfig?.difficulty ?? DEFAULT_DIFFICULTY));
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

    void loadCloudAccount();
    return () => { active = false; };
  }, [user]);

  const scheduleRetry = useCallback(() => {
    if (conflictRef.current || retryTimerRef.current || !accountRef.current) return;
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

  // Keep normal runner writes paced even when the game changes every frame.
  // Reward operations request an immediate complete flush before their RPC.
  const flushProgress = useCallback(async function flush(rewardFlush = false): Promise<boolean> {
    if (rewardWriteLockRef.current && !rewardFlush) return false;
    if (conflictRef.current) return false;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = null;
    if (flushInFlightRef.current) {
      const finished = await flushInFlightRef.current;
      if (rewardFlush && finished && flushedVersionRef.current < saveVersionRef.current) return flush(true);
      return finished && flushedVersionRef.current >= saveVersionRef.current;
    }

    const operation = (async (): Promise<boolean> => {
      let writes = 0;
      while (flushedVersionRef.current < saveVersionRef.current && (rewardFlush || writes < 1)) {
        writes += 1;
        const currentAccount = accountRef.current;
        const latestSave = latestSaveRef.current;
        const version = saveVersionRef.current;
        const expectedRevision = cloudRevisionRef.current;
        if (!currentAccount || !latestSave) return false;

        setSyncState("saving");
        try {
          const { data, error } = await getSupabaseClient().rpc("save_knopik_go_progress", {
            new_save: latestSave,
            expected_revision: expectedRevision,
            save_source_id: CLOUD_SOURCE_ID,
          });
          if (accountRef.current?.userId !== currentAccount.userId) return false;
          if (error || !data) {
            setSyncState("error");
            scheduleRetry();
            return false;
          }
          const response = data as GameSaveRow;
          if (!acknowledgedSave(response, expectedRevision, CLOUD_SOURCE_ID, latestSave)) {
            conflictRef.current = true;
            setSyncState("conflict");
            return false;
          }

          cloudRevisionRef.current = Number(response.revision);
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
          setSyncState("error");
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
  }, [scheduleRetry]);

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
    });
    saveVersionRef.current += 1;
    setSyncState("saving");
    if (rewardWriteLockRef.current || saveTimerRef.current) return;
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

    await flushProgress();
    const { data, error } = await getSupabaseClient().rpc("redeem_knopik_go_promo_code", {
      promo_code: normalizedCode,
    });
    if (error) return { message: error.message || "Не удалось применить промокод." };

    const result = data as { amount?: unknown; save?: unknown } | null;
    const amount = typeof result?.amount === "number" ? Math.max(0, Math.floor(result.amount)) : 0;
    if (!amount || !result?.save) return { message: "Не удалось получить награду." };

    const nextSave = sanitizeSave(result.save);
    latestSaveRef.current = nextSave;
    writeLocalSave(currentAccount.userId, nextSave);
    saveVersionRef.current += 1;
    flushedVersionRef.current = saveVersionRef.current;
    setSyncState("saved");
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
      await flushProgress(true);
      if (flushedVersionRef.current < saveVersionRef.current) {
        throw new Error("Прогресс ещё не сохранён. Проверь соединение и попробуй снова.");
      }
      const { data, error } = await getSupabaseClient().rpc("claim_knopik_go_daily_case");
      if (error) throw new Error(error.message || "Не удалось получить ежедневный кейс.");
      const { parseDailyCase } = await import("./daily-case");
      const status = parseDailyCase(data);
      if (status.claimed) {
        const response = data as { save?: unknown };
        if (!response.save) throw new Error("Кейс начислен. Перезагрузи игру, чтобы обновить запас.");
        const nextSave = sanitizeSave(response.save);
        latestSaveRef.current = nextSave;
        writeLocalSave(currentAccount.userId, nextSave);
        saveVersionRef.current += 1;
        flushedVersionRef.current = saveVersionRef.current;
        setSyncState("saved");
      }
      return status;
    } finally {
      rewardWriteLockRef.current = false;
    }
  }, [flushProgress, saveProgress]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") void flushProgress();
    };
    const handlePageHide = () => void flushProgress();
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("pagehide", handlePageHide);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("pagehide", handlePageHide);
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [flushProgress]);

  async function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isKnopikGoLogin(username)) {
      setLoginError(GO_ACCESS_DENIED);
      return;
    }
    const email = usernameToEmail(username);
    if (!email) {
      setLoginError("Логин должен содержать от 3 до 32 латинских букв или цифр.");
      return;
    }
    setLoginPending(true);
    setLoginError("");
    const { error } = await getSupabaseClient().auth.signInWithPassword({
      email,
      password,
    });
    if (error) setLoginError("Неверный логин или пароль.");
    setLoginPending(false);
  }

  const signOut = useCallback(async () => {
    await flushProgress();
    await getSupabaseClient().auth.signOut();
  }, [flushProgress]);

  if (authLoading) {
    return <GameLoadingScreen />;
  }

  if (!user || !account || account.userId !== user.id || !canAccessKnopikGo(account.userId) || !initialSave) {
    return (
      <main className="auth-screen go-auth pixel-game pixel-auth">
        <form className="auth-card" onSubmit={submitLogin}>
          <p className="auth-kicker" aria-label="Knopik GO"><PixelLogo /></p>
          <h1>Кнопик ждёт.</h1>
          <p>Вход в Knopik GO доступен только Фоме.</p>
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
          {loginError && <p className="auth-error" role="alert">{loginError}</p>}
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
    refreshPromoCodes,
    updateDifficulty,
    createPromoCode,
    redeemPromoCode,
    getDailyCase,
    claimDailyCase,
    signOut,
  });
}
