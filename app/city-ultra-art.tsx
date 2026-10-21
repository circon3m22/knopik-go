import {UltraMaterialPattern} from './ultra-material-art';
import {cityFacadeColor} from './neighborhood-city-props';
import type {StreetPalette} from './neighborhood-props';
export function CityUltraSurfaceDefs({p,prefix}:{p:StreetPalette;prefix:string}){return <>{Array.from({length:8},(_,v)=><UltraMaterialPattern key={v} id={`${prefix}-facade-${v}`} kind={v===4?'brick':'plaster'} palette={{base:cityFacadeColor(v,p.night),dark:p.night?'#53646c':'#b29e84',light:p.night?'#a6b5ba':'#f8edda',accent:p.roof}} seed={v}/>)}</>;}
/** Glints follow the river surface, away from dry paving and actor silhouettes. */
export function CityUltraRiver({p}:{p:StreetPalette}){return <g data-ultra-river="">{Array.from({length:12},(_,i)=><g key={i} data-ground-chunk="" data-x={i*400} data-y="1740" data-w="400" data-h="255"><path data-ultra-river-wave={i} fill={p.night?'#b0c9c4':'#d0e1c9'} opacity={p.night?'.18':'.28'}/><path d={riverCausticPath(i,0)} fill={p.night?'#789ea4':'#466f70'} opacity=".09"/></g>)}</g>;}
export function riverCausticPath(chunk:number,time:number){let d='';for(let i=0;i<18;i++){const x=chunk*400+12+(i*73)%370+Math.round(Math.sin(time*.5+i)*4),y=1750+(i*37)%230,w=10+i*7%33;d+=`M${x} ${y}h${w}v1h-${w}Zm5 4h${Math.max(3,w-11)}v1h-${Math.max(3,w-11)}Z`;}return d;}
