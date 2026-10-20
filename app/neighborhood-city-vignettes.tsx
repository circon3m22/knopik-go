import {getVisualProfile} from './graphics-quality';
import {NEIGHBORHOOD_BUILDINGS} from './neighborhood-map';
import type {StreetPalette} from './neighborhood-props';
/** Flat marks and insets: nobody collides with a painted hopscotch or petals. */
export function CityGroundVignettes({p}:{p:StreetPalette}){
 const detail=getVisualProfile().detail;if(detail===0)return null;
 return <g data-city-vignettes="">
  {p.night&&detail>=3&&NEIGHBORHOOD_BUILDINGS.map(o=>{const x=o.x+o.w!/2,y=o.y;return <g key={o.id} data-city-door-light={o.id} data-ground-chunk="" data-x={x-70} data-y={y} data-w="140" data-h="60" transform={`translate(${x} ${y})`}>
   <path d="M-32 0h64v12h12v14h13v17h13v12H-70V43h13V26h13V12h12Z" fill="#f1d2a6" opacity=".035"/><path d="M-25 1h50v12h10v14h12v13H-47V27h12V13h10Z" fill="#f4d9b0" opacity=".055"/><path d="M-21 2h42v13h9v10h-60V15h9Z" fill="#ffe4bb" opacity=".065"/>
  </g>;})}

  {[[615,690],[3060,660]].map(([x,y],i)=><g key={x} data-ground-chunk="" data-x={x-8} data-y={y-8} data-w="80" data-h="120" transform={`translate(${x} ${y})`} opacity={p.night?'.5':'.65'}>
   <path d="M17 0h24v24H17ZM5 27h24v24H5Zm27 0h24v24H32ZM17 54h24v24H17ZM5 81h24v24H5Zm27 0h24v24H32Z" fill="none" stroke={i?'#d7b0a0':'#f1e4bd'} strokeWidth="2"/>
   <path d="M27 7h3v10h-3ZM13 34h9v3h-6v3h6v3h-9Zm28 0h9v3h-6v2h6v4h-9ZM27 61h3v10h-3Z" fill={i?'#d7b0a0':'#f1e4bd'}/>
  </g>)}
  {[[285,670],[990,665],[3790,575],[4145,575],[3560,1250],[4610,1530]].map(([x,y],i)=><g key={x} data-ground-chunk="" data-x={x-60} data-y={y} data-w="120" data-h="35">
   <path d={Array.from({length:detail>=3?16:7},(_,n)=>`M${x-49+(n*19+i*7)%100} ${y+9+(n*11)%20}h2v1h-2Z`).join('')} fill={i%2?'#d8bd8e':'#c8999d'} opacity=".6"/>
  </g>)}
  {detail>=2&&[650,1140,2800,3620,4700].map(x=><g key={x} data-ground-chunk="" data-x={x-35} data-y="805" data-w="70" data-h="30"><path d={`M${x-21} 822h42v10h-42Z`} fill={p.seam}/><path d={Array.from({length:9},(_,i)=>`M${x-17+i*4} 824h1v6h-1Z`).join('')} fill={p.metal}/><path d={`M${x-24} 835h48v1h-48Z`} fill={p.trim}/></g>)}
 </g>;
}
