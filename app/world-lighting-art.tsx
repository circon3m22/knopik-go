import type {AdventureLevel} from "./adventure-levels";
import {HOME_ROOMS,HOME_LIGHTS} from "./apartment-world";
import type {ThemeId} from "./cosmetic-engine";
/** Static 8-bit ambient passes. Baked SVG gradients and pixel details, no blur shaders, no per-frame allocation. */
export function ApartmentLightPass({prefix,theme}:{prefix:string;theme:ThemeId}){
 const night=theme==="night",color=night?"#9cb9ed":"#ffe0a6";
 return <g data-world-lighting="apartment" pointerEvents="none">
  <defs>
   <radialGradient id={`${prefix}-pro-ambient`}><stop stopColor={color} stopOpacity={night?".27":".23"}/><stop offset=".42" stopColor={color} stopOpacity=".12"/><stop offset="1" stopColor={color} stopOpacity="0"/></radialGradient>
   <linearGradient id={`${prefix}-pro-sunbeam`} x1="0" y1="0" x2=".75" y2="1"><stop stopColor={color} stopOpacity=".20"/><stop offset="1" stopColor={color} stopOpacity="0"/></linearGradient>
  </defs>
  {HOME_ROOMS.map((r,i)=><g key={r.id}>
   <ellipse cx={r.x+r.w*(i%2?.59:.35)} cy={r.y+r.h*.36} rx={Math.min(r.w*.45,280)} ry={Math.min(r.h*.4,195)} fill={`url(#${prefix}-pro-ambient)`}/>
   <path d={`M${r.x+9} ${r.y+12}h${r.w-18}v2h-${r.w-18}Zm0 ${r.h-24}h${r.w-18}v2h-${r.w-18}Z`} fill="#fff3d0" opacity=".13"/>
   {Array.from({length:9},(_,n)=>{const x=r.x+24+(n*137+i*47)%(r.w-48),y=r.y+27+(n*79+i*29)%(r.h-54);return <path key={n} d={`M${x} ${y}h${n%3?7:14}v1h-${n%3?7:14}Z`} fill={n%2?"#fff1d1":"#2e353f"} opacity={n%2?".25":".16"}/>;})}
  </g>)}
  {HOME_LIGHTS.map((l,i)=><g key={i}><ellipse cx={l.x} cy={l.y} rx="104" ry="83" fill={`url(#${prefix}-pro-ambient)`}/><path d={`M${l.x-10} ${l.y+12}h20v2h-20Zm-7 8h14v2h-14Z`} fill="#ffe5ab" opacity=".26"/></g>)}
  {!night&&<g data-window-light-beams=""><path d="M516 164h145l88 280H445Z" fill={`url(#${prefix}-pro-sunbeam)`}/><path d="M720 164h145l104 280H661Z" fill={`url(#${prefix}-pro-sunbeam)`}/><path d="M550 171h3l52 251h-5Zm228 0h3l52 251h-5Z" fill="#fff7de" opacity=".13"/></g>}
 </g>;
}
export function DungeonLightPass({prefix,level}:{prefix:string;level:AdventureLevel}){
 const p=level.palette;
 return <g data-world-lighting="dungeon" pointerEvents="none">
 <defs>
  <radialGradient id={`${prefix}-pro-lamp`}><stop stopColor={p.accent} stopOpacity=".48"/><stop offset=".32" stopColor={p.accent} stopOpacity=".22"/><stop offset="1" stopColor={p.accent} stopOpacity="0"/></radialGradient>
  <linearGradient id={`${prefix}-pro-beam`} x1="0" y1="0" x2=".7" y2="1"><stop stopColor={p.light} stopOpacity=".16"/><stop offset="1" stopColor={p.light} stopOpacity="0"/></linearGradient>
  <pattern id={`${prefix}-pro-grit`} width="96" height="87" patternUnits="userSpaceOnUse"><path d="M7 11h8v1H7Zm36 43h12v1H43Zm42-23h4v3h-4ZM20 68h8v2h-8Z" fill={p.dark} opacity=".45"/><path d="M23 17h5v1h-5Zm35 52h11v1H58Zm-45-20h3v2h-3Z" fill={p.light} opacity=".42"/></pattern>
 </defs>
 {level.rooms.map((r,i)=><g key={i}>
   <rect x={r.x+9} y={r.y+10} width={r.w-18} height={r.h-20} fill={`url(#${prefix}-pro-grit)`}/>
   <ellipse cx={r.x+52} cy={r.y+r.h*.34} rx="173" ry="164" fill={`url(#${prefix}-pro-lamp)`}/>
   <ellipse cx={r.x+r.w-52} cy={r.y+r.h*.67} rx="173" ry="164" fill={`url(#${prefix}-pro-lamp)`}/>
   <path d={`M${r.x+18} ${r.y+16}h${r.w-36}v3h-${r.w-36}Zm0 ${r.h-35}h${r.w-36}v2h-${r.w-36}Z`} fill={p.light} opacity=".25"/>
   <path d={`M${r.x+25} ${r.y+30}h142l80 195H${r.x+85}Z`} fill={`url(#${prefix}-pro-beam)`}/>
   {Array.from({length:7},(_,n)=>{const x=r.x+68+(n*113+i*53)%(r.w-134),y=r.y+70+(n*87+i*17)%(r.h-143);return <path key={n} d={`M${x} ${y}h${n%2?12:19}v2h-${n%2?12:19}Zm5 3h6v1h-6Z`} fill={n%2?p.dark:p.light} opacity={n%2?".36":".28"}/>;})}
 </g>)}
 </g>;
}
export function StreetLightPass({prefix,night}:{prefix:string;night:boolean}){
 return <g data-world-lighting="street" pointerEvents="none">
 <defs><radialGradient id={`${prefix}-pro-street-light`}><stop stopColor={night?"#ffdea8":"#fff1c3"} stopOpacity={night?".26":".13"}/><stop offset=".45" stopColor={night?"#f6c87b":"#fff2c4"} stopOpacity={night?".12":".045"}/><stop offset="1" stopColor="#fff2c4" stopOpacity="0"/></radialGradient></defs>
 {Array.from({length:22},(_,i)=>{const x=70+(i*137)%2230,y=190+(i*163)%1420;return <g key={i}><path d={`M${x} ${y}h${9+i%4*5}v2h-${9+i%4*5}Z`} fill={night?"#899b98":"#395f5b"} opacity=".25"/><path d={`M${x+12} ${y+13}h12v2h-12Z`} fill="#d4e2b8" opacity=".22"/></g>})}
 {Array.from({length:10},(_,i)=>{const x=80+i*219,y=i%2?1000:770;return <g key={i}><path d={`M${x} ${y}h84v2h-84Zm24 4h44v1h-44Z`} fill={night?"#d5b68c":"#fff3d0"} opacity=".32"/><path d={`M${x+16} ${y+11}h34v2h-34Z`} fill="#2c4b53" opacity=".20"/></g>})}
 {night&&[410,690,1020,1440,1900].map((x,i)=><ellipse key={i} cx={x} cy={i%2?930:690} rx="192" ry="142" fill={`url(#${prefix}-pro-street-light)`}/>)}
 {!night&&<path d="M0 198h2400v6H0Zm0 220h2400v3H0Z" fill="#fff7d8" opacity=".12"/>}
 </g>;
}
