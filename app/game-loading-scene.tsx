import { AnimatedAdventureKnopik } from "./knopik-adventure-art";
import { NEIGHBORHOOD_BUILDINGS, neighborhoodActorMatrix } from "./neighborhood-map";
import { StreetProp, streetPalette } from "./neighborhood-props";

/** A lightweight, fixed composition made from the same artwork as the district. */
export function GameLoadingScene({ prefix }: { prefix: string }) {
  const p = streetPalette(true);
  const prop = (kind: "tree" | "lamp" | "bench" | "planter" | "bicycle", variant = 0) =>
    <StreetProp object={{ id: `loading-${kind}-${variant}`, kind, x: 0, y: 0, variant }} p={p} />;
  return <svg className="game-loading__illustration" viewBox="0 0 640 430" shapeRendering="crispEdges" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id={`${prefix}-sky`} x2="0" y2="1"><stop stopColor="#27344b"/><stop offset=".68" stopColor="#65717e"/><stop offset="1" stopColor="#b59582"/></linearGradient>
      <linearGradient id={`${prefix}-river`} x2="0" y2="1"><stop stopColor="#426a76"/><stop offset="1" stopColor="#223f53"/></linearGradient>
      <radialGradient id={`${prefix}-moon`}><stop stopColor="#e4cc9b" stopOpacity=".2"/><stop offset="1" stopColor="#e4cc9b" stopOpacity="0"/></radialGradient>
      <radialGradient id={`${prefix}-light`}><stop stopColor="#f4d889" stopOpacity=".32"/><stop offset="1" stopColor="#f4d889" stopOpacity="0"/></radialGradient>
      <pattern id={`${prefix}-pavers`} width="72" height="24" patternUnits="userSpaceOnUse"><path d="M0 0h72M36 0v12M0 12h72M12 12v12" stroke="#657077" strokeWidth="1"/><path d="M3 3h22v1H3m38 13h15v1H41" fill="#adb09d" opacity=".2"/></pattern>
      <filter id={`${prefix}-knopik`} x="-30%" y="-10%" width="160%" height="130%" colorInterpolationFilters="sRGB"><feColorMatrix type="matrix" values={neighborhoodActorMatrix(.8)}/></filter>
    </defs>
    <path d="M0 0h640v430H0Z" fill={`url(#${prefix}-sky)`}/>
    <circle cx="550" cy="72" r="79" fill={`url(#${prefix}-moon)`}/>
    <path d="M540 48h20v4h8v8h4v24h-4v8h-8v4h-20v-4h-8v-8h-4V60h4v-8h8Z" fill="#f3e2c0"/>
    <path d="M540 48h20v4h8v8h4v24h-4v8h-8v4h-11V82h-9V65h-8v-5h8Z" fill="#d2c4aa"/>
    <path d="M543 57h8v5h-8Zm13 16h7v7h-7Zm-15 11h6v4h-6Z" fill="#b8b9ad" opacity=".6"/>
    <g className="game-loading__sky-stars" fill="#e8dbc0"><path d="M45 39h3v3h-3Zm88-17h3v3h-3Zm157 12h3v3h-3Zm78 25h3v3h-3Zm103-39h3v3h-3Zm102 90h3v3h-3Z"/><path d="M227 39h2v3h3v2h-3v3h-2v-3h-3v-2h3Zm204 45h2v3h3v2h-3v3h-2v-3h-3v-2h3Z"/></g>
    <g fill="#87909b" opacity=".2"><path d="M40 83h66v3h35v4H19v-4h21Zm291 14h58v3h25v3h-96v-3h13Zm154 49h53v3h42v3H462v-3h23Z"/></g>
    <g fill="#475669"><path d="M0 184h29v-52h55v26h32v-38h53v62h35v-31h48v42h43v-51h46v26h25v-52h51v46h31v-31h55v32h32v-25h57v46h38v-31h50v139H0Z"/></g>
    <path d="M36 151h4v7h-4Zm12 0h4v7h-4Zm86-14h4v7h-4Zm12 0h4v7h-4Zm165 23h4v7h-4Zm77-23h4v7h-4Zm14 0h4v7h-4Zm128 23h4v7h-4Zm78 17h4v7h-4Z" fill="#d1aa7a" opacity=".5"/>
    <path d="M0 249h640v113H0Z" fill="#4b625c"/>
    <g transform="translate(-120 263) scale(.54)"><StreetProp object={NEIGHBORHOOD_BUILDINGS[2]} p={p}/></g>
    <g transform="translate(37 281) scale(.62)"><StreetProp object={NEIGHBORHOOD_BUILDINGS[0]} p={p}/></g>
    <g transform="translate(423 272) scale(.55)"><StreetProp object={NEIGHBORHOOD_BUILDINGS[1]} p={p}/></g>
    <path d="M0 287h640v83H0Z" fill="#8c9088"/>
    <path d="M0 287h640v83H0Z" fill={`url(#${prefix}-pavers)`}/>
    <path d="M0 286h640v4H0Zm0 76h640v4H0Z" fill="#b0b1a1"/>
    <path d="M0 290h640v2H0Z" fill="#394e53" opacity=".7"/>
    <g transform="translate(235 278) scale(.52)">{prop("bicycle")}</g>
    <g transform="translate(102 291) scale(.5)">{prop("planter")}</g>
    <g transform="translate(499 317) scale(.65)">{prop("bench")}</g>
    <g transform="translate(606 312) scale(.84)">{prop("tree", 1)}</g>
    <g transform="translate(50 316) scale(.78)">{prop("tree", 2)}</g>
    <g transform="translate(167 320) scale(.6)">{prop("lamp", 1)}</g>
    <ellipse cx="369" cy="326" rx="119" ry="38" fill={`url(#${prefix}-light)`}/>
    <ellipse cx="402" cy="185" rx="63" ry="80" fill={`url(#${prefix}-light)`} opacity=".65"/>
    <g transform="translate(404 339) scale(1.12)">{prop("lamp")}</g>
    <g transform="translate(323 340) scale(1.48)" filter={`url(#${prefix}-knopik)`}><g className="game-loading__knopik-idle"><AnimatedAdventureKnopik/></g></g>
    <g className="game-loading__fireflies" fill="#e4cc9b"><path d="M244 254h3v3h-3Zm117-27h3v3h-3Zm71 67h2v2h-2Z"/></g>
    <path d="M145 347h8v2h-8Zm57-17h6v2h-6Zm340 6h8v2h-8Zm-6 9h5v2h-5Z" fill="#c1ad83"/>
    <path d="M0 370h640v60H0Z" fill={`url(#${prefix}-river)`}/>
    <g className="game-loading__water" fill="#7da09e" opacity=".65"><path d="M21 391h46v2H21Zm12 7h18v2H33Zm91 15h67v2h-67Zm18-7h23v2h-23Zm114-19h36v2h-36Zm207 6h65v2h-65Zm19 7h26v2h-26Zm-136 17h34v2h-34Zm220-9h41v2h-41Z"/></g>
    <path d="M372 386h47v3h-47Zm7 8h34v2h-34Zm6 7h23v2h-23Zm4 7h15v2h-15Z" fill="#d1b47d" opacity=".42"/>
    <g transform="translate(532 403)" className="game-loading__boat"><path d="M-15-1H17L9 6H-8Z" fill="#d1aa7a"/><path d="M-3-15V0h17Z" fill="#f3e2c0"/><path d="M-4-14-15-1H-4Z" fill="#94b0aa"/></g>
    <path d="M0 358h640v9H0Z" fill="#343e4b"/><path d="M0 358h640v3H0Z" fill="#b0b1a1"/>
    <g fill="#4b565f">{[8,82,156,230,304,378,452,526,600].map(x=><path key={x} d={`M${x} 362h66v4h-66Z`}/>)}</g>
    <g fill="#394853">{[18,110,202,438,530,622].map(x=><path key={x} d={`M${x} 321h6v39h-6Zm-2 0h10v4h-10Z`}/>)}</g>
    <path d="M0 329h222v3H0Zm429 0h211v3H429Z" fill="#4d6269"/>
  </svg>;
}
