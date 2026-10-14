import type { StreetPalette } from "./neighborhood-props";
export function NeighborhoodWorkTools(){return <g data-work-tools="" display="none" aria-hidden="true">
  <g data-work-held="">
    <g data-work-tool="water" display="none"><path d="M-11-10h22V6h-22Z" fill="#263949"/><path d="M-8-7H8V3H-8Z" fill="#88b6b0"/><path d="M-7-6H6v3H-7Z" fill="#c5ddd0"/><path d="M8-6h13v5H8Zm11-5h6v12h-6Z" fill="#88b6b0"/><path d="M-11-15H1v7h-3v-4h-6v5h-3Z" fill="#775442"/></g>
    <g data-work-tool="repair" display="none"><path d="M-3-7h6v25h-6Z" fill="#263949"/><path d="M-1-5h2v21h-2Z" fill="#bfcab9"/><path d="M-8-20h5v9h6v-9h5v16H-8Z" fill="#8ea6a9"/><path d="M-6-18h2v8H4v-8h2v12H-6Z" fill="#c5ddd0"/></g>
    <g data-work-tool="collect" display="none"><path d="M-10-2h20v21h-20Z" fill="#263949"/><path d="M-7 1H7v16H-7Z" fill="#88a980"/><path d="M-5-8H5v8H2v-5h-4v5h-3Z" fill="#775442"/><path d="M-4 7h8v2h-8Z" fill="#c5ddd0"/></g>
    <g data-work-tool="photo" display="none"><path d="M-14-10h28v19h-28Z" fill="#263949"/><path d="M-10-13h9v5h-9Z" fill="#775442"/><path d="M-10-7h21V6h-21Z" fill="#536775"/><path d="M-3-6H7V5H-3Z" fill="#263949"/><path d="M-1-4H5v6H-1Z" fill="#88b6b0"/><path d="M0-3h3v2H0Z" fill="#c5ddd0"/><path d="M-10-5h5v3h-5Z" fill="#f4d889"/></g>
    <g data-work-tool="food" display="none"><path d="M-9-12H9v24H-9Z" fill="#775442"/><path d="M-6-9H6v18H-6Z" fill="#c7b58b"/><path d="M-5-5H5v7H-5Z" fill="#88a980"/><path d="M-2-3h4v3h-4Z" fill="#fff1d1"/></g>
    <g data-work-tool="feed" display="none"><path d="M-9-12H9v24H-9Z" fill="#775442"/><path d="M-6-9H6v18H-6Z" fill="#c7b58b"/><path d="M-5-5H5v7H-5Z" fill="#88a980"/><path d="M-2-3h4v3h-4Z" fill="#fff1d1"/></g>
  </g>
  <circle data-work-clock="" cx="0" cy="-77" r="17" fill="none" stroke="#f4d889" strokeWidth="3" strokeDasharray="0 107" transform="rotate(-90 0 -77)"/>
</g>;}
export function NeighborhoodWorkWorld({p}:{p:StreetPalette}){return <g data-work-world="" display="none" aria-hidden="true">

  <path data-work-water="" display="none" fill="none" stroke={p.night?"#b5e0de":"#62b3c2"} strokeWidth="4" strokeDasharray="5 4"/>
  <g data-work-droplets="" display="none" fill={p.waterLight}>{Array.from({length:9},(_,i)=><path key={i} data-work-drop={i} d="M-1-3h3v6h-3Z"/>)}</g>
  <g data-work-soil-splash="" display="none" fill={p.waterLight}><path d="M-18-4h5v2h-5Zm28 1h6v2h-6Zm-11 3h4v3h-4Z"/></g>
  <g data-work-transfer="" display="none"><path d="M-17-16h34v27h-34Z" fill="#775442"/><path d="M-14-13h28V8h-28Z" fill="#d1aa7a"/><path d="M-2-13h4V8h-4Zm-7 3h14v4H-9Z" fill="#fff1d1"/></g>
  <g data-work-picked-litter="" display="none"><g data-picked-litter="0"><path d="M-3-20h6v7h5V4H-8v-17h5Z" fill={p.metal}/><path d="M-5-10H5v10H-5Z" fill={p.water}/><path d="M-5-5H5v3H-5Z" fill={p.trim}/></g><g data-picked-litter="1"><path d="M-13-9h19v3h7V5h-26Z" fill={p.wall}/><path d="M-10-6h14v2h-14Z" fill={p.seam}/></g><g data-picked-litter="2"><path d="M-7-14H7V4H-7Z" fill={p.metal}/><path d="M-7-10H7v4H-7Z" fill={p.roof}/></g></g>
  <g data-work-food-bits="" display="none" fill={p.wood}>{Array.from({length:6},(_,i)=><path key={i} data-food-bit={i} d="M-2-2h4v4h-4Z"/>)}</g>
  <g data-work-new-bulb="" display="none"><path d="M-6-13H6v4h3v10H4v7H-4V1h-5V-9h3Z" fill="#f4d889"/><path d="M-4-10H3v10h-7Z" fill="#fff1d1"/><path d="M-4 7h8v5h-8Z" fill="#8ea6a9"/></g>
  <g data-work-photo="" display="none"><path d="M-19-27h38v46h-38Z" fill="#fff1d1"/><path d="M-15-23h30v28h-30Z" fill={p.water}/><path d="M-15-5h10v-7H7v9h8v8h-30Z" fill={p.leaf}/><path d="M-13 10h26v2h-26Z" fill="#ae8060"/></g>
  <g data-work-found="" display="none"><g data-found-kind="badge"><path d="M-10-11h20v22h-20Z" fill="#775442"/><path d="M-7-8H7V8H-7Z" fill="#e4cc9b"/><path d="M-1-6h5v9h-5Zm-4 4h3v7h-3Z" fill="#537d75"/></g><g data-found-kind="pebble"><path d="M-14-8h24v4h6v12h-28v-5h-2Z" fill={p.ink}/><path d="M-10-6h16v3h7v7h-22Z" fill={p.waterLight}/></g><g data-found-kind="secret"><path d="M-11-23h22v33h-22Z" fill={p.wood}/><path d="M-7-19H7V6H-7Z" fill="#e4cc9b"/><path d="M-2-17h4V4h-4Z" fill="#fff1d1"/><path d="M-4-28h8v5h-8Zm3 38h2v9h-2Z" fill={p.wood}/></g></g>
  <g data-work-success="" display="none"><path d="M-4-17h8v10h10v8H4v10H-4V1h-10v-8h10Z" fill="#b5d9b6"/><path d="M-3-9h4v5h6v-5h4v13H-3Z" fill="#fff1d1"/></g>
</g>;}

export function NeighborhoodWorkLadder({p}:{p:StreetPalette}){return <g data-work-ladder=""><path d="M-19 4h5l-8-113h-5Zm29 0h5L7-109H2Z" fill={p.ink}/><path d="M-17 2h2l-8-108h-2Zm29 0h2L6-106H4Z" fill={p.metal}/>{Array.from({length:7},(_,n)=><path key={n} d={`M${-16-n} ${-9-n*14}h28v4h-28Z`} fill={p.trim}/>)}<path d="M-22 2h10v4h-10Zm28 0h12v4H6Z" fill={p.wood}/></g>;}
