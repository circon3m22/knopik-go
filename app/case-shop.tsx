import { CaseArtwork, CoinArtwork } from "./collectible-artwork";
import { COMMON_CASE_PRICE, BIG_CASE_PRICE, type CaseKind } from "./case-engine";

export function CaseShop({ common, big, vault, level, onOpen, onBuyCommon, onBuyBig, onRoad }: { common: number; big: number; vault: number; level: number; onOpen: (kind: CaseKind) => void; onBuyCommon: () => void; onBuyBig: () => void; onRoad: () => void }) {
  return <div className="shop-case-section">
    <div className="shop-case-inventory"><span>В запасе</span><strong>{common + big}</strong></div>
    <div className="case-list">
      {(["common", "big"] as const).map(kind => {
        const count = kind === "common" ? common : big;
        const price = kind === "common" ? COMMON_CASE_PRICE : BIG_CASE_PRICE;
        return <article key={kind} className={`case-card case-${kind}-card`}>
          <div className="case-miniature" aria-hidden="true"><CaseArtwork kind={kind} /></div>
          <div><small>{kind === "common" ? "3 НАГРАДЫ" : "5 НАГРАД"}</small><h3>{kind === "common" ? "Обычный кейс" : "Большой кейс"}</h3><p>{kind === "common" ? "Монеты, баффы и улучшения." : "Больше монет, баффов и улучшений одежды."}</p></div>
          <div className="case-card-actions"><button type="button" disabled={count < 1} onClick={() => onOpen(kind)}>Открыть · {count}</button><button type="button" className="case-buy" disabled={vault < price || count >= 99} onClick={kind === "common" ? onBuyCommon : onBuyBig}>Купить · {price.toLocaleString("ru-RU")} <span aria-hidden="true"><CoinArtwork /></span></button></div>
        </article>;
      })}
    </div>
    <button type="button" className="cases-road-link" onClick={onRoad}><span>Ежедневный кейс и награды</span><b>LVL {level}</b></button>
  </div>;
}
