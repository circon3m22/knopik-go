import type {WeaponUpgrades} from "./weapon-progression.ts";
import type {KnopikSkin} from "./knopik-skins.ts";
import type { CosmeticId } from "./cosmetic-engine.ts";
export type KnopikEquipment={weaponUpgrades?:WeaponUpgrades;skin?:KnopikSkin;hat:boolean;mohawk:boolean;accessory:CosmeticId|null};
export const EMPTY_EQUIPMENT:KnopikEquipment={hat:false,mohawk:false,accessory:null};
