"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { PotionArtwork } from "./cosmetic-artwork";
import { PixelBurst } from "./pixel-effects";
import { PixelMemoryPipe } from "./pixel-artwork";
import {
  DRINK_GAMES, LIME_ROUNDS, LIME_MAX_SCORE, MEMORY_ROUNDS,
  createMemorySequence, limePosition, limeTarget, limeTargetCenter, limeRoundWindow,
  limeReward, memoryReward, memorySequenceLength, memoryFlashTiming, scoreLime,
  type DrinkGameKind,
} from "./drink-game-engine";

type Phase = "ready" | "playing" | "watch" | "between" | "result";
type Props = {
  kind: DrinkGameKind;
  best: number;
  onStart: () => boolean;
  onResolve: (kind: DrinkGameKind, reward: number, score: number) => void;
  onClose: () => void;
  onTick: (pad?: number) => void;
};
const PAD_NAMES = ["Верхний левый", "Верхний средний", "Верхний правый", "Средний левый", "Центральный", "Средний правый", "Нижний левый", "Нижний средний", "Нижний правый"];

export function DrinkGamePanel({ kind, best, onStart, onResolve, onClose, onTick }: Props) {
  const game = DRINK_GAMES[kind];
  const rounds = kind === "lime" ? LIME_ROUNDS : MEMORY_ROUNDS;
  const dialogRef = useRef<HTMLDialogElement>(null);
  const primaryRef = useRef<HTMLButtonElement>(null);
  const cursorRef = useRef<HTMLSpanElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startedAtRef = useRef(0);
  const phaseRef = useRef<Phase>("ready");
  const roundRef = useRef(0);
  const scoresRef = useRef<number[]>([]);
  const sequenceRef = useRef<number[]>([]);
  const inputRef = useRef(0);
  const completedRef = useRef(0);
  const targetRef = useRef({ center: 50, width: 14 });
  const resolvedRef = useRef(false);
  const autoStartedRef = useRef(false);
  const tickRef = useRef(onTick);
  const [phase, setPhase] = useState<Phase>("ready");
  const [round, setRound] = useState(0);
  const [scores, setScores] = useState<number[]>([]);
  const [target, setTarget] = useState({ center: 50, width: 14 });
  const [seconds, setSeconds] = useState(4);
  const [litPad, setLitPad] = useState<number | null>(null);
  const [entered, setEntered] = useState(0);
  const [completed, setCompleted] = useState(0);
  const [reward, setReward] = useState(0);
  const [message, setMessage] = useState("");
  const [padFlash, setPadFlash] = useState<number | null>(null);
  const [padFlashKey, setPadFlashKey] = useState(0);
  const changePhase = (next: Phase) => { phaseRef.current = next; setPhase(next); };

  const finish = () => {
    if (resolvedRef.current) return;
    resolvedRef.current = true;
    const baseReward = kind === "lime" ? limeReward(scoresRef.current) : memoryReward(completedRef.current);
    setReward(baseReward);
    setLitPad(null);
    setPadFlash(null);
    changePhase("result");
    onResolve(kind, baseReward, kind === "lime" ? scoresRef.current.reduce((a, b) => a + b, 0) : completedRef.current);
  };
  const finishRef = useRef(finish);
  useEffect(() => { finishRef.current = finish; tickRef.current = onTick; });

  const close = () => {
    if (phaseRef.current === "ready" || phaseRef.current === "result") onClose();
    else {
      setMessage("Награда за пройденные уровни сохранена.");
      finish();
    }
  };

  const startLime = (nextRound: number) => {
    const nextTarget = limeTarget(nextRound);
    targetRef.current = nextTarget;
    setTarget(nextTarget);
    roundRef.current = nextRound;
    setRound(nextRound);
    startedAtRef.current = performance.now();
    setSeconds(Math.ceil(limeRoundWindow(nextRound) / 1000));
    setMessage(nextRound >= 5 ? "Цель тоже движется. Поймай её центр." : "Поймай светлую каплю в зелёной зоне.");
    changePhase("playing");
  };
  const showSequence = (nextRound: number) => {
    roundRef.current = nextRound;
    setRound(nextRound);
    inputRef.current = 0;
    setEntered(0);
    setPadFlash(null);
    setMessage("Запомни, из каких труб появляется Сахур.");
    changePhase("watch");
  };
  const start = () => {
    if (phaseRef.current !== "ready" || !onStart()) return;
    if (kind === "lime") startLime(0);
    else {
      sequenceRef.current = createMemorySequence();
      showSequence(0);
    }
  };
  const startRef = useRef(start);
  useEffect(() => { startRef.current = start; });

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement as HTMLElement | null;
    dialog?.showModal();
    primaryRef.current?.focus();
    return () => {
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
      dialog?.close();
      previousFocus?.focus({ preventScroll: true });
    };
  }, []);
  // The parent ledger consumes one bottle, including React Strict Mode remounts.
  useEffect(() => {
    if (kind === "matcha" && !autoStartedRef.current) {
      autoStartedRef.current = true;
      startRef.current();
    }
  }, [kind]);
  useEffect(() => {
    if (primaryRef.current) primaryRef.current.focus({ preventScroll: true });
    else if (kind === "matcha" && phase === "playing")
      dialogRef.current?.querySelector<HTMLButtonElement>(".matcha-pad-grid button")?.focus({ preventScroll: true });
  }, [kind, phase]);

  useEffect(() => {
    if (kind !== "matcha" || phase !== "watch") return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    let step = 0;
    const timing = memoryFlashTiming(round);
    const flash = () => {
      if (stopped || phaseRef.current !== "watch") return;
      setLitPad(sequenceRef.current[step]);
      tickRef.current(sequenceRef.current[step]);
      timer = setTimeout(() => {
        if (stopped) return;
        setLitPad(null);
        step++;
        timer = setTimeout(() => {
          if (stopped || phaseRef.current !== "watch") return;
          if (step < memorySequenceLength(round)) flash();
          else {
            setMessage("Твой ход. Повтори порядок.");
            changePhase("playing");
          }
        }, timing.gap);
      }, timing.on);
    };
    timer = setTimeout(flash, 280);
    return () => { stopped = true; clearTimeout(timer); };
  }, [kind, phase, round]);

  useEffect(() => {
    if (kind !== "lime" || phase !== "playing") return;
    let frame = 0;
    let shownSeconds = -1;
    const animate = () => {
      if (phaseRef.current !== "playing") return;
      const elapsed = performance.now() - startedAtRef.current;
      const center = limeTargetCenter(elapsed, round, targetRef.current.center);
      cursorRef.current?.style.setProperty("--cursor", `${limePosition(elapsed, round)}%`);
      trackRef.current?.style.setProperty("--target-start", `${center - targetRef.current.width / 2}%`);
      const remaining = Math.max(0, Math.ceil((limeRoundWindow(round) - elapsed) / 1000));
      if (remaining !== shownSeconds) { shownSeconds = remaining; setSeconds(remaining); }
      if (elapsed >= limeRoundWindow(round)) {
        scoresRef.current = [...scoresRef.current, 0];
        setScores(scoresRef.current);
        setMessage("Время вышло. Следующий бросок впереди.");
        if (round + 1 === LIME_ROUNDS) finishRef.current();
        else changePhase("between");
        return;
      }
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [kind, phase, round]);

  // Matcha proceeds automatically; each level adds one more flash.
  useEffect(() => {
    if (kind !== "matcha" || phase !== "between") return;
    const timer = setTimeout(() => {
      if (phaseRef.current === "between") showSequence(round + 1);
    }, 850);
    return () => clearTimeout(timer);
  }, [kind, phase, round]);

  const catchLime = () => {
    if (phaseRef.current !== "playing") return;
    const elapsed = performance.now() - startedAtRef.current;
    const { center, width } = targetRef.current;
    const score = elapsed >= limeRoundWindow(roundRef.current) ? 0
      : scoreLime(limePosition(elapsed, roundRef.current), limeTargetCenter(elapsed, roundRef.current, center), width);
    scoresRef.current = [...scoresRef.current, score];
    setScores(scoresRef.current);
    setMessage(score >= 80 ? `В самый сок! +${score}` : score > 0 ? `Поймал! +${score}` : "Мимо. Ещё один заход.");
    onTick();
    if (roundRef.current + 1 === LIME_ROUNDS) finish();
    else changePhase("between");
  };
  const choosePad = (index: number) => {
    if (phaseRef.current !== "playing" || kind !== "matcha") return;
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    setPadFlash(index);
    setPadFlashKey(value => value + 1);
    flashTimerRef.current = setTimeout(() => setPadFlash(null), 180);
    onTick(index);
    if (sequenceRef.current[inputRef.current] !== index) {
      setMessage("Цепочка прервалась. Пройденные уровни засчитаны.");
      finish();
      return;
    }
    inputRef.current++;
    setEntered(inputRef.current);
    if (inputRef.current === memorySequenceLength(roundRef.current)) {
      completedRef.current++;
      setCompleted(completedRef.current);
        setMessage("Запомнил! Добавляем ещё одно появление.");
      if (completedRef.current === MEMORY_ROUNDS) {
        setMessage("Все 25 уровней. Идеальная память!");
        finish();
      } else changePhase("between");
    }
  };
  const isReady = phase === "ready" && kind === "lime";
  const isResult = phase === "result";
  const currentReward = kind === "lime" ? limeReward(scores) : memoryReward(completed);
  const totalScore = scores.reduce((a, b) => a + b, 0);

  return <dialog ref={dialogRef} className={`drink-game-dialog drink-game-${kind}`} aria-labelledby="drink-game-title" onCancel={event => { event.preventDefault(); close(); }}>
    <header className="drink-game-header">
      <PotionArtwork kind={kind} className="drink-game-icon" />
      <div><small>{game.name} / Knopik GO</small><h2 id="drink-game-title">{game.title}</h2></div>
      <button className="drink-game-close" type="button" aria-label={isReady || isResult ? "Вернуться к Кнопику" : "Завершить игру"} onClick={close}>×</button>
    </header>
    <div className="drink-game-meta"><span>{isReady ? "25 бросков" : `Уровень ${round + 1} / ${rounds}`}</span><span>Рекорд {best} / {kind === "lime" ? LIME_MAX_SCORE : MEMORY_ROUNDS}</span></div>

    {isReady ? <div className="drink-game-intro">
      <div className="drink-intro-symbol lime-intro-pixels" aria-hidden="true"><i /><i /><i /><i /><i /></div>
      <h3>25 бросков. В самый центр.</h3>
      <p>Поймай каплю в зелёной зоне. Курсор ускоряется, цель сужается. С шестого броска она тоже движется. Чем точнее попадание, тем больше монет.</p>
      <div className="drink-reward-note"><span>Награда за навык</span><strong>до {game.maximumReward} KC</strong></div>
      <p className="drink-game-fine">Одна бутылка на всю серию.</p>
    </div> : isResult ? <div className="drink-game-result" role="status">
      <PixelBurst kind={reward > 0 ? "gold" : "tap"} count={64} />
      <small>{kind === "lime" ? `${totalScore} / ${LIME_MAX_SCORE} очков` : `${completed} / ${MEMORY_ROUNDS} уровней`}</small>
      <h3>{reward > 0 ? "Хороший глоток." : "Ещё один заход?"}</h3>
      <strong>+{reward}<span>Knopik Coin</span></strong><p>{message}</p>
      <div className="drink-result-dots" aria-hidden="true">{Array.from({ length: rounds }, (_, i) => <i key={i} className={(kind === "lime" ? scores[i] > 0 : i < completed) ? "is-hit" : ""} />)}</div>
    </div> : <>
      <div className="drink-round-readout"><span>Накоплено<strong>{currentReward} <small>KC</small></strong></span><span>{kind === "lime" ? "На бросок" : phase === "watch" ? "Запомни" : "Повторено"}<strong>{kind === "lime" ? `${seconds}с` : `${entered} / ${memorySequenceLength(round)}`}</strong></span></div>
      {kind === "lime" ? <div className="lime-playfield">
        <div className="lime-target-label">{round >= 5 ? "Движущаяся цель" : "Поймай центр"}</div>
        <div ref={trackRef} className="lime-track" style={{ "--target-start": `${limeTargetCenter(0, round, target.center) - target.width / 2}%`, "--target-width": `${target.width}%` } as CSSProperties}>
          <span className="lime-zone" aria-label="Лаймовая зона" /><span ref={cursorRef} className="lime-cursor" aria-hidden="true" />
        </div>
        <div className="lime-scale" aria-hidden="true"><span>0</span><span>50</span><span>100</span></div>
        <div className="lime-scoreboard" aria-label="Результаты 25 бросков">{Array.from({ length: LIME_ROUNDS }, (_, i) => <span key={i} className={scores[i] > 0 ? "is-hit" : i === round ? "is-current" : ""}>{scores[i] ?? "·"}</span>)}</div>
        {scores.length > 0 && <PixelBurst key={scores.length} kind={scores[scores.length - 1] > 65 ? "gold" : "tap"} count={32} className="lime-pixel-burst" />}
      </div> : <>
        <div className={`matcha-pad-grid phase-${phase}`} aria-label="Девять труб Сахура">
          {phase === "between" && <PixelBurst key={round} kind="gold" count={80} className="matcha-level-burst"/>}
          {Array.from({ length: 9 }, (_, i) => <button key={i} type="button" aria-label={`${PAD_NAMES[i]} труба`} disabled={phase !== "playing"} className={litPad === i || padFlash === i ? "is-lit" : ""} onClick={() => choosePad(i)}>
            <PixelMemoryPipe />
            {padFlash === i && <PixelBurst key={padFlashKey} kind="tap" count={24} />}
          </button>)}
        </div>
        <div className="matcha-sequence-track" aria-label={`Повторено ${entered} из ${memorySequenceLength(round)}`}>
          {Array.from({ length: memorySequenceLength(round) }, (_, i) => <i key={i} className={i < entered ? "is-complete" : ""} />)}
        </div>
      </>}
      <p className="drink-game-status" role="status">{message}</p>
    </>}

    {isReady ? <button ref={primaryRef} className="drink-game-primary" type="button" onClick={start}>Начать серию</button>
      : isResult ? <button ref={primaryRef} className="drink-game-primary" type="button" onClick={onClose}>К Кнопику</button>
      : kind === "lime" ? <button ref={primaryRef} className="drink-game-primary" type="button" onClick={() => phase === "between" ? startLime(round + 1) : catchLime()}>{phase === "between" ? "Следующий бросок" : "Поймать"}</button>
      : <p className="drink-game-fine">{phase === "watch" ? "Смотри" : phase === "between" ? "Следующий уровень…" : "Твой ход"}</p>}
  </dialog>;
}
