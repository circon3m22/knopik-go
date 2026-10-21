import type {LevelRect} from './adventure-levels';
import {castPixelShadow,lightVisibilityPath,dungeonPixelLights,type PixelLight} from './ultra-light-geometry';
export function UltraWorldPass({prefix,rooms,casters,lights,color='#e9c394'}:{prefix:string;rooms:readonly LevelRect[];casters:readonly LevelRect[];lights?:readonly PixelLight[];color?:string}){
 const sources=lights??dungeonPixelLights(rooms,color);
 return <g data-ultra-world="materials-061" pointerEvents="none">
  <defs><pattern id={`${prefix}-light-dither`} width="4" height="4" patternUnits="userSpaceOnUse"><path d="M0 0h1v1H0Zm2 2h1v1H2Z" fill={color}/></pattern></defs>
  {rooms.map((r,i)=><g key={i} data-room-detail={i}>
   <defs><clipPath id={`${prefix}-ultra-room-${i}`}><rect x={r.x} y={r.y} width={r.w} height={r.h}/></clipPath></defs>
   <g clipPath={`url(#${prefix}-ultra-room-${i})`}>
    <path d={`M${r.x} ${r.y}h${r.w}v4h-${r.w}Zm0 4h4v${r.h-4}h-4Zm${r.w-4} 0h4v${r.h-4}h-4Z`} fill="#15202a" opacity=".38"/><path d={`M${r.x+4} ${r.y+4}h${r.w-8}v7h-${r.w-8}Zm0 7h4v${r.h-15}h-4Z`} fill="#202d36" opacity=".12"/>
    {sources.filter(l=>l.room===i).map((l,n)=>{const id=`${prefix}-visible-${i}-${n}`,local=casters.filter(c=>c.x<r.x+r.w&&c.x+c.w>r.x&&c.y<r.y+r.h&&c.y+c.h>r.y);return <g key={id} data-ultra-light={id} data-light-room={i} data-light-x={l.x} data-light-y={l.y} data-light-radius={l.radius}>
     <defs><clipPath id={id}><path data-ultra-light-clip={i} data-light-x={l.x} data-light-y={l.y} data-light-radius={l.radius} d={lightVisibilityPath(l,r,local)}/></clipPath></defs>
     <g clipPath={`url(#${id})`}>
      {[1,.72,.43].map((scale,k)=><path key={k} d={`M${Math.round(l.x-l.radius*scale*.5)} ${Math.round(l.y-l.radius*scale*.85)}h${Math.round(l.radius*scale)}l${Math.round(l.radius*scale*.43)} ${Math.round(l.radius*scale*.85)}l-${Math.round(l.radius*scale*.43)} ${Math.round(l.radius*scale*.85)}h-${Math.round(l.radius*scale)}l-${Math.round(l.radius*scale*.43)}-${Math.round(l.radius*scale*.85)}Z`} fill={k===0?`url(#${prefix}-light-dither)`:l.color} opacity={k===0?'.13':k===1?'.055':'.075'}/>)}
     </g>
    </g>;})}
    {casters.map((c,n)=>c.x+c.w>r.x&&c.x<r.x+r.w&&c.y+c.h>r.y&&c.y<r.y+r.h?<g key={n} data-ultra-caster={n}>
     <path d={castPixelShadow(c,sources.find(l=>l.room===i)??{x:r.x,y:r.y},45)} fill="#14202b" opacity=".2"/><path d={`M${c.x-2} ${c.y+c.h-2}h${c.w+4}v5h-${c.w+4}Z`} fill="#14202b" opacity=".42"/><path d={`M${c.x-4} ${c.y+c.h+3}h${c.w+8}v4h-${c.w+8}Z`} fill="#14202b" opacity=".1"/>
    </g>:null)}
   </g>
  </g>)}
 </g>;
}
