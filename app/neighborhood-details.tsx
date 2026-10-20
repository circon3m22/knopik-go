import type { StreetPalette } from "./neighborhood-props";
import type { NeighborhoodObject } from "./neighborhood-map";
import { NEIGHBORHOOD_OBJECTS } from "./neighborhood-map";

export function TreeCrownDetails({p,variant}:{p:StreetPalette;variant:number}){
  const clusters=[[-15,-143],[20,-123],[-38,-106],[-8,-93],[31,-84],[8,-156]];
  return <g data-leaf-detail="">{clusters.map(([x,y],i)=><g key={i} transform={`translate(${x+(variant%2?3:0)} ${y})`}><path d="M-9-5H3v3h6v7H3v4H-9V5h-5V-2h5Z" fill={i%2?p.leafDark:p.leafLight} opacity={i%2?".22":".35"}/><path d="M-8-4H2v2H-8Zm10 5h5v2H2Z" fill={p.leafLight} opacity=".6"/><path d="M-3 0h3v2h-3Z" fill={p.trim} opacity=".22"/></g>)}</g>;
}

export function NeighborhoodBuildingDetails({object:o,p}:{object:NeighborhoodObject;p:StreetPalette}){
  const w=o.w!,h=o.h!,v=o.variant??0,columns=Math.max(3,Math.floor(w/83)),margin=(w-columns*65)/(columns+1),step=(h-122)/o.floors!;
  const shingles=Array.from({length:5},(_,row)=>Array.from({length:Math.floor(w/38)},(_,col)=>`M${18+col*38+row%2*17} ${-h+15+row*12}v8`).join('')).join('');
  return <g data-building-detail="">
    <path d={shingles} stroke={p.wood} strokeWidth="1" opacity=".48"/>
    <g transform={`translate(${w*.3} ${-h+33})`}><path d="M-22 7h44v25h-44Z" fill={p.wood}/><path d="M-27 8v-5h8v-9h11v-7H8v7h11v9h8v5Z" fill={p.ink}/><path d="M-20 2h11v-8H9v8h11v3h-40Z" fill={p.trim}/><path d="M-15 11h30v18h-30Z" fill={p.ink}/><path d="M-11 14h22v12h-22Z" fill={p.water}/><path d="M-1 13h3v14h-3Z" fill={p.trim}/><path d="M-24 32h48v3h-48Z" fill={p.trim}/></g>
    <path d={`M${w*.72} ${-h+6}v-39m-14 9h28m-22-9h16m-28 24h40`} stroke={p.metal} strokeWidth="2" fill="none"/>
    <path d={`M22-65h${w-44}v2H22Zm-1 18h${w-42}v1H21`} fill={p.wood} opacity=".18"/>
    {Array.from({length:o.floors!},(_,floor)=><g key={floor}>{Array.from({length:columns},(_,col)=>{
      const x=margin+col*(65+margin),y=-h+102+floor*step;
      return <g key={col} transform={`translate(${x} ${y})`}>
        <path d="M-7 0h3v38h-3Zm62 4h2v34h-2Z" fill={p.trim} opacity=".55"/>
        <path d="M-8 54h18v2H-8Zm19 0h14v1H11Zm30-7h12v1H41Z" fill={p.wood} opacity=".26"/>
        {(col+v)%3===0&&floor===0&&<g><path d="M5 9h14v3H5Zm25 1h12v2H30Z" fill={p.night?"#bf9c76":"#f3e2c0"} opacity=".5"/><path d="M16 5v14m18-14v13" stroke={p.roof} strokeWidth="1" opacity=".5"/></g>}
        {(floor+col+v)%3===1&&floor<o.floors!-1&&<g><path d="M-4 40h56" stroke={p.metal} strokeWidth="1"/>{[2,19,36].map((xx,i)=><g key={xx}><path d={`M${xx} 42h14v5h-2v9h-10v-9h-2Z`} fill={[p.night?"#858d99":"#b8d9d0",p.night?"#9a7b88":"#be8471",p.trim][i]}/><path d={`M${xx+4} 42h5v3h-5Z`} fill={p.wood} opacity=".5"/></g>)}</g>}
      </g>;
    })}</g>)}
    <path d={`M${w/2+42}-39h12v25h-12Z`} fill={p.metal}/><path d={`M${w/2+45}-36h6v6h-6Z`} fill={p.ink}/><path d={`M${w/2+45}-27h2v2h-2Zm4 0h2v2h-2Zm-4 5h2v2h-2Zm4 0h2v2h-2Z`} fill={p.trim}/>
    <g transform="translate(36 -35)">{[0,1,2].map(i=><g key={i}><path d={`M${i*16} 0h14v22h-14Z`} fill={p.metal}/><path d={`M${i*16+3} 5h8v2h-8Z`} fill={p.ink}/><path d={`M${i*16+3} 14h4v3h-4Z`} fill={p.trim}/></g>)}</g>
    <path d={`M${w/2-28} 7h56v11h-56Z`} fill={p.wood}/><path d={`M${w/2-23} 10h46v1h-46Zm0 4h46v1h-46Z`} fill={p.trim} opacity=".5"/>
    <path d={`M${w-77}-39h22v29h-22Z`} fill={p.trim}/><path d={`M${w-73}-34h14v3h-14Zm0 6h10v2h-10Zm0 5h12v2h-12Z`} fill={p.wood}/>
    <path d={`M8-30h9v4H8Zm3 7h15v3H11Zm${w-34} 9h21v4h-21Z`} fill={p.wood} opacity=".3"/>
  </g>;
}
export function NeighborhoodPropDetails({object:o,p}:{object:NeighborhoodObject;p:StreetPalette}){
  if(o.kind==="house")return <NeighborhoodBuildingDetails object={o} p={p}/>;
  if(o.kind==="tree")return <g data-tree-texture=""><path d="M-9-38h7v2h-7Zm10-15h6v3H1Zm-6 30h5v2h-5Z" fill={p.ink} opacity=".5"/><path d="M-6-56h2v18h-2Zm9 4h2v10H3Z" fill={p.trim} opacity=".3"/></g>;
  if(o.kind==="lamp")return <g><path d="M-5-13h3v3h-3Zm7 0h3v3H2Z" fill={p.trim}/>{o.variant!==2&&<><path d="M3-95h14v3H3Zm11 0v10" stroke={p.wood} strokeWidth="2"/><path d="M7-87h20v10H7Z" fill={p.roof}/><path d="M10-96h5v9h-5Zm7-4h5v13h-5Z" fill={p.leaf}/><path d="M15-99h5v5h-5Z" fill={p.night?"#ad8d98":"#be8471"}/></>}</g>;
  if(o.kind==="bench")return <g><path d="M-49-40h3v3h-3Zm95 0h3v3h-3Zm-95 12h3v3h-3Zm95 0h3v3h-3Z" fill={p.metal}/><path d="M-26-41h18v1h-18Zm34 11h22v1H8Zm-49 16h28v1h-28Z" fill={p.wood}/></g>;
  if(o.kind==="kiosk")return <g><path d="M-49-62h25v24h-25Z" fill={p.trim}/><path d="M-46-57h18v2h-18Zm0 5h13v2h-13Zm0 5h16v2h-16Z" fill={p.wood}/><path d="M14-49h5v9h-5Zm12-4h5v13h-5Zm12 3h5v10h-5Z" fill={p.leaf}/><path d="M-54-15h48v10h-48Z" fill={p.wood}/><path d="M-49-13h39v1h-39Zm0 4h29v1h-29Z" fill={p.trim}/></g>;
  return null;
}
export function NeighborhoodTerrainDetails({p}:{p:StreetPalette}){
  const trees=NEIGHBORHOOD_OBJECTS.filter(o=>o.kind==="tree");
  return <g data-terrain-detail="">
    {trees.map((o,i)=><g key={o.id} transform={`translate(${o.x} ${o.y})`}><path d="M-28-12h56v3h7v14h-7v5h-56V5h-7V-9h7Z" fill={p.seam} opacity=".35"/><path d="M-24-10h10v3h-10Zm36 14h11v3H12Z" fill={p.trim}/><path d={`M-49 ${16+i%3*6}h7v3h-7Zm82-12h5v3h-5Zm-59 10h9v2h-9Z`} fill={p.night?"#7a7365":"#b09d69"}/></g>)}
    {[240,760,1230,1780,2140].map((x,i)=><g key={x} transform={`translate(${x} ${i%2?1600:755})`}><path d="M0 0h17v3h-17v12h-3V3h-9V0h9v-8h3Z" fill={p.seam}/><path d="M12 18h3v4h-3Zm11-25h4v2h-4Z" fill={p.wood} opacity=".3"/></g>)}
    {[590,970,1590,2200].map(x=><g key={x} transform={`translate(${x} 1015)`}><path d="M-17-6h34v4h5v9h-5v4h-34V7h-5V-2h5Z" fill={p.water} opacity=".25"/><path d="M-11-3h20v1h-20Zm4 8h11v1H-7Z" fill={p.waterLight} opacity=".45"/></g>)}
    <g transform="translate(1420 1490)"><path d="M-48-8h96v4h-96Zm12 8h76v3h-76Z" fill={p.seam}/><path d="M-15-6h30v4h-30Z" fill={p.trim}/></g>
    {Array.from({length:30},(_,i)=>{const x=40+i*78;return x>1830&&x<2100?null:<g key={i} transform={`translate(${x} 1703)`}><path d="M0 0h48v9H0Z" fill={p.seam}/><path d="M3 2h42v2H3Z" fill={p.trim} opacity=".6"/><path d="M13 6h8v1H13Z" fill={p.wood} opacity=".3"/></g>;})}
    <path d="M1861 1694h12v6h-12Zm226 0h12v6h-12Z" fill={p.metal}/><path d="M1854 1770h14v13h-14Zm233 0h14v13h-14Z" fill={p.wood}/>
    <g transform="translate(2125 1682)"><path d="M-13-25h26v20h-26Z" fill={p.wood}/><path d="M-10-22h20v3h-20Zm0 8h20v2h-20Z" fill={p.trim}/><path d="M0-29v30m-9-23 18 18m-18 0 18-18" fill="none" stroke={p.metal} strokeWidth="2"/></g>
    <g className="neighborhood-ripples" fill={p.waterLight} opacity=".6"><path d="M410 1835h72v2h-72Zm17 6h33v2h-33Zm826 67h65v2h-65Zm20 6h32v2h-32Z"/></g>

  </g>;
}
export function NeighborhoodExtraProp({object:o,p}:{object:NeighborhoodObject;p:StreetPalette}){
  if(o.kind==="notice")return <g><path d="M-39-41h7V0h-7Zm71 0h7V0h-7Z" fill={p.wood}/><path d="M-54-119H54v77H-54Z" fill={p.ink}/><path d="M-49-114H49v68H-49Z" fill={p.wood}/><path d="M-57-123H57v7H-57Z" fill={p.trim}/><text x="0" y="-102" fontSize="12" textAnchor="middle" fill={p.trim}>НАШ КВАРТАЛ</text>{[-40,-12,15].map((x,i)=><g key={x} transform={`translate(${x} -92)`}><path d="M0 0h24v34H0Z" fill={i%2?p.trim:p.wall}/><path d="M4 7h16v2H4Zm0 5h13v2H4Zm0 5h16v2H4Zm0 8h9v2H4Z" fill={p.wood}/><path d="M10 1h4v3h-4Z" fill={p.night?"#aa8395":"#be8471"}/></g>)}</g>;
  if(o.kind==="fountain")return <g><path d="M-84-29h168v55H-84Z" fill={p.ink}/><path d="M-78-24H78v44H-78Z" fill={p.seam}/><path d="M-72-19H72v27H-72Z" fill={p.water}/><path d="M-69-16H69v3H-69Z" fill={p.waterLight}/><path d="M-16-66h32v49h-32Z" fill={p.wood}/><path d="M-12-62h24v40h-24Z" fill={p.trim}/><path d="M-28-74h56v12h-56Z" fill={p.ink}/><path d="M-23-71h46v6h-46Z" fill={p.water}/><path className="neighborhood-fountain-water" d="M-19-63h4v45h-4Zm34 0h4v45h-4ZM-2-93h4v24h-4Z" fill={p.waterLight}/><path d="M-63 16h126v4H-63Zm-10-39h146v4H-73Z" fill={p.trim}/><path d="M-55-3h22v2h-22Zm80 5h21v2H25Z" fill={p.waterLight}/><path d="M-50 24h21v2h-21Zm35 0H9v2h-24Zm38 0h31v2H23Z" fill={p.wood} opacity=".35"/></g>;
  if(o.kind==="utility"&&o.variant===1)return <g><path d="M-28-31h56V0h-56Z" fill={p.wood}/><path d="M-25-28h50v23h-50Z" fill={p.trim}/><path d="M-19-25h4v20h-4Zm10 0h4v20h-4Zm10 0h4v20H1Zm10 0h4v20h-4Z" fill={p.wood}/><path d="M-14-56h4v28h-4Zm24-11h4v38h-4Z" fill={p.wood}/><path d="M3-69h19v5H3Zm-7 24h-22v-11h22Z" fill={p.metal}/></g>;
  if(o.kind==="utility")return <g><path d="M-29-27h58V0h-58Z" fill={p.wood}/><path d="M-25-23h50v18h-50Z" fill={p.roof}/><path d="M-25-18h50v3h-50Zm-8-11h66v5h-66Z" fill={p.trim}/><path d="M-14-56h3v32h-3Z" fill={p.wood}/><path d="M-10-59 20-42 36-21" fill="none" stroke={p.metal} strokeWidth="2"/><path d="M22-35h16v21H22Z" fill="none" stroke={p.trim} strokeWidth="2"/><path d="M22-35 38-14m-16 0 16-21" stroke={p.trim} strokeWidth="1"/></g>;
  return null;
}
