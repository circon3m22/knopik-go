import type {ReactNode} from "react";
import {AdventureHeart} from "./adventure-artwork";
import {ActiveBalance} from "./active-balance";
import {GameUiIcon} from "./game-ui-icon";

/** The reserved HUD row shows only lives, balance and pause.
 * Mission, location and secondary actions float on the scene below it. */
export function GamePlayHud({place,eyebrow,hp,balance,atRisk=false,objective,progress,secondaryActions,children}:{
 place:string;eyebrow:string;hp:number;balance:number;atRisk?:boolean;
 objective?:ReactNode;progress?:string;secondaryActions?:ReactNode;children:ReactNode;
}){
 return <header className="adventure-hud">
   <div className="adventure-hud-primary">
     <div className="adventure-health" role="img" aria-label={`Здоровье: ${hp} из 3`}>
       <AdventureHeart filled={hp>0}/><AdventureHeart filled={hp>1}/><AdventureHeart filled={hp>2}/>
     </div>
     <ActiveBalance amount={balance} atRisk={atRisk}/>
     <div className="adventure-header-actions">{children}</div>
   </div>
   <div className="adventure-mission-line" aria-label="Текущее место и задание">
     <div className="adventure-mission-detail">
       <small className="adventure-mission-place" title={eyebrow}>{eyebrow} · {place}</small>
       {objective&&<div className="adventure-mission-objective" role="status"><GameUiIcon kind="goal"/><span>{objective}</span></div>}
     </div>
     {progress&&<small className="adventure-mission-progress">{progress}</small>}
     {secondaryActions&&<div className="adventure-mission-actions">{secondaryActions}</div>}
   </div>
 </header>;
}
