import {useGraphicsQuality} from "./use-graphics-quality";
import {memo} from 'react';
import type {BrainrotKind} from './drink-game-engine';
/** Fine geometry is drawn at 2x the old character grid, then fitted to the same hitbox. */
export function CharacterDetails({kind}:{kind:BrainrotKind}){const quality=useGraphicsQuality();if(quality==="low")return null;return <g transform="scale(.5)" shapeRendering="crispEdges" pointerEvents="none">
 {kind==='tralalero'?<><path d="M39 49h7v2h-7Zm12-8h4v2h-4Zm28 15h4v2h-4Zm16 9h3v2h-3Zm-44 13h5v2h-5Zm9 2h5v2h-5Z" fill="#608c9a"/><path d="M39 92h4v2h-4Zm32 0h4v2h-4Zm31 0h4v2h-4Zm-64 8h9v1h-9Zm32 0h9v1h-9Zm31 0h9v1h-9Z" fill="#e1f0e4"/><path d="M72 54h4v1h-4Zm-18 30h5v2h-5Z" fill="#d5e9d9"/></>:kind==='ballerina'?<><path d="M43 29h34v1H43Zm2 1h2v2h-2Zm28 0h2v2h-2ZM43 54h39v1H43Z" fill="#b99d85"/><path d="M40 90h3v5h-3Zm8 0h3v9h-3Zm9 0h3v11h-3Zm10 0h3v11h-3Zm9 0h3v8h-3Zm9 0h3v5h-3Z" fill="#f8d0dd"/><path d="M54 47h3v1h-3Zm17 0h3v1h-3ZM50 34h5v1h-5Zm23 0h5v1h-5Z" fill="#f8f3dd"/><path d="M54 74h4v1h-4Zm18 0h4v1h-4Z" fill="#ab6588"/></>:kind==='bombardiro'?<><path d="M58 63h33v1H58Zm11 5h2v2h-2Zm11 0h2v2h-2Zm12 9h2v2h-2Zm11 0h2v2h-2Zm-34 7h3v1h-3Zm10 0h3v1h-3Zm10 0h3v1h-3Z" fill="#e0ddc2"/><path d="M13 69h6v1h-6Zm6-3h7v1h-7Zm-5 12h6v1h-6Zm8 2h5v1h-5Zm31-33h5v1h-5Z" fill="#627e6c"/><path d="M88 92h3v8h-3Zm3 8h3v6h-3Z" fill="#53685e"/></>:<><path d="M45 19h28v1H45Zm-12 8h11v1H33Zm-8 12h6v2h-6Zm-7 13h2v16h-2Zm83-4h2v22h-2Z" fill="#fff6a2"/><path d="M30 70h2v5h-2Zm66-3h2v5h-2Zm-48 28h31v1H48Z" fill="#a57a37"/><path d="M43 49h3v3h-3Zm37 0h3v3h-3Z" fill="#fff2c0"/></>}
 </g>;}
export const SeaReef=memo(function SeaReef({zone,scroll}:{zone:number;scroll:number}){return <g pointerEvents="none">
 <path d="M0 28h320v412H0Z" fill={zone===0?'#5aa2a9':zone===1?'#3c6783':'#304c71'} opacity=".24"/>
 {Array.from({length:10},(_,i)=>{const y=(i*53+scroll*2)%420+26,x=i%2?299:4;return <g key={i} transform={`translate(${x} ${y})`}><path d="M3 0h7v8h8v15H2v-5H-3V7h6Z" fill={zone===1?'#be929a':'#71978c'}/><path d="M6 3h3v17H6ZM0 13h14v2H0Z" fill="#a6bda0"/><path d="M3 24h18v4H3Z" fill="#24465e"/></g>;})}
 {Array.from({length:14},(_,i)=><path key={i} d={`M${42+i*43%235} ${42+(i*47+scroll*4)%370}h2v2h-2Z`} fill="#d7e0bd" opacity=".5"/>)}
 <g transform={`translate(65 ${70+scroll})`}><path d="M0 0h11v2h5v5h-5v3H0V7h-4V2h4Z" fill="#e6c58b"/><rect x="9" y="3" width="2" height="2" fill="#355872"/></g>
 <text x="12" y="43" fontSize="11" fill="#e7deb4">{['ПРИБРЕЖЬЕ','КОРАЛЛОВЫЙ РИФ','СИНЯЯ ГЛУБИНА'][zone]}</text>
 </g>;});
export const RhythmStageDetails=memo(function RhythmStageDetails(){return <g pointerEvents="none">
 {[0,1].map(i=><g key={i} transform={`translate(${i?272:5} 87)`}><path d="M0 0h38v42H0Z" fill="#302e43"/><path d="M3 3h32v36H3Z" fill="#4d455b"/><path d="M11 9h15v3h4v17h-4v4H11v-4H7V13h4Z" fill="#897286"/><path d="M14 15h9v11h-9Z" fill="#40384d"/><path d="M5 5h2v2H5Zm25 30h2v2h-2Z" fill="#d0b59d"/></g>)}
 {[45,260].map(x=><g key={x} transform={`translate(${x} 8)`}><path d="M0 0h15v18H0Z" fill="#3d3549"/><path d="M3 2h9v4H3ZM1 18h13l17 89H-16Z" fill="#e3c0a3" opacity=".2"/></g>)}
 <path d="M56 103h26v3H56Zm-8 13h33v2H48Zm190-10h24v3h-24Z" fill="#c9a18f"/>
 {Array.from({length:27},(_,i)=><path key={i} d={`M${26+i%3*96} ${174+Math.floor(i/3)*17}h72v1h-72Z`} fill="#a48189" opacity=".28"/>)}
 </g>;});
export const PlazaDetails=memo(function PlazaDetails({wave}:{wave:number}){return <g pointerEvents="none">
 {[0,1].map(side=><g key={side} transform={`translate(${side?282:0} 179)`}><path d="M0 0h38v232H0Z" fill="#8b8973"/>{Array.from({length:7},(_,i)=><g key={i}><path d={`M3 ${9+i*30}h10v18H3Zm18 0h10v18H21Z`} fill="#b9b799"/><path d={`M5 ${11+i*30}h6v7H5Zm18 0h6v7h-6Z`} fill="#536d70"/></g>)}</g>)}
 {Array.from({length:12},(_,i)=><g key={i}><rect x={46+i%4*64} y={181+Math.floor(i/4)*76} width="7" height="2" fill="#e6d5ab"/><path d={`M${56+i%4*64} ${222+Math.floor(i/4)*76}h14v1h-14Z`} fill="#93886b"/></g>)}
 <path d="M14 132h33v6H14Zm260 0h33v6h-33Z" fill="#657f72"/>
 <text x="160" y="148" textAnchor="middle" fill="#4d6b65" fontSize="12">{wave===3?'КОМАНДНЫЙ ПУНКТ':`ВОЛНА ${wave}`}</text>
 </g>;});
