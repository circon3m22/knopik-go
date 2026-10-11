"use client";
import { useEffect, useRef, useState } from "react";
import { PotionArtwork } from "./cosmetic-artwork";
import { PixelSymbol } from "./pixel-artwork";
import { PixelBurst } from "./pixel-effects";
import { CocoaMachine, CocoaPaytable, COCOA_REEL_TIMES, COCOA_SPIN_TIME } from "./cocoa-machine";
import { MINE_MULTIPLIERS, createMinePickOutcome, createSlotOutcome, minePayout, type SlotOutcome, type SlotSymbol, } from "./mini-game-engine";
export type MiniGameKind = "slots" | "mines";
export type MiniGameStats = {
    slotPlays: number;
    slotWins: number;
    minePlays: number;
    mineWins: number;
    mineLosses: number;
};
type MiniGamePanelProps = {
    kind: MiniGameKind;
    balance: number;
    difficulty: number;
    canChooseBet: boolean;
    stats: MiniGameStats;
    onCommitBet: (kind: MiniGameKind, bet: number) => boolean;
    onResolve: (kind: MiniGameKind, payout: number, won: boolean) => void;
    onClose: () => void;
    onTick: () => void;
    onCocoaSound?: (kind: "start" | "tick" | "stop" | "win" | "loss", index?: number) => void;
};
type MineTile = "hidden" | "safe" | "mine";
type MinePhase = "ready" | "playing" | "safe" | "lost" | "cashed";
const INITIAL_REELS: [
    SlotSymbol,
    SlotSymbol,
    SlotSymbol
] = [
    "cherry",
    "lemon",
    "seven",
];
export function MiniGamePanel({ kind, balance, difficulty, canChooseBet, stats, onCommitBet, onResolve, onClose, onTick, onCocoaSound, }: MiniGamePanelProps) {
    const [sessionDifficulty] = useState(difficulty);
    const [bet, setBet] = useState(Math.max(1, balance));
    const [lockedBet, setLockedBet] = useState<number | null>(null);
    const [slotPhase, setSlotPhase] = useState<"ready" | "spinning" | "result">("ready");
    const [slotReels, setSlotReels] = useState(INITIAL_REELS);
    const [spinningOutcome, setSpinningOutcome] = useState<SlotOutcome | null>(null);
    const [stoppedReels, setStoppedReels] = useState(0);
    const [slotOutcome, setSlotOutcome] = useState<SlotOutcome | null>(null);
    const [minePhase, setMinePhase] = useState<MinePhase>("ready");
    const minePhaseRef = useRef<MinePhase>("ready");
    const [mineRound, setMineRound] = useState(0);
    const [previousMineIndex, setPreviousMineIndex] = useState<number | null>(null);
    const [mineTiles, setMineTiles] = useState<MineTile[]>(() => Array.from({ length: 5 }, () => "hidden"));
    const committedRef = useRef(false);
    const resolvedRef = useRef(false);
    const dialogRef = useRef<HTMLDialogElement>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const reelTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
    const spinStartedRef = useRef(false);
    const changeMinePhase = (next: MinePhase) => { minePhaseRef.current = next; setMinePhase(next); };
    useEffect(() => {
        const dialog = dialogRef.current;
        const previousFocus = document.activeElement as HTMLElement | null;
        dialog?.showModal();
        dialog?.querySelector<HTMLButtonElement>(".mini-primary, .mine-tile")?.focus({ preventScroll: true });
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            if (intervalRef.current) clearInterval(intervalRef.current);
            reelTimersRef.current.forEach(clearTimeout);
            dialog?.close();
            previousFocus?.focus({ preventScroll: true });
        };
    }, []);
    const selectedBet = Math.min(balance, Math.max(1, Math.floor(bet)));
    const safeBet = lockedBet ?? selectedBet;
    const mineCurrentPayout = minePayout(safeBet, mineRound);
    const mineNextMultiplier = MINE_MULTIPLIERS[Math.min(mineRound, MINE_MULTIPLIERS.length - 1)];
    const commit = () => {
        if (committedRef.current)
            return true;
        if (!onCommitBet(kind, selectedBet))
            return false;
        setLockedBet(selectedBet);
        committedRef.current = true;
        return true;
    };
    const resolve = (payout: number, won: boolean) => {
        if (resolvedRef.current)
            return;
        resolvedRef.current = true;
        onResolve(kind, payout, won);
    };
    const spinSlots = () => {
        if (spinStartedRef.current || slotPhase !== "ready" || !commit())
            return;
        spinStartedRef.current = true;
        const outcome = createSlotOutcome(safeBet, sessionDifficulty);
        setSlotOutcome(null);
        setSlotPhase("spinning");
        setSpinningOutcome(outcome);
        onCocoaSound?.("start");
        reelTimersRef.current = COCOA_REEL_TIMES.map((delay, index) => setTimeout(() => {
            setStoppedReels(index + 1);
            onCocoaSound?.("stop", index);
        }, delay));
        let tick = 0;
        intervalRef.current = setInterval(() => {
            onCocoaSound?.("tick", tick++);
        }, 120);
        timerRef.current = setTimeout(() => {
            if (intervalRef.current)
                clearInterval(intervalRef.current);
            intervalRef.current = null;
            setSlotReels(outcome.reels);
            setSlotOutcome(outcome);
            setSlotPhase("result");
            onCocoaSound?.(outcome.payout > 0 ? "win" : "loss", outcome.tier === "jackpot" ? 1 : 0);
            resolve(outcome.payout, outcome.payout > 0);
        }, COCOA_SPIN_TIME);
    };
    const chooseMineTile = (selectedIndex: number) => {
        if (minePhaseRef.current !== "ready" && minePhaseRef.current !== "playing")
            return;
        if (!commit())
            return;
        const outcome = createMinePickOutcome(selectedIndex, sessionDifficulty, Math.random, previousMineIndex);
        const tiles: MineTile[] = Array.from({ length: 5 }, () => "hidden");
        tiles[outcome.mineIndex] = "mine";
        setPreviousMineIndex(outcome.mineIndex);
        if (outcome.safe)
            tiles[selectedIndex] = "safe";
        setMineTiles(tiles);
        onTick();
        if (!outcome.safe) {
            changeMinePhase("lost");
            resolve(0, false);
            return;
        }
        const completedRounds = mineRound + 1;
        setMineRound(completedRounds);
        if (completedRounds >= MINE_MULTIPLIERS.length) {
            const payout = minePayout(safeBet, completedRounds);
            changeMinePhase("cashed");
            resolve(payout, true);
            return;
        }
        changeMinePhase("safe");
    };
    const continueMines = () => {
        if (minePhaseRef.current !== "safe")
            return;
        setMineTiles(Array.from({ length: 5 }, () => "hidden"));
        changeMinePhase("playing");
    };
    const cashOutMines = () => {
        if (minePhaseRef.current !== "safe" || mineRound < 1)
            return;
        changeMinePhase("cashed");
        resolve(mineCurrentPayout, true);
    };
    const finished = slotPhase === "result" || minePhase === "lost" || minePhase === "cashed";
    const canClose = lockedBet === null || finished;
    return (<dialog ref={dialogRef} className={`mini-game-dialog mini-game-backdrop mini-${kind}`} aria-labelledby="mini-game-title" onCancel={event => { event.preventDefault(); if (canClose) onClose(); }}>
      <section className="mini-game-panel">
        <div className="mini-game-topline">
          {<PotionArtwork kind={kind === "slots" ? "cocoa" : "bergamot"} className="mini-potion-icon"/>}
          <div>
            <small>{kind === "slots" ? "КАКАО-КОЛА" : "ЧАЙ С БЕРГАМОТОМ"}</small>
            <h2 id="mini-game-title">{kind === "slots" ? "Какао-машина" : "Пять кнопок"}</h2>
          </div>
          {canClose && <button className="mini-close" type="button" aria-label="Закрыть мини-игру" onClick={onClose}>×</button>}
        </div>

        <div className="mini-bet-card">
          <span><small>СТАВКА</small><strong>{safeBet.toLocaleString("ru-RU")}</strong></span>
          <span><small>АКТИВНЫЙ БАЛАНС</small><strong>{balance.toLocaleString("ru-RU")}</strong></span>
        </div>

        {canChooseBet && lockedBet === null && (<div className="mini-bet-control">
            <input type="range" min="1" max={Math.max(1, balance)} value={safeBet} aria-label="Размер ставки" onChange={(event) => setBet(Number(event.currentTarget.value))}/>
            <button type="button" onClick={() => setBet(balance)}>Весь баланс</button>
          </div>)}

        {kind === "slots" ? (<>
            <div className="mini-game-stage cocoa-game-stage">
            <CocoaMachine phase={slotPhase} stopped={stoppedReels} outcome={slotOutcome} spinOutcome={spinningOutcome} reels={slotReels} bet={safeBet}/>
            </div>
            <footer className="mini-game-footer">
            <CocoaPaytable/>
            {slotPhase === "ready" && <button className="mini-primary" type="button" onClick={spinSlots}>Крутить барабаны</button>}
            {slotPhase === "spinning" && <button className="mini-primary" type="button" disabled>Вращение…</button>}
            {slotPhase === "result" && <button className="mini-primary" type="button" onClick={onClose}>Вернуться к Кнопику</button>}
            <p className="mini-stats">ИГР {stats.slotPlays} · ПОБЕД {stats.slotWins}</p>
            </footer>
          </>) : (<>
            <div className="mini-game-stage mine-game-stage">
            <div className={`mine-progress phase-${minePhase}`}>
              <span><small>ПРОЙДЕНО</small><strong>{mineRound}</strong></span>
              <span><small>СЕЙЧАС</small><strong>×{mineRound ? MINE_MULTIPLIERS[mineRound - 1] : "1.00"}</strong></span>
              <span><small>ДАЛЬШЕ</small><strong>×{mineNextMultiplier}</strong></span>
            </div>
            <div className="mine-round-track" aria-label={`Пройдено раундов: ${mineRound} из ${MINE_MULTIPLIERS.length}`}>
              {MINE_MULTIPLIERS.map((_, index) => (<i className={index < mineRound ? "is-complete" : index === mineRound ? "is-current" : ""} key={index}/>))}
            </div>
            <div className={`mine-grid phase-${minePhase}`} aria-label="Пять закрытых кнопок">
              {mineTiles.map((tile, index) => (<button className={`mine-tile is-${tile}`} type="button" key={index} disabled={minePhase === "safe" || minePhase === "lost" || minePhase === "cashed"} aria-label={tile === "hidden" ? `Кнопка ${index + 1}` : tile === "safe" ? "Безопасно" : "Мина"} onClick={() => chooseMineTile(index)}>
                  <span>{tile !== "hidden" ? <PixelSymbol kind={tile}/> : tile === "hidden" ? index + 1 : tile === "safe" ? "✓" : "✹"}</span>
                  <small>{tile === "hidden" ? "ВЫБРАТЬ" : tile === "safe" ? "ЧИСТО" : "МИНА"}</small>
                  {tile !== "hidden" && <PixelBurst kind={tile === "safe" ? "gold" : "rage"} count={24}/>}
                </button>))}
            </div>
            {minePhase === "ready" && <p className="mine-hint">Выбери одну кнопку. Четыре безопасны, под одной спрятана мина.</p>}
            </div>
            <footer className="mini-game-footer">
            {minePhase === "safe" && (<div className="mine-actions">
                <button type="button" onClick={cashOutMines}>Забрать {mineCurrentPayout.toLocaleString("ru-RU")}</button>
                <button type="button" onClick={continueMines}>Идти дальше</button>
              </div>)}
            {minePhase === "lost" && <div className="mini-result is-loss"><small>МИНА</small><strong>−{safeBet.toLocaleString("ru-RU")}</strong></div>}
            {minePhase === "cashed" && <div className="mini-result is-win"><small>МОНЕТЫ ЗАБРАНЫ</small><strong>+{mineCurrentPayout.toLocaleString("ru-RU")}</strong></div>}
            {(minePhase === "lost" || minePhase === "cashed") && <button className="mini-primary" type="button" onClick={onClose}>Вернуться к Кнопику</button>}
            <p className="mini-stats">ИГР {stats.minePlays} · ВЫВОДОВ {stats.mineWins} · МИН {stats.mineLosses}</p>
            </footer>
          </>)}
      </section>
    </dialog>);
}
