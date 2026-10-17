import {HunterBestiary} from "./hunter-bestiary";
import { EndlessEntry } from "./endless-menu";
import { DungeonMapArt } from "./dungeon-map-art";
import { ADVENTURE_LEVELS, ADVENTURE_WEAPONS, DUNGEON_ZONES, dungeonZone,type AdventureLevel } from "./adventure-levels";
import { AdventureWeaponArt } from "./adventure-level-art";
import type { AdventureView } from "./adventure-engine";
function ArcadeEntry({onStart}:{onStart:()=>void}){
 return <button className="arcade-mode-entry" type="button" onClick={onStart}>
  <svg className="arcade-mode-icon" viewBox="0 0 32 32" shapeRendering="crispEdges" aria-hidden="true"><path d="M2 2h6v3h3v3h3v3h3v3h3v-3h3v3h-3v3h-3v3h3v3h3v3h-3v4h-4v-4h-3v-3h-3v-3h3v-3h-3v-3H8v-3H5V8H2Z" fill="#edcf98"/><path d="M24 2h6v6h-3v3h-3v3h-3v3h-3v3h3v3h-3v3h-3v4h-4v-4H8v-3h3v-3h3v-3h-3v-3H8v-3h3v3h3v-3h3V8h3V5h4Z" fill="#b9b5d6"/><path d="M4 4h3v3H4Zm21 0h3v3h-3ZM8 8h3v3H8Zm13 0h3v3h-3Z" fill="#fff1d1"/></svg>
  <span className="arcade-mode-copy"><strong>Аркада</strong><small>Бесконечная тренировка</small><em>Только бой · без KC и добычи</em></span>
  <span className="arcade-mode-play">Играть <svg viewBox="0 0 16 16" aria-hidden="true" shapeRendering="crispEdges"><path d="M7 1h3v3h3v3h3v2h-3v3h-3v3H7v-3h3V9H0V6h10V4H7Z" fill="currentColor"/></svg></span>
 </button>;
}
export function DungeonZoneIcon({zone}:{zone:number}){
  const p=DUNGEON_ZONES[zone-1].palette;
  return <svg viewBox="0 0 40 40" aria-hidden="true" shapeRendering="crispEdges"><path d="M2 2h36v36H2Z" fill={p.dark}/><path d="M5 5h30v30H5Z" fill={p.wall}/>{zone===1?<><path d="M9 30V14h5V9h12v5h5v16h-5V16H14v14Z" fill={p.light}/><path d="M16 18h8v13h-8Z" fill={p.water}/></>:zone===2?<><path d="M11 10h18v20H11Z" fill={p.dark}/><path d="M14 13h12v14H14Z" fill={p.accent}/><path d="M9 16h22v3H9Zm0 7h22v3H9Z" fill={p.light}/></>:zone===3?<><path d="M9 11h22v18H9Z" fill={p.dark}/><path d="M12 14h16v12H12Z" fill={p.light}/><path d="M14 17h12v2H14Zm3-4h3v14h-3Z" fill={p.accent}/></>:zone===4?<><path d="M8 11h24v3H8v15H5V11Zm21 3h3v15h-3Z" fill={p.light}/><path d="M11 20h17v3H11Zm-3 7h18v3H8Z" fill={p.accent}/></>:<><path d="M17 8h6v5h6v6h5v6h-8v7H14v-7H6v-6h5v-6h6Z" fill={p.dark}/><path d="M16 13h8v14h-8Zm-4 6h16v3H12Z" fill={p.accent}/></>}</svg>;
}
export function DungeonCampaignMenu({view,zone,onZone,onLevel,onClose,onEndless,onArcade}:{view:AdventureView;zone:number;onZone:(zone:number)=>void;onLevel:(id:number)=>void;onClose:()=>void;onEndless?:(fresh:boolean)=>void;onArcade?:()=>void}){
  const selected=DUNGEON_ZONES[zone-1],levels=ADVENTURE_LEVELS.filter(l=>l.zone===zone),completed=Math.max(0,Math.min(5,view.completedLevel-(zone-1)*5));
  const won=view.area==="sewer"&&view.completedLevel>=view.level,next=ADVENTURE_LEVELS[view.completedLevel]??null;
  return <section className="adventure-card adventure-level-menu dungeon-campaign-menu" aria-label="Кампания: семь зон по пять уровней">
    <header className="campaign-heading"><div><small>{won?`ПРОЙДЕН ${view.zone}.${view.stage} · +${view.coins} KC`:"ПОД ГОРОДОМ"}</small><h2>{view.completedLevel>=35?"Сердце остановлено!":"Путь в глубину"}</h2><p>{view.completedLevel>=35?"Под городом открылся путь в Бездну.":"Открыт следующий маршрут. Назад пути нет."}</p></div><span className="campaign-count">{view.completedLevel}<small>ИЗ 35</small></span></header>
    {next&&<button className="adventure-primary adventure-next-level" type="button" onClick={()=>onLevel(next.id)}><small>ПРОДОЛЖИТЬ · {dungeonZone(next.id).name}</small><span><strong className="campaign-next-name">{next.zone}.{next.stage} · {next.name}</strong><b aria-hidden="true">→</b></span></button>}
{onArcade&&<ArcadeEntry onStart={onArcade}/>}
    {view.completedLevel>=25&&onEndless&&<EndlessEntry view={view} onStart={onEndless}/>}
    <nav className="dungeon-zone-tabs" aria-label="Зоны подземелья">{DUNGEON_ZONES.map(z=><button type="button" key={z.id} aria-pressed={zone===z.id} onClick={()=>onZone(z.id)} aria-label={`${z.id}. ${z.name}. Пройдено ${Math.max(0,Math.min(5,view.completedLevel-(z.id-1)*5))} из 5`}><DungeonZoneIcon zone={z.id}/><span>{z.id}</span><div className="campaign-zone-pips" aria-hidden="true">{[1,2,3,4,5].map(stage=><i key={stage} data-done={view.completedLevel>=(z.id-1)*5+stage}/>)}</div></button>)}</nav>
    <div className="dungeon-zone-summary"><div><small>ЗОНА {zone} · {completed}/5</small><h3>{selected.name}</h3><p>{selected.subtitle}</p></div>{ADVENTURE_WEAPONS[selected.weapon].tier <= view.weaponTier && <div className="dungeon-zone-weapon"><AdventureWeaponArt weapon={selected.weapon} icon/><small>{ADVENTURE_WEAPONS[selected.weapon].name}</small></div>}</div>
    <div className="adventure-level-list campaign-route-list">{levels.map(level=>{const state=level.id<=view.completedLevel?"done":level.id===view.completedLevel+1?"next":"locked";return <button key={level.id} type="button" data-route-state={state} disabled={state!=="next"} onClick={()=>onLevel(level.id)}><b>{level.stage}</b><span><strong>{level.name}</strong><small>{state==="locked"?`После ${ADVENTURE_LEVELS[level.id-2].zone}.${ADVENTURE_LEVELS[level.id-2].stage}`:state==="done"?"Пройден · закрыт":level.id<=2?"Бой на кулаках":level.feature}</small></span><i aria-label={state==="done"?"Пройден":state==="locked"?"Закрыт":"Открыт"}>{state==="done"?"✓":state==="next"?"→":<svg viewBox="0 0 16 20" aria-hidden="true" shapeRendering="crispEdges"><path d="M4 0h8v3h3v6h1v11H0V9h1V3h3Zm2 3v6h4V3Zm1 10v4h2v-4Z" fill="currentColor"/></svg>}</i></button>;})}</div>
    <HunterBestiary/>
    <button className="adventure-secondary" type="button" onClick={onClose}>Выйти в квартиру</button>
  </section>;
}

export function DungeonMap({view,player,partner,cleared,gates,onClose,layout}:{view:AdventureView;partner?:{x:number;y:number;name:string};player:{x:number;y:number;angle?:number};cleared:boolean[];gates:boolean[];onClose:()=>void;layout?:AdventureLevel}){
  const level=layout??ADVENTURE_LEVELS[view.level-1];
  return <section className="adventure-card dungeon-map-card atlas-card" aria-label="Карта текущего уровня">
    <header className="atlas-heading"><div><small>{view.endlessFloor?`БЕЗДНА · ГЛУБИНА ${view.endlessFloor}`:`ПОДЗЕМЕЛЬЕ · ${view.zone}.${view.stage}`}</small><h2>{level.name}</h2></div><span className="atlas-counter">{view.visited.filter(Boolean).length}/{level.rooms.length}<small>ЗАЛОВ</small></span></header>
    <div className="atlas-canvas"><DungeonMapArt level={level} view={view} player={player} partner={partner} cleared={cleared} gates={gates}/></div>
    <div className="atlas-legend"><span><i className="atlas-you"/>Вы здесь</span>{partner&&<span><i className="atlas-clear"/>Напарник</span>}<span><i className="atlas-goal"/>Цель</span><span><i className="atlas-exit"/>Выход</span><span><i className="atlas-clear"/>Зачищено</span></div>
    <p className="atlas-objective">{view.objective}</p><button type="button" className="adventure-primary" autoFocus onClick={onClose}>Продолжить · M</button>
  </section>;
}
