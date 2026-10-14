"use client";
import { useCallback, useEffect, useId, useRef, useState, type PointerEvent } from "react";
import { GamePlayHud } from "./game-play-hud";
import { GameMovementStick } from "./game-movement-stick";
import { GameUiIcon } from "./game-ui-icon";
import { AdventureDodgeButton } from "./adventure-dodge-button";
import { GameModal } from "./game-modal";
import { NeighborhoodEngine, type NeighborhoodView } from "./neighborhood-engine";
import { NeighborhoodScene, NeighborhoodRenderer } from "./neighborhood-artwork";
import { DistrictMap } from "./neighborhood-map-art";
import { NeighborhoodJournal } from "./neighborhood-journal";
import type { NeighborhoodProgress } from "./neighborhood-progress";
import type { ThemeId } from "./cosmetic-engine";
import { runnerFramePainted, runnerFrameRateActive } from "./frame-rate";
type Props={balance:number;onDodgeSound:()=>void;theme:ThemeId;progress:NeighborhoodProgress;suspended:boolean;onProgress:(value:NeighborhoodProgress)=>void;onHome:()=>void;onRun:()=>void;onSound:()=>void};
const silent={change(){},progress(){},home(){},run(){},sound(){}};
export function NeighborhoodGame(props:Props){
  const prefix=`neighborhood-${useId().replaceAll(":","")}`,night=props.theme==="night";
  const propsRef=useRef(props),engineRef=useRef<NeighborhoodEngine|null>(null),svgRef=useRef<SVGSVGElement>(null),nubRef=useRef<SVGSVGElement>(null),mapPlayerRef=useRef<SVGCircleElement>(null),pointer=useRef<number|null>(null),keys=useRef(new Set<string>());
  const [view,setView]=useState<NeighborhoodView>(()=>new NeighborhoodEngine(props.progress,silent).view());
  const [mapOpen,setMapOpen]=useState(false);
  const [mapOrigin,setMapOrigin]=useState({x:410,y:655});
  const [journalOpen,setJournalOpen]=useState(false);
  useEffect(()=>{propsRef.current=props;},[props]);
  useEffect(()=>{
    const engine=new NeighborhoodEngine(propsRef.current.progress,{change:setView,progress:p=>propsRef.current.onProgress(p),home:()=>propsRef.current.onHome(),run:()=>propsRef.current.onRun(),sound:()=>propsRef.current.onSound(),dodgeSound:()=>propsRef.current.onDodgeSound()});engineRef.current=engine;engine.beginVisit();setView(engine.view());return()=>{engine.clearInput();engineRef.current=null;};
  },[]);
  const clear=useCallback(()=>{engineRef.current?.clearInput();pointer.current=null;keys.current.clear();if(nubRef.current)nubRef.current.style.transform="translate(0,0)";},[]);
  const pause=useCallback(()=>{clear();engineRef.current?.pause();},[clear]);
  const resume=()=>{clear();engineRef.current?.resume();};
  useEffect(()=>{clear();if(props.suspended)engineRef.current?.pause();else engineRef.current?.resume();},[props.suspended,clear]);
  useEffect(()=>{
    const engine=engineRef.current,svg=svgRef.current;if(!engine||!svg||props.suspended)return;
    const motion=window.matchMedia("(prefers-reduced-motion: reduce)");let renderer=new NeighborhoodRenderer(svg,night,motion.matches);
    const resize=()=>{const r=svg.getBoundingClientRect();renderer.resize(r.width,r.height);renderer.paint(engine,true);clear();};
    const change=()=>{renderer=new NeighborhoodRenderer(svg,night,motion.matches);resize();};
    const observer=new ResizeObserver(resize);observer.observe(svg);motion.addEventListener("change",change);resize();
    let previous=0,frame=0;runnerFrameRateActive(true);
    const tick=(now:number)=>{const before=performance.now();if(!document.hidden){engine.advance(previous?(now-previous)/1000:0);renderer.paint(engine);if(mapPlayerRef.current){mapPlayerRef.current.setAttribute("cx",engine.player.x.toFixed(1));mapPlayerRef.current.setAttribute("cy",engine.player.y.toFixed(1));}runnerFramePainted(now,performance.now()-before);}previous=now;frame=requestAnimationFrame(tick);};
    frame=requestAnimationFrame(tick);return()=>{cancelAnimationFrame(frame);observer.disconnect();motion.removeEventListener("change",change);runnerFrameRateActive(false);};
  },[night,props.suspended,clear]);
  useEffect(()=>{
    const movements=new Set(["KeyW","KeyA","KeyS","KeyD","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"]);
    const update=()=>{const k=keys.current;engineRef.current?.setInput(Number(k.has("KeyD")||k.has("ArrowRight"))-Number(k.has("KeyA")||k.has("ArrowLeft")),Number(k.has("KeyS")||k.has("ArrowDown"))-Number(k.has("KeyW")||k.has("ArrowUp")));};
    const down=(e:KeyboardEvent)=>{if(propsRef.current.suspended||e.ctrlKey||e.metaKey||e.altKey||(e.target as HTMLElement)?.matches("input,textarea,select"))return;const engine=engineRef.current;if(!engine)return;
      if(e.code==="Escape")return;
      if(engine.paused||engine.view().dialogue)return;
      if(movements.has(e.code)){e.preventDefault();keys.current.add(e.code);update();}
      if(["ShiftLeft","ShiftRight","KeyK"].includes(e.code)&&!e.repeat){e.preventDefault();engine.dodge();}
      if(e.code==="KeyE"&&!e.repeat){e.preventDefault();clear();engine.interact();}
    };
    const up=(e:KeyboardEvent)=>{if(keys.current.delete(e.code)){e.preventDefault();update();}};
    const blur=()=>{if(!propsRef.current.suspended)pause();else clear();};const hidden=()=>{if(document.hidden)blur();};
    window.addEventListener("keydown",down);window.addEventListener("keyup",up);window.addEventListener("blur",blur);document.addEventListener("visibilitychange",hidden);
    return()=>{window.removeEventListener("keydown",down);window.removeEventListener("keyup",up);window.removeEventListener("blur",blur);document.removeEventListener("visibilitychange",hidden);clear();};
  },[clear,pause]);
  const disabled=props.suspended||view.paused||!!view.dialogue||mapOpen||journalOpen;
  const move=(e:PointerEvent<HTMLButtonElement>)=>{if(pointer.current!==e.pointerId||disabled)return;const r=e.currentTarget.getBoundingClientRect(),x=e.clientX-r.left-r.width/2,y=e.clientY-r.top-r.height/2,n=Math.hypot(x,y),radius=Math.min(r.width*.3,(r.width-46)/2-4),f=Math.max(1,n/radius);engineRef.current?.setInput(n<5?0:x/f/radius,n<5?0:y/f/radius);if(nubRef.current)nubRef.current.style.transform=`translate(${x/f}px,${y/f}px)`;};
  const release=(e:PointerEvent<HTMLButtonElement>)=>{if(pointer.current!==e.pointerId)return;clear();if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);};
  const openMap=()=>{pause();const player=engineRef.current?.player;if(player)setMapOrigin({x:player.x,y:player.y});setJournalOpen(false);setMapOpen(true);};const closeMap=()=>{setMapOpen(false);resume();};
  const openJournal=()=>{pause();setMapOpen(false);setJournalOpen(true);};const closeJournal=()=>{setJournalOpen(false);resume();};
  return <GameModal className={`adventure-game neighborhood-game pixel-game theme-${props.theme} ${night?"is-night":""} ${props.suspended?"is-suspended":""}`} label="Прогулка по району Кнопика" onDismiss={()=>{if(propsRef.current.suspended)return;if(journalOpen)closeJournal();else if(mapOpen)closeMap();else if(view.dialogue){clear();engineRef.current?.closeDialogue();}else if(view.paused)resume();else pause();}}>
    <div className={`neighborhood-layout adventure-layout ${mapOpen?"is-map-open":""}`} data-paused={view.paused?"true":"false"}>
      <GamePlayHud place={view.zone} eyebrow="ЛИПОВЫЙ КВАРТАЛ" hp={3} balance={props.balance} objective={view.objective !== "Гуляй, исследуй и возвращайся домой" ? <button className="street-mission-link" type="button" onClick={openJournal}>{view.objective}</button> : undefined}>
        <button type="button" className="adventure-pause" onClick={openMap} disabled={props.suspended} aria-label="Открыть карту района"><GameUiIcon kind="map"/></button>
        <button type="button" className="adventure-pause neighborhood-journal-button" onClick={openJournal} disabled={props.suspended} aria-label="Открыть журнал заданий"><GameUiIcon kind="journal"/>{view.missions.some(m=>m.status===0)&&<b className="neighborhood-journal-new" aria-hidden="true">!</b>}</button>
        <button type="button" className="adventure-pause" onClick={pause} disabled={props.suspended} aria-label="Пауза"><GameUiIcon kind="pause"/></button>
      </GamePlayHud>
      <div className="neighborhood-viewport">
        <NeighborhoodScene key={night?"night":"day"} ref={svgRef} prefix={prefix} night={night}/>
        {view.dialogue&&<section className="neighborhood-dialogue" aria-label={view.speaker}><small>{view.speaker}</small><p>{view.dialogue}</p><button type="button" className="neighborhood-primary" autoFocus onClick={()=>{clear();engineRef.current?.closeDialogue();}}>Хорошо</button></section>}
        {mapOpen&&<div className="neighborhood-overlay"><section className="neighborhood-card neighborhood-map-card atlas-card"><header className="atlas-heading"><div><small>КАРТА РАЙОНА</small><h2>Липовый квартал</h2></div><span className="atlas-counter">{night?"НОЧЬ":"ДЕНЬ"}</span></header><div className="atlas-canvas"><DistrictMap night={night} player={mapOrigin} playerRef={mapPlayerRef} goal={view.goal}/></div><div className="atlas-legend"><span><i className="atlas-you"/>Вы здесь</span><span><i className="atlas-goal"/>Цель</span><span><i className="atlas-home"/>Ваш дом</span></div><p className="atlas-objective">{view.objective}</p><button type="button" className="neighborhood-primary" autoFocus onClick={closeMap}>Продолжить прогулку</button></section></div>}
        {journalOpen&&<div className="neighborhood-overlay"><NeighborhoodJournal missions={view.missions} badgeQuest={view.badgeQuest} onBadge={()=>{clear();engineRef.current?.trackBadge();engineRef.current?.closeDialogue();closeJournal();}} onClose={closeJournal} onTrack={id=>{clear();engineRef.current?.trackMission(id);engineRef.current?.closeDialogue();closeJournal();}}/></div>}
        {view.photoSerial>0&&<div key={view.photoSerial} className="neighborhood-photo-flash" aria-hidden="true"/>}
        {view.paused&&!mapOpen&&!journalOpen&&!props.suspended&&<div className="neighborhood-overlay"><section className="neighborhood-card"><small>{night?"ГОРОД СПИТ":"МОЖНО НЕ СПЕШИТЬ"}</small><h2>Переведи дух</h2><button type="button" className="neighborhood-primary" autoFocus onClick={resume}>Продолжить прогулку</button><button type="button" onClick={openMap}>Карта района</button><button type="button" onClick={openJournal}>Задания квартала</button><button type="button" onClick={()=>{clear();props.onHome();}}>Вернуться в квартиру</button></section></div>}
      </div>
      <footer className="adventure-controls neighborhood-controls" aria-label="Управление Кнопиком">
        <div className="adventure-controller-row">
          <GameMovementStick nubRef={nubRef} disabled={disabled} onDown={e=>{if(pointer.current!==null||disabled||e.button!==0)return;e.preventDefault();pointer.current=e.pointerId;e.currentTarget.setPointerCapture(e.pointerId);move(e);}} onMove={move} onRelease={release}/>
          <div className="adventure-actions">
            <div className="street-context" role="status">{view.working ? view.workLabel : view.interaction || "Действие · E"}</div>
            {view.working&&<progress className="neighborhood-work-progress" aria-label={view.workLabel} max="100" value={view.workProgress}/>}
            <div className="adventure-combat-buttons">
              <AdventureDodgeButton disabled={disabled||!view.dodgeReady} ready={view.dodgeReady} onDodge={()=>engineRef.current?.dodge()}/>
              <button className="adventure-attack street-action" type="button" disabled={disabled||!view.interaction||view.working} aria-label={view.interaction||"Действие · E"} onPointerDown={e=>{if(disabled||!view.interaction||view.working||e.button!==0)return;e.preventDefault();clear();engineRef.current?.interact();}} onClick={e=>{if(e.detail===0){clear();engineRef.current?.interact();}}}><GameUiIcon kind="interact"/><small>Действие</small></button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  </GameModal>;
}
