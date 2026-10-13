"use client";
import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react";
import { GameModal } from "./game-modal";
import { PixelDog } from "./pixel-artwork";
import { AdventureEngine, type AdventureSound, type AdventureView } from "./adventure-engine";
import { AdventureHeart, AdventureRenderer, AdventureScene } from "./adventure-artwork";
import { runnerFramePainted, runnerFrameRateActive } from "./frame-rate";
import type { ThemeId } from "./cosmetic-engine";
import { QuickBuffArtwork } from "./quick-buff-artwork";
import { BottomNavigation } from "./bottom-navigation";
import { AdventureDodgeButton } from "./adventure-dodge-button";
import { ADVENTURE_LEVELS, ADVENTURE_WEAPONS, adventureLevel } from "./adventure-levels";
import { AdventureWeaponArt } from "./adventure-level-art";
import type { ApartmentDestination } from "./apartment-interactions";
import { SAHUR_ATLAS_URL, SAHUR_GUN_ATLAS_URL } from "./sahur-sprite";
import type { AdventureLootBuff } from "./adventure-loot";

type Props = { checkpoint: number; completedLevel: number; weaponTier: number; onLevelComplete: (level: number) => void; onUnlockWeapon: (tier: number) => void; theme: ThemeId; immortal: boolean; healCount: number; shieldCount: number; shieldActive: boolean; onConsumeHeal: () => boolean; onActivateShield: () => boolean; onShieldUsed: () => void; onCheckpoint: (value: number) => void; onClose: () => void; onRun: () => void; onBar: () => void; onShop: () => void; onCollect: (amount: number) => void; onLootBuff: (kind: AdventureLootBuff) => boolean; onSound: (kind: AdventureSound) => void };
const silentEvents = { change() {}, checkpoint() {}, sound() {}, run() {}, bar() {} };
export function AdventureGame(props: Props) {
  const propsRef = useRef(props);
  const engineRef = useRef<AdventureEngine | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const stickRef = useRef<HTMLButtonElement>(null);
  const nubRef = useRef<HTMLSpanElement>(null);
  const inputRef = useRef({ x: 0, y: 0, attack: false });
  const stickPointer = useRef<number | null>(null);
  const attackPointer = useRef<number | null>(null);
  const keys = useRef(new Set<string>());
  const [view, setView] = useState<AdventureView>(() => new AdventureEngine(props.checkpoint, silentEvents, { shield: props.shieldActive, immortal: props.immortal, completedLevel: props.completedLevel, weaponTier: props.weaponTier }).view());
  useEffect(() => { propsRef.current = props; }, [props]);
  useEffect(() => {
    const engine = new AdventureEngine(propsRef.current.checkpoint, {
      change: setView, checkpoint: value => propsRef.current.onCheckpoint(value), sound: kind => propsRef.current.onSound(kind),
      run: () => propsRef.current.onRun(), bar: () => propsRef.current.onBar(),
      collect: amount => propsRef.current.onCollect(amount),
      lootBuff: kind => propsRef.current.onLootBuff(kind),
      consumeHeal: () => propsRef.current.onConsumeHeal(), activateShield: () => propsRef.current.onActivateShield(), shieldUsed: () => propsRef.current.onShieldUsed(),
      levelComplete: level => propsRef.current.onLevelComplete(level), unlockWeapon: tier => propsRef.current.onUnlockWeapon(tier),
    }, { shield: propsRef.current.shieldActive, immortal: propsRef.current.immortal, completedLevel: propsRef.current.completedLevel, weaponTier: propsRef.current.weaponTier });
    engineRef.current = engine; setView(engine.view());
    return () => { engineRef.current = null; };
  }, []);
  useEffect(() => { engineRef.current?.setImmortal(props.immortal); }, [props.immortal]);
  const syncInput = useCallback(() => engineRef.current?.setInput(inputRef.current.x, inputRef.current.y, inputRef.current.attack), []);
  const clearInput = useCallback(() => {
    inputRef.current = { x: 0, y: 0, attack: false }; keys.current.clear();
    stickPointer.current = attackPointer.current = null;
    if (nubRef.current) nubRef.current.style.transform = "translate(0, 0)";
    syncInput();
  }, [syncInput]);
  const chooseDestination = useCallback((destination: ApartmentDestination) => { clearInput(); engineRef.current?.interactDestination(destination); }, [clearInput]);
  useEffect(() => {
    const engine = engineRef.current, svg = svgRef.current;
    if (!engine || !svg) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let renderer = new AdventureRenderer(svg, motion.matches);
    const resize = () => { const rect = svg.getBoundingClientRect(); renderer.resize(rect.width, rect.height); renderer.paint(engine, true); };
    const changeMotion = () => { renderer = new AdventureRenderer(svg, motion.matches); resize(); };
    const observer = new ResizeObserver(resize); observer.observe(svg); motion.addEventListener("change", changeMotion); resize();
    let previous = 0, frame = 0;
    runnerFrameRateActive(true);
    const tick = (now: number) => {
      const before = performance.now();
      if (!document.hidden) { engine.advance(previous ? (now - previous) / 1000 : 0); renderer.paint(engine); runnerFramePainted(now, performance.now() - before); }
      previous = now; frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); motion.removeEventListener("change", changeMotion); runnerFrameRateActive(false); };
  }, [view.area, view.level, props.theme]);
  useEffect(() => { if (view.phase !== "playing") clearInput(); }, [view.phase]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const movement = new Set(["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]);
    const update = () => {
      const held = keys.current;
      inputRef.current.x = Number(held.has("KeyD") || held.has("ArrowRight")) - Number(held.has("KeyA") || held.has("ArrowLeft"));
      inputRef.current.y = Number(held.has("KeyS") || held.has("ArrowDown")) - Number(held.has("KeyW") || held.has("ArrowUp"));
      inputRef.current.attack = held.has("Space") || held.has("KeyJ"); syncInput();
    };
    const down = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey || (event.target as HTMLElement)?.matches("input, textarea, select")) return;
      const engine = engineRef.current;
      if (!engine) return;
      if (event.code === "Escape") { event.preventDefault(); if (engine.phase === "paused") engine.resume(); else engine.pause(); return; }
      if (engine.phase !== "playing") return;
      // Space on a focused button keeps its native click behavior.
      if (event.code === "Space" && (event.target as HTMLElement)?.closest("button")) return;
      if (movement.has(event.code) || event.code === "Space" || event.code === "KeyJ") { event.preventDefault(); keys.current.add(event.code); update(); }
      if (!event.repeat && ["ShiftLeft", "ShiftRight", "KeyK"].includes(event.code)) { event.preventDefault(); engine.dodge(); }
      if (!event.repeat && event.code === "KeyE") { event.preventDefault(); engine.interact(); }
      if (!event.repeat && event.code === "KeyH") { event.preventDefault(); engine.heal(); }
      if (!event.repeat && event.code === "KeyL") { event.preventDefault(); engine.activateShield(); }
      if (!event.repeat && ["Digit1","Digit2","Digit3"].includes(event.code)) { event.preventDefault(); engine.selectWeapon(event.code==="Digit1"?"fist":event.code==="Digit2"?"sabre":"pistol"); }
    };
    const up = (event: KeyboardEvent) => { if (keys.current.delete(event.code)) { event.preventDefault(); update(); } };
    const blur = () => { clearInput(); engineRef.current?.pause(); };
    const visibility = () => { if (document.hidden) blur(); };
    window.addEventListener("keydown", down); window.addEventListener("keyup", up); window.addEventListener("blur", blur); document.addEventListener("visibilitychange", visibility);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); window.removeEventListener("blur", blur); document.removeEventListener("visibilitychange", visibility); clearInput(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const moveStick = (event: PointerEvent<HTMLButtonElement>) => {
    if (stickPointer.current !== event.pointerId || view.phase !== "playing") return;
    const r = event.currentTarget.getBoundingClientRect(), dx = event.clientX - r.left - r.width / 2, dy = event.clientY - r.top - r.height / 2;
    const distance = Math.hypot(dx, dy), radius = r.width * .3, ratio = Math.max(1, distance / radius);
    inputRef.current.x = distance < 5 ? 0 : dx / ratio / radius; inputRef.current.y = distance < 5 ? 0 : dy / ratio / radius;
    if (nubRef.current) nubRef.current.style.transform = `translate(${dx / ratio}px, ${dy / ratio}px)`;
    syncInput();
  };
  const releaseStick = (event: PointerEvent<HTMLButtonElement>) => {
    if (stickPointer.current !== event.pointerId) return;
    stickPointer.current = null; inputRef.current.x = inputRef.current.y = 0; syncInput();
    if (nubRef.current) nubRef.current.style.transform = "translate(0, 0)";
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };
  const releaseAttack = (event: PointerEvent<HTMLButtonElement>) => {
    if (attackPointer.current !== event.pointerId) return;
    attackPointer.current = null; inputRef.current.attack = false; syncInput();
  };
  const pause = () => { clearInput(); engineRef.current?.pause(); };
  const areaName = view.area === "apartment" ? "Квартира Кнопика" : view.area === "basement" ? "Подвал" : adventureLevel(view.level).name;
  return <GameModal className={`adventure-game pixel-game theme-${props.theme}`} label="Приключение Кнопика" onDismiss={pause}>
    <link rel="preload" as="image" href={SAHUR_ATLAS_URL}/>
    <link rel="preload" as="image" href={SAHUR_GUN_ATLAS_URL}/>
    <div className={`adventure-layout ${view.area==="apartment"?"is-apartment":""} ${view.phase==="levels"?"is-level-menu":""}`}>
      <header className="adventure-hud">
        <div className="adventure-health" role="img" aria-label={`Здоровье: ${view.hp} из 3`}><AdventureHeart filled={view.hp > 0}/><AdventureHeart filled={view.hp > 1}/><AdventureHeart filled={view.hp > 2}/></div>
        <div className="adventure-location"><small>{view.area === "sewer" ? `Уровень ${view.level} · ${view.defeated}/${view.total}` : view.checkpoint < 3 ? "Пролог" : "Дом"}{view.area !== "basement" && <span className="adventure-coin-readout"> · {view.coins} KC</span>}</small><strong>{areaName}</strong></div>
        {view.area !== "apartment" && (view.phase === "playing" || view.phase === "dialogue") && <button className="adventure-pause" type="button" aria-label="Пауза" onClick={pause}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h5v16H5Zm9 0h5v16h-5Z" fill="currentColor"/></svg></button>}
      </header>
      <div className="adventure-viewport">
        <AdventureScene key={`${view.area}-${view.level}-${props.theme}`} ref={svgRef} area={view.area} theme={props.theme} level={view.level} destinationsDisabled={view.phase !== "playing" || view.area === "apartment" && view.total > view.defeated} onDestination={chooseDestination}/>
        <div className="adventure-objective" role="status">{view.objective}</div>
        {view.phase === "playing" && view.lootMessage && <div key={view.lootId} className="adventure-loot-notice" role="status">{view.lootBuff ? <QuickBuffArtwork kind={view.lootBuff}/> : <svg viewBox="0 0 32 36" shapeRendering="crispEdges" aria-hidden="true"><path d="M9 2h14v4h5v24h-5v4H9v-4H4V6h5Z" fill="#775442"/><path d="M10 5h12v4h3v18h-3v4H10v-4H7V9h3Z" fill="#f4d889"/><path d="M10 6h12v3H10Zm-3 4h4v15H7Z" fill="#fff1d1"/><path d="M13 11h4v7l5-7h4l-7 9 7 7h-5l-4-5v5h-4Z" fill="#ae8060"/></svg>}<span><small>В сундуке</small><strong>{view.lootMessage}</strong></span></div>}
        {(view.shieldReady || view.revived) && <div className="adventure-shield-status" role="status">{view.revived ? "Щит сработал · 3 сердца" : "Щит готов · спасёт от смерти"}</div>}
        {(view.area === "sewer" || view.area === "apartment" && view.total > 0) && <div className="adventure-buffs" aria-label="Баффы для боя">
          <button type="button" className="adventure-buff adventure-heal" disabled={!view.canHeal || props.healCount < 1} onClick={() => engineRef.current?.heal()} aria-label={`Хилка. В запасе ${props.healCount}. Восстановить одно сердце. Клавиша H`} title="Хилка: +1 сердце · H"><QuickBuffArtwork kind="heal"/><small>Хилка</small><b>{props.healCount}</b></button>
          <button type="button" className={`adventure-buff adventure-shield ${view.shieldReady ? "is-active" : ""}`} disabled={view.phase !== "playing" || view.shieldReady || props.shieldCount < 1} onClick={() => engineRef.current?.activateShield()} aria-label={view.shieldReady ? "Щит активен. Воскресит с тремя сердцами на месте гибели" : `Щит. В запасе ${props.shieldCount}. Активировать защиту от смерти. Клавиша L`} title="Щит: возрождение на месте · L"><QuickBuffArtwork kind="pepsi"/><small>{view.shieldReady ? "Готов" : "Щит"}</small><b>{view.shieldReady ? "✓" : props.shieldCount}</b></button>
        </div>}
        {view.area==="sewer" && <div className="adventure-weapons" role="group" aria-label="Выбор оружия: клавиши 1, 2, 3">{(["fist","sabre","pistol"] as const).map((weapon,i)=><button key={weapon} type="button" aria-pressed={view.weapon===weapon} aria-label={`${ADVENTURE_WEAPONS[weapon].name}. ${view.weapon===weapon?"Выбрано. ":""}Клавиша ${i+1}`} disabled={view.phase!=="playing" || weapon==="sabre" && view.weaponTier<1 || weapon==="pistol" && view.weaponTier<2} onClick={()=>engineRef.current?.selectWeapon(weapon)}><AdventureWeaponArt weapon={weapon} icon/><small>{ADVENTURE_WEAPONS[weapon].name}</small></button>)}</div>}
        {view.area === "apartment" && view.checkpoint === 0 && !view.dodged && view.total === 0 && view.phase === "playing" && <span className="adventure-knock" aria-hidden="true">ТУН. ТУН. ТУН.</span>}
        {view.phase === "title" && <div className="adventure-overlay"><section className="adventure-card adventure-title">
          <small>KNOPIK GO · ГЛАВА 1</small><PixelDog/><h1>Ночь под домом</h1><p>{view.checkpoint === 0 ? "Обычный вечер. Странный стук. И кое-кто за дверью подвала." : view.checkpoint === 3 ? "Твой дом. Твои сны. Туннели под городом." : "Стук привёл тебя под дом. Продолжи с начала сохранённой части."}</p>
          <button className="adventure-primary" type="button" onClick={() => engineRef.current?.begin()}>{view.checkpoint === 0 ? "Играть" : "Продолжить"}</button>
          {view.area !== "apartment" && view.checkpoint >= 3 && <button className="adventure-secondary" type="button" onClick={props.onClose}>Тапать Кнопика</button>}
        </section></div>}
        {view.phase === "dialogue" && <div className="adventure-dialogue adventure-card"><strong>{view.speaker}</strong><p>{view.dialogue}</p><button className="adventure-primary" type="button" onClick={() => engineRef.current?.nextDialogue()}>Дальше →</button></div>}
        {view.phase==="levels" && <div className="adventure-overlay"><section className="adventure-card adventure-level-menu">{view.area === "sewer" && <small>{view.total} САХУРОВ ПОВЕРЖЕНО · +{view.coins} KC</small>}<h2>{view.area === "sewer" ? `Уровень ${view.level} пройден!` : "Под домом"}</h2><p>{view.area === "sewer" ? view.level === 5 ? "Все пять уровней пройдены. Можно пройти их снова или вернуться в квартиру." : "Следующий уровень открыт." : "Выбери уровень"}</p>{view.area === "sewer" && view.level < 5 && <button className="adventure-primary adventure-next-level" type="button" onClick={() => engineRef.current?.selectLevel(view.level+1)}>Пройти уровень {view.level+1}</button>}<div className="adventure-level-list">{ADVENTURE_LEVELS.map(level=><button key={level.id} type="button" disabled={level.id>view.completedLevel+1} onClick={()=>engineRef.current?.selectLevel(level.id)}><b>{level.id}</b><span><strong>{level.name}</strong><small>{level.id>view.completedLevel+1?`После уровня ${level.id-1}`:level.feature}</small></span>{level.id<=view.completedLevel && <i aria-label="Пройден">✓</i>}</button>)}</div><button className="adventure-secondary" type="button" onClick={()=>engineRef.current?.closeLevels()}>Выйти в квартиру</button></section></div>}
        {view.phase === "paused" && <div className="adventure-overlay"><section className="adventure-card"><small>KNOPIK GO</small><h2>Пауза</h2><button className="adventure-primary" type="button" onClick={() => engineRef.current?.resume()}>Продолжить</button><button className="adventure-secondary" type="button" onClick={() => engineRef.current?.exitToApartment()}>Выйти в квартиру</button></section></div>}
        {view.phase === "dead" && <div className="adventure-overlay"><section className="adventure-card"><AdventureHeart filled={false}/><h2>Кнопик, вставай!</h2><p>Три сердца закончились.<br/>Замах виден заранее: уходи рывком, а потом бей.</p><button className="adventure-primary" type="button" onClick={() => engineRef.current?.restart()}>Начать уровень заново</button></section></div>}
        {view.phase === "won" && <div className="adventure-overlay"><section className="adventure-card adventure-victory"><small>{view.total} САХУРОВ ПОВЕРЖЕНО · +{view.coins} KC</small><PixelDog joy={3}/><h2>Уровень {view.level} пройден!</h2><p>Магазин, напитки-сны и Кнопик Run теперь открыты.</p><button className="adventure-primary" type="button" onClick={() => engineRef.current?.returnHome()}>Вернуться домой</button></section></div>}
      </div>
      <footer className="adventure-controls" aria-label="Управление Кнопиком">
        <div className="adventure-stick-wrap"><button ref={stickRef} className="adventure-stick" type="button" aria-label="Джойстик движения. На клавиатуре: WASD или стрелки" disabled={view.phase !== "playing"} onPointerDown={event => {
          if (stickPointer.current !== null || event.button !== 0) return;
          event.preventDefault(); stickPointer.current = event.pointerId; event.currentTarget.setPointerCapture(event.pointerId); moveStick(event);
        }} onPointerMove={moveStick} onPointerUp={releaseStick} onPointerCancel={releaseStick} onLostPointerCapture={releaseStick}><svg className="adventure-stick-arrows" viewBox="0 0 100 100" aria-hidden="true"><path d="M45 8h10v25h12v10H55v12h12v10H55v27H45V65H33V55h12V43H33V33h12Z" fill="currentColor"/><path d="M8 45h25v10H8Zm59 0h25v10H67Z" fill="currentColor"/></svg><span className="adventure-stick-nub" ref={nubRef} aria-hidden="true"/></button><small>Движение</small></div>
        <div className="adventure-actions"><button className="adventure-interact" type="button" disabled={view.phase !== "playing" || !view.interaction} onClick={() => engineRef.current?.interact()}>{view.interaction || "Подойди ближе"}</button>{view.canFinish ? <button className="adventure-primary adventure-finish" type="button" onClick={() => { clearInput(); engineRef.current?.finishLevel(); }}>Завершить ✓</button> : !(view.area === "apartment" && view.checkpoint >= 3) && <div className="adventure-combat-buttons">
          <AdventureDodgeButton disabled={view.phase !== "playing" || !view.dodgeReady} ready={view.dodgeReady} onDodge={() => engineRef.current?.dodge()}/>
          <button className="adventure-attack" type="button" disabled={view.phase !== "playing"} onPointerDown={event => { if (attackPointer.current !== null || event.button !== 0) return; event.preventDefault(); attackPointer.current = event.pointerId; event.currentTarget.setPointerCapture(event.pointerId); inputRef.current.attack = true; syncInput(); }} onPointerUp={releaseAttack} onPointerCancel={releaseAttack} onLostPointerCapture={releaseAttack} onClick={event => { if (event.detail === 0) { engineRef.current?.setInput(0, 0, true); engineRef.current?.advance(1 / 60); engineRef.current?.setInput(inputRef.current.x, inputRef.current.y, false); } }}><AdventureWeaponArt weapon={view.area==="sewer"?view.weapon:"fist"} icon/><small>{view.weapon==="sabre" && !view.weaponReady?"Зарядка…":view.weapon==="pistol"?"Выстрел":view.weapon==="sabre"?"Взмах":"Удар"}</small></button>
        </div>}</div>
      </footer>
      {view.area==="apartment" && <div className="adventure-navigation"><BottomNavigation activeIndex={2} locked={view.completedLevel<1} onSelect={index => { if (index === 0) props.onShop(); else if (index === 1) props.onClose(); else engineRef.current?.closeLevels(); }}/></div>}
    </div>
  </GameModal>;
}
