"use client";
import { useEffect, useId, useRef, useState, type PointerEvent } from "react";
import { GameModal } from "./game-modal";
import { CoinArtwork } from "./collectible-artwork";
import { RunnerScene, RUNNER_ART_REVISION } from "./runner-artwork";
import { RunnerEngine, type RunnerAction, type RunnerOptions, type RunnerPhase, type RunnerResult } from "./runner-engine";
import { RunnerRenderer, RUNNER_ZONES } from "./runner-renderer";
import type { KnopikSoundEngine } from "./sound-engine";

type Props = { balance: number; best: number; options: RunnerOptions; vibration: boolean; getSound: () => KnopikSoundEngine; onCollect: (amount: number) => void; onFinish: (result: RunnerResult) => void; onClose: () => void };
function Arrow({ direction }: { direction: RunnerAction }) {
  return <svg viewBox="0 0 24 24" className="pixel-art" fill="currentColor" aria-hidden="true"><g transform={direction === "left" ? "rotate(-90 12 12)" : direction === "right" ? "rotate(90 12 12)" : direction === "roll" ? "rotate(180 12 12)" : undefined}><path d="M10 3h4v3h3v3h3v4h-4v-3h-2v11h-4V10H8v3H4V9h3V6h3Z" /></g></svg>;
}

export function RunnerGame(props: Props) {
  const artRevision = RUNNER_ART_REVISION;
  const prefix = `runner-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const svgRef = useRef<SVGSVGElement>(null);
  const engineRef = useRef<RunnerEngine | null>(null);
  const propsRef = useRef(props);
  const coinRef = useRef<HTMLElement>(null);
  const balanceRef = useRef<HTMLElement>(null);
  const recordRef = useRef<HTMLElement>(null);
  const magnetRef = useRef<HTMLElement>(null);
  const flightRef = useRef<HTMLElement>(null);
  const speedPowerRef = useRef<HTMLElement>(null);
  const distanceRef = useRef<HTMLElement>(null);
  const shieldRef = useRef<HTMLElement>(null);
  const gestureRef = useRef<{ id: number; x: number; y: number; consumed: boolean } | null>(null);
  const bestBeforeRun = useRef(props.best);
  const [phase, setPhase] = useState<RunnerPhase>("ready");
  const [result, setResult] = useState<RunnerResult | null>(null);
  const [newRecord, setNewRecord] = useState(false);
  const [zone, setZone] = useState(0);
  const [roofs, setRoofs] = useState(false);
  const [resumeCountdown, setResumeCountdown] = useState(0);
  useEffect(() => {
    if (!resumeCountdown || phase !== "paused") return;
    const timer = setTimeout(() => {
      if (resumeCountdown === 1) { setResumeCountdown(0); engineRef.current?.resume(); }
      else setResumeCountdown(resumeCountdown - 1);
    }, 500);
    return () => clearTimeout(timer);
  }, [resumeCountdown, phase]);
  useEffect(() => { propsRef.current = props; engineRef.current?.setOptions(props.options); }, [props]);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    svg.dataset.runnerRevision = artRevision;
    const renderer = new RunnerRenderer(svg, prefix, window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    let frame: number | null = null, previous = 0, accumulator = 0, hudTime = 0;
    const hud = () => {
      if (coinRef.current) coinRef.current.textContent = engine.coins.toLocaleString("ru-RU");
      if (balanceRef.current) balanceRef.current.textContent = `Всего ${propsRef.current.balance.toLocaleString("ru-RU")}`;
      if (recordRef.current) recordRef.current.textContent = `${Math.max(propsRef.current.best, Math.floor(engine.distance)).toLocaleString("ru-RU")} м`;
      if (magnetRef.current) { magnetRef.current.hidden = engine.magnetSeconds <= 0; magnetRef.current.textContent = `МАГНИТ · ${Math.ceil(engine.magnetSeconds)}с`; }
      if (flightRef.current) { flightRef.current.hidden = !engine.flying; flightRef.current.textContent = `ПОЛЁТ · ${engine.flightSeconds.toFixed(1)}с`; }
      if (speedPowerRef.current) { speedPowerRef.current.hidden = !engine.speedEffect; speedPowerRef.current.textContent = `${engine.speedEffect === "boost" ? "УСКОРЕНИЕ" : "ЗАМЕДЛЕНИЕ"} · ${Math.ceil(engine.speedSeconds)}с`; }
      if (distanceRef.current) distanceRef.current.textContent = `${Math.floor(engine.distance).toLocaleString("ru-RU")} м`;
      if (shieldRef.current) shieldRef.current.textContent = engine.options.immortal ? "БЕССМЕРТИЕ" : engine.shieldCharges ? `ЩИТ ×${engine.shieldCharges} · МАГНИТ` : "МАГНИТ";
    };
    const tick = (now: number) => {
      if (!previous) previous = now;
      accumulator += Math.min(.1, (now - previous) / 1000);
      previous = now;
      let advanced = false;
      while (accumulator >= 1 / 60) { engine.update(1 / 60); accumulator -= 1 / 60; advanced = true; }
      // Draw each completed physics frame. A millisecond gate drifted to 48fps
      // on 144Hz screens and could skip the final frame when a phase changed.
      if (advanced) renderer.render(engine);
      if (now - hudTime > 100) { hud(); hudTime = now; }
      if (["intro", "running", "caught"].includes(engine.phase)) frame = requestAnimationFrame(tick);
      else frame = null;
    };
    const schedule = () => { if (frame === null) { previous = 0; accumulator = 0; frame = requestAnimationFrame(tick); } };
    const engine = new RunnerEngine({
      phase: next => {
        gestureRef.current = null;
        setResumeCountdown(0);
        setPhase(next);
        propsRef.current.getSound().setRunnerMusicPhase(next);
        if (next === "intro") { setResult(null); hud(); }
        if (["intro", "running", "caught"].includes(next)) schedule();
        else if (frame !== null) { cancelAnimationFrame(frame); frame = null; }
      },
      coins: amount => propsRef.current.onCollect(amount),
      finish: next => { setResult(next); setNewRecord(next.distance > bestBeforeRun.current); propsRef.current.onFinish(next); hud(); },
      zone: next => setZone(next),
      route: next => setRoofs(next),
      sound: (kind, beat) => {
        propsRef.current.getSound().runner(kind, beat);
        if (propsRef.current.vibration && typeof navigator.vibrate === "function") {
          if (kind === "hit") navigator.vibrate([45, 30, 60]);
          else if (kind === "jump" || kind === "roll") navigator.vibrate(8);
        }
      },
    }, propsRef.current.options);
    engineRef.current = engine;
    // Fast Refresh replaces the engine during local editing. Restore its ready
    // UI as well, rather than showing a running HUD over a frozen new world.
    setPhase(engine.phase);
    setResult(null); setZone(0); setRoofs(false);
    renderer.render(engine);
    const observer = new ResizeObserver(() => { renderer.resize(); renderer.render(engine); });
    observer.observe(svg);
    const visibility = () => { if (document.hidden) { setResumeCountdown(0); engine.pause(); } };
    const pageHide = () => { setResumeCountdown(0); engine.pause(); };
    const key = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "p" && !event.repeat) { event.preventDefault(); if (engine.phase === "paused") setResumeCountdown(3); else engine.pause(); return; }
      if (event.key === " " && event.target instanceof HTMLButtonElement) return;
      const action = ({ ArrowLeft: "left", ArrowRight: "right", ArrowUp: "jump", ArrowDown: "roll", " ": "jump", a: "left", d: "right", w: "jump", s: "roll" } as Record<string, RunnerAction>)[event.key];
      if (action && !event.repeat && engine.phase === "running") { event.preventDefault(); engine.input(action); }
    };
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("pagehide", pageHide);
    window.addEventListener("keydown", key);
    return () => { observer.disconnect(); document.removeEventListener("visibilitychange", visibility); window.removeEventListener("pagehide", pageHide); window.removeEventListener("keydown", key); if (frame !== null) cancelAnimationFrame(frame); propsRef.current.getSound().stopRunnerMusic(); engineRef.current = null; };
  }, [prefix, artRevision]);

  const close = () => { engineRef.current?.close(); props.onClose(); };
  const start = () => { bestBeforeRun.current = props.best; props.getSound().unlock(); props.getSound().startRunnerMusic(); engineRef.current?.start(); };
  const dismiss = () => { if (phase === "running" || phase === "intro") engineRef.current?.pause(); else if (phase === "ready" || phase === "finished") close(); };
  const pointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (phase !== "running" || (event.target as Element).closest("button") || event.button !== 0 || gestureRef.current) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    gestureRef.current = { id: event.pointerId, x: event.clientX, y: event.clientY, consumed: false };
  };
  const pointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const gesture = gestureRef.current;
    if (!gesture || gesture.id !== event.pointerId || gesture.consumed) return;
    const dx = event.clientX - gesture.x, dy = event.clientY - gesture.y;
    const threshold = Math.max(18, Math.min(24, event.currentTarget.clientWidth * .05));
    if (Math.max(Math.abs(dx), Math.abs(dy)) < threshold) return;
    // Lock the entire contact after its first action. A long swipe is one lane,
    // regardless of how many pointermove events the phone emits.
    gesture.consumed = true;
    engineRef.current?.input(Math.abs(dx) > Math.abs(dy) ? dx > 0 ? "right" : "left" : dy < 0 ? "jump" : "roll");
  };
  const pointerEnd = (event: PointerEvent<HTMLDivElement>) => {
    // Some very quick flicks deliver a down/up pair without a move event.
    if (event.type === "pointerup") pointerMove(event);
    if (gestureRef.current?.id === event.pointerId) gestureRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };

  return <GameModal className={`runner-game runner-${phase}`} label="Knopik GO — бесконечная погоня" onDismiss={dismiss}>
    <div className="runner-viewport" onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerEnd} onPointerCancel={pointerEnd} onLostPointerCapture={() => { gestureRef.current = null; }} onContextMenu={event => event.preventDefault()}>
      <RunnerScene key={artRevision} sceneRef={svgRef} prefix={prefix} />
      <header className="runner-hud" aria-label="Показатели забега">
        <div className="runner-coins"><CoinArtwork /><div><small>ЗА ЗАБЕГ</small><strong ref={coinRef}>0</strong><small ref={balanceRef}>Всего {props.balance.toLocaleString("ru-RU")}</small></div></div>
        <div className="runner-distance"><small>ДИСТАНЦИЯ</small><strong ref={distanceRef}>0 м</strong><small className="runner-record">Рекорд <span ref={recordRef}>{props.best.toLocaleString("ru-RU")} м</span></small></div>
        <button type="button" className="runner-pause" aria-label="Закрыть забег и вернуться к Кнопику" onClick={close}>
          <svg viewBox="0 0 24 24" className="pixel-art" aria-hidden="true" fill="currentColor"><path d="M4 4h4v4H4Zm4 4h4v4H8Zm4 4h4v4h-4Zm4 4h4v4h-4ZM16 4h4v4h-4Zm-4 4h4v4h-4Zm-4 4h4v4H8Zm-4 4h4v4H4Z" /></svg>
        </button>
        <div className="runner-hud-status">
          {(props.options.collar || props.options.immortal || props.options.magnet) && <span ref={shieldRef} className="runner-equipment">{props.options.immortal ? "БЕССМЕРТИЕ" : props.options.collar ? `ЩИТ ×${1+Math.floor(((props.options.collarLevel??1)-1)/2)} · МАГНИТ` : "МАГНИТ"}</span>}
          <span ref={magnetRef} className="runner-power runner-power-magnet" hidden>МАГНИТ · 30с</span><span ref={flightRef} className="runner-power runner-power-flight" hidden>ПОЛЁТ · 7с</span>
          <span ref={speedPowerRef} className="runner-power runner-power-speed" hidden />
        </div>
      </header>
      {(phase === "running" || phase === "intro") && <p key={`${zone}-${roofs}`} className="runner-district">{roofs ? "НАД ГОРОДОМ · КРЫШИ" : RUNNER_ZONES[zone]}</p>}
      {phase === "ready" && <div className="runner-start-screen">
        <h2>KNOPIK <em>GO</em></h2>
        <div className="runner-start-footer">
          <button type="button" className="runner-primary" onClick={start} autoFocus>Играть <span aria-hidden="true">▶</span></button>
          {props.best > 0 && <small>Рекорд {props.best.toLocaleString("ru-RU")} м</small>}
          <div className="runner-howto"><span>↔ Полосы</span><span>↑ Прыжок</span><span>↓ Кувырок</span></div>
        </div>
      </div>}
      {phase === "intro" && <span className="runner-sahur-call" aria-hidden="true">ТУН. ТУН. ТУН!</span>}
      {phase === "running" && <div className="runner-controls" aria-label="Управление погоней">
        <div>{(["left", "right"] as const).map(action => <button type="button" key={action} aria-label={action === "left" ? "На полосу влево" : "На полосу вправо"} onClick={() => engineRef.current?.input(action)}><Arrow direction={action} /></button>)}</div>
        <div>{(["jump", "roll"] as const).map(action => <button type="button" key={action} aria-label={action === "jump" ? "Прыгнуть" : "Кувырок"} onClick={() => engineRef.current?.input(action)}><Arrow direction={action} /></button>)}</div>
      </div>}
      {phase === "paused" && <section className="runner-overlay runner-pause-screen" aria-labelledby="runner-pause-title"><small>{resumeCountdown ? "ГОТОВЬСЯ" : "ПОГОНЯ НА ПАУЗЕ"}</small><h2 id="runner-pause-title">{resumeCountdown ? "Продолжаем" : "Переведи дух"}</h2>{resumeCountdown ? <strong className="runner-countdown" role="status">{resumeCountdown}</strong> : <><button type="button" className="runner-primary" autoFocus onClick={() => setResumeCountdown(3)}>Продолжить</button><button type="button" onClick={() => { bestBeforeRun.current = Math.max(props.best, Math.floor(engineRef.current?.distance ?? 0)); engineRef.current?.restart(); }}>Начать заново</button><button type="button" onClick={close}>К Кнопику</button><p>Свайп в сторону — полоса<br />Вверх — прыжок · вниз — кувырок</p></>}</section>}
      {phase === "finished" && result && <section className="runner-overlay runner-finish-screen" aria-labelledby="runner-finish-title"><small>{newRecord ? "НОВЫЙ РЕКОРД" : "САХУР ДОГНАЛ"}</small><h2 id="runner-finish-title">{result.distance.toLocaleString("ru-RU")} <span>м</span></h2><div className="runner-result-coins"><CoinArtwork /><strong>+{result.coins}</strong></div><p>Монеты уже на балансе</p><button type="button" className="runner-primary" autoFocus onClick={start}>Ещё забег</button><button type="button" onClick={close}>К Кнопику</button></section>}
    </div>
    <p className="runner-sr" role="status">{phase === "paused" ? "Погоня приостановлена" : phase === "finished" && result ? `Забег завершён: ${result.distance} метров, ${result.coins} монет` : ""}</p>
  </GameModal>;
}
