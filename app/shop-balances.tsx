import type {CSSProperties} from "react";
import {CoinArtwork,AuraCoinArtwork} from "./collectible-artwork";
export function ShopBalances({vault,aura}:{vault:number;aura:number}) {
 return <div className="shop-balances" aria-label="Баланс магазина">{([{kind:"kc",amount:vault,label:"Сейф · Кнопик Коин"},{kind:"aura",amount:aura,label:"AURA"}] as const).map(item=>{
  const value=item.amount.toLocaleString("ru-RU");
  return <div key={item.kind} className={`shop-balance shop-balance-${item.kind}`}><span className="shop-balance-label">{item.kind==="kc"?<CoinArtwork/>:<AuraCoinArtwork/>}<small>{item.label}</small></span><strong title={value} style={{"--balance-em":Math.max(4,value.length*.56)} as CSSProperties}>{value}</strong></div>;
 })}</div>;
}
