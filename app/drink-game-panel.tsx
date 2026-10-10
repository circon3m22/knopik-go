"use client";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { PotionArtwork } from "./cosmetic-artwork";
import { PixelBurst } from "./pixel-effects";
import { DRINK_GAMES, LIME_ROUNDS, LIME_WINDOW_MS, MEMORY_ROUNDS, createMemorySequence, limePosition, limeTarget, limeReward, memoryReward, scoreLime, type DrinkGameKind, } from "./drink-game-engine";
type Phase = "ready" | "playing" | "watch" | "between" | "result";
type Props = {
    kind: DrinkGameKind;
    best: number;
    onStart: () => boolean;
    onResolve: (kind: DrinkGameKind, reward: number, score: number) => void;
    onClose: () => void;
    onTick: () => void;
    rewardMultiplier?: number;
};
export function DrinkGamePanel({ kind, best, onStart, onResolve, onClose, onTick, rewardMultiplier = 1 }: Props) {
    const game = DRINK_GAMES[kind];
    const dialogRef = useRef<HTMLDialogElement>(null);
    const primaryRef = useRef<HTMLButtonElement>(null);
    const cursorRef = useRef<HTMLSpanElement>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const startedAtRef = useRef(0);
    const phaseRef = useRef<Phase>("ready");
    const roundRef = useRef(0);
    const scoresRef = useRef<number[]>([]);
    const sequenceRef = useRef<number[]>([]);
    const inputRef = useRef(0);
    const completedRef = useRef(0);
    const targetRef = useRef({ center: 50, width: 30 });
    const resolvedRef = useRef(false);
    const [phase, setPhase] = useState<Phase>("ready");
    const [round, setRound] = useState(0);
    const [scores, setScores] = useState<number[]>([]);
    const [target, setTarget] = useState({ center: 50, width: 30 });
    const [seconds, setSeconds] = useState(5);
    const [litPad, setLitPad] = useState<number | null>(null);
    const [entered, setEntered] = useState(0);
    const [completed, setCompleted] = useState(0);
    const [reward, setReward] = useState(0);
    const [message, setMessage] = useState("");
    const [padFlash, setPadFlash] = useState<number | null>(null);
    const [padFlashKey, setPadFlashKey] = useState(0);
    const changePhase = (next: Phase) => { phaseRef.current = next; setPhase(next); };
    const finish = () => {
        if (resolvedRef.current)
            return;
        resolvedRef.current = true;
        if (timerRef.current)
            clearTimeout(timerRef.current);
        const baseReward = kind === "lime" ? limeReward(scoresRef.current) : memoryReward(completedRef.current);
        const payout = Math.floor(baseReward * rewardMultiplier);
        const score = kind === "lime" ? scoresRef.current.reduce((a, b) => a + b, 0) : completedRef.current;
        setReward(payout);
        setLitPad(null);
        changePhase("result");
        onResolve(kind, baseReward, score);
    };
    // The animation effect always calls the latest settlement closure.
    const finishRef = useRef(finish);
    useEffect(() => { finishRef.current = finish; });
    const close = () => {
        if (phaseRef.current === "ready" || phaseRef.current === "result")
            onClose();
        else {
            setMessage("Игра завершена. Награда за пройденные этапы сохранена.");
            finish();
        }
    };
    useEffect(() => {
        const dialog = dialogRef.current;
        const previousFocus = document.activeElement as HTMLElement | null;
        dialog?.showModal();
        primaryRef.current?.focus();
        return () => {
            if (timerRef.current)
                clearTimeout(timerRef.current);
            dialog?.close();
            previousFocus?.focus({ preventScroll: true });
        };
    }, []);
    useEffect(() => {
        if (primaryRef.current)
            primaryRef.current.focus({ preventScroll: true });
        else if (kind === "matcha" && phase === "playing")
            dialogRef.current?.querySelector<HTMLButtonElement>(".matcha-pad-grid button")?.focus({ preventScroll: true });
    }, [kind, phase]);
    useEffect(() => {
        if (kind !== "lime" || phase !== "playing")
            return;
        let frame = 0;
        const animate = () => {
            const elapsed = performance.now() - startedAtRef.current;
            const position = limePosition(elapsed, roundRef.current);
            cursorRef.current?.style.setProperty("--cursor", `${position}%`);
            setSeconds(Math.max(0, Math.ceil((LIME_WINDOW_MS - elapsed) / 1000)));
            if (elapsed >= LIME_WINDOW_MS) {
                scoresRef.current = [...scoresRef.current, 0];
                setScores(scoresRef.current);
                setMessage("Не успел. Следующий бросок ещё впереди.");
                if (roundRef.current + 1 === LIME_ROUNDS)
                    finishRef.current();
                else {
                    phaseRef.current = "between";
                    setPhase("between");
                }
                return;
            }
            frame = requestAnimationFrame(animate);
        };
        frame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(frame);
    }, [kind, phase, round]);
    const startLime = (nextRound: number) => {
        const nextTarget = limeTarget(nextRound);
        targetRef.current = nextTarget;
        setTarget(nextTarget);
        roundRef.current = nextRound;
        setRound(nextRound);
        startedAtRef.current = performance.now();
        setSeconds(5);
        setMessage("Лови белую каплю внутри лаймовой зоны.");
        changePhase("playing");
    };
    const showSequence = (nextRound: number) => {
        roundRef.current = nextRound;
        setRound(nextRound);
        inputRef.current = 0;
        setEntered(0);
        setMessage("Смотри на кнопки. Порядок важен.");
        changePhase("watch");
        let step = 0;
        const flash = () => {
            if (phaseRef.current !== "watch")
                return;
            setLitPad(sequenceRef.current[step]);
            onTick();
            timerRef.current = setTimeout(() => {
                setLitPad(null);
                step++;
                timerRef.current = setTimeout(() => {
                    if (step < nextRound + 2)
                        flash();
                    else {
                        setMessage("Твой ход. Повтори последовательность.");
                        changePhase("playing");
                    }
                }, 220);
            }, 650);
        };
        timerRef.current = setTimeout(flash, 500);
    };
    const start = () => {
        if (phaseRef.current !== "ready" || !onStart())
            return;
        if (kind === "lime")
            startLime(0);
        else {
            sequenceRef.current = createMemorySequence();
            showSequence(0);
        }
    };
    const catchLime = () => {
        if (phaseRef.current !== "playing")
            return;
        const elapsed = performance.now() - startedAtRef.current;
        const { center, width } = targetRef.current;
        const score = elapsed >= LIME_WINDOW_MS ? 0 : scoreLime(limePosition(elapsed, roundRef.current), center, width);
        scoresRef.current = [...scoresRef.current, score];
        setScores(scoresRef.current);
        setMessage(score >= 80 ? `В самый сок! +${score} очков.` : score > 0 ? `В зоне! +${score} очков.` : "Мимо. Соберись перед следующим броском.");
        onTick();
        if (roundRef.current + 1 === LIME_ROUNDS)
            finish();
        else
            changePhase("between");
    };
    const choosePad = (index: number) => {
        if (phaseRef.current !== "playing" || kind !== "matcha")
            return;
        setPadFlash(index);
        setPadFlashKey(value => value + 1);
        onTick();
        if (sequenceRef.current[inputRef.current] !== index) {
            setMessage(`Другой вкус. Правильной была кнопка ${sequenceRef.current[inputRef.current] + 1}.`);
            finish();
            return;
        }
        inputRef.current++;
        setEntered(inputRef.current);
        if (inputRef.current === roundRef.current + 2) {
            completedRef.current++;
            setCompleted(completedRef.current);
            setMessage("Вкус запомнил. Следующая цепочка будет длиннее.");
            if (completedRef.current === MEMORY_ROUNDS) {
                setMessage("Все пять вкусов запомнил. Идеальная Матча!");
                finish();
            }
            else
                changePhase("between");
        }
    };
    const isReady = phase === "ready";
    const isResult = phase === "result";
    const currentReward = Math.floor((kind === "lime" ? limeReward(scores) : memoryReward(completed)) * rewardMultiplier);
    return <dialog ref={dialogRef} className={`drink-game-dialog drink-game-${kind}`} aria-labelledby="drink-game-title" onCancel={event => { event.preventDefault(); close(); }}>
    <header className="drink-game-header">
      <PotionArtwork kind={kind} className="drink-game-icon"/>
      <div><small>{game.name} / Knopik GO</small><h2 id="drink-game-title">{game.title}</h2></div>
      <button className="drink-game-close" type="button" aria-label={isReady || isResult ? "Вернуться к Кнопику" : "Завершить игру"} onClick={close}>×</button>
    </header>
    <div className="drink-game-meta"><span>{isReady ? "Одна бутылка — одна игра" : `Этап ${Math.min(round + 1, 5)} / 5`}</span><span>Рекорд: {best}{kind === "lime" ? " / 500" : " / 5"}</span></div>

    {isReady ? <div className="drink-game-intro">
      <div className="drink-intro-symbol" aria-hidden="true">{kind === "lime" ? "◎" : "1 · 2 · 3"}</div>
      <h3>{kind === "lime" ? "Пять бросков. Поймай момент." : "У каждого вкуса свой порядок."}</h3>
      <p>{kind === "lime" ? "Белая капля движется по шкале. Нажми «Поймать», когда она внутри лаймовой зоны. Ближе к центру — больше монет. На каждый бросок пять секунд." : "Кнопки загораются по очереди. Запомни и повтори их порядок. Цепочка растёт от двух до шести кнопок. Ошибка завершает игру; пройденные этапы дают награду."}</p>
      <div className="drink-reward-note"><span>Награда за навык{rewardMultiplier > 1 ? " · жетон +10%" : ""}</span><strong>до {Math.floor(game.maximumReward * rewardMultiplier)} KC</strong></div>
      <p className="drink-game-fine">Бутылка расходуется после старта. Дополнительных ставок нет.</p>
    </div> : isResult ? <div className="drink-game-result" role="status">
      {<PixelBurst kind={reward > 0 ? "gold" : "tap"} count={64}/>}
      <small>{kind === "lime" ? `${scores.reduce((a, b) => a + b, 0)} / 500 очков` : `${completed} / 5 этапов`}</small>
      <h3>{reward > 0 ? "Хороший глоток." : "Попробуй другой заход."}</h3>
      <strong>+{reward}<span>Knopik Coin</span></strong><p>{message}</p>
      <div className="drink-result-dots" aria-hidden="true">{Array.from({ length: 5 }, (_, i) => <i key={i} className={(kind === "lime" ? scores[i] > 0 : i < completed) ? "is-hit" : ""}/>)}</div>
    </div> : <>
      <div className="drink-round-readout"><span>Накоплено<strong>{currentReward} <small>KC</small></strong></span><span>{kind === "lime" ? "На бросок" : "Повторено"}<strong>{kind === "lime" ? `${seconds}с` : `${entered} / ${round + 2}`}</strong></span></div>
      {kind === "lime" ? <div className="lime-playfield">
        <div className="lime-target-label">В самый сок ↓</div>
        <div className="lime-track" style={{ "--target-start": `${target.center - target.width / 2}%`, "--target-width": `${target.width}%` } as CSSProperties}>
          <span className="lime-zone" aria-label="Лаймовая зона"/><span ref={cursorRef} className="lime-cursor" aria-hidden="true"/>
        </div><div className="lime-scale" aria-hidden="true"><span>0</span><span>50</span><span>100</span></div>
        <div className="lime-scoreboard" aria-label="Результаты бросков">{Array.from({ length: 5 }, (_, i) => <span key={i} className={scores[i] > 0 ? "is-hit" : ""}>{scores[i] ?? "·"}</span>)}</div>
        {scores.length > 0 && <PixelBurst key={scores.length} kind={scores[scores.length - 1] > 65 ? "gold" : "tap"} count={32} className="lime-pixel-burst"/>}
      </div> : <div className="matcha-pad-grid" aria-label="Девять вкусов">
        {Array.from({ length: 9 }, (_, i) => <button key={i} type="button" aria-label={`Вкус ${i + 1}`} aria-pressed={litPad === i} disabled={phase !== "playing"} className={litPad === i ? "is-lit" : ""} onClick={() => choosePad(i)}>{i + 1}{padFlash === i && <PixelBurst key={padFlashKey} count={16}/>}</button>)}
      </div>}
      <p className="drink-game-status" role="status">{kind === "matcha" && litPad !== null ? `Кнопка ${litPad + 1}. ` : ""}{message}</p>
    </>}

    {isReady ? <button ref={primaryRef} className="drink-game-primary" type="button" onClick={start}>Открыть бутылку и начать</button>
            : isResult ? <button ref={primaryRef} className="drink-game-primary" type="button" onClick={onClose}>К Кнопику</button>
                : phase === "between" ? <button ref={primaryRef} className="drink-game-primary" type="button" onClick={() => kind === "lime" ? startLime(round + 1) : showSequence(round + 1)}>{kind === "lime" ? "Следующий бросок" : "Следующая последовательность"}</button>
                    : kind === "lime" ? <button ref={primaryRef} className="drink-game-primary" type="button" onClick={catchLime}>Поймать</button>
                        : <p className="drink-game-fine">{phase === "watch" ? "Сначала смотри — затем повтори" : "Нажми кнопки в том же порядке"}</p>}
  </dialog>;
}
