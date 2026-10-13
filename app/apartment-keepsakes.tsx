import type { NeighborhoodProgress } from "./neighborhood-progress";
export function ApartmentKeepsakes({items,night=false}:{items?:NeighborhoodProgress;night?:boolean}){
  if(!items||(items.quest<3&&!items.pebble&&!items.secret))return null;
  const wood=night?"#536479":"#775442",trim=night?"#b99d8d":"#e4cc9b";
  return <g data-apartment-keepsakes="" aria-label="Памятные вещи из прогулок">
    <path d="M364 297h71v5h-71Zm7 5h5v8h-5Zm47 0h5v8h-5Z" fill={wood}/><path d="M364 297h71v2h-71Z" fill={trim}/>
    {items.quest===3&&<g data-keepsake="postcard"><path d="M371 268h27v29h-27Z" fill={wood}/><path d="M374 271h21v23h-21Z" fill="#ece3ca"/><path d="M376 273h17v17h-17Z" fill="#88b6b0"/><path d="M376 280h17v5h-17Z" fill="#537d75"/><path d="M378 276h6v6h-6Zm8 1h5v5h-5Z" fill="#d1aa7a"/><path d="M379 277h2v2h-2Zm8 2h2v2h-2Z" fill="#fff1d1"/><path d="M379 287h9v1h-9Z" fill="#c5ddd0"/></g>}
    {items.secret&&<g data-keepsake="lantern">{night&&<path d="M401 276h23v20h-23Z" fill="#f4d889" opacity=".15"/>}<path d="M408 271h10v5h-10Z" fill={wood}/><path d="M404 275h18v16h-18Z" fill={wood}/><path d="M407 277h12v12h-12Z" fill="#e4cc9b"/><path d="M410 277h3v12h-3Zm-4-1h13v2h-13Z" fill="#fff1d1"/><path d="M411 291h4v6h-4Z" fill={wood}/></g>}
    {items.pebble&&<g data-keepsake="pebble"><path d="M302 360h13v4h-13Z" fill="#48635e"/><path d="M302 359h3v-3h7v2h3v3h-13Z" fill="#88b6b0"/><path d="M305 357h5v2h-5Z" fill="#c5ddd0"/></g>}
  </g>;
}
