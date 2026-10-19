"use client";
import {DamagePulse,useDamagePulse} from "./damage-pulse";
import {RunnerInterpolation} from "./runner-interpolation";
import {ignoreGameKey} from './game-input-guard';
import {runnerUpcomingDistrict} from "./runner-districts";
import { useEffect, useId, useRef, useState, type PointerEvent } from "react";
import { createPortal } from "react-dom";
import { GameModal } from "./game-modal";
import { PauseSettingsButton, useGameSettingsAccess } from "./game-settings-access";
import { CoinArtwork } from "./collectible-artwork";
import { RunnerScene, RUNNER_ART_REVISION } from "./runner-artwork";
import { RunnerEngine, type RunnerAction, type RunnerOptions, type RunnerPhase, type RunnerResult, type RunnerEvents } from "./runner-engine";
import { RunnerRenderer, RUNNER_ZONES } from "./runner-renderer";
import { RunnerCanvasRenderer, RUNNER_CANVAS_CONTEXT } from "./runner-canvas";
import { RunnerGpuRenderer } from "./runner-gpu";
import { RunnerFrameBudget, type RunnerGraphicsMode } from "./runner-frame-budget";
import type {FpsLimit} from "./render-preferences";
import { runnerFrameRateActive, runnerFramePainted } from "./frame-rate";
import { RunnerBuffIcon } from "./runner-buff-artwork";
import type { KnopikSoundEngine } from "./sound-engine";

type Props = { graphics?: RunnerGraphicsMode;fpsLimit?:FpsLimit; fromStreet?: boolean; balance: number; best: number; boostUntil?: number; options: RunnerOptions; vibration: boolean; getSound: () => KnopikSoundEngine; onCollect: (amount: number) => void; onFinish: (result: RunnerResult) => void; onHomeShieldUsed?: () => void; onClose: () => void };
const runnerNumber = new Intl.NumberFormat("ru-RU");
function updateHud(node: HTMLElement | null, value: string, hidden?: boolean) {
  if (!node) return;
  if (hidden !== undefined && node.hidden !== hidden) node.hidden = hidden;
  if (node.textContent !== value) node.textContent = value;
}
function hideBuff(node:HTMLElement|null,hidden:boolean){if(node&&node.hidden!==hidden)node.hidden=hidden;}
export function RunnerGame(props: Props) {
  const {ref:damageRef,pulse:pulseDamage}=useDamagePulse();
  const preferences=useGameSettingsAccess(),preferencesRef=useRef(preferences.active);
  useEffect(()=>{preferencesRef.current=preferences.active;},[preferences.active]);
  const {boostUntil,fromStreet,best,getSound}=props;
  const artRevision = RUNNER_ART_REVISION;
  const prefix = `runner-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const svgRef = useRef<SVGSVGElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gpuRef = useRef<HTMLCanvasElement>(null);
  const playRef = useRef<HTMLButtonElement>(null);
  const engineRef = useRef<RunnerEngine | null>(null);
  const repaintRef=useRef<(()=>void)|null>(null);
  const propsRef = useRef(props);
  const upcomingRef=useRef<HTMLSpanElement>(null);
  const coinRef = useRef<HTMLElement>(null);
  const balanceRef = useRef<HTMLElement>(null);
  const magnetRef = useRef<HTMLElement>(null);
  const flightRef = useRef<HTMLElement>(null);
  const speedPowerRef = useRef<HTMLElement>(null);
  const distanceRef = useRef<HTMLElement>(null);
  const shieldRef = useRef<HTMLElement>(null);
  const shieldIconRef = useRef<HTMLDivElement>(null);
  const magnetIconRef = useRef<HTMLDivElement>(null);
  const drinkIconRef = useRef<HTMLDivElement>(null);
  const drinkTimerRef = useRef<HTMLElement>(null);
  const flightIconRef = useRef<HTMLDivElement>(null);
  const speedIconRef = useRef<HTMLDivElement>(null);
  const gestureRef = useRef<{ id: number; x: number; y: number; consumed: boolean } | null>(null);
  const swipeThresholdRef = useRef(18);
  const bestBeforeRun = useRef(props.best);
  const streetStarted = useRef(false);
  const [phase, setPhase] = useState<RunnerPhase>("ready");
  const [result, setResult] = useState<RunnerResult | null>(null);
  const [newRecord, setNewRecord] = useState(false);
  const [zone, setZone] = useState(0);
  const [roofs, setRoofs] = useState(false);
  const [resumeCountdown, setResumeCountdown] = useState(0);
  const [preparedRevision,setPreparedRevision]=useState<string|null>(null);
  const graphicsReady=preparedRevision===artRevision;
  useEffect(()=>{
    if(!fromStreet||!graphicsReady||phase!=="ready"||streetStarted.current)return;
    streetStarted.current=true;bestBeforeRun.current=best;getSound().startRunnerMusic();engineRef.current?.start();
  },[fromStreet,graphicsReady,phase,best,getSound]);
  useEffect(()=>{if(graphicsReady&&phase==="ready")playRef.current?.focus({preventScroll:true});},[graphicsReady,phase]);
  useEffect(() => {
    const update=()=>{const seconds=Math.max(0,Math.ceil(((boostUntil??0)-Date.now())/1000));hideBuff(drinkIconRef.current,seconds<=0);updateHud(drinkTimerRef.current,`${seconds}с`);};
    update();if(!boostUntil)return;
    const timer=setInterval(update,1000);return()=>clearInterval(timer);
  },[boostUntil]);
  useEffect(() => {
    if (!resumeCountdown || phase !== "paused") return;
    const timer = setTimeout(() => {
      if (resumeCountdown === 1) { setResumeCountdown(0); engineRef.current?.resume(); }
      else setResumeCountdown(resumeCountdown - 1);
    }, 500);
    return () => clearTimeout(timer);
  }, [resumeCountdown, phase]);
  useEffect(() => { propsRef.current = props; engineRef.current?.setOptions(props.options); }, [props]);
  useEffect(()=>{repaintRef.current?.();},[props.graphics]);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    svg.dataset.runnerRevision = artRevision;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const canvas = canvasRef.current;
    let renderer: RunnerRenderer | RunnerCanvasRenderer | RunnerGpuRenderer;
    let canvasRenderer: RunnerCanvasRenderer | RunnerGpuRenderer | null = null;
    const gpu=gpuRef.current;
    if(gpu && typeof Path2D!=="undefined") {
      try { canvasRenderer=new RunnerGpuRenderer(svg,gpu,prefix,reducedMotion); } catch { canvasRenderer=null; }
    }
    // Retain the exact SVG renderer as a fallback for an unavailable canvas.
    if (!canvasRenderer && canvas && typeof Path2D !== "undefined" && canvas.getContext("2d", RUNNER_CANVAS_CONTEXT)) {
      try { canvasRenderer = new RunnerCanvasRenderer(svg,canvas,prefix,reducedMotion); } catch { canvasRenderer = null; }
    }
    if (canvasRenderer) {
      renderer = canvasRenderer; svg.style.display = "none"; canvasRenderer.canvas.style.display = "block";
      // The canvas was hidden while measuring source art. Resize once after
      // showing it, before the first paint and before ResizeObserver delivery.
      renderer.resize();
    } else {
      renderer = new RunnerRenderer(svg,prefix,reducedMotion); svg.style.display = "block";
      if (canvas) canvas.style.display = "none";
    }
    let sceneElement = canvasRenderer ? canvasRenderer.canvas : svg;
    let observer:ResizeObserver|null=null;
    const paintEngine=(engine:RunnerEngine) => {
      const ratio=budget.pixelRatio(window.devicePixelRatio||1,propsRef.current.graphics);
      try { return canvasRenderer ? canvasRenderer.render(engine,ratio) : renderer.render(engine); }
      catch(error) {
        if(!(renderer instanceof RunnerGpuRenderer)||!canvas)throw error;
        // Keep the GPU picture visible while preparing an exact Canvas frame.
        // A driver/allocation failure must not reset the engine or coin ledger.
        svg.style.display="block";
        const fallback=new RunnerCanvasRenderer(svg,canvas,prefix,reducedMotion,()=>canvas.style.display==="none"&&gpu?gpu.getBoundingClientRect():canvas.getBoundingClientRect());
        fallback.resize();fallback.render(engine,ratio);
        const previousScene=sceneElement;renderer.dispose();if(gpu)gpu.style.display="none";
        canvas.style.display="block";svg.style.display="none";renderer=canvasRenderer=fallback;sceneElement=canvas;
        observer?.unobserve(previousScene);observer?.observe(canvas);return true;
      }
    };
    let frame: number | null = null, previous = 0, accumulator = 0, hudTime = 0;
    const budget = new RunnerFrameBudget();
    const interpolation=new RunnerInterpolation();
    const hud = () => {
      updateHud(coinRef.current, runnerNumber.format(engine.coins));
      updateHud(balanceRef.current, runnerNumber.format(propsRef.current.balance));
      hideBuff(magnetIconRef.current,!(engine.magnetic || engine.options.collar));
      updateHud(magnetRef.current, engine.magnetSeconds > 0 ? `${Math.ceil(engine.magnetSeconds)}с` : "∞");
      hideBuff(flightIconRef.current,!engine.flying);
      updateHud(flightRef.current, `${Math.ceil(engine.flightSeconds)}с`);
      hideBuff(speedIconRef.current,!engine.speedEffect);
      if (speedIconRef.current && speedIconRef.current.dataset.effect !== (engine.speedEffect ?? "")) { speedIconRef.current.dataset.effect = engine.speedEffect ?? ""; speedIconRef.current.title = engine.speedEffect === "slow" ? "Замедление" : "Ускорение"; }
      updateHud(speedPowerRef.current, `${engine.speedEffect==="slow"?"↓ 0.68×":"↑ 1.4×"} · ${Math.ceil(engine.speedSeconds)}с`);
      if(speedIconRef.current)speedIconRef.current.setAttribute("aria-label",`${engine.speedEffect==="slow"?"Замедление":"Ускорение"}, осталось ${Math.ceil(engine.speedSeconds)} секунд`);
      const upcoming=runnerUpcomingDistrict(engine.distance,engine.seed);
      updateHud(upcomingRef.current,upcoming.meters<=65?`Через ${upcoming.meters} м · ${RUNNER_ZONES[upcoming.district]}`:"");
      updateHud(distanceRef.current, `${runnerNumber.format(Math.floor(engine.distance))} м`);
      hideBuff(shieldIconRef.current,engine.shieldCount<=0);
      updateHud(shieldRef.current, `×${engine.shieldCount}`);
      const drinkSeconds = Math.max(0, Math.ceil(((propsRef.current.boostUntil ?? 0) - Date.now()) / 1000));
      hideBuff(drinkIconRef.current,drinkSeconds<=0);
      updateHud(drinkTimerRef.current, `${drinkSeconds}с`);
    };
    const tick = (now: number) => {
      if (!previous) previous = now;
      accumulator += Math.min(.1, (now - previous) / 1000);
      previous = now;
      let advanced = false;
      while (accumulator >= 1 / 60) { interpolation.capture(engine);engine.update(1 / 60); accumulator -= 1 / 60; advanced = true; }
      // Draw each completed physics frame. A millisecond gate drifted to 48fps
      // on 144Hz screens and could skip the final frame when a phase changed.
      if ((advanced||propsRef.current.fpsLimit===120) && (budget.due(now,propsRef.current.fpsLimit??60) || !["intro", "running", "caught"].includes(engine.phase))) {
        const began = performance.now(); const painted=paintEngine(propsRef.current.fpsLimit===120?interpolation.view(engine,accumulator*60):engine); const cost=performance.now()-began;
        if(painted!==false){budget.painted(now,cost);runnerFramePainted(now,cost);}
      }
      if (now - hudTime > 100) { hud(); hudTime = now; }
      if (["intro", "running", "caught"].includes(engine.phase)) frame = requestAnimationFrame(tick);
      else frame = null;
    };
    const frameRateOwner=Symbol('runner');
    const schedule = () => { runnerFrameRateActive(true,frameRateOwner); if (frame === null) { previous = 0; accumulator = 0; budget.reset();interpolation.reset(); frame = requestAnimationFrame(tick); } };
    const events: RunnerEvents = {
      phase: next => {
        gestureRef.current = null;
        setResumeCountdown(0);
        setPhase(next);
        propsRef.current.getSound().setRunnerMusicPhase(next);
        if (next === "intro") { setResult(null); hud(); }
        if (["intro", "running", "caught"].includes(next)) schedule();
        else { runnerFrameRateActive(false,frameRateOwner); if (frame !== null) { cancelAnimationFrame(frame); frame = null; } }
      },
      coins: amount => propsRef.current.onCollect(amount),
      homeShieldUsed: () => propsRef.current.onHomeShieldUsed?.(),
      finish: next => { setResult(next); setNewRecord(next.distance > bestBeforeRun.current); propsRef.current.onFinish(next); hud(); },
      zone: next => setZone(next),
      route: next => setRoofs(next),
      sound: (kind, beat) => {
        if(kind==="hit")pulseDamage();
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
    repaintRef.current=()=>{if(!["intro","running","caught"].includes(engine.phase))paintEngine(engine);};
    paintEngine(engine);
    hud();
    let disposed = false,preparationFrame:number|null=null;
    const fontsLoading=document.fonts.status!=="loaded";
    const prepareStart=()=>{
      if(disposed)return;
      if(fontsLoading)canvasRenderer?.fontsReady();
      const finish=()=>{
        preparationFrame=null;if(disposed)return;
        // Present the real starting scene with its fonts, textures and reusable
        // GPU buffers before enabling Play. No physics or rewards run here.
        if(paintEngine(engine)===false){preparationFrame=requestAnimationFrame(finish);return;}
        setPreparedRevision(artRevision);
      };
      preparationFrame=requestAnimationFrame(finish);
    };
    if(fontsLoading)void document.fonts.ready.then(prepareStart);else prepareStart();
    if (["intro", "running", "caught"].includes(engine.phase)) schedule();
    propsRef.current.getSound().setRunnerMusicPhase(engine.phase);
    // Reading clientWidth on every pointermove can force layout immediately
    // after thousands of SVG writes. ResizeObserver supplies it off that path.
    swipeThresholdRef.current = Math.max(18, Math.min(24, sceneElement.clientWidth * .05));
    observer = new ResizeObserver(entries => {
      const width = entries[0]?.contentRect.width ?? sceneElement.clientWidth;
      swipeThresholdRef.current = Math.max(18, Math.min(24, width * .05));
      renderer.resize();
      if (frame === null) paintEngine(engine);
    });
    observer.observe(sceneElement);
    const visibility = () => { if (document.hidden) { setResumeCountdown(0); engine.pause(); } };
    const pageHide = () => { gestureRef.current=null;setResumeCountdown(0); engine.pause(); };
    const navigateAway=()=>{if(!window.location.pathname.replace(/\/$/,"").endsWith("/run"))engine.close();};
    const key = (event: KeyboardEvent) => {
      if(preferencesRef.current||ignoreGameKey(event))return;
      if (event.key.toLowerCase() === "p" && !event.repeat) { event.preventDefault(); if (engine.phase === "paused") setResumeCountdown(3); else engine.pause(); return; }
      if (event.key === " " && event.target instanceof HTMLButtonElement) return;
      const key=({KeyA:"a",KeyD:"d",KeyW:"w",KeyS:"s"} as Record<string,string>)[event.code]??(event.key.length===1?event.key.toLowerCase():event.key);
      const action = ({ ArrowLeft: "left", ArrowRight: "right", ArrowUp: "jump", ArrowDown: "roll", " ": "jump", a: "left", d: "right", w: "jump", s: "roll" } as Record<string, RunnerAction>)[key];
      if (action && !event.repeat && engine.phase === "running") { event.preventDefault(); engine.input(action); }
    };
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("pagehide", pageHide);
    window.addEventListener('blur',pageHide);
    window.addEventListener("popstate",navigateAway);
    window.addEventListener("keydown", key);
    return () => { disposed = true; repaintRef.current=null; if(preparationFrame!==null)cancelAnimationFrame(preparationFrame); runnerFrameRateActive(false,frameRateOwner); observer?.disconnect(); canvasRenderer?.dispose(); svg.style.display = ""; document.removeEventListener("visibilitychange", visibility); window.removeEventListener("pagehide", pageHide);window.removeEventListener("blur",pageHide);window.removeEventListener("popstate",navigateAway); window.removeEventListener("keydown", key); if (frame !== null) cancelAnimationFrame(frame); propsRef.current.getSound().setRunnerMusicPhase("paused"); };
  }, [prefix, artRevision,pulseDamage]);

  const close = () => { engineRef.current?.close(); props.onClose(); };
  const start = () => { if(!graphicsReady)return;bestBeforeRun.current = props.best; props.getSound().unlock(); props.getSound().startRunnerMusic(); engineRef.current?.start(); };
  const dismiss = () => { if (phase === "running" || phase === "intro") engineRef.current?.pause(); else if (phase === "ready" || phase === "finished") close(); };
  const pointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (phase !== "running" || (event.target as Element).closest("button") || event.button !== 0 || gestureRef.current) return;
    try{event.currentTarget.setPointerCapture(event.pointerId);}catch{}
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
  return createPortal(<div className="pixel-game runner-host"><GameModal className={`runner-game runner-${phase} runner-quality-${props.graphics??"auto"}`} label="Knopik GO — бесконечная погоня" onDismiss={dismiss}>
    <DamagePulse surfaceRef={damageRef} concealed={phase==="paused"||phase==="ready"||preferences.active}/>
    <div className="runner-viewport" onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerEnd} onPointerCancel={pointerEnd} onLostPointerCapture={() => { gestureRef.current = null; }} onContextMenu={event => event.preventDefault()}>
      <RunnerScene key={artRevision} sceneRef={svgRef} prefix={prefix} />
      <canvas key={`${artRevision}-gpu`} ref={gpuRef} className="runner-scene pixel-art" aria-hidden="true" style={{ display:"none" }} />
      <canvas key={`${artRevision}-canvas`} ref={canvasRef} className="runner-scene pixel-art" aria-hidden="true" style={{ display:"none" }} />
      <span ref={upcomingRef} className="runner-upcoming-location" role="status"/>
      <header className="runner-hud" aria-label="Показатели забега">
        <div className="runner-hud-card runner-coins"><small>БАЛАНС <span className="runner-hud-gain" title="Монеты за забег">+<span ref={coinRef}>0</span></span></small><div className="runner-hud-value"><CoinArtwork /><strong ref={balanceRef}>{runnerNumber.format(props.balance)}</strong></div></div>
        <div className="runner-hud-card runner-distance"><small>ДИСТАНЦИЯ</small><div className="runner-hud-value"><svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M9 2h6v4h-2v4h-2V6H9ZM8 12h8v3h-3v5h-2v-5H8ZM3 2h3v20H3Zm15 0h3v20h-3Z" /></svg><strong ref={distanceRef}>0 м</strong></div></div>
        <button type="button" className="runner-pause" aria-label={phase==="ready"||phase==="finished"?"Закрыть забег":"Пауза"} onClick={()=>phase==="ready"||phase==="finished"?close():engineRef.current?.pause()}>
          <svg viewBox="0 0 24 24" className="pixel-art" aria-hidden="true" fill="currentColor"><path d={phase==="ready"||phase==="finished"?"M4 4h4v4H4Zm4 4h4v4H8Zm4 4h4v4h-4Zm4 4h4v4h-4ZM16 4h4v4h-4Zm-4 4h4v4h-4Zm-4 4h4v4H8Zm-4 4h4v4H4Z":"M5 4h5v16H5Zm9 0h5v16h-5Z"} /></svg>
        </button>
      </header>
      <aside className="runner-buffs" aria-label="Активные усиления">
        <div ref={shieldIconRef} className="runner-buff runner-buff-shield" title="Щит" hidden={!props.options.collar && !props.options.homeShield}><RunnerBuffIcon kind="shield" /><span ref={shieldRef}>×1</span></div>
        <div ref={drinkIconRef} className="runner-buff runner-buff-drink" title="Живчик" hidden><RunnerBuffIcon kind="zhivchik" /><span ref={drinkTimerRef}>0с</span></div>
        <div ref={magnetIconRef} className="runner-buff runner-buff-magnet" title="Магнит" hidden={!props.options.magnet && !props.options.collar}><RunnerBuffIcon kind="magnet" /><span ref={magnetRef}>∞</span></div>
        <div ref={flightIconRef} className="runner-buff runner-buff-flight" title="Полёт" hidden><RunnerBuffIcon kind="flight" /><span ref={flightRef}>0с</span></div>
        <div ref={speedIconRef} className="runner-buff runner-buff-speed" title="Ускорение" hidden><RunnerBuffIcon kind="speed" /><span ref={speedPowerRef}>0с</span></div>
      </aside>
      {(phase === "running" || phase === "intro") && <p key={`${zone}-${roofs}`} className="runner-district">{roofs ? "НАД ГОРОДОМ · КРЫШИ" : RUNNER_ZONES[zone]}</p>}
      {phase === "ready" && props.fromStreet && <div className="runner-start-screen"><h2>На большую <em>улицу</em></h2><div className="runner-start-footer"><p role="status">Готовимся к погоне…</p></div></div>}
      {phase === "ready" && !props.fromStreet && <div className="runner-start-screen">
        <h2>Кнопик <em>Run</em></h2>
        <div className="runner-start-footer">
          <button ref={playRef} type="button" className="runner-primary" onClick={start} disabled={!graphicsReady} aria-busy={!graphicsReady} autoFocus>{graphicsReady?<>Начать погоню <span aria-hidden="true">▶</span></>:"Подготовка…"}</button>
          <div className="runner-best"><svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M6 3h12v3h4v7h-4v3h-4v3h4v3H6v-3h4v-3H6v-3H2V6h4Zm-1 6v1h1V9Zm13 0v1h1V9ZM9 6v6h6V6Z" /></svg><div><small>ТВОЙ РЕКОРД</small><strong>{runnerNumber.format(props.best)} <span>м</span></strong></div></div>
          <div className="runner-howto"><span>↔ Полосы</span><span>↑ {props.options.accessory==="sky-boots"?"Суперпрыжок":"Прыжок"}</span><span>↓ Кувырок</span></div>
        </div>
      </div>}
      {phase === "intro" && <span className="runner-sahur-call" aria-hidden="true">ТУН. ТУН. ТУН!</span>}
      {phase === "paused" && <section className="runner-overlay runner-pause-screen" aria-labelledby="runner-pause-title"><small>{resumeCountdown ? "ГОТОВЬСЯ" : "ПОГОНЯ НА ПАУЗЕ"}</small><h2 id="runner-pause-title">{resumeCountdown ? "Продолжаем" : "Переведи дух"}</h2>{resumeCountdown ? <strong className="runner-countdown" role="status">{resumeCountdown}</strong> : <><button type="button" className="runner-primary" autoFocus onClick={() => setResumeCountdown(3)}>Продолжить</button><PauseSettingsButton/><button type="button" onClick={() => { bestBeforeRun.current = Math.max(props.best, Math.floor(engineRef.current?.distance ?? 0)); engineRef.current?.restart(); }}>Начать заново</button><button type="button" onClick={close}>На улицу</button><p>Свайп в сторону — полоса<br />Вверх — прыжок · вниз — кувырок</p></>}</section>}
      {phase === "finished" && result && <section className="runner-overlay runner-finish-screen" aria-labelledby="runner-finish-title"><small>{newRecord ? "НОВЫЙ РЕКОРД" : "САХУР ДОГНАЛ"}</small><h2 id="runner-finish-title">{result.distance.toLocaleString("ru-RU")} <span>м</span></h2><div className="runner-result-coins"><CoinArtwork /><strong>+{result.coins}</strong></div><p>Монеты уже на балансе</p><button type="button" className="runner-primary" autoFocus onClick={start}>Ещё забег</button><button type="button" onClick={close}>На улицу</button></section>}
    </div>
    <p className="runner-sr" role="status">{phase === "paused" ? "Погоня приостановлена" : phase === "finished" && result ? `Забег завершён: ${result.distance} метров, ${result.coins} монет` : ""}</p>
  </GameModal></div>,document.body);
}
