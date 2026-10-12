"use client";
import { useEffect, useId, useRef, useState, type PointerEvent } from "react";
import { createPortal } from "react-dom";
import { GameModal } from "./game-modal";
import { CoinArtwork } from "./collectible-artwork";
import { RunnerScene, RUNNER_ART_REVISION } from "./runner-artwork";
import { RunnerEngine, type RunnerAction, type RunnerOptions, type RunnerPhase, type RunnerResult, type RunnerEvents } from "./runner-engine";
import { RunnerRenderer, RUNNER_ZONES } from "./runner-renderer";
import { RunnerCanvasRenderer, RUNNER_CANVAS_CONTEXT } from "./runner-canvas";
import { RunnerFrameBudget } from "./runner-frame-budget";
import type { KnopikSoundEngine } from "./sound-engine";

type Props = { balance: number; best: number; options: RunnerOptions; vibration: boolean; getSound: () => KnopikSoundEngine; onCollect: (amount: number) => void; onFinish: (result: RunnerResult) => void; onClose: () => void };
const runnerNumber = new Intl.NumberFormat("ru-RU");
function updateHud(node: HTMLElement | null, value: string, hidden?: boolean) {
  if (!node) return;
  if (hidden !== undefined && node.hidden !== hidden) node.hidden = hidden;
  if (node.textContent !== value) node.textContent = value;
}
export function RunnerGame(props: Props) {
  const artRevision = RUNNER_ART_REVISION;
  const prefix = `runner-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const svgRef = useRef<SVGSVGElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
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
  const performanceRef = useRef<HTMLOutputElement>(null);
  const [profile] = useState(()=>typeof window!=="undefined" && new URLSearchParams(window.location.search).has("perf"));
  const gestureRef = useRef<{ id: number; x: number; y: number; consumed: boolean } | null>(null);
  const swipeThresholdRef = useRef(18);
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
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const canvas = canvasRef.current;
    let renderer: RunnerRenderer | RunnerCanvasRenderer;
    let canvasRenderer: RunnerCanvasRenderer | null = null;
    // Retain the exact SVG renderer as a fallback for an unavailable canvas.
    if (canvas && typeof Path2D !== "undefined" && canvas.getContext("2d", RUNNER_CANVAS_CONTEXT)) {
      try { canvasRenderer = new RunnerCanvasRenderer(svg,canvas,prefix,reducedMotion); } catch { canvasRenderer = null; }
    }
    if (canvasRenderer && canvas) {
      renderer = canvasRenderer; svg.style.display = "none"; canvas.style.display = "block";
      // The canvas was hidden while measuring source art. Resize once after
      // showing it, before the first paint and before ResizeObserver delivery.
      renderer.resize();
    } else {
      renderer = new RunnerRenderer(svg,prefix,reducedMotion); svg.style.display = "block";
      if (canvas) canvas.style.display = "none";
    }
    const sceneElement = canvasRenderer && canvas ? canvas : svg;
    let frame: number | null = null, previous = 0, accumulator = 0, hudTime = 0;
    const budget = new RunnerFrameBudget();
    let measuredAt=0,paintedFrames=0,paintCost=0,lastPaint=0,maxGap=0;
    const hud = () => {
      updateHud(coinRef.current, runnerNumber.format(engine.coins));
      updateHud(balanceRef.current, `Всего ${runnerNumber.format(propsRef.current.balance)}`);
      updateHud(recordRef.current, `${runnerNumber.format(Math.max(propsRef.current.best, Math.floor(engine.distance)))} м`);
      updateHud(magnetRef.current, `МАГНИТ · ${Math.ceil(engine.magnetSeconds)}с`, engine.magnetSeconds <= 0);
      updateHud(flightRef.current, `ПОЛЁТ · ${engine.flightSeconds.toFixed(1)}с`, !engine.flying);
      updateHud(speedPowerRef.current, `${engine.speedEffect === "boost" ? "УСКОРЕНИЕ" : "ЗАМЕДЛЕНИЕ"} · ${Math.ceil(engine.speedSeconds)}с`, !engine.speedEffect);
      updateHud(distanceRef.current, `${runnerNumber.format(Math.floor(engine.distance))} м`);
      updateHud(shieldRef.current, engine.options.immortal ? "БЕССМЕРТИЕ" : engine.shieldCharges ? `ЩИТ ×${engine.shieldCharges} · МАГНИТ` : "МАГНИТ");
    };
    const tick = (now: number) => {
      if (!previous) previous = now;
      accumulator += Math.min(.1, (now - previous) / 1000);
      previous = now;
      let advanced = false;
      while (accumulator >= 1 / 60) { engine.update(1 / 60); accumulator -= 1 / 60; advanced = true; }
      // Draw each completed physics frame. A millisecond gate drifted to 48fps
      // on 144Hz screens and could skip the final frame when a phase changed.
      if (advanced && (budget.due(now) || !["intro", "running", "caught"].includes(engine.phase))) {
        const began = performance.now(); renderer.render(engine); const cost=performance.now()-began;budget.painted(now,cost);
        if(profile) {
          paintedFrames++;paintCost+=cost;
          if(lastPaint)maxGap=Math.max(maxGap,now-lastPaint);lastPaint=now;
          if(!measuredAt){measuredAt=now;paintedFrames=0;paintCost=0;}
          if(now-measuredAt>=1000 && performanceRef.current) {
            updateHud(performanceRef.current,`${Math.round(paintedFrames*1000/(now-measuredAt))} FPS`);
            performanceRef.current.title = `JS ${(paintCost/paintedFrames).toFixed(1)} мс · максимальный интервал ${Math.round(maxGap)} мс`;
            measuredAt=now;paintedFrames=0;paintCost=0;maxGap=0;
          }
        }
      }
      if (now - hudTime > 100) { hud(); hudTime = now; }
      if (["intro", "running", "caught"].includes(engine.phase)) frame = requestAnimationFrame(tick);
      else frame = null;
    };
    const schedule = () => { if (frame === null) { previous = 0; accumulator = 0; measuredAt=0;paintedFrames=0;paintCost=0;lastPaint=0;maxGap=0;budget.reset(); frame = requestAnimationFrame(tick); } };
    const events: RunnerEvents = {
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
    };
    const engine = engineRef.current ?? new RunnerEngine(events, propsRef.current.options);
    // Local Fast Refresh can replace the renderer/scene while keeping this ref.
    // Rebind callbacks and current methods without discarding distance or world.
    Object.setPrototypeOf(engine, RunnerEngine.prototype);
    engine.setEvents(events); engine.setOptions(propsRef.current.options);
    engineRef.current = engine;
    setPhase(engine.phase);
    if (engine.phase === "ready") setResult(null);
    setZone(engine.zone); setRoofs(engine.roofs);
    renderer.render(engine);
    let disposed = false;
    if (canvasRenderer && document.fonts.status !== "loaded") void document.fonts.ready.then(() => {
      if (disposed) return;
      canvasRenderer?.fontsReady();
      if (frame === null) renderer.render(engine);
    });
    if (["intro", "running", "caught"].includes(engine.phase)) schedule();
    propsRef.current.getSound().setRunnerMusicPhase(engine.phase);
    // Reading clientWidth on every pointermove can force layout immediately
    // after thousands of SVG writes. ResizeObserver supplies it off that path.
    swipeThresholdRef.current = Math.max(18, Math.min(24, sceneElement.clientWidth * .05));
    const observer = new ResizeObserver(entries => {
      const width = entries[0]?.contentRect.width ?? sceneElement.clientWidth;
      swipeThresholdRef.current = Math.max(18, Math.min(24, width * .05));
      renderer.resize();
      if (frame === null) renderer.render(engine);
    });
    observer.observe(sceneElement);
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
    return () => { disposed = true; observer.disconnect(); canvasRenderer?.dispose(); svg.style.display = ""; document.removeEventListener("visibilitychange", visibility); window.removeEventListener("pagehide", pageHide); window.removeEventListener("keydown", key); if (frame !== null) cancelAnimationFrame(frame); propsRef.current.getSound().setRunnerMusicPhase("paused"); };
  }, [prefix, artRevision, profile]);

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
    const threshold = swipeThresholdRef.current;
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

  if(typeof document==="undefined")return null;
  // Separate DOM ancestry prevents main-screen CSS variables, balances and
  // fatigue clocks from invalidating thousands of SVG descendants in Safari.
  // React event bubbling, modal focus and all state callbacks stay intact.
  return createPortal(<div className="pixel-game runner-host"><GameModal className={`runner-game runner-${phase}`} label="Knopik GO — бесконечная погоня" onDismiss={dismiss}>
    <div className="runner-viewport" onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerEnd} onPointerCancel={pointerEnd} onLostPointerCapture={() => { gestureRef.current = null; }} onContextMenu={event => event.preventDefault()}>
      <RunnerScene key={artRevision} sceneRef={svgRef} prefix={prefix} />
      <canvas key={`${artRevision}-canvas`} ref={canvasRef} className="runner-scene pixel-art" aria-hidden="true" style={{ display:"none" }} />
      {profile && <output ref={performanceRef} className="runner-performance" aria-label="Частота кадров" aria-live="off">— FPS</output>}
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
      {phase === "paused" && <section className="runner-overlay runner-pause-screen" aria-labelledby="runner-pause-title"><small>{resumeCountdown ? "ГОТОВЬСЯ" : "ПОГОНЯ НА ПАУЗЕ"}</small><h2 id="runner-pause-title">{resumeCountdown ? "Продолжаем" : "Переведи дух"}</h2>{resumeCountdown ? <strong className="runner-countdown" role="status">{resumeCountdown}</strong> : <><button type="button" className="runner-primary" autoFocus onClick={() => setResumeCountdown(3)}>Продолжить</button><button type="button" onClick={() => { bestBeforeRun.current = Math.max(props.best, Math.floor(engineRef.current?.distance ?? 0)); engineRef.current?.restart(); }}>Начать заново</button><button type="button" onClick={close}>К Кнопику</button><p>Свайп в сторону — полоса<br />Вверх — прыжок · вниз — кувырок</p></>}</section>}
      {phase === "finished" && result && <section className="runner-overlay runner-finish-screen" aria-labelledby="runner-finish-title"><small>{newRecord ? "НОВЫЙ РЕКОРД" : "САХУР ДОГНАЛ"}</small><h2 id="runner-finish-title">{result.distance.toLocaleString("ru-RU")} <span>м</span></h2><div className="runner-result-coins"><CoinArtwork /><strong>+{result.coins}</strong></div><p>Монеты уже на балансе</p><button type="button" className="runner-primary" autoFocus onClick={start}>Ещё забег</button><button type="button" onClick={close}>К Кнопику</button></section>}
    </div>
    <p className="runner-sr" role="status">{phase === "paused" ? "Погоня приостановлена" : phase === "finished" && result ? `Забег завершён: ${result.distance} метров, ${result.coins} монет` : ""}</p>
  </GameModal></div>,document.body);
}
