import { useId, type RefObject } from "react";
import { NEIGHBORHOOD_BUILDINGS, NEIGHBORHOOD_OBJECTS } from "./neighborhood-map";
import { MAP_INK, pixelMapBox, PixelMapGoal, PixelMapPlayer } from "./pixel-map-symbols";
import {LAB_SOURCES,LAB_MATERIALS} from "./laboratory-engine";

export function DistrictMap({playerRef,player,night,goal}:{playerRef?:RefObject<SVGGElement|null>;player?:{x:number;y:number};night:boolean;goal:{x:number;y:number}|null}) {
  const id=`district-${useId().replaceAll(":","")}`,grass=night?"#465c55":"#88a980",path=night?"#778381":"#d8c6a4",water=night?"#44596e":"#88b6b0";
  return <svg className="neighborhood-map atlas-map pixel-atlas" shapeRendering="crispEdges" viewBox="0 0 2400 2050" role="img" aria-label="Липовый квартал: ваш дом, парк, дворы, набережная и вход в Knopik Run">
    <defs>
      <pattern id={id} width="96" height="96" patternUnits="userSpaceOnUse"><rect width="96" height="96" fill={grass}/><path d="M16 22h16v6H16Zm48 36h16v6H64Zm-37 18h6v-8h6v8h6v6H27Z" fill={night?"#61796a":"#a3ba8f"}/></pattern>
      <pattern id={`${id}-water`} width="176" height="96" patternUnits="userSpaceOnUse"><rect width="176" height="96" fill={water}/><path d="M16 24h48v8H16Zm80 40h32v8H96Zm48-42h16v8h-16Z" fill={night?"#617b8a":"#b7d2c3"}/></pattern>
      <pattern id={`${id}-paving`} width="64" height="48" patternUnits="userSpaceOnUse"><rect width="64" height="48" fill={path}/><path d="M0 0h64v6H0Zm0 0h6v48H0Z" fill={night?"#637572":"#c5b395"}/></pattern>
    </defs>
    <rect width="2400" height="2050" fill={`url(#${id})`}/>
    <path d={pixelMapBox(1160,240,1008,576,24)} fill={night?"#365449":"#769568"}/><path d="M1160 280h16v480h-16Zm32-40h928v16h-928Z" fill={night?"#557361":"#b5c798"}/>
    <path d="M336 576h144v1088H336Zm1728 224h112v864h-112ZM320 1536h1888v144H320ZM0 784h2400v256H0Z" fill={`url(#${id}-paving)`}/>
    <path d="M520 1056h88v432h-88Zm536-16h88v496h-88Zm488 0h96v496h-96ZM320 1472h1888v64H320Z" fill={`url(#${id}-paving)`}/>
    <path d="M0 848h2400v128H0Z" fill={MAP_INK}/>{Array.from({length:19},(_,i)=><rect key={i} x={i*128} y="904" width="64" height="8" fill="#d8c6a4"/>)}
    {[352,2080].map(x=><g key={x}>{Array.from({length:6},(_,i)=><rect key={i} x={x+i*18} y="864" width="10" height="96" fill="#ece3ca"/>)}</g>)}
    <path d="M1376 800V592h80v-72h104v-72h392v304h-144V656h-232v64h-88v80Z" fill={night?"#9a9b80":"#e4cc9b"}/>
    <path d="M1400 784V616h80v-72h104v-72h344v256h-96v-96h-280v64h-88v88Z" fill={`url(#${id}-paving)`}/>
    {[{x:1595,y:555,w:136,h:104},{x:1810,y:1080,w:152,h:80}].map((f,i)=><g key={i} transform={`translate(${f.x} ${f.y})`}><path d={pixelMapBox(-f.w/2,-f.h/2,f.w,f.h,16)} fill={MAP_INK}/><path d={pixelMapBox(-f.w/2+8,-f.h/2+8,f.w-16,f.h-16,12)} fill="#a4b7b3"/><path d={pixelMapBox(-f.w/2+20,-f.h/2+20,f.w-40,f.h-40,8)} fill={water}/><path d="M-8-18H8v10h8V8H8v8H-8V8h-8V-8h8Z" fill="#ece3ca"/></g>)}
    <rect y="1712" width="2400" height="338" fill={`url(#${id}-water)`}/><path d="M0 1680h2400v16H0Zm0 32h2400v8H0Z" fill={MAP_INK}/><path d="M0 1696h2400v16H0Z" fill="#a4b7b3"/>
    <rect x="1872" y="1664" width="224" height="160" fill={MAP_INK}/><rect x="1880" y="1664" width="208" height="152" fill="#b69371"/>{Array.from({length:8},(_,i)=><path key={i} d={`M1880 ${1672+i*18}h208v5h-208Z`} fill="#775442"/>)}
    <path d="M1744 1776h64v16h-8v8h-48v-8h-8Z" fill="#ece3ca"/><path d="M1776 1744h8v32h-8Z" fill="#775442"/>
    {NEIGHBORHOOD_BUILDINGS.map(b=><g key={b.id} data-map-building={b.id}>
      <path d={pixelMapBox(b.x+16,b.y-b.h!+24,b.w!,b.h!,16)} fill={MAP_INK}/>
      <path d={pixelMapBox(b.x,b.y-b.h!,b.w!,b.h!,16)} fill={b.home?"#f4d889":night?"#746875":"#a4b7b3"}/>
      <path d={pixelMapBox(b.x+12,b.y-b.h!+12,b.w!-24,b.h!-24,12)} fill={night?"#617078":b.home?"#b98471":"#949c94"}/>
      <rect x={b.x+24} y={b.y-b.h!+24} width={b.w!-48} height={b.h!-48} fill={night?"#485968":b.home?"#99715f":"#788c8c"}/>
      <path d={`M${b.x+24} ${b.y-b.h!/2}h${b.w!-48}v8h-${b.w!-48}Z`} fill={night?"#746875":"#a4b7b3"}/>
      {Array.from({length:Math.floor(b.w!/64)},(_,i)=><g key={i}>{[b.y-b.h!+32,b.y-60].map((y,j)=><g key={j}><rect x={b.x+32+i*64} y={y} width="32" height="24" fill={MAP_INK}/><rect x={b.x+36+i*64} y={y+4} width="24" height="16" fill={night?"#e4cc9b":"#b6d1cb"}/><rect x={b.x+46+i*64} y={y+4} width="4" height="16" fill="#775442"/></g>)}</g>)}
      <path d={`M${b.x+b.w!/2-24} ${b.y}h48v24h-48Z`} fill={night?"#a9987d":"#ece3ca"}/>
      {b.home&&<g transform={`translate(${b.x+b.w!/2} ${b.y-b.h!/2})`}><path d={pixelMapBox(-56,-48,112,96,12)} fill={MAP_INK}/><path d="M-8-32H8v8h12v8h12v8h12V4H24v24H8V12H-8v16h-16V4h-20V-8h12v-8h12v-8h12Z" fill="#f4d889"/></g>}
    </g>)}
    {NEIGHBORHOOD_OBJECTS.filter(o=>o.kind==="tree").map(o=><g key={o.id} transform={`translate(${o.x} ${o.y-16})`}><path d={pixelMapBox(-32,-24,88,72,16)} fill={night?"#343e3c":"#617c60"}/><path d="M-24-40h48v8h16v16h8v32H32v16H-24v-8h-16V0h-8v-24h24Z" fill={night?"#4d705c":"#56875b"}/><path d="M-16-32h32v8h16v8H8v8h-32v-8h-8v-8h16Z" fill={night?"#6a8769":"#91b17a"}/><path d="M-24 8h16v8h16v8h-32Zm40-16h16V8H16Z" fill={night?"#365449":"#426e4e"}/></g>)}
    {NEIGHBORHOOD_OBJECTS.filter(o=>o.kind==="lamp").map(o=><g key={o.id} transform={`translate(${o.x} ${o.y})`}>{night&&<path d={pixelMapBox(-32,-32,64,64,16)} fill="#f4d889" opacity=".12"/>}<path d="M-12-12h24v24h-24Z" fill={MAP_INK}/><path d="M-6-6H6V6H-6Z" fill={night?"#fff1d1":"#e4cc9b"}/></g>)}
    {[1168,1248,1328].map(y=><g key={y}><rect x="1744" y={y} width="272" height="40" fill="#775442"/>{Array.from({length:8},(_,i)=><path key={i} d={`M${1760+i*32} ${y+8}h8v8h8v8h-24v-8h8Z`} fill={night?"#779572":"#b5c798"}/>)}</g>)}
    <g fontSize="65" fill={night?"#ece3ca":MAP_INK} textAnchor="middle" fontFamily="Knopik Pixel, Tiny5, monospace"><text x="420" y="738">ВАШ ДОМ</text><text x="1770" y="412" fill="#ece3ca">ЛИПОВЫЙ ПАРК</text><text x="1220" y="1635">НАБЕРЕЖНАЯ</text><text x="1240" y="1920" fill={night?"#b6d1cb":MAP_INK} letterSpacing="12">РЕКА</text></g>
    <g transform="translate(2230 780)"><path d={pixelMapBox(-100,-52,192,72,8)} fill={MAP_INK}/><rect x="-88" y="-40" width="168" height="48" fill="#617c7a"/><text textAnchor="middle" y="-2" fontSize="56" fill="#fff1d1">RUN →</text></g>
    <g transform="translate(2230 135)"><path d="M-6-40H6v16h10v16h12V4H6v-12H-6V4h-22V-8h12v-16h10Z" fill="#ece3ca"/><text y="65" textAnchor="middle" fontSize="52" fill={night?"#ece3ca":MAP_INK}>С</text></g>
    {LAB_SOURCES.map((s,i)=><g key={s.id} data-map-ingredient={s.id} transform={`translate(${s.x} ${s.y})`} aria-label={`${LAB_MATERIALS[s.material].name}: ${LAB_MATERIALS[s.material].where}`}><path d={pixelMapBox(-30,-32,60,64,8)} fill={MAP_INK}/><path d="M-24-26h48v52h-48Z" fill={LAB_MATERIALS[s.material].color}/><text y="16" textAnchor="middle" fontSize="46" fill={MAP_INK}>{["Ц","Л","К","И"][i]}</text></g>)}
    {goal&&<g transform={`translate(${goal.x} ${goal.y})`} data-map-goal=""><PixelMapGoal/></g>}
    <PixelMapPlayer x={player?.x??410} y={player?.y??655} playerRef={playerRef}/>
  </svg>;
}
