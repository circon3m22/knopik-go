import type {AdventureLevel,LevelRect} from './adventure-levels';
import type {AdventureArea} from './adventure-engine';
import type {ThemeId} from './cosmetic-engine';
import {HOME_ROOMS} from './apartment-world';
import {ultraHomeSources,ultraRoomSources,ultraSmallSources} from './ultra-light-sources';
import {lightFloorExit,type RoomLight} from './ultra-light-geometry';

type FogShaft={x:number;y:number;angle:number;reach:number;width:number;aperture:number};
/** Fixed emitter, feathered cone, and a finite reach inside its room. */
function interiorShaft(l:RoomLight,r:LevelRect,floors?:readonly LevelRect[]):FogShaft{
 let dx=r.x+r.w*.5-l.x,dy=r.y+r.h*.65-l.y;
 const distance=Math.hypot(dx,dy);if(distance<8){dx=0;dy=1;}else{dx/=distance;dy/=distance;}
 const edge=floors?lightFloorExit(l,dx,dy,floors,l.radius):Math.min(dx>0?(r.x+r.w-l.x)/dx:dx<0?(r.x-l.x)/dx:Infinity,dy>0?(r.y+r.h-l.y)/dy:dy<0?(r.y-l.y)/dy:Infinity);
 return {x:l.x,y:l.y,angle:Math.atan2(dy,dx)*180/Math.PI,reach:Math.max(1,Math.min(310,l.radius*.86,edge-8)),width:Math.min(76,r.w*.15),aperture:l.aperture?l.aperture*.38:5};
}
/** Nested low-alpha contours soften the cone without filtering the pixel scene.
 * The emitter stays still while the surrounding mist flows independently. */
function UltraFogShaft({shaft:s,gradient}:{shaft:FogShaft;gradient:string}){
 return <g data-ultra-fog-shaft="volume-7" data-fog-emitter-x={s.x} data-fog-emitter-y={s.y} transform={`translate(${s.x} ${s.y}) rotate(${s.angle})`} pointerEvents="none">
  {[1,.72,.4].map((f,i)=><path key={f} d={`M0 ${-s.aperture*f}L${s.reach} ${-s.width*f}V${s.width*f}L0 ${s.aperture*f}Z`} fill={`url(#${gradient}-shaft-7)`} opacity={[.24,.32,.48][i]}/>)}
 </g>;
}

/** Soft alpha volumes keep the original pixel drawing crisp. No noise texture,
 * raster image, turbulence, blur or screen-sized filter. */
export function UltraMistGradient({id,color}:{id:string;color:string}){
 return <><radialGradient id={id}><stop stopColor={color} stopOpacity=".9"/><stop offset=".38" stopColor={color} stopOpacity=".64"/><stop offset=".7" stopColor={color} stopOpacity=".22"/><stop offset="1" stopColor={color} stopOpacity="0"/></radialGradient>
  <linearGradient id={`${id}-shaft-7`} x1="0" y1="0" x2="1" y2="0"><stop stopColor={color} stopOpacity=".86"/><stop offset=".24" stopColor={color} stopOpacity=".64"/><stop offset=".62" stopColor={color} stopOpacity=".25"/><stop offset="1" stopColor={color} stopOpacity="0"/></linearGradient></>;
}
export function UltraMistPatch({prefix,room:r,color,density,seed=0,clip,lit=false,lamp,gradient,shaft}:{prefix:string;room:LevelRect;color:string;density:number;seed?:number;clip?:string;lit?:boolean;lamp?:string;gradient?:string;shaft?:FogShaft}){
 const id=gradient??`${prefix}-mist-6`,shift=(seed%7-3)*.012*r.w;
 return <g data-ultra-haze-patch="mist-6" data-ultra-fog-density="volume-7" data-haze-lit={lit?'':undefined} data-haze-x={r.x-24} data-haze-y={r.y-24} data-haze-w={r.w+48} data-haze-h={r.h+48} data-haze-seed={seed} data-haze-lamp={lamp} clipPath={clip?`url(#${clip})`:undefined} opacity={density} pointerEvents="none">
  {!gradient&&<defs><UltraMistGradient id={id} color={color}/></defs>}
  {shaft&&<UltraFogShaft shaft={shaft} gradient={id}/>}
  <g data-ultra-haze-drift="0" opacity=".76">
   <ellipse cx={r.x+r.w*.48} cy={r.y+r.h*.4} rx={r.w*.45} ry={r.h*.43} fill={`url(#${id})`} opacity={lit?'.8':'.48'}/>
   <ellipse cx={r.x+r.w*.43+shift} cy={r.y+r.h*.63} rx={r.w*.38} ry={r.h*.17} fill={`url(#${id})`}/>
   <ellipse cx={r.x+r.w*.6-shift} cy={r.y+r.h*.29} rx={r.w*.32} ry={r.h*.065} fill={`url(#${id})`} opacity=".58"/>
  </g>
  <g data-ultra-haze-drift="1" opacity=".62">
   <ellipse cx={r.x+r.w*.55-shift} cy={r.y+r.h*.73} rx={r.w*.39} ry={r.h*.12} fill={`url(#${id})`}/>
   <ellipse cx={r.x+r.w*.34} cy={r.y+r.h*.53} rx={r.w*.25} ry={r.h*.085} fill={`url(#${id})`} opacity=".64"/>
   <ellipse cx={r.x+r.w*.63} cy={r.y+r.h*.85} rx={r.w*.27} ry={r.h*.055} fill={`url(#${id})`} opacity=".72"/>
   <ellipse cx={r.x+r.w*.28+shift} cy={r.y+r.h*.37} rx={r.w*.18} ry={r.h*.045} fill={`url(#${id})`} opacity=".5"/>
  </g>
 </g>;
}

/** Floor haze is room-bound; source-lit mist reuses the existing visibility clips. */
export function UltraInteriorHaze({prefix,area,level,theme='classic',legacy=false}:{prefix:string;area:AdventureArea;level:AdventureLevel;theme?:ThemeId;legacy?:boolean}){
 const home=area==='apartment'&&!legacy,small=area!=='sewer'&&!home,night=theme==='night'||theme==='observatory';
 const rooms:readonly LevelRect[]=home?HOME_ROOMS:small?[area==='basement'?{x:36,y:102,w:408,h:352}:{x:28,y:108,w:424,h:440}]:level.rooms;
 const zoneTints=['#a9cbc7','#d3c6ad','#b4cadc','#a4cdd8','#a6d8d1','#c7c4d8','#c9d1bf'];
 const color=area==='sewer'?zoneTints[(level.zone-1)%zoneTints.length]:area==='basement'?'#b8cbd0':night?'#bfcedd':'#d7e2dc';
 const density=area==='sewer'?[.4,.32,.32,.4,.36,.3,.32][(level.zone-1)%7]:area==='basement'?.38:night?.24:.2;
 const homeLights=home?ultraHomeSources(theme):small?ultraSmallSources(area==='basement',night):undefined;
 const plans=rooms.map((room,i)=>{
   const key=`${prefix}${small?'-small':''}-room-light-2-${i}`,lights=homeLights?.filter(l=>l.x>=room.x&&l.x<=room.x+room.w&&l.y>=room.y&&l.y<=room.y+room.h)??ultraRoomSources(room,level.palette.accent);
   const sources=lights.map((l,n)=>({light:l,index:n})).filter((_,n)=>home||small?n<2:n>=6);
   return {room,key,sources};
 });
 const tints=[...new Set(plans.flatMap(p=>p.sources.map(s=>s.light.color)))],ambient=`${prefix}-haze-ambient-6`;
 const passageClip=area==='sewer'?`${prefix}-passage-floor-8`:undefined;
 return <g data-ultra-interior-haze="mist-6" transform="scale(1 .82)" clipPath={passageClip?`url(#${passageClip})`:undefined} pointerEvents="none">
  <defs>{passageClip&&<clipPath id={passageClip}><path data-ultra-connected-floor="passage-8" d={level.floors.map(r=>`M${r.x} ${r.y}h${r.w}v${r.h}h-${r.w}Z`).join('')}/></clipPath>}<UltraMistGradient id={ambient} color={color}/>{tints.map((tint,i)=><UltraMistGradient key={tint} id={`${prefix}-haze-source-${i}`} color={tint}/>)}</defs>
  {plans.map(({room,key,sources},i)=>{
   return <g key={i} data-room-detail={area==='sewer'?i:undefined}>
    <UltraMistPatch prefix={`${prefix}-haze-room-${i}`} room={room} color={color} density={density} seed={i*7+(home?2:level.zone)} clip={passageClip??key} gradient={ambient}/>
    {sources.map(({light:l,index:n})=>{
     const shaft=interiorShaft(l,room,area==='sewer'?level.floors:undefined),angle=shaft.angle*Math.PI/180,ex=l.x+Math.cos(angle)*shaft.reach,ey=l.y+Math.sin(angle)*shaft.reach;
     const left=Math.max(area==='sewer'?-Infinity:room.x,Math.min(l.x,ex)-shaft.width),top=Math.max(area==='sewer'?-Infinity:room.y,Math.min(l.y,ey)-shaft.width),right=Math.min(area==='sewer'?Infinity:room.x+room.w,Math.max(l.x,ex)+shaft.width),bottom=Math.min(area==='sewer'?Infinity:room.y+room.h,Math.max(l.y,ey)+shaft.width);
     return <UltraMistPatch key={n} prefix={`${prefix}-haze-lit-${i}-${n}`} room={{x:left,y:top,w:right-left,h:bottom-top}} color={l.color} density={home?.28:.32} seed={i*13+n+17} clip={`${key}-${n}`} gradient={`${prefix}-haze-source-${tints.indexOf(l.color)}`} shaft={shaft} lit/>;
    })}
   </g>;
  })}
  {passageClip&&level.gates.map((gate,i)=>{
   const a=level.rooms[gate.from],b=level.rooms[gate.to],horizontal=gate.axis==='x',first=horizontal?a.x<b.x?a:b:a.y<b.y?a:b,last=first===a?b:a;
   const room=horizontal?{x:first.x+first.w-128,y:gate.y-20,w:last.x-first.x-first.w+256,h:gate.h+40}:{x:gate.x-20,y:first.y+first.h-128,w:gate.w+40,h:last.y-first.y-first.h+256};
   return <g key={i} data-ultra-passage-haze="passage-8"><UltraMistPatch prefix={`${prefix}-haze-passage-${i}`} room={room} color={color} density={density*.72} seed={211+i*17} clip={passageClip} gradient={ambient}/></g>;
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
   return <UltraMistPatch key={`${row}-${col}`} prefix={`${prefix}-street-haze-${row}-${col}`} room={room} color={color} density={night?row===2?.38:.3:row===2?.25:.18} seed={row*19+col*7} gradient={gradient}/>;
  }))}
 </g>;
}

export function UltraLampMist({prefix,x,y,top,lamp,index}:{prefix:string;x:number;y:number;top:number;lamp:string;index:number}){
 return <UltraMistPatch prefix={`${prefix}-lamp-mist-${index}`} room={{x:x-142,y:y-top-20,w:284,h:top+63}} color="#ffe0b1" density={.46} seed={index*11+5} lamp={lamp} gradient={`${prefix}-lamp-mist-gradient-6`} shaft={{x,y:y-top+10,angle:90,reach:top+18,width:top<100?43:88,aperture:6}} lit/>;
}
