import type {LevelRect} from './adventure-levels';
import type {RoomLight} from './ultra-light-geometry';
export type UltraSurface='matte'|'wood'|'wet'|'polished';
/** Reused gradients are local to their emitters; no full-screen bloom filter. */
export function UltraRadianceDefs({prefix,tint,sky='#9ecedc'}:{prefix:string;tint:string;sky?:string}){
 return <defs>
  <radialGradient id={`${prefix}-bloom`}><stop stopColor="#fff9e8" stopOpacity=".78"/><stop offset=".17" stopColor={tint} stopOpacity=".5"/><stop offset=".44" stopColor={tint} stopOpacity=".16"/><stop offset="1" stopColor={tint} stopOpacity="0"/></radialGradient>
  <linearGradient id={`${prefix}-shaft`} x1="0" y1="0" x2="1" y2="0"><stop stopColor={tint} stopOpacity=".25"/><stop offset=".38" stopColor={tint} stopOpacity=".12"/><stop offset="1" stopColor={sky} stopOpacity="0"/></linearGradient>
  <radialGradient id={`${prefix}-beam-volume`} cx="0" cy=".5" r="1"><stop stopColor="#fff4d4" stopOpacity=".32"/><stop offset=".28" stopColor={tint} stopOpacity=".2"/><stop offset=".65" stopColor={tint} stopOpacity=".07"/><stop offset="1" stopColor={sky} stopOpacity="0"/></radialGradient>
  <radialGradient id={`${prefix}-bounce`}><stop stopColor={sky} stopOpacity=".26"/><stop offset=".45" stopColor={sky} stopOpacity=".105"/><stop offset="1" stopColor={sky} stopOpacity="0"/></radialGradient>
  <radialGradient id={`${prefix}-specular`}><stop stopColor="#fff9e2" stopOpacity=".68"/><stop offset=".28" stopColor={tint} stopOpacity=".38"/><stop offset="1" stopColor={tint} stopOpacity="0"/></radialGradient>
 </defs>;
}
/** Direct beam, air scattering, bounced sky and a material-specific floor lobe. */
export function UltraSourceLayers({prefix,light:l,room,surface='matte',bar=false}:{prefix:string;light:RoomLight;room:LevelRect;surface?:UltraSurface;bar?:boolean}){
 const dx=room.x+room.w/2-l.x,dy=room.y+room.h*.56-l.y,angle=Math.atan2(dy,dx)*180/Math.PI,reach=Math.min(l.radius*.75,240);
 const glossy=surface==='wet'||surface==='polished',distance=glossy?47:28;
 return <g data-ultra-radiance="layered-3">
  <g transform={`translate(${l.x} ${l.y}) rotate(${angle})`}>
   <path data-ultra-soft-beam="radiant-4" d={`M0-6 ${reach}-64v128L0 6Z`} fill={`url(#${prefix}-beam-volume)`}/>
   <path d={`M8-2 ${reach*.8}-12v18L8 2Z`} fill={`url(#${prefix}-shaft)`} opacity=".65"/>
   <ellipse cx={reach*.6} cy="0" rx={reach*.52} ry="51" fill={`url(#${prefix}-bounce)`} opacity=".6"/>
   <g data-ultra-floor-reflection={surface} opacity={glossy?'.85':surface==='wood'?'.32':'.18'}>
    <ellipse cx={distance} cy="0" rx={glossy?74:43} ry={glossy?17:8} fill={`url(#${prefix}-specular)`}/>
    {glossy&&<path d="M23-7h21v2H23Zm9 6h51v2H32Zm18 6h24v1H50Zm35-4h13v1H85Z" fill={l.color} opacity=".34"/>}
   </g>
  </g>
  {glossy&&<g data-ultra-emitter-reflection="radiant-4" opacity={surface==='wet'?'.6':'.76'}>
   <ellipse cx={l.x+8} cy={l.y+64} rx={bar?88:48} ry="28" fill={`url(#${prefix}-specular)`}/>
   <path d={bar?`M${l.x-23} ${l.y+46}h46v3h-46Zm-9 7h64v2h-64Zm11 9h42v1h-42Zm-5 8h52v1h-52Z`:`M${l.x-5} ${l.y+47}h10v3h-10Zm-3 9h16v2h-16Zm-5 8h26v1h-26Z`} fill={l.color} opacity=".48"/>
  </g>}
  <circle cx={l.x} cy={l.y} r="55" fill={`url(#${prefix}-bloom)`}/>
  <circle cx={l.x} cy={l.y} r="9" fill={`url(#${prefix}-specular)`}/>
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
