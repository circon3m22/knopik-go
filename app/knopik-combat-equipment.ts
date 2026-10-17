import type { AdventureWeapon } from "./adventure-levels.ts";
import type { KnopikEquipment } from "./knopik-equipment-state.ts";

export const ENERGY_WAVE = { cooldown: 30, duration: .62, radius: 230, damage: 4 } as const;

export const COMBAT_CLOTHING = {
  'ranger-hood':"Охотничья коллекция: лесной капюшон. Меняет внешний вид.",
  'hunter-armor':"Охотничья коллекция: кожаный доспех. Меняет внешний вид.",
  'raven-mask':"Охотничья коллекция: металлическая маска. Меняет внешний вид.",
  'hunter-cloak':"Охотничья коллекция: плащ следопыта. Меняет внешний вид.",
  hat: "В бою кувырок восстанавливается на 20% быстрее.",
  mohawk: "В бою кулак и сабля перезаряжаются на 20% быстрее.",
  bandana: "В бою одна хилка восстанавливает два сердца вместо одного.",
  charm: "В подземелье притягивает монеты почти вчетверо дальше.",
  goggles: "В бою перезарядка пистолета, дробовика, гранатомёта и дуговика на 15% короче.",
  cape: "Энергетическая волна во все стороны: 4 урона и рассеивание вражеских пуль. Перезарядка 30 секунд · Q.",
} as const;

export function clothingAttackMultiplier(equipment: KnopikEquipment, weapon: AdventureWeapon) {
  const melee = weapon === "fist" || weapon === "sabre";
  return melee ? equipment.mohawk ? .8 : 1 : equipment.accessory === "goggles" ? .85 : 1;
}

export function clothingRollCooldown(equipment: KnopikEquipment) {
  return .66 * (equipment.hat && !equipment.mohawk ? .8 : 1);
}

export function clothingHealHearts(equipment: KnopikEquipment) {
  return equipment.accessory === "bandana" ? 2 : 1;
}
