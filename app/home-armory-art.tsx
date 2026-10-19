import {HOME_MATERIALS} from './apartment-materials';
import {AdventureWeaponArt} from './adventure-level-art';
import {WEAPON_ORDER,ADVENTURE_WEAPONS} from './adventure-levels';
import type {WeaponUpgrades} from './weapon-progression';
import type {ThemeId} from './cosmetic-engine';
export function HomeArmoryArt({theme,weaponTier=0,upgrades,low=false}:{theme:ThemeId;weaponTier?:number;upgrades?:WeaponUpgrades;low?:boolean}){
 const m=HOME_MATERIALS[theme];
 return <g data-home-armory="" shapeRendering="crispEdges">
  <path d="M-52-122H52V0H-52Z" fill="#203039"/><path d="M-48-118h96V-4h-96Z" fill={m.body}/>
  <path d="M-44-112h88v17h-88Zm0 23h88v35h-88Zm0 42h88v35h-88Z" fill="#263b40"/>
  <path d="M-48-118h96v4h-96Zm0 64h96v5h-96Zm0 47h96v5h-96Z" fill={m.light}/>
  {!low&&<path d="M-47-109h2v50h-2Zm92 0h2v50h-2ZM-47-42h2v32h-2Zm92 0h2v32h-2ZM-41-96h82v2h-82Zm0 42h82v2h-82Z" fill={m.shade}/>}
  <text y="-100" textAnchor="middle" fontSize="12" fill="#e5dfbd">АРСЕНАЛ</text>
  {WEAPON_ORDER.map((w,i)=>{const x=-43+i%4*22,y=-86+Math.floor(i/4)*41,locked=ADVENTURE_WEAPONS[w].tier>weaponTier;return <g key={w} transform={`translate(${x} ${y})`} data-rack-weapon={w} data-rack-locked={locked}>
   <path d="M0 0h20v29H0Z" fill="#1b2e35"/>
   {low?<path d="M3 10h13v3H3Zm0 3h4v8H3Z" fill={locked?'#526160':'#bcc8af'}/>:<g opacity={locked?.24:1}><svg x="1" y="0" width="18" height="24"><AdventureWeaponArt weapon={w} icon/></svg></g>}
   {locked?<path d="M7 11h6v3h2v10H5V14h2Zm2 2v2h2v-2Zm0 5v3h2v-3Z" fill="#d6b675"/>:[0,1,2].map(n=><path key={n} d={`M${3+n*5} 25h3v2h-3Z`} fill={n<(upgrades?.[w]??0)?'#d6bf80':'#59776a'}/>)}
  </g>;})}
  {!low&&<><path d="M-51-118h3v112h-3Zm100 0h3v112h-3Z" fill="#697b71"/><path d="M-43-113h4v3h-4Zm82 0h4v3h-4ZM-43-10h4v3h-4Zm82 0h4v3h-4Z" fill="#ccb98a"/></>}
 </g>;
}
