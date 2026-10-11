"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PotionArtwork } from "./cosmetic-artwork";
import { PixelBurst } from "./pixel-effects";
import { PixelMemoryPipe } from "./pixel-artwork";
import { DRINK_GAMES, MEMORY_ROUNDS, createMemorySequence, memoryReward, memorySequenceLength, memoryFlashTiming } from "./drink-game-engine";

type Phase = "ready" | "playing" | "watch" | "between" | "paused" | "result";
type Props = { kind: "matcha"; best: number; onStart: () => boolean; onResolve: (kind: "matcha", reward: number, score: number) => void; onClose: () => void; onTick: (pad?: number) => void };
const PAD_NAMES = ["Верхний левый", "Верхний средний", "Верхний правый", "Средний левый", "Центральный", "Средний правый", "Нижний левый", "Нижний средний", "Нижний правый"];

export function DrinkGamePanel({ kind, best, onStart, onResolve, onClose, onTick }: Props) {
  const game = DRINK_GAMES[kind];
  const dialogRef = useRef<HTMLDialogElement>(null);
  const primaryRef = useRef<HTMLButtonElement>(null);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const phaseRef = useRef<Phase>("ready"), roundRef = useRef(0);
  const sequenceRef = useRef<number[]>([]), inputRef = useRef(0), completedRef = useRef(0);
  const resolvedRef = useRef(false), tickRef = useRef(onTick);
  const [phase, setPhase] = useState<Phase>("ready");
  const [round, setRound] = useState(0), [litPad, setLitPad] = useState<number | null>(null);
  const [entered, setEntered] = useState(0), [completed, setCompleted] = useState(0);
  const [reward, setReward] = useState(0), [message, setMessage] = useState("");
  const [padFlash, setPadFlash] = useState<number | null>(null), [padFlashKey, setPadFlashKey] = useState(0);
  const changePhase = useCallback((next: Phase) => { phaseRef.current = next; setPhase(next); }, []);
  const finish = () => {
    if (resolvedRef.current) return;
    resolvedRef.current = true;
    const amount = memoryReward(completedRef.current);
    setReward(amount); setLitPad(null); setPadFlash(null); changePhase("result");
    onResolve(kind, amount, completedRef.current);
  };
  const close = () => {
    if (phaseRef.current === "ready" || phaseRef.current === "result") onClose();
    else { setMessage("Награда за пройденные уровни сохранена."); finish(); }
  };
  const showSequence = useCallback((nextRound: number) => {
    roundRef.current = nextRound; setRound(nextRound);
    inputRef.current = 0; setEntered(0); setPadFlash(null);
    setMessage("Запомни порядок появлений."); changePhase("watch");
  }, [changePhase]);
  const start = () => {
    if (phaseRef.current !== "ready" || !onStart()) return;
    sequenceRef.current = createMemorySequence(); showSequence(0);
  };
  useEffect(() => { tickRef.current = onTick; });
  useEffect(() => {
    const dialog = dialogRef.current, previousFocus = document.activeElement as HTMLElement | null;
    dialog?.showModal(); primaryRef.current?.focus();
    const visibility = () => {
      if (document.hidden && ["watch", "playing", "between"].includes(phaseRef.current)) {
        setLitPad(null); setPadFlash(null); changePhase("paused");
      }
    };
    document.addEventListener("visibilitychange", visibility);
    return () => { document.removeEventListener("visibilitychange", visibility); if (flashTimerRef.current) clearTimeout(flashTimerRef.current); dialog?.close(); previousFocus?.focus({ preventScroll: true }); };
  }, [changePhase]);
  useEffect(() => {
    if (primaryRef.current) primaryRef.current.focus({ preventScroll: true });
    else if (phase === "playing") dialogRef.current?.querySelector<HTMLButtonElement>(".matcha-pad-grid button")?.focus({ preventScroll: true });
  }, [phase]);
  useEffect(() => {
    if (phase !== "watch") return;
    let stopped = false, step = 0;
    let timer: ReturnType<typeof setTimeout>;
    const timing = memoryFlashTiming(round);
    const flash = () => {
      if (stopped || phaseRef.current !== "watch") return;
      setLitPad(sequenceRef.current[step]); tickRef.current(sequenceRef.current[step]);
      timer = setTimeout(() => {
        if (stopped) return;
        setLitPad(null); step++;
        timer = setTimeout(() => {
          if (stopped || phaseRef.current !== "watch") return;
          if (step < memorySequenceLength(round)) flash();
          else { setMessage("Твой ход. Повтори порядок."); changePhase("playing"); }
        }, timing.gap);
      }, timing.on);
    };
    timer = setTimeout(flash, 450);
    return () => { stopped = true; clearTimeout(timer); };
  }, [phase, round, changePhase]);
  useEffect(() => {
    if (phase !== "between") return;
    const timer = setTimeout(() => { if (phaseRef.current === "between") showSequence(round + 1); }, 850);
    return () => clearTimeout(timer);
  }, [phase, round, showSequence]);
  const choosePad = (index: number) => {
    if (phaseRef.current !== "playing") return;
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    setPadFlash(index); setPadFlashKey(value => value + 1);
    flashTimerRef.current = setTimeout(() => setPadFlash(null), 180); onTick(index);
    if (sequenceRef.current[inputRef.current] !== index) { setMessage("Ошибка. Цепочка прервалась."); finish(); return; }
    inputRef.current++; setEntered(inputRef.current);
    if (inputRef.current === memorySequenceLength(roundRef.current)) {
      completedRef.current++; setCompleted(completedRef.current);
      if (completedRef.current === MEMORY_ROUNDS) { setMessage("Идеальная память!"); finish(); }
      else { setMessage("Верно! Ещё одно появление."); changePhase("between"); }
    }
  };
  const ready = phase === "ready", result = phase === "result";
  return <dialog ref={dialogRef} className="drink-game-dialog drink-game-matcha" aria-labelledby="drink-game-title" onCancel={event => { event.preventDefault(); close(); }}>
    <div className="memory-game-content">
      <header className="drink-game-header"><PotionArtwork kind={kind} className="drink-game-icon" /><div><small>МАТЧА / KNOPIK ARCADE</small><h2 id="drink-game-title">{game.title}</h2></div><button className="drink-game-close" type="button" aria-label={ready || result ? "К Кнопику" : "Завершить игру"} onClick={close}>×</button></header>
      <div className="drink-game-meta"><span>{ready ? "Начнём с пяти появлений" : result ? `Пройдено ${completed} уровней` : `Уровень ${round + 1}`}</span><span>Рекорд {best}</span></div>
      {result ? <section className="drink-game-result" role="status"><PixelBurst kind={reward > 0 ? "gold" : "tap"} count={48} /><small>ПОПЫТКА ЗАВЕРШЕНА</small><h3>{reward ? "Хорошая память!" : "Ещё один заход?"}</h3><strong>+{reward}<span>Knopik Coin</span></strong><p>{message}</p><div className="drink-result-dots" aria-hidden="true">{Array.from({ length: MEMORY_ROUNDS }, (_, i) => <i key={i} className={i < completed ? "is-hit" : ""} />)}</div></section> : <main className="memory-game-stage">
        <div className="drink-round-readout"><span>Награда<strong>{memoryReward(completed)} <small>KC</small></strong></span><span>{phase === "watch" ? "Запомни" : "Повтори"}<strong>{entered} / {memorySequenceLength(round)}</strong></span></div>
        <div className="memory-board"><div className={`matcha-pad-grid phase-${phase}`} aria-label="Девять труб Сахура">
          {phase === "between" && <PixelBurst key={`round-burst-${round}`} kind="gold" count={48} className="matcha-level-burst" />}
          {Array.from({ length: 9 }, (_, i) => ready ? <div key={i} aria-hidden="true"><PixelMemoryPipe /></div> : <button key={i} type="button" aria-label={`${PAD_NAMES[i]} труба`} disabled={phase !== "playing"} className={litPad === i || padFlash === i ? "is-lit" : ""} onClick={() => choosePad(i)}><PixelMemoryPipe />{padFlash === i && <PixelBurst key={padFlashKey} kind="tap" count={16} />}</button>)}
        </div></div>
        <div className="matcha-sequence-track" aria-label={`Повторено ${entered} из ${memorySequenceLength(round)}`}>{Array.from({ length: memorySequenceLength(round) }, (_, i) => <i key={i} className={i < entered ? "is-complete" : ""} />)}</div>
      </main>}
      <footer className="memory-game-footer">
        <p className="drink-game-status" role="status">{ready ? "Запомни, из каких труб появится Сахур. Повтори этот порядок." : phase === "paused" ? "Пауза. Повторим текущую последовательность." : message}</p>
        {ready ? <button ref={primaryRef} className="drink-game-primary" type="button" onClick={start}>Играть</button> : result ? <button ref={primaryRef} className="drink-game-primary" type="button" onClick={onClose}>К Кнопику</button> : phase === "paused" ? <button ref={primaryRef} className="drink-game-primary" type="button" onClick={() => showSequence(round)}>Продолжить</button> : <p className="drink-game-fine">{phase === "watch" ? "СМОТРИ" : phase === "between" ? "СЛЕДУЮЩИЙ УРОВЕНЬ…" : "ТВОЙ ХОД"}</p>}
      </footer>
    </div>
  </dialog>;
}
