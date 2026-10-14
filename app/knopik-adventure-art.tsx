import { DungeonRangedWeapon } from "./dungeon-weapon-art";
// Native SVG at twice the world resolution. Every direction uses the same
// shoulders, hips and ground anchor; the renderer articulates these pieces.
export const KNOPIK_FUR = { edge:"#89552f", dark:"#b97a43", fur:"#d69a5b", warm:"#e5ac6d", light:"#efbd80", cream:"#f3e2c0", ivory:"#fff1d4", shade:"#e3cda7", eye:"#312b27" };
const P=KNOPIK_FUR;
export type KnopikRigDirection = "front" | "back" | "side" | "front-diagonal" | "back-diagonal";

function Eye({x,y,small=false}: {x:number;y:number;small?:boolean}) {
  return <g transform={`translate(${x} ${y}) scale(${small ? .8 : 1} 1)`}>
    <path d="M-8-10H6v3h4V5H6v4H-7V6h-4V-6h3Z" fill="#704925"/><path d="M-7-8H5v3h3V4H5v3H-5V5h-4V-5h2Z" fill={P.eye}/><path d="M-6-7H0v6h-6Zm-2 6h3v3h-3Z" fill="#fff1d4"/><path d="M4 3h3v3H4Z" fill="#97643b"/>
  </g>;
}
function Ears({side=false}: {side?:boolean}) {
  return <g><path d={side?"M-31-118v-24h4v-11h7v8h7v10h9v17Z":"M-38-113v-30h4v-11h7v6h7v10h7v20Z"} fill={P.edge}/><path d={side?"M-28-118v-23h4v-7h2v9h7v11h7v10Z":"M-35-114v-28h4v-7h2v7h7v10h6v14Z"} fill={P.warm}/><path d={side?"M-25-139h3v9h7v9h-10Z":"M-31-140h3v9h6v12h-10v-12Z"} fill="#e9d3ac"/><path d="M14-115v-25h5v-12h7v8h7v10h6v23Z" fill={P.edge}/><path d="M17-114v-24h5v-9h2v8h7v10h5v16Z" fill={P.warm}/><path d="M23-139h3v9h5v13H20v-12h3Z" fill="#e9d3ac"/><path d="M25-130h3v13h-7v-5h4Z" fill="#b97a43"/></g>;
}
function FrontHead() {
  return <g><Ears/><path d="M-24-131H23v4h12v9h7v27h-4v13h-10v9h-15v5H-13v-5h-15v-9h-10v-13h-4v-27h7v-9h11Z" fill={P.edge}/><path d="M-23-128H22v4h11v9h6v23h-4v12h-9v8H12v5H-12v-5h-14v-8h-9v-12h-4v-23h6v-9h10Z" fill={P.fur}/><path d="M-20-125H19v4h12v8h4v9H20v-5H9v-3H-9v3h-11v5h-15v-9h4v-8h11Z" fill={P.warm}/><path d="M-15-124H14v3h11v4H10v-3H-10v3h-15v-4h10Z" fill={P.light}/><path d="M-9-114H8v8H4v9H-4v-9h-5Z" fill="#d0904c"/>
    <path d="M-31-107h13v4h4v4h-21v-4h4Zm49 0h13v4h4v4H14v-4h4Z" fill={P.cream}/><path d="M-30-106h11v3h-11Zm49 0h11v3H19Z" fill={P.ivory}/><Eye x={-21} y={-95}/><Eye x={21} y={-95}/>
    <path d="M-35-88h12v-5h9v6h7v6H7v-6h7v-6h9v5h12v15H23v8H-23v-8h-12Z" fill={P.cream}/><path d="M-32-86h10v-4h6v6h8v7H8v-7h8v-6h6v4h10v11H21v8H-21v-8h-11Z" fill={P.ivory}/><path d="M-30-74h11v6H19v-6h11v3H22v8H-22v-8h-8Z" fill={P.shade}/>
    <path d="M-11-88H11v3h5v7h-5v4H-11v-4h-5v-7h5Z" fill={P.eye}/><path d="M-8-87H8v3H-8Z" fill="#72675a"/><path d="M-2-77H2v9h8v-3h3v6H-13v-6h3v3h8Z" fill="#775442"/><path d="M-22-82h5v2h-5Zm39 0h5v2h-5Z" fill={P.shade}/><path d="M-5-64H5v2H-5Z" fill={P.ivory}/>
  </g>;
}
function SideHead() {
  return <g><Ears side/><path d="M-18-130H20v5h13v10h5v19h9v7h8v14H44v7H23v6H-1v-5h-16v-9h-11v-16h-6v-23h6v-12h10Z" fill={P.edge}/><path d="M-17-127H19v5h11v10h5v19h10v7h7v8H42v7H22v6H0v-5h-16v-8h-9v-15h-6v-20h6v-12h8Z" fill={P.fur}/><path d="M-14-124H17v4h11v9h3v12H8v-5H-5v4h-19v-12h4v-8h6Z" fill={P.warm}/><path d="M-9-123H15v3h10v4H9v-2H-14v-3h5Z" fill={P.light}/><path d="M15-107h12v3h6v5H12v-4h3Z" fill={P.cream}/><Eye x={23} y={-94}/>
    <path d="M15-87h15v-4h8v9h11v4h7v8H43v7H20v5H2v-7h9v-11h4Z" fill={P.cream}/><path d="M18-85h11v-3h6v9h13v5h5v2H41v7H19v5H7v-4h7v-12h4Z" fill={P.ivory}/><path d="M4-66h16v-4h20v3H22v6H4Z" fill={P.shade}/><path d="M46-88h11v4h3v8H48v-3h-5v-6h3Z" fill={P.eye}/><path d="M48-87h8v3h-8Z" fill="#72675a"/><path d="M33-72h12v3H32v4H20v-3h12Z" fill="#775442"/><path d="M25-78h9v1h-9Zm-32-31h4v9h-4Z" fill={P.dark}/>
  </g>;
}
function DiagonalHead() {
  return <g><Ears/><path d="M-24-130H20v4h13v9h9v24h5v14H37v9H23v6H-7v-4h-16v-7h-13v-12h-7v-23h5v-12h14Z" fill={P.edge}/><path d="M-23-127H19v4h12v9h8v23h5v10H35v9H22v5H-6v-4h-16v-7h-12v-11h-6v-20h5v-12h12Z" fill={P.fur}/><path d="M-19-124H17v4h12v8h7v13H15v-6H1v3h-13v4h-24v-13h5v-8h12Z" fill={P.warm}/><path d="M-14-123H16v3h10v4H9v-2H-19v-3h5Z" fill={P.light}/><path d="M0-114h9v8H4v10H-2v-9h-4v-7h6Z" fill="#d0904c"/>
    <path d="M-27-108h11v4h5v5h-19v-5h3Zm40-2h16v4h6v5H10v-5h3Z" fill={P.cream}/><Eye x={-20} y={-96} small/><Eye x={24} y={-94}/>
    <path d="M-36-85h10v-6h9v7h8v9H3v-10h11v-6h9v8h12v7h8v11H32v7H9v-4H-7v-3h-14v-4h-10v-7h-5Z" fill={P.cream}/><path d="M-33-83h10v-5h4v7h8v10H5v-10h11v-6h4v8h14v6h6v6H29v7H10v-4H-6v-3h-14v-4h-9v-7h-4Z" fill={P.ivory}/><path d="M-30-72h9v6h14v4H9v4h21v-3h8v3h-6v4H8v-3H-8v-4h-15v-5h-7Z" fill={P.shade}/><path d="M19-86h12v3h7v4h3v7h-9v3H23v-3h-8v-7h4Z" fill={P.eye}/><path d="M22-85h9v3h6v2H20v-2h2Z" fill="#72675a"/><path d="M27-71h3v8H21v3H9v-3h11v-3h7Z" fill="#775442"/><path d="M-26-78h8v1h-8Zm-2 5h10v1h-10Zm38 0h7v1h-7Z" fill="#ad9476"/>
  </g>;
}
function BackHead({diagonal=false}: {diagonal?:boolean}) {
  return <g><Ears/><path d="M-25-131H21v4h14v10h7v25h-4v14h-12v9H12v5H-14v-5h-14v-9h-10v-14h-4v-25h7v-10h10Z" fill={P.edge}/><path d="M-24-128H20v4h13v10h6v22h-4v13h-11v8H11v4H-13v-4h-14v-8h-8v-13h-4v-22h6v-10h9Z" fill={P.fur}/><path d="M-19-125H17v4h13v9h5v18H18v-6H1v4h-15v-3h-21v-15h6v-7h10Z" fill={P.warm}/><path d="M-14-124H16v3h11v4H8v-2H-19v-3h5Z" fill={P.light}/><path d="M-6-114H7v8h8v6H3v10H-5v-11h-9v-6h8Z" fill="#d0904c"/><path d="M-32-87h7v10h13v6H12v-6h13v-10h7v10H25v9H12v5H-13v-5h-13v-9h-6Z" fill={P.cream}/><path d="M-26-79h5v7h10v4H10v-4h12v-7h5v9H13v5H-12v-5h-14Z" fill={P.ivory}/><path d="M-26-109h5v2h-5Zm37-6h5v2h-5Zm-13 21h3v7h-3Z" fill={P.dark}/>{diagonal && <g><path d="M31-108h8v13h6v8h8v13H40v-6h-9Z" fill={P.warm}/><path d="M34-105h3v12h5v8h8v8h-8v-5h-8Z" fill={P.cream}/><path d="M47-85h6v7h-6Z" fill={P.eye}/><path d="M35-104h4v7h-4Z" fill={P.eye}/><path d="M35-104h2v2h-2Z" fill={P.ivory}/></g>}</g>;
}
function Tail({ back = false }: { back?: boolean }) {
  return <g data-knopik-tail="" transform={back ? "translate(0 -42)" : "translate(-30 -45)"}><path d="M-17-15h23v4h9v9h3v15H9v6H-8v-4h-10V8h-5V-5h6Z" fill={P.edge}/><path d="M-15-12H5v4h8v8h2v10H7v6H-6v-4h-9V6h-5V-3h5Z" fill={P.cream}/><path d="M-13-10H4v4h7v7H7v8H-5V5h-7V-3h10v-3H4v6H0v6h5V2h2V-3H3v-4H-7v4h-6Z" fill={P.ivory}/><path d="M-7-6H3v4h3v7H1v3H-7V5h-4V-2h4Z" fill={P.dark}/><path d="M-6-3H1v3h3v4H0v2H-5V3h-3V0h2Z" fill={P.warm}/></g>;
}
export function KnopikTailArtwork() { return <g transform="translate(30 45)"><Tail/></g>; }
export function KnopikHeadArtwork({ direction }: { direction: KnopikRigDirection }) {
  return direction==="front"?<FrontHead/>:direction==="side"?<SideHead/>:direction==="front-diagonal"?<DiagonalHead/>:<BackHead diagonal={direction==="back-diagonal"}/>;
}
function Torso({back=false,side=false}: {back?:boolean;side?:boolean}) {
  return <g data-knopik-torso=""><path d="M-16-79H16v5h10v18h3v25h-7v10H11v5H-11v-5h-11v-10h-7v-25h3v-18h10Z" fill={P.edge}/><path d="M-14-76H14v5h9v17h3v22h-7v9H9v4H-9v-4h-10v-9h-7v-22h3v-17h9Z" fill={P.fur}/><path d="M-9-72H11v10h7v23h-5v11H-9v-6h-9v-21h5v-10h4Z" fill={P.warm}/>{!back && <g><path d={side?"M8-67h11v11h5v19h-7v11H6v-17h2Z":"M-8-67H9v7h9v19h-5v13H-12v-13h-6v-19h10Z"} fill={P.cream}/><path d={side?"M11-63h6v11h4v13h-7v10h-5v-13h2Z":"M-5-63H7v7h8v13H9v12H-9v-12h-6v-13h10Z"} fill={P.ivory}/></g>}<path d="M-18-49h4v16h6v8h-7v-8h-3Z" fill={P.dark}/><path d="M-9-24H9v3H-9Z" fill={P.shade}/></g>;
}
function Leg({side}: {side:"far"|"near"}) {
  return <g data-knopik-leg={side}><path data-leg-edge="" d={side==="far"?"M-21-30h15V-3h-15Z":"M6-30h15V-3H6Z"} fill={P.edge}/><path data-leg-fur="" d={side==="far"?"M-18-28h9V-3h-9Z":"M9-28h9V-3H9Z"} fill={side==="far"?P.dark:P.fur}/><g data-knopik-foot="" transform={side==="far"?"translate(-13 0)":"translate(13 0)"}><path d="M-11-7H9v3h5v7H-13V-3h2Z" fill={P.edge}/><path d="M-9-6H8v4h4v3H-11v-3h2Z" fill={P.cream}/><path d="M-8-5H6v3H-8Z" fill={P.ivory}/><path d="M-5-2h2v3h-2Zm6 0h2v3H1Z" fill={P.shade}/></g></g>;
}
function Arm({side}: {side:"far"|"near"}) {
  return <g data-knopik-arm={side}><path data-arm-edge="" d={side==="far"?"M-32-63h13v28h-13Z":"M20-63h13v28H20Z"} fill={P.edge}/><path data-arm-fur="" d={side==="far"?"M-29-61h7v25h-7Z":"M23-61h7v25h-7Z"} fill={side==="far"?P.dark:P.fur}/><path data-arm-light="" fill={P.warm}/><g data-knopik-hand="" transform={side==="far"?"translate(-29 -35)":"translate(29 -35)"}><g data-knopik-tool="" display="none"><g data-held="pistol"><path d="M-8-18h53v4h7V0H15v5H7v17H-5V5h-5V-9h2Z" fill="#20232e"/><path d="M-5-15h49v3h5v9H12v5H4v17H-2V2h-6v-12h3Z" fill="#69838b"/><path d="M-4-15h47v4H-4Z" fill="#c7d6ce"/><path d="M-3-9h44v3H-3Z" fill="#536775"/><path d="M-1 5h4v13h-4Z" fill="#775442"/><path d="M10 3h12v11H10v-3h9V6h-9Z" fill="#20232e"/><path d="M44-12h5v9h-5Z" fill="#263d45"/><g data-knopik-muzzle="" display="none"><path d="M51-16h7v-6h7v9h11v9H63V3h-8V-7h-4Z" fill="#e4ad62"/><path d="M52-13h8v3h9v4H58v-3h-6Z" fill="#fff1d1"/></g></g><g data-held="sabre"><path d="M-14-5H4V6h-18Z" fill="#343041"/><path d="M-12-3H2v7h-14Z" fill="#775442"/><path d="M3-16h7v11h13v9H10v13H3Z" fill="#775442"/><path d="M5-13h3v11h13v3H8v13H5Z" fill="#f4d889"/><path d="M15-7h35v-4h28v-6h19v-8h13v-13h7v19h-6v12h-11v9H78v5H49v4H15Z" fill="#343041"/><path d="M18-4h34v-4h27v-6h19v-8h13v-10h3v12h-6v11H97v8H77v5H49v4H18Z" fill="#a4b7b3"/><path d="M20-4h32v-3h28v-6h20v-8h12v-7h2v8h-7v10H96v7H77v5H49v4H20Z" fill="#fff1d1"/></g>{(["shotgun","launcher","arc"] as const).map(weapon=><g key={weapon} data-held={weapon} display="none"><DungeonRangedWeapon weapon={weapon} held/></g>)}</g><g data-knopik-paw=""><path d="M-8-8H6v3h4v11H5v4H-6V7h-5V-4h3Z" fill={P.edge}/><path d="M-6-6H4v3h4v7H3v4H-5V5h-4V-2h3Z" fill={P.cream}/><path d="M-5-5H3v4h4v3H2v3H-5V3h-2v-4h2Z" fill={P.ivory}/><path d="M-4 3h2v4h-2Zm4 0h2v4H0Zm5-2h2v4H5Z" fill={P.shade}/></g></g></g>;
}
function Rig({direction}: {direction:KnopikRigDirection}) {
  const back=direction.startsWith("back"),side=direction==="side";
  const head=<KnopikHeadArtwork direction={direction}/>;
  return <g data-knopik-rig={direction} transform="scale(.5)">{!back && <Tail/>}<Leg side="far"/><Arm side="far"/><Leg side="near"/><Torso back={back} side={side}/>{back && <><Tail back/><Arm side="near"/></>}<g data-knopik-head="">{head}</g>{!back && <Arm side="near"/>}</g>;
}
export function AnimatedAdventureKnopik() {
  return <g data-knopik-svg=""><path data-knopik-shadow="" d="M-20-3h40v2h5v5h-5v3h-40V4h-5V-1h5Z" fill="#20232e55"/>{(["front","back","side","front-diagonal","back-diagonal"] as const).map(direction=><g key={direction} data-direction={direction} display={direction==="front"?undefined:"none"}><Rig direction={direction}/></g>)}</g>;
}
