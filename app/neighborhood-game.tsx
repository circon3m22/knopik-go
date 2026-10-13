"use client";
import { useCallback, useEffect, useId, useRef, useState, type PointerEvent } from "react";
import { GameModal } from "./game-modal";
import { NeighborhoodEngine, type NeighborhoodView } from "./neighborhood-engine";
import { NeighborhoodScene, NeighborhoodRenderer } from "./neighborhood-artwork";
import { NEIGHBORHOOD_BUILDINGS } from "./neighborhood-map";
import type { NeighborhoodProgress } from "./neighborhood-progress";
import type { ThemeId } from "./cosmetic-engine";
import { runnerFramePainted, runnerFrameRateActive } from "./frame-rate";
type Props={theme:ThemeId;progress:NeighborhoodProgress;suspended:boolean;onProgress:(value:NeighborhoodProgress)=>void;onHome:()=>void;onRun:()=>void;onSound:()=>void};
const silent={change(){},progress(){},home(){},run(){},sound(){}};
function DistrictMap({playerRef,night}:{playerRef:React.RefObject<SVGCircleElement|null>;night:boolean}){
  return <svg className="neighborhood-map" viewBox="0 0 2400 2050" role="img" aria-label="Карта района. Дом на северо-западе, парк на северо-востоке, река на юге">
    <rect width="2400" height="2050" fill={night?"#354c50":"#b6bb97"}/><rect x="1170" y="240" width="990" height="565" fill={night?"#3e5d55":"#88a980"}/><path d="M340 580h140v1080H340Zm1720 225h110v855h-110ZM320 1540h1880v141H320ZM0 790h2400v240H0Z" fill={night?"#657077":"#d8c6a4"}/><path d="M0 845h2400v135H0Z" fill="#746875"/><path d="M1350 800V628h90v-80h90V470h138v85h272v185h-100V645h-262v25h-110v130Z" fill="#ece3ca"/><rect y="1715" width="2400" height="335" fill="#88b6b0"/>
    {NEIGHBORHOOD_BUILDINGS.map(b=><rect key={b.id} x={b.x} y={b.y-b.h!} width={b.w} height={b.h} fill={b.home?"#be8471":"#775442"} stroke="#343041" strokeWidth="10"/>)}
    <g fill="#343041" fontSize="74" textAnchor="middle"><text x="410" y="690">ТВОЙ ДОМ</text><text x="1660" y="370">ПАРК</text><text x="1250" y="1630">НАБЕРЕЖНАЯ</text><text x="1240" y="1920">РЕКА</text><text x="2250" y="780">RUN</text></g>
    <circle ref={playerRef} cx="410" cy="655" r="38" fill="#fff1d1" stroke="#343041" strokeWidth="15"/>
  </svg>;
}
export function NeighborhoodGame(props:Props){
  const prefix=`neighborhood-${useId().replaceAll(":","")}`,night=props.theme==="night";
  const propsRef=useRef(props),engineRef=useRef<NeighborhoodEngine|null>(null),svgRef=useRef<SVGSVGElement>(null),nubRef=useRef<HTMLSpanElement>(null),mapPlayerRef=useRef<SVGCircleElement>(null),pointer=useRef<number|null>(null),keys=useRef(new Set<string>());
  const [view,setView]=useState<NeighborhoodView>(()=>new NeighborhoodEngine(props.progress,silent).view());
  const [mapOpen,setMapOpen]=useState(false);
  useEffect(()=>{propsRef.current=props;},[props]);
  useEffect(()=>{
    const engine=new NeighborhoodEngine(propsRef.current.progress,{change:setView,progress:p=>propsRef.current.onProgress(p),home:()=>propsRef.current.onHome(),run:()=>propsRef.current.onRun(),sound:()=>propsRef.current.onSound()});engineRef.current=engine;setView(engine.view());return()=>{engine.clearInput();engineRef.current=null;};
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
      if(e.code==="KeyE"&&!e.repeat){e.preventDefault();clear();engine.interact();}
    };
    const up=(e:KeyboardEvent)=>{if(keys.current.delete(e.code)){e.preventDefault();update();}};
    const blur=()=>{if(!propsRef.current.suspended)pause();else clear();};const hidden=()=>{if(document.hidden)blur();};
    window.addEventListener("keydown",down);window.addEventListener("keyup",up);window.addEventListener("blur",blur);document.addEventListener("visibilitychange",hidden);
    return()=>{window.removeEventListener("keydown",down);window.removeEventListener("keyup",up);window.removeEventListener("blur",blur);document.removeEventListener("visibilitychange",hidden);clear();};
  },[clear,pause]);
  const disabled=props.suspended||view.paused||!!view.dialogue||mapOpen;
  const move=(e:PointerEvent<HTMLButtonElement>)=>{if(pointer.current!==e.pointerId||disabled)return;const r=e.currentTarget.getBoundingClientRect(),x=e.clientX-r.left-r.width/2,y=e.clientY-r.top-r.height/2,n=Math.hypot(x,y),radius=r.width*.3,f=Math.max(1,n/radius);engineRef.current?.setInput(n<5?0:x/f/radius,n<5?0:y/f/radius);if(nubRef.current)nubRef.current.style.transform=`translate(${x/f}px,${y/f}px)`;};
  const release=(e:PointerEvent<HTMLButtonElement>)=>{if(pointer.current!==e.pointerId)return;clear();if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);};
  const openMap=()=>{pause();setMapOpen(true);};const closeMap=()=>{setMapOpen(false);resume();};
  return <GameModal className={`neighborhood-game pixel-game ${night?"is-night":""} ${props.suspended?"is-suspended":""}`} label="Прогулка по району Кнопика" onDismiss={()=>{if(propsRef.current.suspended)return;if(mapOpen)closeMap();else if(view.dialogue){clear();engineRef.current?.closeDialogue();}else if(view.paused)resume();else pause();}}>
    <div className="neighborhood-layout">
      <header className="neighborhood-hud"><button type="button" className="neighborhood-square" onClick={openMap} disabled={props.suspended} aria-label="Открыть карту района"><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M3 5h8l10-3 8 3v23h-8l-10 3-8-3Zm4 4v16l4 2V9Zm8 0v17l6-2V7Zm10-2v17h1V8Z" fill="currentColor"/></svg></button><div><small>{night?"НОЧНАЯ ПРОГУЛКА":"НАШ КВАРТАЛ"}</small><strong>{view.zone}</strong></div><button type="button" className="neighborhood-square" onClick={pause} disabled={props.suspended} aria-label="Пауза"><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M8 5h6v22H8Zm10 0h6v22h-6Z" fill="currentColor"/></svg></button></header>
      <div className="neighborhood-viewport">
        <NeighborhoodScene key={night?"night":"day"} ref={svgRef} prefix={prefix} night={night}/>
        {view.objective!=="Гуляй, исследуй и возвращайся домой"&&<p className="neighborhood-objective" role="status">{view.objective}</p>}
        {view.dialogue&&<section className="neighborhood-dialogue" aria-label={view.speaker}><small>{view.speaker}</small><p>{view.dialogue}</p><button type="button" className="neighborhood-primary" autoFocus onClick={()=>{clear();engineRef.current?.closeDialogue();}}>Хорошо</button></section>}
        {mapOpen&&<div className="neighborhood-overlay"><section className="neighborhood-card neighborhood-map-card"><small>ЛИПОВЫЙ КВАРТАЛ</small><h2>Знакомые места</h2><DistrictMap night={night} playerRef={mapPlayerRef}/><p>Светлая точка — Кнопик.<br/>К реке ведут парк и проход слева от дома.</p><button type="button" className="neighborhood-primary" autoFocus onClick={closeMap}>Продолжить прогулку</button></section></div>}
        {view.paused&&!mapOpen&&!props.suspended&&<div className="neighborhood-overlay"><section className="neighborhood-card"><small>{night?"ГОРОД СПИТ":"МОЖНО НЕ СПЕШИТЬ"}</small><h2>Переведи дух</h2><button type="button" className="neighborhood-primary" autoFocus onClick={resume}>Продолжить прогулку</button><button type="button" onClick={openMap}>Карта района</button><button type="button" onClick={()=>{clear();props.onHome();}}>Вернуться в квартиру</button></section></div>}
      </div>
      <footer className="neighborhood-controls"><div className="neighborhood-stick-wrap"><button className="neighborhood-stick" type="button" aria-label="Джойстик. Движение: WASD или стрелки" disabled={disabled} onPointerDown={e=>{if(pointer.current!==null||disabled)return;e.preventDefault();pointer.current=e.pointerId;e.currentTarget.setPointerCapture(e.pointerId);move(e);}} onPointerMove={move} onPointerUp={release} onPointerCancel={release} onLostPointerCapture={release}><svg viewBox="0 0 100 100" aria-hidden="true"><path d="M44 12h12v26h-12Zm0 50h12v26H44ZM12 44h26v12H12Zm50 0h26v12H62Z" fill="currentColor"/></svg><span ref={nubRef}/></button><small>Движение</small></div><div className="neighborhood-context"><button className="neighborhood-primary" type="button" disabled={disabled||!view.interaction} onClick={()=>{clear();engineRef.current?.interact();}}>{view.interaction||"Подойди к интересному месту"}</button><small>{view.seated?"Потяни джойстик, чтобы встать":"Взаимодействие · E"}</small></div></footer>
    </div>
  </GameModal>;
}
