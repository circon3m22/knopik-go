"use client";
import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react";
import { GameModal } from "./game-modal";
import { PixelDog } from "./pixel-artwork";
import { AdventureEngine, type AdventureSound, type AdventureView } from "./adventure-engine";
import { AdventureHeart, AdventureRenderer, AdventureScene } from "./adventure-artwork";
import { runnerFramePainted, runnerFrameRateActive } from "./frame-rate";
import type { ThemeId } from "./cosmetic-engine";
import { ActiveBalance } from "./active-balance";
import { AdventureSupplies, type AdventureSupply } from "./adventure-supplies";
import { GameUiIcon } from "./game-ui-icon";
import { BottomNavigation } from "./bottom-navigation";
import { AdventureDodgeButton } from "./adventure-dodge-button";
import { WEAPON_ORDER, adventureLevel } from "./adventure-levels";
import { AdventureWeaponPicker } from "./adventure-weapon-picker";
import { AdventureWeaponArt } from "./adventure-level-art";
import { DungeonCampaignMenu, DungeonMap } from "./dungeon-menu";
import type { ApartmentDestination } from "./apartment-interactions";
import { SAHUR_ATLAS_URL, SAHUR_GUN_ATLAS_URL } from "./sahur-sprite";
import type { AdventureLootBuff } from "./adventure-loot";
import type { NeighborhoodProgress } from "./neighborhood-progress";

type Props = { keepsakes?: NeighborhoodProgress; checkpoint: number; completedLevel: number; weaponTier: number; onLevelComplete: (level: number) => void; onUnlockWeapon: (tier: number) => void; theme: ThemeId; immortal: boolean; balance: number; onDeath: () => number; onBuySupply: (kind: AdventureSupply) => boolean; healCount: number; shieldCount: number; shieldActive: boolean; onConsumeHeal: () => boolean; onActivateShield: () => boolean; onShieldUsed: () => void; onCheckpoint: (value: number) => void; onClose: () => void; onRun: () => void; onBar: () => void; onShop: () => void; onCollect: (amount: number) => void; onLootBuff: (kind: AdventureLootBuff) => boolean; onSound: (kind: AdventureSound) => void };
const silentEvents = { change() {}, checkpoint() {}, sound() {}, run() {}, bar() {} };
export function AdventureGame(props: Props) {
  const propsRef = useRef(props);
  const engineRef = useRef<AdventureEngine | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const stickRef = useRef<HTMLButtonElement>(null);
  const nubRef = useRef<SVGSVGElement>(null);
  const inputRef = useRef({ x: 0, y: 0, attack: false });
  const stickPointer = useRef<number | null>(null);
  const attackPointer = useRef<number | null>(null);
  const keys = useRef(new Set<string>());
  const [mapSnapshot,setMapSnapshot]=useState<{player:{x:number;y:number};cleared:boolean[];gates:boolean[]}|null>(null),mapOpenRef=useRef(false);
  const mapOpen=mapSnapshot!==null;
  const [menuZone,setMenuZone]=useState(Math.max(1,Math.min(5,Math.floor(props.completedLevel/5)+1)));
  const weaponsRef=useRef<HTMLDivElement>(null);
  const [view, setView] = useState<AdventureView>(() => new AdventureEngine(props.checkpoint, silentEvents, { shield: props.shieldActive, immortal: props.immortal, completedLevel: props.completedLevel, weaponTier: props.weaponTier }).view());
  useEffect(() => { propsRef.current = props; }, [props]);
  useEffect(()=>{mapOpenRef.current=mapOpen;},[mapOpen]);
  useEffect(()=>{const strip=weaponsRef.current,button=strip?.querySelector<HTMLButtonElement>('[aria-pressed="true"]');if(strip&&button)strip.scrollLeft=Math.max(0,button.offsetLeft+button.offsetWidth-strip.clientWidth);},[view.weapon]);
  useEffect(() => {
    const engine = new AdventureEngine(propsRef.current.checkpoint, {
      change: next=>{setView(next);if(next.phase==="levels"&&next.area==="sewer")setMenuZone(next.zone);}, checkpoint: value => propsRef.current.onCheckpoint(value), sound: kind => propsRef.current.onSound(kind),
      run: () => propsRef.current.onRun(), bar: () => propsRef.current.onBar(),
      collect: amount => propsRef.current.onCollect(amount),
      lootBuff: kind => propsRef.current.onLootBuff(kind),
      consumeHeal: () => propsRef.current.onConsumeHeal(), activateShield: () => propsRef.current.onActivateShield(), shieldUsed: () => propsRef.current.onShieldUsed(),
      death: () => propsRef.current.onDeath(), buySupply: kind => propsRef.current.onBuySupply(kind),
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
      if (event.code === "Escape") { event.preventDefault(); if(mapOpenRef.current){mapOpenRef.current=false;setMapSnapshot(null);engine.resume();}else if (engine.phase === "paused") engine.resume(); else engine.pause(); return; }
      if(event.code==="KeyM"&&!event.repeat&&mapOpenRef.current){event.preventDefault();clearInput();mapOpenRef.current=false;setMapSnapshot(null);engine.resume();return;}
      if(event.code==="KeyM"&&!event.repeat&&engine.area==="sewer"&&engine.phase==="playing"){event.preventDefault();clearInput();engine.pause();mapOpenRef.current=true;setMapSnapshot({player:{...engine.player},cleared:[...engine.cleared],gates:engine.levelData.gates.map((_,i)=>engine.gateOpen(i))});return;}
      if (engine.phase !== "playing") return;
      // Space on a focused button keeps its native click behavior.
      if (event.code === "Space" && (event.target as HTMLElement)?.closest("button")) return;
      if (movement.has(event.code) || event.code === "Space" || event.code === "KeyJ") { event.preventDefault(); keys.current.add(event.code); update(); }
      if (!event.repeat && ["ShiftLeft", "ShiftRight", "KeyK"].includes(event.code)) { event.preventDefault(); engine.dodge(); }
      if (!event.repeat && event.code === "KeyE") { event.preventDefault(); engine.interact(); }
      if (!event.repeat && event.code === "KeyH") { event.preventDefault(); engine.heal(); }
      if (!event.repeat && event.code === "KeyL") { event.preventDefault(); engine.activateShield(); }
      if (!event.repeat && ["Digit1","Digit2","Digit3","Digit4","Digit5","Digit6"].includes(event.code)) { event.preventDefault(); engine.selectWeapon(WEAPON_ORDER[Number(event.code.slice(5))-1]); }
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
    const distance = Math.hypot(dx, dy), radius = Math.min(r.width * .3, (r.width - 46) / 2 - 4), ratio = Math.max(1, distance / radius);
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
  const openMap=()=>{pause();const engine=engineRef.current;if(engine){setMapSnapshot({player:{...engine.player},cleared:[...engine.cleared],gates:engine.levelData.gates.map((_,i)=>engine.gateOpen(i))});mapOpenRef.current=true;}};
  const closeMap=()=>{clearInput();setMapSnapshot(null);mapOpenRef.current=false;engineRef.current?.resume();};
  const combat = view.area === "sewer" || view.area === "apartment" && view.total > view.defeated;
  const home = view.area === "apartment" && view.checkpoint >= 3 && !combat;
  const areaName = view.area === "apartment" ? "Квартира Кнопика" : view.area === "basement" ? "Подвал" : adventureLevel(view.level).name;
  return <GameModal className={`adventure-game pixel-game theme-${props.theme}`} label="Приключение Кнопика" onDismiss={()=>mapOpenRef.current?closeMap():pause()}>
    <link rel="preload" as="image" href={SAHUR_ATLAS_URL}/>
    <link rel="preload" as="image" href={SAHUR_GUN_ATLAS_URL}/>
    <div className={`adventure-layout ${view.area==="apartment"?"is-apartment":""} ${view.phase==="levels"?"is-level-menu":""}`}>
      <header className="adventure-hud">
        <div className="adventure-topline">
          <div className="adventure-location"><small>{view.area === "sewer" ? `ПОДЗЕМЕЛЬЕ · ЗОНА ${view.zone} · ${view.stage}/5` : view.checkpoint < 3 ? "НОЧЬ ПОД ДОМОМ · ПРОЛОГ" : "ЛИПОВЫЙ КВАРТАЛ · ДОМ"}</small><strong>{areaName}</strong></div>
          <div className="adventure-header-actions">
            {view.area === "sewer" && <button className="adventure-pause dungeon-map-button" type="button" disabled={view.phase !== "playing"} aria-label="Карта уровня · M" onClick={openMap}><GameUiIcon kind="map"/></button>}
            <button className="adventure-pause" type="button" disabled={!["playing", "dialogue"].includes(view.phase)} aria-label="Пауза · Escape" onClick={pause}><GameUiIcon kind="pause"/></button>
          </div>
        </div>
        <div className="adventure-vitals">
          <div className="adventure-life"><div className="adventure-health" role="img" aria-label={`Здоровье: ${view.hp} из 3`}><AdventureHeart filled={view.hp > 0}/><AdventureHeart filled={view.hp > 1}/><AdventureHeart filled={view.hp > 2}/></div><small className={view.shieldReady ? "is-protected" : ""}>{view.revived ? "Щит спас Кнопика" : view.shieldReady ? "Щит активен" : home ? "Дома спокойно" : "Береги сердца"}</small></div>
          <ActiveBalance amount={props.balance} atRisk={combat && !view.shieldReady}/>
        </div>
        <div className="adventure-mission-line"><GameUiIcon kind="goal"/><span className="adventure-objective" role="status">{view.objective}</span>{view.area === "sewer" && <small title="Задачи уровня">{view.tasksDone}/{view.tasksTotal} ✓</small>}</div>
      </header>
      <div className="adventure-viewport">
        <AdventureScene key={`${view.area}-${view.level}-${props.theme}`} ref={svgRef} area={view.area} theme={props.theme} level={view.level} keepsakes={props.keepsakes} destinationsDisabled={view.phase !== "playing" || view.area === "apartment" && view.total > view.defeated} onDestination={chooseDestination}/>

        {view.phase==="playing"&&view.notice&&<div className="dungeon-action-notice" role="status">{view.notice}</div>}
        {mapSnapshot&&<div className="adventure-overlay dungeon-map-overlay"><DungeonMap view={view} player={mapSnapshot.player} cleared={mapSnapshot.cleared} gates={mapSnapshot.gates} onClose={closeMap}/></div>}
        {view.area === "apartment" && view.checkpoint === 0 && !view.dodged && view.total === 0 && view.phase === "playing" && <span className="adventure-knock" aria-hidden="true">ТУН. ТУН. ТУН.</span>}
        {view.phase === "title" && <div className="adventure-overlay"><section className="adventure-card adventure-title">
          <small>KNOPIK GO · ГЛАВА 1</small><PixelDog/><h1>Ночь под домом</h1><p>{view.checkpoint === 0 ? "Обычный вечер. Странный стук. И кое-кто за дверью подвала." : view.checkpoint === 3 ? "Твой дом. Твои сны. Туннели под городом." : "Стук привёл тебя под дом. Продолжи с начала сохранённой части."}</p>
          <button className="adventure-primary" type="button" onClick={() => engineRef.current?.begin()}>{view.checkpoint === 0 ? "Играть" : "Продолжить"}</button>
          {view.area !== "apartment" && view.checkpoint >= 3 && <button className="adventure-secondary" type="button" onClick={props.onClose}>Тапать Кнопика</button>}
        </section></div>}
        {view.phase === "dialogue" && <div className="adventure-dialogue adventure-card"><strong>{view.speaker}</strong><p>{view.dialogue}</p><button className="adventure-primary" type="button" onClick={() => engineRef.current?.nextDialogue()}>Дальше →</button></div>}
        {view.phase==="levels" && <div className="adventure-overlay"><DungeonCampaignMenu view={view} zone={menuZone} onZone={setMenuZone} onLevel={id=>{clearInput();engineRef.current?.selectLevel(id);}} onClose={()=>engineRef.current?.closeLevels()}/></div>}
        {view.phase === "paused" && !mapOpen && <div className="adventure-overlay"><section className="adventure-card"><small>KNOPIK GO</small><h2>Пауза</h2><button className="adventure-primary" type="button" onClick={() => engineRef.current?.resume()}>Продолжить</button><button className="adventure-secondary" type="button" onClick={() => engineRef.current?.exitToApartment()}>Выйти в квартиру</button></section></div>}
        {view.phase === "dead" && <div className="adventure-overlay"><section className="adventure-card"><AdventureHeart filled={false}/><h2>Кнопик, вставай!</h2><p>Активный баланс сгорел.</p><div className="adventure-death-loss">−{view.lostCoins.toLocaleString("ru-RU")} <small>KC</small></div><p className="adventure-death-tip">Деньги в сейфе и запас предметов сохранены.<br/>Щит спасёт от следующей гибели.</p><button className="adventure-primary" type="button" onClick={() => engineRef.current?.restart()}>Начать уровень заново</button></section></div>}
        {view.phase === "won" && <div className="adventure-overlay"><section className="adventure-card adventure-victory"><small>{view.total} САХУРОВ ПОВЕРЖЕНО · +{view.coins} KC</small><PixelDog joy={3}/><h2>Уровень {view.level} пройден!</h2><p>Магазин, напитки-сны и прогулки по району теперь открыты.</p><button className="adventure-primary" type="button" onClick={() => engineRef.current?.returnHome()}>Вернуться домой</button></section></div>}
      </div>
      <footer className={`adventure-controls ${combat ? "has-combat" : ""}`} aria-label="Управление Кнопиком">
        {combat && <div className="adventure-toolbelt">
        {view.area === "sewer" && <AdventureWeaponPicker ref={weaponsRef} phase={view.phase} weapon={view.weapon} weaponTier={view.weaponTier} onSelect={weapon => engineRef.current?.selectWeapon(weapon)}/>}
        {combat && <AdventureSupplies phase={view.phase} balance={props.balance} healCount={props.healCount} shieldCount={props.shieldCount} canHeal={view.canHeal} shieldReady={view.shieldReady} onBuy={kind => engineRef.current?.buySupply(kind)} onHeal={() => engineRef.current?.heal()} onShield={() => engineRef.current?.activateShield()}/>}
        </div>}
        <div className="adventure-controller-row">
        <div className="adventure-stick-wrap"><button ref={stickRef} className="adventure-stick" type="button" aria-label="Джойстик движения. На клавиатуре: WASD или стрелки" disabled={view.phase !== "playing"} onPointerDown={event => {
          if (stickPointer.current !== null || event.button !== 0) return;
          event.preventDefault(); stickPointer.current = event.pointerId; event.currentTarget.setPointerCapture(event.pointerId); moveStick(event);
        }} onPointerMove={moveStick} onPointerUp={releaseStick} onPointerCancel={releaseStick} onLostPointerCapture={releaseStick}><svg className="adventure-stick-arrows" viewBox="0 0 100 100" aria-hidden="true"><path d="M45 8h10v25h12v10H55v12h12v10H55v27H45V65H33V55h12V43H33V33h12Z" fill="currentColor"/><path d="M8 45h25v10H8Zm59 0h25v10H67Z" fill="currentColor"/></svg><svg className="adventure-stick-nub" ref={nubRef} width="46" height="46" viewBox="0 0 46 46" aria-hidden="true" shapeRendering="crispEdges"><path d="M4 0h38v4h4v38h-4v4H4v-4H0V4h4Z" fill="#2f514b"/><path d="M4 4h38v38H4Z" fill="#537d75"/><path d="M4 4h38v4H8v30H4Z" fill="#9bc6af"/><path d="M8 38h34v4H8Zm30-30h4v30h-4Z" fill="#3a6359"/><path d="M14 19h18v3H14Zm0 6h18v3H14Z" fill="#b0d4bb"/></svg></button><small>Движение · WASD</small></div>
        <div className="adventure-actions">{home ? <div className="apartment-destinations" role="group" aria-label="Куда отправиться">{(["street", "basement", "bar"] as const).map(destination => <button key={destination} type="button" disabled={view.phase !== "playing"} onClick={() => chooseDestination(destination)}><GameUiIcon kind={destination}/><span>{destination === "street" ? "Улица" : destination === "bar" ? "Мини-бар" : "Уровни"}</span></button>)}</div> : <button className="adventure-interact" type="button" disabled={view.phase !== "playing" || !view.interaction} onClick={() => engineRef.current?.interact()}>{view.interaction || "Подойди ближе · E"}</button>}{view.canFinish ? <button className="adventure-primary adventure-finish" type="button" onClick={() => { clearInput(); engineRef.current?.finishLevel(); }}>Завершить ✓</button> : !home && <div className="adventure-combat-buttons">
          <AdventureDodgeButton disabled={view.phase !== "playing" || !view.dodgeReady} ready={view.dodgeReady} onDodge={() => engineRef.current?.dodge()}/>
          <button className="adventure-attack" type="button" disabled={view.phase !== "playing"} onPointerDown={event => { if (attackPointer.current !== null || event.button !== 0) return; event.preventDefault(); attackPointer.current = event.pointerId; event.currentTarget.setPointerCapture(event.pointerId); inputRef.current.attack = true; syncInput(); }} onPointerUp={releaseAttack} onPointerCancel={releaseAttack} onLostPointerCapture={releaseAttack} onClick={event => { if (event.detail === 0) { engineRef.current?.setInput(0, 0, true); engineRef.current?.advance(1 / 60); engineRef.current?.setInput(inputRef.current.x, inputRef.current.y, false); } }}><AdventureWeaponArt weapon={view.area==="sewer"?view.weapon:"fist"} icon/><small>{view.weapon==="sabre" && !view.weaponReady?"Зарядка…":view.weapon==="sabre"?"Взмах":view.weapon==="fist"?"Удар":view.weapon==="arc"?"Разряд":"Выстрел"}</small></button>
        </div>}</div>
        </div>
      </footer>
      {view.area==="apartment" && <div className="adventure-navigation"><BottomNavigation activeIndex={2} locked={view.completedLevel<1} onSelect={index => { if (index === 0) props.onShop(); else if (index === 1) props.onClose(); else engineRef.current?.closeLevels(); }}/></div>}
    </div>
  </GameModal>;
}
