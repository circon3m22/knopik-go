import type {LevelRect} from './adventure-levels';
import type {ThemeId} from './cosmetic-engine';
import {HOME_ROOMS} from './apartment-world';
import {HOME_MATERIALS} from './apartment-materials';
/** Ground-space lighting: layered penumbra, contact occlusion, material glints,
 * reflected light and fine surface texture. Static geometry, no live blur. */
export function UltraWorldPass({prefix,rooms,casters}:{prefix:string;rooms:readonly LevelRect[];casters:readonly LevelRect[]}){
 return <g data-ultra-world="" pointerEvents="none"><defs>
 <radialGradient id={`${prefix}-ultra-radiance`}><stop stopColor="#e1f8ff" stopOpacity=".5"/><stop offset=".15" stopColor="#9bdeef" stopOpacity=".28"/><stop offset=".48" stopColor="#78b2d5" stopOpacity=".08"/><stop offset="1" stopColor="#a0dfff" stopOpacity="0"/></radialGradient>
 <linearGradient id={`${prefix}-ultra-shaft`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#f6f3d1" stopOpacity=".26"/><stop offset="1" stopColor="#b8e3f5" stopOpacity="0"/></linearGradient>
 <linearGradient id={`${prefix}-ultra-contact`} x2="0" y2="1"><stop stopColor="#081521" stopOpacity=".55"/><stop offset=".3" stopColor="#142c3d" stopOpacity=".18"/><stop offset="1" stopColor="#274452" stopOpacity="0"/></linearGradient>
 <linearGradient id={`${prefix}-ultra-reflection`} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#c3f2ec" stopOpacity=".18"/><stop offset=".3" stopColor="#8ccdda" stopOpacity=".055"/><stop offset="1" stopColor="#6da5c7" stopOpacity="0"/></linearGradient>
 <pattern id={`${prefix}-ultra-surface`} width="47" height="43" patternUnits="userSpaceOnUse"><path d="M3 11h6v1H3Zm22 20h11v1H25Zm-5-23h2v1h-2Z" fill="#d7f2ed" opacity=".2"/><path d="M12 23h5v1h-5Zm23-11h6v1h-6Z" fill="#112336" opacity=".2"/></pattern></defs>
 {rooms.map((r,i)=><g key={i} data-room-detail={i}>
   <defs><clipPath id={`${prefix}-ultra-room-${i}`}><rect x={r.x} y={r.y} width={r.w} height={r.h}/></clipPath></defs>
   <rect x={r.x} y={r.y} width={r.w} height={r.h} fill={`url(#${prefix}-ultra-surface)`}/><ellipse cx={r.x+r.w*.7} cy={r.y+r.h*.48} rx={r.w*.65} ry={r.h*.7} fill={`url(#${prefix}-ultra-radiance)`}/><path d={`M${r.x+r.w*.15} ${r.y+9}h${r.w*.22}l${r.w*.3} ${r.h*.65}h-${r.w*.44}Z`} fill={`url(#${prefix}-ultra-shaft)`}/><path d={`M${r.x+4} ${r.y+3}h${r.w-8}v1h-${r.w-8}Z`} fill="#fff9dd" opacity=".65"/>
   <g data-ultra-feature="indirect-light" clipPath={`url(#${prefix}-ultra-room-${i})`}>
     <rect x={r.x} y={r.y} width={r.w} height="38" fill={`url(#${prefix}-ultra-contact)`}/>
     <path d={`M${r.x+6} ${r.y+26}h3v${r.h-48}h-3Zm${r.w-15} 0h3v${r.h-48}h-3Z`} fill="#9bdae3" opacity=".12"/>
     <path d={`M${r.x+r.w*.2} ${r.y+10}h${r.w*.045}l${r.w*.31} ${r.h*.72}h-${r.w*.075}Z M${r.x+r.w*.31} ${r.y+10}h${r.w*.025}l${r.w*.24} ${r.h*.57}h-${r.w*.06}Z`} fill={`url(#${prefix}-ultra-shaft)`}/>
     <path d={`M${r.x+r.w*.24} ${r.y+r.h*.66}h${r.w*.38}v2h-${r.w*.38}Zm12 9h${r.w*.31}v1h-${r.w*.31}Zm-21 11h${r.w*.42}v1h-${r.w*.42}Z`} fill="#e0f5dc" opacity=".14"/>
     <path d={Array.from({length:6},(_,n)=>`M${r.x+Math.round(r.w*(.24+(n*17%37)/100))} ${r.y+Math.round(r.h*(.16+(n*11%51)/100))}h${n%2?1:2}v2h-${n%2?1:2}Z`).join(' ')} fill="#f5f1cc" opacity=".34"/>
   </g>
 </g>)}
 {casters.map((r,i)=><g key={i} data-ultra-feature="material-depth"><path d={`M${r.x-4} ${r.y+r.h-6}h${r.w+8}l56 37h-${r.w+20}Z`} fill="#091d35" opacity=".08"/><path d={`M${r.x} ${r.y+r.h-4}h${r.w}l30 22h-${r.w+3}Z`} fill="#091d35" opacity=".14"/>
   <path d={`M${r.x-3} ${r.y+r.h}h${r.w+6}l12 10h-${r.w+12}Z`} fill={`url(#${prefix}-ultra-contact)`}/>
   <path d={`M${r.x+3} ${r.y+r.h+5}h${Math.max(1,r.w-6)}l16 42h-${r.w+9}Z`} fill={`url(#${prefix}-ultra-reflection)`}/>
   <path d={`M${r.x-2} ${r.y+4}h1v${Math.max(1,r.h-4)}h-1Zm${r.w+5} ${r.h-4}h1v9h-1Z`} fill="#addbe4" opacity=".24"/>
   <rect x={r.x-2} y={r.y+r.h-2} width={r.w+4} height="5" fill="#101d2d" opacity=".4"/><path d={`M${r.x+2} ${r.y+2}h${r.w-4}v1h-${r.w-4}Zm0 2h1v${Math.max(1,r.h-8)}h-1Z`} fill="#e6f8f5" opacity=".65"/>
 </g>)}
 </g>;
}
/** Wall-side decor stays outside doors and walkable task geometry. */
export function ApartmentThemeDecor({theme,detail}:{theme:ThemeId;detail:number}){
 const m=HOME_MATERIALS[theme],r=HOME_ROOMS.find(r=>r.id==='living')!;
 return <g data-apartment-edition={theme} transform={`translate(${r.x+32} ${r.y+44})`} pointerEvents="none">
 {theme==='skyline'?<><path d="M0-48h110v10H0Zm8 10h94v42H8Z" fill={m.shade}/><path d="M12-35h86V0H12Z" fill={m.glass}/><path d="M16-32h30L23-3h-7Z" fill={m.shine} opacity=".5"/>{detail>0&&[0,1,2,3,4].map(i=><path key={i} d={`M${20+i*15}-10h8v${-8-i%3*5}h-8Z`} fill={m.mid}/>)}<path d="M-2 5h116v3H-2Z" fill={m.metal}/></>:theme==='observatory'?<><path d="M0-50h104V4H0Z" fill={m.metal}/><path d="M4-46h96V0H4Z" fill="#192b49"/><circle cx="52" cy="-24" r="18" fill="none" stroke={m.light} strokeWidth="1"/><path d="m24-30 19 8 18-15 18 18-21 10M43-22l15 13" fill="none" stroke={m.metal}/><path d="M114-25h8V9h-8Zm4 0-15 34h-5l17-37Zm0 0 18 34h5l-21-37Z" fill={m.metal}/><path d="m100-48 38 17-5 12-39-17Z" fill={m.mid}/></>:<><path d="M0-43h100V1H0Z" fill={m.shade}/><path d="M4-39h92v36H4Z" fill={m.light}/>{theme==='emerald'?<path d="M50-35 70-20 50-5 30-20Z" fill={m.metal}/>:theme==='mint'?<path d="M48-33h5v23h-5Zm-19 4h18v8H29Zm25 5h18v8H54Z" fill={m.fabric}/>:theme==='bath'?<path d="M12-32h76v4H12Zm0 10h76v4H12Zm0 10h76v4H12Z" fill={m.metal}/>:theme==='night'?<><path d="M46-34h13v5h-7v13h7v5H46v-5h-5v-13h5Z" fill={m.metal}/><path d="M18-30h2v2h-2Zm60 15h2v2h-2Z" fill={m.mid}/></>:<path d="M12-20 26-31 44-20 60-32 87-10H12Z" fill={m.fabric}/>}</>}
 {detail>=2&&<path d="M-4 10h118l12 7H8Z" fill={m.shade} opacity=".22"/>}
 </g>;
}
