import { memo, type RefObject } from "react";
import { PixelDog } from "./pixel-artwork";
import { MarketCargo, SahurBack } from "./runner-characters";
import { BalconyBack, BalconyFront } from "./runner-balcony";

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

function RunnerDog() {
  return <g>
    <path data-runner-shadow d="M-27-3h54v3h9v5h-9v3h-54V5h-9V0h9Z" fill="#292c4566" />
    <path data-runner-magnet d="M-39-5h78v3h12v5H39v3h-78V3h-12v-5h12Z" fill="none" stroke="#83c8ba" strokeWidth="3" opacity="0" />
    <path data-runner-shield d="M-19-140h38v6h16v12h12v86H35v16H19v8h-38v-8h-16v-16h-12v-86h12v-12h16Z" fill="#a3edce15" stroke="#b7f5cd" strokeWidth="3" opacity="0" />
    <g data-runner-pose>
      <g data-runner-leg-left><path d="M-22-30h17v19h-3V0h-20v-8h6Z" fill="#af6a37" /><path d="M-24-9h16v9h-20v-6h4Z" fill="#f8e7bf" /><path d="M-25-4h4v4h-4Zm7 0h3v4h-3Z" fill="#a77d59" /></g>
      <g data-runner-leg-right><path d="M5-30h17v22h6v8H8v-11H5Z" fill="#b7753c" /><path d="M8-9h16v3h4v6H8Z" fill="#fff0d0" /><path d="M14-4h3v4h-3Zm7 0h4v4h-4Z" fill="#a77d59" /></g>
      <g data-runner-arm-left><path d="M-20-66h-9v9h-7v25h6v8h9v-8h-4v-20h5Z" fill="#ce914e" /><path d="M-36-37h11v8h-4v5h-5v-5h-2Z" fill="#f7e5bf" /></g>
      <g data-runner-arm-right><path d="M20-66h9v9h7v25h-6v8h-9v-8h4v-20h-5Z" fill="#d69c5c" /><path d="M25-37h11v8h-2v5h-5v-5h-4Z" fill="#fff0d0" /></g>
      <path d="M-18-73h36v7h7v28h-5v12h-40v-12h-5v-28h7Z" fill="#bd7c3f" />
      <path d="M-14-70h28v8h6v21h-5v12h-30v-12h-5v-21h6Z" fill="#e0a260" />
      <path d="M-9-61h18v5h5v20h-5v7H-9v-7h-5v-20h5Z" fill="#eaba7a" />
      <path d="M-13-61h5v11h-5Zm21 0h5v11H8ZM-8-36H8v4H-8Z" fill="#c78a49" />
      <g data-runner-tail><path d="M-9-40h20v-6h8v-15h-7v-6H-4v5h-7v11h5v6h12v-5H0v-9h9v8h-5v4H-9Z" fill="#ae713c" /><path d="M-8-43h17v-6h7v-10h-6v-5H-2v5h-6v7h6v4h7v-4H0v-6h8v7H4v5H-8Z" fill="#fff1cf" /><path d="M-8-43h9v5h-9Z" fill="#eed5ac" /></g>
      <g data-runner-head>
        <path d="M-30-93v-32h4v-5h6v5h6v8h5v24ZM30-93v-32h-4v-5h-6v5h-6v8h-5v24Z" fill="#a56837" />
        <path d="M-26-100v-23h5v8h7v10h3v5ZM26-100v-23h-5v8h-7v10h-3v5Z" fill="#ebba7c" />
        <path d="M-21-93h42v4h9v10h4v23h-4v10h-9v4h-42v-4h-9v-10h-4v-23h4v-10h9Z" fill="#b77b40" transform="translate(0 -17)" />
        <path d="M-19-90h38v4h9v12h3v17h-5v9h-7v4h-38v-4h-7v-9h-5v-17h3v-12h9Z" fill="#e3a868" transform="translate(0 -17)" />
        <path d="M-13-104h26v4h10v6H10v-3h-20v3h-13v-6h10Z" fill="#efbc7d" />
        <path d="M-30-86h8v8h9v5h26v-5h9v-8h8v12h-8v6h-44v-6h-8Z" fill="#f5dfb8" />
        <path d="M-22-95h6v3h-6Zm38 0h6v3h-6ZM-8-108H8v3H-8Z" fill="#d49652" />
      </g>
      <svg data-runner-turn x="-34" y="-131" width="68" height="68" viewBox="0 0 128 128" opacity="0"><PixelDog ears mood="warning" /></svg>
      <path data-runner-collar d="M-25-65h50v8h-50Zm-5 1h5v6h-5Zm55 0h5v6h-5Z" fill="#4f625b" opacity="0" />
    </g>
    <g data-runner-roll opacity="0">
      <path d="M-12-48h24v4h10v7h5v23h-5v8H12v5h-24v-5h-10v-8h-5v-23h5v-7h10Z" fill="#b7763f" />
      <path d="M-10-45h20v4h9v8h5v17h-5v7h-9v5h-20v-5h-9v-7h-5v-17h5v-8h9Z" fill="#e5a664" />
      <path d="M-14-38h9v-4H9v5h8v10h-6v-8H-2v5h-9v13h9v6h17v4H-6v-5h-8v-8h-5v-11h5Z" fill="#f7e6bd" />
      <path d="M-3-29h13v5h-4v8H-6v-6h3Z" fill="#b7763f" /><path d="M3-27h5v4H3Zm-7 7h7v4h-7Z" fill="#fff1d1" />
      <path d="M15-40h5v7h-5ZM-20-18h5v8h-5Z" fill="#edbe7f" />
    </g>
  </g>;
}

export const RunnerScene = memo(function RunnerScene({ sceneRef, prefix }: { sceneRef: RefObject<SVGSVGElement | null>; prefix: string }) {
  return <svg ref={sceneRef} className="runner-scene pixel-art" viewBox="0 0 360 680" preserveAspectRatio="xMidYMid meet" shapeRendering="crispEdges" aria-hidden="true">
    <defs>
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
      <g id={`${prefix}-arch`}><path d="M-36-106h72v7h-72Z" fill="#56495a" /><path d="M-31-98h9V0h-9ZM22-98h9V0h-9Z" fill="#986a60" /><path d="M-26-96h3V0h-3Zm49 0h3V0h-3Z" fill="#dca078" /><path d="M-38-98h76v36h-76Z" fill="#67968b" /><path d="M-38-98h76v8h-76Zm0 16h76v8h-76Z" fill="#9cc1a0" /><path d="M-38-62h76v10h-76Z" fill="#e7c18c" /><path d="M-32-57h11v6h-11Zm19 0h11v6h-11Zm19 0h11v6H6Zm19 0h11v6H25Z" fill="#a47463" /><path d="M-38-98l7-11h62l7 11Z" fill="#7daf97" /></g>
      <g id={`${prefix}-gap`}><path d="M-42-5l8-24h68l8 24-8 18h-68Z" fill="#25273d" /><path d="M-32-22h64v4h-64Zm-6 18h76v4h-76Z" fill="#403654" /><path d="M-30 6h60v4h-60Z" fill="#835663" /><path d="M-42-5h6v6h-6Zm78 0h6v6h-6Z" fill="#dcb28a" /></g>
      <g id={`${prefix}-tree`}><path d="M-5-72H5V0H-5Z" fill="#765342" /><path d="M-8-65H8v9h-16Z" fill="#a98057" /><path d="M-17-125h34v5h15v12h8v34h-8v13H17v5h-34v-5h-15v-13h-8v-34h8v-12h15Z" fill="#47756b" /><path d="M-13-124h27v8h13v12h7v21H20v7H-6v-9h-19v-20h12Z" fill="#79a685" /><path d="M-7-117h21v6H-7Zm-17 18h9v7h-9ZM7-90h15v7H7Z" fill="#a6c29a" /></g>
      <g id={`${prefix}-lamp`}><path d="M-3-114h6V0h-6Z" fill="#48435d" /><path d="M-4-117h23v6H-4Z" fill="#736276" /><path d="M9-114h17v15H9Z" fill="#ffe5a1" /><path d="M8-118h20v5H8Zm1 18h18v4H9Z" fill="#524559" /><path d="M-8-5H8v5H-8Z" fill="#a18f89" /></g>
      <g id={`${prefix}-stall`}><path d="M-30-75h60v5h7v14h-74v-14h7Z" fill="#d59173" /><path d="M-24-74h10v18h-10Zm20 0H6v18H-4Zm20 0h10v18H16Z" fill="#f7d499" /><path d="M-31-55h6V0h-6ZM25-55h6V0h-6Z" fill="#805844" /><path d="M-34-30h68v26h-68Z" fill="#9d7655" /><path d="M-30-27h60v8h-60Z" fill="#dec191" /><path d="M-23-36h10v7h-10Zm18 0H5v7H-5Zm19 0h10v7H14Z" fill="#a5c491" /><path d="M-20-38h5v3h-5ZM0-38h4v3H0Zm17 0h4v3h-4Z" fill="#e2e2a3" /></g>
      {[0,1,2,3].map(i => <g id={`${prefix}-sahur-${i}`} key={i}><Sahur stride={i % 2} strike={i >= 2} /></g>)}
      {[0, 1].map(frame => <g key={frame} id={`${prefix}-sahur-back-${frame}`}><SahurBack stride={frame} /></g>)}
      <g id={`${prefix}-sahur-roll`}><SahurBack tucked /></g>
      <g id={`${prefix}-cargo`}><MarketCargo /></g>
    </defs>
    <rect width="360" height="1000" fill="var(--run-sky, #8ebfc4)" />
    <g data-runner-clouds fill="var(--run-cloud, #e5d3bc)"><path d="M10 74h14v-7h31v7h14v8H10ZM216 100h14v-8h32v-7h28v7h16v12h-90Z" /><path d="M112 46h21v-6h33v6h20v7h-74Z" opacity=".65" /></g>
    <path d="M278 37h25v5h8v25h-8v5h-25v-5h-8V42h8Z" fill="var(--run-sun, #ffddb0)" />
    <g data-runner-skyline>
      <path d="M0 0v-58h18v-8h28v8h16v21h13v-47h16v-10h21v10h17v56h15v-24h20v-10h26v10h16v32h15v-58h13v-9h23v9h20v43h16v-30h16v-10h24v10h16V0Z" fill="var(--run-distant, #9c8b9c)" />
      <path d="M0 0v-23h24v-8h19v8h24v14h13v-38h35v12h13v25h28v-21h27v-10h19v31h37v-33h17v-12h32v36h21v-20h34v-8h23v12h16V0Z" fill="var(--run-mid, #797988)" />
      {Array.from({ length: 30 }, (_, i) => <rect key={i} x={i * 13 % 360} y={-12 - i % 3 * 10} width="3" height="5" fill="var(--run-window, #ffda9b)" opacity=".65" />)}
    </g>
    <g data-runner-world>
      <path data-runner-ground fill="var(--run-ground, #9ba391)" />
      <g data-runner-roof-walls>{Array.from({ length: 20 }, (_, i) => <g key={i}><path fill="#795d62" /><path fill="#a18171" /></g>)}</g>
      <path data-runner-sidewalk fill="var(--run-sidewalk, #dbb48c)" />
      <path data-runner-road fill="var(--run-road, #5d6075)" />
      <g data-runner-road-tiles>{Array.from({ length: 20 }, (_, i) => <path key={i} fill={i % 2 ? "var(--run-road-light, #65697a)" : "var(--run-road, #5d6075)"} />)}</g>
      <g data-runner-markings fill="var(--run-stripe, #e5c9a1)">{Array.from({ length: 48 }, (_, i) => <path key={i} />)}</g>
      <g data-runner-far-buildings />
      <g data-runner-far-objects>{Array.from({ length: 112 }, (_, i) => <g key={i} visibility="hidden"><use /></g>)}</g>
      <BalconyBack />
      <g data-runner-player><RunnerDog /></g>
      <g data-runner-near-buildings />
      <g data-runner-near-objects>{Array.from({ length: 32 }, (_, i) => <g key={i} visibility="hidden"><use /></g>)}</g>
      <g data-runner-chaser><use href={`#${prefix}-sahur-0`} /></g>
      <g data-runner-particles>{Array.from({ length: 72 }, (_, i) => <g key={i} visibility="hidden"><rect x="-2" y="-2" width="4" height="4" /><use href={`#${prefix}-coin`} display="none" /></g>)}</g>
      <g data-runner-speed-lines fill="#e9d5b2">{Array.from({ length: 16 }, (_, i) => <path key={i} opacity="0" />)}</g>
    </g>
    <BalconyFront />
    <rect data-runner-flash width="360" height="1000" fill="#ff9879" opacity="0" />
  </svg>;
});
