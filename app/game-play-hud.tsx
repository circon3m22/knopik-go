import {AdventureHeart} from './adventure-artwork';
import {ActiveBalance} from './active-balance';
import {GameUiIcon} from './game-ui-icon';

/** Bare vitals on the left, exactly two actions on the right. Keep the reserved
 * row mounted when an overlay opens, so pausing never reframes the camera. */
export function GamePlayHud({place,eyebrow,hp,balance,atRisk=false,partner,concealed=false,onMap,onPause,mapDisabled=false,pauseDisabled=false,mapLabel='Карта · M'}:{
 place:string;eyebrow:string;hp:number;balance:number;atRisk?:boolean;
 partner?:{name:string;hp:number};concealed?:boolean;onMap:()=>void;onPause:()=>void;
 mapDisabled?:boolean;pauseDisabled?:boolean;mapLabel?:string;
}){
 return <header className="adventure-hud" aria-label={`${eyebrow} · ${place}`} aria-hidden={concealed||undefined} inert={concealed}>
  <div className="adventure-hud-primary">
   <div className="adventure-hud-stats">
    <div className="adventure-health" role="img" aria-label={`Здоровье: ${hp} из 3${partner?`. ${partner.name}: ${partner.hp} из 3`:''}`}>
     <AdventureHeart filled={hp>0}/><AdventureHeart filled={hp>1}/><AdventureHeart filled={hp>2}/>
     {partner&&<span className="adventure-partner-health" role="img" aria-label={`${partner.name}: ${partner.hp} из 3`} title={`${partner.name}: ${partner.hp} из 3`}><AdventureHeart filled={partner.hp>0}/><small>{partner.hp}</small></span>}
    </div>
    <ActiveBalance amount={balance} atRisk={atRisk} compact/>
   </div>
   <div className="adventure-header-actions">
    <button className="adventure-pause" type="button" aria-label="Пауза · Escape" title="Пауза" disabled={pauseDisabled} onClick={onPause}><GameUiIcon kind="pause"/></button>
    <button className="adventure-pause dungeon-map-button" type="button" aria-label={mapLabel} title={mapLabel} disabled={mapDisabled} onClick={onMap}><GameUiIcon kind="map"/></button>
   </div>
  </div>
 </header>;
}
