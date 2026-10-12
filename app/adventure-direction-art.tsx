import { PixelDog } from "./pixel-artwork";
import { DogFrontDiagonal, DogBackDiagonal, SahurDiagonal } from "./adventure-diagonal-art";
const INK = "#343041";
function DogFeet() {
  return <g data-feet=""><path d="M-13-14h9V0h-14v-6h5Zm17 0h9v8h5v6H4Z" fill="#a86739"/><path d="M-15-6h11v5h-11Zm19 0h11v5H4Z" fill="#fff1d4"/><path d="M-12-2h2v2h-2Zm20 0h2v2H8Z" fill="#dcc9a7"/></g>;
}
function DogBody({ back = false }: { back?: boolean }) {
  return <g><DogFeet/><path d="M-10-36h20v4h6v16h-4v7h-24v-7h-4v-16h6Z" fill={INK}/><path d="M-8-34H8v5h6v12h-5v6H-9v-6h-5v-12h6Z" fill="#d69a5b"/><path d="M-6-32H6v5h4v12h-20v-12h4Z" fill={back ? "#e5ac6d" : "#f3e2c0"}/><path d="M-17-31h-5v17h7v-6h-3v-7h3Z" fill="#b97a43"/><path d="M-22-15h7v6h-7Z" fill="#fff1d4"/><g data-fist="" transform="translate(17 -25)"><path d="M-3-5h7v15h-7Z" fill="#a86739"/><path d="M-3 4h7v7h-7Z" fill="#fff1d4"/></g></g>;
}
function CurledTail({ x = 8, y = -24 }: { x?: number; y?: number }) {
  return <g transform={`translate(${x} ${y})`}><path d="M-6-8H7v3h5v14H7v4H-7V9h-5V-3h6Z" fill="#a86739"/><path d="M-5-6H5v3h5v10H5v4H-5V7h-5V-1h5v-2h8v3H0v5h4V2h3v-3H3v-2h-8Z" fill="#f3e2c0"/><path d="M-4-5H4v2H-4ZM7 0h2v5H7Z" fill="#fff1d4"/></g>;
}
export function DirectionalKnopik() {
  return <g>
    <path d="M-20-5h40v3h6v6h-6v3h-40V4h-6V-2h6Z" fill="#20232e55"/>
    <g data-direction="front"><CurledTail x={12} y={-23}/><DogBody/><svg x="-25" y="-76" width="50" height="50" viewBox="0 0 128 128"><PixelDog ears/></svg></g>
    <g data-direction="back" display="none"><DogBody back/><CurledTail x={1} y={-20}/>
      <path d="M-23-54v-20h4v4h5v8h6v8Zm46 0v-20h-4v4h-5v8H8v8Z" fill="#a86739"/><path d="M-20-55v-14h3v7h5v7Zm40 0v-14h-3v7h-5v7Z" fill="#e5ac6d"/>
      <path d="M-15-66h30v4h7v7h3v18h-5v6h-8v4h-24v-4h-8v-6h-5v-18h3v-7h7Z" fill="#a86739"/><path d="M-13-63h26v4h7v8h3v12h-5v5h-36v-5h-5v-12h3v-8h7Z" fill="#d69a5b"/>
      <path d="M-10-62h20v3h8v4H8v-2H-8v2h-10v-4h8Z" fill="#efbd80"/><path d="M-23-42h7v6h32v-6h7v7h-7v6h-32v-6h-7Z" fill="#f3e2c0"/><path d="M-8-59H8v2H-8Zm-9 7h5v2h-5Zm29 0h5v2h-5Z" fill="#bf7b3e"/>
    </g>
    <g data-direction="side" display="none"><CurledTail x={-13} y={-25}/><g data-feet=""><path d="M-9-17h8v13h5v4h-17v-6h4Zm12-1h8v12h8v6H2Z" fill="#b97a43"/><path d="M-12-5H2v4h-14Zm15 0h14v4H3Z" fill="#f3e2c0"/></g><path d="M-8-39H8v7h5v19H8v5H-8v-5h-5v-19h5Z" fill={INK}/><path d="M-6-37H6v7h5v15H5v5H-6v-5h-5v-15h5Z" fill="#d69a5b"/><path d="M6-29h5v14H6Z" fill="#f3e2c0"/>
      <path d="M-12-55v-19h4v5h6v7H9v-9h4v5h4v10h6v7h6v10h-7v7H4v5h-18v-5h-6v-22h3v-8h5Z" fill="#a86739"/><path d="M-10-56v-13h3v8H5v-6h5v4h5v8h6v8h6v6h-9v8H3v4h-14v-5h-6v-18h3v-5h4Z" fill="#d69a5b"/>
      <path d="M-8-65h2v8h-6v-3h4Z" fill="#775442"/><path d="M-10-55H8v4h7v9H2v4h-12Z" fill="#efbd80"/><path d="M-2-39h9v-4h10v-1h8v5h-8v6H3v4H-7v-7h5Z" fill="#fff1d4"/>
      <path d="M10-53h5v6h-5Z" fill="#312b27"/><path d="M10-53h2v2h-2Z" fill="#fff1d1"/><path d="M23-47h6v6h-6Z" fill="#312b27"/><path d="M18-37h5v2h-5Z" fill="#775442"/><g data-fist="" transform="translate(14 -23)"><path d="M-3-5h7v13h-7Z" fill="#d69a5b"/><path d="M-3 3h7v6h-7Z" fill="#f3e2c0"/></g>
    </g>
    <g data-direction="front-diagonal" display="none"><DogFrontDiagonal/></g>
    <g data-direction="back-diagonal" display="none"><DogBackDiagonal/></g>
  </g>;
}
function SahurFeet() { return <g data-feet=""><path d="M-10-18h6V0h-14v-4h8Zm14 0h6v14h8v4H4Z" fill="#72442e"/><path d="M-9-16h3v13h-7v2h-3v-4h7Zm15 0h3v13h7v2H6Z" fill="#bb8954"/></g>; }
function SahurLog({ back = false }: { back?: boolean }) {
  return <g><SahurFeet/><path d="M-13-71h26v3h5v43h-5v7h-26v-7h-5v-43h5Z" fill="#51372b"/><path d="M-11-69h22v4h5v39h-5v5h-22v-5h-5v-39h5Z" fill="#a56d43"/><path d="M-12-65h5v37h-5Zm12-1h5v39H0Zm11 3h3v35h-3Z" fill="#c7975e"/><path d="M-11-60h2v9h-2v16h-2Zm8 25h2v9h-2Zm11-25h2v21H8Z" fill="#805038"/>
    <path d="M-11-74h22v3h6v6h-6v3h-22v-3h-6v-6h6Z" fill="#d0a46c"/><path d="M-8-72H8v2h5v3H8v2H-8v-2h-5v-3h5Z" fill="#8c5d3c"/><path d="M-6-70H6v3H-6Z" fill="#c7975e"/>
    {!back && <g><path d="M-14-59h10v3h-10Zm18 0h10v3H4Z" fill="#51372b"/><path d="M-14-54h11v12h-11Zm17 0h11v12H3Z" fill="#51372b"/><path d="M-12-52h7v8h-7Zm17 0h7v8H5Z" fill="#fff1d1"/><path d="M-9-51h3v6h-3Zm15 0h3v6H6Z" fill="#312b27"/><path d="M-3-52h6v5h3v9H-6v-9h3Z" fill="#805038"/><path d="M-1-50h3v4h2v5H-1Z" fill="#d0a46c"/><path d="M-10-35h20v3h3v6h-26v-6h3Z" fill="#51372b"/><path d="M-8-33H8v3H-8Z" fill="#f3e2c0"/><path d="M-5-33v3m5-3v3m5-3v3" stroke="#805038"/></g>}
    <path d="M-19-53h-6v20h5v10h8v-5h-4v-9h-4v-13h1Zm38 0h6v16h5v11H18v-6h5v-4h-4Z" fill="#51372b"/><path d="M-23-51h4v15h4v10h-4v-8h-4Zm44 0h2v16h5v5h-6v-4h1Z" fill="#bb8954"/>
  </g>;
}
function SahurWeapon({ gun = false, side = false }: { gun?: boolean; side?: boolean }) {
  return <g data-weapon="" transform={side ? "translate(2 -4)" : undefined}>{gun ? <><path d="M20-42h9v8h15v8H30v7h-6v-8h-4Z" fill="#20232e"/><path d="M22-40h5v8h15v4H28v7h-3v-10h-3Z" fill="#69838b"/><path d="M28-32h11v3H28Z" fill="#a4b7b3"/><path d="M40-33h4v6h-4Z" fill="#161d2b"/></> : <><path d="M22-35h7v-17h4v-7h3v-20h-3v-5H20v5h-3v20h3v7h2Z" fill="#51372b"/><path d="M24-37h3v-17h4v-7h3v-16h-3v-5h-9v5h-3v16h3v7h2Z" fill="#a56d43"/><path d="M24-79h5v3h3v14h-3v4h-5Z" fill="#d0a46c"/><path d="M24-40h3v-4h-3Zm0-7h3v-4h-3Z" fill="#775442"/><path d="M21-76h2v13h-2Zm9 1h2v11h-2Z" fill="#805038"/></>}</g>;
}
export function DirectionalSahur({ gun = false }: { gun?: boolean }) {
  return <g><path d="M-17-4h34v3h5v5h-5v3h-34V4h-5v-5h5Z" fill="#20232e55"/>
    <g data-direction="front"><SahurLog/><SahurWeapon gun={gun}/></g>
    <g data-direction="back" display="none"><SahurLog back/><SahurWeapon gun={gun}/></g>
    <g data-direction="side" display="none"><SahurFeet/><path d="M-8-72H8v4h6v46H8v5H-8v-5h-6v-46h6Z" fill="#51372b"/><path d="M-6-70H6v4h6v42H6v4H-6v-4h-6v-42h6Z" fill="#a56d43"/><path d="M-9-65h5v39h-5Zm11-2h5v43H2Z" fill="#c7975e"/><path d="M-6-74H6v2h7v6H6v2H-6v-2h-7v-6h7Z" fill="#d0a46c"/><path d="M-4-72H4v2h6v2H4v2H-4v-2h-6v-2h6Z" fill="#805038"/>
      <path d="M5-58h9v3H5Zm1 5h10v12H6Z" fill="#51372b"/><path d="M8-51h6v8H8Z" fill="#fff1d1"/><path d="M11-50h3v6h-3Z" fill="#312b27"/><path d="M14-47h6v9h-6Z" fill="#d0a46c"/><path d="M7-33h10v7H7Z" fill="#51372b"/><path d="M8-32h8v2H8Z" fill="#f3e2c0"/><path d="M2-49h5v16h10v7H3v-6H2Z" fill="#bb8954"/><SahurWeapon gun={gun} side/>
    </g>
    <g data-direction="front-diagonal" display="none"><SahurDiagonal gun={gun}/></g>
    <g data-direction="back-diagonal" display="none"><SahurDiagonal gun={gun} back/></g>
  </g>;
}
