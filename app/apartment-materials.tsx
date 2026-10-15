import { createContext, useContext } from "react";
import type { ThemeId } from "./cosmetic-engine";
export const HomeMaterialTheme=createContext<ThemeId>("classic");
export const HOME_MATERIALS={
 classic:{body:"#79513e",shade:"#4c3a34",mid:"#a47450",light:"#d4ad79",metal:"#c9a868",shine:"#f7deac",fabric:"#537c73",stitch:"#a6baa0",glass:"#718d8c"},
 soda:{body:"#688da6",shade:"#3c586f",mid:"#9fbfd0",light:"#deeff0",metal:"#b0c9cf",shine:"#f4ffff",fabric:"#739bb8",stitch:"#d3ebed",glass:"#7bb9cd"},
 mint:{body:"#83a69b",shade:"#4d726b",mid:"#b3c9b9",light:"#f2efdb",metal:"#b0b99a",shine:"#fffbea",fabric:"#b6cebb",stitch:"#f0f0dc",glass:"#8ec7bc"},
 bath:{body:"#976c49",shade:"#5c4437",mid:"#c0996b",light:"#edcc96",metal:"#bc8259",shine:"#fbe0aa",fabric:"#be9b70",stitch:"#f2dfb2",glass:"#a4b9a7"},
 night:{body:"#41485d",shade:"#252f43",mid:"#697183",light:"#ac9c92",metal:"#b29269",shine:"#f7d7a0",fabric:"#566e8d",stitch:"#b0b6c0",glass:"#455e79"},
 emerald:{body:"#386657",shade:"#1f413c",mid:"#659176",light:"#b4bf82",metal:"#d8b56d",shine:"#ffe6a4",fabric:"#49735b",stitch:"#b8c88a",glass:"#5d9f89"},
} as const;
/** Real material changes: cedar slats, porcelain, glass and lacquered inlays. Fixed SVG only. */
export function MaterialPanel({x=0,y=0,w,h,handle=false}:{x?:number;y?:number;w:number;h:number;handle?:boolean}){
 const theme=useContext(HomeMaterialTheme),m=HOME_MATERIALS[theme];
 return <g transform={`translate(${x} ${y})`} data-home-material={theme}>
  <rect width={w} height={h} fill={m.shade}/><path d={`M2 2h${w-4}v${h-4}H2Z`} fill={m.body}/><path d={`M3 3h${w-6}v2H5v${h-8}H3Z`} fill={m.mid}/><path d={`M${w-5} 5h2v${h-8}H5v-2h${w-10}Z`} fill={m.shade}/>
  <rect x="8" y="8" width={Math.max(1,w-16)} height={Math.max(1,h-16)} fill={theme==="mint"?m.light:theme==="soda"?m.glass:m.body}/>
  {theme==="bath"?Array.from({length:Math.min(9,Math.floor((h-12)/10))},(_,i)=><g key={i}><path d={`M8 ${10+i*10}h${w-16}v2H8Z`} fill={m.light} opacity=".6"/><path d={`M8 ${17+i*10}h${w-16}v2H8Z`} fill={m.shade}/><path d={`M11 ${13+i*10}h2v2h-2Zm${w-26} 0h2v2h-2Z`} fill={m.metal}/></g>):theme==="soda"?<><path d={`M10 10h${Math.max(1,w/3)}L12 ${h-10}h-2Zm${Math.floor(w*.65)} 0h8L${Math.floor(w*.4)} ${h-10}h-8Z`} fill={m.shine} opacity=".28"/><path d={`M7 7h9v3H10v7H7Zm${w-23} 0h9v10h-3v-7h-6ZM7 ${h-17}h3v7h6v3H7Zm${w-16} 0h2v10h-9v-3h7Z`} fill={m.metal}/></>:theme==="mint"?<><path d={`M10 17h${Math.max(2,w/3)}v2h-8v6h-6v8h-2v-9h6v-5H10ZM${w-24} ${h-33}h8v2h-4v9h-6v9h-2v-11h4Z`} fill={m.mid} opacity=".8"/>{[[10,10],[w-16,10],[10,h-16],[w-16,h-16]].map(([a,b],i)=><path key={i} d={`M${a+2} ${b}h3v2h2v3h-2v2h-3v-2h-2v-3h2Z`} fill={m.body}/>)}</>:theme==="emerald"?<><path d={`M11 16v-5h12v2H13v10h-2Zm${w-22}-5h11v12h-2V13h-9ZM11 ${h-23}h2v10h10v2H11Zm${w-11} 0v12h-12v-2h10v-10Z`} fill={m.metal}/><path d={`M${w/2} ${h/2-8}l7 8-7 8-7-8Z`} fill={m.mid}/><path d={`M${w/2} ${h/2-8}v16l-7-8Z`} fill={m.metal}/></>:<><path d={`M12 12h${Math.max(1,w-24)}v2H14v${Math.max(1,h-28)}h-2Z`} fill={m.mid}/><path d={`M17 21h${Math.max(1,w*.32)}v1H17Zm${Math.floor(w*.4)} 12h${Math.max(1,w*.33)}v1h-${Math.max(1,w*.33)}Zm-9 ${Math.max(1,h-52)}h${Math.max(1,w*.25)}v1h-${Math.max(1,w*.25)}Z`} fill={m.shade}/>{theme==="night"&&<path d={`M${w/2-2} 14h4v3h3v4h-3v3h-4v-3h-3v-4h3Z`} fill={m.metal} opacity=".8"/>}</>}
  {handle&&<><rect x={w/2-10} y={h/2-1} width="22" height="6" fill={m.shade}/><path d={`M${w/2-10} ${h/2-3}h20v4h-20Zm-2 0h3v7h-3Zm19 0h3v7h-3Z`} fill={m.metal}/><path d={`M${w/2-8} ${h/2-3}h16v1h-16Z`} fill={m.shine}/></>}
 </g>;
}
