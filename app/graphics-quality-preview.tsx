import {useId} from 'react';
import type {GraphicsPreset} from './graphics-quality';
import {KnopikHeadArtwork} from './knopik-adventure-art';
import {UltraMistPatch} from './ultra-haze-art';

/** Small, static illustrations of the same room. No world mounting, timers,
 * quality mutation or framebuffer allocation while settings are open. */
export function GraphicsQualityPreview({quality}:{quality:GraphicsPreset}){
 const id=`graphics-sample-${useId().replaceAll(':','')}`,low=quality==='low',high=quality==='ultra';
 return <svg className="graphics-preset-preview" data-graphics-preview={quality} viewBox="0 0 176 112" shapeRendering="crispEdges" aria-hidden="true" focusable="false">
  <defs><clipPath id={`${id}-room`}><path d="M4 28h168v80H4Z"/></clipPath>
   {high&&<><radialGradient id={`${id}-light`}><stop stopColor="#ffdda0" stopOpacity=".7"/><stop offset=".4" stopColor="#ffdda0" stopOpacity=".27"/><stop offset="1" stopColor="#ffdda0" stopOpacity="0"/></radialGradient><radialGradient id={`${id}-sky`}><stop stopColor="#96d2e4" stopOpacity=".3"/><stop offset="1" stopColor="#96d2e4" stopOpacity="0"/></radialGradient></>}
  </defs>
  <path d="M0 0h176v112H0Z" fill="#263f4a"/><path d="M4 4h168v24H4Z" fill="#577879"/><path d="M4 28h168v80H4Z" fill="#3e5c60"/>
  {!low&&<><path d="M4 48h168v1H4Zm0 20h168v1H4Zm0 20h168v1H4Zm27-20h1v20h-1Zm36-40h1v20h-1Zm36 40h1v20h-1Zm36-40h1v20h-1ZM4 25h168v3H4Z" fill="#6a8984" opacity=".45"/><path d="M8 7h160v2H8Zm0 7h110v1H8Zm16-7h1v14h-1Zm34 0h1v7h-1Zm34 0h1v14h-1Z" fill="#97aaa0" opacity=".55"/></>}
  <path d="M14 10h31v50H14Z" fill="#21333d"/><path d="M18 14h23v46H18Z" fill="#36545b"/><path d="M36 36h3v5h-3Z" fill="#d1bf86"/>
  {high&&<g clipPath={`url(#${id}-room)`}><ellipse cx="130" cy="28" rx="76" ry="74" fill={`url(#${id}-light)`}/><ellipse cx="24" cy="78" rx="75" ry="32" fill={`url(#${id}-sky)`}/><path d="M121 67h28l18 25h-28Z" fill="#172e39" opacity=".5"/><path d="M69 100h25l12 8H75Z" fill="#152b35" opacity=".4"/></g>}
  <path d="M119 46h32v25h-32Z" fill="#253c41"/><path d="M121 48h28v20h-28Z" fill="#9b8b61"/><path d="M121 48h28v4h-28Z" fill="#c4b88b"/>
  {!low&&<path d="M125 52h2v14h-2Zm17 0h2v14h-2Zm-15 7h15v2h-15Z" fill="#6f694c"/>}
  <path d="M117 16h28v8h-28Z" fill="#213640"/><path d="M120 18h22v3h-22Z" fill="#e9ddaa"/>
  {high&&<><path d="M121 21h20v1h-20ZM12 29h3v73h-3Zm39 72h35v1H51Zm54-23h15v1h-15Zm30 20h20v1h-20Z" fill="#bdceaf" opacity=".55"/><path d="M10 104h26v1H10Zm44-23h10v1H54Zm62 17h9v1h-9Z" fill="#a0c2bd" opacity=".5"/></>}
  <g transform="translate(83 101) scale(.4)">
   <path d="M-26-3h52v6h-52Z" fill="#22353b" opacity=".5"/><path d="M-25-52h-12v7h-8v18h8v8h17v-7h-13v-10h9Z" fill="#eee0bd"/>
   <path d="M-18-30h13V0h-18v-7h5Zm25 0h13v23h6v7H7Z" fill="#715439"/><path d="M-15-27h7v22h-12v-2h5Zm25 0h7v20h6v2H10Z" fill="#e4cfac"/>
   <path d="M-12-76H12v5h11v17h5v22h-8v13H-10v-5h-13v-18h-4v-14h5v-15h10Z" fill="#715439"/><path d="M-10-73H10v6h10v15h5v18h-8v12H-8v-6h-12v-15h-4v-10h5v-15h9Z" fill="#c48b46"/>
   <path d="M0-65h10v11h8v19h-7v11H1v-10h-8v-19h7Z" fill="#eee0bd"/><path d="M-27-58h9v27h-13v-8h4Zm48 0h10v24h-9Z" fill="#b0783d"/><path d="M-31-39h12v10h-12Zm52 0h12v10H21Z" fill="#eee0bd"/>
   <KnopikHeadArtwork direction="front-diagonal"/>
  </g>
  {high&&<UltraMistPatch prefix={id} room={{x:4,y:28,w:168,h:80}} color="#c4d9d5" density={.4} clip={`${id}-room`} lit shaft={{x:131,y:28,angle:105,reach:78,width:35,aperture:8}}/>}
 </svg>;
}
