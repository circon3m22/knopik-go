import type { NeighborhoodProgress } from "./neighborhood-progress";
export function ApartmentKeepsakes({items,night=false}:{items?:NeighborhoodProgress;night?:boolean}){
  if(!items||(items.quest<3&&!items.pebble&&!items.secret&&!Object.values(items.missions??{}).some(m=>m.status===2)))return null;
  const wood=night?"#536479":"#775442",trim=night?"#b99d8d":"#e4cc9b";
  return <g data-apartment-keepsakes="" aria-label="Памятные вещи из прогулок">
    <path d="M364 297h71v5h-71Zm7 5h5v8h-5Zm47 0h5v8h-5Z" fill={wood}/><path d="M364 297h71v2h-71Z" fill={trim}/>
    {items.quest===3&&<g data-keepsake="postcard"><path d="M371 268h27v29h-27Z" fill={wood}/><path d="M374 271h21v23h-21Z" fill="#ece3ca"/><path d="M376 273h17v17h-17Z" fill="#88b6b0"/><path d="M376 280h17v5h-17Z" fill="#537d75"/><path d="M378 276h6v6h-6Zm8 1h5v5h-5Z" fill="#d1aa7a"/><path d="M379 277h2v2h-2Zm8 2h2v2h-2Z" fill="#fff1d1"/><path d="M379 287h9v1h-9Z" fill="#c5ddd0"/></g>}
    {items.secret&&<g data-keepsake="lantern">{night&&<path d="M401 276h23v20h-23Z" fill="#f4d889" opacity=".15"/>}<path d="M408 271h10v5h-10Z" fill={wood}/><path d="M404 275h18v16h-18Z" fill={wood}/><path d="M407 277h12v12h-12Z" fill="#e4cc9b"/><path d="M410 277h3v12h-3Zm-4-1h13v2h-13Z" fill="#fff1d1"/><path d="M411 291h4v6h-4Z" fill={wood}/></g>}
    {items.pebble&&<g data-keepsake="pebble"><path d="M302 360h13v4h-13Z" fill="#48635e"/><path d="M302 359h3v-3h7v2h3v3h-13Z" fill="#88b6b0"/><path d="M305 357h5v2h-5Z" fill="#c5ddd0"/></g>}
    {Object.values(items.missions??{}).some(m=>m.status===2)&&<><path d="M364 349h71v5h-71Zm7 5h5v8h-5Zm47 0h5v8h-5Z" fill={wood}/><path d="M364 349h71v2h-71Z" fill={trim}/></>}
    {items.missions?.garden.status===2&&<g data-keepsake="mint"><path d="M368 338h17v11h-17Z" fill="#be8471"/><path d="M370 339h13v2h-13Z" fill={trim}/><path d="M375 325h3v14h-3Zm-6 3h7v7h-7Zm8-5h7v7h-7Z" fill="#537d75"/><path d="M371 329h3v3h-3Zm9-5h3v3h-3Z" fill="#88a980"/></g>}
    {items.missions?.cat.status===2&&<g data-keepsake="cat-portrait"><path d="M392 310h28v36h-28Z" fill={wood}/><path d="M395 313h22v30h-22Z" fill="#ece3ca"/><path d="M399 323h5v5h5v-5h5v13h-15Z" fill="#775442"/><path d="M402 330h9v5h-9Z" fill={trim}/><path d="M403 330h2v2h-2Zm5 0h2v2h-2Z" fill="#343041"/></g>}
    {items.missions?.shore.status===2&&<g data-keepsake="shell"><path d="M420 344h15v5h-15Zm2-4h11v4h-11Z" fill={trim}/><path d="M424 341h2v6h-2Zm5 0h2v6h-2Z" fill="#d1aa7a"/></g>}
    {items.missions?.lights.status===2&&<g data-keepsake="light-badge"><path d="M426 316h8v14h-8Z" fill="#be8471"/><path d="M424 328h12v10h-12Z" fill={wood}/><path d="M427 331h6v5h-6Z" fill="#e4cc9b"/></g>}
    {items.missions?.delivery.status===2&&<g data-keepsake="rita-mug"><path d="M299 363h16v13h-16Z" fill="#668eae"/><path d="M301 365h11v2h-11v7h-3v-9Z" fill="#88b6b0"/><path d="M314 366h7v8h-7v-2h4v-4h-4Z" fill={wood}/><path d="M303 371h7v2h-7Z" fill={trim}/></g>}
    {items.missions?.photos.status===2&&<g data-keepsake="photo-album"><path d="M263 359h25v17h-25Z" fill={wood}/><path d="M265 360h21v13h-21Z" fill="#537d75"/><path d="M268 363h10v7h-10Z" fill={trim}/><path d="M270 365h6v3h-6Z" fill="#88b6b0"/><path d="M281 361h3v11h-3Z" fill="#88a980"/></g>}
  </g>;
}
