'use client';
import {useState} from 'react';
import {HomeRoomModal} from './home-room-panels';
import {WEAPON_ORDER,ADVENTURE_WEAPONS,type AdventureWeapon} from './adventure-levels';
import {AdventureWeaponArt} from './adventure-level-art';
import {DungeonStatusIcon} from './dungeon-status-icon';
import {weaponUpgradeStats,weaponUpgradePrice,type WeaponUpgrades} from './weapon-progression';
import type {ThemeId} from './cosmetic-engine';import type {KnopikSkin} from './knopik-skins';
export function ArmoryRoom({theme,skin,wallet,weaponTier,upgrades,onUpgrade,onClose}:{theme:ThemeId;skin?:KnopikSkin;wallet:number;weaponTier:number;upgrades:WeaponUpgrades;onUpgrade:(weapon:AdventureWeapon,expected:number)=>boolean;onClose:()=>void}){
 const [selected,setSelected]=useState<AdventureWeapon>('fist'),[notice,setNotice]=useState('');
 const item=ADVENTURE_WEAPONS[selected],locked=item.tier>weaponTier,stats=weaponUpgradeStats(upgrades,selected),price=weaponUpgradePrice(selected,stats.level);
 return <HomeRoomModal title="Оружейный стеллаж" eyebrow="АРСЕНАЛ / ПРИХОЖАЯ" theme={theme} onClose={onClose} footer={<div className="armory-buy"><span>Активные KC <strong>{wallet.toLocaleString('ru-RU')}</strong></span><button className="home-room-primary" type="button" disabled={locked||price===null||wallet<price} onClick={()=>{const ok=onUpgrade(selected,stats.level);setNotice(ok?'Улучшение установлено ✓':'Покупка не прошла. Проверь баланс и повтори.');}}>{locked?'Оружие ещё закрыто':price===null?'Максимальное улучшение':wallet<price?`Нужно ${price.toLocaleString('ru-RU')} KC`:`Улучшить · ${price.toLocaleString('ru-RU')} KC`}</button></div>}>
  <div className="armory-rack" aria-label="Восемь видов оружия">{WEAPON_ORDER.map(w=>{const closed=ADVENTURE_WEAPONS[w].tier>weaponTier;return <button type="button" key={w} aria-pressed={selected===w} aria-label={`${ADVENTURE_WEAPONS[w].name}. ${closed?'Закрыто':`Улучшение ${upgrades[w]} из 3`}`} data-weapon-locked={closed} onClick={()=>{setSelected(w);setNotice('');}}><AdventureWeaponArt weapon={w} icon skin={skin}/><strong>{ADVENTURE_WEAPONS[w].name}</strong><span className="armory-grade" aria-hidden="true">{closed?<DungeonStatusIcon state="locked"/>:[1,2,3].map(n=><i key={n} data-filled={upgrades[w]>=n}/>)}</span></button>;})}</div>
  <section className="armory-weapon-detail"><div className="armory-weapon-title"><AdventureWeaponArt weapon={selected} icon skin={skin}/><div><small>{locked?'НЕДОСТУПНО':'ОТКРЫТО ПО СЮЖЕТУ'}</small><h3>{item.name}</h3><p>{locked?`Откроется на уровне ${[1,3,6,11,16,21,26,31][item.tier]}`:`Улучшение ${stats.level} из 3`}</p></div></div>
   <div className="armory-stats"><span>Урон<strong>{(item.damage*stats.damageMultiplier).toLocaleString('ru-RU',{maximumFractionDigits:2})}</strong></span><span>Между атаками<strong>{(item.cooldown*stats.cooldownMultiplier).toLocaleString('ru-RU',{maximumFractionDigits:2})} с</strong></span></div>
   <ol className="armory-upgrade-steps">{[1,2,3].map(n=><li key={n} data-upgrade-done={stats.level>=n}><b>{n}</b><span><strong>{['Настройка','Усиление','Мастерская'][n-1]}</strong><small>+{n*15}% урона · −{n*4}% времени атаки</small></span><i>{stats.level>=n?<DungeonStatusIcon state="done"/>:`${weaponUpgradePrice(selected,n-1)?.toLocaleString('ru-RU')} KC`}</i></li>)}</ol>
  </section><p className="armory-help">Покупка сохраняется навсегда и работает в одиночной игре и онлайн. Закрытое оружие сначала нужно открыть по сюжету. Монеты из сейфа не тратятся.</p><p className="armory-notice" role="status" aria-live="polite">{notice}</p>
 </HomeRoomModal>;
}
