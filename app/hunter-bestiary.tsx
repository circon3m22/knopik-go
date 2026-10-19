import {useState,type CSSProperties} from 'react';
import {SAHUR_KINDS,sanitizeSeenSahurs,type SahurKind} from './sahur-journal';
import {StandardSahurSprite} from './sahur-sprite';
import {DirectionalSahur} from './adventure-direction-art';
import {DungeonEnemyEquipment} from './dungeon-combat-art';
import {AdventureWeaponArt} from './adventure-level-art';
import {ADVENTURE_WEAPONS,WEAPON_ORDER} from './adventure-levels';
import {weaponUpgradeStats,type WeaponUpgrades} from './weapon-progression';
import type {KnopikSkin} from './knopik-skins';
const ENTRIES:Record<SahurKind,{name:string;tag:string;danger:string;tactic:string;accent:string}>={
 grunt:{name:'Сахур с битой',tag:'БЛИЖНИЙ БОЙ',danger:'Сближается и бьёт после короткого замаха.',tactic:'Отойди во время замаха. В паузе после удара подойди и атакуй.',accent:'#c9ad7b'},
 gunner:{name:'Стрелок',tag:'ДАЛЬНИЙ БОЙ',danger:'Держит дистанцию и стреляет по прямой.',tactic:'Двигайся поперёк выстрела и используй колонны. Во время паузы сократи дистанцию.',accent:'#a5c3be'},
 charger:{name:'Таран',tag:'РЫВОК',danger:'Перед разгоном отмечает дорожку, затем резко бежит вперёд.',tactic:'Уходи в сторону от красной дорожки. Атакуй после его остановки.',accent:'#d8977d'},
 armored:{name:'Броненосец',tag:'БРОНЯ',danger:'Пластина уменьшает урон от атаки спереди.',tactic:'Обойди со спины. Разряд и взрыв обходят его защиту.',accent:'#aabdc4'},
 demolisher:{name:'Подрывник',tag:'ВЗРЫВЧАТКА',danger:'Бросает заряд туда, где ты стоял. Место взрыва отмечено заранее.',tactic:'Сразу смени позицию и не прячься рядом с бочкой.',accent:'#d5a278'},
 stalker:{name:'Следопыт',tag:'БЫСТРАЯ ОХОТА',danger:'Быстро сближается и делает короткий рывок.',tactic:'Уходи поперёк дорожки и оставляй место для переката. Не зажимай себя в углу.',accent:'#b0c38a'},
 marksman:{name:'Дальний стрелок',tag:'ПРИЦЕЛЬНЫЙ ВЫСТРЕЛ',danger:'Долго целится, но выпускает очень быструю пулю.',tactic:'Как только появился визир, зайди за укрытие. Вернись к атаке после выстрела.',accent:'#90c5c8'},
 boss:{name:'Вожак',tag:'БОСС ЗОНЫ',danger:'Чередует атаки. Потеряв половину здоровья, вызывает подкрепление.',tactic:'Следи за сигналами, разбирай подкрепление и сохраняй перекат для опасной атаки.',accent:'#dfc583'},
};
export function SahurPortrait({kind}:{kind:SahurKind}){
 return <svg viewBox="-66 -112 132 132" shapeRendering="crispEdges" aria-hidden="true" data-journal-portrait={kind}>
  <path d="M-52-103H52V12H-52Z" fill="#21383e"/><path d="M-45-96h90v3h-90Zm0 95h90v3h-90Z" fill="#385459"/>
  {kind==='boss'?<DirectionalSahur/>:<StandardSahurSprite gun={kind==='gunner'||kind==='marksman'}/>}
  <DungeonEnemyEquipment role={kind==='boss'?undefined:kind} boss={kind==='boss'} zone={kind==='boss'?7:6}/>
 </svg>;
}
export function HunterBestiary({seenSahurs=[]}:{seenSahurs?:readonly SahurKind[]}){
 const known=sanitizeSeenSahurs(seenSahurs);
 return <div className="hunter-bestiary journal-creatures"><div className="journal-intro"><span>ПОЛЕВЫЕ ЗАМЕТКИ</span><h3>Встреченные Сахуры</h3><p>Изучено {known.length} из {SAHUR_KINDS.length}. Новая запись появляется после встречи в игре.</p></div>
  {known.length===0?<div className="journal-empty"><b>Пока нет записей</b><p>Спустись в подземелье. Здесь появятся только те Сахуры, которых ты встретил.</p></div>:known.map(id=>{const e=ENTRIES[id];return <article className="journal-enemy-card" key={id} data-sahur-entry={id} style={{'--journal-accent':e.accent} as CSSProperties}><SahurPortrait kind={id}/><div><small>{e.tag}</small><h4>{e.name}</h4><p>{e.danger}</p><section><b>ТАКТИКА</b><p>{e.tactic}</p></section></div></article>;})}
 </div>;
}
export function DungeonGuide({seenSahurs,weaponTier,upgrades,skin}:{seenSahurs:readonly SahurKind[];weaponTier:number;upgrades?:WeaponUpgrades;skin?:KnopikSkin}){
 const [tab,setTab]=useState<'sahurs'|'weapons'|'rules'>('sahurs');
 return <section className="dungeon-guide" aria-label="Полевой справочник"><nav className="journal-tabs" aria-label="Раздел справочника">{([{id:'sahurs',title:'Сахуры'},{id:'weapons',title:'Оружие'},{id:'rules',title:'Правила'}] as const).map(t=><button key={t.id} type="button" aria-pressed={tab===t.id} onClick={()=>setTab(t.id)}>{t.title}</button>)}</nav><div className="journal-scroll">
  {tab==='sahurs'?<HunterBestiary seenSahurs={seenSahurs}/>:tab==='weapons'?<GuideWeapons weaponTier={weaponTier} upgrades={upgrades} skin={skin}/>:<div className="journal-rules"><div className="journal-intro"><span>ПЕРЕД СПУСКОМ</span><h3>Коротко о вылазке</h3></div>{[
   ['Путь по зонам','В каждой зоне пять уровней. Проходи их по порядку: завершённый маршрут открывает следующий.'],
   ['Задание и карта','Открой карту справа вверху: на ней показаны проходы, текущее задание и выход. Выполни задачи и доберись до подъёмника.'],
   ['Жизни и монеты','Следи за тремя сердцами. При поражении активные KC сгорают; деньги в сейфе остаются.'],
   ['Управление','WASD или джойстик — движение. J/Пробел — атака, K/Shift — перекат, E — действие, M — карта, Escape — пауза.'],
   ['Арсенал','Новое оружие открывается по сюжету. Три улучшения каждого оружия дают до +45% урона и −12% времени между атаками.'],
   ['Аркада и Бездна','Аркада — тренировка без KC и добычи. После 25-го уровня открывается Бездна с отдельным рекордом.'],
   ['Вдвоём','В совместной игре можно помочь упавшему напарнику: стой рядом и удерживай действие. Для выхода к следующему уровню нужны оба игрока.'],
  ].map(([title,copy])=><article key={title}><h4>{title}</h4><p>{copy}</p></article>)}</div>}
 </div></section>;
}

export function GuideWeapons({weaponTier,upgrades,skin}:{weaponTier:number;upgrades?:WeaponUpgrades;skin?:KnopikSkin}){return <div className="journal-weapons"><div className="journal-intro"><span>ЛИЧНЫЙ АРСЕНАЛ</span><h3>Открытое оружие</h3><p>Улучшения покупаются на стеллаже в прихожей. У каждого оружия три ступени.</p></div>{WEAPON_ORDER.filter(w=>ADVENTURE_WEAPONS[w].tier<=weaponTier).map(w=>{const item=ADVENTURE_WEAPONS[w],bonus=weaponUpgradeStats(upgrades,w);return <article key={w}><AdventureWeaponArt weapon={w} icon skin={skin}/><div><h4>{item.name}</h4><p>Урон {(item.damage*bonus.damageMultiplier).toLocaleString('ru-RU',{maximumFractionDigits:2})} · атака {(item.cooldown*bonus.cooldownMultiplier).toLocaleString('ru-RU',{maximumFractionDigits:2})} с</p><small>Улучшение {bonus.level}/3 · клавиша {item.tier+1}</small></div></article>;})}</div>;}
