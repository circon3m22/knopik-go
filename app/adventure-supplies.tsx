import type { ReactNode } from "react";
import {GameControlSurface} from './game-control-surface';
import { QuickBuffArtwork } from "./quick-buff-artwork";
import type { AdventurePhase } from "./adventure-engine";
export type AdventureSupply="heal"|"pepsi";
type Props={phase:AdventurePhase;healCount:number;shieldCount:number;surgeCount:number;surgeSeconds:number;canHeal:boolean;shieldReady:boolean;onHeal:()=>void;onShield:()=>void;onSurge:()=>void};
function SupplyAction({children,disabled,label,action}:{children:ReactNode;disabled:boolean;label:string;action:()=>void}){return <button data-game-control="supply" type="button" className="adventure-supply-use" disabled={disabled} aria-label={label} title={label} onPointerDown={e=>{if(disabled||e.button!==0)return;e.preventDefault();action();}} onClick={e=>{if(!disabled&&e.detail===0)action();}}><GameControlSurface/>{children}</button>;}
export function AdventureSupplies(p:Props){
 const playing=p.phase==="playing",items=[{kind:"heal",name:"Хилка",count:p.healCount,active:false,can:p.canHeal,action:p.onHeal,tip:"Восстановить сердце · H"},{kind:"pepsi",name:"Щит",count:p.shieldCount,active:p.shieldReady,can:!p.shieldReady,action:p.onShield,tip:"Спасает от гибели · L"},{kind:"zhivchik",name:"Живчик",count:p.surgeCount,active:p.surgeSeconds>0,can:p.surgeSeconds<=0,action:p.onSurge,tip:"Усиление на 7 секунд · F"}] as const;
 return <div className="adventure-supplies" role="group" aria-label="Применить припасы из запаса">{items.map(i=><section key={i.kind} data-supply={i.kind} className={`adventure-supply ${i.active?"is-armed":""}`}><SupplyAction disabled={!playing||i.count<1||!i.can} label={`${i.name}. В запасе ${i.count}. ${i.tip}`} action={i.action}><span className="adventure-supply-icon"><QuickBuffArtwork kind={i.kind}/><b>{i.kind==="zhivchik"&&i.active?`${Math.ceil(p.surgeSeconds)}с`:i.active?"✓":`×${i.count}`}</b></span><small>{i.name}</small></SupplyAction></section>)}</div>;
}
