// Authored at twice the world resolution, matching the density of PixelDog.
// The feet stay at y=0, heads at y=-76, and hand/weapon pivots declare their
// local coordinates so the renderer never moves a high-detail limb off its joint.
const P = {
  ink: "#343041", edge: "#a86739", shadow: "#b97a43", fur: "#d69a5b",
  warm: "#e5ac6d", light: "#efbd80", crown: "#d0904c", crease: "#bf7b3e",
  ear: "#775442", earLight: "#e5b076", cream: "#f3e2c0", ivory: "#fff1d4",
  creamShade: "#e3cda7", creamMid: "#e9d3ac", whisker: "#ad9476",
  eyeEdge: "#342923", iris: "#734624", irisLight: "#986134", pupil: "#241f21",
  nose: "#312b27", noseLight: "#453c34", shine: "#72675a",
};
function CurledTail({ back = false }: { back?: boolean }) {
  return <g transform={back ? "translate(-7 -42)" : "translate(-30 -44)"}>
    <path d="M-13-18H8v3h9v7h6v18h-4v9h-9v5H-12v-4h-8v-8h-5V-5h5v-8h7Z" fill={P.edge}/>
    <path d="M-12-15H7v3h8v6h5v15h-4v8H9v4H-11v-4h-7v-7h-4V-4h5v-7h5Z" fill={P.warm}/>
    <path d="M-10-13H6v3h7v6h5V9h-5v7H6v3H-9v-4h-7V8h-4V-3h5v-6h5Zm4 6h-6v5h-4v9h5v6h10V8H-7V0h7v-5h7v8H4v5H0v4h6V8h6V0H8v-6H-6Z" fill={P.cream}/>
    <path d="M-9-12H5v3h7v5h3V5h-3V-2H8v-5H-9Zm-8 11h3v9h-3Z" fill={P.ivory}/>
    <path d="M-13 12h5v4H6v-3h5v4H6v3H-9v-4h-4Z" fill={P.creamShade}/>
    <path d="M-6-5H1v3h5v7H1v3h-7V5h-5V-2h5Z" fill={P.shadow}/>
    <path d="M-5-3H0v3h4v4H0v2h-5V4h-4V0h4Z" fill={P.fur}/>
    <path d="M-18-4h2v5h-2Zm26 18h4v2H8ZM0-12h3v2H0Z" fill={P.light}/>
  </g>;
}
function DogLegs() {
  return <g data-feet="">
    <g data-step-leg="-1"><path d="M-19-34h16v18h-4v7h-3v4h-25v-8h8v-8h8Z" fill={P.edge}/><path d="M-17-31h11v15h-4v7h-21v-4h7v-7h7Z" fill={P.fur}/><path d="M-14-29h5v14h-5Z" fill={P.warm}/><path d="M-29-14h19v4h3v5h-27v-6h5Z" fill={P.cream}/><path d="M-27-13h16v3h-16Z" fill={P.ivory}/><path d="M-31-7h23v2h-23Z" fill={P.creamShade}/><path d="M-27-9h2v4h-2Zm7 0h2v4h-2Z" fill={P.whisker}/></g>
    <g data-step-leg="1"><path d="M9-35h18v19h3v8h9V0H6v-8h3Z" fill={P.edge}/><path d="M12-32h12v18h3v9h9v3H9v-6h3Z" fill={P.fur}/><path d="M16-31h5v16h-5Z" fill={P.warm}/><path d="M10-12h17v5h11v7H7v-6h3Z" fill={P.cream}/><path d="M12-10h12v4h9v3H9v-2h3Z" fill={P.ivory}/><path d="M8-2h30v2H8Z" fill={P.creamShade}/><path d="M16-6h2v5h-2Zm8 1h2v4h-2Zm8 0h2v4h-2Z" fill={P.whisker}/></g>
  </g>;
}
function FarDogArm({ back = false }: { back?: boolean }) {
  return <g><path d={back ? "M-25-69h-11v12h-7v25h5v10h13v-8h-5v-23h5Z" : "M-25-66h-12v10h-6v24h4v10h15v-8h-5v-20h4Z"} fill={P.edge}/><path d="M-29-63h-6v12h-5v18h4v6h8v-5h-5v-21h4Z" fill={P.fur}/><path d="M-31-58h3v13h-3Zm-7 14h3v11h-3Z" fill={P.warm}/><path d="M-39-33h11v5h5v7h-16v-5h-3v-4h3Z" fill={P.cream}/><path d="M-38-31h9v4h-9Z" fill={P.ivory}/><path d="M-38-23h15v2h-15Zm3-5h2v5h-2Zm6 0h2v5h-2Z" fill={P.creamShade}/></g>;
}
function NearDogArm({ back = false }: { back?: boolean }) {
  return <g><g data-punch-reach="" display="none">
    <path d={back ? "M25-65h12v-8h8v-10h13v17H45v8H25Z" : "M25-65h12v7h10v6h8v15H42v-8H33v-7h-8Z"} fill={P.edge}/>
    <path d={back ? "M28-62h7v-8h12v-10h8v11H42v8H28Z" : "M28-62h7v7h10v6h7v9h-7v-8H35v-7h-7Z"} fill={P.fur}/>
    <path d={back ? "M29-64h7v-7h11v-8h5v4h-8v7H32v4h-3Z" : "M29-63h7v7h10v6h5v3h-9v-6H32v-7h-3Z"} fill={P.warm}/>
  </g><g data-fist="" data-rest-x="35" data-rest-y="-51" data-attack-x="51" data-attack-y={back ? "-70" : "-38"} transform="translate(35 -51)">
    <path d="M-9-15H5v6h5v26H5v8H-9v-7h-4V-7h4Z" fill={P.edge}/><path d="M-7-12H3v7h5v19H3v8H-7v-6h-4V-5h4Z" fill={P.fur}/><path d="M-4-11H2v19h-6Z" fill={P.warm}/><path d="M-10 8H5v6h5v9H5v4H-9v-4h-5V13h4Z" fill={P.cream}/><path d="M-8 10H3v5h5v6H3v3H-7v-4h-4v-6h3Z" fill={P.ivory}/><path d="M-10 21h3v3H5v-3h3v4H3v2H-9v-3h-1Z" fill={P.creamShade}/><path d="M-6 17h2v6h-2Zm6 0h2v6H0Zm6 1h2v4H6Z" fill={P.whisker}/><path d="M5-1h2v8H5Z" fill={P.shadow}/>
  </g></g>;
}
function DogTorso({ back = false }: { back?: boolean }) {
  return <g><path d="M-17-77H13v5h12v13h5v26h-5v13h-9v6H-13v-6h-10v-12h-6v-24h5v-15h7Z" fill={P.edge}/><path d="M-15-74H11v6h11v11h5v23h-5v12h-8v5H-11v-5h-9v-12h-6v-20h5v-15h6Z" fill={P.fur}/><path d="M-11-70H9v7h9v14h5v13h-6v11H-7v-9h-9v-22h5Z" fill={P.warm}/><path d="M-22-51h4v14h5v12h-5v-7h-4ZM18-56h4v21h-4Z" fill={P.shadow}/>
    {back ? <g><path d="M-11-66H4v6h11v7H4v7H-8v-7h-7v-7h4Z" fill={P.light}/><path d="M-15-40h5v12H8v-5h10v10H8v5H-9v-5h-6Z" fill={P.creamMid}/><path d="M-5-60h6v2h-6Zm-4 9h3v7h-3Zm19 2h2v8h-2Z" fill={P.crown}/></g> : <g><path d="M-3-67H9v6h10v18h-5v13H7v9H-7v-10h-5v-17h5v-12h4Z" fill={P.cream}/><path d="M1-62H8v6h8v12h-5v14H5v6H-4v-8h-5v-13h5v-12h5Z" fill={P.ivory}/><path d="M-9-41h4v12h5v7h7v-2h4v5H-5v-8h-4Z" fill={P.creamShade}/><path d="M2-52h3v6H2Zm-6 16h3v5h-3Zm11 8h4v2H7Z" fill={P.creamMid}/></g>}
    <path d="M-9-74H9v4h11v4H8v-2H-9v2h-11v-4h11Z" fill={P.shadow}/><path d="M-7-72H8v2H-7Z" fill={P.light}/>
  </g>;
}
function FrontDiagonalHead() {
  return <g>
    <path d="M-41-108v-37h4v-7h5v4h7v6h7v9h28v-15h4v-7h5v4h6v8h6v10h4v12h8v11h4v23h-4v13h-7v10H23v6H-13v-5h-16v-9h-9v-12h-6v-23h3Z" fill={P.edge}/>
    <path d="M-38-108v-34h3v-5h3v5h7v6h6v10h30v-16h4v-6h2v5h6v8h5v10h4v12h8v11h4v20h-4v13h-7v9H22v5H-12v-5h-15v-8h-9v-12h-5v-20h3Z" fill={P.fur}/>
    <path d="M-31-143h3v7h6v9h7v14h-18v-12h-4v-11h6Z" fill={P.earLight}/><path d="M-30-137h3v9h6v10h-10v-7h-3v-7h4Z" fill={P.ear}/><path d="M-29-129h3v5h4v6h-8v-6h1Z" fill={P.shadow}/>
    <path d="M17-147h3v7h6v9h5v11h4v9H16v-14h-4v-11h5Z" fill={P.earLight}/><path d="M18-140h3v9h5v11h4v7H18v-9h-3v-10h3Z" fill={P.ear}/><path d="M20-133h2v7h4v7h-6v-7h-3v-4h3Z" fill={P.shadow}/><path d="M17-144h2v6h-2Z" fill={P.light}/>
    <path d="M-18-131H9v4h15v6h10v9h5v12H25v6H1v-5h-23v-7h-10v-13h6v-6h8Z" fill={P.warm}/><path d="M-13-127H9v3h13v5h9v6H18v-4H-2v-3h-18v-4h7Z" fill={P.light}/>
    <path d="M-9-119H7v4h10v8H8v7H-5v-6h-13v-6h9Z" fill={P.crown}/><path d="M-1-116H8v7H4v8h-8v-8h3Z" fill={P.crease}/><path d="M-7-124H3v2H-7Zm17 3h5v2h-5Z" fill="#e7af70"/>
    <path d="M-36-104h9v-5h6v7h5v12h-7v7h-10v-5h-6v-12h3Z" fill="#dfa268"/><path d="M10-111h9v-5h9v6h6v11h-7v9H16v-6h-6Z" fill="#dfa268"/>
    <path d="M-24-109h8v4h5v8h-4v5h-6v-8h-9v-4h6Z" fill="#f4d1a0"/><path d="M-22-109h5v4h5v4h-7v-3h-3Z" fill="#fff0d2"/>
    <path d="M13-112h11v4h7v9h-7v7h-6v-6h-9v-8h4Z" fill="#f4d1a0"/><path d="M16-112h8v4h4v4h-8v-3h-4Z" fill="#fff0d2"/>
    <path d="M-27-103h5v-3h8v3h4v5h-2v6h-4v3h-9v-3h-4v-8h2Z" fill={P.eyeEdge}/><path d="M-23-103h8v3h3v6h-4v3h-6v-3h-4v-6h3Z" fill={P.iris}/><path d="M-20-102h5v3h2v4h-4v2h-4v-4h-2v-3h3Z" fill={P.irisLight}/><path d="M-20-103h4v9h-4Z" fill={P.pupil}/><path d="M-23-104h4v4h-4Zm-1 4h2v2h-2Z" fill="#e9f1e8"/><path d="M-13-95h2v2h-2Z" fill="#b38a5b"/>
    <path d="M13-103h5v-3h13v3h5v6h2v8h-4v4H17v-3h-5v-6h-2v-6h3Z" fill={P.eyeEdge}/><path d="M17-103h12v3h5v10h-5v3H18v-4h-4v-9h3Z" fill={P.iris}/><path d="M21-102h8v3h4v7h-5v3h-8v-4h-3v-6h4Z" fill={P.irisLight}/><path d="M21-104h7v14h-7Z" fill={P.pupil}/><path d="M17-105h7v5h-7Zm-2 4h3v3h-3Z" fill="#e9f1e8"/><path d="M31-92h3v3h-3Z" fill="#b38a5b"/>
    <path d="M-36-84h8v-7h10v-4h7v8h6v9h7v16H-7v9h-11v-5h-13v-7h-7v-11h-3v-7h5Z" fill={P.cream}/><path d="M-31-82h6v-7h9v-3h3v8h6v8h6v12h-9v8h-8v-5h-12v-7h-5v-10h-2v-4h3Z" fill={P.ivory}/><path d="M-39-77h4v9h6v6h12v5h10v3h-12v-4h-14v-8h-6Z" fill={P.creamShade}/>
    <path d="M12-89h8v-4h8v7h8v9h10v15H32v9H8v-4H0v-18h6v-7h6Z" fill={P.cream}/><path d="M17-86h6v-3h3v7h8v8h9v10H30v8H10v-4H3v-12h6v-9h8Z" fill={P.ivory}/><path d="M2-67h4v7h6v6h19v-3h8v4h-7v4H10v-5H2Z" fill={P.creamMid}/>
    <path d="M23-83h15v3h9v5h5v12h-7v5H21v-5h-7v-12h4v-5h5Z" fill={P.cream}/><path d="M27-80h13v3h7v7H23v-5h4Z" fill={P.noseLight}/><path d="M24-79h18v3h7v9h-6v4H27v-3h-7v-9h4Z" fill={P.nose}/><path d="M28-79h12v3h5v3H25v-3h3Z" fill={P.noseLight}/><path d="M30-79h7v2h-7Zm-4 3h4v2h-4Zm16 1h3v2h-3Z" fill={P.shine}/><path d="M24-67h6v3h-6Zm13 1h7v3h-7Z" fill="#1e1d1e"/>
    <path d="M32-62h3v7h-7v3H13v-3H8v-3h3v3h14v-3h7Z" fill="#514238"/><path d="M14-50h16v3H14Z" fill="#f8ecd4"/>
    <path d="M-23-88h4v2h-4Zm-8 11h3v4h-3Zm8 15h5v2h-5Zm7 3h3v2h-3Zm24-21h3v2H8Z" fill={P.creamMid}/><path d="M-27-72h14v1h-14Zm-2 7h15v1h-15Zm35 1h9v1H6Z" fill={P.whisker}/>
    <path d="M-7-55H6v3h17v-3h9v5H19v4H1v-3H-7Z" fill={P.creamShade}/><path d="M-5-53H7v2h15v-2h7v3H19v2H1v-2h-6Z" fill={P.cream}/>
  </g>;
}
function BackDiagonalHead() {
  return <g>
    <path d="M-41-110v-33h4v-6h5v4h7v7h6v10H8v-18h4v-7h5v4h6v9h6v11h4v12h8v10h4v26h-5v13h-9v8H18v5H-15v-5h-14v-9h-9v-12h-6v-22h3Z" fill={P.edge}/>
    <path d="M-38-109v-31h3v-5h2v5h7v7h5v10H10v-20h4v-6h2v5h6v8h5v11h4v12h8v10h4v23h-5v12h-9v8H17v4H-14v-5h-13v-8h-9v-11h-5v-20h3Z" fill={P.fur}/>
    <path d="M-32-140h3v7h6v10h6v10h-15v-10h-4v-10h4Z" fill={P.warm}/><path d="M-31-132h3v7h5v8h-9v-7h-2v-5h3Z" fill={P.shadow}/><path d="M16-145h3v8h6v12h4v12H15v-10h-3v-11h4Z" fill={P.warm}/><path d="M18-137h3v10h4v11h-7v-9h-3v-7h3Z" fill={P.shadow}/>
    <path d="M-20-125H8v4h14v6h10v14h7v14H24v7H0v-4h-21v-8h-12v-17h6v-10h7Z" fill={P.warm}/><path d="M-14-121H9v3h12v6h7v5H14v-4H-4v-3h-17v-4h7Z" fill={P.light}/>
    <path d="M-13-108H9v5h11v7H9v7H-6v-6h-16v-8h9Z" fill={P.crown}/><path d="M-4-106H7v7H2v8h-7v-8h1Z" fill={P.crease}/><path d="M-8-117H4v2H-8Zm21 5h5v2h-5Z" fill="#e7af70"/>
    <path d="M-35-100h5v10h8v8h10v6h-9v-4h-13v-8h-4v-11h3Z" fill={P.shadow}/><path d="M28-102h7v17h5v13H29v-8h-6v-11h5Z" fill={P.shadow}/>
    <path d="M-39-79h7v9h10v8h17v-3h16v-5h13v-10h12v10h-8v10H14v7H-7v-4h-14v-7h-10v-8h-8Z" fill={P.cream}/><path d="M-35-76h5v8h9v7h16v-3h15v-5h12v-8h9v5h-8v10H13v6H-7v-3h-13v-7h-10v-7h-5Z" fill={P.ivory}/><path d="M-31-66h3v6h8v6h13v4h21v-4h7v3h-6v4H-9v-4h-13v-6h-9Z" fill={P.creamShade}/>
    <path d="M35-99h8v8h5v12h5v10h-10v-5h-8v-10h-4v-9h4Z" fill={P.fur}/><path d="M42-83h8v7h3v6h-11v-7h-4v-5h4Z" fill={P.cream}/><path d="M46-80h4v5h-4Z" fill={P.nose}/><path d="M39-93h4v5h-4Z" fill={P.ear}/><path d="M40-92h1v2h-1Z" fill={P.cream}/>
    <path d="M-26-112h6v2h-6Zm14-6h5v2h-5Zm7 28h2v6h-2Zm23-9h3v7h-3Zm-42 14h4v2h-4Zm15 10h7v2h-7Z" fill="#cf8d4d"/>
    <path d="M-22-66h5v2h-5Zm25 6h7v2H3Zm20-11h4v2h-4Z" fill={P.creamMid}/>
  </g>;
}
export function DogFrontDiagonal() {
  return <g transform="scale(.5)"><CurledTail/><DogLegs/><FarDogArm/><DogTorso/><FrontDiagonalHead/><NearDogArm/></g>;
}
export function DogBackDiagonal() {
  return <g transform="scale(.5)"><DogLegs/><FarDogArm back/><DogTorso back/><CurledTail back/><BackDiagonalHead/><NearDogArm back/></g>;
}

const W = { edge: "#51372b", dark: "#72442e", shade: "#805038", grain: "#8c5d3c", wood: "#a56d43", warm: "#bb8954", light: "#c7975e", cut: "#d0a46c", cutLight: "#e3b37b", eye: "#2d2630", white: "#f5e3c2" };
function SahurLegs() {
  return <g data-feet=""><g data-step-leg="-1"><path d="M-23-43h13v26h-7v8h-19v-8h11v-12h2Z" fill={W.edge}/><path d="M-21-40h8v22h-7v6h-13v-3h10v-16h2Z" fill={W.wood}/><path d="M-19-38h3v18h-3Zm-9 23h8v2h-8Z" fill={W.light}/><path d="M-31-11h15v2h-15Z" fill={W.dark}/></g><g data-step-leg="1"><path d="M11-45h14v32h5v6h13V0H10v-7h1Z" fill={W.edge}/><path d="M14-42h8v31h5v7h13v2H13v-5h1Z" fill={W.wood}/><path d="M17-39h3v24h-3Zm7 35h12v2H24Z" fill={W.light}/><path d="M14-2h26v2H14Z" fill={W.dark}/></g></g>;
}
function SahurWood({ back }: { back: boolean }) {
  return <g>
    <path d="M-24-140H18v5h15v85h-8v11H-11v-5h-19v-10h-7v-75h7v-6h6Z" fill={W.edge}/><path d="M-22-137H17v5h13v81h-8v9H-10v-5h-17v-9h-7v-70h7v-6h5Z" fill={W.wood}/>
    <path d="M-32-124h12v63h-12Zm15-10h8v83h-8Z" fill={W.shade}/><path d="M-6-134H5v84H-6Zm24 3h9v72h-9Z" fill={W.light}/><path d="M-4-131H0v16h-4Zm24 3h3v25h-3Z" fill={W.cut}/>
    <path d="M-28-121h3v20h-3v29h3v9h-3Zm12-8h3v17h4v14h-3v32h-3v-34h4v-10h-5Zm16 20h3v15H0v27h-3v-27h3Zm15-15h3v19h-3v19h3v21h-3Zm5 50h3v18h-3Z" fill={W.grain}/>
    <path d="M-24-81h5v4h4v8h-4v5h-5v-5h-3v-8h3Z" fill={W.dark}/><path d="M-23-78h3v4h3v4h-3v3h-3v-4h-2v-3h2Z" fill={W.warm}/><path d="M-22-74h2v4h-2Z" fill={W.shade}/>
    <path d="M7-62h8v3h5v9h-5v4H7v-4H3v-8h4Z" fill={W.shade}/><path d="M8-59h6v3h3v5h-4v2H8v-3H5v-4h3Z" fill={W.light}/><path d="M9-55h4v3H9Z" fill={W.grain}/>
    {back && <g><path d="M7-125h8v4h5v10h-5v5H7v-5H3v-10h4Z" fill={W.grain}/><path d="M8-122h5v3h4v7h-4v3H8v-4H6v-5h2Z" fill={W.light}/><path d="M9-118h3v5H9Z" fill={W.shade}/><path d="M-8-91h6v3h3v8h-3v3h-6v-3h-3v-8h3Z" fill={W.shade}/><path d="M-7-88h4v3h2v3h-3v2h-3v-3h-1v-2h1Z" fill={W.warm}/></g>}
    <path d="M-22-146H13v4h14v6h9v9h-9v5H10v4H-18v-5h-13v-7h-8v-8h10v-5h7Z" fill={W.edge}/><path d="M-21-144H12v4h14v6h7v6h-8v4H9v3H-17v-5h-12v-6h-7v-5h9v-5h6Z" fill={W.cut}/><path d="M-17-141H9v4h14v5h7v3H17v4H-14v-4h-13v-6h10Z" fill={W.grain}/><path d="M-14-139H8v3h12v5H7v4H-12v-4h-12v-3h10Z" fill={W.light}/><path d="M-9-136H6v3h10v2H3v2H-9v-2h-10v-2h10Z" fill={W.grain}/><path d="M-7-134H3v2h-10Z" fill={W.cutLight}/>
    <path d="M-23-140h7v2h-7Zm39 3h6v2h-6Zm-43 7h5v2h-5Zm31 7h5v2H4Z" fill={W.cutLight}/>
  </g>;
}
function SahurFace({ back }: { back: boolean }) {
  if (back) return <g><path d="M27-111h8v10h5v14h-9v-9h-4Z" fill={W.light}/><path d="M32-105h6v10h-6Z" fill={W.edge}/><path d="M34-103h2v5h-2Z" fill={W.white}/><path d="M35-96h6v13h-6Z" fill={W.cut}/><path d="M37-94h3v8h-3Z" fill={W.cutLight}/></g>;
  return <g>
    <path d="M-15-119h8v-3H4v4h5v4H-8v-2h-7Zm27 0h10v-4h11v4h5v5H19v-2h-7Z" fill={W.edge}/><path d="M-12-119H1v2h-13Zm28-1h15v2H16Z" fill={W.shade}/>
    <path d="M-13-111h5v-4H3v4h5v16H3v4H-8v-3h-5Z" fill={W.edge}/><path d="M-10-109h4v-3H1v3h4v12H1v3H-6v-3h-4Z" fill={W.white}/><path d="M-7-108h5v12h-5Z" fill={W.eye}/><path d="M-7-109h2v4h-2Z" fill="#fff1d1"/><path d="M-8-95h8v2h-8Z" fill="#d8c3a1"/>
    <path d="M14-112h5v-4h15v4h5v19h-5v4H19v-3h-5Z" fill={W.edge}/><path d="M17-109h4v-4h11v4h4v14h-4v3H22v-4h-5Z" fill={W.white}/><path d="M24-110h8v16h-8Z" fill={W.eye}/><path d="M24-111h3v5h-3Zm7 13h2v3h-2Z" fill="#fff1d1"/><path d="M20-94h3v2h-3Zm11 0h3v2h-3Z" fill="#d8c3a1"/>
    <path d="M25-99h10v5h7v19h-7v5H24v-5h-6v-15h7Z" fill={W.shade}/><path d="M27-97h6v6h7v14h-8v4h-5v-4h-6v-10h6Z" fill={W.cut}/><path d="M29-96h3v6h6v8h-4v-6h-5Z" fill={W.cutLight}/><path d="M25-77h10v3H25Z" fill={W.grain}/>
    <path d="M-2-72H24v4h9v14H9v-3H-1v-5h-6v-11h5Z" fill={W.edge}/><path d="M1-70h21v4h8v6H10v-3H1Z" fill={W.white}/><path d="M7-70h2v7H7Zm8 0h2v7h-2Zm8 4h2v6h-2Z" fill={W.grain}/><path d="M5-59h20v3H5Z" fill={W.dark}/><path d="M3-55h17v2H3Z" fill={W.warm}/>
    <path d="M-11-90h4v2h-4Zm0 6h4v2h-4Zm28 7h3v3h-3Zm15 14h3v3h-3Z" fill={W.light}/>
  </g>;
}
function SahurArms() {
  return <g><path d="M-34-107h-11v36h7v14h14v-9h-7v-15h-5v-20h2Z" fill={W.edge}/><path d="M-39-104h-4v30h7v13h9v-3h-7v-17h-5Z" fill={W.wood}/><path d="M-41-99h3v17h-3Zm8 29h3v7h-3Z" fill={W.light}/><path d="M-37-61h12v4h-12Z" fill={W.dark}/><path d="M33-101h11v28h11v19H31v-9h8v-6h-6Z" fill={W.edge}/><path d="M36-98h5v28h11v13H34v-3h8v-12h-6Z" fill={W.warm}/><path d="M36-92h3v16h-3Zm9 26h4v6h-4Z" fill={W.light}/><path d="M40-57h12v3H40Z" fill={W.dark}/></g>;
}
function Club() {
  return <g><path d="M44-68h10v-10h7v-15h8v-16h6v-8h12v-10h6v-31h-7v-7H63v8h-8v29h6v12h-6v17h-6v16h-5Z" fill={W.edge}/><path d="M47-71h5v-10h7v-15h7v-17h7v-8h12v-9h5v-26h-7v-6H65v7h-7v25h6v13h-6v17h-6v16h-5Z" fill={W.wood}/><path d="M66-157h15v5h6v18h-6v9H70v-6h-8v-19h4Z" fill={W.light}/><path d="M68-157h10v4h7v10h-4v-7h-6v-4h-7Z" fill={W.cut}/><path d="M61-147h4v16h-4Zm22 5h3v9h-3Z" fill={W.shade}/><path d="M66-126h13v4H66Z" fill={W.warm}/><path d="M49-80h5v4h-5Zm6-13h5v4h-5Zm6-14h5v4h-5Z" fill={W.dark}/><path d="M49-78h4v1h-4Zm7-13h3v1h-3Z" fill={W.cut}/></g>;
}
function Gun({ back }: { back: boolean }) {
  return <g transform={`rotate(${back ? -35 : 35} 52 -74)`}>
    <path d="M40-91h7v-3h50v3h8v23H73v4h-9v17H48v-20h-8Z" fill="#20232e"/>
    <path d="M44-88h58v13H70v5H59v20h-8v-20h-7Z" fill="#536775"/>
    <path d="M45-88h53v5H45Z" fill="#a4b7b3"/><path d="M48-87h44v2H48Z" fill="#c7d6ce"/>
    <path d="M45-81h54v6H69v4H45Z" fill="#69838b"/><path d="M64-74h24v3H64Z" fill="#263d45"/>
    <path d="M51-67h10v17H51Z" fill="#775442"/><path d="M52-64h7v2h-7Zm0 6h7v2h-7Z" fill="#ae8060"/>
    <path d="M63-69h12v13H63v-3h9v-7h-9Z" fill="#20232e"/><path d="M66-70h3v7h-3Z" fill="#a4b7b3"/>
    <path d="M99-86h5v13h-5Z" fill="#263d45"/><path d="M101-83h3v8h-3Z" fill="#161d2b"/>
    <path d="M47-92h5v3h-5Zm45-2h5v3h-5Z" fill="#20232e"/>
    <path d="M49-88h2v5h-2Zm5 0h2v5h-2Zm5 0h2v5h-2Z" fill="#536775"/>
  </g>;
}
function DiagonalWeapon({ gun, back }: { gun: boolean; back: boolean }) {
  return <g data-weapon="" data-grip-x="52" data-grip-y="-74">{gun ? <Gun back={back}/> : <Club/>}<path d="M44-76h13v10H44Z" fill={W.warm}/><path d="M45-74h10v3H45Z" fill={W.light}/><path d="M47-69h2v3h-2Zm5 0h2v3h-2Z" fill={W.shade}/></g>;
}
export function SahurDiagonal({ gun = false, back = false }: { gun?: boolean; back?: boolean }) {
  return <g transform="scale(.5)"><SahurLegs/><SahurWood back={back}/><SahurFace back={back}/><SahurArms/><DiagonalWeapon gun={gun} back={back}/></g>;
}
