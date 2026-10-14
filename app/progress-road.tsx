"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { MAX_LEVEL, levelThreshold, levelProgressDetails, type LevelState } from "./level-engine";
import { progressReward, type ProgressReward } from "./progress-engine";
import { CaseArtwork, CoinArtwork } from "./collectible-artwork";
import { CosmeticArtwork, ClothingArtwork, PotionArtwork } from "./cosmetic-artwork";
import { PixelScene } from "./pixel-artwork";
import { PixelBurst } from "./pixel-effects";
import type { DailyCaseStatus } from "./daily-case";

function RewardArtwork({ reward }: { reward: ProgressReward }) {
  if (reward.type === "case") return <CaseArtwork kind={reward.kind} />;
  if (reward.type === "coins") return <CoinArtwork />;
  if (reward.type === "cosmetic") return <CosmeticArtwork kind={reward.kind} />;
  if (reward.type === "theme") return <PixelScene theme={reward.kind} mood="calm" />;
  if (reward.type === "buff") return <PotionArtwork kind={({ food: "food", drink: "zhivchik", pitbull: "pitbull", cola: "cocoa", tea: "bergamot", shield: "pepsi" } as const)[reward.kind]} />;
  return <span className={`road-clothing ${reward.type === "upgrade" ? "is-upgrade" : ""}`}><ClothingArtwork kind={reward.kind} />{reward.type === "upgrade" && <b>↑</b>}</span>;
}

function LockArtwork() {
  return <svg viewBox="0 0 24 24" className="road-lock pixel-art" shapeRendering="crispEdges" aria-hidden="true"><path d="M8 2h8v3h3v6h3v11H2V11h3V5h3Zm2 3v3H8v3h8V8h-2V5ZM4 13v7h16v-7Z" fill="currentColor" /><path d="M10 14h4v5h-4Z" fill="currentColor" /></svg>;
}

function timerLabel(milliseconds: number) {
  const seconds = Math.max(0, Math.ceil(milliseconds / 1000));
  return [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60].map(part => String(part).padStart(2, "0")).join(":");
}

type Props = {
  level: LevelState;
  claimed: number[];
  onClaim: (level: number) => string | null;
  onGetDailyCase: () => Promise<DailyCaseStatus>;
  onClaimDailyCase: () => Promise<DailyCaseStatus>;
  onClose: () => void;
};

export function ProgressRoad({ level, claimed, onClaim, onGetDailyCase, onClaimDailyCase, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const currentRef = useRef<HTMLElement>(null);
  const busyRef = useRef(false);
  const anchorRef = useRef<{ server: number; local: number } | null>(null);
  const [daily, setDaily] = useState<DailyCaseStatus | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dailyRefresh,setDailyRefresh]=useState(0);
  const [dailyError, setDailyError] = useState("");
  const [message, setMessage] = useState("");
  const [burst, setBurst] = useState(0);
  const details = levelProgressDetails(level);
  const claimedSet = new Set(claimed);
  const acceptDaily = (status: DailyCaseStatus) => {
    anchorRef.current = { server: status.serverNow, local: performance.now() };
    setDaily(status);
    setRemaining(Math.max(0, status.nextAvailableAt - status.serverNow));
  };

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement as HTMLElement | null;
    dialog?.showModal();
    const frame = requestAnimationFrame(() => currentRef.current?.scrollIntoView({ block: "nearest", inline: "center", behavior: "instant" }));
    return () => {
      cancelAnimationFrame(frame);
      dialog?.close();
      previousFocus?.focus({ preventScroll: true });
    };
  }, []);

  useEffect(() => {
    let active = true;
    let request = 0;
    const refresh = async () => {
      if (busyRef.current) return;
      const id = ++request;
      setLoading(true);
      try {
        const status = await onGetDailyCase();
        if (!active || id !== request || busyRef.current) return;
        acceptDaily(status);
        setDailyError("");
      } catch (error) {
        if (active && id === request) setDailyError(error instanceof Error ? error.message : "Нет соединения с сервером.");
      } finally {
        if (active && id === request) setLoading(false);
      }
    };
    const foreground = () => { if (document.visibilityState === "visible") void refresh(); };
    void refresh();
    window.addEventListener("focus", foreground);
    window.addEventListener("online", foreground);
    document.addEventListener("visibilitychange", foreground);
    return () => { active = false; window.removeEventListener("focus", foreground); window.removeEventListener("online", foreground); document.removeEventListener("visibilitychange", foreground); };
  }, [onGetDailyCase,dailyRefresh]);

  useEffect(() => {
    if (!daily) return;
    const interval = setInterval(() => {
      const anchor = anchorRef.current;
      if (anchor) setRemaining(Math.max(0, daily.nextAvailableAt - anchor.server - (performance.now() - anchor.local)));
    }, 1000);
    return () => clearInterval(interval);
  }, [daily]);

  const claimDaily = async () => {
    if (busyRef.current || !daily || remaining > 0 || loading || dailyError) return;
    busyRef.current = true;
    setBusy(true);
    try {
      const status = await onClaimDailyCase();
      acceptDaily(status);
      setMessage(status.claimed ? "Ежедневный кейс добавлен в запас" : "Сегодняшний кейс уже получен");
      if (status.claimed) setBurst(value => value + 1);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось получить кейс.");
    } finally { busyRef.current = false; setBusy(false); }
  };

  return <dialog ref={dialogRef} className="progress-road-dialog" aria-labelledby="road-title" onCancel={event => { event.preventDefault(); if (!busyRef.current) onClose(); }}>
    <div className="progress-road-world">
      <PixelScene theme="night" mood="calm" />
      <div className="road-sky-dust" aria-hidden="true">{Array.from({ length: 28 }, (_, i) => <i key={i} style={{ left: `${i * 37 % 100}%`, top: `${i * 19 % 60}%`, "--star-delay": `${i % 6 * .3}s` } as CSSProperties} />)}</div>
      <header className="road-heading">
        <div><span className="road-eyebrow">KNOPIK GO</span><h2 id="road-title">Путь прогресса</h2></div>
        <button type="button" className="icon-button" aria-label="Закрыть путь прогресса" disabled={busy} onClick={onClose}>×</button>
      </header>
      <div className="road-summary">
        <div className="road-current-lvl"><small>LVL</small><strong>{level.level}</strong></div>
        <div className="road-earnings"><small>Всего заработано</small><strong>{level.lifetimeCoins.toLocaleString("ru-RU")} <span>KC</span></strong><span>{level.level >= MAX_LEVEL ? "Весь путь пройден" : `До LVL ${level.level + 1}: ${details.coinsToNext.toLocaleString("ru-RU")} KC`}</span></div>
      </div>
      <div className="road-scroll" tabIndex={0} role="region" aria-label="Дорога наград, горизонтальная прокрутка">
        <div className="road-track">
          {Array.from({ length: MAX_LEVEL }, (_, index) => {
            const number = index + 1;
            const reached = number <= level.level;
            const received = claimedSet.has(number);
            const revealed = number <= level.level + 3;
            const reward = revealed ? progressReward(number) : null;
            const unlock = reward?.type === "theme" || reward?.type === "cosmetic" || reward?.type === "item";
            const current = number === Math.max(1, level.level);
            return <article key={number} ref={current ? currentRef : undefined} className={`road-stop ${reached ? "is-reached" : ""} ${received ? "is-claimed" : ""} ${current ? "is-current" : ""} ${!revealed ? "is-hidden" : ""}`}>
              <div className="road-milestone"><span>LVL</span><strong>{number}</strong></div>
              <div className="road-reward-art">{reward ? <RewardArtwork reward={reward} /> : <LockArtwork />}</div>
              <strong className="road-reward-label">{reward?.label ?? "Скрытая награда"}</strong>
              {received ? <span className="road-received">✓ {unlock ? "Открыто" : "Получено"}</span> : reached ? <button type="button" className="road-claim" disabled={busy} onClick={() => { const result = onClaim(number); setMessage(result || "Освободи место в запасе и забери награду"); if (result) setBurst(value => value + 1); }}>{unlock ? "Открыть" : "Забрать"}</button> : <span className="road-requirement">{revealed ? `${levelThreshold(number).toLocaleString("ru-RU")} KC` : "???"}</span>}
            </article>;
          })}
        </div>
      </div>
      <footer className="road-footer">
        <p className="road-message" role="status">{message || "Награды открываются на три уровня вперёд"}</p>
        <button type="button" className={`daily-case-button ${daily && remaining === 0 && !dailyError ? "is-ready" : ""}`} disabled={busy || loading || !daily || remaining > 0 || Boolean(dailyError)} onClick={() => void claimDaily()}>
          <CaseArtwork kind="common" />
          <span><strong>Ежедневный кейс</strong><small>{dailyError || (loading ? "Синхронизация…" : busy ? "Получаем…" : remaining > 0 ? `Через ${timerLabel(remaining)}` : "Можно забрать")}</small></span>
          <b>{busy ? "…" : remaining > 0 ? timerLabel(remaining) : "＋"}</b>
        </button>
        {dailyError&&<button className="daily-case-retry" type="button" disabled={loading||busy} onClick={()=>setDailyRefresh(n=>n+1)}>Проверить ещё раз</button>}
        <small className="daily-case-caption">Один обычный кейс каждые 24 часа</small>
      </footer>
      {burst > 0 && <PixelBurst key={burst} kind="gold" count={96} seed={burst} className="road-reward-burst" />}
    </div>
  </dialog>;
}
