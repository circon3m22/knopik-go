import type {KnopikSkin} from "./knopik-skins.ts";
import type { CosmeticId } from "./cosmetic-engine.ts";
export type KnopikEquipment={skin?:KnopikSkin;hat:boolean;mohawk:boolean;accessory:CosmeticId|null};
export const EMPTY_EQUIPMENT:KnopikEquipment={hat:false,mohawk:false,accessory:null};
