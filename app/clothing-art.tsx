import {HunterClothingArt,isHunterClothing} from "./hunter-clothing";
export type ClothingKind="sky-boots"|"hat"|"mohawk"|"bandana"|"charm"|"goggles"|"cape"|"ranger-hood"|"hunter-armor"|"raven-mask"|"hunter-cloak";
const E="#343041";
/** Original stepped silhouettes with woven seams, metal rims and pixel highlights. */
export function ClothingGlyph({kind}:{kind:ClothingKind}){
 if(kind==="sky-boots")return <g transform="translate(64 64) scale(2.5)"><BootsArt/></g>;
 if(isHunterClothing(kind))return <g transform="translate(64 102) scale(1.1)"><HunterClothingArt kind={kind}/></g>;
 return <g>{kind==="hat"?<>
  <path d="M12 50V20h12V12h16V8h48v4h16v8h12v30h8v14H4V50Z" fill={E}/><path d="M16 48V24h12v-8h72v8h12v24Z" fill="#3d6852"/><path d="M20 28h88v20H20Z" fill="#56875d"/><path d="M28 18h72v6H28Zm-8 10h8v15h-8Z" fill="#91b17a"/><path d="M8 53h112v7H8Z" fill="#d4b070"/><path d="M20 45h88v5H20Z" fill="#a57c52"/><path d="M48 28h32v16H48Z" fill="#775442"/><path d="M52 30h24v11H52Z" fill="#e4cc9b"/><path d="M56 33h5v5h-5Zm10 0h6v5h-6Z" fill="#537d75"/><path d="M33 29h4v5h-4Zm56 0h4v5h-4ZM13 54h45v2H13Z" fill="#fff1d1"/>
 </>:kind==="mohawk"?<>
  <path d="M4 56V43h8V30h8V18h8v16h8V9h8v19h8V3h8v22h8V6h8v26h8V13h8v26h8V26h8v30h8v12H4Z" fill={E}/><path d="M10 55V46h8V34h8V26h2v17h12V17h2v22h14V11h2v27h14V14h2v29h14V21h2v29h14V34h2v28H10Z" fill="#cc624f"/><path d="M27 37h6v25h-6Zm16-12h6v37h-6Zm16-8h6v45h-6Zm18 7h6v38h-6Zm16 11h5v27h-5Z" fill="#ed9674"/><path d="M45 28h3v20h-3Zm16-6h3v22h-3Zm17 6h3v21h-3Z" fill="#ffe4b0"/><path d="M10 62h102v3H10Z" fill="#a14e44"/>
 </>:kind==="bandana"?<>
  <path d="M4 8h28v8h64V8h28v32h-12v8H94v8H80v20H68v12H48V70H36V56H22v-8H10V36H4Z" fill={E}/><path d="M10 15h17v7h74v-7h17v21h-11v7H90v8H77v20h-8v11H54V66H41V52H25v-9H16V31h-6Z" fill="#496c86"/><path d="M17 24h90v8H17Z" fill="#88b6b0"/><path d="M24 38h78v5H84v8H72v22h-8V56H51V46H24Z" fill="#699caa"/><path d="M40 35h8v8h-8Zm18 12h8v8h-8Zm12 14h6v7h-6Z" fill="#f4d889"/><path d="M107 32h11v14h-11Zm0 12h10v22h-10v-8h-7V46h7Z" fill="#775442"/>
 </>:kind==="charm"?<>
  <path d="M4 8h20v8h18v8h44v-8h18V8h20v28h-16v10H88v8H40v-8H20V36H4Z" fill="#71552e"/><path d="M10 14h10v8h20v8h48v-8h20v-8h10v17h-14v9H86v8H42v-8H24v-9H10Z" fill="#dbad4d"/><path d="M10 14h10v8h20v8h48v-8h20v-8h10v6h-10v9H88v7H40v-7H20v-9H10Z" fill="#ffe39a"/><path d="M46 27h36v31H46Z" fill="#775442"/><path d="M51 30h26v23H51Z" fill="#f4d889"/><path d="M55 35h18v14H55Z" fill="#af7936"/><path d="M61 32h5v20h-5Zm-8-1h19v3H53Z" fill="#fff1d1"/><path d="M27 32h5v4h-5Zm68 0h5v4h-5Z" fill="#fff1d1"/>
 </>:kind==="goggles"?<>
  <path d="M4 26h12V14h38v8h20v-8h38v12h12v26h-12v12H74v-8H54v8H16V52H4Z" fill={E}/><path d="M8 32h12V20h30v8h28v-8h30v12h12v14h-12v12H78v-8H50v8H20V46H8Z" fill="#b98461"/><path d="M25 25h19v25H25Zm59 0h19v25H84Z" fill="#345875"/><path d="M28 27h14v15H28Zm59 0h14v15H87Z" fill="#69c9d4"/><path d="M29 28h5v10h-5Zm59 0h5v10h-5Z" fill="#d5f5e4"/><path d="M56 33h16v9H56Z" fill="#775442"/><path d="M12 35h5v4h-5Zm99 0h5v4h-5Z" fill="#f4d889"/>
 </>:<>
  <path d="M35 4h58v10h10v17h7v45h10v31H8V76h10V31h7V14h10Z" fill={E}/><path d="M40 10h48v10h10v15h6v42h9v24H15V77h9V35h6V20h10Z" fill="#4b5c90"/><path d="M40 22h17v68H33V68H24V35h6V20h10Zm32-4h16v16h8v62H73Z" fill="#6991ad"/><path d="M40 12h46v6H40Z" fill="#b5d9b6"/><path d="M63 33h14L64 55h16L52 85l7-25H46Z" fill="#f4d889"/><path d="M65 36h7L58 56h-6Z" fill="#fff1d1"/><path d="M27 86h7v15h-7Zm66 2h7v13h-7Z" fill="#343f68"/>
 </>}</g>;
}
export function DetailedClothing({kind,className=""}:{kind:ClothingKind;className?:string}){const box=kind==="hat"?"0 0 128 72":kind==="mohawk"?"0 0 128 72":kind==="charm"?"0 0 128 64":kind==="cape"?"0 0 128 108":kind==="goggles"?"0 0 128 76":"0 0 128 92";return <svg className={`pixel-art pixel-clothing ${className}`} viewBox={box} shapeRendering="crispEdges" aria-hidden="true"><ClothingGlyph kind={kind}/></svg>;}

export function BootsArt(){return <g data-sky-boots=""><path d="M-21-16h15v9h4v9h-23V-7h4Zm27 0h15v9h4v9H2V-7h4Z" fill="#243e56"/><path d="M-18-14h10v9h4v4h-19v-4h5Zm26 0h10v9h5v4H4v-4h4Z" fill="#9bcad8"/><path d="M-23-1h19v3h-19Zm27 0h19v3H4Z" fill="#4ca8cf"/><path d="M-17-12h7v2h-7Zm0 4h7v2h-7Zm27-4h7v2h-7Zm0 4h7v2h-7Z" fill="#f0ffff"/></g>;}
