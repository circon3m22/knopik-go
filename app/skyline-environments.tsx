'use client';
import {useId} from 'react';
import type {ThemeId,ThemeMood} from './cosmetic-engine';
import {useGraphicsQuality} from './use-graphics-quality';
import {VISUAL_PROFILES} from './graphics-quality';
export const ENVIRONMENTS={
 classic:{sky:'#b8d9d3',floor:'#d6b88d',ink:'#517c78',light:'#f9edcb',accent:'#a97a51',kind:'courtyard'},
 soda:{sky:'#9fd4ed',floor:'#c2e4ef',ink:'#537e9f',light:'#f3ffff',accent:'#82b9ce',kind:'clouds'},
 mint:{sky:'#bcdacf',floor:'#d9e8d4',ink:'#548177',light:'#f5f4df',accent:'#8bb8a1',kind:'garden'},
 night:{sky:'#1d304c',floor:'#3a536d',ink:'#192d48',light:'#e2d3b2',accent:'#7b9bb5',kind:'city'},
 bath:{sky:'#bda782',floor:'#b28a62',ink:'#6d5c4e',light:'#f5ddb4',accent:'#72ada2',kind:'spa'},
 emerald:{sky:'#214d45',floor:'#355f4e',ink:'#15392f',light:'#e1da9a',accent:'#8fc697',kind:'crystal'},
 skyline:{sky:'#8dccef',floor:'#b5dbe6',ink:'#406c94',light:'#efffff',accent:'#5bbde5',kind:'penthouse'},
 observatory:{sky:'#162645',floor:'#334568',ink:'#15243e',light:'#f2ddb0',accent:'#7395c9',kind:'observatory'},
} as const;
/** One scene, no four hidden copies. Optional geometry is absent on lower tiers. */
export function TapEnvironment({theme,mood='calm',className=''}:{theme:ThemeId;mood?:ThemeMood;className?:string}){
 const id=useId().replaceAll(':',''),quality=useGraphicsQuality(),detail=VISUAL_PROFILES[quality].detail,p=ENVIRONMENTS[theme];
 const night=theme==='night'||theme==='observatory',interior=['bath','mint','skyline','observatory'].includes(theme);
 return <svg className={`pixel-art pixel-scene pixel-scene-${theme} ${className}`} data-environment={theme} data-detail={detail} viewBox="0 0 360 640" preserveAspectRatio="xMidYMid slice" shapeRendering="crispEdges" aria-hidden="true">
 <defs><linearGradient id={`${id}-sky`} x2="0" y2="1"><stop stopColor={p.sky}/><stop offset="1" stopColor={p.floor}/></linearGradient><radialGradient id={`${id}-light`}><stop stopColor={p.light} stopOpacity=".4"/><stop offset="1" stopColor={p.light} stopOpacity="0"/></radialGradient><pattern id={`${id}-floor`} width="72" height="32" patternUnits="userSpaceOnUse"><path d="M0 0h72M0 32h72M36 0v32" stroke={p.ink} strokeOpacity=".2" strokeWidth="1"/></pattern></defs>
 <rect width="360" height="640" fill={detail?`url(#${id}-sky)`:p.sky}/>
 {night?<><path d="M280 40h32v8h8v24h-8v8h-32v-8h-8V48h8Z" fill={p.light}/>{Array.from({length:detail?12+detail*7:4},(_,i)=><path key={i} d={`M${12+i*67%335} ${20+i*43%310}h2v2h-2Z`} fill={p.light}/>)}</>:<g fill={p.light} opacity=".7">{[0,1,2].map(i=><path key={i} d={`M${-25+i*145} ${50+i%2*64}h42v-8h22v8h18v10h15v8H${-25+i*145}Z`}/>)}</g>}
 {['classic','night','soda','skyline'].includes(theme)&&<g>{Array.from({length:detail?12:5},(_,i)=>{const x=i*(detail?34:80)-10,h=40+(i*31)%120;return <g key={i}><rect x={x} y={350-h} width="28" height={h} fill={p.ink} opacity=".6"/>{detail>0&&Array.from({length:Math.floor(h/16)},(_,j)=><path key={j} d={`M${x+5} ${357-h+j*16}h5v6h-5Zm12 0h5v6h-5Z`} fill={p.light} opacity={night?'.6':'.3'}/>)}</g>;})}</g>}
 {interior&&<><path d="M0 0h360v17H0ZM0 17h24v410H0Zm336 0h24v410h-24Z" fill={p.ink}/><path d="M24 114h312v6H24Zm105-97h5v310h-5Zm96 0h5v310h-5Z" fill={p.light} opacity=".65"/><path d="M22 326h316v12H22Z" fill={p.ink}/></>}
 <path d="M0 427h360v213H0Z" fill={p.floor}/>{detail>0&&<path d="M0 427h360v213H0Z" fill={`url(#${id}-floor)`}/>}
 {theme==='classic'&&<g data-scene-detail="courtyard"><path d="M0 348h64v8h296v14H0Z" fill={p.ink}/><path d="M0 372h360v8H0Z" fill={p.light}/>{[12,326].map(x=><g key={x} transform={`translate(${x} 420)`}><path d="M-16-80h32v65h-32Z" fill="#7b8260"/><path d="M-32-94h64v40h-64Z" fill="#658d6e"/></g>)}</g>}
 {theme==='soda'&&[0,1,2,3,4].map(i=><g key={i} transform={`translate(${i%2?305:-12} ${260+i*69})`}><path d="M0 12h14V0h32v12h18v12h15v15H-10V24H0Z" fill={p.light}/><path d="M-10 35h89v5h-89Z" fill={p.accent}/></g>)}
 {(theme==='mint'||theme==='bath')&&<g data-scene-detail="spa"><path d="M0 410h82v9h-8v40H0Zm360 0h-82v9h8v40h74Z" fill={p.ink}/><path d="M8 414h58v5H8Zm286 0h58v5h-58Z" fill={p.light}/>{[0,1].map(side=><g key={side} transform={side?'translate(360) scale(-1 1)':undefined}><path d="M8 181h42v200H8Z" fill={p.accent}/><path d="M17 186h24v190H17Z" fill={p.light} opacity=".65"/>{detail>1&&Array.from({length:10},(_,i)=><path key={i} d={`M17 ${192+i*18}h24v2H17Z`} fill={p.ink} opacity=".25"/>)}</g>)}<path d="M50 578h260v7H50Zm12 7h236v20H62Z" fill={p.accent}/><path d="M68 590h224v4H68Z" fill={p.light} opacity=".65"/></g>}
 {theme==='emerald'&&[0,1,2,3,4,5].map(i=><g key={i} transform={`translate(${i%2?333:4} ${170+Math.floor(i/2)*150})`}><path d="M-8-44H8l14 20V6L0 24-22 6v-30Z" fill={p.accent}/><path d="M0-44v68L-22 6v-30Z" fill={p.light} opacity=".6"/><path d="M0-44 22-24V6L0 24Z" fill={p.ink}/></g>)}
 {theme==='skyline'&&<g data-scene-detail="penthouse"><path d="M2 392h72v10H2Zm6 10h60v63H8Z" fill={p.light}/><path d="M15 398h4v65h-4Zm42 0h4v65h-4Z" fill={p.accent}/><path d="M294 364h54v10h-54Zm23 10h9v95h-9Z" fill={p.ink}/><path d="M287 356h68v8h-68Z" fill={p.light}/><path d="M32 604h296v5H32Z" fill={p.accent}/></g>}
 {theme==='observatory'&&<g data-scene-detail="observatory"><path d="M0 155 35 66 89 21 141 0h78l52 21 54 45 35 89v14h-12l-36-96-48-38-51-20h-66L96 35 48 73l-36 96H0Z" fill={p.accent}/><path d="M280 414h8v64h-8Zm4 4-28 59h-7l31-66Zm1 0 30 59h8l-34-66Z" fill={p.light}/><path d="m260 368 67 28-7 19-67-28Z" fill={p.accent}/><path d="m252 366 12 5-10 23-12-5Z" fill={p.light}/><path d="M5 565h68v44H5Z" fill={p.ink}/><path d="M10 570h58v33H10Z" fill={p.accent}/>{detail>0&&<path d="m17 594 12-13 12 7 13-11 7 17M29 581l12 7" fill="none" stroke={p.light} strokeWidth="1"/>}</g>}
 {detail>=2&&<g pointerEvents="none"><ellipse cx="278" cy="135" rx="160" ry="200" fill={`url(#${id}-light)`}/><path d="M265 85h28l-148 430H85Z" fill={p.light} opacity=".09"/>{Array.from({length:detail*14},(_,i)=><path key={i} d={`M${11+i*71%340} ${100+i*53%510}h${i%3?1:3}v1h-${i%3?1:3}Z`} fill={p.light} opacity=".45"/>)}</g>}
 {detail>=3&&<g opacity=".16"><path d="M10 624h340v2H10Zm45-19h250v1H55Z" fill={p.light}/><path d="m0 427 80 60H0Zm360 0-80 60h80Z" fill={p.ink}/></g>}
 {mood!=='calm'&&<rect width="360" height="640" fill={mood==='red'?'#b85149':mood==='yellow'?'#d6b456':'#377bd0'} opacity=".25"/>}
 </svg>;
}
