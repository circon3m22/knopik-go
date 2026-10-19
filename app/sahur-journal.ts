import {ADVENTURE_LEVELS,type DungeonSpawn} from './adventure-levels.ts';
export const SAHUR_KINDS=['grunt','gunner','charger','armored','demolisher','stalker','marksman','boss'] as const;
export type SahurKind=typeof SAHUR_KINDS[number];
export const sahurKind=(enemy:Pick<DungeonSpawn,'role'|'boss'|'kind'>):SahurKind=>enemy.boss?'boss':enemy.role??(enemy.kind==='gun'?'gunner':'grunt');
export function sanitizeSeenSahurs(value:unknown):SahurKind[]{const ids=new Set(Array.isArray(value)?value:[]);return SAHUR_KINDS.filter(id=>ids.has(id));}
/** A cleared campaign room cannot have left its active enemies undefeated.
 * Used only to recover pre-journal saves; future zones remain undiscovered. */
export function migrateSeenSahurs(completed:number):SahurKind[]{return sanitizeSeenSahurs(ADVENTURE_LEVELS.slice(0,Math.max(0,Math.min(35,Math.floor(completed)))).flatMap(l=>l.enemies.map(sahurKind)));}
export function encounteredSahurs(enemies:readonly (DungeonSpawn&{hp:number;awake?:boolean})[],room:number,player:{x:number;y:number}):SahurKind[]{
 const ids=new Set<SahurKind>();for(const e of enemies)if(e.hp>0&&e.awake!==false&&e.room===room&&(e.x-player.x)**2+(e.y-player.y)**2<=480**2)ids.add(sahurKind(e));return [...ids];
}
