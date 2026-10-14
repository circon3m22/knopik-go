export type { KnopikEquipment } from "./knopik-equipment-state";
import { ClothingGlyph, type ClothingKind } from "./clothing-art";
export type ClothingPose="front"|"back"|"side"|"front-diagonal"|"back-diagonal";
const POSES:ClothingPose[]=["front","back","side","front-diagonal","back-diagonal"];
const EDGE="#343041";
/** Five authored views. A mohawk is a narrow hair ridge from forehead to nape;
 * its profile is a comb, while its frontal/rear views stay on the skull centre. */
function WornClothing({kind,pose}:{kind:ClothingKind;pose:ClothingPose}){
 const back=pose.startsWith("back"),side=pose==="side",diagonal=pose.includes("diagonal");
 if(kind==="mohawk"){
  if(side)return <g transform="translate(-17 -80) scale(.27 .28)"><path d="M4 52V40h8V29h8V17h8v15h8V8h8v20h8V2h8v22h8V5h8v26h8V12h8v26h8V25h8v29h8v12H4Z" fill={EDGE}/><path d="M10 52V43h8V33h8V25h2v17h12V16h2v22h14V10h2v27h14V13h2v29h14V20h2v29h14V33h2v27H10Z" fill="#cc624f"/><path d="M27 36h6v24h-6Zm16-12h6v36h-6Zm16-8h6v44h-6Zm18 7h6v37h-6Zm16 11h5v26h-5Z" fill="#ed9674"/><path d="M45 27h3v20h-3Zm16-6h3v22h-3Zm17 6h3v21h-3Z" fill="#ffe4b0"/><path d="M10 60h102v3H10Z" fill="#a14e44"/></g>;
  if(diagonal)return <g transform="translate(-10 -81) scale(.28 .28)"><path d={back?"M7 60V46h5V29h7V12h8v20h5V5h9v17h7v17h6v31H7Z":"M9 66V48h7V28h6V10h8v18h8V3h8v27h8v20h8v19H9Z"} fill={EDGE}/><path d={back?"M12 59V48h6V31h6V21h2v21h10V12h2v16h7v15h5v23H12Z":"M15 63V51h7V31h5V19h2v21h13V11h1v25h7v20h6v9H15Z"} fill="#cc624f"/><path d={back?"M26 34h5v28h-5Zm13-5h5v33h-5Z":"M27 35h6v28h-6Zm16-13h6v41h-6Z"} fill="#ed9674"/><path d="M28 43h3v15h-3Zm14-7h3v18h-3Z" fill="#ffe4b0"/></g>;
  return <g transform="translate(-6 -81) scale(.25 .28)"><path d={back?"M7 63V43h5V23h7V5h10v18h7v20h5v25H7Z":"M7 66V45h5V25h6V4h12v21h6v20h5v24H7Z"} fill={EDGE}/><path d="M12 63V46h5V28h6V10h2v18h6v18h5v18H12Z" fill={back?"#a64d45":"#cc624f"}/><path d="M21 23h7v39h-7Z" fill="#ed9674"/><path d="M23 16h3v30h-3Z" fill="#ffe4b0"/></g>;
 }
 if(kind==="hat"){
  if(side)return <g transform="translate(-17 -83) scale(.35 .32)"><path d="M4 57V25h10V15h16v-5h30v5h18v8h10v34h6v9H0v-9Z" fill={EDGE}/><path d="M9 53V28h10v-9h56v9h8v25Z" fill="#3d6852"/><path d="M14 31h65v20H14Z" fill="#56875d"/><path d="M20 20h44v6H20ZM11 30h5v20h-5Z" fill="#91b17a"/><path d="M4 57h86v5H4Z" fill="#d4b070"/><path d="M15 45h5v5h-5Zm14-14h5v5h-5Zm31 2h6v7h-6Z" fill="#e4cc9b"/><path d="M5 58h30v2H5Z" fill="#fff1d1"/></g>;
  if(diagonal)return <g transform="translate(-20 -83) scale(.33 .32)"><path d="M5 55V25h12V16h20V8h43v5h20v10h15v32h9v10H0V55Z" fill={EDGE}/><path d="M11 52V29h12v-8h63v-3h10v10h13v24Z" fill="#3d6852"/><path d="M17 31h85v20H17Z" fill="#56875d"/><path d="M23 22h57v6H23Zm-10 9h7v17h-7Z" fill="#91b17a"/><path d="M4 57h116v4H4Z" fill="#d4b070"/>{back?<path d="M30 36h4v5h-4Zm52 0h4v5h-4Z" fill="#e4cc9b"/>:<><path d="M65 30h27v15H65Z" fill="#775442"/><path d="M69 33h19v8H69Z" fill="#e4cc9b"/><path d="M76 34h4v6h-4Z" fill="#537d75"/></>}<path d="M10 57h45v2H10Z" fill="#fff1d1"/></g>;
  if(back)return <g transform="translate(-21 -84) scale(.33 .31)"><path d="M12 50V20h12V12h16V8h48v4h16v8h12v30h8v14H4V50Z" fill={EDGE}/><path d="M16 48V24h12v-8h72v8h12v24Z" fill="#3d6852"/><path d="M20 28h88v20H20Z" fill="#56875d"/><path d="M28 18h72v6H28Z" fill="#91b17a"/><path d="M8 53h112v7H8Z" fill="#d4b070"/><path d="M42 30h4v9h-4Zm36 0h4v9h-4Zm-17 8h6v5h-6Z" fill="#e4cc9b"/></g>;
  return <g transform="translate(-21 -84) scale(.33 .31)"><ClothingGlyph kind="hat"/></g>;
 }
 if(kind==="bandana"||kind==="charm"){
  if(back)return <g transform="translate(0 -31)">{kind==="bandana"?<><path d="M-20-5h40V4h-8v3h-24V4h-8Z" fill={EDGE}/><path d="M-18-3h36v6H9v2H-9V3h-9Z" fill="#496c86"/><path d="M-18-3h36v2h-36Z" fill="#88b6b0"/><path d="M-3-3h6v7h5v4H2V5h-4v3h-6V4h5Z" fill="#f4d889"/></>:<><path d="M-20-4h40v8h-9v2h-22V4h-9Z" fill="#71552e"/><path d="M-18-2h36v4H9v2H-9V2h-9Z" fill="#dbad4d"/><path d="M-18-2h36v1h-36Z" fill="#ffe39a"/><path d="M-3-2h6v4h-6Z" fill="#775442"/></>}</g>;
  if(side)return <g transform="translate(2 -31)">{kind==="bandana"?<><path d="M-13-7h20v5h10v7H7v14H-2V6h-7v-4h-4Z" fill={EDGE}/><path d="M-11-5H5v5h10v3H5v13H0V4h-7V0h-4Z" fill="#496c86"/><path d="M-10-4H4v2h-14ZM1 5h3v5H1Z" fill="#88b6b0"/><path d="M3 11h2v3H3Z" fill="#f4d889"/></>:<><path d="M-13-6H7v4h10v9H8v3H2V6h-12v-3h-3Z" fill="#71552e"/><path d="M-11-4H5v4h10v5H6v3H4V4H-8V1h-3Z" fill="#dbad4d"/><path d="M-11-4H5v2h-16Zm18 4h5v5H7Z" fill="#ffe39a"/></>}</g>;
  return <g transform={diagonal?"translate(-17 -39) scale(.31 .27) skewY(7)":"translate(-23 -39) scale(.36 .30)"}><ClothingGlyph kind={kind}/></g>;
 }
 if(kind==="goggles"){
  if(back)return <g><path d="M-19-51h38v5h-38Z" fill={EDGE}/><path d="M-18-50h36v3h-36Z" fill="#b98461"/><path d="M-3-51h6v5h-6Z" fill="#775442"/></g>;
  if(side)return <g><path d="M-15-51h27v-3h12v16H12v-8h-27Z" fill={EDGE}/><path d="M-14-50h29v-2h7v12h-8v-7h-28Z" fill="#b98461"/><path d="M16-50h4v8h-4Z" fill="#69c9d4"/><path d="M16-49h2v5h-2Z" fill="#d5f5e4"/></g>;
  return <g transform={diagonal?"translate(-23 -64) scale(.39 .41) skewY(5)":"translate(-26 -63) scale(.41)"}><ClothingGlyph kind="goggles"/></g>;
 }
 return <g transform={side?"translate(-23 -49) scale(.30 .43) skewY(-8)":diagonal?"translate(-29 -53) scale(.43 .46) skewY(-3)":"translate(-32 -53) scale(.5 .46)"}>{back?<ClothingGlyph kind="cape"/>:<><path d="M35 4h58v10h10v17h7v45h10v31H8V76h10V31h7V14h10Z" fill={EDGE}/><path d="M40 10h48v10h10v15h6v42h9v24H15V77h9V35h6V20h10Z" fill="#4b5c90"/><path d="M40 22h17v68H33V68H24V35h6V20h10Zm32-4h16v16h8v62H73Z" fill="#6991ad"/><path d="M40 12h46v6H40Z" fill="#b5d9b6"/></>}</g>;
}
function Variants({kind}:{kind:ClothingKind}){return <>{POSES.map(pose=><g key={pose} data-clothing-pose={pose} display="none"><WornClothing kind={kind} pose={pose}/></g>)}</>;}
export function WornHeadwearPortrait({kind,className}:{kind:"hat"|"mohawk";className:string}){return <svg className={`pixel-art pixel-clothing ${className}`} viewBox={kind==="hat"?"-22 -83 44 23":"-6 -81 12 21"} shapeRendering="crispEdges" aria-hidden="true"><WornClothing kind={kind} pose="front"/></svg>;}
export function KnopikEquipmentArt({layer="front"}:{layer?:"back"|"front"}){
 if(layer==="back")return <g data-knopik-cape="back" display="none"><Variants kind="cape"/></g>;
 return <><g data-knopik-cape="front" display="none"><Variants kind="cape"/></g><g data-knopik-neckwear="" display="none">{(["bandana","charm"] as const).map(kind=><g key={kind} data-worn={kind} display="none"><Variants kind={kind}/></g>)}</g><g data-knopik-headwear="">{(["hat","mohawk","goggles"] as const).map(kind=><g key={kind} data-worn={kind} display="none"><Variants kind={kind}/></g>)}</g></>;
}
