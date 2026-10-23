import type {AdventureLevel} from './adventure-levels';
import {HOME_LIGHTS,HOME_ROOMS} from './apartment-world';
import {NEIGHBORHOOD_LAMPS,NEIGHBORHOOD_OBJECTS} from './neighborhood-map';
import {UltraRadianceDefs} from './ultra-radiance-art';
/** Scattering above actors is subtle; direct light and shadows stay below them. */
export function UltraInteriorVeil({prefix,level,home=false}:{prefix:string;level:AdventureLevel;home?:boolean}){
 const key=`${prefix}-veil-3`;
 return <g data-ultra-volume-veil="layered-3" transform="scale(1 .82)" pointerEvents="none"><UltraRadianceDefs prefix={key} tint={home?"#ffe0a2":"#d0e8e5"} sky="#8fc9e2"/>{home&&<UltraRadianceDefs prefix={`${key}-reactor`} tint="#8ce4cf" sky="#8fc9e2"/>}
  {home?HOME_LIGHTS.map((l,i)=>{const room=HOME_ROOMS.findIndex(r=>l.x>=r.x&&l.x<=r.x+r.w&&l.y>=r.y&&l.y<=r.y+r.h),height=[142,142,142,142,92,142,60][i];return <g key={i} clipPath={`url(#${prefix}-room-light-2-${room})`} opacity={i===6?'.28':'.45'}><ellipse cx={l.x} cy={l.y-height} rx="48" ry="33" fill={`url(#${i===6?key+'-reactor':key}-bloom)`}/></g>;}):level.rooms.map((r,i)=><g key={i} data-room-detail={i}>
   {[.23,.77].map((f,n)=>{const x=Math.round(r.x+r.w*f);return <g key={n} clipPath={`url(#${prefix}-room-light-2-${i}-${6+n})`}><ellipse cx={x} cy={r.y+16} rx="76" ry="45" fill={`url(#${key}-bloom)`} opacity=".68"/><path d={`M${x-18} ${r.y+20}h36l55 185h-146Z`} fill="#cef0eb" opacity=".04"/></g>;})}
  </g>)}
 </g>;
}
export function UltraStreetVeil({prefix,night}:{prefix:string;night:boolean}){
 if(!night)return null;
 const key=`${prefix}-street-veil-3`;
 return <g data-ultra-street-coronas="layered-3" pointerEvents="none"><UltraRadianceDefs prefix={key} tint="#ffd59a" sky="#9dcde2"/>
  <defs><linearGradient id={`${key}-volume-4`} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#fff1cd" stopOpacity=".22"/><stop offset=".35" stopColor="#ffd69e" stopOpacity=".09"/><stop offset="1" stopColor="#ffd69e" stopOpacity="0"/></linearGradient></defs>
  {NEIGHBORHOOD_LAMPS.map(l=>{const short=NEIGHBORHOOD_OBJECTS.find(o=>o.id===l.id)?.variant===2,top=short?46:147;return <g key={l.id} data-ground-chunk="" data-x={l.x-85} data-y={l.y-top-60} data-w="170" data-h={top+100}><g data-ultra-lamp-corona={l.id} opacity=".6"><path data-ultra-lamp-volume="radiant-4" d={`M${l.x-6} ${l.y-top+10}h12l${short?30:60} ${top+8}h-${short?72:132}Z`} fill={`url(#${key}-volume-4)`}/><ellipse cx={l.x} cy={l.y-top} rx={short?42:73} ry={short?33:55} fill={`url(#${key}-bloom)`}/><path d={`M${l.x-16} ${l.y-top}h32v1h-32Zm15-11h2v23h-2Z`} fill="#ffecc4" opacity=".38"/></g></g>;})}
 </g>;
}
