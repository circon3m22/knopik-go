import {ADVENTURE_WEAPONS,WEAPON_ORDER,type AdventureWeapon} from './adventure-levels.ts';
export type WeaponUpgradeLevel=0|1|2|3;
export type WeaponUpgrades=Record<AdventureWeapon,WeaponUpgradeLevel>;
export const MAX_WEAPON_UPGRADE=3;
export const emptyWeaponUpgrades=():WeaponUpgrades=>Object.fromEntries(WEAPON_ORDER.map(id=>[id,0])) as WeaponUpgrades;
export function sanitizeWeaponUpgrades(value:unknown,unlockedTier=7):WeaponUpgrades{
 const raw=value&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,unknown>:{};
 return Object.fromEntries(WEAPON_ORDER.map(id=>{const n=raw[id];return[id,ADVENTURE_WEAPONS[id].tier<=unlockedTier&&typeof n==='number'&&Number.isFinite(n)?Math.max(0,Math.min(3,Math.floor(n))):0];})) as WeaponUpgrades;
}
/** Optional metadata remains bounded even when it arrives over Realtime. */
export function readWeaponUpgrades(value:unknown):WeaponUpgrades|null{
 if(!value||typeof value!=='object'||Array.isArray(value))return null;
 for(const[key,n]of Object.entries(value))if(!WEAPON_ORDER.includes(key as AdventureWeapon)||!Number.isInteger(n)||(n as number)<0||(n as number)>3)return null;
 return sanitizeWeaponUpgrades(value);
}
export function weaponUpgradeStats(upgrades:Partial<WeaponUpgrades>|undefined,weapon:AdventureWeapon){
 const level=upgrades?.[weapon]??0;
 return {level,damageMultiplier:1+level*.15,cooldownMultiplier:1-level*.04};
}
export function weaponUpgradePrice(weapon:AdventureWeapon,current:number){
 if(!Number.isInteger(current)||current<0||current>=3)return null;
 return Math.ceil([400,1200,2800][current]*(1+ADVENTURE_WEAPONS[weapon].tier*.25)/50)*50;
}
export function purchaseWeaponUpgrade(upgrades:WeaponUpgrades,wallet:number,unlockedTier:number,weapon:AdventureWeapon,expectedLevel:number){
 if(!Number.isInteger(unlockedTier)||unlockedTier<0||unlockedTier>7||!WEAPON_ORDER.includes(weapon)||!Number.isSafeInteger(wallet)||wallet<0||ADVENTURE_WEAPONS[weapon].tier>unlockedTier||upgrades[weapon]!==expectedLevel)return null;
 const price=weaponUpgradePrice(weapon,expectedLevel);if(price===null||wallet<price)return null;
 return {wallet:wallet-price,upgrades:{...upgrades,[weapon]:(expectedLevel+1) as WeaponUpgradeLevel},price};
}
export const equipmentWeaponUpgrades=(upgrades:WeaponUpgrades)=>WEAPON_ORDER.some(id=>upgrades[id]>0)?upgrades:undefined;
