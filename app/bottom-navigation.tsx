import type { CSSProperties } from "react";
import { NavigationArtwork } from "./collectible-artwork";

type Props = {
  activeIndex: number;
  onSelect: (index: number) => void;
  locked?: boolean;
  computer?: boolean;
};

/** One navigation surface for the portrait, shop and apartment. */
export function BottomNavigation({ activeIndex, onSelect, locked = false, computer = false }: Props) {
  return <footer aria-label="Разделы игры" className="bottom-bar" style={{ "--nav-index": activeIndex } as CSSProperties}>
    <span className="nav-thumb" aria-hidden="true"/>
    {(computer ? ["shop","dog","settings"] as const : ["shop","dog","play"] as const).map((kind, index) => <button key={kind} className={`navigation-button ${index === 1 ? "home-nav" : ""} ${activeIndex === index ? "active" : ""}`} type="button" disabled={locked && index !== 2} aria-current={activeIndex === index ? "page" : undefined} onClick={() => onSelect(index)}>
      <NavigationArtwork kind={kind}/><span>{index === 0 ? "Магазин" : index === 1 ? "Кнопик" : computer ? "Настройки" : "Играть"}</span>
    </button>)}
  </footer>;
}
