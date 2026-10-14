import { DungeonMapArt } from "./dungeon-map-art";
import { ADVENTURE_LEVELS, ADVENTURE_WEAPONS, DUNGEON_ZONES, dungeonZone } from "./adventure-levels";
import { AdventureWeaponArt } from "./adventure-level-art";
import type { AdventureView } from "./adventure-engine";
export function DungeonZoneIcon({zone}:{zone:number}){
  const p=DUNGEON_ZONES[zone-1].palette;
  return <svg viewBox="0 0 40 40" aria-hidden="true" shapeRendering="crispEdges"><path d="M2 2h36v36H2Z" fill={p.dark}/><path d="M5 5h30v30H5Z" fill={p.wall}/>{zone===1?<><path d="M9 30V14h5V9h12v5h5v16h-5V16H14v14Z" fill={p.light}/><path d="M16 18h8v13h-8Z" fill={p.water}/></>:zone===2?<><path d="M11 10h18v20H11Z" fill={p.dark}/><path d="M14 13h12v14H14Z" fill={p.accent}/><path d="M9 16h22v3H9Zm0 7h22v3H9Z" fill={p.light}/></>:zone===3?<><path d="M9 11h22v18H9Z" fill={p.dark}/><path d="M12 14h16v12H12Z" fill={p.light}/><path d="M14 17h12v2H14Zm3-4h3v14h-3Z" fill={p.accent}/></>:zone===4?<><path d="M8 11h24v3H8v15H5V11Zm21 3h3v15h-3Z" fill={p.light}/><path d="M11 20h17v3H11Zm-3 7h18v3H8Z" fill={p.accent}/></>:<><path d="M17 8h6v5h6v6h5v6h-8v7H14v-7H6v-6h5v-6h6Z" fill={p.dark}/><path d="M16 13h8v14h-8Zm-4 6h16v3H12Z" fill={p.accent}/></>}</svg>;
}
export function DungeonCampaignMenu({view,zone,onZone,onLevel,onClose}:{view:AdventureView;zone:number;onZone:(zone:number)=>void;onLevel:(id:number)=>void;onClose:()=>void}){
  const selected=DUNGEON_ZONES[zone-1],levels=ADVENTURE_LEVELS.filter(l=>l.zone===zone),completed=Math.max(0,Math.min(5,view.completedLevel-(zone-1)*5));
  const won=view.area==="sewer",next=view.level<25?ADVENTURE_LEVELS[view.level]:null;
  return <section className="adventure-card adventure-level-menu dungeon-campaign-menu" aria-label="Кампания: пять зон по пять уровней">
    <header><small>{won?`УРОВЕНЬ ${view.zone}.${view.stage} ПРОЙДЕН · +${view.coins} KC`:"ПОД ГОРОДОМ · 25 УРОВНЕЙ"}</small><h2>{won?view.level===25?"Сердце остановлено!":"Дальше — глубже":"Пять подземных зон"}</h2><p>{won?view.level===25?"Все пять зон пройдены. Кнопик может вернуться домой или снова спуститься в тоннели.":"Выбери следующий маршрут или вернись домой.":"Развилки, ловушки и своя история на каждом уровне."}</p></header>
    {won&&next&&<button className="adventure-primary adventure-next-level" type="button" onClick={()=>onLevel(next.id)}>{next.zone!==view.zone?`Войти: ${dungeonZone(next.id).name}`:`Уровень ${next.zone}.${next.stage} · ${next.name}`} →</button>}
    <nav className="dungeon-zone-tabs" aria-label="Зоны подземелья">{DUNGEON_ZONES.map(z=><button type="button" key={z.id} aria-pressed={zone===z.id} onClick={()=>onZone(z.id)} aria-label={`${z.id}. ${z.name}. Пройдено ${Math.max(0,Math.min(5,view.completedLevel-(z.id-1)*5))} из 5`}><DungeonZoneIcon zone={z.id}/><span>{z.id}</span>{view.completedLevel>=z.id*5&&<b aria-hidden="true">✓</b>}</button>)}</nav>
    <div className="dungeon-zone-summary"><div><small>ЗОНА {zone} · {completed}/5</small><h3>{selected.name}</h3><p>{selected.subtitle}</p></div>{ADVENTURE_WEAPONS[selected.weapon].tier <= view.weaponTier && <div className="dungeon-zone-weapon"><AdventureWeaponArt weapon={selected.weapon} icon/><small>{ADVENTURE_WEAPONS[selected.weapon].name}</small></div>}</div>
    <div className="adventure-level-list">{levels.map(level=><button key={level.id} type="button" disabled={level.id>view.completedLevel+1} onClick={()=>onLevel(level.id)}><b>{level.stage}</b><span><strong>{level.name}</strong><small>{level.id>view.completedLevel+1?`После уровня ${ADVENTURE_LEVELS[level.id-2].zone}.${ADVENTURE_LEVELS[level.id-2].stage}`:level.feature}</small></span>{level.id<=view.completedLevel&&<i aria-label="Пройден">✓</i>}</button>)}</div>
    <button className="adventure-secondary" type="button" onClick={onClose}>Выйти в квартиру</button>
  </section>;
}

export function DungeonMap({view,player,cleared,gates,onClose}:{view:AdventureView;player:{x:number;y:number;angle?:number};cleared:boolean[];gates:boolean[];onClose:()=>void}){
  const level=ADVENTURE_LEVELS[view.level-1];
  return <section className="adventure-card dungeon-map-card atlas-card" aria-label="Карта текущего уровня">
    <header className="atlas-heading"><div><small>ПОДЗЕМЕЛЬЕ · {view.zone}.{view.stage}</small><h2>{level.name}</h2></div><span className="atlas-counter">{view.visited.filter(Boolean).length}/{level.rooms.length}<small>ЗАЛОВ</small></span></header>
    <div className="atlas-canvas"><DungeonMapArt level={level} view={view} player={player} cleared={cleared} gates={gates}/></div>
    <div className="atlas-legend"><span><i className="atlas-you"/>Вы здесь</span><span><i className="atlas-goal"/>Цель</span><span><i className="atlas-exit"/>Выход</span><span><i className="atlas-clear"/>Зачищено</span></div>
    <p className="atlas-objective">{view.objective}</p><button type="button" className="adventure-primary" autoFocus onClick={onClose}>Продолжить · M</button>
  </section>;
}
