import {dungeonIngredientPositions} from "./dungeon-ingredients";
import {LAB_MATERIALS} from "./laboratory-engine";
import {projectAdventureY} from "./adventure-projection";
import type {AdventureLevel} from "./adventure-levels";
import {LindenLeafSprite} from "./laboratory-material-icon";
/** Ingredient art is distinct from medical buffs: linden leaves have no box or cross. */
export function DungeonIngredientArtwork({layout}:{layout:AdventureLevel}){
 return <g data-world-ingredients="">{dungeonIngredientPositions(layout).map(p=>{const color=LAB_MATERIALS[p.material].color;return <g key={p.key} data-dungeon-ingredient={p.key} data-ingredient-kind={p.material} transform={`translate(${p.x} ${projectAdventureY(p.y)})`}>
  <ellipse rx="23" ry="8" cy="5" fill="#0e1c2c" opacity=".38"/>
  <ellipse cy="-14" rx="32" ry="30" fill={color} opacity=".13"/>
  {p.material==="leaf"?<g data-linden-world-pickup="">
    <g transform="translate(-19 -37) scale(1.6)"><LindenLeafSprite/></g>
    <path d="M0-3h3v11H0Zm3 7h6v3H3Z" fill="#b2d58f"/>
    <path d="M-26-22h5v-5h4v5h5v3h-9v5h-5Zm45-12h3v6h7v3h-7v6h-3v-6h-6v-3h6Z" fill="#a2d47a"/>
  </g>:<g>
    <path d="M-16-24H16v4h5v22h-5v4h-32V2h-5v-22h5Z" fill="#2c3340"/>
    <path d="M-13-21H13v4h5v16h-5v4h-26V-1h-5v-16h5Z" fill={color}/>
    <path d="M-10-20h17v4h5v8H7v-4h-17Z" fill="#fff5da" opacity=".62"/>
    <path d="M-4-18h8v7h7v6H4v7h-8v-7h-7v-6h7Z" fill="#fff1d1"/>
    <path d="M-20-30h6v-6h6v6h-6v6h-6ZM16-29h5v-6h4v6h5v5h-9v5h-5Z" fill={color}/>
   </g>}
 </g>})}</g>;
}
