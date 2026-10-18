import type {CSSProperties} from 'react';
import {CoinArtwork,AuraCoinArtwork} from './collectible-artwork';
/** Full wallet amounts: the active balance leads, aura sits beneath it. */
export function TapBalances({active,aura,pulse=0}:{active:number;aura:number;pulse?:number}){
 return <div className="tap-balances" role="group" aria-label="Балансы тапалки">
  {([{id:'kc',value:active,label:'Активный баланс',unit:'KC'},{id:'aura',value:aura,label:'AURA',unit:'AURA'}] as const).map(item=>{
   const value=item.value.toLocaleString('ru-RU');
   return <div className={`tap-balance tap-balance-${item.id}`} key={item.id} aria-label={`${item.label}: ${value} ${item.unit}`}>
    <span className="tap-balance-label">{item.id==='kc'?<CoinArtwork/>:<AuraCoinArtwork/>}<small>{item.label}</small></span>
    <strong key={item.id==='kc'?pulse:undefined} className={item.id==='kc'&&pulse?'balance-earned':undefined} style={{'--balance-em':Math.max(4,value.length*.59)} as CSSProperties} title={`${value} ${item.unit}`}>{value}</strong>
   </div>;
  })}
 </div>;
}
