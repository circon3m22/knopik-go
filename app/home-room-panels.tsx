"use client";
import { useEffect,useRef,useState,type ReactNode } from "react";
import { GameModal } from "./game-modal";
import { AnimatedAdventureKnopik } from "./knopik-adventure-art";
import { paintWardrobePreview } from "./wardrobe-preview";
import { PixelDog } from "./pixel-artwork";
import { ClothingArtwork,CosmeticArtwork } from "./cosmetic-artwork";
import { CoinArtwork } from "./collectible-artwork";
import {AuraCoinArtwork,VaultAuraMachineArt} from "./aura-artwork";
import { COSMETICS,type ThemeId } from "./cosmetic-engine";
import { COMBAT_CLOTHING } from "./knopik-combat-equipment";
import type { KnopikEquipment } from "./knopik-equipment-state";
import type { ClothingKind } from "./clothing-art";
export function HomeRoomModal({title,eyebrow,theme,onClose,children,footer}:{title:string;eyebrow:string;theme:ThemeId;onClose:()=>void;children:ReactNode;footer?:ReactNode}) {return <GameModal className={`home-room-modal pixel-game theme-${theme}`} label={title} onDismiss={onClose}><section className="home-room-panel"><header className="home-room-heading"><div><small>{eyebrow}</small><h2>{title}</h2></div><button className="home-room-close" type="button" onClick={onClose} aria-label="Закрыть">×</button></header><div className="home-room-content">{children}</div>{footer&&<footer className="home-room-footer">{footer}</footer>}</section></GameModal>;}
export function WardrobePreview({equipment,angle= Math.PI/2}:{equipment:KnopikEquipment;angle?:number}) {
  const svg=useRef<SVGSVGElement>(null);
  useEffect(()=>{if(svg.current)paintWardrobePreview(svg.current,equipment,angle);},[equipment,angle]);
  return <svg ref={svg} className="wardrobe-avatar" viewBox="-65 -110 130 135" shapeRendering="crispEdges" role="img" aria-label="Кнопик в выбранной одежде"><AnimatedAdventureKnopik/></svg>;
}
export function WardrobeRoom({equipment,owned,theme,onApply,onClose}:{equipment:KnopikEquipment;owned:ClothingKind[];theme:ThemeId;onApply:(e:KnopikEquipment)=>void;onClose:()=>void}) {
  const [draft,setDraft]=useState(equipment),[turn,setTurn]=useState(0),[portrait,setPortrait]=useState(false),[saved,setSaved]=useState(false);
  const worn=(kind:ClothingKind)=>kind==="hat"?draft.hat:kind==="mohawk"?draft.mohawk:draft.accessory===kind;
  const toggle=(kind:ClothingKind)=>{if(!owned.includes(kind))return;setSaved(false);setDraft(d=>kind==="hat"?{...d,hat:!d.hat,mohawk:false}:kind==="mohawk"?{...d,mohawk:!d.mohawk,hat:false}:{...d,accessory:d.accessory===kind?null:kind});};
  const names={hat:"Тюбетейка",mohawk:"Ирокез",...Object.fromEntries(Object.entries(COSMETICS).map(([k,v])=>[k,v.name]))} as Record<ClothingKind,string>;
  return <HomeRoomModal title="Гардеробная" eyebrow="ПРИМЕРОЧНАЯ КНОПИКА" theme={theme} onClose={onClose} footer={<button className="home-room-primary" type="button" onClick={()=>{onApply(draft);setSaved(true);}}>{saved?"Комплект надет ✓":"Надеть комплект"}</button>}>
    <div className="wardrobe-mirror"><div className="wardrobe-preview-tabs"><button type="button" aria-pressed={!portrait} onClick={()=>setPortrait(false)}>В мире</button><button type="button" aria-pressed={portrait} onClick={()=>setPortrait(true)}>На кнопке</button></div><div className="wardrobe-stage">{portrait?<PixelDog skin={draft.skin} ears outfit={{...draft,hatBounce:0,mohawkSwing:0}}/>:<WardrobePreview equipment={draft} angle={Math.PI/2-turn*Math.PI/4}/>}</div><div className="wardrobe-turn"><button type="button" disabled={portrait} aria-label="Повернуть Кнопика влево" onClick={()=>setTurn(t=>(t+7)%8)}>←</button><small>{portrait?"Примерка на тапалке":`РАКУРС ${turn+1} / 8`}</small><button type="button" disabled={portrait} aria-label="Повернуть Кнопика вправо" onClick={()=>setTurn(t=>(t+1)%8)}>→</button></div></div>
    <div className="wardrobe-items">{(["hat","mohawk","bandana","charm","goggles","cape","ranger-hood","hunter-armor","raven-mask","hunter-cloak"] as const).map(kind=><button key={kind} type="button" disabled={!owned.includes(kind)} aria-pressed={worn(kind)} onClick={()=>toggle(kind)} title={COMBAT_CLOTHING[kind]}>{kind==="hat"||kind==="mohawk"?<ClothingArtwork kind={kind}/>:<CosmeticArtwork kind={kind}/>}<span><strong>{names[kind]}</strong><small>{owned.includes(kind)?worn(kind)?"На Кнопике":"Примерить":"Пока не куплено"}</small></span><b>{worn(kind)?"✓":owned.includes(kind)?"+":"▣"}</b></button>)}</div>
    <p className="home-room-help">Головной убор и один аксессуар можно сочетать. В примерке доступны все восемь ракурсов.</p><div className="wardrobe-perks">{([draft.hat?"hat":null,draft.mohawk?"mohawk":null,draft.accessory] as const).filter((k):k is ClothingKind=>!!k).map(k=><p key={k}>{COMBAT_CLOTHING[k]}</p>)}</div>
  </HomeRoomModal>;
}
export function VaultRoom({theme,balance,wallet,canDeposit,onDeposit,onClose}:{theme:ThemeId;balance:number;wallet:number;canDeposit:boolean;onDeposit:()=>void;onClose:()=>void}){
 return <HomeRoomModal title="Сейфовая" eyebrow="СБЕРЕЖЕНИЯ КНОПИКА" theme={theme} onClose={onClose} footer={<button className="home-room-primary" type="button" disabled={!canDeposit} onClick={onDeposit}>В сейф +{Math.floor(wallet/2).toLocaleString("ru-RU")}</button>}>
 <div className="vault-room-display"><CoinArtwork/><small>ТВОЙ СЕЙФ</small><strong>{balance.toLocaleString("ru-RU")}</strong><span>Защищённые KC</span></div>
 <div className="vault-transfer"><span>Активные KC<strong>{wallet.toLocaleString("ru-RU")}</strong></span><b>→</b><span>В сейф<strong>{Math.floor(wallet/2).toLocaleString("ru-RU")}</strong></span></div>
 </HomeRoomModal>;
}
export function AuraExchangeRoom({theme,wallet,aura,onExchange,onClose}:{theme:ThemeId;wallet:number;aura:number;onExchange:()=>void;onClose:()=>void}){
 return <HomeRoomModal title="Автомат AURA" eyebrow="ОБМЕН ВАЛЮТЫ" theme={theme} onClose={onClose}>
 <div className="vault-aura-exchange" data-aura-machine=""><VaultAuraMachineArt/><div className="vault-aura-details"><span className="vault-aura-balance"><AuraCoinArtwork/><strong>{aura.toLocaleString("ru-RU")}</strong><small>AURA</small></span><strong>1000 KC = 1 AURA</strong><p>Активные KC: {wallet.toLocaleString("ru-RU")}</p><button className="home-room-primary" type="button" disabled={wallet<1000} onClick={onExchange}>{wallet<1000?"Нужно 1000 KC":"Обменять 1000 KC"}</button><small>Монеты из сейфа не тратятся</small></div></div>
 </HomeRoomModal>;
}
