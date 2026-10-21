import {getVisualProfile} from "./graphics-quality";
import type { AdventureLevel, LevelCover } from "./adventure-levels";

export function DungeonCover({ level, x, y, w, h, kind }: LevelCover & { level: AdventureLevel }) {
  const p=level.palette, face=kind==="crate"?"#775442":p.wall, front=kind==="pipe"?10:14;
  return <g data-cover-kind={kind} transform={`translate(${x} ${y})`}>
    <rect x="5" y="9" width={w} height={h} fill="#18232c55"/>
    <rect width={w} height={h} fill={p.dark}/><rect x="3" y="3" width={w-6} height={h-front} fill={face}/>
    <path d={`M4 3h${w-8}v4H4Zm0 ${h-front}h${w-8}v3H4Z`} fill={p.light}/>
    <rect x="3" y={h-front+3} width={w-6} height={front-6} fill={kind==="crate"?"#584a42":p.dark}/>
    {kind==="crate" && <g><path d={`M8 11h${w-16}m0 15H8m0 15h${w-16}m0 15H8M12 7v${h-23}m${w-24} 0V7`} fill="none" stroke="#ae8060" strokeWidth="4"/><path d={`M12 10l${w-24} ${h-29}m-${w-24} 0L${w-12} 10`} fill="none" stroke="#d1aa7a" strokeWidth="5"/><rect x={w/2-12} y={h/2-6} width="24" height="16" fill="#e4cc9b"/><path d={`M${w/2-8} ${h/2-2}h16v2h-16m0 4h8`} stroke="#775442" strokeWidth="2"/><path d={`M8 ${h-8}h6v3H8m${w-28} 0h6v3h-6`} fill="#ae8060"/></g>}
    {kind==="tank" && <g><rect x="8" y="10" width={w-16} height={h-32} fill={p.light}/><rect x="14" y="13" width={w-28} height={h-38} fill={p.wall}/><path d={`M8 23h${w-16}v7H8Zm0 ${h-58}h${w-16}v7H8Z`} fill={p.dark}/><circle cx={w/2} cy={h/2} r="14" fill={p.dark}/><circle cx={w/2} cy={h/2} r="10" fill={p.accent}/><path d={`M${w/2-2} ${h/2-8}h4v16h-4Zm-6 6h16v4h-16Z`} fill={p.dark}/><rect x="18" y="8" width="10" height="6" fill={p.accent}/><path d={`M10 ${h-9}h12v4H10m${w-44} 0h12v4h-12`} fill={p.light}/></g>}
    {kind==="pipe" && <g><rect x="4" y="7" width={w-8} height={h-18} fill="#69838b"/><path d={`M4 8h${w-8}v4H4Z`} fill="#a4b7b3"/>{Array.from({length:Math.floor(w/26)},(_,i)=><g key={i}><rect x={12+i*26} y="4" width="6" height={h-7} fill={p.dark}/><rect x={13+i*26} y="5" width="2" height={h-10} fill={p.light}/></g>)}</g>}
    {kind==="pillar" && <g><rect x="8" y="10" width={w-16} height={h-30} fill={p.light}/><rect x="11" y="13" width={w-22} height={h-35} fill={p.wall}/><path d={`M14 18h10v3h-10Zm${w-29} 14h-7v3h7Zm-${w-27} 12h10v3h-10Z`} fill={p.dark}/><path d={`M8 ${h-20}h${w-16}v5H8Z`} fill={p.light}/></g>}
    {kind==="rubble" && <g><path d={`M5 20h10V8h22v6h17V7h${w-59}v${h-25}h-12v10H17V${h-24}H5Z`} fill={p.light}/><path d={`M9 23h18V12h7v12h21v-7h${w-63}v${h-38}H48v12H23v-9H9Z`} fill={p.wall}/><path d={`M16 27h9v11h-9Zm26-8h8v7h-8Zm7 22h13v7H49Z`} fill={p.dark}/><path d={`M29 27l8 8m15-22 7 7`} fill="none" stroke="#b99d8d" strokeWidth="3"/></g>}
    {kind==="barricade" && <g><rect x="6" y="8" width={w-12} height={h-22} fill={p.light}/>{Array.from({length:Math.floor((w-12)/20)},(_,i)=><path key={i} d={`M${10+i*20} 8h8l-6 ${h-22}h-8Z`} fill={p.accent}/>)}<path d={`M9 ${h-11}h12v7H9m${w-42} 0h12v7h-12`} fill={p.wall}/></g>}
    {kind==="breakwater" && <g><rect x="8" y="10" width={w-16} height={h-28} fill={p.light}/><path d={`M12 13h${w-24}v4H12Zm0 ${h-37}h${w-24}v3H12Z`} fill={p.wall}/><path d={`M13 20h5v${h-42}h-5Zm${w-31} 0h5v${h-42}h-5Z`} fill={p.dark}/><path d={`M6 ${h-10}h${w-12}v3H6Z`} fill={p.accent}/></g>}
    {kind==="machine" && <g><rect x="9" y="11" width={w-18} height={h-31} fill={p.dark}/><rect x="14" y="16" width={w-44} height={h-43} fill="#263d45"/><path d={`M18 23h${w-56}v3H18m0 7h${w-62}v3H18`} fill={p.accent}/><rect x={w-25} y="18" width="8" height="8" fill="#88a980"/><rect x={w-25} y="31" width="8" height="8" fill="#b76253"/><path d={`M12 ${h-10}h${w-24}v3H12Z`} fill={p.light}/></g>}
    {getVisualProfile().detail===4&&<g data-ultra-cover-material={kind}>
      <path d={Array.from({length:Math.min(28,Math.floor(w*h/170))},(_,i)=>{const xx=7+(i*29)%Math.max(1,w-16),yy=8+(i*19)%Math.max(1,h-front-12);return `M${xx} ${yy}h${kind==="crate"?5+i%8:2+i%4}v1h-${kind==="crate"?5+i%8:2+i%4}Z`;}).join('')} fill={kind==="crate"?"#cda06e":p.light} opacity=".5"/>
      <path d={`M4 4h${w-8}v1H5v${h-front-6}H4ZM${w-6} 7h2v${h-11}h-2Z`} fill={kind==="crate"?"#e5bc85":p.light}/><path d={`M4 ${h-front+4}h${w-8}v3h-${w-8}Z`} fill={p.dark} opacity=".5"/>
    </g>}
    {[[5,5],[w-8,5],[5,h-front-5],[w-8,h-front-5]].map(([bx,by],i)=><rect key={i} x={bx} y={by} width="3" height="3" fill={p.dark}/>)}
  </g>;
}
