import type {LevelRect} from './adventure-levels';
import {incidentRadiance,wallBounceSamples} from './ultra-irradiance';
import {lightPolygon,lightVisibility,type RoomLight} from './ultra-light-geometry';

/** One diffuse return from a lit wall, clipped again so it cannot cross furniture. */
export function UltraIndirectLight({prefix,room,lights,casters}:{prefix:string;room:LevelRect;lights:readonly RoomLight[];casters:readonly LevelRect[]}){
 const samples=wallBounceSamples(room,lights,casters),colors=[...new Set(samples.map(s=>s.color))];
 return <g data-ultra-indirect="radiant-4" pointerEvents="none">
  <defs>{colors.map((color,i)=><radialGradient key={color} id={`${prefix}-return-${i}`}><stop stopColor={color} stopOpacity="1"/><stop offset=".3" stopColor={color} stopOpacity=".52"/><stop offset="1" stopColor={color} stopOpacity="0"/></radialGradient>)}</defs>
  {samples.map((s,i)=>{const id=`${prefix}-return-clip-${i}`,source={...s,strength:s.energy};return <g key={i} data-ultra-wall-return="" data-return-energy={s.energy.toFixed(3)} opacity={s.energy}>
   <defs><clipPath id={id}><path d={lightPolygon(lightVisibility(source,room,casters))}/></clipPath></defs>
   <g clipPath={`url(#${id})`}><ellipse cx={s.x} cy={s.y} rx={s.nx?s.radius:s.radius*.78} ry={s.ny?s.radius:s.radius*.78} fill={`url(#${prefix}-return-${colors.indexOf(s.color)})`}/>
    <path d={s.nx?`M${s.x-1} ${s.y-25}h2v50h-2Z`:`M${s.x-25} ${s.y-1}h50v2h-50Z`} fill={s.color}/>
   </g>
  </g>;})}
 </g>;
}

/** Authored pixel edges catch only visible sources. Rect/origin are world coordinates;
 * the drawing remains inside its prop, so destroying it removes the light too. */
export function UltraObjectRadiance({rect:r,origin={x:0,y:0},lights,casters,front=12}:{rect:LevelRect;origin?:{x:number;y:number};lights:readonly RoomLight[];casters:readonly LevelRect[];front?:number}){
 const blockers=casters.filter(c=>c!==r&&!(c.x===r.x&&c.y===r.y&&c.w===r.w&&c.h===r.h));
 const x=r.x-origin.x,y=r.y-origin.y,w=r.w,h=r.h;
 const edges=[
  {point:{x:r.x+w/2,y:r.y-1},normal:{x:0,y:-1},d:`M${x+3} ${y+2}h${w-6}v2h-${w-6}Z`},
  {point:{x:r.x+w/2,y:r.y+h+1},normal:{x:0,y:1},d:`M${x+4} ${y+h-front}h${w-8}v2h-${w-8}Z`},
  {point:{x:r.x-1,y:r.y+h/2},normal:{x:-1,y:0},d:`M${x+2} ${y+4}h2v${h-8}h-2Z`},
  {point:{x:r.x+w+1,y:r.y+h/2},normal:{x:1,y:0},d:`M${x+w-4} ${y+4}h2v${h-8}h-2Z`},
 ];
 return <g data-ultra-object-radiance="radiant-4" pointerEvents="none">{edges.map((edge,i)=>{const hit=incidentRadiance(edge.point,edge.normal,lights,blockers);return hit&&<path key={i} d={edge.d} fill={hit.color} opacity={Math.min(.74,hit.energy*2.8).toFixed(3)}/>;})}</g>;
}
