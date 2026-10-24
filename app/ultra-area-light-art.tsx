import type {LevelRect} from './adventure-levels';
import {lightVisibility,lightPolygon,areaLightOpacity,type RoomLight} from './ultra-light-geometry';
/** Two emitter samples share the central falloff. Three total samples preserve
 * source energy while softening the silhouette of distant obstructions. */
export function UltraAreaWash({prefix,light,room,casters}:{prefix:string;light:RoomLight;room:LevelRect;casters:readonly LevelRect[]}){
 const spread=(light.aperture??0)*.36;
 return <g data-ultra-area-wash="cinematic-5"><defs><radialGradient id={`${prefix}-area-falloff`}>{[0,.22,.6,1].map((offset,i)=><stop key={i} offset={offset} stopColor={light.color} stopOpacity={areaLightOpacity(light.strength*[1,.75,.22,0][i],.22)}/>)}</radialGradient></defs>{[-1,1].map(side=>{
  const sample={...light,x:Math.max(room.x+1,Math.min(room.x+room.w-1,light.x+spread*side))},id=`${prefix}-area-${side<0?0:1}`;
  return <g key={side}><defs><clipPath id={id}><path d={lightPolygon(lightVisibility(sample,room,casters))}/></clipPath></defs><circle cx={sample.x} cy={sample.y} r={sample.radius} fill={`url(#${prefix}-area-falloff)`} clipPath={`url(#${id})`}/></g>;
 })}</g>;
}

/** Grazing light on the existing wall above the floor. The brick/metal drawing
 * remains intact; this pass only lights the wall behind real ceiling fixtures. */
export function UltraCeilingWash({prefix,room:r,lights}:{prefix:string;room:LevelRect;lights:readonly RoomLight[]}){
 const id=`${prefix}-wall-wash-5`;
 return <g data-ultra-ceiling-wash="cinematic-5"><defs><clipPath id={id}><rect x={r.x-12} y={r.y-30} width={r.w+24} height="30"/></clipPath><radialGradient id={`${id}-glow`}><stop stopColor="#e0f5ef" stopOpacity=".42"/><stop offset=".35" stopColor="#b1d8db" stopOpacity=".19"/><stop offset="1" stopColor="#8ebaca" stopOpacity="0"/></radialGradient></defs>
  <g clipPath={`url(#${id})`}>{lights.filter(l=>!!l.aperture).map((l,i)=><ellipse key={i} cx={l.x} cy={r.y+2} rx="99" ry="46" fill={`url(#${id}-glow)`}/>)}</g>
 </g>;
}
