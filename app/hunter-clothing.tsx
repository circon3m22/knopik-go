import type {ClothingPose} from './knopik-equipment';
export const HUNTER_CLOTHING=['ranger-hood','hunter-armor','raven-mask','hunter-cloak'] as const;
export type HunterClothing=typeof HUNTER_CLOTHING[number];
export const isHunterClothing=(value:unknown):value is HunterClothing=>HUNTER_CLOTHING.includes(value as HunterClothing);
const E='#1e2a2b',METAL='#9faea2',LIGHT='#f0dba4';
/** Authored front/rear/profile details, shared by all game avatars. */
export function HunterClothingArt({kind,pose='front'}:{kind:HunterClothing;pose?:ClothingPose}){
 const back=pose.startsWith('back'),side=pose==='side',diagonal=pose.includes('diagonal');
 const transform=side?'translate(-2 0) scale(.78 1)':diagonal?'translate(1 0) scale(.9 1) skewY(3)':undefined;
 if(kind==='ranger-hood')return <g transform={transform} data-hunter-clothing={kind}>
  <path d="M-25-45v-26h4v-9h9v-6h24v6h9v9h4v26h-9v-26H8v-7H-8v7h-8v26Z" fill={E}/>
  <path d="M-22-47v-23h4v-8h8v-5h20v5h8v8h4v23h-4v-26H7v-7H-7v7h-11v26Z" fill="#3e4b43"/>
  <path d="M-17-73h9v-7H8v7h9v5h-5v-6H6v-4H-6v4h-6v6h-5Z" fill="#68816a"/>
  <path d="M-23-49h9v6h-9Zm37 0h9v6h-9Z" fill="#293d35"/><path d="M-21-56h3v8h-3Zm39-6h3v12h-3Z" fill="#a6ad91"/>
  {back&&<><path d="M-18-73h36v26h-36Z" fill="#35483c"/><path d="M-10-75h20v5h-20Zm-2 7h4v15h-4Zm20 0h4v15H8Z" fill="#5a7157"/><path d="M-2-79h4v28h-4Z" fill="#263a31"/></>}
  <path d="M-6-83H6v2H-6Zm-18 19h2v13h-2Zm46 0h2v13h-2Z" fill="#b29464"/><path d="M16-80h5v5h-5Z" fill={METAL}/><path d="M17-79h2v2h-2Z" fill={LIGHT}/>
 </g>;
 if(kind==='hunter-armor')return <g transform={transform} data-hunter-clothing={kind}>
  <path d="M-23-35h12v6h22v-6h12v30h-9v3h-28v-3h-9Z" fill={E}/><path d="M-20-32h7v7h26v-7h7v25h-7v3h-26v-3h-7Z" fill="#66513f"/>
  <path d="M-18-27h3v3h-3Zm33 0h3v3h-3Zm-33 14h3v3h-3Zm33 0h3v3h-3Z" fill="#d3ac6c"/><path d="M-13-24h26v15h-26Z" fill="#3a463e"/><path d="M-11-22h22v4h-22Zm0 6h22v4h-22Z" fill="#8b9a8d"/><path d="M-10-22h20v1h-20Zm0 6h20v1h-20Z" fill={LIGHT}/>
  <path d="M-18-32h4L16-7h-5Zm32 0h4L-11-7h-5Z" fill="#a3875d"/><path d="M-4-20h8v7h-8Z" fill={E}/><path d="M-2-18h4v3h-4Z" fill="#c8c7a0"/>
  <path d="M-22-34h10v8h-10Zm34 0h10v8H12Z" fill="#5b6b63"/><path d="M-20-33h7v2h-7Zm33 0h7v2h-7Z" fill={METAL}/>
  {back&&<path d="M-6-24H6v15H-6Z M-10-20h20v3h-20Z" fill="#263a33"/>}
 </g>;
 if(kind==='raven-mask')return <g transform={transform} data-hunter-clothing={kind}>
  {back?<><path d="M-20-51h40v5h-40Z" fill="#55483c"/><path d="M-4-52h8v7h-8Z" fill={E}/><path d="M-2-50h4v3h-4Z" fill={METAL}/></>:<g transform="translate(0 8)">
   <path d={side?'M-4-53h15v4h17v5h-8v8H5v-6H-4Z':'M-20-53h9v4h22v-4h9v12h-8v6h-24v-6h-8Z'} fill={E}/>
   <path d={side?'M-1-50h10v4h13v2h-7v5H7v-6H-1Z':'M-17-50h6v4h22v-4h6v7H9v5H-9v-5h-8Z'} fill="#6f827c"/>
   <path d="M-14-48h6v2h-6Zm22 0h6v2H8Z" fill="#deb56a"/><path d="M-7-45H7v6H-7Z" fill="#a9b8aa"/><path d="M-2-46h4v8h-4Z" fill={E}/><path d="M-15-48h3v5h-3Zm27 0h3v5h-3Z" fill={LIGHT}/>
  </g>}
 </g>;
 return <g transform={transform} data-hunter-clothing={kind}>
  <path d={side?'M-12-36H1v10h-5v12h-3V0h-9v-4h-9v7h-13V-7h5v-12h8v-10h13Z':'M-14-37h28v6h8v11h4v13h7V5H20V0H10v4H0V0H-11v5H-25V1h-8V-7h6v-13h5v-11h8Z'} fill={E}/>
  <path d={side?'M-14-33h9v6h-5v14h-4v10h-9v-4h-8v5h-3v-7h5v-13h8v-7h7Z':'M-12-34h24v6h7v10h4v13h6v6h-7v-4H9v4H2v-4H-12v4h-10V0h-7v-5h6v-13h4v-10h7Z'} fill="#35483f"/>
  <path d="M-13-29h6v15h-4v12h-10v-7h5v-12h3Zm20-3h5v10h7v19h-8v-10H7Z" fill="#536c54"/><path d="M-12-34h24v3h-24Z M-20-3h7v2h-7Zm33 0h8v2h-8Z" fill="#8b9e7a"/>
  <path d="M-20-13h2v9h-2Zm5-8h2v10h-2Zm30 8h2v9h-2Zm-7-12h2v10H8Z" fill="#91a881"/>{back&&<><path d="M-4-26h8v4h7v6H5v8H-5v-8h-6v-6h7Z" fill="#162e29"/><path d="M-2-24h4v5h6v2H2v6h-4v-6h-6v-2h6Z" fill="#b1bda3"/></>}
 </g>;
}
