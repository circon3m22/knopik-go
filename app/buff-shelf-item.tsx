import { BUFF_CATALOG, buffStockLimit } from "./buff-shelf-engine";
import { PotionArtwork } from "./cosmetic-artwork";
import type { PotionKind } from "./pixel-artwork";
import type { ReactNode } from "react";
import { CoinArtwork } from "./collectible-artwork";
type Props = { kind: PotionKind; count: number; canUse: boolean; canBuy: boolean; active?: boolean; status?: string; artwork?: ReactNode; variant?: "bar"; recipeLocked?:boolean; useReason?:string; onUse: () => void; onBuy: () => void };

export function BuffShelfItem({ kind,count,canUse,canBuy,active=false,status,artwork,variant,recipeLocked=false,useReason,onUse,onBuy }: Props) {
  const item=BUFF_CATALOG[kind],premium=kind==="tralalero" || kind==="ballerina" || kind==="bombardiro" || kind==="verity";
  if(variant==="bar")return <div className="bar-drink-card" data-bar-drink={kind}>
    <button className="bar-drink-use" type="button" disabled={!canUse} onClick={onUse} aria-label={`${item.name}. ${count} в запасе. ${canUse?"Выпить":useReason??"Нет в запасе"}`}>
      <span className="bar-bottle-figure">{artwork??<PotionArtwork kind={kind}/>}<b className="bar-stock-count" aria-label={`В запасе ${count}`}>{count}</b></span>
      <strong className="bar-drink-name">{item.name}</strong>
      <span className="bar-drink-use-label">{canUse?"Выпить":useReason??(count>0?"Пока недоступно":"Нет в запасе")}</span>
    </button>
    <button type="button" className="bar-drink-buy" disabled={!canBuy||recipeLocked} onClick={onBuy} aria-label={recipeLocked?`${item.name}: приготовь в лаборатории, чтобы открыть покупку`:`Купить ${item.name} за ${item.price} активных KC`}>
      <strong>{recipeLocked?"Нужен рецепт":count>=buffStockLimit(kind)?"Запас полон":!canBuy?"Нужно KC":"Купить"}</strong>
      <span>{recipeLocked?"Лаборатория":<><CoinArtwork/>{item.price.toLocaleString("ru-RU")}</>}</span>
    </button>
  </div>;
  return <div className={`inventory-entry ${premium ? "is-premium" : ""}`}>
    <button className={`inventory-item inventory-${kind} ${active ? "is-active" : ""}`} type="button" disabled={!canUse} onClick={onUse} aria-label={`${item.name}. ${count} в запасе. ${status ? `${status}. ` : ""}Использовать`}>
      {artwork ?? <PotionArtwork kind={kind} />}
      <span className="inventory-copy"><strong>{item.name}</strong></span>
      <b className="inventory-count" aria-hidden="true">{status || count}</b>
    </button>
    <button type="button" className="inventory-price" disabled={!canBuy||recipeLocked} onClick={onBuy} aria-label={recipeLocked?`${item.name}: приготовь в лаборатории, чтобы открыть покупку`:`Купить ${item.name} за ${item.price} активных KC. В запасе ${count} из ${buffStockLimit(kind)}`}>
      <span className="inventory-buy-plus" aria-hidden="true">+</span><span>{item.price.toLocaleString("ru-RU")} KC</span>
    </button>
  </div>;
}
