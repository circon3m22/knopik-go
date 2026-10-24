import {NEIGHBORHOOD_OBJECTS,NEIGHBORHOOD_LAMPS} from './neighborhood-map';
import type {StreetPalette} from './neighborhood-props';
import {UltraRadianceDefs,UltraMotes} from './ultra-radiance-art';
import {cityWindowSeed,cityWindowKey} from './city-window-light';
/** Sun direction is shared by roofs, foliage and their ground shadows.
 * Every light belongs to a real, switchable lamp and a culled world chunk. */
export function UltraCityLighting({p,prefix}:{p:StreetPalette;prefix:string}){
 return <g data-ultra-city-lighting="source-bound-2" pointerEvents="none">
  <UltraRadianceDefs prefix={`${prefix}-street-stack`} tint={p.night?'#ffcc8b':'#ffeab0'} sky={p.night?'#83b6da':'#9acddd'}/>
  <defs><radialGradient id={`${prefix}-lamp-2`}><stop stopColor="#ffe5ac" stopOpacity=".62"/><stop offset=".25" stopColor="#ffda96" stopOpacity=".39"/><stop offset=".62" stopColor="#efc48d" stopOpacity=".15"/><stop offset="1" stopColor="#efc48d" stopOpacity="0"/></radialGradient><radialGradient id={`${prefix}-lamp-core-2`}><stop stopColor="#fff1c6" stopOpacity=".4"/><stop offset="1" stopColor="#fff1c6" stopOpacity="0"/></radialGradient>
   <linearGradient id={`${prefix}-facade-spill-4`} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#ffd399" stopOpacity=".3"/><stop offset=".3" stopColor="#f8cb94" stopOpacity=".17"/><stop offset="1" stopColor="#f8cb94" stopOpacity="0"/></linearGradient>
  </defs>
  {p.night&&NEIGHBORHOOD_OBJECTS.filter(o=>o.kind==='house').map(o=>{const seed=cityWindowSeed(o.id);return <g key={o.id} data-ultra-facade-spill="radiant-4" data-ground-chunk="" data-x={o.x+4} data-y={o.y-12} data-w={o.w!-8} data-h="115">
   {[0,2].filter(col=>cityWindowKey(seed,2,col)%5!==0).map(col=>{const x=o.x+Math.round(26+col*(o.w!-104)/2);return <g key={col} data-ultra-window-spill={`${o.id}-${col}`}><path d={`M${x+4} ${o.y-5}h44l15 103h-75Z`} fill={`url(#${prefix}-facade-spill-4)`}/><path d={`M${x+6} ${o.y+9}h40v2h-40Zm-3 9h46v1h-46Z`} fill="#ffe4ad" opacity=".3"/></g>;})}
  </g>;})}
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
   return <g key={l.id} data-ground-chunk="" data-x={l.x-radius*1.25} data-y={l.y-top-48} data-w={radius*2.5+50} data-h={radius+top+72}>
    <g data-lamp-glow={l.id}>
     <ellipse cx={l.x+42} cy={l.y+18} rx={radius*1.18} ry={radius*.7} fill={`url(#${prefix}-street-stack-bounce)`}/>
     <ellipse cx={l.x} cy={l.y+5} rx={radius} ry={radius*.64} fill={`url(#${prefix}-lamp-2)`}/>
     <ellipse cx={l.x} cy={l.y-top+6} rx={short?22:37} ry={short?24:30} fill={`url(#${prefix}-lamp-core-2)`}/>
     <ellipse cx={l.x} cy={l.y-top+6} rx={short?33:57} ry={short?32:48} fill={`url(#${prefix}-street-stack-bloom)`}/>
     <path d={`M${l.x-7} ${l.y-top+12}h14l${short?31:57} ${top-14}h-${short?76:128}Z`} fill="#ffe6b1" opacity=".045"/>
     <path d={`M${l.x-3} ${l.y-top+14}h6l${short?14:27} ${top-16}h-${short?34:60}Z`} fill="#ffecc0" opacity=".07"/>
     <ellipse cx={l.x+15} cy={l.y+23} rx={short?44:85} ry="13" fill={`url(#${prefix}-street-stack-specular)`} opacity=".7"/>
     <path d={`M${l.x-25} ${l.y+10}h50v2h-50Zm8 8h34v1h-34Zm-4 8h42v1h-42Z`} fill="#ffe8b9" opacity=".45"/>
     <path d={`M${l.x-6} ${l.y-1}h12l16 22h-12Z`} fill="#1e3041" opacity=".24"/>
    </g>
   </g>;
  })}
  {NEIGHBORHOOD_OBJECTS.filter(o=>o.kind==='tree').filter((_,i)=>i%4===0).map((o,i)=><g key={o.id} data-ground-chunk="" data-x={o.x-95} data-y={o.y-160} data-w="310" data-h="285">
   {!p.night&&<><path d={`M${o.x-44} ${o.y-145}h25l150 215h-98Z`} fill={`url(#${prefix}-street-stack-shaft)`} opacity=".65"/><path d={`M${o.x-21} ${o.y-130}h6l101 172h-21Z`} fill="#fff3c7" opacity=".045"/></>}
   <UltraMotes room={{x:o.x-65,y:o.y-60,w:200,h:140}} index={i} color={p.night?'#a5d6d5':'#fff0c6'}/>
  </g>)}
 </g>;
}
/** Cool sky and warm shore lamps form separate, gently moving water highlights. */
export function UltraRiverRadiance({p,prefix}:{p:StreetPalette;prefix:string}){
 const positions=NEIGHBORHOOD_LAMPS.filter(l=>l.y>1400);
 return <g data-ultra-water-radiance="layered-3"><UltraRadianceDefs prefix={`${prefix}-river-stack`} tint={p.night?'#f6d094':'#ecf3d1'} sky={p.waterLight}/>
  <defs><linearGradient id={`${prefix}-water-fresnel-5`} x1="0" y1="0" x2="0" y2="1"><stop stopColor={p.waterLight} stopOpacity=".03"/><stop offset="1" stopColor={p.night?'#9bc4db':'#f1eed0'} stopOpacity=".18"/></linearGradient><linearGradient id={`${prefix}-water-ribbon-5`} x1="0" y1="0" x2="0" y2="1"><stop stopColor={p.night?'#ffe4b0':'#f2f5d9'} stopOpacity=".9"/><stop offset=".5" stopColor={p.night?'#eabf89':'#d9e8d2'} stopOpacity=".65"/><stop offset="1" stopColor={p.waterLight} stopOpacity="0"/></linearGradient></defs>
  {positions.map(({x,id},i)=><g key={id} data-ground-chunk="" data-x={x-125} data-y="1715" data-w="250" data-h="270">
   <ellipse cx={x} cy="1825" rx="85" ry="105" fill={`url(#${prefix}-river-stack-bounce)`} opacity=".6"/>
   <ellipse data-ultra-water-fresnel="cinematic-5" cx={x} cy="1850" rx="117" ry="130" fill={`url(#${prefix}-water-fresnel-5)`}/>
   <g data-ultra-lamp-reflection={p.night?id:undefined}><g data-ultra-air-patch="" data-air-x={x-100} data-air-y="1720" data-air-w="200" data-air-h="250"><g data-ultra-air-drift="" data-ultra-water-ribbon="cinematic-5">
    <path d={Array.from({length:21},(_,n)=>{const w=18+n*2+(n*17+i*11)%21;return `M${x-w/2+(n%3-1)*6} ${1728+n*10}h${w}v${n%3===0?3:1}h-${w}Z`;}).join('')} fill={`url(#${prefix}-water-ribbon-5)`}/>
    <path d={Array.from({length:5},(_,n)=>`M${x-6-n*2+(n%2?7:-5)} ${1730+n*31}h${11+n*3}v1h-${11+n*3}Z`).join('')} fill={p.night?'#fff2ca':'#fffbea'} opacity=".65"/>
   </g></g></g>
   <path d={`M${x-33} 1803h40v1h-40Zm-17 32h81v2h-81Zm28 41h36v1h-36Z`} fill={p.waterLight} opacity=".22"/>
  </g>)}
 </g>;
}
