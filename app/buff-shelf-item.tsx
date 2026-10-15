import { BUFF_CATALOG, buffStockLimit } from "./buff-shelf-engine";
import { PotionArtwork } from "./cosmetic-artwork";
import type { PotionKind } from "./pixel-artwork";
import type { ReactNode } from "react";
import { CoinArtwork } from "./collectible-artwork";
type Props = { kind: PotionKind; count: number; canUse: boolean; canBuy: boolean; active?: boolean; status?: string; artwork?: ReactNode; variant?: "bar"; onUse: () => void; onBuy: () => void };

export function BuffShelfItem({ kind,count,canUse,canBuy,active=false,status,artwork,variant,onUse,onBuy }: Props) {
  const item=BUFF_CATALOG[kind],premium=kind==="tralalero" || kind==="ballerina" || kind==="bombardiro" || kind==="verity";
  return <div className={`inventory-entry ${premium ? "is-premium" : ""}`}>
    <button className={`inventory-item inventory-${kind} ${active ? "is-active" : ""}`} type="button" disabled={!canUse} onClick={onUse} aria-label={`${item.name}. ${count} в запасе. ${status ? `${status}. ` : ""}Использовать`}>
      {artwork ?? <PotionArtwork kind={kind} />}
      <span className="inventory-copy"><strong>{item.name}</strong></span>
      {variant==="bar"&&<span className="bar-use-label">{count>0?"Выпить":"Нет в запасе"}</span>}
      <b className="inventory-count" aria-hidden="true">{status || count}</b>
    </button>
    <button type="button" className="inventory-price" disabled={!canBuy} onClick={onBuy} aria-label={`Купить ${item.name} за ${item.price} активных KC. В запасе ${count} из ${buffStockLimit(kind)}`}>
      {variant==="bar"?<span className="bar-buy-copy"><strong>{count>=buffStockLimit(kind)?"Запас полон":"Купить"}</strong><span><CoinArtwork/>{item.price.toLocaleString("ru-RU")}</span></span>:<><span className="inventory-buy-plus" aria-hidden="true">+</span><span>{item.price.toLocaleString("ru-RU")} KC</span></>}
    </button>
  </div>;
}
