import {useId,useState,type CSSProperties} from 'react';
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
 return <svg viewBox="-90 -130 180 180" shapeRendering="crispEdges" aria-hidden="true" data-journal-portrait={kind}>
  <path d="M-90-130H90V50H-90Z" fill="#21383e"/><path d="M-80-120H80V-117H-80ZM-80 37H80V40H-80Z" fill="#385459"/>
  {kind==='boss'?<DirectionalSahur/>:<StandardSahurSprite gun={kind==='gunner'||kind==='marksman'}/>}
  <DungeonEnemyEquipment role={kind==='boss'?undefined:kind} boss={kind==='boss'} zone={kind==='boss'?7:6}/>
 </svg>;
}
function JournalHeading({eyebrow,title,copy,count}:{eyebrow:string;title:string;copy:string;count?:string}){
 return <header className="journal-intro"><span>{eyebrow}</span><div className="journal-title"><h3>{title}</h3>{count&&<b className="journal-count">{count}</b>}</div><p>{copy}</p></header>;
}

export function HunterBestiary({seenSahurs=[]}:{seenSahurs?:readonly SahurKind[]}){
 const known=sanitizeSeenSahurs(seenSahurs);
 return <div className="journal-creatures" data-journal-layout="field-notes-2">
  <JournalHeading eyebrow="ПОЛЕВЫЕ ЗАМЕТКИ" title="Сахуры" count={`${known.length} / ${SAHUR_KINDS.length}`} copy="Записи открываются при встрече в подземелье."/>
  <div className="journal-discoveries" aria-label={`Изучено ${known.length} из ${SAHUR_KINDS.length}`}>
   {SAHUR_KINDS.map((_,i)=><i key={i} data-filled={i<known.length} aria-hidden="true"/>)}
  </div>
  {known.length===0?<div className="journal-empty"><svg viewBox="0 0 40 40" aria-hidden="true" shapeRendering="crispEdges"><path d="M5 5h13v3h4V5h13v27H23v3h-6v-3H5Z" fill="#b7c9b0"/><path d="M8 8h7v3H8Zm0 7h7v3H8Zm0 7h7v3H8Zm17-14h7v3h-7Zm0 7h7v3h-7Zm0 7h7v3h-7ZM18 11h4v18h-4Z" fill="#29434a"/></svg><b>Пока нет записей</b><p>Встреть первого Сахура — здесь появятся его портрет и советы для боя.</p></div>:
   <div className="journal-card-list">{known.map(id=>{const e=ENTRIES[id];return <article className="journal-enemy-card" key={id} data-sahur-entry={id} style={{'--journal-accent':e.accent} as CSSProperties}>
    <header className="journal-enemy-heading"><SahurPortrait kind={id}/><div><small>{e.tag}</small><h4>{e.name}</h4></div></header>
    <p className="journal-enemy-description">{e.danger}</p><section className="journal-tactic"><b>ТАКТИКА</b><p>{e.tactic}</p></section>
   </article>;})}</div>}
 </div>;
}
const GUIDE_TABS=[{id:'sahurs',title:'Сахуры'},{id:'weapons',title:'Оружие'},{id:'rules',title:'Правила'}] as const;
type GuideTab=typeof GUIDE_TABS[number]['id'];
export function DungeonGuide({seenSahurs,weaponTier,upgrades,skin}:{seenSahurs:readonly SahurKind[];weaponTier:number;upgrades?:WeaponUpgrades;skin?:KnopikSkin}){
 const [tab,setTab]=useState<GuideTab>('sahurs'),id=useId();
 return <section className="dungeon-guide" aria-label="Полевой справочник">
  <nav className="journal-tabs" aria-label="Раздел справочника">{GUIDE_TABS.map(t=><button key={t.id} id={`${id}-${t.id}`} type="button" aria-pressed={tab===t.id} aria-controls={`${id}-page`} onClick={()=>setTab(t.id)}>{t.title}</button>)}</nav>
  <div key={tab} className="journal-scroll" id={`${id}-page`} role="region" aria-labelledby={`${id}-${tab}`} tabIndex={0}>
   {tab==='sahurs'?<HunterBestiary seenSahurs={seenSahurs}/>:tab==='weapons'?<GuideWeapons weaponTier={weaponTier} upgrades={upgrades} skin={skin}/>:<GuideRules/>}
  </div>
 </section>;
}
export function GuideRules(){return <div className="journal-rules">
 <JournalHeading eyebrow="ПЕРЕД СПУСКОМ" title="Как играть" copy="Главное о вылазках, управлении и совместной игре."/>
 <div className="journal-card-list">{[
  ['Путь по зонам','В каждой зоне пять уровней. Проходи их по порядку: завершённый маршрут открывает следующий.'],
  ['Задание и карта','Открой карту справа вверху: на ней показаны проходы, текущее задание и выход. Выполни задачи и доберись до подъёмника.'],
  ['Жизни и монеты','Следи за тремя сердцами. При поражении активные KC сгорают; деньги в сейфе остаются.'],
  ['Управление','WASD или джойстик — движение. J/Пробел — атака, K/Shift — перекат, E — действие, M — карта, Escape — пауза.'],
  ['Арсенал','Новое оружие открывается по сюжету. Три улучшения каждого оружия дают до +45% урона и −12% времени между атаками.'],
  ['Аркада и Бездна','Аркада — тренировка без KC и добычи. После 25-го уровня открывается Бездна с отдельным рекордом.'],
  ['Вдвоём','Стой рядом с упавшим напарником и удерживай действие, чтобы помочь ему. Для выхода к следующему уровню нужны оба игрока.'],
 ].map(([title,copy],i)=><article className="journal-rule" key={title}><header><span aria-hidden="true">{String(i+1).padStart(2,'0')}</span><h4>{title}</h4></header><p>{copy}</p></article>)}</div>
 </div>;}

export function GuideWeapons({weaponTier,upgrades,skin}:{weaponTier:number;upgrades?:WeaponUpgrades;skin?:KnopikSkin}){
 const available=WEAPON_ORDER.filter(w=>ADVENTURE_WEAPONS[w].tier<=weaponTier);
 return <div className="journal-weapons"><JournalHeading eyebrow="ЛИЧНЫЙ АРСЕНАЛ" title="Оружие" count={`${available.length} / ${WEAPON_ORDER.length}`} copy="Улучшай оружие на стеллаже в прихожей. У каждого три ступени."/>
  <div className="journal-card-list">{available.map(w=>{const item=ADVENTURE_WEAPONS[w],bonus=weaponUpgradeStats(upgrades,w);return <article className="journal-weapon-card" key={w}>
   <header className="journal-weapon-heading"><div className="journal-weapon-art"><AdventureWeaponArt weapon={w} icon skin={skin}/></div><div><small>КЛАВИША {item.tier+1}</small><h4>{item.name}</h4></div></header>
   <dl className="journal-weapon-stats"><div><dt>УРОН</dt><dd>{(item.damage*bonus.damageMultiplier).toLocaleString('ru-RU',{maximumFractionDigits:2})}</dd></div><div><dt>МЕЖДУ АТАКАМИ</dt><dd>{(item.cooldown*bonus.cooldownMultiplier).toLocaleString('ru-RU',{maximumFractionDigits:2})} с</dd></div></dl>
   <div className="journal-upgrade"><span>Улучшение {bonus.level}/3</span><div aria-hidden="true">{[1,2,3].map(n=><i key={n} data-filled={n<=bonus.level}/>)}</div></div>
  </article>;})}</div>
 </div>;
}
