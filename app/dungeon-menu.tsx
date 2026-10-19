import {useEffect,useRef,useState,type CSSProperties} from "react";
import {WorldMapCard} from "./world-map-card";
import {DungeonGuide} from "./hunter-bestiary";
import {EndlessEntry} from "./endless-menu";
import {DungeonMapArt} from "./dungeon-map-art";
import {DungeonZoneBackdrop} from "./dungeon-zone-art";
import {DungeonStatusIcon} from "./dungeon-status-icon";
import {ADVENTURE_LEVELS,DUNGEON_ZONES,type AdventureLevel} from "./adventure-levels";
import type {AdventureView} from "./adventure-engine";
import type {SahurKind} from "./sahur-journal";
import type {WeaponUpgrades} from "./weapon-progression";
import type {KnopikSkin} from "./knopik-skins";
function Chevron({back=false}:{back?:boolean}){return <svg viewBox="0 0 24 24" aria-hidden="true" shapeRendering="crispEdges" style={back?{transform:'scaleX(-1)'}:undefined}><path d="M7 3h4v4h4v4h4v2h-4v4h-4v4H7v-4h4v-4h4v-2h-4V7H7Z" fill="currentColor"/></svg>;}
export function DungeonArcadePage({view,onStart,onEndless}:{view:AdventureView;onStart?:()=>void;onEndless?:(fresh:boolean)=>void}){
 return <div className="dungeon-mode-scroll"><article className="dungeon-training-entry"><small>БОЕВАЯ ТРЕНИРОВКА</small><h3>Аркада</h3><p>Бесконечные залы, новые схемы и бой. Здесь можно отработать оружие и перекаты.</p><p className="dungeon-mode-note">Без KC и добычи. Прогресс кампании сохраняется.</p><button type="button" disabled={!onStart} onClick={onStart}>Начать тренировку →</button></article>{view.completedLevel>=25&&onEndless?<EndlessEntry view={view} onStart={onEndless}/>:<article className="dungeon-abyss-locked"><small>СЛЕДУЮЩАЯ ЦЕЛЬ</small><h3>Бездна</h3><p>Откроется после 25-го уровня кампании.</p></article>}</div>;
}
export function DungeonCampaignMenu({view,zone,onZone,onLevel,onClose,onEndless,onArcade,seenSahurs=[],upgrades,skin}:{view:AdventureView;zone:number;onZone:(zone:number)=>void;onLevel:(id:number)=>void;onClose:()=>void;onEndless?:(fresh:boolean)=>void;onArcade?:()=>void;seenSahurs?:readonly SahurKind[];upgrades?:WeaponUpgrades;skin?:KnopikSkin}){
 const [mode,setMode]=useState<'campaign'|'arcade'|'guide'>('campaign');
 const rail=useRef<HTMLDivElement>(null),initial=useRef(true),activeZone=useRef(zone),scrollingTo=useRef<number|null>(null);
 useEffect(()=>{activeZone.current=zone;},[zone]);
 useEffect(()=>{
  const el=rail.current;if(!el)return;
  const left=(zone-1)*el.clientWidth,first=initial.current;initial.current=false;
  if(first||Math.abs(el.scrollLeft-left)>el.clientWidth*.55){scrollingTo.current=zone;el.scrollTo({left,behavior:first||window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});}
 },[zone,mode]);
 useEffect(()=>{const el=rail.current;if(!el)return;const observer=new ResizeObserver(()=>el.scrollTo({left:(activeZone.current-1)*el.clientWidth,behavior:'auto'}));observer.observe(el);return()=>observer.disconnect();},[mode]);
 const changeZone=(n:number)=>onZone(Math.max(1,Math.min(7,n)));
 const back=()=>{if(mode==='campaign')onClose();else{initial.current=true;setMode('campaign');}};
 return <section className="dungeon-expedition" data-expedition-mode={mode} aria-label="Подземелье: семь зон по пять уровней">
  <header className="expedition-header"><div className="expedition-heading"><span>{mode==='guide'?'Справочник':`KNOPIK GO / ${mode==='campaign'?'ПОДЗЕМЕЛЬЕ':'РЕЖИМЫ'}`}</span><button type="button" className="expedition-close" aria-label={mode==='campaign'?'Выйти в квартиру':'Вернуться к зонам'} onClick={back}><svg viewBox="0 0 20 20" aria-hidden="true" shapeRendering="crispEdges"><path d="M2 2h4v4H2Zm4 4h4v4H6Zm4 4h4v4h-4Zm4 4h4v4h-4ZM14 2h4v4h-4Zm-4 4h4v4h-4Zm-4 4h4v4H6Zm-4 4h4v4H2Z" fill="currentColor"/></svg></button></div>{mode!=='guide'&&<nav className="expedition-top-actions" aria-label="Режимы и справочник"><button type="button" aria-pressed={mode==='arcade'} onClick={()=>{initial.current=true;setMode(mode==='arcade'?'campaign':'arcade');}}>Аркада</button><button type="button" aria-pressed={false} onClick={()=>{initial.current=true;setMode('guide');}}>Справочник</button></nav>}</header>
  {mode==='campaign'?<div ref={rail} className="zone-carousel" tabIndex={0} aria-label="Листай зоны слева направо" onKeyDown={e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();changeZone(zone+(e.key==='ArrowRight'?1:-1));}}} onPointerDown={()=>{scrollingTo.current=null;}} onWheel={()=>{scrollingTo.current=null;}} onScroll={e=>{const el=e.currentTarget;if(!el.clientWidth)return;if(scrollingTo.current!==null){if(Math.abs(el.scrollLeft-(scrollingTo.current-1)*el.clientWidth)>2)return;scrollingTo.current=null;}const page=Math.max(1,Math.min(7,Math.round(el.scrollLeft/el.clientWidth)+1));if(page!==zone)onZone(page);}}>
   {DUNGEON_ZONES.map(z=>{const completed=Math.max(0,Math.min(5,view.completedLevel-(z.id-1)*5)),locked=view.completedLevel<(z.id-1)*5;return <article key={z.id} className="zone-slide" inert={zone!==z.id} aria-hidden={zone!==z.id} data-zone={z.id} aria-label={`Зона ${z.id}: ${z.name}`} style={{'--zone-accent':z.palette.accent,'--zone-dark':z.palette.dark,'--zone-light':z.palette.light} as CSSProperties}>
    <DungeonZoneBackdrop zone={z.id}/><div className="zone-heading"><small>ЗОНА {z.id} / 7 <span>{completed}/5</span></small><h2>{z.name}</h2><p>{z.subtitle}</p>{locked&&<b className="zone-lock-copy">После уровня {(z.id-1)*5}</b>}</div>
    <div className="zone-route" aria-label={`Пять уровней зоны ${z.id}`}>{ADVENTURE_LEVELS.filter(l=>l.zone===z.id).map(level=>{const state=level.id<=view.completedLevel?'done':level.id===view.completedLevel+1?'next':'locked';return <button key={level.id} type="button" className="zone-level" data-route-state={state} data-level={level.id} disabled={state!=='next'} onClick={()=>onLevel(level.id)}><b>{level.stage}</b><span><strong>{level.name}</strong><small>{state==='done'?'Пройден':state==='locked'?`После ${level.id-1}-го уровня`:level.id<=2?'Бой лапами · начать':level.feature}</small></span><i aria-hidden="true"><DungeonStatusIcon state={state}/></i></button>;})}</div>
   </article>;})}
  </div>:mode==='arcade'?<DungeonArcadePage view={view} onStart={onArcade} onEndless={onEndless}/>:<DungeonGuide seenSahurs={seenSahurs} weaponTier={view.weaponTier} upgrades={upgrades} skin={skin}/>}
  <footer className="expedition-footer">{mode==='campaign'?<><button type="button" className="zone-previous" aria-label="Предыдущая зона" disabled={zone===1} onClick={()=>changeZone(zone-1)}><Chevron back/></button><div className="zone-pagination"><span>ЗОНА {zone} ИЗ 7</span><nav aria-label="Выбрать зону">{DUNGEON_ZONES.map(z=><button key={z.id} type="button" aria-label={`Зона ${z.id}: ${z.name}`} aria-current={zone===z.id?'page':undefined} onClick={()=>changeZone(z.id)}><i/></button>)}</nav></div><button type="button" className="zone-next" aria-label="Следующая зона" disabled={zone===7} onClick={()=>changeZone(zone+1)}><Chevron/></button></>:<button type="button" className="expedition-back" onClick={back}>← К зонам подземелья</button>}</footer>
 </section>;
}

export function DungeonMap({view,player,partner,cleared,gates,onClose,layout}:{view:AdventureView;partner?:{x:number;y:number;name:string};player:{x:number;y:number;angle?:number};cleared:boolean[];gates:boolean[];onClose:()=>void;layout?:AdventureLevel}){
  const level=layout??ADVENTURE_LEVELS[view.level-1], [selected,setSelected]=useState(view.room);
  const selectedRoom=Math.max(0,Math.min(level.rooms.length-1,selected));
  return <WorldMapCard title={level.name} subtitle={view.endlessFloor?`БЕЗДНА · ГЛУБИНА ${view.endlessFloor}`:`КАРТА УРОВНЯ · ${view.zone}.${view.stage}`} objective={view.objective} detail={`Зал ${selectedRoom+1} · ${level.roomNames[selectedRoom]}`} counter={`${cleared.filter(Boolean).length}/${level.rooms.length} пройдено`} onClose={onClose} legend={<><span><i className="atlas-you"/>Вы</span>{partner&&<span><i className="atlas-clear"/>Напарник</span>}<span><i className="atlas-goal"/>Задание</span><span><i className="atlas-exit"/>Выход</span></>}>
   <DungeonMapArt level={level} view={view} player={player} partner={partner} cleared={cleared} gates={gates} selectedRoom={selectedRoom} onSelectRoom={setSelected}/>
  </WorldMapCard>;
}
