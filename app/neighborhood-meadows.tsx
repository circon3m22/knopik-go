import {getVisualProfile} from './graphics-quality';
import type {StreetPalette} from './neighborhood-props';
export const CITY_MEADOWS=[
 {x:1210,y:315,w:95,h:110},{x:1480,y:300,w:110,h:140},{x:1680,y:330,w:190,h:115},
 {x:2010,y:390,w:85,h:100},{x:1220,y:610,w:90,h:100},{x:1475,y:715,w:125,h:65},
 {x:1760,y:660,w:65,h:55},{x:50,y:1430,w:240,h:175},
 {x:3690,y:320,w:80,h:190},{x:4150,y:320,w:95,h:195},{x:2795,y:275,w:85,h:310},
 {x:3220,y:335,w:30,h:200},{x:3500,y:1450,w:130,h:38},
] as const;
/** Soft changes of turf color, clover, small flowers and individual blades.
 * A shared tile adds no per-frame geometry or animation. */
export function CityGrassPattern({p,prefix}:{p:StreetPalette;prefix:string}){
 const detail=getVisualProfile().detail,n=detail===0?9:detail===1?42:detail===2?65:detail===3?88:116,blades:string[]=[],tips:string[]=[],clover:string[]=[],flowers:string[]=[];
 for(let i=0;i<n;i++){
  const x=5+(i*71+Math.floor(i/7)*17)%214,y=7+(i*43+Math.floor(i/5)*11)%158;
  blades.push(`M${x} ${y}h2v-3h1v4h3v-2h1v4h-8v-2Z`);
  if(detail>0&&i%2===0)tips.push(`M${x+2} ${y-3}h1v3h-1Zm4 3h1v2h-1Z`);
  if(detail>=2&&i%5===0)clover.push(`M${x-2} ${y+5}h2v-2h2v2h3v2h-2v2h-3v-2h-2Z`);
  if(detail>=2&&i%19===0)flowers.push(`M${x} ${y-5}h2v-2h2v2h2v2h-2v2h-2v-2h-2Z`);
 }
 return <pattern id={`${prefix}-grass`} data-grass-revision="meadow-1" width="224" height="176" patternUnits="userSpaceOnUse">
  <rect width="224" height="176" fill={p.grass}/>
  {detail>0&&<><path d="M0 21h37v6h34v13h21v19H75v13H39V61H14V48H0ZM142 108h33v-8h26v11h23v32h-32v12h-31v-13h-29v-19h10Z" fill={p.night?'#456454':'#a9bc8b'}/><path d="M89 9h43v7h27v16h-16v12h-38V31H83V18h6ZM6 118h28v-7h24v11h19v19H61v12H30v-11H6Z" fill={p.night?'#3a584f':'#97ae7d'}/></>}
  <path d={blades.join('')} fill={p.night?'#355748':'#789661'} opacity=".65"/>
  {detail>0&&<path d={tips.join('')} fill={p.night?'#6b8c69':'#c3d29d'} opacity=".75"/>}
  {detail>=2&&<><path d={clover.join('')} fill={p.night?'#58765d':'#6a8e61'}/><path d={flowers.join('')} fill={p.night?'#b1b19a':'#e9e2bc'}/></>}
 </pattern>;
}
/** These are low plants in selected lawns, not new obstacles. All raised
 * clusters stay in authored green plots, away from doors and sidewalks. */
export function CityMeadows({p}:{p:StreetPalette}){
 const detail=getVisualProfile().detail;if(detail===0)return null;
 return <g data-city-meadows="">{CITY_MEADOWS.map((r,index)=>{
  const fern:string[]=[],light:string[]=[],bloom:string[]=[],shade:string[]=[];
  for(let i=0;i<(detail===1?8:detail===2?15:detail===3?22:30);i++){
   const x=r.x+7+(i*43+index*19)%(r.w-14),y=r.y+14+(i*29+index*13)%(r.h-22);
   fern.push(`M${x} ${y}h2v-9h2v5h5v2h-5v5h-2v-2h-6v-3h4Z`);
   light.push(`M${x+2} ${y-10}h2v4h-2Zm-5 5h3v1h-3Z`);
   if(i%3===0){bloom.push(`M${x} ${y-13}h5v4h-5Z`);shade.push(`M${x+2} ${y-12}h2v2h-2Z`);}
  }
  return <g key={index} data-meadow-plot={index} data-ground-chunk="" data-x={r.x-8} data-y={r.y-18} data-w={r.w+16} data-h={r.h+30}>
   <path d={fern.join('')} fill={p.leaf}/><path d={light.join('')} fill={p.leafLight}/><path d={bloom.join('')} fill={index%3===0?(p.night?'#b0a58f':'#e3cf8d'):index%3===1?(p.night?'#a28d9c':'#c69cab'):(p.night?'#b0b79c':'#e6e4c6')}/><path d={shade.join('')} fill={p.night?'#c0b68b':'#f2df9f'}/>
  </g>;
 })}</g>;
}
