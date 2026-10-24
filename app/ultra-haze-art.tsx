import type {AdventureLevel,LevelRect} from './adventure-levels';
import type {AdventureArea} from './adventure-engine';
import type {ThemeId} from './cosmetic-engine';
import {HOME_ROOMS} from './apartment-world';
import {ultraHomeSources,ultraRoomSources,ultraSmallSources} from './ultra-light-sources';

/** Soft alpha volumes keep the original pixel drawing crisp. No noise texture,
 * raster image, turbulence, blur or screen-sized filter. */
export function UltraMistGradient({id,color}:{id:string;color:string}){
 return <radialGradient id={id}><stop stopColor={color} stopOpacity=".9"/><stop offset=".38" stopColor={color} stopOpacity=".64"/><stop offset=".7" stopColor={color} stopOpacity=".22"/><stop offset="1" stopColor={color} stopOpacity="0"/></radialGradient>;
}
export function UltraMistPatch({prefix,room:r,color,density,seed=0,clip,lit=false,lamp,gradient}:{prefix:string;room:LevelRect;color:string;density:number;seed?:number;clip?:string;lit?:boolean;lamp?:string;gradient?:string}){
 const id=gradient??`${prefix}-mist-6`,shift=(seed%7-3)*.012*r.w;
 return <g data-ultra-haze-patch="mist-6" data-haze-x={r.x-24} data-haze-y={r.y-8} data-haze-w={r.w+48} data-haze-h={r.h+16} data-haze-seed={seed} data-haze-lamp={lamp} clipPath={clip?`url(#${clip})`:undefined} opacity={density} pointerEvents="none">
  {!gradient&&<defs><UltraMistGradient id={id} color={color}/></defs>}
  <g data-ultra-haze-drift="0" opacity=".76">
   <ellipse cx={r.x+r.w*.48} cy={r.y+r.h*.4} rx={r.w*.42} ry={r.h*.4} fill={`url(#${id})`} opacity={lit?'.7':'.35'}/>
   <ellipse cx={r.x+r.w*.43+shift} cy={r.y+r.h*.63} rx={r.w*.35} ry={r.h*.13} fill={`url(#${id})`}/>
  </g>
  <g data-ultra-haze-drift="1" opacity=".62">
   <ellipse cx={r.x+r.w*.55-shift} cy={r.y+r.h*.73} rx={r.w*.37} ry={r.h*.095} fill={`url(#${id})`}/>
   <ellipse cx={r.x+r.w*.34} cy={r.y+r.h*.53} rx={r.w*.25} ry={r.h*.085} fill={`url(#${id})`} opacity=".64"/>
  </g>
 </g>;
}

/** Floor haze is room-bound; source-lit mist reuses the existing visibility clips. */
export function UltraInteriorHaze({prefix,area,level,theme='classic',legacy=false}:{prefix:string;area:AdventureArea;level:AdventureLevel;theme?:ThemeId;legacy?:boolean}){
 const home=area==='apartment'&&!legacy,small=area!=='sewer'&&!home,night=theme==='night'||theme==='observatory';
 const rooms:readonly LevelRect[]=home?HOME_ROOMS:small?[area==='basement'?{x:36,y:102,w:408,h:352}:{x:28,y:108,w:424,h:440}]:level.rooms;
 const zoneTints=['#a9cbc7','#d3c6ad','#b4cadc','#a4cdd8','#a6d8d1','#c7c4d8','#c9d1bf'];
 const color=area==='sewer'?zoneTints[(level.zone-1)%zoneTints.length]:area==='basement'?'#b8cbd0':night?'#bfcedd':'#d7e2dc';
 const density=area==='sewer'?[.28,.22,.21,.28,.24,.2,.21][(level.zone-1)%7]:area==='basement'?.25:night?.15:.12;
 const homeLights=home?ultraHomeSources(theme):small?ultraSmallSources(area==='basement',night):undefined;
 const plans=rooms.map((room,i)=>{
   const key=`${prefix}${small?'-small':''}-room-light-2-${i}`,lights=homeLights?.filter(l=>l.x>=room.x&&l.x<=room.x+room.w&&l.y>=room.y&&l.y<=room.y+room.h)??ultraRoomSources(room,level.palette.accent);
   const sources=lights.map((l,n)=>({light:l,index:n})).filter((_,n)=>home||small?n<2:n>=6);
   return {room,key,sources};
 });
 const tints=[...new Set(plans.flatMap(p=>p.sources.map(s=>s.light.color)))],ambient=`${prefix}-haze-ambient-6`;
 return <g data-ultra-interior-haze="mist-6" transform="scale(1 .82)" pointerEvents="none">
  <defs><UltraMistGradient id={ambient} color={color}/>{tints.map((tint,i)=><UltraMistGradient key={tint} id={`${prefix}-haze-source-${i}`} color={tint}/>)}</defs>
  {plans.map(({room,key,sources},i)=>{
   return <g key={i} data-room-detail={area==='sewer'?i:undefined}>
    <UltraMistPatch prefix={`${prefix}-haze-room-${i}`} room={room} color={color} density={density} seed={i*7+(home?2:level.zone)} clip={key} gradient={ambient}/>
    {sources.map(({light:l,index:n})=><UltraMistPatch key={n} prefix={`${prefix}-haze-lit-${i}-${n}`} room={{x:Math.max(room.x,l.x-103),y:Math.max(room.y,l.y-25),w:Math.min(206,room.w),h:Math.min(230,room.h*.55)}} color={l.color} density={home?.11:.18} seed={i*13+n+17} clip={`${key}-${n}`} gradient={`${prefix}-haze-source-${tints.indexOf(l.color)}`} lit/>)}
   </g>;
  })}
 </g>;
}

/** World patches overlap softly and are culled independently; no camera overlay. */
export function UltraStreetHaze({prefix,night}:{prefix:string;night:boolean}){
 const color=night?'#a9c4d4':'#d5e1d5',gradient=`${prefix}-street-haze-gradient-6`;
 return <g data-ultra-street-haze="mist-6" transform="scale(1 .82)" pointerEvents="none">
  <defs><UltraMistGradient id={gradient} color={color}/></defs>
  {[690,1260,1775].flatMap((y,row)=>Array.from({length:8},(_,col)=>{
   const room={x:col*640-120,y:y-195,w:720,h:390};
   return <UltraMistPatch key={`${row}-${col}`} prefix={`${prefix}-street-haze-${row}-${col}`} room={room} color={color} density={night?row===2?.22:.17:row===2?.15:.1} seed={row*19+col*7} gradient={gradient}/>;
  }))}
 </g>;
}

export function UltraLampMist({prefix,x,y,top,lamp,index}:{prefix:string;x:number;y:number;top:number;lamp:string;index:number}){
 return <UltraMistPatch prefix={`${prefix}-lamp-mist-${index}`} room={{x:x-142,y:y-top-20,w:284,h:top+63}} color="#ffe0b1" density={.3} seed={index*11+5} lamp={lamp} gradient={`${prefix}-lamp-mist-gradient-6`} lit/>;
}
