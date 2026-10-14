import type { NeighborhoodObject } from "./neighborhood-map";
import { NeighborhoodExtraProp, NeighborhoodPropDetails, TreeCrownDetails } from "./neighborhood-details";
export type StreetPalette={ink:string;ground:string;grass:string;leaf:string;leafLight:string;leafDark:string;paving:string;seam:string;road:string;wall:string;trim:string;wood:string;roof:string;water:string;waterLight:string;metal:string;shadow:string;night:boolean};
export function streetPalette(night:boolean):StreetPalette{return night?
  {ink:"#222738",ground:"#354c50",grass:"#3e5d55",leaf:"#345b53",leafLight:"#527d68",leafDark:"#253e43",paving:"#657077",seam:"#4b565f",road:"#414653",wall:"#697384",trim:"#97a09e",wood:"#655960",roof:"#585465",water:"#284d60",waterLight:"#6b9aab",metal:"#697c89",shadow:"#182438",night}:
  {ink:"#343041",ground:"#b6bb97",grass:"#a1b68a",leaf:"#537d65",leafLight:"#88a980",leafDark:"#3e625a",paving:"#d8c6a4",seam:"#b3a28b",road:"#88858a",wall:"#ece3ca",trim:"#d8c6a4",wood:"#775442",roof:"#ad7d6c",water:"#88b6b0",waterLight:"#c5ddd0",metal:"#667f82",shadow:"#48635e",night};}
export function StreetBuilding({object:o,p}:{object:NeighborhoodObject;p:StreetPalette}){
  const w=o.w!,h=o.h!,floors=o.floors!,v=o.variant??0,roof=80,step=(h-roof-42)/floors,columns=Math.max(3,Math.floor(w/83)),margin=(w-columns*65)/(columns+1);
  const wall=p.night?["#697384","#647c81","#7a727e","#647466"][v]:["#ece3ca","#c5d4c8","#e0b9a1","#cfceaa"][v];
  return <g data-building={o.id}>
    <path d={`M8-5h${w}v17H8Z`} fill={p.shadow} opacity=".38"/>
    <path d={`M0 ${-h+roof}h${w}V0H0Z`} fill={p.ink}/><path d={`M5 ${-h+roof+5}h${w-10}V-7H5Z`} fill={wall}/>
    <path d={`M${w-20} ${-h+roof}h20V0h-20Z`} fill={p.wood} opacity=".32"/>
    <path d={`M0 ${-h+roof}h${w}v11H0Z`} fill={p.trim}/><path d={`M7 ${-h+roof+10}h${w-14}v4H7Z`} fill={p.wood} opacity=".4"/>
    {Array.from({length:floors},(_,floor)=><g key={floor}>
      <path d={`M5 ${-h+roof+15+floor*step}h${w-10}v3H5Z`} fill={p.trim} opacity=".6"/>
      {Array.from({length:columns},(_,col)=>{
        const x=margin+col*(65+margin),y=-h+roof+22+floor*step,lit=p.night&&(floor*5+col*3+v)%4!==0;
        return <g key={col} transform={`translate(${x} ${y})`}>
          <path d="M-3-3h58v52H-3Z" fill={p.wood} opacity=".5"/><path d="M0 0h52v45H0Z" fill={p.ink}/>
          <path d="M4 4h44v37H4Z" fill={lit?(col%2?"#d8ad77":"#f0d39a"):p.night?"#344457":"#88b6b0"}/>
          <path d="M4 4h44v4H4Z" fill={lit?"#fff1c9":p.night?"#52617b":"#c5ddd0"}/>
          <path d="M8 9h8v29H8Zm28 0h7v29h-7Z" fill={lit?"#bc8c68":p.night?"#454c62":"#d8c6a4"}/>
          <path d="M24 3h4v39h-4ZM4 22h44v3H4Z" fill={p.trim}/><path d="M-5 44h63v6H-5Z" fill={p.trim}/><path d="M-3 50h57v3H-3Z" fill={p.wood} opacity=".3"/>
          {(floor+col+v)%3===1&&floor<floors-1&&<g><path d="M-8 40h70v25H-8Z" fill={p.wood}/><path d="M-5 43h64v15H-5Z" fill={wall}/><path d="M-8 41h70v3H-8Zm0 20h70v4H-8Z" fill={p.metal}/>{[0,12,24,36,48].map(xx=><path key={xx} d={`M${xx} 44h3v16h-3Z`} fill={p.metal}/>)}<path d="M3 38h20v7H3Z" fill={p.wood}/><path d="M5 32h4v7H5Zm7-3h5v10h-5Zm7 4h5v6h-5Z" fill={p.leaf}/><path d="M9 30h5v4H9Z" fill={p.night?"#ac8899":"#be8471"}/></g>}
        </g>;
      })}
    </g>)}
    <path d={`M0 ${-h+roof}V${-h+17}h12v-17h${w-24}v17h12v${roof-17}Z`} fill={p.ink}/>
    <path d={`M5 ${-h+roof-5}V${-h+22}h13v-16h${w-36}v16h13v${roof-27}Z`} fill={p.roof}/>
    {Array.from({length:5},(_,i)=><path key={i} d={`M12 ${-h+19+i*12}h${w-24}v2H12Z`} fill={p.wood} opacity=".5"/>)}
    <path d={`M18 ${-h+9}h${w-36}v4H18Zm-11 ${roof-18}h${w-14}v7H7Z`} fill={p.trim}/>
    <path d={`M${w-67} ${-h-16}h27v39h-27Z`} fill={p.wood}/><path d={`M${w-70} ${-h-18}h33v7h-33Z`} fill={p.trim}/><path d={`M${w-62} ${-h-8}h17v4h-17Z`} fill={p.roof}/>
    <path d={`M14 ${-h+roof+8}h6V-7h-6Zm-5 ${h-roof-34}h12v24H9Z`} fill={p.metal}/>
    <path d={`M${w/2-36}-71h72v71h-72Z`} fill={p.ink}/><path d={`M${w/2-30}-65h60v58h-60Z`} fill={p.wood}/>
    <path d={`M${w/2-26}-62h23v49h-23Zm27 0h23v49h-23Z`} fill={p.night?"#807471":"#b28b69"}/><path d={`M${w/2-24}-57h20v23h-20Zm27 0h20v23h-20Z`} fill={p.night?"#e1bd88":"#88b6b0"}/><path d={`M${w/2+10}-28h4v9h-4Z`} fill="#e4cc9b"/>
    <path d={`M${w/2-43}-76h86v9h-86Z`} fill={p.metal}/><path d={`M${w/2-47}-78h94v3h-94Z`} fill={p.trim}/>
    <path d={`M${w/2-39}-7h78v9h-78Zm-5 9h88v5h-88Z`} fill={p.trim}/>
    <path d={`M${w/2+51}-51h21v15h-21Z`} fill={p.night?"#3e5266":"#537d75"}/><text x={w/2+61} y={-39} textAnchor="middle" fontSize="12" fill="#fff1d1">{o.home?"8":v*4+10}</text>
    <path d={`M${w/2-5}-88h10v8h-10Z`} fill={p.wood}/><path d={`M${w/2-3}-87h6v5h-6Z`} fill={p.night?"#fff1c9":"#e4cc9b"}/>
    {o.home&&<><path d={`M${w/2-59}-110h118v18h-118Z`} fill={p.night?"#506475":"#775442"}/><text x={w/2} y={-97} textAnchor="middle" fontSize="13" fill="#fff1d1">ЛИПОВАЯ, 8</text></>}
    <path d={`M35-11h47v3H35Zm${w-130} 0h37v3h-37Z`} fill={p.wood} opacity=".4"/>
  </g>;
}
export function StreetTree({p,variant=0}:{p:StreetPalette;variant?:number}){
  const foliage=variant===3?(p.night?"#627a77":"#9ab88b"):p.leaf;
  const crown=variant===1?"M-16-181h32v14h20v16h17v25h14v45H50v20H28v9h-57v-9h-23v-20h-13v-42h12v-25h16v-19h21Z":variant===2?"M-32-166h65v12h24v25h13v46H58v23H36v12h-72v-12h-22v-23h-12v-43h13v-25h25Z":"M-23-174h46v10h24v14h16v22h10v39H60v25H41v14h-80v-14h-22v-25h-13v-39h12v-22h18v-14h21Z";
  return <g><path d="M-49-9h98v4h12v12H49v5h-98V7h-12V-5h12Z" fill={p.shadow} opacity=".3"/>
    <path d="M-13-97h25v84h9v9h-43v-9h9Z" fill={p.ink}/><path d="M-9-93h17v80h9v5h-32v-5h6Z" fill={p.wood}/><path d="M-5-76h4v51h-4Zm8-9h4v23H3Z" fill={p.trim} opacity=".5"/>
    <path d="M-7-83-30-111l-4 4 23 31Zm12 10 26-34-5-3L3-82Z" fill={p.wood}/>
    <g data-tree-crown=""><path d={crown} fill={p.ink}/><g transform="translate(0 -2) scale(.94 .96)"><path d={crown} fill={foliage}/></g>
    <path d="M-19-165h37v11h20v12h-18v9H-4v-10h-30v-11h15Zm-35 44h24v-11h22v16h-16v15h-34v-10h4Z" fill={p.leafLight}/>
    <path d="M28-133h26v24h10v20H49v14H25v-11h15v-18H28ZM-42-79h27v9h29v7h-44v-7h-12Z" fill={p.leafDark}/>
    <path d="M-8-155h15v4H-8Zm-28 28h9v4h-9Zm53 9h9v4h-9Zm-52 35h8v4h-8Zm50-8h12v4H15Z" fill={p.leafLight} opacity=".7"/>
    <TreeCrownDetails p={p} variant={variant}/>{variant===3&&<g fill={p.night?"#ae9b98":"#e4cc9b"}><path d="M-28-129h7v7h-7Zm37-22h8v8H9Zm26 40h7v7h-7Zm-18 33h7v7h-7Z"/></g>}</g>
    <path d="M-27 0h5v-7h3v10h-14v-4h6Zm44-4h4v-6h3V1H13v-4h4Z" fill={p.leaf}/>
  </g>;
}
export function StreetLamp({p,variant=0}:{p:StreetPalette;variant?:number}){
  if(variant===2)return <g><path d="M-14 0h28v5h-28Z" fill={p.shadow} opacity=".35"/><path d="M-8-55H8V1H-8Z" fill={p.ink}/><path d="M-5-51H5V-2H-5Z" fill={p.metal}/><path d="M-4-49H4v14H-4Z" fill={p.night?"#fff1c9":p.trim}/><path d="M-10-56h20v5h-20Z" fill={p.ink}/><path d="M-2-34h4v28h-4Z" fill={p.wood}/></g>;
  return <g><path d="M-19-1h38v6h-38Z" fill={p.shadow} opacity=".35"/><path d="M-8-6H8v8H-8Zm3-130H5V-5H-5Z" fill={p.ink}/><path d="M-3-128H0V-8H-3Z" fill={p.metal}/>
    <path d="M-4-142h8v13h-8Zm-15-27h30v10h-30Zm-10 34h20v5h-20Z" fill={p.ink}/>
    <path d={variant===1?"M-22-157h44v23h-44Z":"M-20-155h40v7h-5v20h-30v-20h-5Z"} fill={p.metal}/><path data-lamp-bulb="" d="M-11-146h22v15h-22Z" fill={p.night?"#fff1c9":"#d8c6a4"}/><path data-lamp-bulb="" d="M-8-143h5v10h-5Zm11 0h5v10H3Z" fill={p.night?"#fff9df":"#ece3ca"}/><path d="M-2-148h4v19h-4Z" fill={p.wood}/>
    {p.night&&<path d="M-18-148h36v20h-36Z" fill="#f0d39a" opacity=".15"/>}
    <path d="M-5-169h10v6H-5Zm-2-6h4v6h-4Z" fill={p.ink}/><path d="M-8-19H8v4H-8Z" fill={p.metal}/>
  </g>;
}
function Bench({p}:{p:StreetPalette}){return <g><path d="M-64 0H64v8H-64Z" fill={p.shadow} opacity=".32"/><path d="M-53-41h8V0h-8Zm98 0h8V0h-8Z" fill={p.ink}/>{[-46,-35,-24].map(y=><g key={y}><path d={`M-62 ${y}h124v8H-62Z`} fill={p.wood}/><path d={`M-58 ${y+1}h116v3H-58Z`} fill={p.trim}/><path d={`M-34 ${y+5}h25v1h-25Zm59 0h24v1H25Z`} fill={p.roof}/></g>)}<path d="M-65-17H65v12H-65Z" fill={p.wood}/><path d="M-61-16H61v4H-61Z" fill={p.trim}/><path d="M-63-31h7v21h-7Zm119 0h7v21h-7Z" fill={p.metal}/></g>;}
function Planter({p,variant}:{p:StreetPalette;variant:number}){return <g><path d="M-43-21h86V4h-86Z" fill={p.wood}/><path d="M-40-18h80V0h-80Z" fill={p.roof}/><path d="M-44-25h88v7h-88Z" fill={p.trim}/><path d="M-37-27h74v5h-74Z" fill={p.leafDark}/>{[-28,-13,4,22,30].map((x,i)=><g key={x}><path d={`M${x}-38h3v15h-3Zm-5 7h5v4h-5Z`} fill={p.leaf}/><path d={`M${x-4} ${-45+i%2*6}h11v7h-11Z`} fill={p.night?"#b09c92":["#be8471","#e4cc9b","#d6b3b3"][variant]}/><path d={`M${x} ${-44+i%2*6}h3v3h-3Z`} fill="#e4cc9b"/></g>)}</g>;}
function Kiosk({p}:{p:StreetPalette}){return <g><path d="M-70-7H70v16H-70Z" fill={p.shadow} opacity=".3"/><path d="M-66-101H66V0H-66Z" fill={p.ink}/><path d="M-61-96H61v91H-61Z" fill={p.wall}/><path d="M-54-78h108v48H-54Z" fill={p.wood}/><path d="M-49-73h98v38h-98Z" fill={p.night?"#d5b784":"#88b6b0"}/><path d="M-45-67h17v25h-17Zm24-3h27v28h-27Zm33 6h26v23H12Z" fill={p.night?"#e4cc9b":"#c5ddd0"}/><path d="M-54-30h108v8H-54Z" fill={p.wood}/><path d="M-69-108H69v25H-69Z" fill={p.wood}/>{[-64,-44,-24,-4,16,36,56].map((x,i)=><path key={x} d={`M${x}-106h14v22h-14Z`} fill={i%2?p.night?"#8b7680":"#be8471":p.trim}/>)}<path d="M-49-135h98v23H-49Z" fill={p.wood}/><text x="0" y="-119" textAnchor="middle" fontSize="15" fill="#fff1d1">У РИТЫ</text><path d="M-38-18h24v13h-24Zm27 0h23v13h-23Zm27 0h24v13H16Z" fill={p.trim}/><path d="M-38-16h24v3h-24Zm27 0h23v3h-23Zm27 0h24v3H16Z" fill={p.leaf}/><path d="M-61-89h5v65h-5Zm117 0h5v65h-5Z" fill={p.metal}/><g data-rita-portrait="" transform="translate(-2 -46)"><path d="M-11-21H11v4h4V0h-4v5H-11V0h-4v-17h4Z" fill={p.ink}/><path d="M-8-16H8V0H-8Z" fill={p.night?"#b6a28e":"#e4c394"}/><path d="M-12-20h24v7H-12Zm-3 5h5V1h-5Zm25 0h5V1h-5Z" fill={p.wood}/><path d="M-6-10h3v3h-3Zm9 0h3v3H3Z" fill={p.ink}/><path d="M-3-2h6v2h-6Z" fill={p.roof}/><path d="M-10 5h20v8h-20Z" fill={p.leaf}/><path d="M-3 5h6v4h-6Z" fill={p.trim}/></g></g>;}
function Bicycle({p,variant}:{p:StreetPalette;variant:number}){return <g><path d="M-55 1H55v4H-55Z" fill={p.shadow} opacity=".4"/>{[-35,35].map(x=><g key={x}><path d={`M${x-19}-35h38v4h5v27h-5V0h-38v-4h-5v-27h5Z`} fill={p.ink}/><path d={`M${x-15}-31h30v25h-30Z`} fill={p.ground}/><path d={`M${x}-29v21m-13-10h26`} stroke={p.metal} strokeWidth="2"/></g>)}<path d="M-35-18-10-49 13-18H-35L-12-18 14-45 35-18M-10-49h23m-22-9v10m24-7 3-12h-10" fill="none" stroke={variant?p.trim:p.night?"#a48a85":"#be8471"} strokeWidth="4"/><path d="M-20-59h19v5h-19Zm30-13h19v4H10Z" fill={p.wood}/></g>;}
function Car({p,variant}:{p:StreetPalette;variant:number}){const color=p.night?(variant?"#627989":"#8f6f76"):variant?"#88b6b0":"#be8471";return <g><path d="M-93-4H93v13H-93Z" fill={p.shadow} opacity=".4"/><path d="M-83-43h166v6h10v35h-10v6H-83v-6h-10v-35h10Z" fill={p.ink}/><path d="M-79-39H79v5h10v29H79v5H-79v-5h-10v-29h10Z" fill={color}/><path d="M-38-62h75v8h17v31H-55v-31h17Z" fill={p.ink}/><path d="M-35-58h69v7h15v23H-50v-23h15Z" fill={p.water}/><path d="M-31-55h25v24h-37v-17h12Zm29 0h31v7h14v17H-2Z" fill={p.night?"#344457":"#c5ddd0"}/><path d="M-78-37h21v5h-21Zm137 0h19v5H59Z" fill={p.trim}/><path d="M-78-6h23v16h-23Zm133 0h23v16H55Z" fill={p.ink}/><path d="M-71-1h9v8h-9Zm133 0h9v8h-9Z" fill={p.metal}/><path d="M-84-21h10v8h-10Zm158 0h10v8H74Z" fill="#e4cc9b"/><path d="M-27-18h9v3h-9Zm43 0h9v3h-9Z" fill={p.wood}/></g>;}
function BaseStreetProp({object:o,p}:{object:NeighborhoodObject;p:StreetPalette}){
  const v=o.variant??0;
  switch(o.kind){
    case "house":return <StreetBuilding object={o} p={p}/>;
    case "tree":return <StreetTree p={p} variant={v}/>;
    case "lamp":return <StreetLamp p={p} variant={v}/>;
    case "bench":return <Bench p={p}/>;
    case "planter":return <Planter p={p} variant={v}/>;
    case "kiosk":return <Kiosk p={p}/>;
    case "bicycle":return <Bicycle p={p} variant={v}/>;
    case "car":return <Car p={p} variant={v}/>;
    case "sign":return <g><path d="M-4-89h8V0h-8Z" fill={p.wood}/><path d="M-48-92h89v5h9v23h-98Z" fill={p.ink}/><path d="M-44-88h81v5h9v15h-90Z" fill={p.trim}/><text x="0" y="-74" fontSize="12" textAnchor="middle" fill={p.ink}>{["ПАРК →","К РЕКЕ ↓","RUN →"][v]}</text></g>;
    case "bin":return <g><path d="M-17-48h34v45h-34Z" fill={p.ink}/><path d="M-13-44h26v38h-26Z" fill={p.metal}/><path d="M-20-51h40v7h-40Z" fill={p.wood}/><path d="M-7-36h3v27h-3Zm11 0h3v27H4Z" fill={p.trim}/></g>;
    case "hydrant":return <g><path d="M-9-42h18v39H-9Zm-9 11h36v8h-36Z" fill={p.ink}/><path d="M-6-39h12v32H-6Zm-9 10h30v4h-30Z" fill={p.night?"#8f6f76":"#be8471"}/><path d="M-12-46h24v6h-24ZM-2-35h4v6h-4Z" fill={p.trim}/></g>;
    case "mailbox":return <g><path d="M-4-29h8V0h-8Z" fill={p.wood}/><path d="M-24-66h48v36h-48Z" fill={p.ink}/><path d="M-20-62h40v28h-40Z" fill={p.leaf}/><path d="M-13-54h26v4h-26Z" fill={p.ink}/><text x="0" y="-39" textAnchor="middle" fontSize="9" fill={p.trim}>ПОЧТА</text></g>;
    case "fence":return <g>{[-90,-65,-40,-15,10].map(y=><path key={y} d={`M-6 ${y}h12v4h-12Z`} fill={p.trim}/>)}<path d="M-5-107h10v127H-5Z" fill={p.wood}/><path d="M-7-108h14v7H-7Z" fill={p.trim}/></g>;
    case "notice":case "fountain":case "utility":return <NeighborhoodExtraProp object={o} p={p}/>;
    case "stone":return <g><path d="M-24-11h12v-7h26v6h13V1h-51Z" fill={p.seam}/><path d="M-17-9h11v-5h17v6h10v3h-38Z" fill={p.trim}/></g>;
  }
}
export function StreetProp({object,p}:{object:NeighborhoodObject;p:StreetPalette}){return <><BaseStreetProp object={object} p={p}/><NeighborhoodPropDetails object={object} p={p}/></>;}
export { AnimatedNeighborhoodResident as NeighborhoodResident } from "./neighborhood-resident-art";
export function NeighborhoodCat({p}:{p:StreetPalette}){return <g><path d="M-22 1h44v5h-44Z" fill={p.shadow} opacity=".35"/><path d="M-20-18h38v18h-38Z" fill={p.ink}/><path d="M-16-15h31v13h-31Z" fill={p.trim}/><g data-cat-head=""><path d="M10-27h6v-6h5v10h6v-10h5v6h5v24H10Z" fill={p.ink}/><path d="M14-24h19v17H14Z" fill={p.trim}/><path d="M16-20h4v3h-4Zm11 0h4v3h-4Z" fill={p.leafDark}/><path d="M22-13h3v3h-3Z" fill={p.wood}/></g><path data-cat-tail="" d="M-21-9h-8v-10h-5v-9h5v6h5v10h7Z" fill={p.trim}/></g>;}
