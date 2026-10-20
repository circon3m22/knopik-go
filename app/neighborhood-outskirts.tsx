import {EUROPEAN_HOUSE_HEIGHT} from './neighborhood-city-props';
import {getVisualProfile} from './graphics-quality';
import {LowStreetProp} from './quality-world-art';
import {StreetProp,type StreetPalette} from './neighborhood-props';
import {projectAdventureY} from './adventure-projection';
import {NEIGHBORHOOD_BOUNDS,type NeighborhoodObject} from './neighborhood-map';
/** Scenery only: never add these to the collision index, atlas or interaction
 * catalog. The playable bounds stay exactly 4800×2050. */
export const CITY_SCENERY_BOUNDS={x:-900,y:-650,w:6600,h:3300};
export const CITY_CAMERA_MARGIN=220;
export const CITY_OUTSKIRTS:readonly NeighborhoodObject[]=[
 ...Array.from({length:16},(_,i):NeighborhoodObject=>({id:`beyond-north-${i}`,kind:'house',x:-490+i*365,y:116+i%3*6,w:305+i%3*10,h:330+i%3*20,floors:3,variant:(i+2)%8})),
 ...Array.from({length:15},(_,i):NeighborhoodObject=>({id:`beyond-river-${i}`,kind:'house',x:-420+i*390,y:2370+i%3*16,w:310+i%3*10,h:345+i%3*17,floors:3,variant:(i+5)%8})),
 {id:'beyond-west',kind:'house',x:-390,y:1390,w:300,h:350,floors:3,variant:4},
 {id:'beyond-east-home',kind:'house',x:4860,y:600,w:330,h:365,floors:3,variant:5},
 {id:'beyond-east-quay',kind:'house',x:4850,y:1420,w:350,h:355,floors:3,variant:2},
 ...Array.from({length:26},(_,i):NeighborhoodObject=>({id:`beyond-tree-${i}`,kind:'tree',x:-650+i*243,y:i%2?2058:151,variant:i%6})),
 ...[[-105,745],[-118,1010],[-170,1575],[4880,740],[4890,1040],[4920,1555]].map(([x,y],i):NeighborhoodObject=>({id:`beyond-edge-tree-${i}`,kind:'tree',x,y,variant:i%6})),
];
export function CityOutskirtsGround({p,prefix}:{p:StreetPalette;prefix:string}){
 const b=CITY_SCENERY_BOUNDS,low=getVisualProfile().detail===0;
 return <g data-city-continuation="ground" transform="scale(1 .82)">
  <rect x={b.x} y={b.y} width={b.w} height={b.h} fill={`url(#${prefix}-grass)`}/>
  <path d="M-900 780H0v250h-900ZM4800 780h900v250h-900ZM-900 1540H0v165h-900ZM4800 1540h900v165h-900Z" fill={low?p.paving:`url(#${prefix}-paving)`}/>
  <path d="M-900 845H0v135h-900ZM4800 845h900v135h-900Z" fill={p.road}/>
  <path d="M-900 840H0v5h-900Zm0 140H0v5h-900ZM4800 840h900v5h-900Zm0 140h900v5h-900Z" fill={p.trim}/>
  <path d="M-900 1715h6600v302h-6600Z" fill={low?p.water:`url(#${prefix}-water)`}/><path d="M-900 2017h6600v14h-6600Z" fill={p.leafDark}/>
  <path d="M-900 151h6600v11h-6600Z" fill={p.seam}/><path d="M-900 151h6600v3h-6600Z" fill={p.trim}/>
  <path d="M-900 2033h6600v35h-6600Z" fill={low?p.paving:`url(#${prefix}-paving)`}/>
  {[-760,-540,-320,-100,4910,5130,5350,5570].map(x=><g key={x}><path d={`M${x} 910h53v3h-53Z`} fill={p.trim}/><path d={`M${x} 1820h49v2h-49Zm20 45h39v2h-39Z`} fill={p.waterLight} opacity=".45"/></g>)}
 </g>;
}
export function CityOutskirtsProps({p}:{p:StreetPalette}){
 const low=getVisualProfile().detail===0;
 return <>{CITY_OUTSKIRTS.map(o=><g key={o.id} data-city-backdrop={o.id} data-depth={o.y} data-x={o.x} data-y={o.y} data-extent={o.kind==='house'?EUROPEAN_HOUSE_HEIGHT+24:190} transform={`translate(${o.x} ${projectAdventureY(o.y)})`}><g transform="scale(1 .82)">{low?<LowStreetProp object={o} p={p}/>:<StreetProp object={o} p={p}/>}</g></g>)}</>;
}
export function cityCameraTarget(player:{x:number;y:number},width:number,height:number,lift=0){
 return {x:Math.max(-CITY_CAMERA_MARGIN,Math.min(NEIGHBORHOOD_BOUNDS.w-width+CITY_CAMERA_MARGIN,player.x-width/2)),y:Math.max(-CITY_CAMERA_MARGIN*.82,Math.min(NEIGHBORHOOD_BOUNDS.h*.82-height+CITY_CAMERA_MARGIN*.82,projectAdventureY(player.y)-height*.58-lift*.55))};
}
