import {useGraphicsQuality} from './use-graphics-quality';
import type {CaseKind} from './case-engine';
/** Field-cache chamber: static pixel trees, scanner rails and a four-part shutter. */
export function CaseCinematicArt({kind,phase,rewardIndex}:{kind:CaseKind;phase:string;rewardIndex:number}){
 const low=useGraphicsQuality()==='low';
 return <div className="hunter-case-scene" aria-hidden="true" data-cache-kind={kind} data-cache-phase={phase}>
  <svg className="hunter-cache-world" viewBox="0 0 480 800" preserveAspectRatio="xMidYMid slice" shapeRendering="crispEdges"><rect width="480" height="800" fill="#142f29"/><path d="M0 500h480v300H0Z" fill="#263e2e"/>{Array.from({length:low?4:10},(_,i)=><g key={i} transform={`translate(${i*67%510-12} ${100+i%3*70})`}><path d="M-5 0H5v510H-5Z" fill={i%2?'#3d5840':'#284835'}/><path d="M-54 140h108v-22H35V90H18V59H-18v31h-17v28h-19Z" fill="#355c3d"/>{!low&&<path d="M-41 131h82v-10H25V98H12V70H-12v28h-13v23h-16Z" fill="#4e7144"/>}</g>)}<path d="M0 635h480v8H0Zm45 32h390v5H45Zm80 35h230v4H125Z" fill="#7b8960" opacity=".3"/><path d="M82 513h316v20H82Zm20 20h276v18H102Z" fill="#101f20"/><path d="M94 510h292v6H94Z" fill="#9c9f72"/></svg>
  {!low&&<div className="hunter-cache-motes">{Array.from({length:14},(_,i)=><i key={i} style={{left:`${i*37%100}%`,top:`${20+i*19%62}%`,animationDelay:`${-i*.3}s`}}/>)}</div>}
  <div className="hunter-cache-scan"/><span className="hunter-cache-coordinate">SECTOR 04 / CACHE {String(rewardIndex+1).padStart(2,'0')}</span>
 </div>;
}
export function HunterCacheArtwork({big=false}:{big?:boolean}){return <svg viewBox="0 0 240 200" shapeRendering="crispEdges" aria-hidden="true" data-cache-crate="">
 <path d="M22 164h196v14H22Z" fill="#0c2020"/><g className="hunter-cache-bottom"><path d="M24 66h192v98H24Z" fill="#1c3030"/><path d="M30 72h180v86H30Z" fill={big?'#9b8051':'#648064'}/><path d="M36 78h168v12H36Z" fill={big?'#d9bc79':'#a5b78b'}/><path d="M36 98h168v3H36Zm0 21h168v3H36Zm0 21h168v3H36Z" fill="#394f40"/>{[42,184].map(x=><g key={x}><path d={`M${x} 68h14v94h-14Z`} fill="#b6b997"/><path d={`M${x+3} 76h8v6h-8Zm0 68h8v6h-8Z`} fill="#455c50"/></g>)}<path d="M96 103h48v39H96Z" fill="#263e37"/><path d="M102 109h36v27h-36Z" fill="#c8b77d"/><path d="M116 112h8v9h8v5h-8v7h-8v-7h-8v-5h8Z" fill="#4a6545"/></g>
 <g className="hunter-cache-left-latch"><path d="M28 49h22v56H28Z" fill="#273d36"/><path d="M33 54h12v44H33Z" fill="#d3c18b"/></g><g className="hunter-cache-right-latch"><path d="M190 49h22v56h-22Z" fill="#273d36"/><path d="M195 54h12v44h-12Z" fill="#d3c18b"/></g>
 <g className="hunter-cache-lid"><path d="M18 46h204v30H18Z M30 29h180v17H30Z" fill="#233b32"/><path d="M24 49h192v21H24Z M36 35h168v14H36Z" fill={big?'#bf9c60':'#8eaa78'}/><path d="M40 37h160v5H40Z M28 51h184v4H28Z" fill="#dfd4a1"/><path d="M103 22h34v12h-34Z" fill="#283e36"/><path d="M109 26h22v5h-22Z" fill="#adb992"/></g>
 </svg>;}
