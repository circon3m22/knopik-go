import type {LevelRect} from './adventure-levels';
import type {RoomLight} from './ultra-light-geometry';
export type UltraSurface='matte'|'wood'|'wet'|'polished';
/** Reused gradients are local to their emitters; no full-screen bloom filter. */
export function UltraRadianceDefs({prefix,tint,sky='#9ecedc'}:{prefix:string;tint:string;sky?:string}){
 return <defs>
  <radialGradient id={`${prefix}-bloom`}><stop stopColor="#fff5d9" stopOpacity=".6"/><stop offset=".17" stopColor={tint} stopOpacity=".38"/><stop offset=".44" stopColor={tint} stopOpacity=".11"/><stop offset="1" stopColor={tint} stopOpacity="0"/></radialGradient>
  <linearGradient id={`${prefix}-shaft`} x1="0" y1="0" x2="1" y2="0"><stop stopColor={tint} stopOpacity=".19"/><stop offset=".38" stopColor={tint} stopOpacity=".08"/><stop offset="1" stopColor={sky} stopOpacity="0"/></linearGradient>
  <radialGradient id={`${prefix}-bounce`}><stop stopColor={sky} stopOpacity=".2"/><stop offset=".45" stopColor={sky} stopOpacity=".08"/><stop offset="1" stopColor={sky} stopOpacity="0"/></radialGradient>
  <radialGradient id={`${prefix}-specular`}><stop stopColor="#fff6d9" stopOpacity=".48"/><stop offset=".28" stopColor={tint} stopOpacity=".28"/><stop offset="1" stopColor={tint} stopOpacity="0"/></radialGradient>
 </defs>;
}
/** Direct beam, air scattering, bounced sky and a material-specific floor lobe. */
export function UltraSourceLayers({prefix,light:l,room,surface='matte'}:{prefix:string;light:RoomLight;room:LevelRect;surface?:UltraSurface}){
 const dx=room.x+room.w/2-l.x,dy=room.y+room.h*.56-l.y,angle=Math.atan2(dy,dx)*180/Math.PI,reach=Math.min(l.radius*.75,240);
 const glossy=surface==='wet'||surface==='polished',distance=glossy?47:28;
 return <g data-ultra-radiance="layered-3">
  <g transform={`translate(${l.x} ${l.y}) rotate(${angle})`}>
   <path d={`M0-6 ${reach}-64v128L0 6Z`} fill={`url(#${prefix}-shaft)`}/>
   <path d={`M8-2 ${reach*.8}-12v18L8 2Z`} fill={`url(#${prefix}-shaft)`} opacity=".65"/>
   <ellipse cx={reach*.6} cy="0" rx={reach*.52} ry="51" fill={`url(#${prefix}-bounce)`} opacity=".6"/>
   <g data-ultra-floor-reflection={surface} opacity={glossy?'.85':surface==='wood'?'.32':'.18'}>
    <ellipse cx={distance} cy="0" rx={glossy?74:43} ry={glossy?17:8} fill={`url(#${prefix}-specular)`}/>
    {glossy&&<path d="M23-7h21v2H23Zm9 6h51v2H32Zm18 6h24v1H50Zm35-4h13v1H85Z" fill={l.color} opacity=".34"/>}
   </g>
  </g>
  <circle cx={l.x} cy={l.y} r="39" fill={`url(#${prefix}-bloom)`}/>
  <path d={`M${l.x-12} ${l.y}h24v1h-24Zm11-7h2v15h-2Z`} fill="#fff1c9" opacity=".28"/>
 </g>;
}
/** A handful of lit motes share one path and one transform per room. */
export function UltraMotes({room,index=0,color='#fff0c5'}:{room:LevelRect;index?:number;color?:string}){
 const r=room;
 return <g data-ultra-air-patch="" data-air-x={r.x} data-air-y={r.y} data-air-w={r.w} data-air-h={r.h} pointerEvents="none">
  <path data-ultra-air-drift="" d={Array.from({length:10},(_,n)=>{const x=Math.round(r.x+22+(n*71+index*37)%Math.max(1,r.w-44)),y=Math.round(r.y+24+(n*53+index*19)%Math.max(1,r.h-48));return `M${x} ${y}h${n%4?1:2}v1h-${n%4?1:2}Z`;}).join('')} fill={color} opacity=".5"/>
 </g>;
}
