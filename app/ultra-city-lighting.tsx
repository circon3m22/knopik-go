import {NEIGHBORHOOD_OBJECTS,NEIGHBORHOOD_LAMPS} from './neighborhood-map';
import type {StreetPalette} from './neighborhood-props';
/** Sun direction is shared by roofs, foliage and their ground shadows.
 * Every light belongs to a real, switchable lamp and a culled world chunk. */
export function UltraCityLighting({p,prefix}:{p:StreetPalette;prefix:string}){
 return <g data-ultra-city-lighting="source-bound-2" pointerEvents="none">
  <defs><radialGradient id={`${prefix}-lamp-2`}><stop stopColor="#ffe5ac" stopOpacity=".5"/><stop offset=".25" stopColor="#ffda96" stopOpacity=".32"/><stop offset=".62" stopColor="#efc48d" stopOpacity=".12"/><stop offset="1" stopColor="#efc48d" stopOpacity="0"/></radialGradient><radialGradient id={`${prefix}-lamp-core-2`}><stop stopColor="#fff1c6" stopOpacity=".28"/><stop offset="1" stopColor="#fff1c6" stopOpacity="0"/></radialGradient></defs>
  {!p.night&&NEIGHBORHOOD_OBJECTS.filter(o=>['tree','lamp','house','bench','planter'].includes(o.kind)).map(o=>{
   const house=o.kind==='house',tree=o.kind==='tree',w=house?o.w!:tree?96:o.kind==='bench'?112:22,dx=house?95:tree?64:38,dy=house?61:tree?43:26,x=house?o.x:o.x-w/2,y=o.y;
   return <g key={o.id} data-ground-chunk="" data-x={x-8} data-y={y-12} data-w={w+dx+24} data-h={dy+36} data-ultra-sun-shadow={o.id}>
    <path d={`M${x} ${y-4}h${w}l${dx} ${dy}h-${w}Z`} fill="#284453" opacity={house?'.13':'.12'}/>
    <path d={`M${x+3} ${y-2}h${w-6}l${Math.round(dx*.7)} ${Math.round(dy*.7)}h-${w-6}Z`} fill="#263f4b" opacity=".08"/>
    {tree&&<path d={`M${x+dx-8} ${y+dy-8}h30v-8h44v7h28v9h-14v6h-63v-5h-25Z`} fill="#274650" opacity=".1"/>}
   </g>;
  })}
  {p.night&&NEIGHBORHOOD_LAMPS.map(l=>{
   const object=NEIGHBORHOOD_OBJECTS.find(o=>o.id===l.id),short=object?.variant===2,top=short?52:153,radius=short?85:158;
   return <g key={l.id} data-ground-chunk="" data-x={l.x-radius} data-y={l.y-top-20} data-w={radius*2} data-h={radius+top+36}>
    <g data-lamp-glow={l.id}>
     <ellipse cx={l.x} cy={l.y+5} rx={radius} ry={radius*.64} fill={`url(#${prefix}-lamp-2)`}/>
     <ellipse cx={l.x} cy={l.y-top+6} rx={short?22:37} ry={short?24:30} fill={`url(#${prefix}-lamp-core-2)`}/>
     <path d={`M${l.x-7} ${l.y-top+12}h14l${short?31:57} ${top-14}h-${short?76:128}Z`} fill="#ffe6b1" opacity=".045"/>
     <path d={`M${l.x-25} ${l.y+10}h50v2h-50Zm8 8h34v1h-34Zm-4 8h42v1h-42Z`} fill="#ffe8b9" opacity=".45"/>
     <path d={`M${l.x-6} ${l.y-1}h12l16 22h-12Z`} fill="#1e3041" opacity=".24"/>
    </g>
   </g>;
  })}
 </g>;
}
