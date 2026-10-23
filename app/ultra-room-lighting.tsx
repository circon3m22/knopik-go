import type {LevelRect} from './adventure-levels';
import type {ThemeId} from './cosmetic-engine';
import {lightPolygon,lightVisibility,objectShadow,type RoomLight} from './ultra-light-geometry';
import {UltraRadianceDefs,UltraSourceLayers,UltraMotes,type UltraSurface} from './ultra-radiance-art';
import {ultraRoomSources} from './ultra-light-sources';
import {UltraIndirectLight} from './ultra-indirect-art';
/** Source-bound, occluded light. Original floor/wall textures remain untouched. */
export function UltraRoomLighting({prefix,rooms,casters,lights,night=false,color='#e2c894',surface='matte'}:{prefix:string;rooms:readonly LevelRect[];casters:readonly LevelRect[];lights?:readonly RoomLight[];night?:boolean;color?:string;surface?:UltraSurface}){
 return <g data-ultra-world="" data-ultra-lighting="source-bound-2" data-ultra-stack="layered-3" pointerEvents="none">
  <defs><linearGradient id={`${prefix}-contact-2`} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#142431" stopOpacity=".36"/><stop offset="1" stopColor="#142431" stopOpacity="0"/></linearGradient></defs>
  {rooms.map((r,i)=>{
   const local=casters.filter(s=>s.x<r.x+r.w&&s.x+s.w>r.x&&s.y<r.y+r.h&&s.y+s.h>r.y);
   const sources=lights?.filter(l=>l.x>=r.x&&l.x<=r.x+r.w&&l.y>=r.y&&l.y<=r.y+r.h)??ultraRoomSources(r,color);
   const tints=[...new Set(sources.map(l=>l.color))];
   const clip=`${prefix}-room-light-2-${i}`;
   return <g key={i} data-room-detail={i} data-ultra-feature="indirect-light"><defs><clipPath id={clip}><rect x={r.x} y={r.y} width={r.w} height={r.h}/></clipPath></defs>
    {tints.map((tint,n)=><UltraRadianceDefs key={tint} prefix={`${clip}-tint-${n}`} tint={tint} sky={night?'#83ace2':'#8acbd1'}/>)}
    <g clipPath={`url(#${clip})`}>
     <rect x={r.x} y={r.y} width={r.w} height="22" fill={`url(#${prefix}-contact-2)`}/>
     <path d={`M${r.x} ${r.y}h4v${r.h}h-4Zm${r.w-4} 0h4v${r.h}h-4Z`} fill="#132c39" opacity=".16"/>
     {sources.map((l,n)=>{const id=`${clip}-${n}`,shape=lightPolygon(lightVisibility(l,r,local));return <g key={n} data-ultra-source={`${i}-${n}`} data-ultra-source-color={l.color}>
      <defs><clipPath id={id}><path d={shape}/></clipPath><radialGradient id={`${id}-falloff`}><stop stopColor={l.color} stopOpacity={l.strength}/><stop offset=".22" stopColor={l.color} stopOpacity={l.strength*.75}/><stop offset=".6" stopColor={l.color} stopOpacity={l.strength*.22}/><stop offset="1" stopColor={l.color} stopOpacity="0"/></radialGradient></defs>
      <g clipPath={`url(#${id})`}><circle cx={l.x} cy={l.y} r={l.radius} fill={`url(#${id}-falloff)`}/><UltraSourceLayers prefix={`${clip}-tint-${tints.indexOf(l.color)}`} light={l} room={r} surface={surface} bar={!lights&&n>=6}/></g>
     </g>;})}
     <UltraIndirectLight prefix={clip} room={r} lights={sources} casters={local}/>
     {!lights&&<g data-ultra-ceiling-fixture="">
      {[.23,.77].map(f=>{const x=Math.round(r.x+r.w*f);return <g key={f}><path d={`M${x-37} ${r.y+3}h74v16h-74Z`} fill="#223942"/><path d={`M${x-33} ${r.y+5}h66v9h-66Z`} fill="#89aaa9"/><path d={`M${x-29} ${r.y+7}h58v5h-58Z`} fill="#e5f3dc"/><path d={`M${x-18} ${r.y+5}h3v10h-3Zm35 0h3v10h-3Z`} fill="#34525b"/></g>;})}
     </g>}
     {local.map((s,n)=>{const nearest=sources.reduce<RoomLight|undefined>((best,l)=>!best||Math.hypot(l.x-s.x,l.y-s.y)<Math.hypot(best.x-s.x,best.y-s.y)?l:best,undefined);return <g key={n} data-ultra-feature="material-depth">
      {nearest&&<><path d={objectShadow(s,nearest,38)} fill="#132432" opacity={night?'.12':'.10'}/><path d={objectShadow(s,nearest,18)} fill="#132432" opacity=".12"/></>}
      <path d={`M${s.x-2} ${s.y+s.h-3}h${s.w+4}v7h-${s.w+4}Z`} fill="#172936" opacity=".3"/>
      <path d={`M${s.x+5} ${s.y+s.h+5}h${Math.max(1,s.w-10)}v2h-${Math.max(1,s.w-10)}Z`} fill={night?'#88bfcf':color} opacity={surface==='wet'||surface==='polished'?'.23':'.1'}/>
     </g>;})}
     <path d={`M${r.x+5} ${r.y+3}h${r.w-10}v2h-${r.w-10}Z`} fill={night?'#a5c1d0':color} opacity=".36"/>
     <UltraMotes room={r} index={i} color={night?'#b5d8f0':'#fff1cb'}/>
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
  <defs><linearGradient id={`${prefix}-window-fade-2`} x1="0" y1="0" x2="0" y2="1"><stop stopColor={color} stopOpacity={night?'.22':'.37'}/><stop offset=".45" stopColor={color} stopOpacity={night?'.1':'.18'}/><stop offset="1" stopColor={color} stopOpacity="0"/></linearGradient>
   <linearGradient id={`${prefix}-window-glint-4`} x1="0" y1="0" x2="0" y2="1"><stop stopColor={color} stopOpacity="0"/><stop offset=".44" stopColor={color} stopOpacity=".16"/><stop offset=".5" stopColor="#fff7dc" stopOpacity=".6"/><stop offset=".58" stopColor={color} stopOpacity=".1"/><stop offset="1" stopColor={color} stopOpacity="0"/></linearGradient>
  </defs>
  <UltraRadianceDefs prefix={`${prefix}-window-layers`} tint={color} sky={night?'#8bb7e0':'#93d4db'}/>
  {panes.map(({x,w},i)=>{const id=`${prefix}-window-cast-2-${i}`,light={x:x+w/2,y:164,radius:340,color,strength:.2};return <g key={i}>
   <defs><clipPath id={id}><path d={lightPolygon(lightVisibility(light,room,casters))}/></clipPath></defs>
   <g clipPath={`url(#${id})`}>
    {Array.from({length:rows},(_,row)=>{const top=170+row*132,shift=row*23,reach=rows===1?255:120;return <path key={row} d={`M${x+shift} ${top}h${w}l${rows===1?48:24} ${reach}h-${w+5}Z`} fill={`url(#${prefix}-window-fade-2)`}/>;})}
    <path d={`M${x+3} 178h${w-6}v2h-${w-6}Z`} fill={color} opacity={night?'.12':'.35'}/>
    <ellipse cx={x+w/2+17} cy="270" rx={w*.72} ry="82" fill={`url(#${prefix}-window-layers-bounce)`} opacity=".7"/>
    <path d={`M${x+5} 184h${w-10}l28 198h-${w+8}Z`} fill={`url(#${prefix}-window-fade-2)`} opacity=".55"/>
    <path data-ultra-window-glint="radiant-4" d={`M${x+10} 225h${w-15}l27 112h-${w-3}Z`} fill={`url(#${prefix}-window-glint-4)`} opacity={night?'.26':'.48'}/>
    {(theme==='skyline'||theme==='emerald'||theme==='observatory')&&<ellipse cx={x+w/2+29} cy="365" rx={w*.7} ry="10" fill={`url(#${prefix}-window-layers-specular)`} opacity={night?'.27':'.52'}/>}
   </g>
  </g>;})}
 </g>;
}
/** The opening flat and basement receive the same light stack as the campaign. */
export function UltraSmallInterior({prefix,basement=false,casters,night=false}:{prefix:string;basement?:boolean;casters:readonly LevelRect[];night?:boolean}){
 const room=basement?{x:36,y:102,w:408,h:352}:{x:28,y:108,w:424,h:440};
 const lights=basement?[{x:56,y:120,radius:310,color:'#ffc883',strength:.42},{x:418,y:120,radius:300,color:'#8cced6',strength:.38}]:[{x:228,y:250,radius:220,color:'#ffdda0',strength:night?.42:.25},{x:228,y:113,radius:330,color:night?'#9fc6e7':'#fff0c6',strength:.28}];
 return <g data-ultra-small-interior={basement?'basement':'opening-flat'}><UltraRoomLighting prefix={`${prefix}-small`} rooms={[room]} casters={casters} lights={lights} night={night} surface={basement?'wet':'wood'}/>{basement&&[56,418].map(x=><g key={x}><path d={`M${x-13} 110h26v14h-26Z`} fill="#243b45"/><path d={`M${x-9} 113h18v7h-18Z`} fill={x===56?'#ffe6b5':'#b5e3e3'}/></g>)}</g>;
}
