import type { Ref } from "react";
import { ADVENTURE_WEAPONS, WEAPON_ORDER, type AdventureWeapon } from "./adventure-levels";
import { AdventureWeaponArt } from "./adventure-level-art";
import type { AdventurePhase } from "./adventure-engine";

export function AdventureWeaponPicker({ phase, weapon, weaponTier, onSelect, ref }: { phase: AdventurePhase; weapon: AdventureWeapon; weaponTier: number; onSelect: (weapon: AdventureWeapon) => void; ref?: Ref<HTMLDivElement> }) {
  return <div ref={ref} className="adventure-weapons dungeon-weapon-strip" role="group" aria-label="Выбор открытого оружия: клавиши 1–8">
    {WEAPON_ORDER.filter(id => ADVENTURE_WEAPONS[id].tier <= weaponTier).map(id => {
      const item = ADVENTURE_WEAPONS[id];
      return <button key={id} type="button" aria-pressed={weapon === id} aria-label={`${item.name}. Клавиша ${item.tier + 1}. ${weapon === id ? "Выбрано" : "Доступно"}`} title={`${item.name} · ${item.damage} урона · ${item.range} дальность · ${item.cooldown}с`} disabled={phase !== "playing"} onClick={() => onSelect(id)}>
        <AdventureWeaponArt weapon={id} icon/><span className="adventure-weapon-key" aria-hidden="true">{item.tier + 1}</span><small>{item.name}</small>
      </button>;
    })}
  </div>;
}
