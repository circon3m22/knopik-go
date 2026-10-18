import type {ReactNode} from "react";
import {AdventureHeart} from "./adventure-artwork";
import {ActiveBalance} from "./active-balance";

/** One reserved row; secondary actions never float over the camera view. */
export function GamePlayHud({place,eyebrow,hp,balance,atRisk=false,partner,secondaryActions,children}:{
 place:string;eyebrow:string;hp:number;balance:number;atRisk?:boolean;
 partner?:{name:string;hp:number};secondaryActions?:ReactNode;children:ReactNode;
}){
 return <header className="adventure-hud" aria-label={`${eyebrow} · ${place}`}>
   <div className="adventure-hud-primary">
     <div className="adventure-health" role="img" aria-label={`Здоровье: ${hp} из 3${partner?`. ${partner.name}: ${partner.hp} из 3`:''}`}>
       <AdventureHeart filled={hp>0}/><AdventureHeart filled={hp>1}/><AdventureHeart filled={hp>2}/>
       {partner&&<span className="adventure-partner-health" role="img" aria-label={`${partner.name}: ${partner.hp} из 3`} title={`${partner.name}: ${partner.hp} из 3`}><AdventureHeart filled={partner.hp>0}/><small>{partner.hp}</small></span>}
     </div>
     <ActiveBalance amount={balance} atRisk={atRisk} compact/>
     <div className="adventure-header-actions">{secondaryActions}{children}</div>
   </div>
 </header>;
}
