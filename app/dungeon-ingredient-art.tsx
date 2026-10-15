import {dungeonIngredientPositions} from "./dungeon-ingredients";
import {LAB_MATERIALS} from "./laboratory-engine";
import {projectAdventureY} from "./adventure-projection";
import type {AdventureLevel} from "./adventure-levels";
/** Small grounded, color-coded pixel pickups with a static soft halo. */
export function DungeonIngredientArtwork({layout}:{layout:AdventureLevel}){
 return <g data-world-ingredients="">{dungeonIngredientPositions(layout).map(p=>{const color=LAB_MATERIALS[p.material].color;return <g key={p.key} data-dungeon-ingredient={p.key} data-ingredient-kind={p.material} transform={`translate(${p.x} ${projectAdventureY(p.y)})`}>
  <ellipse rx="23" ry="8" cy="5" fill="#0e1c2c" opacity=".38"/><circle cy="-11" r="32" fill={color} opacity=".12"/><path d="M-16-24H16v4h5v22h-5v4h-32V2h-5v-22h5Z" fill="#2c3340"/><path d="M-13-21H13v4h5v16h-5v4h-26V-1h-5v-16h5Z" fill={color}/><path d="M-10-20h17v4h5v8H7v-4h-17Z" fill="#fff5da" opacity=".62"/><path d="M-4-18h8v7h7v6H4v7h-8v-7h-7v-6h7Z" fill="#fff1d1"/>
  <path d="M-20-30h6v-6h6v6h-6v6h-6ZM16-29h5v-6h4v6h5v5h-9v5h-5Z" fill={color}/>
 </g>})}</g>;
}
