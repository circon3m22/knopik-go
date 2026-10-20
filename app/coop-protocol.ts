import {readWeaponUpgrades} from "./weapon-progression.ts";
import {isKnopikSkin} from "./knopik-skins.ts";
import { WEAPON_ORDER } from "./adventure-levels.ts";
import { EMPTY_EQUIPMENT, type KnopikEquipment } from "./knopik-equipment-state.ts";
import type { AdventureInput } from "./adventure-engine.ts";
import type { AdventureWeapon } from "./adventure-levels.ts";

export const COOP_PROTOCOL = 7;
export const COOP_INPUT_MS = 50;
export const COOP_STATE_MS = 80;
export const COOP_STALE_MS = 1800;
export const COOP_CODE_PATTERN = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/;
export type CoopSlot = 0 | 1;
export type CoopControls = AdventureInput & { dodge: number; energy: number; action:number; interact: boolean; weapon: AdventureWeapon; paused: boolean };
export const idleCoopControls = (): CoopControls => ({x:0,y:0,attack:false,dodge:0,energy:0,action:0,interact:false,weapon:"pistol",paused:false});
export function normalizeCoopCode(value: string) { return value.toUpperCase().replace(/[\s-]/g, ""); }
export function coopInvite(code: string, origin: string, basePath: string) { return `${origin}${basePath.replace(/\/$/, "")}/?coop=${encodeURIComponent(code)}`; }
export function readCoopControls(value: unknown): CoopControls | null {
  if (!value || typeof value !== "object") return null;
  const p = value as Record<string,unknown>;
  if (typeof p.x!=="number" || typeof p.y!=="number" || !Number.isFinite(p.x) || !Number.isFinite(p.y) || typeof p.attack!=="boolean" || typeof p.interact!=="boolean" || typeof p.paused!=="boolean" || !Number.isSafeInteger(p.dodge) || (p.dodge as number)<0 || !WEAPON_ORDER.includes(p.weapon as AdventureWeapon) || !Number.isSafeInteger(p.action??0) || (p.action as number)<0 || !Number.isSafeInteger(p.energy??0) || (p.energy as number)<0) return null;
  const n=Math.max(1,Math.hypot(p.x,p.y));
  return {x:p.x/n,y:p.y/n,attack:p.attack,interact:p.interact,paused:p.paused,dodge:p.dodge as number,energy:(p.energy??0) as number,action:(p.action??0) as number,weapon:p.weapon as AdventureWeapon};
}
export type CoopMode="campaign"|"arcade"|"abyss";
export type CoopSetup={mode:CoopMode;level_id:number;host_equipment:KnopikEquipment;guest_equipment:KnopikEquipment};
export function readCoopEquipment(value:unknown):KnopikEquipment|null{
 if(!value||typeof value!=="object")return null;const e=value as KnopikEquipment;
 if(e.weaponUpgrades!==undefined&&!readWeaponUpgrades(e.weaponUpgrades))return null;
 if(e.skin!==undefined&&!isKnopikSkin(e.skin))return null;
 return typeof e.hat==="boolean"&&typeof e.mohawk==="boolean"&&(e.accessory===null||["sky-boots","bandana","charm","goggles","cape","ranger-hood","hunter-armor","raven-mask","hunter-cloak"].includes(e.accessory))?{...(e.weaponUpgrades===undefined?{}:{weaponUpgrades:readWeaponUpgrades(e.weaponUpgrades)!}),...(e.skin===undefined?{}:{skin:e.skin}),hat:e.hat,mohawk:e.mohawk,accessory:e.accessory}:null;
}
export const defaultCoopSetup=():CoopSetup=>({mode:"arcade",level_id:1,host_equipment:{...EMPTY_EQUIPMENT},guest_equipment:{...EMPTY_EQUIPMENT}});
export type CoopRoom = CoopSetup & {host_protocol:number;guest_protocol:number; id:string; code:string; host_id:string; guest_id:string|null; host_name:string; guest_name:string|null; host_ready:boolean; guest_ready:boolean; status:"waiting"|"playing"|"closed"; seed:number; round:number; expires_at:string };
export function readCoopRoom(value: unknown): CoopRoom | null {
  if (!value || typeof value!=="object") return null;
  const r=value as CoopRoom;
  if(![0,2,3,4,5,6,7].includes(r.host_protocol)||![0,2,3,4,5,6,7].includes(r.guest_protocol)||!["campaign","arcade","abyss"].includes(r.mode)||!Number.isSafeInteger(r.level_id)||r.level_id<1||r.level_id>(r.mode==="campaign"?35:9999)||!readCoopEquipment(r.host_equipment)||!readCoopEquipment(r.guest_equipment))return null;
  return typeof r.id==="string"&&/^[0-9a-f-]{36}$/.test(r.id)&&typeof r.code==="string"&&COOP_CODE_PATTERN.test(r.code)&&typeof r.host_id==="string"&&(r.guest_id===null||typeof r.guest_id==="string")&&typeof r.host_name==="string"&&(r.guest_name===null||typeof r.guest_name==="string")&&typeof r.host_ready==="boolean"&&typeof r.guest_ready==="boolean"&&["waiting","playing","closed"].includes(r.status)&&Number.isSafeInteger(r.seed)&&r.seed>0&&Number.isSafeInteger(r.round)&&r.round>=0&&typeof r.expires_at==="string" ? r : null;
}
/** Action serials survive lost packets; a held dodge never retriggers. */
export class CoopInputInbox {
  sequence=-1;
  lastDodge=0;
  receivedAt=-Infinity;
  controls=idleCoopControls();
  accept(sequence:unknown, controls:unknown, now:number) {
    const next=readCoopControls(controls);
    if(!Number.isSafeInteger(sequence)||(sequence as number)<=this.sequence||!next)return false;
    this.sequence=sequence as number;this.controls=next;this.receivedAt=now;return true;
  }
  takeDodge(){const serial=this.controls.dodge;if(serial<=this.lastDodge)return false;this.lastDodge=serial;return true;}
  fresh(now:number){return now-this.receivedAt<COOP_STALE_MS;}
}
