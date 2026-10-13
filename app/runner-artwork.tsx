import { memo, type RefObject } from "react";
import { KnopikHeadArtwork, KnopikTailArtwork } from "./knopik-adventure-art";
import { BrainrotCharacter } from "./brainrot-artwork";
import { RunnerBarrierSprites } from "./runner-barrier-art";
import { RunnerBiomeSprites } from "./runner-biome-art";
import { MarketCargo, SahurBack } from "./runner-characters";
import { StreetStartBack, StreetStartFront } from "./runner-street-start";
import { RunnerCitySprites } from "./runner-city-art";

// Bump when changing the scene tree: the renderer reparents pooled SVG nodes.
// Remount the SVG island during Fast Refresh instead of reconciling moved children.
export const RUNNER_ART_REVISION = "gpu-mobile-20261013-11-shiba-street-start";

function Sahur({ stride = 0, strike = false }: { stride?: number; strike?: boolean }) {
  return <g>
    <path d={stride ? "M-17-27h10v23h-5v7h-16v-6h9ZM8-27h11v17h9v7H8Z" : "M-19-27h11v17h-9v7H-28v-7h9ZM7-27h10v24h10v6H9V-4H7Z"} fill="#72442e" />
    <path d="M-19-97h38v4h5v62h-5v8h-38v-8h-5v-62h5Z" fill="#563829" />
    <path d="M-16-98h31v4h5v59h-5v8h-31v-8h-5v-59h5Z" fill="#b77844" />
    <path d="M-13-94h10v60h-5v-39h-5Zm13 0h5v16H0ZM9-92h7v48H9Z" fill="#dba467" />
    <path d="M-17-88h3v17h3v6h-3v24h-3ZM-3-54h3v13h-3ZM5-90h3v35H5ZM13-46h3v14h-3Z" fill="#935b36" />
    <path d="M-18-80h14v3h-14ZM4-77h14v-3H4Z" fill="#422c25" />
    <path d="M-17-75h12v12h-12ZM5-75h12v12H5Z" fill="#f5e3c2" />
    <path d="M-13-72h7v8h-7ZM6-72h7v8H6Z" fill="#2d2630" />
    <path d="M-12-70h3v3h-3ZM7-70h3v3H7Z" fill={strike ? "#ff555e" : "#fff1d1"} />
    <path d="M-3-70h6v12h-6Z" fill="#e3b37b" /><path d="M-11-51h22v3H-11Zm3 3h16v6H-8Z" fill="#4b3028" />
    <path d="M-6-47h12v2H-6Z" fill="#f2d2a0" />
    <path d={stride ? "M-24-73h-7v24h-5v11h9v-13h3Z" : "M-24-73h-7v12h-6v11h9v-9h4Z"} fill="#b77844" />
    <g transform={strike ? "translate(23 -72) rotate(-65)" : "translate(23 -52) rotate(-16)"}>
      <path d="M-3-6h8v19h-8Z" fill="#d8a36b" />
      <path d="M6-54h11v5h4v32h-4V9h-8v-26H5v-32h1Z" fill="#704832" />
      <path d="M9-49h5v31h-2V5h-3Z" fill="#d3a369" /><path d="M15-42h3v18h-3Z" fill="#ab774b" />
    </g>
  </g>;
}

export function RunnerDog() {
  return <g>
    <path data-runner-shadow d="M-27-3h54v3h9v5h-9v3h-54V5h-9V0h9Z" fill="#292c4566" />
    <path data-runner-magnet d="M-39-5h78v3h12v5H39v3h-78V3h-12v-5h12Z" fill="none" stroke="#83c8ba" strokeWidth="3" opacity="0" />
    <path data-runner-shield d="M-19-140h38v6h16v12h12v86H35v16H19v8h-38v-8h-16v-16h-12v-86h12v-12h16Z" fill="#a3edce15" stroke="#b7f5cd" strokeWidth="3" opacity="0" />
    <g data-runner-pose>
      <g data-runner-leg-left>
        <path d="M-21-35h17v20h-3v8h-1V0h-21v-8h5v-12h3Z" fill="#89552f" />
        <path d="M-19-33h12v20h-3v10h-14v-6h5Z" fill="#d69a5b" />
        <path d="M-23-11h14v7h3V0h-23v-7h6Z" fill="#f3e2c0" /><path d="M-26-4h4v3h-4Zm8 0h3v3h-3Z" fill="#b9a17e" />
      </g>
      <g data-runner-leg-right>
        <path d="M4-35h17v15h3v12h5V0H8v-7H7v-8H4Z" fill="#89552f" />
        <path d="M7-33h12v24h5v6H10v-10H7Z" fill="#d69a5b" />
        <path d="M9-11h14v4h6v7H6v-4h3Z" fill="#fff1d4" /><path d="M14-4h3v3h-3Zm8 0h4v3h-4Z" fill="#baa381" />
      </g>
      <g data-runner-arm-left>
        <path d="M-21-69h-9v8h-6v15h-3v14h5v6h12v-7h-4v-20h5Z" fill="#89552f" />
        <path d="M-24-66h-4v10h-5v14h-3v10h7v-8h2v-18h3Z" fill="#d69a5b" />
        <path d="M-36-35h10v5h4v5h-14v-5h-3v-5Z" fill="#f3e2c0" />
      </g>
      <g data-runner-arm-right>
        <path d="M21-69h9v8h6v15h3v14h-5v6H22v-7h4v-20h-5Z" fill="#89552f" />
        <path d="M24-66h4v10h5v14h3v10h-7v-8h-2v-18h-3Z" fill="#e5ac6d" />
        <path d="M26-35h10v5h3v5H25v-5h-3v-5Z" fill="#fff1d4" />
      </g>
      <path d="M-14-78h28v5h9v9h4v29h-4v9h-8v4h-30v-4h-8v-9h-4v-29h4v-9h9Z" fill="#89552f" />
      <path d="M-12-74h24v6h8v10h4v21h-5v9h-38v-9h-5v-21h4v-10h8Z" fill="#d69a5b" />
      <path d="M-8-69H8v9h8v22h-5v10h-22v-10h-5v-22h8Z" fill="#e5ac6d" />
      <path d="M-15-63h6v20h-3v8h-4Zm25 0h6v24h-5v-8h-1Z" fill="#b97a43" />
      <path d="M-17-38h9v5h16v-5h9v9H9v4H-9v-4h-8Z" fill="#e3cda7" />
      <g data-runner-tail><g transform="translate(0 -45) scale(.85)"><KnopikTailArtwork/></g></g>
      <g data-runner-firework opacity="0">
        <path d="M-12-83h24v32h-5v8H-7v-8h-5Z" fill="#49324b" />
        <path d="M-8-87h16v5h4v8h-24v-8h4Z" fill="#a74e64" />
        <path d="M-5-92H5v5h4v5H-9v-5h4Z" fill="#ffce7c" />
        <path d="M-8-74H8v23H-8Z" fill="#d56772" />
        <path d="M-8-68H8v5H-8Zm-7 17h7v12h-12v-6h5Zm23 0h7v6h5v6H8Z" fill="#f1ba72" />
        <path d="M-5-73h3v16h-3ZM2-59h3v5H2Z" fill="#fff1bd" />
        <path d="M-5-51H5v8H-5Z" fill="#5c526e" />
        <g data-runner-flames><path d="M-6-43H6v9h4v12H6v14H2v8h-4v-8h-4v-14h-4v-12h4Z" fill="#ffad64" /><path d="M-3-43H3v17h3v12H3v9H-3v-9h-3v-12h3Z" fill="#ffe795" /><path d="M-2-42H2v13H-2Z" fill="#fff4d9" /></g>
      </g>
      <g data-runner-head><g transform="translate(0 -7) scale(.8)"><KnopikHeadArtwork direction="back"/></g></g>
      <g data-runner-turn opacity="0"><g transform="translate(0 -7) scale(.8)"><KnopikHeadArtwork direction="front"/></g></g>
      <g data-runner-collar opacity="0"><path d="M-24-65h48v10h-48Z" fill="#71552e" /><path d="M-22-64h44v3h-44Z" fill="#ffe39a" /><path d="M-22-61h44v4h-44Z" fill="#dbad4d" /><path d="M-22-57h44v2h-44Z" fill="#af7936" /><path d="M-7-66H7v12H-7Z" fill="#71552e" /><path d="M-5-65H5v10H-5Z" fill="#f3ca6c" /><path d="M-3-62H3v5H-3Z" fill="#9c6a2e" /><path d="M0-64h2v9H0Z" fill="#fff1bf" /></g>
    </g>
    <g data-runner-roll opacity="0">
      <path d="M-12-48h24v4h10v7h5v23h-5v8H12v5h-24v-5h-10v-8h-5v-23h5v-7h10Z" fill="#89552f" />
      <path d="M-10-45h20v4h9v8h5v17h-5v7h-9v5h-20v-5h-9v-7h-5v-17h5v-8h9Z" fill="#d69a5b" />
      <path d="M-14-38h9v-4H9v5h8v10h-6v-8H-2v5h-9v13h9v6h17v4H-6v-5h-8v-8h-5v-11h5Z" fill="#f3e2c0" />
      <path d="M-3-29h13v5h-4v8H-6v-6h3Z" fill="#89552f" /><path d="M3-27h5v4H3Zm-7 7h7v4h-7Z" fill="#fff1d1" />
      <path d="M15-40h5v7h-5ZM-20-18h5v8h-5Z" fill="#efbd80" />
    </g>
  </g>;
}

export const RunnerScene = memo(function RunnerScene({ sceneRef, prefix }: { sceneRef: RefObject<SVGSVGElement | null>; prefix: string }) {
  return <svg ref={sceneRef} className="runner-scene pixel-art" viewBox="0 0 360 680" preserveAspectRatio="xMidYMid meet" shapeRendering="crispEdges" aria-hidden="true">
    <defs>
      <RunnerCitySprites prefix={prefix}/>
      <RunnerBarrierSprites prefix={prefix}/>
      <RunnerBiomeSprites prefix={prefix}/>
      <g id={`${prefix}-coin`}><path d="M-6-22H6v3h5v14H6v3H-6v-3h-5v-14h5Z" fill="#946044" /><path d="M-5-23H5v3h5v12H5v3H-5v-3h-5v-12h5Z" fill="#ffdb73" /><path d="M-3-20H4v2h3v8H4v2h-8v-3h-2v-7h3Z" fill="#e9a641" /><path d="M-3-18h2v4l4-4h3l-5 5 5 5H3l-4-4v4h-2Z" fill="#fff4ca" /></g>
      <g id={`${prefix}-house`}>
        <path d="M-38-5h74v7h-74Z" fill="#26294166" />
        <path d="M-31-120h50v8h11v107h-61Z" fill="var(--run-wall, #cf856b)" /><path d="M19-112h16V0H19Z" fill="var(--run-wall-dark, #8f5e68)" />
        <path d="M-35-120h55v-5h-5v-5h-39v5h-11Z" fill="#745268" /><path d="M20-125h7v5h12v9H20Z" fill="#493e55" />
        <path d="M-34-109h56v4h-56ZM-34-66h56v4h-56Z" fill="#f4c7a0" />
        {[-22, 2].map(x => <g key={x}>{[-98,-54].map(y => <g key={y}><path d={`M${x} ${y}h13v24h-13Z`} fill="#453a54" /><path d={`M${x+3} ${y+3}h7v17h-7Z`} fill="var(--run-window, #ffd289)" /><path d={`M${x+3} ${y+11}h7v3h-7Z`} fill="#916579" /></g>)}</g>)}
        <path d="M-14-28H4V0h-18Z" fill="#483f56" /><path d="M-11-24H1v24h-12Z" fill="#765267" /><path d="M-2-13h2v3h-2Z" fill="#ffdb73" />
        <path d="M-37-7h61v4h-61ZM-39-3h63v5h-63Z" fill="#d9b099" />
        <path d="M-26-102h35v3h-35Zm49 5h8v5h-8Zm0 20h8v5h-8Zm0 20h8v5h-8Z" fill="#855969" />
      </g>
      <g id={`${prefix}-building`}>
        <use href={`#${prefix}-house`} transform="scale(1.65 1.9)" />
        <path d="M-53-175h88v9h-88Z" fill="#413b57" /><path d="M-49-174h80v4h-80Z" fill="#e8ab7e" />
        <path d="M-52-113h88v8h-88Z" fill="#674963" /><path d="M-47-111h76v3h-76Z" fill="#f6d29a" />
        <path d="M-51-12h87v8h-87Z" fill="#e8b68a" />
        <path d="M-52-169h9v50h-9Zm80 0h8v50h-8Z" fill="#755a72" />
      </g>
      <g id={`${prefix}-barrier`}><path d="M-34-5h68v7h-68Z" fill="#282b4566" /><path d="M-29-41h58v36h-58Z" fill="#744c38" /><path d="M-26-39h50v28h-50Z" fill="#d9a16a" /><path d="M-24-35h46v6h-46Zm0 12h46v6h-46Z" fill="#af7044" /><path d="M-21-38h5v27h-5Zm38 0h5v27h-5Z" fill="#f0c693" /><path d="M-30-10h60v7h-60Z" fill="#aa764e" /></g>
      <g id={`${prefix}-fence`}>
        <path d="M-45-3h90v6h-90Z" fill="#242c4155" />
        <path d="M-38-58h10V0h-10ZM28-58h10V0H28Z" fill="#634432" />
        <path d="M-36-56h6v51h-6ZM30-56h6v51h-6Z" fill="#c5925b" />
        <path d="M-44-51h88v16h-88Zm0 27h88v16h-88Z" fill="#6b4535" />
        <path d="M-42-49h84v11h-84Zm0 27h84v11h-84Z" fill="#cf9b62" />
        <path d="M-41-49h82v3h-82Zm0 27h82v3h-82Z" fill="#f0c88a" />
        <path d="M-23-43h23v2h-23Zm31 0h18v2H8Zm-26 27H8v2h-26Zm29 0h20v2H11Z" fill="#a57149" />
        <path d="M-35-46h4v4h-4Zm66 0h4v4h-4Zm-66 27h4v4h-4Zm66 0h4v4h-4Z" fill="#554553" />
        <path d="M-35-46h2v2h-2Zm66 0h2v2h-2Zm-66 27h2v2h-2Zm66 0h2v2h-2Z" fill="#e5d7b4" />
      </g>
      <g id={`${prefix}-magnet-pickup`}>
        <path d="M-22-30h44v34h-44Z" fill="#91d8d3" opacity=".12" />
        <path d="M-20-26h8v18h24v-18h8v23h-5v5h-30v-5h-5Z" fill="#3c3e55" />
        <path d="M-17-25h6v16h22v-16h6v21h-5v3h-24v-3h-5Z" fill="#e47879" />
        <path d="M-17-26h6v8h-6Zm28 0h6v8h-6Z" fill="#cfdfdf" />
        <path d="M-17-26h3v6h-3Zm28 0h3v6h-3ZM-13-5H9v3h-22Z" fill="#fff1d1" />
        <path d="M-29-15h3v6h-3Zm52 0h3v6h-3ZM-4-38H0v8h-4Zm-4 3H4v2H-8Z" fill="#91d8d3" />
      </g>
      <g id={`${prefix}-firework-pickup`}>
        <path d="M-10-36H10v5h4v10h-28v-10h4Z" fill="#51354a" />
        <path d="M-6-42H6v7h5v11h-22v-11h5Z" fill="#f8c77f" />
        <path d="M-9-23H9v24H-9Z" fill="#48364b" /><path d="M-6-22H6v20H-6Z" fill="#d87683" />
        <path d="M-6-17H6v5H-6Zm-10 15h5v9h-10V2h5Zm21 0h5v4h5v5H5Z" fill="#f0c47d" />
        <path d="M-3-22h3v8h-3Zm-1 23h2v7h-2Zm1 6h7v3h-7Zm6 2h3v6H3Z" fill="#fff1bd" />
        <path d="M3 12h4v4H3Zm-21-44h3v6h-3Zm39 9h3v6h-3Z" fill="#9bd1cd" />
      </g>
      <g id={`${prefix}-boost-pickup`}>
        <path d="M-39-3l9-24h60l9 24-7 7h-64Z" fill="#254b55" /><path d="M-35-3l8-20h54l8 20-5 4h-60Z" fill="#527f82" />
        <path d="M-24-17h8v-5h11v5h8v5h-8v4h-11v-4h-8Zm26 0h8v-5h11v5h8v5h-8v4H10v-4H2Z" fill="#a9e2c2" />
        <path d="M-32-2h64v3h-64Z" fill="#dbecd0" />
      </g>
      <g id={`${prefix}-slow-pickup`}>
        <path d="M-39-3l9-24h60l9 24-7 7h-64Z" fill="#563f49" /><path d="M-35-3l8-20h54l8 20-5 4h-60Z" fill="#a17460" />
        <path d="M-23-18h7v-4h9v19h-9v-4h-7Zm29-4h9v4h7v11h-7v4H6Z" fill="#ffe3a2" />
        <path d="M-32-2h64v3h-64Z" fill="#e8c08d" />
      </g>
      <g id={`${prefix}-arch`}><path d="M-36-106h72v7h-72Z" fill="#56495a" /><path d="M-31-98h9V0h-9ZM22-98h9V0h-9Z" fill="#986a60" /><path d="M-26-96h3V0h-3Zm49 0h3V0h-3Z" fill="#dca078" /><path d="M-38-98h76v36h-76Z" fill="#67968b" /><path d="M-38-98h76v8h-76Zm0 16h76v8h-76Z" fill="#9cc1a0" /><path d="M-38-62h76v10h-76Z" fill="#e7c18c" /><path d="M-32-57h11v6h-11Zm19 0h11v6h-11Zm19 0h11v6H6Zm19 0h11v6H25Z" fill="#a47463" /><path d="M-38-98l7-11h62l7 11Z" fill="#7daf97" /></g>
      <g id={`${prefix}-gap`}><path d="M-42-5l8-24h68l8 24-8 18h-68Z" fill="#25273d" /><path d="M-32-22h64v4h-64Zm-6 18h76v4h-76Z" fill="#403654" /><path d="M-30 6h60v4h-60Z" fill="#835663" /><path d="M-42-5h6v6h-6Zm78 0h6v6h-6Z" fill="#dcb28a" /></g>
      <g id={`${prefix}-tree`}><path d="M-5-72H5V0H-5Z" fill="#765342" /><path d="M-8-65H8v9h-16Z" fill="#a98057" /><path d="M-17-125h34v5h15v12h8v34h-8v13H17v5h-34v-5h-15v-13h-8v-34h8v-12h15Z" fill="#47756b" /><path d="M-13-124h27v8h13v12h7v21H20v7H-6v-9h-19v-20h12Z" fill="#79a685" /><path d="M-7-117h21v6H-7Zm-17 18h9v7h-9ZM7-90h15v7H7Z" fill="#a6c29a" /></g>
      <g id={`${prefix}-lamp`}><path d="M-3-114h6V0h-6Z" fill="#48435d" /><path d="M-4-117h23v6H-4Z" fill="#736276" /><path d="M9-114h17v15H9Z" fill="#ffe5a1" /><path d="M8-118h20v5H8Zm1 18h18v4H9Z" fill="#524559" /><path d="M-8-5H8v5H-8Z" fill="#a18f89" /></g>
      <g id={`${prefix}-stall`}><path d="M-30-75h60v5h7v14h-74v-14h7Z" fill="#d59173" /><path d="M-24-74h10v18h-10Zm20 0H6v18H-4Zm20 0h10v18H16Z" fill="#f7d499" /><path d="M-31-55h6V0h-6ZM25-55h6V0h-6Z" fill="#805844" /><path d="M-34-30h68v26h-68Z" fill="#9d7655" /><path d="M-30-27h60v8h-60Z" fill="#dec191" /><path d="M-23-36h10v7h-10Zm18 0H5v7H-5Zm19 0h10v7H14Z" fill="#a5c491" /><path d="M-20-38h5v3h-5ZM0-38h4v3H0Zm17 0h4v3h-4Z" fill="#e2e2a3" /></g>
      {[0,1,2,3].map(i => <g id={`${prefix}-sahur-${i}`} key={i}><Sahur stride={i % 2} strike={i >= 2} /></g>)}
      {[0, 1].map(frame => <g key={frame} id={`${prefix}-sahur-back-${frame}`}><SahurBack stride={frame} /></g>)}
      <g id={`${prefix}-sahur-back-jump`}><SahurBack jumping /></g>
      <g id={`${prefix}-sahur-roll`}><SahurBack tucked /></g>
      <g id={`${prefix}-cargo`}><MarketCargo /></g>
      {[0, 1].map(frame => <g key={`cat-${frame}`} id={`${prefix}-cat-${frame}`}>
        <path d="M-15-12h5v-5h3v6h13v-5h3v8h5v6H8v3H-5v-3h-8Z" fill="#38414c" />
        <path d="M-11-10h16v-3h2v9H2v3H-7v-3h-4Z" fill="#a18d79" />
        <path d={frame ? "M-9-2h3v6h-7V1h4Zm11 0h3v4h4v3H2Z" : "M-9-2h3v4h-7v3h4Zm11 0h3v7H1V2h1Z"} fill="#ddcdb0" />
        <path d="M-14-8h-4v-5h-3v-3h3v2h3v4h3Z" fill="#a18d79" />
        <path d="M6-8h2v2H6Zm4 0h2v2h-2Z" fill="#dce99b" />
      </g>)}
    </defs>
    <rect width="360" height="1000" fill="var(--run-sky, #8ebfc4)" />
    <g data-runner-sunset opacity="0">{['#e9a178','#efa87a','#f3b782','#f7c68e'].map((color,i)=><rect key={color} x="0" y={i*22} width="360" height="23" fill={color} />)}</g>
    <g data-runner-stars opacity="0" fill="#e2dfc6">{Array.from({length:34},(_,i)=><rect key={i} x={i*83%352} y={10+i*31%150} width={i%4?1:2} height={i%4?1:2} />)}</g>
    <g data-runner-clouds fill="var(--run-cloud, #e5d3bc)"><path d="M10 74h14v-7h31v7h14v8H10ZM216 100h14v-8h32v-7h28v7h16v12h-90Z" /><path d="M112 46h21v-6h33v6h20v7h-74Z" opacity=".65" /></g>
    <path data-runner-sun d="M278 37h25v5h8v25h-8v5h-25v-5h-8V42h8Z" fill="var(--run-sun, #ffddb0)" />
    <path data-runner-moon d="M285 37h13v4h-9v7h-4v14h4v7h9v4h-13v-4h-7v-7h-4V48h4v-7h7Z" fill="#e4e5c9" opacity="0" />
    <g data-runner-bird opacity="0" fill="#394557"><path d="M-12 0h7v3h10V0h7v3H7v3H-7V3h-5Z" /><path d="M17 5h5v2h8V5h5v2h-4v3h-10V7h-4Z" opacity=".7" /></g>
    <g data-runner-skyline>
      <path d="M0 0v-58h18v-8h28v8h16v21h13v-47h16v-10h21v10h17v56h15v-24h20v-10h26v10h16v32h15v-58h13v-9h23v9h20v43h16v-30h16v-10h24v10h16V0Z" fill="var(--run-distant, #9c8b9c)" />
      <path d="M0 0v-23h24v-8h19v8h24v14h13v-38h35v12h13v25h28v-21h27v-10h19v31h37v-33h17v-12h32v36h21v-20h34v-8h23v12h16V0Z" fill="var(--run-mid, #797988)" />
      {Array.from({ length: 30 }, (_, i) => <rect key={i} x={i * 13 % 360} y={-12 - i % 3 * 10} width="3" height="5" fill="var(--run-window, #ffda9b)" opacity=".65" />)}
    </g>
    <g data-runner-flyby opacity="0"><g transform="translate(32 -32) scale(-1 1)"><BrainrotCharacter kind="bombardiro" /></g><g fill="#e3dfc5" opacity=".5">{Array.from({length:6},(_,i)=><rect key={i} x={-43-i*9} y={-4+i%2*3} width={5+i} height={3+i%2} />)}</g></g>
    <g data-runner-world>
      <path data-runner-ground fill="var(--run-ground, #9ba391)" />
      <g data-runner-roof-walls>{Array.from({ length: 80 }, (_, i) => <g key={i}><path fill="#795d62" /><path fill="#a18171" /></g>)}</g>
      <path data-runner-sidewalk fill="var(--run-sidewalk, #dbb48c)" />
      <g data-runner-sidewalk-tiles>{Array.from({ length: 80 }, (_, i) => <g key={i}><path /><path /></g>)}</g>
      <path data-runner-road fill="var(--run-road, #5d6075)" />
      <g data-runner-road-tiles>{Array.from({ length: 80 }, (_, i) => <path key={i} fill={i % 2 ? "var(--run-road-light, #65697a)" : "var(--run-road, #5d6075)"} />)}</g>
      <g data-runner-road-details>{Array.from({length:48},(_,i)=><path key={i} opacity=".6" />)}</g>
      <g data-runner-markings fill="var(--run-stripe, #e5c9a1)">{Array.from({ length: 200 }, (_, i) => <path key={i} />)}</g>
      <g data-runner-crossings />
      <g data-runner-far-buildings />
      <g data-runner-traffic />
      <g data-runner-obstacles />
      <g data-runner-tunnel />
      <g data-runner-far-objects>{Array.from({ length: 384 }, (_, i) => <g data-runner-slot="far" key={i} visibility="hidden"><use /></g>)}</g>
      <StreetStartBack />
      <g data-runner-player><RunnerDog /></g>
      <g data-runner-near-buildings />
      <g data-runner-near-objects>{Array.from({ length: 48 }, (_, i) => <g data-runner-slot="near" key={i} visibility="hidden"><use /></g>)}</g>
      <g data-runner-depth-objects />
      <g data-runner-chaser><use href={`#${prefix}-sahur-0`} /></g>
      <g data-runner-particles>{Array.from({ length: 72 }, (_, i) => <g key={i} visibility="hidden"><rect x="-2" y="-2" width="4" height="4" /><use href={`#${prefix}-coin`} display="none" /></g>)}</g>
      <g data-runner-speed-lines fill="#e9d5b2">{Array.from({ length: 16 }, (_, i) => <path key={i} opacity="0" />)}</g>
    </g>
    <StreetStartFront />
    <g data-runner-rain opacity="0" stroke="#c7e0e5" strokeWidth="1.5">{Array.from({length:84},(_,i)=><path key={i} />)}</g>
    <rect data-runner-night-shade width="360" height="1000" fill="#1f3055" opacity="0" pointerEvents="none" />
    <g data-runner-splashes opacity="0" fill="#b3d7df">{Array.from({length:12},(_,i)=><path key={i} />)}</g>
    <path data-runner-lightning fill="#f4e8bf" opacity="0" d="M226 0h12l-15 25h10l-27 42 10-30h-9Z" />
    <rect data-runner-flash width="360" height="1000" fill="#ff9879" opacity="0" />
  </svg>;
});
