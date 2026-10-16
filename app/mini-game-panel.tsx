"use client";
import {TeaField} from "./tea-field";
import { useEffect, useRef, useState } from "react";
import { PotionArtwork } from "./cosmetic-artwork";
import { CocoaMachine, CocoaPaytable, COCOA_REEL_TIMES, COCOA_SPIN_TIME } from "./cocoa-machine";
import { createSlotOutcome, type SlotOutcome, type SlotSymbol, } from "./mini-game-engine";
export type MiniGameKind = "slots" | "mines";
export type MiniGameStats = {
    slotPlays: number;
    slotWins: number;
    minePlays: number;
    mineWins: number;
    mineLosses: number;
};
type MiniGamePanelProps = {
    onReplay?:()=>void;
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
const INITIAL_REELS: [
    SlotSymbol,
    SlotSymbol,
    SlotSymbol
] = [
    "cherry",
    "lemon",
    "seven",
];
function LegacyMiniGamePanel({ kind, balance, difficulty, canChooseBet, stats, onCommitBet, onResolve, onClose, onReplay,onCocoaSound, }: MiniGamePanelProps) {
    const [sessionDifficulty] = useState(difficulty);
    const [bet, setBet] = useState(Math.max(1, balance));
    const [lockedBet, setLockedBet] = useState<number | null>(null);
    const [slotPhase, setSlotPhase] = useState<"ready" | "spinning" | "result">("ready");
    const [slotReels, setSlotReels] = useState(INITIAL_REELS);
    const [spinningOutcome, setSpinningOutcome] = useState<SlotOutcome | null>(null);
    const [stoppedReels, setStoppedReels] = useState(0);
    const [slotOutcome, setSlotOutcome] = useState<SlotOutcome | null>(null);
    const committedRef = useRef(false);
    const resolvedRef = useRef(false);
    const dialogRef = useRef<HTMLDialogElement>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const reelTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
    const spinStartedRef = useRef(false);
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
    const finished=slotPhase==="result";
    const canClose=lockedBet===null||finished;
    return (<dialog ref={dialogRef} className={`mini-game-dialog mini-game-backdrop mini-${kind}`} aria-labelledby="mini-game-title" onCancel={event => { event.preventDefault(); if (canClose) onClose(); }}>
      <section className="mini-game-panel">
        <div className="mini-game-topline">
          {<PotionArtwork kind={"cocoa"} className="mini-potion-icon"/>}
          <div>
            <small>{"КАКАО-КОЛА"}</small>
            <h2 id="mini-game-title">{"Какао-машина"}</h2>
          </div>
          {canClose && <button className="mini-close" type="button" aria-label="Закрыть мини-игру" onClick={onClose}>×</button>}
        </div>

        <div className="mini-bet-card">
          <span><small>СТАВКА</small><strong>{safeBet.toLocaleString("ru-RU")}</strong></span>
          <span><small>АКТИВНЫЙ БАЛАНС</small><strong>{balance.toLocaleString("ru-RU")}</strong></span>
        </div>

        {canChooseBet && lockedBet === null && (<div className="mini-bet-control">
            <input type="range" min="1" max={Math.max(1, balance)} value={safeBet} aria-label="Размер ставки" onChange={(event) => setBet(Number(event.currentTarget.value))}/>
            <input aria-label="Точная сумма ставки" type="number" inputMode="numeric" min="1" max={Math.max(1,balance)} step="1" value={selectedBet} onChange={e=>setBet(Math.min(balance,Math.max(1,Math.floor(Number(e.currentTarget.value)||1))))}/>
            <button type="button" onClick={() => setBet(balance)}>Весь баланс</button>
          </div>)}

        {(<>
            <div className="mini-game-stage cocoa-game-stage">
            <CocoaMachine phase={slotPhase} stopped={stoppedReels} outcome={slotOutcome} spinOutcome={spinningOutcome} reels={slotReels} bet={safeBet}/>
            </div>
            <footer className="mini-game-footer">
            <CocoaPaytable/>
            {slotPhase === "ready" && <button className="mini-primary" type="button" onClick={spinSlots}>Крутить барабаны</button>}
            {slotPhase === "spinning" && <button className="mini-primary" type="button" disabled>Вращение…</button>}
            {slotPhase==="result"&&onReplay&&<button className="mini-primary" type="button" onClick={onReplay}>Ещё раз</button>}
            {slotPhase === "result" && <button className="mini-primary" type="button" onClick={onClose}>К напиткам</button>}
            <p className="mini-stats">ИГР {stats.slotPlays} · ПОБЕД {stats.slotWins}</p>
            </footer>
          </>)}
      </section>
    </dialog>);
}

export function MiniGamePanel(props:MiniGamePanelProps){return props.kind==="mines"?<TeaField {...props}/>:<LegacyMiniGamePanel {...props}/>;}
