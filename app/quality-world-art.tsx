import {HOME_ARMORY} from "./home-armory";
import {HOME_ROOMS,HOME_CORRIDORS,HOME_SOLIDS} from './apartment-world';
import type {LevelRect} from './adventure-levels';
import type {NeighborhoodObject} from './neighborhood-map';
import type {StreetPalette} from './neighborhood-props';
export function LowApartmentGround({night=false}:{night?:boolean}){
 return <g data-low-world="apartment"><rect x="16" y="0" width="1352" height="1200" fill="#253340"/>{HOME_CORRIDORS.map((r,i)=><rect key={i} {...{x:r.x,y:r.y,width:r.w,height:r.h}} fill={night?'#526477':'#d7c8a8'}/>)}{HOME_ROOMS.map(r=><g key={r.id}><rect x={r.x-6} y={r.y-54} width={r.w+12} height={r.h+60} fill="#343041"/><rect x={r.x} y={r.y-48} width={r.w} height="48" fill={r.accent}/><rect x={r.x} y={r.y} width={r.w} height={r.h} fill={night?'#536576':'#d7c8a8'}/><text x={r.x+r.w/2} y={r.y-18} textAnchor="middle" fill="#343041" fontSize="16">{r.name}</text></g>)}</g>;
}
export function LowApartmentProps(){
 return <g>{HOME_SOLIDS.filter(r=>r!==HOME_ARMORY.body).map((r,i)=><g key={i} data-home-prop-y={r.y+r.h} transform={`translate(${r.x} ${(r.y+r.h)*.82}) scale(1 .82)`}><rect y={-r.h} width={r.w} height={r.h} fill={['#8c816c','#6d8c88','#a58b73'][i%3]}/><path d={`M0-${r.h}h${r.w}v5H0Z`} fill="#d7d6b9"/><path d={`M0-10h${r.w}v10H0Z`} fill="#4b5359"/></g>)}</g>;
}
export function LowStreetGround({p}:{p:StreetPalette}){
 return <g data-low-world="street"><rect width="2400" height="2050" fill={p.grass}/><path d="M120 580h1000v240H120ZM340 580h140v1080H340ZM2060 805h110v855h-110ZM0 790h2400v240H0Z" fill={p.paving}/><path d="M0 845h2400v135H0Z" fill={p.road}/><path d="M1350 800V628h90v-80h90V470h138v85h272v185h-100V645h-262v25h-110v130Z" fill={p.paving}/><path d="M0 1740h2400v310H0Z" fill={p.water}/><path d="M1870 1665h220v150h-220Z" fill={p.wood}/><path d="M0 910h2400v3H0Z" fill={p.trim}/></g>;
}
export function LowStreetProp({object:o,p}:{object:NeighborhoodObject;p:StreetPalette}){
 if(o.kind==='house')return <g><rect y={-(o.h??150)} width={o.w??180} height={o.h??150} fill={p.wood}/><rect x="6" y={-(o.h??150)+6} width={(o.w??180)-12} height="18" fill={p.trim}/><path d={`M${(o.w??180)/2-14}-52h28v38h-28Z`} fill={p.ink}/></g>;
 if(o.kind==='tree')return <g><rect x="-5" y="-65" width="10" height="65" fill={p.wood}/><path d="M-26-100h52v50h-52Z" fill={p.leaf}/></g>;
 const w=o.kind==='car'?176:o.kind==='bench'?116:o.kind==='kiosk'?130:o.kind==='planter'?80:22,h=o.kind==='kiosk'?94:o.kind==='lamp'?100:32;
 return <g><rect x={-w/2} y={-h} width={w} height={h} fill={p.wood}/><rect x={-w/2} y={-h} width={w} height="5" fill={p.trim}/>{o.kind==='lamp'&&<rect data-lamp-bulb="" x="-8" y="-104" width="16" height="8" fill="#e1cf97"/>}</g>;
}
/** Actual ground-space light/shadow geometry; no blur filter over the moving scene. */
export function WorldDepthPass({prefix,rooms,casters,lights=[],night=false}:{prefix:string;rooms:readonly LevelRect[];casters:readonly LevelRect[];lights?:readonly {x:number;y:number}[];night?:boolean}){
 return <g data-premium-world="" pointerEvents="none">
  <defs><radialGradient id={`${prefix}-premium-bounce`}><stop stopColor={night?'#8dbed7':'#fff1bb'} stopOpacity=".36"/><stop offset=".5" stopColor={night?'#8dbed7':'#ffe1a0'} stopOpacity=".12"/><stop offset="1" stopColor="#f4dcb0" stopOpacity="0"/></radialGradient><linearGradient id={`${prefix}-premium-depth`} x2="0" y2="1"><stop stopColor="#101e32" stopOpacity=".38"/><stop offset="1" stopColor="#101e32" stopOpacity="0"/></linearGradient></defs>
  {rooms.map((r,i)=><g key={i}><rect x={r.x} y={r.y} width={r.w} height="28" fill={`url(#${prefix}-premium-depth)`}/><path d={`M${r.x} ${r.y}h8v${r.h}h-8Zm${r.w-8} 0h8v${r.h}h-8Z`} fill="#132c3e" opacity=".18"/><path d={`M${r.x+20} ${r.y+12}h${r.w*.42}l${r.w*.2} ${r.h*.65}h-${r.w*.65}Z`} fill={night?'#82b7d3':'#ffefbb'} opacity=".065"/><ellipse cx={r.x+r.w*.38} cy={r.y+r.h*.65} rx={r.w*.35} ry={r.h*.28} fill={`url(#${prefix}-premium-bounce)`}/></g>)}
  {casters.map((r,i)=><g key={i}><path d={`M${r.x} ${r.y+r.h-5}h${r.w}l38 28h-${r.w}Z`} fill="#101c2c" opacity=".22"/><rect x={r.x-3} y={r.y+r.h-4} width={r.w+6} height="10" fill="#101c2c" opacity=".22"/><path d={`M${r.x+2} ${r.y+2}h${r.w-4}v2h-${r.w-4}Z`} fill="#fff0c9" opacity=".35"/></g>)}
  {lights.map((l,i)=><g key={i}><ellipse cx={l.x} cy={l.y+28} rx="130" ry="100" fill={`url(#${prefix}-premium-bounce)`}/><path d={`M${l.x-12} ${l.y+42}h24v2h-24Zm-8 9h16v1h-16Z`} fill="#fff0b6" opacity=".42"/></g>)}
 </g>;
}
