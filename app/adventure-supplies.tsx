import type { ReactNode } from "react";
import { BUFF_CATALOG, BUFF_STOCK_LIMIT } from "./buff-shelf-engine";
import { QuickBuffArtwork } from "./quick-buff-artwork";
import type { AdventurePhase } from "./adventure-engine";

export type AdventureSupply = "heal" | "pepsi";
type Props = { phase: AdventurePhase; balance: number; healCount: number; shieldCount: number; canHeal: boolean; shieldReady: boolean; onBuy: (kind: AdventureSupply) => void; onHeal: () => void; onShield: () => void };

/** Pointer-down supports the second thumb while movement holds pointer capture. */
function SupplyAction({ children, disabled, label, action, className }: { children: ReactNode; disabled: boolean; label: string; action: () => void; className: string }) {
  return <button type="button" className={className} disabled={disabled} aria-label={label} title={label} onPointerDown={event => {
    if (disabled || event.button !== 0) return;
    event.preventDefault(); action();
  }} onClick={event => { if (!disabled && event.detail === 0) action(); }}>{children}</button>;
}

export function AdventureSupplies(props: Props) {
  const playing = props.phase === "playing";
  return <div className="adventure-supplies" role="group" aria-label="Припасы: купить в запас или использовать">
    {(["heal", "pepsi"] as const).map(kind => {
      const heal = kind === "heal", name = heal ? "Хилка" : "Щит", count = heal ? props.healCount : props.shieldCount;
      const price = BUFF_CATALOG[kind].price, active = !heal && props.shieldReady;
      const canUse = playing && count > 0 && (heal ? props.canHeal : !active);
      const canBuy = playing && count < BUFF_STOCK_LIMIT && props.balance >= price;
      return <section key={kind} className={`adventure-supply ${heal ? "is-heal" : "is-shield"} ${active ? "is-armed" : ""}`}>
        <SupplyAction className="adventure-supply-use" disabled={!canUse} label={`${name}: ${active ? "активен" : `в запасе ${count}`}. ${heal ? "Восстановить одно сердце · H" : "Спасает от гибели и потери денег · L"}`} action={heal ? props.onHeal : props.onShield}>
          <span className="adventure-supply-icon"><QuickBuffArtwork kind={kind}/><b>{active ? "✓" : `×${count}`}</b></span><small>{name}</small>
        </SupplyAction>
        <SupplyAction className="adventure-supply-buy" disabled={!canBuy} label={`Купить ${heal ? "хилку" : "щит"} в запас за ${price.toLocaleString("ru-RU")} активных KC${count >= BUFF_STOCK_LIMIT ? ". Запас полон" : props.balance < price ? ". Недостаточно активных монет" : ""}`} action={() => props.onBuy(kind)}>
          <span>+</span><small>{price.toLocaleString("ru-RU")}</small>
        </SupplyAction>
      </section>;
    })}
  </div>;
}
