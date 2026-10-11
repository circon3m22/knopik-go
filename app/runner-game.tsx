"use client";
import { useEffect, useId, useRef, useState, type PointerEvent } from "react";
import { GameModal } from "./game-modal";
import { CoinArtwork } from "./collectible-artwork";
import { RunnerScene } from "./runner-artwork";
import { RunnerEngine, type RunnerAction, type RunnerOptions, type RunnerPhase, type RunnerResult } from "./runner-engine";
import { RunnerRenderer, RUNNER_ZONES } from "./runner-renderer";
import type { KnopikSoundEngine } from "./sound-engine";

type Props = { balance: number; best: number; options: RunnerOptions; vibration: boolean; getSound: () => KnopikSoundEngine; onCollect: (amount: number) => void; onFinish: (result: RunnerResult) => void; onClose: () => void };
function Arrow({ direction }: { direction: RunnerAction }) {
  return <svg viewBox="0 0 24 24" className="pixel-art" fill="currentColor" aria-hidden="true"><g transform={direction === "left" ? "rotate(-90 12 12)" : direction === "right" ? "rotate(90 12 12)" : direction === "roll" ? "rotate(180 12 12)" : undefined}><path d="M10 3h4v3h3v3h3v4h-4v-3h-2v11h-4V10H8v3H4V9h3V6h3Z" /></g></svg>;
}

export function RunnerGame(props: Props) {
  const prefix = `runner-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const svgRef = useRef<SVGSVGElement>(null);
  const engineRef = useRef<RunnerEngine | null>(null);
  const propsRef = useRef(props);
  const coinRef = useRef<HTMLElement>(null);
  const distanceRef = useRef<HTMLElement>(null);
  const speedRef = useRef<HTMLElement>(null);
  const shieldRef = useRef<HTMLElement>(null);
  const gestureRef = useRef<{ id: number; x: number; y: number; vertical: boolean } | null>(null);
  const bestBeforeRun = useRef(props.best);
  const [phase, setPhase] = useState<RunnerPhase>("ready");
  const [result, setResult] = useState<RunnerResult | null>(null);
  const [newRecord, setNewRecord] = useState(false);
  const [zone, setZone] = useState(0);
  const [roofs, setRoofs] = useState(false);
  useEffect(() => { propsRef.current = props; engineRef.current?.setOptions(props.options); }, [props]);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const renderer = new RunnerRenderer(svg, prefix, window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    let frame: number | null = null, previous = 0, accumulator = 0, hudTime = 0, renderTime = 0;
    const hud = () => {
      if (coinRef.current) coinRef.current.textContent = engine.coins.toLocaleString("ru-RU");
      if (distanceRef.current) distanceRef.current.textContent = `${Math.floor(engine.distance).toLocaleString("ru-RU")} м`;
      if (speedRef.current) speedRef.current.textContent = `×${(engine.speed / 22).toFixed(1)}`;
      if (shieldRef.current) shieldRef.current.textContent = engine.options.immortal ? "БЕССМЕРТИЕ" : engine.shieldCharges ? "ЩИТ ×1 · МАГНИТ" : "МАГНИТ";
    };
    const tick = (now: number) => {
      if (!previous) previous = now;
      accumulator += Math.min(.1, (now - previous) / 1000);
      previous = now;
      while (accumulator >= 1 / 60) { engine.update(1 / 60); accumulator -= 1 / 60; }
      if (now - renderTime >= 15) { renderer.render(engine); renderTime = now; }
      if (now - hudTime > 100) { hud(); hudTime = now; }
      if (["intro", "running", "caught"].includes(engine.phase)) frame = requestAnimationFrame(tick);
      else frame = null;
    };
    const schedule = () => { if (frame === null) { previous = 0; accumulator = 0; frame = requestAnimationFrame(tick); } };
    const engine = new RunnerEngine({
      phase: next => {
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
    renderer.render(engine);
    const observer = new ResizeObserver(() => { renderer.resize(); renderer.render(engine); });
    observer.observe(svg);
    const visibility = () => { if (document.hidden) engine.pause(); };
    const pageHide = () => engine.pause();
    const key = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "p") { event.preventDefault(); if (engine.phase === "paused") engine.resume(); else engine.pause(); return; }
      if (event.key === " " && event.target instanceof HTMLButtonElement) return;
      const action = ({ ArrowLeft: "left", ArrowRight: "right", ArrowUp: "jump", ArrowDown: "roll", " ": "jump", a: "left", d: "right", w: "jump", s: "roll" } as Record<string, RunnerAction>)[event.key];
      if (action && !event.repeat && engine.phase === "running") { event.preventDefault(); engine.input(action); }
    };
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("pagehide", pageHide);
    window.addEventListener("keydown", key);
    return () => { observer.disconnect(); document.removeEventListener("visibilitychange", visibility); window.removeEventListener("pagehide", pageHide); window.removeEventListener("keydown", key); if (frame !== null) cancelAnimationFrame(frame); propsRef.current.getSound().stopRunnerMusic(); engineRef.current = null; };
  }, [prefix]);

  const close = () => { engineRef.current?.close(); props.onClose(); };
  const start = () => { bestBeforeRun.current = props.best; props.getSound().unlock(); props.getSound().startRunnerMusic(); engineRef.current?.start(); };
  const dismiss = () => { if (phase === "running" || phase === "intro") engineRef.current?.pause(); else if (phase === "ready" || phase === "finished") close(); };
  const pointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (phase !== "running" || (event.target as Element).closest("button") || event.button !== 0 || gestureRef.current) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    gestureRef.current = { id: event.pointerId, x: event.clientX, y: event.clientY, vertical: false };
  };
  const pointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const gesture = gestureRef.current;
    if (!gesture || gesture.id !== event.pointerId) return;
    const dx = event.clientX - gesture.x, dy = event.clientY - gesture.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 26) return;
    if (Math.abs(dx) > Math.abs(dy)) engineRef.current?.input(dx > 0 ? "right" : "left");
    else if (!gesture.vertical) { engineRef.current?.input(dy < 0 ? "jump" : "roll"); gesture.vertical = true; }
    gesture.x = event.clientX; gesture.y = event.clientY;
  };
  const pointerEnd = (event: PointerEvent<HTMLDivElement>) => { if (gestureRef.current?.id === event.pointerId) gestureRef.current = null; if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); };

  return <GameModal className={`runner-game runner-${phase}`} label="Knopik GO — бесконечная погоня" onDismiss={dismiss}>
    <div className="runner-viewport" onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerEnd} onPointerCancel={pointerEnd} onLostPointerCapture={() => { gestureRef.current = null; }} onContextMenu={event => event.preventDefault()}>
      <RunnerScene sceneRef={svgRef} prefix={prefix} />
      <header className="runner-hud">
        <div className="runner-coins"><CoinArtwork /><div><strong ref={coinRef}>0</strong><small>Баланс {props.balance.toLocaleString("ru-RU")}</small></div></div>
        <div className="runner-distance"><strong ref={distanceRef}>0 м</strong><small ref={speedRef}>×1.0</small></div>
        {phase === "ready" ? <button type="button" className="runner-pause" aria-label="К Кнопику" onClick={close}>×</button> : (phase === "running" || phase === "intro") && <button type="button" className="runner-pause" aria-label="Пауза" onClick={() => engineRef.current?.pause()}><svg viewBox="0 0 24 24" className="pixel-art" aria-hidden="true" fill="currentColor"><path d="M5 4h5v16H5Zm9 0h5v16h-5Z" /></svg></button>}
      </header>
      {(phase === "running" || phase === "intro") && <p key={`${zone}-${roofs}`} className="runner-district">{roofs ? "НАД ГОРОДОМ · КРЫШИ" : RUNNER_ZONES[zone]}</p>}
      {(props.options.collar || props.options.immortal || props.options.magnet) && <span ref={shieldRef} className="runner-equipment">{props.options.immortal ? "БЕССМЕРТИЕ" : props.options.collar ? "ЩИТ ×1 · МАГНИТ" : "МАГНИТ"}</span>}
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
      {phase === "paused" && <section className="runner-overlay runner-pause-screen" aria-labelledby="runner-pause-title"><small>ПОГОНЯ НА ПАУЗЕ</small><h2 id="runner-pause-title">Переведи дух</h2><button type="button" className="runner-primary" autoFocus onClick={() => engineRef.current?.resume()}>Продолжить</button><button type="button" onClick={() => { bestBeforeRun.current = Math.max(props.best, Math.floor(engineRef.current?.distance ?? 0)); engineRef.current?.restart(); }}>Начать заново</button><button type="button" onClick={close}>К Кнопику</button><p>Свайп в сторону — полоса<br />Вверх — прыжок · вниз — кувырок</p></section>}
      {phase === "finished" && result && <section className="runner-overlay runner-finish-screen" aria-labelledby="runner-finish-title"><small>{newRecord ? "НОВЫЙ РЕКОРД" : "САХУР ДОГНАЛ"}</small><h2 id="runner-finish-title">{result.distance.toLocaleString("ru-RU")} <span>м</span></h2><div className="runner-result-coins"><CoinArtwork /><strong>+{result.coins}</strong></div><p>Монеты уже на балансе</p><button type="button" className="runner-primary" autoFocus onClick={start}>Ещё забег</button><button type="button" onClick={close}>К Кнопику</button></section>}
    </div>
    <p className="runner-sr" role="status">{phase === "paused" ? "Погоня приостановлена" : phase === "finished" && result ? `Забег завершён: ${result.distance} метров, ${result.coins} монет` : ""}</p>
  </GameModal>;
}
