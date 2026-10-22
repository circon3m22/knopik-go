import type {AdventureLevel} from './adventure-levels';
import {HOME_LIGHTS,HOME_ROOMS} from './apartment-world';
import {NEIGHBORHOOD_LAMPS,NEIGHBORHOOD_OBJECTS} from './neighborhood-map';
import {UltraRadianceDefs} from './ultra-radiance-art';
/** Scattering above actors is subtle; direct light and shadows stay below them. */
export function UltraInteriorVeil({prefix,level,home=false}:{prefix:string;level:AdventureLevel;home?:boolean}){
 const key=`${prefix}-veil-3`;
 return <g data-ultra-volume-veil="layered-3" transform="scale(1 .82)" pointerEvents="none"><UltraRadianceDefs prefix={key} tint="#ffe0a2" sky="#8fc9e2"/>
  {home?HOME_LIGHTS.map((l,i)=>{const room=HOME_ROOMS.findIndex(r=>l.x>=r.x&&l.x<=r.x+r.w&&l.y>=r.y&&l.y<=r.y+r.h),height=[142,142,142,142,92,142,60][i];return <g key={i} clipPath={`url(#${prefix}-room-light-2-${room})`} opacity={i===6?'.28':'.45'}><ellipse cx={l.x} cy={l.y-height} rx="48" ry="33" fill={`url(#${key}-bloom)`}/></g>;}):level.rooms.map((r,i)=><g key={i} data-room-detail={i}>
   {[.23,.77].map((f,n)=>{const x=Math.round(r.x+r.w*f);return <g key={n} clipPath={`url(#${prefix}-room-light-2-${i}-${6+n})`}><ellipse cx={x} cy={r.y+16} rx="67" ry="39" fill={`url(#${key}-bloom)`} opacity=".55"/><path d={`M${x-18} ${r.y+20}h36l55 185h-146Z`} fill="#cef0eb" opacity=".024"/></g>;})}
  </g>)}
 </g>;
}
export function UltraStreetVeil({prefix,night}:{prefix:string;night:boolean}){
 if(!night)return null;
 const key=`${prefix}-street-veil-3`;
 return <g data-ultra-street-coronas="layered-3" pointerEvents="none"><UltraRadianceDefs prefix={key} tint="#ffd59a" sky="#9dcde2"/>
  {NEIGHBORHOOD_LAMPS.map(l=>{const short=NEIGHBORHOOD_OBJECTS.find(o=>o.id===l.id)?.variant===2,top=short?46:147;return <g key={l.id} data-ground-chunk="" data-x={l.x-70} data-y={l.y-top-60} data-w="140" data-h="120"><g data-ultra-lamp-corona={l.id} opacity=".45"><ellipse cx={l.x} cy={l.y-top} rx={short?35:59} ry={short?27:45} fill={`url(#${key}-bloom)`}/><path d={`M${l.x-16} ${l.y-top}h32v1h-32Zm15-11h2v23h-2Z`} fill="#ffecc4" opacity=".38"/></g></g>;})}
 </g>;
}
