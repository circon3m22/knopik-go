import {KnopikPawArt} from './knopik-paw-art';
import type {KnopikSkin} from './knopik-skins';
import type {AdventureWeapon} from './adventure-levels';
import {DungeonWeaponArtwork,WEAPON_DRAWINGS} from './dungeon-weapon-art';
export {DungeonChambers as LevelChambers} from './dungeon-scene-art';

export function AdventureWeaponArt({weapon,icon=false,skin}:{weapon:AdventureWeapon;icon?:boolean;skin?:KnopikSkin}){
 if(weapon==='fist'){const paw=<KnopikPawArt skin={skin}/>;return icon?<svg viewBox="0 0 32 32" shapeRendering="crispEdges" aria-hidden="true">{paw}</svg>:<g transform="translate(-4 -18)">{paw}</g>;}
 const drawing=<DungeonWeaponArtwork weapon={weapon}/>;
 return icon?<svg viewBox={weapon==='sabre'?'-16 -74 130 122':WEAPON_DRAWINGS[weapon].viewBox} shapeRendering="crispEdges" aria-hidden="true">{weapon==='sabre'?<g transform="rotate(-25 48 -6)">{drawing}</g>:drawing}</svg>:drawing;
}
