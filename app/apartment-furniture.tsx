import type { ApartmentPalette } from "./apartment-artwork";
const INK = "#343041";
type FurnitureProps = { p: ApartmentPalette };

export function HomeDoor({ p, basement = false }: FurnitureProps & { basement?: boolean }) {
  return <g transform={`translate(${basement ? 335 : 73} 55)`} data-basement-door={basement ? "" : undefined}>
    <path d="M-4-5h81v66h-7V4H3v57h-7Z" fill={INK}/><path d="M0-2h73v62H0Z" fill={p.wood}/>
    <path d="M3 1h67v3H3v51H0V1Z" fill={p.top}/><path d="M8 6h57v47H8Z" fill={p.dark}/>
    <path d="M10 7h51v44H10Z" fill={p.sofa}/><path d="M12 9h47v3H12Zm0 0h3v37h-3Z" fill={p.soft}/>
    <path d="M19 17h34v15H19Zm0 19h34v10H19Z" fill={p.dark}/><path d="M21 19h30v2H21v9h-2V19Zm0 19h30v2H21v5h-2v-7Z" fill={p.top} opacity=".65"/>
    <path d="M6 14h3v6H6Zm0 26h3v6H6Z" fill={p.edge}/><path d="M58 33h5v12h-5Z" fill="#e4cc89"/>
    <path d="M55 36h8v3h-8Z" fill="#fff1d1"/><path d="M59 42h2v2h-2Z" fill={p.wood}/>
    {basement ? <path d="M24 21h17v3H24v3h-5v3h-5v3h30V21Z" fill={p.edge}/> : <g><path d="M32 13h10v6H32Z" fill={p.edge}/><path d="M34 15h6v2h-6Z" fill={p.wood}/></g>}
    {basement && <g data-door-opening="" display="none"><rect x="8" y="6" width="57" height="47" fill="#182c31"/><path d="M15 45h43v6H15Zm5-11h33v5H20Zm5-10h23v5H25Z" fill={p.trim}/><path d="M8 6h8v47H8Z" fill={p.dark}/><path d="M10 8h3v41h-3Z" fill={p.top}/></g>}
    <path d="M-3 57h79v6H-3Z" fill={p.wood}/><path d="M2 57h69v2H2Z" fill={p.top}/><path d="M4 65h65v4H4Z" fill="#20232e33"/>
  </g>;
}

export function ApartmentSofa({ p, bench = false }: FurnitureProps & { bench?: boolean }) {
  return <g data-home-furniture="sofa">
    <path d="M48 398h153v16H48Z" fill="#20232e33"/><path d="M60 399h9v9h-9Zm117 0h9v9h-9Z" fill={INK}/>
    <path d="M51 339h143v59H51Z" fill={p.wood}/><path d="M55 334h135v62H55Z" fill={p.dark}/>
    <path d="M59 337h127v24H59Z" fill={p.sofa}/><path d="M62 338h121v4H62Z" fill={p.soft}/>
    <path d="M61 345h58v12H61Zm62 0h61v12h-61Z" fill={bench ? p.top : p.soft}/>
    <path d="M64 346h52v2H64Zm62 0h55v2h-55Z" fill={p.edge} opacity=".55"/>
    <path d="M62 357h55v3H62Zm63 0h57v3h-57Z" fill={p.dark}/>
    <path d="M60 364h58v24H60Zm63 0h60v24h-60Z" fill={bench ? p.top : p.sofa}/>
    <path d="M62 365h54v3H62Zm63 0h55v3h-55Z" fill={p.soft}/><path d="M62 385h54v3H62Zm63 0h55v3h-55Z" fill={p.dark}/>
    <path d="M49 348h14v51H49Zm133 0h14v51h-14Z" fill={p.wood}/><path d="M51 349h10v9H51Zm133 0h10v9h-10Z" fill={p.soft}/>
    <path d="M51 360h3v34h-3Zm133 0h3v34h-3Z" fill={p.sofa}/><path d="M58 391h131v10H58Z" fill={p.dark}/><path d="M62 392h123v2H62Z" fill={p.sofa}/>
    {bench ? <g><path d="M63 368h52v2H63Zm0 7h52v2H63Zm0 7h52v2H63Zm64-14h53v2h-53Zm0 7h53v2h-53Zm0 7h53v2h-53Z" fill={p.seam}/><path d="M64 352h32v20H64Z" fill="#f3e2c0"/><path d="M67 354h26v2H67Zm0 4h26v2H67Zm0 4h26v2H67Z" fill={p.trim}/></g> : <g>
      <path d="M68 349h29v3h3v19H68Z" fill={p.dark}/><path d="M69 348h27v20H69Z" fill={p.edge}/><path d="M72 350h21v3H72v12h-3v-15Z" fill={p.top}/><path d="M75 355h12v2h-12Zm5-3h2v10h-2Z" fill={p.rug}/><path d="M72 365h22v2H72Z" fill={p.trim}/>
      <path d="M149 350h27v22h-27Z" fill={p.dark}/><path d="M150 348h24v21h-24Z" fill={p.rug}/><path d="M153 350h18v3h-18v12h-3v-15Z" fill={p.edge}/><path d="M160 357h4v4h-4Z" fill={p.top}/>
    </g>}
    <path d="M119 356h25v39h-25Z" fill={p.edge}/><path d="M122 357h3v32h-3Zm8 0h3v32h-3Zm8 0h3v32h-3Z" fill={p.trim}/><path d="M120 370h23v3h-23Zm0 10h23v2h-23Zm2 12h2v6h-2Zm6 0h2v6h-2Zm6 0h2v6h-2Zm6 0h2v6h-2Z" fill={p.top}/>
  </g>;
}

export function ApartmentCoffeeTable({ p }: FurnitureProps) {
  return <g data-home-furniture="coffee-table">
    <path d="M248 398h91v15h-91Z" fill="#20232e33"/><path d="M253 388h7v20h-7Zm69 0h7v20h-7Z" fill={p.wood}/><path d="M255 389h2v15h-2Zm69 0h2v15h-2Z" fill={p.top}/>
    <path d="M246 350h88v45h-88Z" fill={INK}/><path d="M249 352h82v39h-82Z" fill={p.wood}/><path d="M252 354h76v31h-76Z" fill={p.top}/><path d="M254 355h72v2h-72Z" fill={p.edge}/><path d="M253 385h76v6h-76Z" fill={p.seam}/>
    <path d="M256 360h22v1h-22Zm45 20h20v1h-20Zm-43-3h9v1h-9Z" fill={p.seam} opacity=".6"/>
    <path d="M262 373h28v9h-28Z" fill={p.wood}/><path d="M262 371h25v9h-25Z" fill={p.sofa}/><path d="M265 373h20v5h-20Z" fill="#ece3ca"/><path d="M263 379h24v2h-24Z" fill={p.dark}/>
    <path d="M264 361h24v14h-24Z" fill={p.wood}/><path d="M265 360h11v12h-11Zm12 0h10v12h-10Z" fill="#fff1d1"/><path d="M267 363h7v1h-7Zm0 3h7v1h-7Zm0 3h5v1h-5Zm12-6h6v1h-6Zm0 3h6v1h-6Zm0 3h4v1h-4Z" fill="#ad9476"/>
    <path d="M298 377h23v3h-23Z" fill={p.seam}/><path d="M299 363h16v13h-16Z" fill={p.sofa}/><path d="M301 365h11v2h-11v7h-3v-9Z" fill={p.soft}/><path d="M314 366h7v8h-7v-2h4v-4h-4Z" fill={p.wood}/><path d="M301 361h11v4h-11Z" fill="#f3e2c0"/><path d="M303 362h7v2h-7Z" fill="#775442"/>
    <path d="M291 381h16v5h-16Z" fill={INK}/><path d="M293 382h3v2h-3Zm5 0h2v2h-2Zm5 0h2v2h-2Z" fill={p.soft}/>
  </g>;
}

export function ApartmentMiniBar({ p }: FurnitureProps) {
  return <g data-home-furniture="mini-bar">
    <path d="M36 237h104v13H36Z" fill="#20232e33"/><path d="M45 236h8v10h-8Zm73 0h8v10h-8Z" fill={INK}/>
    <path d="M38 143h94v98H38Z" fill={INK}/><path d="M42 147h86v89H42Z" fill={p.wood}/>
    <path d="M46 150h78v42H46Z" fill={p.dark}/><path d="M48 151h74v39H48Z" fill={p.trim}/>
    <path d="M47 150h76v2H47Zm0 22h76v3H47Z" fill={p.edge}/><path d="M47 153h76v3H47Zm0 22h76v3H47Z" fill="#e4cc8922"/>
    <path d="M46 151h2v41h-2Zm76 0h2v41h-2Z" fill={p.top}/>
    {[0,1,2,3,4,5,6].map(i=><g key={i} transform={`translate(${i<3?52+i*25:48+(i-3)*20} ${i<3?154:178})`}>
      <path d="M3 0h6v5h3v13H0V5h3Z" fill={INK}/><path d="M4 1h4v5h2v10H2V6h2Z" fill={["#b76253","#537d75","#69838b","#a9c7b8","#d97b70","#88b6b0","#ae8060"][i]}/><path d="M3 0h6v2H3Z" fill="#e4cc89"/><path d="M2 10h8v5H2Z" fill="#fff1d1"/><path d="M4 11h4v2H4Z" fill={p.wood}/><path d="M2 6h2v4H2Z" fill="#ffffff99"/>
    </g>)}
    <path d="M44 170h82v5H44Z" fill={p.wood}/><path d="M44 170h82v2H44Z" fill={p.top}/>
    <path d="M36 194h100v9H36Z" fill={INK}/><path d="M38 193h96v6H38Z" fill={p.top}/><path d="M40 194h92v2H40Z" fill={p.edge}/><path d="M40 200h92v3H40Z" fill={p.seam}/>
    <path d="M43 204h84v33H43Z" fill={p.wood}/><path d="M48 207h31v26H48Zm36 0h38v26H84Z" fill={INK}/>
    <path d="M50 209h27v22H50Zm36 0h34v22H86Z" fill={p.dark}/><path d="M51 210h25v2H51Zm36 0h32v2H87Z" fill={p.soft}/>
    <path d="M56 215h8v14h-8Zm11 3h6v11h-6Zm23-5h7v16h-7Zm10 4h8v12h-8Z" fill={p.sofa}/><path d="M51 228h26v3H51Zm36 0h32v3H87Z" fill={p.trim}/>
    <path d="M52 214h3v12h-3Zm35-4h3v17h-3Z" fill="#fff1d144"/><path d="M73 213h3v9h-3Zm11 0h3v9h-3Z" fill={p.edge}/>
    <path d="M41 235h88v6H41Z" fill={p.wood}/><path d="M44 235h82v2H44Z" fill={p.top}/>
    <path d="M36 142h98v6H36Z" fill={p.wood}/><path d="M39 142h92v2H39Z" fill={p.edge}/><path d="M50 143h15v2H50Zm25 0h15v2H75Zm25 0h15v2H100Z" fill="#f4d889"/>
  </g>;
}

export function ApartmentConsole({ p, spa = false, bath = false, night = false }: FurnitureProps & { spa?: boolean; bath?: boolean; night?: boolean }) {
  return <g data-home-furniture={spa ? "basin" : bath ? "bath-bench" : "tv-console"}>
    <path d="M339 233h104v13H339Z" fill="#20232e33"/><path d="M347 232h7v9h-7Zm80 0h7v9h-7Z" fill={p.wood}/>
    <path d="M341 197h99v40h-99Z" fill={INK}/><path d="M344 199h93v34h-93Z" fill={p.wood}/><path d="M347 210h35v19h-35Zm39 0h46v19h-46Z" fill={p.dark}/><path d="M339 195h103v10H339Z" fill={p.top}/><path d="M342 196h97v3h-97Z" fill={p.edge}/>
    {spa || bath ? <g>
      <path d="M350 213h29v4h-29Zm0 5h29v4h-29Zm0 5h29v4h-29Z" fill={p.soft}/><path d="M354 213h3v14h-3Zm16 0h3v14h-3Z" fill={p.trim}/>
      <path d="M394 212h29v16h-29Z" fill={p.trim}/><path d="M396 215h25v3h-25Zm0 6h25v2h-25Z" fill={p.top}/>
      {spa ? <g><path d="M350 182h79v12h-6v5h-67v-5h-6Z" fill={p.dark}/><path d="M354 183h72v8h-7v4h-58v-4h-7Z" fill={p.soft}/><path d="M359 185h62v3h-62Z" fill="#f3e2c0"/><path d="M367 188h46v4h-46Z" fill="#88b6b0"/><path d="M385 166h12v3h4v15h-7v-12h-7v8h-6v-10h4Z" fill="#b9a68b"/><path d="M387 167h8v2h-8Zm8 5h3v10h-3Z" fill="#f3e2c0"/></g> : <g><path d="M356 170h29v24h-29Z" fill={p.dark}/><path d="M359 173h23v18h-23Z" fill={p.top}/><path d="M363 174h2v16h-2Zm7 0h2v16h-2Zm7 0h2v16h-2Z" fill={p.seam}/><path d="M356 177h29v3h-29Zm0 9h29v3h-29Z" fill="#586566"/><path d="M360 167h3v-7h15v7h3v6h-3v-10h-15v10h-3Z" fill={p.wood}/><path d="M395 172h27v5h-27Zm-2 7h30v5h-30Zm2 7h27v5h-27Z" fill="#f3e2c0"/><path d="M399 173h3v17h-3Zm14 0h3v17h-3Z" fill={p.trim}/></g>}
    </g> : <g>
      <path d="M354 216h5v13h-5Zm7-3h6v16h-6Zm8 3h5v13h-5Z" fill={p.rug}/><path d="M354 220h5v2h-5Zm7-4h6v2h-6Zm8 4h5v2h-5Z" fill={p.edge}/>
      <path d="M390 214h34v13h-34Z" fill={INK}/><path d="M393 217h14v2h-14Zm0 4h14v2h-14Z" fill={p.top}/><path d="M415 218h5v5h-5Z" fill={p.sofa}/><path d="M420 219h2v2h-2Z" fill="#88a980"/>
      <path d="M363 193h57v4h-57Z" fill="#20232e55"/><path d="M386 186h11v7h-11Zm-7 6h25v3h-25Z" fill={p.wood}/>
      <path d="M357 149h70v41h-70Z" fill={INK}/><path d="M359 151h65v36h-65Z" fill={p.wood}/><path d="M364 154h50v29h-50Z" fill={night ? "#202a43" : "#263d45"}/><path d="M366 156h46v2h-46v23h-2v-25Z" fill={p.dark}/>
      <path d="M370 165h30v3h-30Zm5 9h14v2h-14Zm18 3h15v2h-15Z" fill={night ? "#8799b1" : p.sofa}/><path d="M368 160h10v1h-10Zm0 19h5v1h-5Z" fill={p.soft}/>
      <path d="M418 157h4v4h-4Zm0 10h4v4h-4Z" fill={p.edge}/><path d="M418 177h4v2h-4Zm0 4h4v2h-4Z" fill={p.dark}/>
    </g>}
  </g>;
}

export function ApartmentWardrobe({ p, spa = false }: FurnitureProps & { spa?: boolean }) {
  return <g data-home-furniture="wardrobe">
    <path d="M338 523h98v15h-98Z" fill="#20232e33"/><path d="M345 526h8v8h-8Zm78 0h8v8h-8Z" fill={p.wood}/><path d="M340 444h94v86h-94Z" fill={INK}/>
    <path d="M338 441h98v9h-98Z" fill={p.wood}/><path d="M341 441h92v3h-92Z" fill={p.top}/><path d="M344 450h86v74h-86Z" fill={p.wood}/>
    <path d="M348 453h36v66h-36Zm41 0h36v66h-36Z" fill={p.trim}/><path d="M351 456h30v60h-30Zm41 0h30v60h-30Z" fill={p.dark}/>
    <path d="M353 457h27v4h-27v51h-2v-55Zm41 0h27v4h-27v51h-2v-55Z" fill={p.top}/><path d="M356 464h22v20h-22Zm0 25h22v21h-22Zm41-25h21v20h-21Zm0 25h21v21h-21Z" fill={p.wood}/>
    <path d="M358 465h18v2h-18Zm0 25h18v2h-18Zm41-25h17v2h-17Zm0 25h17v2h-17Z" fill={p.seam}/>
    <path d="M375 482h5v10h-5Zm18 0h5v10h-5Z" fill={p.edge}/><path d="M376 483h2v6h-2Zm18 0h2v6h-2Z" fill="#fff1d1"/>
    <path d="M344 521h86v7h-86Z" fill={p.wood}/><path d="M347 522h80v2h-80Z" fill={p.top}/>
    {spa ? <g><path d="M350 432h25v4h-25Zm0 5h25v4h-25Zm30-5h28v4h-28Zm0 5h28v4h-28Z" fill="#f3e2c0"/><path d="M356 432h3v9h-3Zm31 0h3v9h-3Z" fill={p.trim}/></g> : <g><path d="M350 427h23v13h-23Z" fill={p.rug}/><path d="M352 430h19v2h-19Zm4-2h3v11h-3Z" fill={p.edge}/><path d="M394 432h24v8h-24Z" fill={p.sofa}/><path d="M396 433h20v2h-20Z" fill={p.soft}/></g>}
  </g>;
}

export function SaunaStove() {
  return <g data-home-furniture="sauna-stove">
    <g className="home-stove-glow" opacity=".18"><path d="M333 472h96v9h14v45h-14v13h-96v-13h-13v-45h13Z" fill="#e5ac6d"/></g>
    <path d="M412 387h13v58h-13Z" fill="#343d48"/><path d="M414 389h4v53h-4Z" fill="#809084"/><path d="M410 401h17v4h-17Zm0 28h17v4h-17Z" fill="#586566"/>
    <path d="M338 526h100v14H338Z" fill="#20232e44"/><path d="M348 521h9v13h-9Zm65 0h9v13h-9Z" fill="#343d48"/>
    <path d="M340 447h94v82h-94Z" fill={INK}/><path d="M344 448h87v76h-87Z" fill="#343d48"/><path d="M348 451h73v68h-73Z" fill="#586566"/><path d="M350 452h67v3h-67Zm-1 0h3v58h-3Z" fill="#809084"/>
    <path d="M421 451h7v72h-7Z" fill="#20232e"/><path d="M353 461h62v4h-62Zm0 10h62v4h-62Zm0 10h62v4h-62Z" fill="#343d48"/><path d="M356 461h3v4h-3Zm12 0h3v4h-3Zm12 0h3v4h-3Zm12 0h3v4h-3Zm12 0h3v4h-3Z" fill="#809084"/>
    <path d="M355 491h61v30h-61Z" fill="#a4aca1"/><path d="M358 494h55v23h-55Z" fill="#18232c"/><path d="M363 513h39v5h-39Z" fill="#775442"/><path d="M366 513h12v2h-12Zm15 1h13v2h-13Z" fill="#ae8060"/>
    <g className="home-stove-flame home-stove-flame-back"><path d="M365 513v-9h5v-7h6v9h6v-13h6v11h5v-7h4v10h8v6Z" fill="#b76253"/><path d="M369 513v-7h5v-4h3v8h6v-9h4v8h7v-5h4v9Z" fill="#e5ac6d"/></g>
    <g className="home-stove-flame home-stove-flame-front"><path d="M375 515v-6h4v-6h4v8h5v-6h3v7h5v3Z" fill="#f4d889"/><path d="M380 515v-5h4v5Z" fill="#fff1d1"/></g>
    <path d="M412 499h3v13h-3Zm-55-7h3v3h-3Zm0 23h3v3h-3Z" fill="#c7d6ce"/><path d="M361 521h49v2h-49Z" fill="#20232e"/>
    <path d="M338 441h98v8h-98Z" fill="#20232e"/><path d="M341 441h92v4h-92Z" fill="#809084"/>
    <path d="M344 431h17v10h-17Zm21-6h19v16h-19Zm21 7h21v9h-21Zm23-3h20v12h-20Z" fill="#586566"/>
    <path d="M346 431h12v4h-12Zm21-6h14v5h-14Zm22 7h15v4h-15Zm23-3h14v4h-14Z" fill="#a4aca1"/>
    <path d="M352 436h7v4h-7Zm22-4h8v7h-8Zm22 4h8v4h-8Zm24-1h8v5h-8Z" fill="#698077"/>
    <ApartmentSteam x={380} y={430}/>
  </g>;
}

export function ApartmentSteam({ x, y }: { x: number; y: number }) {
  return <g transform={`translate(${x} ${y})`} aria-hidden="true">
    <g className="home-steam-puff home-steam-puff-one" opacity=".42"><path d="M-14-8h8v-8h4v-12h-8v-6h-4v-9h5v-7h6v8h-5v6h5v7h8v17h-5v8h-9Z" fill="#f3f0de"/></g>
    <g className="home-steam-puff home-steam-puff-two" opacity=".3"><path d="M9 0h9v-7h4v-13h-8v-8h-4v-9h6v8h5v8h7v16h-5v9H9Z" fill="#f3f0de"/></g>
  </g>;
}

export function ApartmentFloorLamp({ p, night = false }: FurnitureProps & { night?: boolean }) {
  return <g data-home-furniture="floor-lamp">
    {night && <g opacity=".15"><path d="M211 180h31l28 92h-89Z" fill="#f4d889"/><path d="M191 253h67v5h9v13h-88v-13h12Z" fill="#f4d889"/></g>}
    <path d="M213 263h30v5h-30Z" fill="#20232e33"/><path d="M213 258h30v6h-30Z" fill={p.wood}/><path d="M217 258h22v2h-22Z" fill={p.top}/>
    <path d="M225 177h6v83h-6Z" fill={p.wood}/><path d="M226 180h2v77h-2Z" fill={p.top}/>
    <path d="M214 159h27v5h5v12h4v8h-44v-8h4v-12h4Z" fill={p.wood}/><path d="M216 161h23v5h5v12h3v3h-38v-3h3v-12h4Z" fill={p.edge}/>
    <path d="M216 163h4v15h-4Zm10-2h4v17h-4Zm10 2h4v15h-4Z" fill={p.top}/><path d="M214 179h29v2h-29Z" fill="#fff1d1"/><path d="M241 184h2v10h-2Z" fill={p.wood}/><path d="M240 193h4v3h-4Z" fill={p.edge}/>
  </g>;
}

export function ApartmentRug({ p, spa = false }: FurnitureProps & { spa?: boolean }) {
  return <g data-home-furniture="rug">
    <path d="M148 273h206v205H148Z" fill={p.wood}/><path d="M151 276h200v199H151Z" fill={p.edge}/><path d="M159 284h184v183H159Z" fill={p.rug}/>
    <path d="M162 287h178v3H162Zm0 172h178v3H162Zm0-166h3v160h-3Zm175 0h3v160h-3Z" fill={p.edge}/>
    <path d="M170 296h161v2H170Zm0 157h161v2H170Zm0-151h2v145h-2Zm159 0h2v145h-2Z" fill={p.wood} opacity=".55"/>
    {Array.from({ length: 12 }, (_, i) => <path key={i} d={`M${157 + i * 16} 270h3v6h-3Zm0 204h3v6h-3Z`} fill={p.edge}/>)}
    {Array.from({ length: 8 }, (_, i) => <g key={i}><path d={`M${178 + i * 20} 292h4v4h-4Zm0 165h4v4h-4Z`} fill={p.wood}/><path d={`M153 ${300 + i * 20}h4v4h-4Zm192 0h4v4h-4Z`} fill={p.wood}/></g>)}
    <path d="M241 320h21v10h10v10h10v21h-10v10h-10v10h-21v-10h-10v-10h-10v-21h10v-10h10Z" fill={p.edge}/><path d="M245 329h13v9h10v9h7v10h-7v9h-10v8h-13v-8h-10v-9h-7v-10h7v-9h10Z" fill={p.rug}/><path d="M248 340h7v8h8v8h-8v8h-7v-8h-8v-8h8Z" fill={p.edge}/>
    <path d="M179 307h16v4h-16v12h-4v-16Zm144 0h-16v4h16v12h4v-16ZM179 445h16v-4h-16v-12h-4v16Zm144 0h-16v-4h16v-12h4v16Z" fill={p.edge}/>
    {spa && <path d="M218 391h67v3h-67Zm7 7h53v3h-53Zm10 7h33v3h-33Z" fill={p.soft}/>}
  </g>;
}
