import { memo } from "react";
import type { ThemeId, ThemeMood } from "./cosmetic-engine";

export type PotionKind = "food" | "zhivchik" | "pitbull" | "cocoa" | "bergamot" | "pepsi" | "lime" | "matcha";
const INK = "#343041";

function PixelDogDrawing({ mood = "calm", joy = 0, rage = 0, ears = false, boosted = false, laserEyes = false, className = "" }: { mood?: string; joy?: number; rage?: number; ears?: boolean; boosted?: boolean; laserEyes?: boolean; className?: string }) {
  const angry = mood === "rage" || rage > 0 || laserEyes;
  const tired = mood === "warning";
  const happy = !angry && !tired && joy >= 2;
  return <svg className={`pixel-art pixel-dog ${boosted ? "is-boosted" : ""} ${laserEyes ? "is-laser-eyed" : ""} ${className}`} viewBox="0 0 128 128" shapeRendering="crispEdges" aria-hidden="true">
    {ears && <g><path d="M14 46V8h2V4h5v2h4v4h5v5h5v7h5v8h4v15ZM114 46V8h-2V4h-5v2h-4v4h-5v5h-5v7h-5v8h-4v15Z" fill="#a86739" /><path d="M18 34V10h3v5h5v6h5v7h6v9ZM110 34V10h-3v5h-5v6h-5v7h-6v9Z" fill="#e5b076" /><path d="M21 20v19h15v-5h-5v-6h-5v-8ZM107 20v19H92v-5h5v-6h5v-8Z" fill="#775442" /></g>}
    <path d="M44 18h40v2h13v4h9v7h6v13h4v19h3v31h-3v14h-5v8h-8v5H25v-5h-8v-8h-5V94H9V63h3V44h4V31h6v-7h9v-4h13Z" fill="#b97a43" />
    <path d="M43 21h42v2h12v5h8v8h5v14h3v19h3v24h-3v13h-5v8h-9v5H29v-5h-9v-8h-5V93h-3V69h3V50h3V36h5v-8h8v-5h12Z" fill="#d69a5b" />
    <path d="M43 24h42v3h12v7h7v13h4v14h-9v8H29v-8h-9V47h4V34h7v-7h12Z" fill="#e5ac6d" />
    <path d="M48 24h31v3h14v4h7v5h-9v-3H38v3h-9v-5h8v-4h11Z" fill="#efbd80" />
    <path d="M45 34h36v4h9v5H79v7H49v-7H38v-5h7Z" fill="#d0904c" />
    <path d="M51 38h26v7h-3v8H54v-8h-3Z" fill="#bf7b3e" />
    <path d="M58 27h12v3H58Zm-13 3h8v2h-8Zm30 0h8v2h-8Z" fill="#e7af70" />
    {[false, true].map(right => <g key={String(right)} transform={right ? "translate(128 0) scale(-1 1)" : undefined}>
      <path d="M22 44h10v3h9v5h8v4h-4v10h-9v5H25v-8h-5V52h2Z" fill="#dfa268" />
      <path d="M38 43h9v4h6v9h-3v7h-6v-5h-6v-6h-7v-4h7Z" fill="#f4d1a0" />
      <path d="M42 43h6v5h4v6h-5v-3h-5Z" fill="#fff0d2" />
      <path d="M16 74h9v-5h9v-3h7v3h8v6h8v12h-5v12h-8v13H29v-6h-8V95h-5Z" fill="#f3e2c0" />
      <path d="M23 80h8v-5h8v-5h5v4h8v12h-6v13h-8v8H27v-8h-5V87h1Z" fill="#fff1d4" />
      <path d="M16 84h4v9h3v9h5v7h9v4h-8v-4h-8v-9h-5Z" fill="#e3cda7" />
      <path d="M27 75h5v-3h5v3h-3v3h-7ZM20 87h3v5h-3ZM31 102h7v3h-7Z" fill="#e9d3ac" />
      <path d="M51 78h5v-7h4v-8h4v25H51Z" fill="#e5ad73" />
      <path d="M49 84h5v-4h6v-3h4v20H47Z" fill="#f1d6aa" />
      <path d="M34 54h4v-3h9v2h4v3h3v7h-3v4h-4v2H36v-3h-4v-8h2Z" fill="#a6754b" />
      {laserEyes ? <><path d="M33 53h5v2h5v2h6v2h4v3H39v-2h-6Z" fill="#42352e" /><path d="M35 60h15v7H35Z" fill="#612633" /><g className="pixel-laser-iris"><path d="M37 61h12v5H37Z" fill="#ed334e" /><path d="M40 62h7v4h-7Z" fill="#ff8290" /><rect x="42" y="63" width="3" height="2" fill="#fff2df" /></g></>
      : angry ? <><path d="M33 53h5v2h5v2h6v2h4v3H39v-2h-6Z" fill="#42352e" /><path d="M36 61h13v6H36Z" fill="#342b28" /><rect x="41" y="62" width="5" height="3" fill={boosted ? "#b4ed66" : "#825030"} /></>
      : tired ? <><path d="M33 58h6v2h11v-2h3v5h-5v2H37v-2h-4Z" fill="#48372d" /><rect x="40" y="63" width="6" height="2" fill={boosted ? "#94dc54" : "#96673f"} /></>
      : <><path d="M35 56h4v-2h8v2h4v4h2v4h-3v3H36v-3h-3v-5h2Z" fill="#342923" /><path d="M39 56h8v3h3v5h-3v2h-9v-3h-2v-5h3Z" fill={boosted ? "#559936" : "#734624"} /><path d="M42 57h5v3h2v3h-3v2h-5v-3h-2v-3h3Z" fill={boosted ? "#b4ed66" : "#986134"} /><rect x={boosted ? 44 : 42} y={boosted ? 58 : 57} width={boosted ? 3 : 6} height={boosted ? 5 : 7} fill="#241f21" /><path d="M40 55h5v3h-5Zm-1 3h3v2h-3Z" fill="#e9f1e8" /><rect x="48" y="63" width="2" height="2" fill={boosted ? "#dcffa6" : "#b38a5b"} /></>}
      <path d="M32 70h4v2h10v-2h3v3H35v-1h-3Z" fill="#cd9e69" />
      <path d="M42 94h2v1h-2Zm-6 3h3v1h-3Zm7 3h2v1h-2Z" fill="#ad9476" />
      <path d="M34 96H22v1h12ZM33 101H20v1h13Z" fill="#a79275" />
    </g>)}
    <path d="M52 83h24v3h5v4h2v10h-4v5H49v-5h-4V90h2v-4h5Z" fill="#eee1c7" />
    <path d="M56 84h16v2h4v3h2v7h-2v4h-4v2H56v-2h-4v-4h-2v-7h2v-3h4Z" fill="#312b27" />
    <path d="M57 86h14v2h4v4H53v-4h4Z" fill="#453c34" /><path d="M59 86h10v2H59Zm-5 3h4v1h-4Zm17 0h3v1h-3Z" fill="#72675a" />
    <path d="M53 94h6v2h-2v3h-4Zm16 0h6v5h-4v-3h-2Z" fill="#1e1d1e" /><path d="M63 97h2v10h-2Z" fill="#211f20" />
    <path d="M43 106h13v2h16v-2h13v7h-8v5H51v-5h-8Z" fill="#dcc9a7" />
    {happy ? <g><path d="M45 104h5v3h28v-3h5v9h-6v5H51v-5h-6Z" fill="#3d302c" /><path d={joy > 3 ? "M56 110h16v14h-3v3H59v-3h-3Z" : "M56 110h16v10H56Z"} fill="#d98987" /><path d="M63 112h2v9h-2Z" fill="#b05f64" /></g>
      : angry && !laserEyes ? <g><path d="M43 104h42v11H43Z" fill="#46312c" /><path d="M47 104h6v5h-6Zm28 0h6v5h-6Zm-19 8h16v3H56Z" fill="#fff1d4" /></g>
      : <><path d="M63 104h2v3h14v-2h3v4H46v-4h3v2h14Z" fill="#514238" /><path d="M52 111h24v3H52Z" fill="#f8ecd4" /></>}
    <path d="M34 117h19v3h22v-3h19v7h-8v4H42v-4h-8Z" fill="#f4e5c7" />
  </svg>;
}

function PixelEarDrawing({ side }: { side: "left" | "right" }) {
  return <svg className={`dog-ear dog-ear-${side} pixel-art`} viewBox="0 0 44 52" shapeRendering="crispEdges" aria-hidden="true"><g transform={side === "right" ? "translate(44 0) scale(-1 1)" : undefined}>
    <path d="M5 50V15h2V8h2V4h6v2h4v4h5v6h5v8h5v8h5v9h3v9Z" fill="#a36d40" />
    <path d="M8 47V16h2V9h4v2h4v4h5v7h5v8h5v8h4v9Z" fill="#d69a5b" />
    <path d="M11 13h4v5h4v6h4v7h5v7h6v6H11Z" fill="#f1cc98" />
    <path d="M13 21h3v5h4v7h5v7h5v6H12V27h1Z" fill="#80604a" />
    <path d="M15 29h2v7h4v6h6v4H14V36h1Z" fill="#5d493d" />
    <path d="M11 31h3v5h-3Zm6 7h3v4h-3Zm6 6h4v3h-4Z" fill="#dbc196" />
    <path d="M9 18h2v8H9Zm1-8h3v4h-3Zm20 25h2v7h-2ZM9 46h25v3H9Z" fill="#e5ac6d" />
  </g></svg>;
}

function PixelClothingDrawing({ kind, className = "" }: { kind: "bandana" | "charm" | "hat" | "mohawk"; className?: string }) {
  const tall = kind === "mohawk";
  const viewBox = tall ? "0 0 32 48" : kind === "bandana" ? "0 0 128 48" : kind === "charm" ? "0 0 128 40" : "0 0 64 24";
  return <svg className={`pixel-art ${className}`} viewBox={viewBox} shapeRendering="crispEdges" aria-hidden="true">
    {kind === "bandana" ? <>
      <path d="M8 2h14v3h84V2h14v12h-10v5H98v5H86v6H76v8h-8v8H58v-8h-8v-8H40v-6H28v-5H18v-5H8Z" fill="#26374e" />
      <path d="M12 5h10v3h84V5h10v6h-8v5H96v5H84v6H74v8h-8v7h-6v-7h-8v-8H42v-6H30v-5H20v-5h-8Z" fill="#4976a4" />
      <path d="M22 8h84v3H96v4H32v-3H22Z" fill="#81a1bc" />
      <path d="M32 16h64v3H86v4H42v-4H32Z" fill="#5d89ae" />
      <path d="M52 25h24v3H66v11h-6v-5h-5Z" fill="#32567f" />
      <path d="M17 10h6v5h9v4h9v5h10v6h8v7h5v4h-3v-2h-4v-6h-8v-6H39v-5H29v-5h-8v-4h-4Zm89 0h6v3h-5v5h-9v4h-9v5h-3v-8h9v-5h11Z" fill="#b3c4c7" />
      <path d="M61 17h6v4h4v5h-4v4h-6v-4h-4v-5h4Z" fill="#f3d18b" />
      <path d="M63 20h2v7h-2ZM38 12h3v2h-3Zm11 0h3v2h-3Zm31 0h3v2h-3Zm11 0h3v2h-3Z" fill="#fff1d1" />
      <path d="M5 1h10v4h5v8h-5v4H5v-4H1V5h4ZM5 17h11v4h5v10h-6v-4h-5v-3H5Z" fill="#26374e" />
      <path d="M6 4h8v3h3v4h-3v3H6v-3H4V7h2ZM8 18h6v4h4v6h-2v-4h-5v-3H8Z" fill="#6a92b2" />
      <path d="M6 5h5v2H6Zm1 3h4v3H7Z" fill="#a3bbca" />
    </> : kind === "charm" ? <>
      <path d="M4 2h14v4h18v3h56V6h18V2h14v16h-14v4H92v3H36v-3H18v-4H4Z" fill="#3f2e2b" />
      <path d="M8 5h10v4h18v3h56V9h18V5h10v10h-12v4H92v3H36v-3H20v-4H8Z" fill="#805038" />
      <path d="M8 5h10v4h18v3h56V9h18V5h10v3h-10v4H92v3H36v-3H18V8H8Z" fill="#c18c5b" />
      <path d="M20 14h16v3h56v-3h16v4H92v3H36v-3H20Z" fill="#603e31" />
      <path d="M27 8h16v14H27Z" fill="#332e31" /><path d="M29 10h12v10H29Z" fill="#d6b56b" /><path d="M32 12h6v6h-6Z" fill="#805038" /><path d="M36 11h2v8h-2Z" fill="#fff1d1" />
      <path d="M48 17h3v2h-3Zm9 0h3v2h-3Zm24 0h3v2h-3Zm9-3h3v2h-3Zm19-5h3v2h-3Z" fill="#dbbc7d" />
      <path d="M62 19h4v8h-4Z" fill="#d1ad63" /><path d="M58 24h12v3h5v9h-5v4H58v-4h-5v-9h5Z" fill="#77502e" />
      <path d="M59 25h10v3h4v7h-4v3H59v-3h-4v-7h4Z" fill="#e4b657" /><path d="M59 25h10v3H59Zm-3 4h3v5h-3Z" fill="#fff0b4" />
      <path d="M61 28h2v8h-2Zm5 0h3v2h-3Zm-3 3h3v2h-3Zm3 3h3v2h-3Z" fill="#75522f" />
    </>
    : kind === "hat" ? <><path d="M8 8h8V4h32v4h8v14H8Z" fill={INK} /><path d="M10 10h8V6h28v4h8v10H10Z" fill="#3c7855" /><path d="M12 13h40v2H12ZM17 8h4v3h-4Zm13 0h4v3h-4Zm13 0h4v3h-4Z" fill="#ffd78b" /><path d="M22 15h4v3h-4Zm14 0h4v3h-4Z" fill="#f8e8b0" /></>
    : <><path d="M4 46V36h2V24h4V12h3V4h5v5h3v11h3v10h3v9h1v7Z" fill="#49352d" /><path d="M7 44V33h2V22h4V10h3V6h1v10h3v12h3v12h2v4Z" fill="#80502f" /><path d="M11 40V28h3V15h3v17h2v11h-5v-3Z" fill="#a87946" /><path d="M14 31V18h2v20h-2Zm6 0h2v11h-2ZM8 39h2v5H8Z" fill="#c69a62" /><path d="M4 44h24v2H4Zm3 2h22v2H7Z" fill="#bc864e" /></>}
  </svg>;
}

const potionColors: Record<PotionKind, [string, string]> = { food: ["#d6a769","#a67b49"], zhivchik: ["#a4c967","#6b9645"], pitbull: ["#e59555","#b9663a"], cocoa: ["#b85d65","#7c3e54"], bergamot: ["#e0cd6a","#a59044"], pepsi: ["#68b2ca","#40799e"], lime: ["#b7d76a","#789b42"], matcha: ["#82ad85","#4e7a67"] };
function PixelPotionDrawing({ kind, className = "buff-icon-image" }: { kind: PotionKind; className?: string }) {
  const [light, dark] = potionColors[kind];
  return <svg className={`pixel-art pixel-potion ${className}`} viewBox="0 0 32 40" shapeRendering="crispEdges" aria-hidden="true">
    <path d="M11 2h10v7h-2v4h6v3h3v19h-3v3H7v-3H4V16h3v-3h6V9h-2Z" fill={INK} />
    <path d="M13 4h6v5h-6Z" fill="#d0ad75" /><rect x="13" y="4" width="6" height="2" fill="#f3d9a5" />
    <path d="M15 10h2v5h8v3h1v15h-3v3H9v-3H6V18h1v-3h8Z" fill="#dae5d6" />
    <path d="M8 21h16v12h-2v1H10v-1H8Z" fill={dark} /><path d="M8 20h16v9H8Z" fill={light} />
    <path d="M8 17h3v6H8Zm0 9h2v4H8Z" fill="#fff7df" />
    <path d="M12 23h8v2h2v6h-2v2h-8v-2h-2v-6h2Z" fill="#fff1c9" />
    <g fill={dark}>
      {kind === "food" ? <><rect x="13" y="26" width="2" height="2" /><rect x="17" y="26" width="2" height="2" /><rect x="15" y="29" width="3" height="2" /></>
      : kind === "pepsi" ? <path d="M13 25h6v4h-1v2h-4v-2h-1Z" />
      : kind === "pitbull" ? <path d="M16 24h2v3h2v4h-7v-4h2v-2h1Z" />
      : kind === "cocoa" ? <path d="M13 25h7v2h-5v2h3v2h-5Z" />
      : kind === "bergamot" || kind === "matcha" ? <path d="M17 25h3v3h-3v3h-2v-4h2ZM12 27h3v2h-3Z" />
      : <path d="M13 25h6v2h1v3h-2v1h-4v-1h-2v-3h1ZM16 23h3v2h-3Z" />}
    </g>
  </svg>;
}

function PixelCoinDrawing({ className = "coin-artwork" }: { className?: string }) {
  return <svg className={`pixel-art ${className}`} viewBox="0 0 24 24" shapeRendering="crispEdges" aria-hidden="true">
    <path d="M7 1h10v2h4v4h2v10h-2v4h-4v2H7v-2H3v-4H1V7h2V3h4Z" fill="#745337" /><path d="M7 3h10v2h2v2h2v10h-2v2h-2v2H7v-2H5v-2H3V7h2V5h2Z" fill="#eab95b" /><path d="M8 4h8v2H8ZM5 7h2v8H5Z" fill="#fff0a4" /><path d="M8 7h3v4h2V9h2V7h3v3h-2v2h-2v2h2v2h2v2h-4v-3h-3v3H8Z" fill="#936439" />
  </svg>;
}

function PixelCasePartDrawing({ kind, part, className }: { kind: "common" | "big"; part: "body" | "lid"; className: string }) {
  const main = kind === "big" ? "#e6bd70" : "#7299c4", shade = kind === "big" ? "#ac7c45" : "#496486";
  return <svg className={`pixel-art ${className}`} viewBox={part === "body" ? "0 0 64 42" : "0 0 64 21"} shapeRendering="crispEdges" aria-hidden="true">
    {part === "body" ? <>
      <path d="M7 8h50v3h4v26h-3v3H6v-3H3V11h4Z" fill={INK} />
      <path d="M8 10h48v3h3v22h-3v3H8v-3H5V13h3Z" fill={main} />
      <path d="M10 11h44v4H10Z" fill="#202e3b" /><path d="M13 12h38v2H13Z" fill={kind === "big" ? "#a77942" : "#40536c"} />
      <path d="M5 16h54v3H5Z" fill={kind === "big" ? "#ffe1a1" : "#a0bed5"} />
      <path d="M5 29h54v6h-3v3H8v-3H5Z" fill={shade} />
      <path d="M11 20h42v12H11Z" fill={shade} /><path d="M13 21h38v9H13Z" fill={main} />
      <path d="M15 22h33v2H15Z" fill={kind === "big" ? "#f6d88b" : "#9eb8ce"} />
      <path d="M5 15h5v19H5Zm49 0h5v19h-5ZM8 35h48v3H8Z" fill="#c79d61" />
      <path d="M5 15h3v18H5Zm49 0h3v18h-3ZM8 35h46v1H8Z" fill="#f5d69b" />
      <path d="M27 19h10v13H27Z" fill="#4b3b31" /><path d="M28 20h8v11h-8Z" fill="#b58b4c" />
      <path d="M29 21h6v8h-6Z" fill="#ffe6a0" /><path d="M31 23h2v5h-2Z" fill={INK} />
      <path d="M6 18h2v2H6Zm49 0h2v2h-2ZM6 30h2v2H6Zm49 0h2v2h-2Zm-36 5h2v2h-2Zm26 0h2v2h-2Z" fill="#68513c" />
      <path d="M14 27h5v1h-5Zm31 0h5v1h-5Z" fill={kind === "big" ? "#c59654" : "#5e7d9f"} />
    </> : <>
      <path d="M25 0h14v2h-3V1h-8v1h-3ZM8 2h48v3h5v12H3V5h5Z" fill={INK} />
      <path d="M9 4h46v3h4v8H5V7h4Z" fill={main} />
      <path d="M10 4h44v3H10Z" fill={kind === "big" ? "#ffe3a1" : "#b0c7dd"} />
      <path d="M11 8h42v4H11Z" fill={shade} /><path d="M13 8h38v2H13Z" fill={main} />
      <path d="M5 6h5v9H5Zm49 0h5v9h-5ZM5 13h54v3H5Z" fill="#d5ad6a" />
      <path d="M5 6h2v7H5Zm49 0h2v7h-2ZM5 13h54v1H5Z" fill="#fff0b5" />
      <path d="M25 3h14v2h-3V4h-8v1h-3Z" fill="#af8551" /><path d="M27 2h10v1H27Z" fill="#f8dda1" />
      <path d="M6 8h2v2H6Zm49 0h2v2h-2Z" fill="#705239" />
      <path d="M29 14h6v5h-6Z" fill="#7f5b38" /><path d="M30 14h4v3h-4Z" fill="#efd28a" />
    </>}
  </svg>;
}

const scenePalettes = {
  calm: ["#ece3ca", "#cad7cb", "#fff5db", "#a2bbbc"],
  blue: ["#8cb7d4", "#5285b4", "#d9e8ec", "#366391"],
  yellow: ["#e4c574", "#c39e57", "#fff0b3", "#9b7948"],
  red: ["#d58972", "#ad625e", "#f8cda1", "#754b57"],
};
function Cloud({ x, y, color, shade }: { x: number; y: number; color: string; shade: string }) {
  return <g transform={`translate(${x} ${y})`}><path d="M0 12h4V8h8V4h12v4h8v4h8v12H0Z" fill={color} /><path d="M0 20h40v4H0Z" fill={shade} /><rect x="12" y="5" width="9" height="3" fill="#fff5df" /></g>;
}
function PixelSceneDrawing({ theme, mood = "calm", className = "" }: { theme: ThemeId; mood?: ThemeMood; className?: string }) {
  const [base, medium, pale, shadow] = scenePalettes[mood];
  const night = theme === "night";
  const sky = night ? ({ calm: "#282943", blue: "#293f70", yellow: "#594433", red: "#693640" }[mood]) : theme === "soda" ? ({ calm: "#c3dce7", blue: "#8ab8d6", yellow: "#e4cc8e", red: "#d6a091" }[mood]) : base;
  return <svg className={`pixel-art pixel-scene ${className}`} viewBox="0 0 160 320" preserveAspectRatio="xMidYMid slice" shapeRendering="crispEdges" aria-hidden="true">
    <rect width="160" height="320" fill={sky} />
    {theme === "mint" ? <g>
      <path d="M0 0h160v7H0ZM4 0h8v11h8v8h10v9h8v272H0V0ZM156 0h-8v11h-8v8h-10v9h-8v272h38V0Z" fill={medium} />
      <path d="M0 32h22v6h7v8h4v232H0Zm160 0h-22v6h-7v8h-4v232h33Z" fill={pale} />
      <path d="M0 54h12v5h6v9h5v112H0Zm160 0h-12v5h-6v9h-5v112h23Z" fill={shadow} />
      {Array.from({ length: 9 }, (_, i) => <g key={i} fill={medium}><rect x="3" y={72 + i * 11} width="9" height="5" /><rect x="15" y={78 + i * 11} width="5" height="5" /><rect x="148" y={72 + i * 11} width="9" height="5" /><rect x="140" y={78 + i * 11} width="5" height="5" /></g>)}
      <path d="M0 179h32v7H0Zm128 0h32v7h-32ZM0 228h36v9H0Zm124 0h36v9h-36Z" fill={medium} />
      <path d="M0 237h160v83H0Z" fill={pale} />
      {Array.from({ length: 24 }, (_, i) => <rect key={i} x={(i % 6) * 28} y={245 + Math.floor(i / 6) * 22} width="24" height="16" fill={i % 3 === 0 ? medium : base} />)}
      <g className="pixel-steam" fill={pale} opacity=".6"><path d="M2 208h4v-22h4v-18h-4v-13h-4v20h4v15H2Zm146 8h4v-16h-4v-20h4v-14h4v19h-4v21h-4Z" /></g>
    </g> : <>
      {night ? <><path d="M128 13h12v4h6v20h-6v6h-16v-4h-5v-6h11v-4h6V17h-8Z" fill="#f4d889" />{[[15,19],[35,65],[145,75],[20,157],[137,139],[53,221],[109,199]].map(([x,y],i)=><g key={i} fill={pale} className="pixel-star" style={{ animationDelay: `${i * .3}s` }}><rect x={x} y={y} width="3" height="7" /><rect x={x-2} y={y+2} width="7" height="3" /></g>)}</>
      : <g fill={pale}><rect x="14" y="14" width="12" height="12" /><rect x="28" y="29" width="7" height="7" /><rect x="139" y="87" width="7" height="7" /></g>}
      {theme !== "classic" && [[0,62],[131,100],[-8,225],[128,236],[6,283],[38,296],[82,301],[120,283]].map(([x,y],i)=><g className={theme === "soda" ? "pixel-sky-cloud" : undefined} key={i} style={{ animationDelay: `${i * -.8}s` }}><Cloud x={x} y={y} color={night ? medium : pale} shade={shadow} /></g>)}
      <rect y="316" width="160" height="4" fill={shadow} />
    </>}
    {theme === "classic" && <g fill={shadow} opacity=".2">{Array.from({length:30},(_,i)=><rect key={i} x={(i%10)*18} y={270+Math.floor(i/10)*18} width="8" height="8" />)}<path d="M5 49h2v6H5Zm-2 2h6v2H3ZM147 119h2v6h-2Zm-2 2h6v2h-6Z" /></g>}
  </svg>;
}

function PixelLogoDrawing() {
  const glyphs: Record<string, string[]> = { K:["10001","10010","10100","11000","10100","10010","10001"],N:["10001","11001","10101","10011","10001","10001","10001"],O:["01110","10001","10001","10001","10001","10001","01110"],P:["11110","10001","10001","11110","10000","10000","10000"],I:["11111","00100","00100","00100","00100","00100","11111"] };
  const go = { G: ["01110","10001","10000","10111","10001","10001","01110"], O: glyphs.O };
  return <svg className="pixel-logo pixel-art" viewBox="0 0 56 11" shapeRendering="crispEdges" aria-hidden="true">
    {"KNOPIK".split("").map((letter,i)=><g key={i} fill="currentColor">{glyphs[letter].map((row,y)=>row.split("").map((value,x)=>value==="1"?<rect key={`${x}-${y}`} x={i*6+x} y={y+2} width="1" height="1" />:null))}</g>)}
    <path d="M38 0h18v11H38Z" fill="#8e473d" />
    {(["G","O"] as const).map((letter,i)=><g key={letter} fill="#fff1d1">{go[letter].map((row,y)=>row.split("").map((v,x)=>v==="1"?<rect key={`${x}-${y}`} x={41+i*7+x} y={y+2} width="1" height="1" />:null))}</g>)}
  </svg>;
}

function PixelSymbolDrawing({ kind }: { kind: "cherry" | "lemon" | "seven" | "star" | "diamond" | "safe" | "mine" }) {
  return <svg className="pixel-symbol pixel-art" viewBox="0 0 24 24" shapeRendering="crispEdges" aria-hidden="true">
    {kind === "cherry" ? <><path d="M8 13h2V7h4V3h3v2h-2v4h-3v6h-2v-2h-2Z" fill="#527e59" /><path d="M3 12h6v2h2v6H9v2H3v-2H1v-6h2Zm13-2h5v2h2v6h-2v2h-5v-2h-2v-6h2Z" fill="#b76253" /><path d="M3 14h3v2H3Zm13-2h3v2h-3Z" fill="#f3c19b" /></>
    : kind === "lemon" ? <><path d="M7 3h10v2h4v4h2v9h-4v3H9v-2H5v-4H3V8h4Z" fill="#b8974e" /><path d="M8 5h8v2h4v4h1v5h-4v3h-6v-2H7v-4H5V9h3Z" fill="#e8d383" /><path d="M8 7h6v2H8Zm-1 3h2v3H7Z" fill="#fff1d1" /></>
    : <path fill={kind === "mine" ? "#b76253" : kind === "safe" ? "#537d75" : kind === "diamond" ? "#507fa7" : kind === "seven" ? "#9b554a" : "#b88b4d"} d={kind === "seven" ? "M3 2h18v6h-3v4h-3v4h-3v6H6v-8h3v-4h3V7H3Z" : kind === "star" ? "M10 1h4v6h7v4h-4v6h2v5h-5v-4h-4v4H5v-5h2v-6H3V7h7Z" : kind === "diamond" ? "M7 2h10v3h4v5h2v4h-2v4h-4v3H7v-3H3v-4H1v-4h2V5h4Z" : kind === "safe" ? "M2 11h4v4h4v-4h4V7h4V3h4v8h-4v4h-4v4h-4v3H6v-3H2Z" : "M10 0h4v4h5v2h5v4h-4v4h4v4h-5v2h-5v4h-4v-4H5v-2H0v-4h4v-4H0V6h5V4h5Z"} />}
    {kind === "seven" && <><path d="M4 3h16v3H4Zm12 4h3v3h-3Zm-3 4h3v3h-3Zm-3 4h3v3h-3Zm-3 4h3v2H7Z" fill="#e29a74" /><path d="M5 4h13v1H5Z" fill="#fff1d1" /></>}
    {kind === "star" && <><path d="M11 2h2v6h7v2h-5v7h2v3h-2v-4H9v4H7v-3h2v-7H4V8h7Z" fill="#f0cc78" /><path d="M11 10h2v4h-2Z" fill="#fff1d1" /><path d="M14 10h2v5h-2Z" fill="#d4a155" /></>}
    {kind === "diamond" && <><path d="M8 3h8v3h4v4H4V6h4Z" fill="#a9d5de" /><path d="M4 11h6v3h2v6H8v-3H4Z" fill="#75a8c8" /><path d="M13 11h7v3h-3v4h-4Z" fill="#345d91" /><path d="M10 3h4v6h-4Zm1 8h2v6h-2Z" fill="#e2f1e9" /></>}
    {kind === "safe" && <><path d="M3 12h2v4h5v-4h5V8h4V4h2v5h-4v4h-4v4h-3v3H7v-3H3Z" fill="#a8ce91" /><path d="M4 12h1v2H4Zm14-7h2v2h-2Z" fill="#e2efc0" /></>}
    {kind === "mine" && <><path d="M8 5h8v3h3v8h-3v3H8v-3H5V8h3Z" fill="#43343a" /><path d="M8 6h7v2H8Zm-2 3h2v5H6Z" fill="#ca977b" /><path d="M10 9h4v2h2v4h-6Z" fill="#8c4a45" /><path d="M11 10h3v2h-3Z" fill="#e5ad85" /><path d="M10 1h2v3h-2Zm10 6h3v2h-3ZM1 15h3v2H1Z" fill="#d8b688" /></>}
  </svg>;
}

function PixelRiskDialDrawing({ chance }: { chance: number }) {
  return <svg className="risk-sector-svg pixel-art" viewBox="0 0 100 100" shapeRendering="crispEdges" aria-hidden="true">{Array.from({ length: 625 }, (_, i) => {
    const x = (i % 25) * 4, y = Math.floor(i / 25) * 4;
    const dx = x + 2 - 50, dy = y + 2 - 50;
    const radius = Math.hypot(dx, dy);
    if (radius > 50) return null;
    const angle = (Math.atan2(dx, -dy) * 180 / Math.PI + 360) % 360;
    const winning = (angle - 180 + chance * 1.8 + 360) % 360 < chance * 3.6;
    const rim = radius > 43;
    const tick = radius > 38 && Math.abs(angle / 30 - Math.round(angle / 30)) < .045;
    const light = (i % 25) + Math.floor(i / 25) < 25;
    const color = rim ? radius > 47 ? "#443831" : light ? "#e4be71" : "#a37947"
      : tick ? "#fff1d1" : winning ? light ? "#aac57c" : "#6d955b" : (i % 3 === 0 ? "#6b443e" : "#4b3436");
    return <rect key={i} x={x} y={y} width="4" height="4" fill={color} />;
  })}</svg>;
}

function PixelMemoryPipeDrawing() {
  return <svg className="pixel-memory-pipe pixel-art" viewBox="0 0 128 128" shapeRendering="crispEdges" aria-hidden="true">
    <path d="M19 104h94v15H19Z" fill="#152e32" />
    <path d="M30 66h68v6h12v26H18V72h12Z" fill="#1b3437" />
    <path d="M30 69h68v6h8v19H22V75h8Z" fill="#497768" />
    <path d="M36 74h56v5h8v15H28V79h8Z" fill="#10282d" />
    <g className="sahur-head">
      <path d="M49 8h30v3h7v6h4v61h-4v8H42v-8h-4V17h4v-6h7Z" fill="#56372b" />
      <path d="M49 11h29v3h6v6h3v55h-4v8H45v-8h-4V20h3v-6h5Z" fill="#ad794b" />
      <path d="M49 15h25v3h7v54h-4v7H47V20h2Z" fill="#cd9a60" />
      <path d="M50 14h4v55h-2V38h-2Zm9 5h2v11h-2Zm16 1h2v12h-2Zm6 13h2v39h-2ZM57 69h2v9h-2ZM69 71h2v8h-2Z" fill="#e5b57c" />
      <path d="M44 26h3v9h-3Zm12-5h2v10h-2Zm13-7h2v17h-2Zm7 46h2v17h-2Zm-25 5h2v10h-2Z" fill="#90603b" />
      <path d="M47 30h12v3h3v17h-3v3H45v-4h-2V35h4Zm22 0h12v4h4v16h-4v3H68v-4h-3V34h4Z" fill="#704830" />
      <path d="M47 33h10v3h3v12h-3v3H46v-4h-1V37h2Zm23 0h10v4h3v10h-3v4H69v-3h-2V37h3Z" fill="#fff1d1" />
      <path d="M51 36h6v3h2v8h-3v2h-6v-3h-2v-7h3Zm23 0h5v3h2v8h-3v2h-6v-3h-2v-7h4Z" fill="#47382d" />
      <path d="M53 38h4v8h-5v-5h1Zm22 0h4v8h-5v-5h1Z" fill="#151f26" />
      <path d="M51 36h3v3h-3Zm23 0h3v3h-3Z" fill="#fffefa" />
      <path d="M61 43h5v8h4v4H58v-4h3Z" fill="#825537" /><path d="M63 44h2v8h-2Z" fill="#e8b780" />
      <path d="M47 58h4v3h26v-3h4v6h-5v4H52v-3h-5Z" fill="#4e342a" />
      <path d="M53 61h22v3H53Z" fill="#f2d9ac" /><path d="M55 64h18v2H55Z" fill="#775047" />
      <path d="M48 73h4v3h23v-3h4v7H48Z" fill="#ae794c" />
      <path d="M52 9h23v3H52Zm-6 5h6v3h-6Z" fill="#edbf88" />
    </g>
    <path d="M18 88h92v18h-8v18H26v-18h-8Z" fill="#183b37" />
    <path d="M22 91h84v12h-8v18H30v-18h-8Z" fill="#568961" />
    <path d="M22 91h84v4H22Zm8 12h9v18h-9Z" fill="#a8c883" />
    <path d="M93 95h13v8h-8v18h-8v-18h3Z" fill="#315b48" />
    <path d="M30 98h64v3H30Zm14 10h3v10h-3Zm11 0h3v10h-3Zm11 0h3v10h-3Zm11 0h3v10h-3Z" fill="#6e9d6d" />
    <path d="M24 96h3v3h-3Zm76 0h3v3h-3ZM33 116h3v3h-3Zm59 0h3v3h-3Z" fill="#e4d6ab" />
  </svg>;
}

export const PixelDog = memo(PixelDogDrawing);
export const PixelEar = memo(PixelEarDrawing);
export const PixelClothing = memo(PixelClothingDrawing);
export const PixelPotion = memo(PixelPotionDrawing);
export const PixelCoin = memo(PixelCoinDrawing);
export const PixelCasePart = memo(PixelCasePartDrawing);
export const PixelScene = memo(PixelSceneDrawing);
export const PixelLogo = memo(PixelLogoDrawing);
export const PixelSymbol = memo(PixelSymbolDrawing);
export const PixelRiskDial = memo(PixelRiskDialDrawing);
export const PixelMemoryPipe = memo(PixelMemoryPipeDrawing);
