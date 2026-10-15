"use client";
import {useId} from "react";
/** Detailed metallic AURA sprite. Every SVG gradient has a unique id. */
export function AuraCoinArtwork({className=""}:{className?:string}){
 const g=useId().replace(/:/g,"");
 return <svg viewBox="0 0 32 32" className={`aura-coin-art pixel-art ${className}`} shapeRendering="crispEdges" role="img" aria-label="AURA">
 <defs><linearGradient id={`aura-grad-${g}`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#ffd1ff"/><stop offset=".22" stopColor="#ef67cf"/><stop offset=".5" stopColor="#9840cc"/><stop offset=".75" stopColor="#ef537b"/><stop offset="1" stopColor="#ffc3e1"/></linearGradient></defs>
 <path d="M10 1h12v2h5v4h3v5h2v8h-2v5h-3v4h-5v2H10v-2H5v-4H2v-5H0v-8h2V7h3V3h5Z" fill="#2b143d"/>
 <path d="M10 3h12v2h4v4h3v4h1v6h-1v4h-3v4h-4v2H10v-2H6v-4H3v-4H2v-6h1V9h3V5h4Z" fill={`url(#aura-grad-${g})`}/>
 <path d="M10 5h12v2h3v3h2v4h1v4h-1v4h-2v3h-3v2H10v-2H7v-3H5v-4H4v-4h1v-4h2V7h3Z" fill="#601763"/>
 <path d="M11 7h10v2h3v3h2v8h-2v3h-3v2H11v-2H8v-3H6v-8h2V9h3Z" fill="#c552a6"/>
 <path d="M9 7h5v2H9Zm-2 4h3v10H7Zm5 13h9v2h-9Z" fill="#ffb8e5"/>
 <path d="M13 10h6v3h2v10h-4v-4h-4v4H9V13h4Zm0 4v3h4v-3Z" fill="#361047"/>
 <path d="M14 11h4v2h2v9h-2v-4h-6v4h-2v-9h4Zm-2 4v2h6v-2Z" fill="#ffe7f7"/>
 <path d="M11 3h10v2H11ZM3 9h2v10H3Zm22 16h-5v2h5Z" fill="#fff2fa" opacity=".73"/>
 <path d="M26 7h2v4h-2Zm-20 16h3v3H6Z" fill="#ff8cad"/>
 </svg>;
}
/** Display cabinet full of iridescent pixel liquid and a sculpted A. */
export function VaultAuraMachineArt({inWorld=false}:{inWorld?:boolean}={}){
 const gradient=useId().replace(/:/g,"");
 const machine=<>

 <defs><linearGradient id={`aura-machine-liquid-${gradient}`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#ffc2f5"/><stop offset=".32" stopColor="#a44fe9"/><stop offset=".67" stopColor="#f34383"/><stop offset="1" stopColor="#7548d0"/></linearGradient></defs>
 <path d="M35 19h50v8h9v10H26V27h9Z" fill="#24203a"/><path d="M54 1h14v5h5v6h-7V8H56v4h-7V6h5Z" fill="#e99adb"/>
 <path d="M50 10h20v8h-5v-4H55v4h-5Z" fill="#9a3abc"/>
 <path d="M20 37h80v8h8v100h-8v22H94v17H26v-17h-6v-22h-8V45h8Z" fill="#241b37"/>
 <path d="M26 41h68v7h8v96h-8v21H26v-21h-8V48h8Z" fill="#72557f"/>
 <path d="M29 49h62v69H29Z" fill="#181934"/><path className="aura-liquid" d="M34 54h52v60H34Z" fill={`url(#aura-machine-liquid-${gradient})`}/>
 <path d="M36 59h6v40h-6Zm10-4h3v50h-3Zm31 4h6v39h-6Z" fill="#fff4fa" opacity=".28"/>
 <path className="aura-bubbles" d="M41 77h5v6h-5Zm16-16h4v5h-4Zm9 26h6v7h-6Zm12-18h5v4h-5Z" fill="#ffd5fa"/>
 <path d="M30 121h60v31H30Z" fill="#37223d"/><path d="M34 126h52v20H34Z" fill="#1d1c32"/><path d="M40 131h40v8H40Z" fill="#e77ecc"/><path d="M45 134h29v2H45Z" fill="#fff7e2"/>
 <path d="M32 156h56v7H32Z" fill="#b17ebb"/><path d="M30 166h18v18H30Zm42 0h18v18H72Z" fill="#27203c"/>
 <path d="M21 49h5v94h-5Zm73 0h5v94h-5Z" fill="#d39ed9"/>
 </>;
 // World furniture MUST be a scaled <g>, never a nested <svg> that can
 // inherit viewport-sized layout rules from the room and cover the floor.
 return inWorld?<g className="aura-machine-world" data-aura-world-sprite="" transform="translate(-27 -81) scale(.45)">{machine}</g>:
 <svg className="vault-aura-machine-art pixel-art" width={120} height={188} viewBox="0 0 120 188" shapeRendering="crispEdges" aria-label="Автомат обмена AURA" role="img">{machine}</svg>;
}
