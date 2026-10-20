import {getVisualProfile} from './graphics-quality';
import {NEIGHBORHOOD_EAST_PATHS,NEIGHBORHOOD_OBJECTS,NEIGHBORHOOD_LAMPS} from './neighborhood-map';
import type {StreetPalette} from './neighborhood-props';
export function CityEastTerrain({p,prefix}:{p:StreetPalette;prefix:string}){
 return <g data-city-east="" data-ground-chunk="" data-x="2390" data-y="180" data-w="2410" data-h="1650">
  <path d="M3650 240h670v555h-670Z" fill={p.leafDark}/><path d="M3660 250h650v535h-650Z" fill={p.grass}/>
  {NEIGHBORHOOD_EAST_PATHS.map((r,i)=><g key={i}><rect x={r.x-3} y={r.y-3} width={r.w+6} height={r.h+6} fill={p.seam}/><rect x={r.x} y={r.y} width={r.w} height={r.h} fill={`url(#${prefix}-paving)`}/></g>)}
  <path d="M3710 290h545v6h-545ZM3670 310h6v440h-6Zm585 0h6v440h-6Z" fill={p.leaf}/>
  <path d="M3750 300h36v3h-36Zm380 0h55v3h-55Z" fill={p.leafLight}/>
  <path d="M3350 1080h780v373h-780Z" fill={p.seam}/><path d="M3358 1088h764v357h-764Z" fill={`url(#${prefix}-paving)`}/>
  <path d="M3760 1165h58v-26h34v26h58v27h-58v29h-34v-29h-58Z" fill={p.seam}/><path d="M3774 1171h49v-23h24v23h48v14h-48v25h-24v-25h-49Z" fill={p.trim}/>
  <path d="M2380 1649h2340v6H2380Z" fill={p.trim}/>
  <path d="M3868 1662h264v157h-264Z" fill={p.ink}/><path d="M3874 1667h252v146h-252Z" fill={p.wood}/>
  {Array.from({length:14},(_,i)=><path key={i} d={`M3878 ${1671+i*10}h244v7h-244Z`} fill={p.night?'#92847e':'#d1aa7a'}/>)}
  <path d="M3863 1706h11v105h-11Zm263 0h11v105h-11Z" fill={p.wood}/><path d="M3860 1703h17v7h-17Zm263 0h17v7h-17Z" fill={p.trim}/>
  <g transform="translate(4460 1880)"><path d="M-92-9H92v15H76v12H-71V9h-21Z" fill={p.wood}/><path d="M-78-5H78v8H68v8H-63V5h-15Z" fill={p.trim}/><path d="M-40-42h80v30h-80Z" fill={p.wood}/><path d="M-34-36h68v19h-68Z" fill={p.waterLight}/><path d="M-5-68h4v27h-4Z" fill={p.metal}/></g>
  <g fill={p.waterLight} opacity=".4"><path d="M2530 1828h83v2h-83Zm420 76h107v2h-107Zm346-97h82v2h-82Zm875 114h98v2h-98Z"/></g>
 </g>;
}
/** Ground contact, cobbles, grass blades and fallen leaves are batched into
 * bounded chunks, so the renderer can hide the entire unseen district. */
export function CityGroundMaterials({p}:{p:StreetPalette}){
 const detail=getVisualProfile().detail;if(detail<2)return null;
 const size=400,rows=4,columns=12;
 return <g data-city-material-pass="" data-premium-world={detail>=3?'street':undefined} data-ultra-world={detail===4?'street':undefined}>{Array.from({length:rows*columns},(_,index)=>{
  const x=index%columns*size,y=180+Math.floor(index/columns)*size,light:string[]=[],dark:string[]=[],leaves:string[]=[],shadows:string[]=[];
  let left=x,right=x+size;
  for(let i=0;i<(detail===4?95:detail===3?50:25);i++){
   const xx=x+12+(i*71+index*13)%374,yy=y+15+(i*53+index*17)%365;if(yy>1690)continue;
   const sidewalk=yy>790&&yy<1030||yy>1510||NEIGHBORHOOD_EAST_PATHS.some(r=>xx>r.x&&xx<r.x+r.w&&yy>r.y&&yy<r.y+r.h);
   if(yy>845&&yy<980){dark.push(`M${xx} ${yy}h${2+i%4}v1h-${2+i%4}Z`);continue;}
   if(sidewalk){(i%2?light:dark).push(`M${xx} ${yy}h${3+i%6}v1h-${3+i%6}Z`);}
   else leaves.push(`M${xx} ${yy}h2v-3h1v3h2v1h-5Z`);
  }
  for(const o of NEIGHBORHOOD_OBJECTS){if(o.x<x||o.x>=x+size||o.y<y||o.y>=y+size)continue;
   // A house can cross a chunk boundary. Include its complete cast shadow in
   // the culling bounds so it cannot vanish while still inside the camera.
   left=Math.min(left,o.x-45);right=Math.max(right,o.x+(o.kind==='house'?o.w!+48:145));
   if(o.kind==='tree'||o.kind==='lamp'){const w=o.kind==='tree'?78:14,reach=o.kind==='tree'?65:48;shadows.push(`M${o.x-w/2} ${o.y-4}h${w}v8h12v8h14v8h14v8h${reach-40}v8H${o.x+25}v-8h-14v-8h-14v-8h-14v-8h-12Z`);}
   else if(o.kind==='house')shadows.push(`M${o.x+6} ${o.y-3}h${o.w!-12}v8h20v8h18v8H${o.x+34}v-8h-14v-8H${o.x+6}Z`);
  }
  return <g key={index} data-ground-chunk="" data-material-chunk={index} data-x={left} data-y={y} data-w={right-left} data-h={size}>
   <path d={shadows.join('')} fill={p.shadow} opacity={p.night?'.22':'.18'}/><path d={light.join('')} fill={p.trim} opacity=".55"/><path d={dark.join('')} fill={p.wood} opacity=".18"/><path d={leaves.join('')} fill={p.leafLight} opacity=".65"/>
  </g>;
 })}</g>;
}
export function CityStreetLighting({p,prefix}:{p:StreetPalette;prefix:string}){
 const detail=getVisualProfile().detail;if(!p.night||detail===0)return null;
 return <g data-ground-lights=""><defs><radialGradient id={`${prefix}-city-lamp`}><stop stopColor="#ffe4ac" stopOpacity={detail>=3?'.33':'.23'}/><stop offset=".48" stopColor="#efc581" stopOpacity=".12"/><stop offset="1" stopColor="#efc581" stopOpacity="0"/></radialGradient></defs>
  {NEIGHBORHOOD_LAMPS.map(l=><g key={l.id} data-ground-chunk="" data-x={l.x-155} data-y={l.y-110} data-w="310" data-h="245">
   <g data-lamp-glow={l.id}><ellipse cx={l.x} cy={l.y-18} rx="150" ry="94" fill={`url(#${prefix}-city-lamp)`}/>{detail>=3&&<><path d={`M${l.x-9} ${l.y-110}h18v24h7v24h8v24h10v20h15v13h-80v-13h15v-20h10v-24h7Z`} fill="#ffe9b8" opacity=".07"/><path d={`M${l.x-28} ${l.y+16}h56v1h-56Zm9 5h38v1h-38Z`} fill="#f6d6a4" opacity=".4"/></>}</g>
  </g>)}
  <path d="M385 570h50l42 92H344Z" fill="#f0d39a" opacity=".14"/>
  {detail>=3&&<g data-city-river-reflections="">{[650,1150,1750,2150,2820,3250,3650,4220,4700].map((x,i)=><g key={x} data-ground-chunk="" data-x={x-80} data-y="1720" data-w="160" data-h="200"><path d={Array.from({length:detail===4?18:9},(_,n)=>{const w=12+(n*7+i*3)%40;return `M${x-Math.floor(w/2)+(n%3-1)*4} ${1725+n*9}h${w}v${n%3===0?2:1}h-${w}Z`;}).join('')} fill="#dec79d" opacity=".28"/></g>)}</g>}
 </g>;
}
