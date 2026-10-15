"use client";
import {useId} from "react";
import {CurrencyCoinArt} from "./currency-coin-art";
/** The same minted pixel geometry as Knopik Coin, in purple with an A. */
export function AuraCoinArtwork({className=""}:{className?:string}) {
 return <CurrencyCoinArt currency="aura" className={`aura-coin-art ${className}`}/>;
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
 return inWorld?<g className="aura-machine-world" data-aura-world-sprite="" transform="translate(-30 -92) scale(.5)">{machine}</g>:
 <svg className="vault-aura-machine-art pixel-art" width={120} height={188} viewBox="0 0 120 188" shapeRendering="crispEdges" aria-label="Автомат обмена AURA" role="img">{machine}</svg>;
}
