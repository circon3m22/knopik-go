import type { AdventureWeapon } from "./adventure-levels";
import { DungeonRangedWeapon } from "./dungeon-weapon-art";
export { DungeonChambers as LevelChambers } from "./dungeon-scene-art";

export function AdventureWeaponArt({ weapon, icon = false }: { weapon: AdventureWeapon; icon?: boolean }) {
  if(weapon==="shotgun"||weapon==="launcher"||weapon==="arc"){const drawing=<DungeonRangedWeapon weapon={weapon}/>;return icon?<svg viewBox="-26 -29 112 57" shapeRendering="crispEdges" aria-hidden="true">{drawing}</svg>:drawing;}
  const drawing=weapon==="fist" ? <g><path d="M1-15h22v19h-4v9H3V4H-2V-8h3Z" fill="#343041"/><path d="M3-13h18V2h-4v9H5V2H0v-8h3Z" fill="#f3e2c0"/><path d="M6-12v11m5-11v11m5-11v11M4 2h13" fill="none" stroke="#a86739" strokeWidth="2"/></g> : weapon==="sabre" ? <g><path d="M-6-4H4v8H-6Z" fill="#775442"/><path d="M3-10h4v6h9v6H7v8H3Z" fill="#e4cc89"/><path d="M10-6h18v-3h15v-4h11v-6h7v9h-6v7h-9v5H28v3H10Z" fill="#343041"/><path d="M12-4h17v-3h15v-4h11v-5h3v5h-5v6h-8v5H29v3H12Z" fill="#a4b7b3"/><path d="M14-4h15v-2h16v-4h9v-3h3v3h-5v5h-9v4H29v2H14Z" fill="#fff1d1"/><path d="M-4-2h6v2h-6Z" fill="#d1aa7a"/></g> : <g><path d="M-4-12h37v15H12v4H6v11H-3V4H-6V-8h2Z" fill="#20232e"/><path d="M-2-10h32v9H11v4H4v12H0V1h-2Z" fill="#69838b"/><path d="M0-10h27v3H0Z" fill="#c7d6ce"/><path d="M1 4h3v11H1Z" fill="#775442"/><path d="M28-8h4v9h-4Z" fill="#263d45"/><path d="M9 3h8v7H9V8h5V5H9Z" fill="#20232e"/></g>;
  return icon ? <svg viewBox={weapon==="sabre"?"-8 -22 74 45":"-10 -20 48 42"} shapeRendering="crispEdges" aria-hidden="true">{drawing}</svg> : drawing;
}
