import type { RefObject } from "react";
export const MAP_INK="#343041";
/** Stepped corners keep the map's silhouettes on the same pixel grid as the game. */
export function pixelMapBox(x:number,y:number,w:number,h:number,step=8){return `M${x+step} ${y}h${w-2*step}v${step}h${step}v${h-2*step}h-${step}v${step}h-${w-2*step}v-${step}h-${step}v-${h-2*step}h${step}Z`;}
export function PixelMapGoal(){return <g><path d="M-10-42h20v20h20v12h12v20H22v20H10v12h-20V22h-20V10h-12v-20h20v-12h12Z" fill="#775442"/><path d="M-6-34H6v19h19v9h9V6H15v19H6v9H-6V15h-19V6h-9V-6h19v-19h9Z" fill="#f4d889"/><path d="M-6-6H6V6H-6Z" fill="#fff1d1"/></g>;}
export function PixelMapPlayer({x,y,angle,playerRef,scale=1}:{x:number;y:number;angle?:number;scale?:number;playerRef?:RefObject<SVGGElement|null>}){return <g ref={playerRef} data-map-player="" transform={`translate(${x} ${y})`}><g transform={scale===1?undefined:`scale(${scale})`}>
  <path d="M-20-40h40v10h20v50H20v10h-40V20h-20v-50h20Z" fill={MAP_INK}/><path d="M-18-34h36v10h16v39H18v10h-36V15h-16v-39h16Z" fill="#88b6b0"/>
  <path d="M-22-28h10v10h24v-10h10v39H12v10h-24V11h-10Z" fill="#d69a5b"/><path d="M-22-26h7v12h-7Zm37 0h7v12h-7ZM-17 1h34v10H8v7H-8v-7h-9Z" fill="#fff1d1"/><path d="M-14-7h7v7h-7Zm21 0h7v7H7ZM-5 3H5v7H-5Z" fill={MAP_INK}/>
  {angle!==undefined&&<path d="M53-6h12v-8h8v8h8V6h-8v8h-8V6H53Z" transform={`rotate(${Math.round(angle/(Math.PI/4))*45})`} fill="#fff1d1" stroke={MAP_INK} strokeWidth="4"/>}
</g></g>;}
