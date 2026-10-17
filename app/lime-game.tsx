"use client";
import {getVisualFpsLimit} from "./graphics-quality";
import {FramePaintLimiter} from "./render-preferences";
import { useEffect, useRef, useState } from "react";
import { LimeEngine, type LimePhase } from "./lime-engine";
import { LIME_MAX_SCORE } from "./drink-game-engine";
import { LimeMachine } from "./lime-machine";
import { GameModal } from "./game-modal";
import { PixelBurst } from "./pixel-effects";
import { PotionArtwork } from "./cosmetic-artwork";
import {SkillBetPicker} from "./skill-bet-picker";
import {resolveSkillWager,skillWagerPayout} from "./skill-wager-engine";

type Props = { onReplay?:()=>void;best: number; balance?:number; canChooseBet?:boolean; onStart: (bet:number) => boolean; onResolve: (kind: "lime", reward: number, score: number) => void; onClose: () => void; onTick: () => void };
export function LimeGame(props: Props) {
  const [engine] = useState(() => new LimeEngine());
  const [phase, setPhase] = useState<LimePhase>("ready");
  const [target, setTarget] = useState({ center: 50, width: 20 });
  const [seconds, setSeconds] = useState(6);
  const [accuracy, setAccuracy] = useState(0);
  const [message, setMessage] = useState("Брось лайм, когда он окажется над стаканом.");
  const [reward, setReward] = useState(0);
  const [bet,setBet]=useState(0),[lockedBet,setLockedBet]=useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resolved = useRef(false), propsRef = useRef(props);
  useEffect(() => { propsRef.current = props; }, [props]);
  const finish = () => {
    if (resolved.current) return;
    resolved.current = true;
    const result = engine.finish();
    setReward(result.reward); setPhase("result");
    propsRef.current.onResolve("lime", result.reward, result.score);
  };
  const finishRef = useRef(finish);
  useEffect(() => { finishRef.current = finish; });
  const complete = (expired = false) => {
    const score = engine.press(performance.now(), expired);
    if (score === null) return;
    setAccuracy(score); setPhase("pressing");
    setMessage(expired ? "Время вышло. Попытка завершена." : score >= 85 ? "Точно в центр!" : score > 0 ? "Попал!" : "Мимо. Попытка завершена.");
    propsRef.current.onTick();
    settleTimer.current = setTimeout(() => finishRef.current(), 760);
  };
  const completeRef = useRef(complete);
  useEffect(() => { completeRef.current = complete; });
  const start = () => {
    const selected=resolveSkillWager(props.balance??0,bet,!!props.canChooseBet);
    if (engine.phase !== "ready" || !props.onStart(selected)) return;
    setLockedBet(selected);
    if(!engine.start(performance.now()))return;
    trackRef.current?.style.setProperty("--cursor", "8%");
    setTarget({ ...engine.target }); setPhase("playing");
  };
  useEffect(() => {
    if (phase !== "playing") return;
    let frame = 0, lastSecond = -1;
    const limiter=new FramePaintLimiter();
    const animate = (now: number) => {
      if (engine.phase !== "playing") return;
      const sample = engine.sample(now);
      if(limiter.due(now,getVisualFpsLimit()))trackRef.current?.style.setProperty("--cursor", `${sample.cursor}%`);
      if (sample.seconds !== lastSecond) { lastSecond = sample.seconds; setSeconds(sample.seconds); }
      if (sample.expired) { completeRef.current(true); return; }
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [phase, engine]);
  useEffect(() => {
    const blur = () => { if (engine.pause(performance.now())) setPhase("paused"); };
    const pause = () => { if (document.hidden) blur(); };
    document.addEventListener("visibilitychange", pause);
    window.addEventListener('blur',blur);
    return () => { window.removeEventListener('blur',blur);document.removeEventListener("visibilitychange", pause); if (settleTimer.current) clearTimeout(settleTimer.current); };
  }, [engine]);
  const close = () => {
    if (engine.phase === "ready" || engine.phase === "result") { props.onClose(); return; }
    if (settleTimer.current) clearTimeout(settleTimer.current);
    finish();
  };
  const ready = phase === "ready", result = phase === "result";
  return <GameModal className={`lime-game lime-phase-${phase}`} label="Лайм — точный бросок" onDismiss={close}>
    <div className="lime-game-content">
      <header className="lime-game-heading"><PotionArtwork kind="lime" /><div><small>ЛАЙМ / KNOPIK ARCADE</small><h2>ТОЧНЫЙ БРОСОК</h2></div><button type="button" aria-label={ready || result ? "К напиткам" : "Завершить попытку"} onClick={close}>×</button></header>
      <div className="lime-game-readout"><span>{result ? "Точность" : "Одна бутылка"}<strong>{result ? `${accuracy}%` : "ОДИН БРОСОК"}</strong></span><span>Рекорд<strong>{Math.round(props.best / LIME_MAX_SCORE * 100)}%</strong></span></div>
      {result ? <section className={`lime-final ${reward ? "is-hit" : "is-miss"}`}><PixelBurst kind={reward ? "gold" : "tap"} count={48} /><PotionArtwork kind="lime" /><h3>{reward ? accuracy >= 85 ? "В самый сок!" : "Попадание!" : "Мимо"}</h3><strong>+{reward+skillWagerPayout(lockedBet,Math.round(accuracy/100*LIME_MAX_SCORE),LIME_MAX_SCORE)} KC</strong><p>{reward ? "Монеты уже на балансе" : "Этот бросок без награды"}</p></section> : <LimeMachine phase={phase} target={target} trackRef={trackRef} score={phase === "pressing" ? accuracy : undefined} />}
      <p className="lime-game-feedback" role="status">{phase === "paused" ? "Пауза. Время сохранено." : result ? "" : message}</p>
      <footer className="lime-game-footer">{phase==="ready"&&<SkillBetPicker balance={props.balance??0} canChooseBet={!!props.canChooseBet} amount={bet} onChange={setBet}/>}{result&&props.onReplay&&<button type="button" className="lime-game-action" onClick={props.onReplay}>ЕЩЁ РАЗ</button>}
        <span className="lime-game-timer">{phase === "playing" ? `${seconds} СЕК` : ready ? "Попал — выиграл. Промах — конец." : phase === "paused" ? "ПАУЗА" : phase === "pressing" ? "БРОСОК…" : ""}</span>
        <button type="button" className="lime-game-action" disabled={phase === "pressing"} onPointerDown={event => { if (event.button === 0 && engine.phase === "playing") complete(); }} onClick={() => { if (result) props.onClose(); else if (phase === "paused") { if (engine.resume(performance.now())) setPhase("playing"); } else if (engine.phase === "playing") complete(); else start(); }}>{ready ? "ИГРАТЬ" : result ? "К НАПИТКАМ" : phase === "paused" ? "ПРОДОЛЖИТЬ" : phase === "pressing" ? "БРОСОК…" : "БРОСИТЬ"}</button>
        <small>{ready ? "Чем ближе к центру, тем больше награда · до 120 KC" : ""}</small>
      </footer>
    </div>
  </GameModal>;
}
