import { HomeDoor, ApartmentSofa, ApartmentCoffeeTable, ApartmentMiniBar, ApartmentConsole, ApartmentWardrobe, SaunaStove, ApartmentSteam, ApartmentFloorLamp, ApartmentRug } from "./apartment-furniture";
import type { ThemeId } from "./cosmetic-engine";
import { PixelDog } from "./pixel-artwork";
import { ApartmentKeepsakes } from "./apartment-keepsakes";
import type { NeighborhoodProgress } from "./neighborhood-progress";

export const APARTMENT_PALETTES = {
  classic: { floor: "#c7a37f", seam: "#ae8060", wall: "#ece3ca", trim: "#d8c6a4", wood: "#775442", top: "#d1aa7a", sofa: "#537d75", soft: "#88a980", dark: "#48635e", rug: "#be8471", edge: "#e4cc9b", sky: "#88b6b0" },
  soda: { floor: "#c8dfe8", seam: "#a4c6d8", wall: "#b9ddf2", trim: "#87b4d3", wood: "#587f9c", top: "#e1edf2", sofa: "#668eae", soft: "#b8d9ed", dark: "#466b8e", rug: "#a7c9de", edge: "#f3e2c0", sky: "#88c9eb" },
  mint: { floor: "#dce8de", seam: "#9fbab0", wall: "#cfdfd5", trim: "#729c92", wood: "#69877c", top: "#f1ead7", sofa: "#a9c7b8", soft: "#e2ecdf", dark: "#69877c", rug: "#a9c7b8", edge: "#e4d4a3", sky: "#9fc8c1" },
  bath: { floor: "#bb926c", seam: "#8d674f", wall: "#d5b28a", trim: "#aa805d", wood: "#775442", top: "#e4c394", sofa: "#bc9169", soft: "#e4c394", dark: "#8d674f", rug: "#c0a175", edge: "#eed8ac", sky: "#d4c8a9" },
  night: { floor: "#596077", seam: "#40495f", wall: "#344258", trim: "#536479", wood: "#3d4358", top: "#a08b83", sofa: "#58728b", soft: "#8295a8", dark: "#3b4d67", rug: "#62516b", edge: "#b99d8d", sky: "#202a43" },
  emerald: { floor: "#48796a", seam: "#31584f", wall: "#31584f", trim: "#507f65", wood: "#345c50", top: "#d8bd7c", sofa: "#486e58", soft: "#88aa7b", dark: "#294c42", rug: "#426557", edge: "#d8bd7c", sky: "#427d72" },
} satisfies Record<ThemeId, object>;
export type ApartmentPalette = (typeof APARTMENT_PALETTES)[ThemeId];
const INK = "#343041";
function Palm({ x, y, pot, tropical = false }: { x: number; y: number; pot: string; tropical?: boolean }) {
  return <g transform={`translate(${x} ${y})`}><path d="M-13 0h26v21h-26Z" fill={INK}/><path d="M-10 3h20v15h-20Z" fill={pot}/><path d="M-3-28h6v10h10v7h9V0H8v-6H3v14h-6V-6h-5V0h-14v-11h9v-7h10Z" fill="#537d75"/><path d="M-3-28h6v13h-6ZM8-10h12v5H8Zm-28 0h12v5h-12Z" fill="#88a980"/>{tropical && <path d="M-5-30h-11v4h-10v8h13v-5h8Zm10 0h11v4h10v8H13v-5H5Z" fill="#a9c7b8"/>}</g>;
}
function WindowView({ theme, prefix }: { theme: ThemeId; prefix: string }) {
  const p = APARTMENT_PALETTES[theme], night = theme === "night";
  return <g><defs><clipPath id={`${prefix}-home-window`}><rect x="172" y="52" width="110" height="45"/></clipPath></defs>
    <rect x="163" y="44" width="128" height="60" fill={p.wood}/><rect x="169" y="49" width="116" height="51" fill="#f3e2c0"/>
    <g clipPath={`url(#${prefix}-home-window)`}><rect x="172" y="52" width="110" height="45" fill={p.sky}/>
      {night ? <g><path d="M253 57h12v4h-6v9h6v4h-12v-4h-4v-9h4Z" fill="#f3e2c0"/><path d="M182 57h2v2h-2Zm18 7h3v3h-3Zm36-9h2v2h-2Zm35 14h2v2h-2Z" fill="#e4cc9b"/>{[0, 1, 2, 3, 4, 5].map(i => <g key={i}><rect x={174 + i * 20} y={78 + i % 3 * 3} width="16" height="25" fill={i % 2 ? "#3d4358" : "#40495f"}/><path d={`M${178 + i * 20} 86h3v4h-3Zm7 0h3v4h-3Zm-7 7h3v4h-3Z`} fill="#d1aa7a"/></g>)}</g> : <g><path d="M180 59h18v3h6v6h-30v-6h6Zm53 4h23v3h8v6h-38v-6h7Z" fill="#f3f0de"/><path d="M180 62h18v3h-18Zm51 4h27v3h-27Z" fill="#e1edf2"/><path d="M170 86h112v14H170Z" fill={theme === "soda" ? "#a9d4dc" : "#729c92"}/><path d="M178 79h16v9h-16Zm36-3h22v12h-22Zm40 4h20v8h-20Z" fill={theme === "soda" ? "#e1edf2" : "#537d75"}/></g>}
    </g>
    <path d="M226 49h4v51h-4Zm-57 22h116v3H169Z" fill={p.top}/><path d="M160 101h134v7H160Z" fill={p.wood}/><path d="M160 101h134v3H160Z" fill={p.top}/>
    <path d="M146 40h160v4H146Z" fill={p.wood}/><path d="M149 40h154v1H149Z" fill={p.top}/>
    <path d="M150 44h18v16h-4v19h-3v20h-13V79h3V60h-1Zm136 0h19v35h3v20h-13V79h-3V60h-6Z" fill={night ? "#746079" : p.soft}/>
    <path d="M153 45h3v29h-3v23h-3V77h3Zm7 0h3v15h-3Zm135 0h3v29h3v23h-3V77h-3Zm6 0h2v18h-2Z" fill={p.edge}/><path d="M150 77h12v3h-12Zm143 0h14v3h-14Z" fill={p.wood}/>
    <path d="M174 103h23v4h-23Z" fill={p.dark}/><path d="M178 92h15v11h-15Z" fill={p.rug}/><path d="M178 92h15v3h-15Z" fill={p.edge}/><path d="M184 87h3v6h-3Zm-7-4h6v5h-6Zm11 0h6v5h-6Z" fill="#537d75"/><path d="M182 81h8v7h-8Z" fill="#b76253"/>
  </g>;
}
export function ApartmentScene({ prefix, theme, keepsakes }: { prefix: string; theme: ThemeId; keepsakes?: NeighborhoodProgress }) {
  const p = APARTMENT_PALETTES[theme], spa = theme === "mint", bath = theme === "bath", night = theme === "night", fancy = theme === "soda" || theme === "emerald";
  return <g data-apartment-theme={theme}>
    <defs>
      <pattern id={`${prefix}-home-floor`} width={spa ? 48 : 96} height={spa ? 48 : 32} patternUnits="userSpaceOnUse">
        <rect width="96" height="48" fill={p.floor}/>
        {spa ? <g><path d="M0 0h48v2H0Zm0 0h2v48H0Z" fill={p.seam}/><path d="M4 4h40v1H4v39H3V4Z" fill={p.top}/><path d="M7 7h3v3H7Zm30 0h3v3h-3Zm-30 30h3v3H7Zm30 0h3v3h-3Z" fill={p.wood}/><path d="M18 11h2v13h4v3h-6Zm9 18h6v2h-6v8h-2v-10Z" fill="#ffffff55"/></g> : <g><path d="M0 0h96v2H0Zm0 16h96v2H0Zm32 0h2v16h-2Zm40 16h2v16h-2Z" fill={p.seam}/><path d="M3 3h27v1H3Zm34 0h55v1H37Zm-32 16h33v1H5Zm38 0h48v1H43Z" fill={p.top} opacity=".45"/><path d="M6 8h14v1H6Zm7 2h13v1H13Zm33-4h20v1H46Zm5 3h18v1H51Zm-44 14h17v1H7Zm40 3h27v1H47Z" fill={p.seam} opacity=".5"/><path d="M79 7h7v2h-7Zm-56 16h6v2h-6Z" fill={p.wood} opacity=".16"/></g>}
      </pattern>
      <pattern id={`${prefix}-home-wall`} width={spa ? 32 : 24} height="40" patternUnits="userSpaceOnUse"><rect width="32" height="40" fill={p.wall}/>
        {spa ? <g><path d="M0 0h32v2H0Zm0 20h32v2H0ZM0 0h2v40H0Zm16 0h2v40h-2Z" fill={p.trim}/><path d="M5 7h6v4H5Zm16 15h8v4h-8Z" fill={p.soft}/></g> : bath ? <g><path d="M0 0h24v2H0Zm0 13h24v2H0Zm0 26h24v2H0Z" fill={p.trim}/><path d="M3 5h14v1H3Zm5 14h12v1H5Zm-2 11h15v1H3Z" fill={p.top}/></g> : <g><path d="M5 0h2v40H5Zm12 0h2v40h-2Z" fill={p.trim} opacity=".65"/><path d="M19 10h2v2h-2Zm0 20h2v2h-2" fill={p.top} opacity=".6"/></g>}
      </pattern>
    </defs>
    <rect width="480" height="600" fill={night ? "#20283a" : "#272936"}/><rect x="20" y="40" width="440" height="520" fill={p.wood}/><rect x="28" y="108" width="424" height="440" fill={`url(#${prefix}-home-floor)`}/>
    <rect x="20" y="40" width="440" height="66" fill={`url(#${prefix}-home-wall)`}/><path d="M20 40h440v5H20ZM20 104h440v4H20ZM20 548h440v8H20Z" fill={p.trim}/><path d="M20 106h440v5H20ZM20 548h440v8H20Z" fill={INK}/>
    <path d="M24 112h4v432h-4Zm428 0h4v432h-4Z" fill={p.top}/><path d="M28 112h3v432h-3Zm421 0h3v432h-3Z" fill={p.seam}/><path d="M31 113h418v5H31" fill="#20232e11"/>
    <WindowView theme={theme} prefix={prefix}/><HomeDoor p={p}/><HomeDoor p={p} basement/>
    <g><path d="M305 58h22v27h-22Z" fill={p.wood}/><path d="M307 60h18v23h-18Z" fill={p.edge}/><path d="M310 64h12v14h-12Z" fill={p.top}/><path d="M315 66h2v7h5v2h-7Z" fill={p.wood}/><path d="M313 80h6v2h-6Z" fill={p.dark}/></g>
    {!night && <g opacity={spa || bath ? ".04" : ".1"}><path d="M174 110h108l43 145H139Z" fill="#fff1d1"/><path d="M225 112h4l21 143h-4Z" fill={p.sky}/></g>}
    <ApartmentRug p={p} spa={spa}/><ApartmentSofa p={p} bench={spa || bath}/><ApartmentCoffeeTable p={p}/><ApartmentMiniBar p={p}/>
    <ApartmentConsole p={p} spa={spa} bath={bath} night={night}/>
    {bath ? <SaunaStove/> : <ApartmentWardrobe p={p} spa={spa}/>}
    <Palm x={67} y={492} pot={p.wood} tropical={spa || fancy}/><Palm x={422} y={132} pot={p.wood} tropical={spa || fancy}/>
    <g><path d="M36 532h24v6H36Zm29-2h25v8H65Z" fill="#20232e33"/><path d="M36 525h24v8H36Zm29-2h25v10H65Z" fill={p.wood}/><path d="M38 525h19v3H38Zm29-2h20v3H67Z" fill={p.soft}/><path d="M40 528h7v3h-7Zm30-2h7v3h-7Z" fill={p.top}/></g>
    <ApartmentFloorLamp p={p} night={night}/><ApartmentKeepsakes items={keepsakes} night={night}/>
    {night && <path d="M173 108h107l37 81H151Z" fill="#8799b1" opacity=".12"/>}
    {spa && <g><ApartmentSteam x={386} y={174}/><ApartmentSteam x={110} y={335}/><path d="M104 304h29v18h-29Z" fill="#e2ecdf"/><path d="M106 306h25v3h-25Zm2 5h4v9h-4Zm8 0h4v9h-4Z" fill={p.trim}/></g>}
    {fancy && <g><path d="M292 214h28v27h-28Z" fill={p.wood}/><path d="M294 216h24v23h-24Z" fill={p.top}/><path d="M297 218h18v18h-18Z" fill={p.edge}/><svg x="298" y="219" width="16" height="16" viewBox="0 0 128 128"><PixelDog/></svg><path d="M301 243h10v4h-10Z" fill={p.wood}/></g>}
    <g><path d="M149 218h24v4h-24Zm-1 5h27v4h-27Zm1 5h24v4h-24Z" fill={p.wood}/><path d="M150 218h22v2h-22Zm0 5h23v2h-23Zm0 5h22v2h-22Z" fill={p.edge}/><path d="M151 215h18v3h-18Z" fill={p.sofa}/></g>
    <path d="M52 126h104v18H52Zm276 0h95v18h-95Z" fill="#e4cc9b"/><path d="M52 126h104v2H52Zm276 0h95v2h-95Z" fill="#fff1d1"/><text x="104" y="139" textAnchor="middle" className="adventure-map-label">УЛИЦА</text><text x="375" y="139" textAnchor="middle" className="adventure-map-label">ПОДВАЛ</text><path d="M38 254h98v23H38Z" fill="#e4cc9b"/><path d="M38 254h98v2H38Z" fill="#fff1d1"/><text x="87" y="271" textAnchor="middle" className="adventure-map-label">МИНИ-БАР</text>
  </g>;
}
