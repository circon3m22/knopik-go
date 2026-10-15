"use client";
import type { KnopikEquipment } from "./knopik-equipment";
import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { GameModal } from "./game-modal";
import { PauseSettingsButton, useGameSettingsAccess } from "./game-settings-access";
import {generateEndlessDungeon} from "./endless-dungeon";
import {generateArcadeDungeon} from "./arcade-dungeon";
import type {EndlessProgress} from "./endless-progress";
import {EndlessCamp} from "./endless-menu";
import { AdventureEngine, type AdventureSound, type AdventureView } from "./adventure-engine";
import { AdventureHeart, AdventureRenderer, AdventureScene } from "./adventure-artwork";
import { runnerFramePainted, runnerFrameRateActive } from "./frame-rate";
import type { ThemeId } from "./cosmetic-engine";
import { GamePlayHud } from "./game-play-hud";
import { AdventureOpeningCinema } from "./adventure-opening-cinema";
import {AdventureHomecomingCinema} from "./adventure-homecoming-cinema";
import { GameMovementStick } from "./game-movement-stick";
import {observeJoystickRelease} from "./joystick-release";
import { AdventureSupplies } from "./adventure-supplies";
import { GameUiIcon } from "./game-ui-icon";

import { AdventureDodgeButton } from "./adventure-dodge-button";
import { AdventureEnergyButton } from "./adventure-energy-button";
import { AdventureCooldownPainter } from "./adventure-cooldown";
import { WEAPON_ORDER, adventureLevel } from "./adventure-levels";
import { AdventureWeaponPicker } from "./adventure-weapon-picker";
import { AdventureWeaponArt } from "./adventure-level-art";
import { DungeonCampaignMenu, DungeonMap } from "./dungeon-menu";
import type { ApartmentDestination } from "./apartment-interactions";
import { SAHUR_ATLAS_URL, SAHUR_GUN_ATLAS_URL } from "./sahur-sprite";
import type { AdventureLootBuff } from "./adventure-loot";
import type { NeighborhoodProgress } from "./neighborhood-progress";
import { ApartmentMap } from "./apartment-map";
import { HOME_ROOMS } from "./apartment-world";
import { AdventureTrainingOverlay } from "./adventure-training-overlay";
import { FramePaintLimiter,type FpsLimit,type WorldGraphicsMode } from "./render-preferences";
import type { CombatTraining } from "./adventure-training";

type Props = { worldGraphics?:WorldGraphicsMode;fpsLimit?:FpsLimit; endlessProgress?:EndlessProgress;onEndlessProgress?:(progress:EndlessProgress)=>void; combatTraining?:CombatTraining;onTrainingKit?:()=>void;onTrainingStep?:(step:number)=>void;suspended?:boolean;fromStreet?:boolean;fromComputer?:boolean;vaultBalance?:number;barDrinks?:readonly import("./pixel-artwork").PotionKind[];brewing?:boolean;onHomePanel?:(room:"wardrobe"|"vault"|"laboratory"|"aura")=>void;onLaboratoryChest?:(level:number,room:number)=>void;onLaboratoryIngredient?:(level:number,room:number,material:import("./laboratory-engine").LabMaterial)=>boolean;claimedIngredients?:readonly string[];equipment:KnopikEquipment; keepsakes?: NeighborhoodProgress; checkpoint: number; completedLevel: number; weaponTier: number; onLevelComplete: (level: number) => void; onUnlockWeapon: (tier: number) => void; theme: ThemeId; immortal: boolean; balance: number; surgeCount:number; onConsumeSurge:()=>boolean; onDeath: () => number; healCount: number; shieldCount: number; shieldActive: boolean; onConsumeHeal: () => boolean; onActivateShield: () => boolean; onShieldUsed: () => void; onCheckpoint: (value: number) => void; onClose: () => void; onRun: () => void; onBar: () => void; onShop: () => void;onComputer:()=>void; onCollect: (amount: number) => void; onLootBuff: (kind: AdventureLootBuff) => boolean; onAura?: (amount:1)=>void; onSound: (kind: AdventureSound) => void };
const silentEvents = { change() {}, checkpoint() {}, sound() {}, run() {}, bar() {} };
export function AdventureGame(props: Props) {
  const preferences=useGameSettingsAccess(),preferencesRef=useRef(preferences.active);
  useEffect(()=>{preferencesRef.current=preferences.active;},[preferences.active]);
  const propsRef = useRef(props);
  const engineRef = useRef<AdventureEngine | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const stickRef = useRef<HTMLButtonElement>(null);
  const nubRef = useRef<SVGSVGElement>(null);
  const inputRef = useRef({ x: 0, y: 0, attack: false });
  const stickPointer = useRef<number | null>(null);
  const stickLastActivity=useRef(0);
  const attackPointer = useRef<number | null>(null);
  const attackButton = useRef<HTMLButtonElement>(null), energyButton = useRef<HTMLButtonElement>(null);
  const keys = useRef(new Set<string>());
  const [mapSnapshot,setMapSnapshot]=useState<{player:{x:number;y:number;angle?:number};cleared:boolean[];gates:boolean[]}|null>(null),mapOpenRef=useRef(false);
  const mapOpen=mapSnapshot!==null;
  const [menuZone,setMenuZone]=useState(Math.max(1,Math.min(5,Math.floor(props.completedLevel/5)+1)));
  const weaponsRef=useRef<HTMLDivElement>(null);
  const [view, setView] = useState<AdventureView>(() => new AdventureEngine(props.checkpoint, silentEvents, { shield: props.shieldActive, immortal: props.immortal, completedLevel: props.completedLevel, weaponTier: props.weaponTier,endlessProgress:props.endlessProgress,claimedIngredients:props.claimedIngredients }).view());
  const layout=useMemo(()=>view.arcade?generateArcadeDungeon(view.arcadeSeed,view.arcadeSegment):view.endlessFloor?generateEndlessDungeon(view.endlessSeed,view.endlessFloor):adventureLevel(view.level),[view.arcade,view.arcadeSeed,view.arcadeSegment,view.endlessFloor,view.endlessSeed,view.level]);
  useEffect(() => { propsRef.current = props; }, [props]);
  useEffect(()=>{mapOpenRef.current=mapOpen;},[mapOpen]);

  useEffect(() => {
    const engine = new AdventureEngine(propsRef.current.checkpoint, {
      change: next=>{setView(next);if(next.phase==="levels"&&next.area==="sewer")setMenuZone(next.zone);}, checkpoint: value => propsRef.current.onCheckpoint(value), sound: kind => propsRef.current.onSound(kind),
      run: () => propsRef.current.onRun(), bar: () => propsRef.current.onBar(), computer:()=>propsRef.current.onComputer(), homePanel: room=>propsRef.current.onHomePanel?.(room),laboratoryChest:(level,room)=>propsRef.current.onLaboratoryChest?.(level,room),laboratoryIngredient:(level,room,material)=>propsRef.current.onLaboratoryIngredient?.(level,room,material)??false,
      collect: amount => propsRef.current.onCollect(amount),
      lootBuff: kind => propsRef.current.onLootBuff(kind), aura:amount=>propsRef.current.onAura?.(amount),
      consumeHeal: () => propsRef.current.onConsumeHeal(), activateShield: () => propsRef.current.onActivateShield(), shieldUsed: () => propsRef.current.onShieldUsed(),
      death: () => propsRef.current.onDeath(), consumeSurge:()=>propsRef.current.onConsumeSurge(),
      endlessProgress: progress=>propsRef.current.onEndlessProgress?.(progress),
      levelComplete: level => propsRef.current.onLevelComplete(level), unlockWeapon: tier => propsRef.current.onUnlockWeapon(tier),
    }, { shield: propsRef.current.shieldActive, immortal: propsRef.current.immortal, completedLevel: propsRef.current.completedLevel, weaponTier: propsRef.current.weaponTier,endlessProgress:propsRef.current.endlessProgress,claimedIngredients:propsRef.current.claimedIngredients });
    if(propsRef.current.fromStreet)engine.enterHomeFromStreet();
    if(propsRef.current.fromComputer)engine.enterHomeFromComputer();
    engineRef.current = engine; setView(engine.view());
    return () => { engineRef.current = null; };
  }, []);
  useEffect(()=>{engineRef.current?.setEquipment(props.equipment);},[props.equipment]);
  const wasSuspended=useRef(false);
  useEffect(() => { engineRef.current?.setImmortal(props.immortal); }, [props.immortal]);
  const trainingStep=props.combatTraining?.step??6;
  useEffect(()=>{const e=engineRef.current;if(!e)return;if(view.area==="sewer"&&view.level===1&&view.completedLevel<1){if(!propsRef.current.combatTraining?.kit)propsRef.current.onTrainingKit?.();e.setPracticeStep(trainingStep);}else e.setPracticeStep(-1);},[view.area,view.level,view.completedLevel,trainingStep]);
  const syncInput = useCallback(() => engineRef.current?.setInput(inputRef.current.x, inputRef.current.y, inputRef.current.attack), []);
  const clearInput = useCallback(() => {
    inputRef.current = { x: 0, y: 0, attack: false }; keys.current.clear();
    const id=stickPointer.current;stickPointer.current = attackPointer.current = null;
    if(id!==null&&stickRef.current?.hasPointerCapture(id))stickRef.current.releasePointerCapture(id);
    if (nubRef.current) nubRef.current.style.transform = "translate(0, 0)";
    syncInput();
  }, [syncInput]);
  const stopStick=useCallback(()=>{
    const id=stickPointer.current;
    if(id===null)return;
    stickPointer.current=null;
    inputRef.current.x=0;inputRef.current.y=0;
    if(nubRef.current)nubRef.current.style.transform="translate(0, 0)";
    syncInput();
    if(stickRef.current?.hasPointerCapture(id))stickRef.current.releasePointerCapture(id);
  },[syncInput]);
  useEffect(()=>{
    const unwatch=observeJoystickRelease(window,()=>stickPointer.current,stopStick);
    // Emergency deadline: if Safari silently discards ALL release events, walking
    // must recover automatically rather than locking until the game is restarted.
    const timer=window.setInterval(()=>{if(stickPointer.current!==null&&Date.now()-stickLastActivity.current>12000)stopStick();},500);
    return ()=>{unwatch();window.clearInterval(timer);};
  },[stopStick]);
  useEffect(()=>{if(props.suspended){clearInput();engineRef.current?.pause();}else if(wasSuspended.current)engineRef.current?.resume();wasSuspended.current=!!props.suspended;},[props.suspended,clearInput]);

  const chooseDestination = useCallback((destination: ApartmentDestination) => { clearInput(); engineRef.current?.interactDestination(destination); }, [clearInput]);
  useEffect(() => {
    const engine = engineRef.current, svg = svgRef.current;
    if (!engine || !svg) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let renderer = new AdventureRenderer(svg, motion.matches);
    const cooldowns = new AdventureCooldownPainter();
    const resize = () => { const rect = svg.getBoundingClientRect(); renderer.resize(rect.width, rect.height); renderer.paint(engine, true); };
    const changeMotion = () => { renderer = new AdventureRenderer(svg, motion.matches); resize(); };
    const observer = new ResizeObserver(resize); observer.observe(svg); motion.addEventListener("change", changeMotion); resize();
    let previous = 0, frame = 0;
    const paintLimiter=new FramePaintLimiter();
    runnerFrameRateActive(true);
    const tick = (now: number) => {
      const before = performance.now();
      if (!document.hidden && !preferencesRef.current && !propsRef.current.suspended) { engine.advance(previous ? (now - previous) / 1000 : 0); if(engine.phase!=="opening"&&engine.phase!=="homecoming"&&paintLimiter.due(now,propsRef.current.fpsLimit??60)){renderer.paint(engine); cooldowns.paint(engine,attackButton.current,energyButton.current); runnerFramePainted(now, performance.now() - before);} }
      previous = now; frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); motion.removeEventListener("change", changeMotion); runnerFrameRateActive(false); };
  }, [view.area, view.level, view.endlessSeed,view.arcadeSegment, props.theme]);
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
      if (preferencesRef.current || propsRef.current.suspended || event.ctrlKey || event.metaKey || event.altKey || (event.target as HTMLElement)?.matches("input, textarea, select")) return;
      const engine = engineRef.current;
      if (!engine) return;
      if (event.code === "Escape") { event.preventDefault(); if(mapOpenRef.current){mapOpenRef.current=false;setMapSnapshot(null);engine.resume();}else if (engine.phase === "paused") engine.resume(); else engine.pause(); return; }
      if(event.code==="KeyM"&&!event.repeat&&mapOpenRef.current){event.preventDefault();clearInput();mapOpenRef.current=false;setMapSnapshot(null);engine.resume();return;}
      if(event.code==="KeyM"&&!event.repeat&&(engine.area==="sewer"||engine.area==="apartment"&&engine.expandedHome)&&engine.phase==="playing"){event.preventDefault();clearInput();engine.pause();mapOpenRef.current=true;setMapSnapshot({player:{...engine.player},cleared:[...engine.cleared],gates:engine.levelData.gates.map((_,i)=>engine.gateOpen(i))});return;}
      if (engine.phase !== "playing") return;
      // Space on a focused button keeps its native click behavior.
      if (event.code === "Space" && (event.target as HTMLElement)?.closest("button")) return;
      if (movement.has(event.code) || event.code === "Space" || event.code === "KeyJ") { event.preventDefault(); keys.current.add(event.code); update(); }
      if (!event.repeat && ["ShiftLeft", "ShiftRight", "KeyK"].includes(event.code)) { event.preventDefault(); engine.dodge(); }
      if (!event.repeat && event.code === "KeyE") { event.preventDefault(); engine.interact(); }
      if (!event.repeat && event.code === "KeyH") { event.preventDefault(); engine.heal(); }
      if (!event.repeat && event.code === "KeyF") { event.preventDefault(); engine.activateSurge(); }
      if (!event.repeat && event.code === "KeyQ") { event.preventDefault(); engine.activateEnergyWave(); }
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
    stickLastActivity.current=Date.now();
    if(event.type==="pointermove"&&event.pointerType==="mouse"&&event.buttons===0){stopStick();return;}
    const r = event.currentTarget.getBoundingClientRect(), dx = event.clientX - r.left - r.width / 2, dy = event.clientY - r.top - r.height / 2;
    const distance = Math.hypot(dx, dy), radius = Math.min(r.width * .3, (r.width - 46) / 2 - 4), ratio = Math.max(1, distance / radius);
    inputRef.current.x = distance < 5 ? 0 : dx / ratio / radius; inputRef.current.y = distance < 5 ? 0 : dy / ratio / radius;
    if (nubRef.current) nubRef.current.style.transform = `translate(${dx / ratio}px, ${dy / ratio}px)`;
    syncInput();
  };
  const releaseStick = (event: PointerEvent<HTMLButtonElement>) => {
    if(stickPointer.current!==event.pointerId)return;
    stopStick();
  };
  const releaseAttack = (event: PointerEvent<HTMLButtonElement>) => {
    if (attackPointer.current !== event.pointerId) return;
    attackPointer.current = null; inputRef.current.attack = false; syncInput();
  };
  const pause = () => { clearInput(); engineRef.current?.pause(); };
  const openMap=()=>{pause();const engine=engineRef.current;if(engine){setMapSnapshot({player:{...engine.player},cleared:[...engine.cleared],gates:engine.levelData.gates.map((_,i)=>engine.gateOpen(i))});mapOpenRef.current=true;}};
  const closeMap=()=>{clearInput();setMapSnapshot(null);mapOpenRef.current=false;engineRef.current?.resume();};
  const combat = view.area === "sewer" || view.area === "apartment" && view.total > view.defeated;
  const actionWeapon = view.area === "sewer" ? view.weapon : "fist";
  const areaName = view.arcade?`Аркада · зал ${view.arcadeCleared+view.room+1}`:view.area === "apartment" ? HOME_ROOMS.find(r=>r.id===view.homeRoom)?.name??"Квартира Кнопика" : view.area === "basement" ? "Подвал" : layout.name;
  return <GameModal className={`adventure-game pixel-game theme-${props.theme}${view.cinematic?" cinematic-active":""}`} label="Приключение Кнопика" onDismiss={()=>{if(view.cinematic)return;mapOpenRef.current?closeMap():pause();}}>
    <link rel="preload" as="image" href={SAHUR_ATLAS_URL}/>
    <link rel="preload" as="image" href={SAHUR_GUN_ATLAS_URL}/>
    <div data-world-graphics={props.worldGraphics??"soft"} className={`adventure-layout ${view.area==="apartment"?"is-apartment":""} ${view.phase==="levels"?"is-level-menu":""} ${view.cinematic?"is-opening":""} ${mapOpen?"is-map-open":""}`}>
      <GamePlayHud balance={props.balance} place={areaName} eyebrow={view.area === "sewer" ? view.arcade?"АРКАДА":view.endlessFloor?`БЕЗДНА · ГЛУБИНА ${view.endlessFloor} · ${view.endlessAnomaly.toUpperCase()}`:`ПОДЗЕМЕЛЬЕ · ЗОНА ${view.zone} · ${view.stage}/5` : view.checkpoint < 3 ? "ПОД ДОМОМ" : "ЛИПОВЫЙ КВАРТАЛ · ДОМ"} hp={view.hp} atRisk={combat && !view.shieldReady} objective={view.objective} progress={view.area === "sewer" ? view.arcade?`${view.arcadeCleared+view.clearedRooms} залов`:`${view.tasksDone}/${view.tasksTotal} ✓` : undefined} secondaryActions={(view.area === "sewer"||view.area==="apartment"&&view.checkpoint>=3) && <button className="adventure-pause dungeon-map-button" type="button" disabled={view.phase !== "playing"} aria-label={view.area==="apartment"?"План квартиры · M":"Карта уровня · M"} onClick={openMap}><GameUiIcon kind="map"/></button>}>
        <button className="adventure-pause" type="button" disabled={!["playing", "dialogue"].includes(view.phase)} aria-label="Пауза · Escape" onClick={pause}><GameUiIcon kind="pause"/></button>
      </GamePlayHud>
      <div className="adventure-viewport">
        <AdventureScene key={`${view.area}-${view.level}-${view.endlessSeed}-${view.arcadeSegment}-${props.theme}`} layout={layout} ref={svgRef} area={view.area} theme={props.theme} level={view.level} keepsakes={props.keepsakes} legacyHome={view.checkpoint<2} homeRoom={view.homeRoom} vaultBalance={props.vaultBalance} barDrinks={props.barDrinks} brewing={props.brewing} destinationsDisabled={view.phase !== "playing" || view.area === "apartment" && view.total > view.defeated} onDestination={chooseDestination}/>

        {view.area==="sewer"&&view.level===1&&view.completedLevel<1&&trainingStep<6&&view.phase==="playing"&&props.onTrainingStep&&<AdventureTrainingOverlay clock={engineRef} step={trainingStep} onStep={props.onTrainingStep}/>}
        {view.phase==="playing"&&view.notice&&<div className="dungeon-action-notice" role="status">{view.notice}</div>}
        {mapSnapshot&&<div className="adventure-overlay dungeon-map-overlay">{view.area==="apartment"?<ApartmentMap player={mapSnapshot.player} onClose={closeMap}/>:<DungeonMap layout={layout} view={view} player={mapSnapshot.player} cleared={mapSnapshot.cleared} gates={mapSnapshot.gates} onClose={closeMap}/>}</div>}
        {view.phase === "dialogue" && <div className="adventure-dialogue adventure-card"><strong>{view.speaker}</strong><p>{view.dialogue}</p><button className="adventure-primary" type="button" onClick={() => engineRef.current?.nextDialogue()}>Дальше →</button></div>}
        {view.phase==="levels" && <div className="adventure-overlay"><DungeonCampaignMenu view={view} zone={menuZone} onZone={setMenuZone} onEndless={fresh=>{clearInput();engineRef.current?.startEndless(fresh);}} onArcade={()=>{clearInput();engineRef.current?.startArcade();}} onLevel={id=>{clearInput();engineRef.current?.selectLevel(id);}} onClose={()=>engineRef.current?.closeLevels()}/></div>}
        {view.phase === "paused" && !mapOpen && <div className="adventure-overlay"><section className="adventure-card adventure-pause-card"><small>KNOPIK GO</small><h2>Пауза</h2><button className="adventure-primary" type="button" onClick={() => engineRef.current?.resume()}>Продолжить</button><PauseSettingsButton className="adventure-secondary"/><button className="adventure-secondary" type="button" onClick={() => { if(view.cinematic){engineRef.current?.resume();engineRef.current?.skipOpening();}else engineRef.current?.exitToApartment(); }}>{view.cinematic ? "Пропустить вступление" : "Выйти в квартиру"}</button></section></div>}
        {view.phase === "dead" && <div className="adventure-overlay"><section className="adventure-card"><AdventureHeart filled={false}/><h2>Кнопик, вставай!</h2><p>{view.arcade?"Тренировка окончена":"Активный баланс сгорел."}</p><div className="adventure-death-loss">−{view.lostCoins.toLocaleString("ru-RU")} <small>KC</small></div><p className="adventure-death-tip">Деньги в сейфе и запас предметов сохранены.<br/>Щит спасёт от следующей гибели.</p><button className="adventure-primary" type="button" onClick={() => engineRef.current?.restart()}>Начать уровень заново</button></section></div>}
        {view.phase==="won"&&view.endlessFloor>0&&<div className="adventure-overlay"><EndlessCamp view={view} onContinue={choice=>{clearInput();engineRef.current?.continueEndless(choice);}} onHome={()=>engineRef.current?.returnHome()}/></div>}
        {combat && view.phase==="playing" && !mapOpen && <div className="adventure-toolbelt" aria-label="Оружие и предметы">
        {view.area === "sewer" && <AdventureWeaponPicker ref={weaponsRef} phase={view.phase} weapon={view.weapon} weaponTier={view.weaponTier} onSelect={weapon => engineRef.current?.selectWeapon(weapon)}/>}
        <div className="adventure-supplies-line"><AdventureSupplies surgeCount={props.surgeCount} surgeSeconds={view.surgeSeconds} onSurge={()=>engineRef.current?.activateSurge()} phase={view.phase} healCount={props.healCount} shieldCount={props.shieldCount} canHeal={view.canHeal} shieldReady={view.shieldReady} onHeal={() => engineRef.current?.heal()} onShield={() => engineRef.current?.activateShield()}/>
          {props.equipment.accessory==="cape"&&<AdventureEnergyButton ref={energyButton} disabled={view.phase!=="playing"||!view.energyReady} onActivate={()=>engineRef.current?.activateEnergyWave()}/>}</div>
        </div>}
      </div>
      <footer data-training-step={view.area==="sewer"&&view.level===1&&view.completedLevel<1&&trainingStep<6?trainingStep:undefined} className={`adventure-controls ${combat ? "has-combat" : ""}`} aria-label="Управление Кнопиком">
        <div className="adventure-controller-row">
        <GameMovementStick stickRef={stickRef} nubRef={nubRef} disabled={view.phase !== "playing"} onDown={event => {
          if(event.button!==0)return;
          // New touch can recover if Safari stranded the previous pointer.
          if(stickPointer.current!==null&&stickPointer.current!==event.pointerId)stopStick();
          if(stickPointer.current!==null)return;
          event.preventDefault();stickPointer.current=event.pointerId;stickLastActivity.current=Date.now();
          try{event.currentTarget.setPointerCapture(event.pointerId);}catch{/* Window release guard remains active. */}
          moveStick(event);
        }} onMove={moveStick} onRelease={releaseStick}/>
        <div className="adventure-actions"><button className="adventure-interact" type="button" disabled={view.phase !== "playing" || !view.interaction} onClick={() => engineRef.current?.interact()}>{view.interaction || "Действие · E"}</button>{view.canFinish ? <button className="adventure-primary adventure-finish" type="button" onClick={() => { clearInput(); engineRef.current?.finishLevel(); }}>Завершить ✓</button> : <div className="adventure-combat-buttons">
          <AdventureDodgeButton disabled={view.phase !== "playing" || !view.dodgeReady} ready={view.dodgeReady} onDodge={() => engineRef.current?.dodge()}/>
          <button ref={attackButton} className="adventure-attack adventure-cooldown-button" type="button" disabled={view.phase !== "playing"} aria-label="Атака · J или Пробел" onPointerDown={event => { if (attackPointer.current !== null || event.button !== 0) return; event.preventDefault(); attackPointer.current = event.pointerId; event.currentTarget.setPointerCapture(event.pointerId); inputRef.current.attack = true; syncInput(); }} onPointerUp={releaseAttack} onPointerCancel={releaseAttack} onLostPointerCapture={releaseAttack} onClick={event => { if (event.detail === 0) { engineRef.current?.setInput(0, 0, true); engineRef.current?.advance(1 / 60); engineRef.current?.setInput(inputRef.current.x, inputRef.current.y, false); } }}><span className="adventure-cooldown-fill" data-cooldown-fill="" aria-hidden="true"/><AdventureWeaponArt weapon={actionWeapon} icon/><small>{actionWeapon==="sabre"?"Взмах":actionWeapon==="fist"?"Удар":actionWeapon==="arc"?"Разряд":"Выстрел"}</small></button>
        </div>}</div>
        </div>
      </footer>

    </div>
    {!view.cinematic&&view.phase!=="homecoming"&&<div key={`${view.area}-${view.level}`} className="adventure-arrival" aria-hidden="true"/>}
    {view.phase==="homecoming"&&<AdventureHomecomingCinema clock={engineRef}/>}
    {view.cinematic && <AdventureOpeningCinema clock={engineRef} theme={props.theme}/>}
  </GameModal>;
}
