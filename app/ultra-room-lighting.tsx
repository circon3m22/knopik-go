import type {LevelRect} from './adventure-levels';
import type {ThemeId} from './cosmetic-engine';
import {lightPolygon,lightVisibility,objectShadow,type RoomLight} from './ultra-light-geometry';
/** Source-bound, occluded light. Original floor/wall textures remain untouched. */
export function UltraRoomLighting({prefix,rooms,casters,lights,night=false,color='#e2c894'}:{prefix:string;rooms:readonly LevelRect[];casters:readonly LevelRect[];lights?:readonly RoomLight[];night?:boolean;color?:string}){
 return <g data-ultra-world="" data-ultra-lighting="source-bound-2" pointerEvents="none">
  <defs><linearGradient id={`${prefix}-contact-2`} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#142431" stopOpacity=".36"/><stop offset="1" stopColor="#142431" stopOpacity="0"/></linearGradient></defs>
  {rooms.map((r,i)=>{
   const local=casters.filter(s=>s.x<r.x+r.w&&s.x+s.w>r.x&&s.y<r.y+r.h&&s.y+s.h>r.y);
   const sources=lights?.filter(l=>l.x>=r.x&&l.x<=r.x+r.w&&l.y>=r.y&&l.y<=r.y+r.h)??[
    ...[0,1].flatMap(side=>[98,Math.round(r.h*.52),r.h-84].map(y=>({x:side?r.x+r.w-27:r.x+27,y:r.y+y,radius:Math.min(400,r.w*.72),color,strength:.34}))),
    ...[.23,.77].map(f=>({x:Math.round(r.x+r.w*f),y:r.y+16,radius:Math.min(650,Math.max(r.w,r.h)*.76),color:'#d0e8e5',strength:.36})),
   ];
   const clip=`${prefix}-room-light-2-${i}`;
   return <g key={i} data-room-detail={i} data-ultra-feature="indirect-light"><defs><clipPath id={clip}><rect x={r.x} y={r.y} width={r.w} height={r.h}/></clipPath></defs>
    <g clipPath={`url(#${clip})`}>
     <rect x={r.x} y={r.y} width={r.w} height="22" fill={`url(#${prefix}-contact-2)`}/>
     <path d={`M${r.x} ${r.y}h4v${r.h}h-4Zm${r.w-4} 0h4v${r.h}h-4Z`} fill="#132c39" opacity=".16"/>
     {sources.map((l,n)=>{const id=`${clip}-${n}`,shape=lightPolygon(lightVisibility(l,r,local));return <g key={n} data-ultra-source={`${i}-${n}`}>
      <defs><clipPath id={id}><path d={shape}/></clipPath><radialGradient id={`${id}-falloff`}><stop stopColor={l.color} stopOpacity={l.strength}/><stop offset=".22" stopColor={l.color} stopOpacity={l.strength*.75}/><stop offset=".6" stopColor={l.color} stopOpacity={l.strength*.22}/><stop offset="1" stopColor={l.color} stopOpacity="0"/></radialGradient></defs>
      <g clipPath={`url(#${id})`}><circle cx={l.x} cy={l.y} r={l.radius} fill={`url(#${id}-falloff)`}/></g>
     </g>;})}
     {!lights&&<g data-ultra-ceiling-fixture="">
      {[.23,.77].map(f=>{const x=Math.round(r.x+r.w*f);return <g key={f}><path d={`M${x-37} ${r.y+3}h74v16h-74Z`} fill="#223942"/><path d={`M${x-33} ${r.y+5}h66v9h-66Z`} fill="#89aaa9"/><path d={`M${x-29} ${r.y+7}h58v5h-58Z`} fill="#e5f3dc"/><path d={`M${x-18} ${r.y+5}h3v10h-3Zm35 0h3v10h-3Z`} fill="#34525b"/></g>;})}
     </g>}
     {local.map((s,n)=>{const nearest=sources.reduce<RoomLight|undefined>((best,l)=>!best||Math.hypot(l.x-s.x,l.y-s.y)<Math.hypot(best.x-s.x,best.y-s.y)?l:best,undefined);return <g key={n} data-ultra-feature="material-depth">
      {nearest&&<><path d={objectShadow(s,nearest,38)} fill="#132432" opacity={night?'.12':'.10'}/><path d={objectShadow(s,nearest,18)} fill="#132432" opacity=".12"/></>}
      <path d={`M${s.x-2} ${s.y+s.h-3}h${s.w+4}v7h-${s.w+4}Z`} fill="#172936" opacity=".3"/>
     </g>;})}
     <path d={`M${r.x+5} ${r.y+3}h${r.w-10}v2h-${r.w-10}Z`} fill={night?'#a5c1d0':color} opacity=".36"/>
    </g>
   </g>;
  })}
 </g>;
}
/** Four panes, mullion shadows, and a reflected sky strip from each real window. */
export function UltraWindowLight({prefix,night,casters,theme='classic'}:{prefix:string;night:boolean;casters:readonly LevelRect[];theme?:ThemeId}){
 const room={x:480,y:160,w:424,h:440},color=night?'#a3c6e6':'#fff0c2';
 const panes=theme==='skyline'?[{x:501,w:119},{x:630,w:119},{x:763,w:119}]:theme==='observatory'?[{x:507,w:53},{x:568,w:118},{x:697,w:118},{x:829,w:52}]:[516,585,722,791].map(x=>({x,w:59}));
 const rows=theme==='skyline'||theme==='observatory'?1:2;
 return <g data-ultra-window-light="" pointerEvents="none">
  <defs><linearGradient id={`${prefix}-window-fade-2`} x1="0" y1="0" x2="0" y2="1"><stop stopColor={color} stopOpacity={night?'.16':'.28'}/><stop offset="1" stopColor={color} stopOpacity="0"/></linearGradient></defs>
  {panes.map(({x,w},i)=>{const id=`${prefix}-window-cast-2-${i}`,light={x:x+w/2,y:164,radius:340,color,strength:.2};return <g key={i}>
   <defs><clipPath id={id}><path d={lightPolygon(lightVisibility(light,room,casters))}/></clipPath></defs>
   <g clipPath={`url(#${id})`}>
    {Array.from({length:rows},(_,row)=>{const top=170+row*132,shift=row*23,reach=rows===1?255:120;return <path key={row} d={`M${x+shift} ${top}h${w}l${rows===1?48:24} ${reach}h-${w+5}Z`} fill={`url(#${prefix}-window-fade-2)`}/>;})}
    <path d={`M${x+3} 178h${w-6}v2h-${w-6}Z`} fill={color} opacity={night?'.12':'.35'}/>
   </g>
  </g>;})}
 </g>;
}
