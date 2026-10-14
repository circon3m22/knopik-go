import { QuickBuffArtwork } from "./quick-buff-artwork";
import type { AdventureLootBuff } from "./adventure-loot";
export function DungeonChestPickups({count}:{count:number}){
  return <g aria-hidden="true">{Array.from({length:count},(_,i)=><g key={i} data-chest-pickup={i} display="none">
    <ellipse data-loot-aura="" rx="31" ry="22" fill="#f4d889" opacity=".18"/>
    <g data-loot-coins=""><path d="M-20-11h23v3h5v24H3v4h-23v-4h-5V-8h5Z" fill="#775442"/><path d="M-18-8H1v3h4v18H1v4h-19v-4h-4V-5h4Z" fill="#dca95c"/><path d="M-8-22h23v4h5V7h-5v4H-8V7h-5v-25h5Z" fill="#775442"/><path d="M-6-19h19v4h4V4h-4v4H-6V4h-4v-19h4Z" fill="#f4d889"/><path d="M-6-18h18v4H-6Zm-4 4h4V1h-4Z" fill="#fff1d1"/><path d="M0-10h4v7l6-7h4L7-1l7 6H9L4 1v4H0Z" fill="#b78048"/></g>
    {(["food","zhivchik","heal","pepsi"] as AdventureLootBuff[]).map(kind=><g key={kind} data-loot-item={kind} display="none"><svg x="-25" y="-33" width="50" height="60" viewBox="0 0 64 76"><QuickBuffArtwork kind={kind}/></svg></g>)}
    <g data-loot-sparkles="" fill="#fff1d1"><path d="M-33-15h3v5h5v3h-5v5h-3v-5h-5v-3h5Zm60 22h3v4h4v3h-4v4h-3v-4h-4v-3h4Zm-10-35h3v6h-3Z"/></g>
  </g>)}</g>;
}
export function DungeonExitPointer(){return <g data-exit-pointer="" display="none" role="img" aria-label="Направление к выходу через открытые коридоры">
  <g data-exit-pointer-shape=""><path d="M-23-12H0v-14l31 26L0 26V12h-23Z" fill="#263949" stroke="#263949" strokeWidth="6" strokeLinejoin="round"/><path d="M-20-8H5v-11L26 0 5 19V8h-25Z" fill="#f4d889"/><path d="M-17-7H7v-6L21 0H-17Z" fill="#fff1d1"/></g>
  <text data-exit-pointer-label="" x="0" y="42" textAnchor="middle" fontSize="15" fontWeight="bold" fill="#fff1d1" stroke="#263949" strokeWidth="3" paintOrder="stroke">ВЫХОД</text>
</g>;}
