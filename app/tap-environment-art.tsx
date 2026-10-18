import type {ReactNode} from 'react';
import type {ThemeId} from './cosmetic-engine';

export const ENVIRONMENTS={
 classic:{sky:'#eee9d8',floor:'#d6c9ac',ink:'#a69679',light:'#fff5db',accent:'#c2b695',kind:'classic'},
 soda:{sky:'#a4d1e7',floor:'#c6e3ee',ink:'#719fb8',light:'#f4fcf4',accent:'#b5dfeb',kind:'clouds'},
 mint:{sky:'#c8dccb',floor:'#dce4ca',ink:'#6e9789',light:'#f4f0d7',accent:'#a5c5ab',kind:'hammam'},
 night:{sky:'#262841',floor:'#353859',ink:'#181c35',light:'#f2dfb2',accent:'#777da9',kind:'moon'},
 bath:{sky:'#c9a780',floor:'#debe91',ink:'#85634f',light:'#f8dfad',accent:'#6f9e91',kind:'bath'},
 emerald:{sky:'#183e35',floor:'#234f40',ink:'#102f2b',light:'#dcecb1',accent:'#78bc88',kind:'crystals'},
 skyline:{sky:'#a7d6e9',floor:'#c5dbe3',ink:'#4e799c',light:'#eef9ee',accent:'#91b7c9',kind:'penthouse'},
 observatory:{sky:'#132e35',floor:'#283b40',ink:'#0c1d27',light:'#f1d6a2',accent:'#b19665',kind:'observatory'},
} as const;
type Palette=typeof ENVIRONMENTS[ThemeId];
function Motion({kind='glint',secondary=false,children}:{kind?:'glint'|'drift'|'mist'|'water';secondary?:boolean;children:ReactNode}){
 return <g className={`scene-motion scene-${kind}`} data-scene-motion={secondary?'secondary':'primary'}>{children}</g>;
}
function Cloud({x,y,p,detail=0}:{x:number;y:number;p:Palette;detail?:number}){
 return <g transform={`translate(${x} ${y})`}>
  <path d="M0 10h6V6h8V2h16v4h10v6h8v12H-4V14h4Z" fill={detail?p.accent:p.light}/>
  {detail>0&&<path d="M0 11h7V7h8V3h14v4h10v6h8v7H0Z" fill={p.light}/>}
  {detail>0&&<path d="M8 9h7v2H8Zm10-3h9v2h-9ZM2 16h4v2H2Zm32-5h4v2h-4Z" fill="#ffffff"/>}
  {detail>=2&&<path d="M0 22h42v2H0Zm6-2h8v1H6Zm24-1h11v1H30Z" fill={p.ink} opacity=".35"/>}
 </g>;
}
function Star({x,y,color}:{x:number;y:number;color:string}){
 return <path d={`M${x} ${y}h2v3h3v2h-3v3h-2v-3h-3v-2h3Z`} fill={color}/>;
}
function Crystal({x,y,p,tall=false}:{x:number;y:number;p:Palette;tall?:boolean}){
 return <g transform={`translate(${x} ${y})`}>
  <path d={tall?'M-4-34h8v4h4v6h4V2H8v6H-8V2h-4v-26h4v-6h4Z':'M-4-23h8v4h4v5h4V2H8v6H-8V2h-4v-16h4v-5h4Z'} fill={p.ink}/>
  <path d={tall?'M-3-31h6v4h4v6h3V0H6v5H-6V0h-3v-21h3v-6h3Z':'M-3-20h6v4h4v5h3V0H6v5H-6V0h-3v-11h3v-5h3Z'} fill={p.accent}/>
  <path d={tall?'M-3-31h5v5H0V2h-4V-8h-3v-13h4Z':'M-3-20h5v5H0V2h-4V-6h-3v-5h4Z'} fill={p.light}/>
  <path d="M2-14h5v14H3v5H0V0h2Z" fill="#398760"/>
 </g>;
}
function MaterialDetails({theme,detail,p}:{theme:ThemeId;detail:number;p:Palette}){
 const floor=Array.from({length:detail*5},(_,i)=>{
  const y=266+i%6*9,x=3+Math.floor(i/6)*39;
  return `M${x} ${y}h${19+i%4*3}v1h-${19+i%4*3}Z`;
 }).join('');
 const windows=Array.from({length:detail*10},(_,i)=>{
  const x=i%2?134+i%3*7:7+i%3*8,y=199+Math.floor(i/6)*8;
  return `M${x} ${y}h2v3h-2Z`;
 }).join('');
 return <g data-pixel-material={theme}>
  {(theme==='classic'||theme==='bath')&&<>
   <path d={floor} fill={p.ink} opacity=".24"/>
   <path d={Array.from({length:detail*8},(_,i)=>`M${i%2?142:3} ${86+i*19%153}h12v1h-12Zm3 3h6v1h-6Z`).join('')} fill={p.light} opacity=".48"/>
   <path d={theme==='classic'?'M135 116h22v1h-22Zm0 5h1v30h-1ZM2 101h1v14H2Zm0 22h1v27H2Z':'M137 179h18v1h-18Zm0 5h18v1h-18ZM0 265h27v2H0Zm0 7h23v1H0Z'} fill={p.light}/>
  </>}
  {(theme==='soda'||theme==='skyline')&&<>
   <path d={floor} fill={p.light} opacity=".65"/>
   <path d={windows} fill={p.light} opacity=".75"/>
   <path d="M1 216h25v1H1Zm129 0h30v1h-30ZM8 277h11v1H8Zm132 0h13v1h-13Z" fill={p.ink} opacity=".45"/>
  </>}
  {theme==='mint'&&<>
   <path d={Array.from({length:detail*6},(_,i)=>{const x=i%2?145:1,y=61+Math.floor(i/2)*13;return `M${x} ${y}h3v2h2v3h-2v2h-3v-2h-2v-3h2Z`;}).join('')} fill={p.accent}/>
   <path d={floor} fill={p.light} opacity=".6"/><path d="M0 238h160v2H0Zm7 27h1v55H7Zm145 0h1v55h-1Z" fill={p.ink} opacity=".35"/>
  </>}
  {theme==='night'&&<>
   <path d={windows} fill={p.light} opacity=".65"/><path d={floor} fill="#8098a8" opacity=".45"/>
   <path d="M5 233h10v1H5Zm5 3h9v1h-9Zm119-3h14v1h-14Zm4 3h8v1h-8ZM0 271h160v1H0Z" fill={p.light} opacity=".6"/>
  </>}
  {theme==='emerald'&&<>
   <path d={Array.from({length:detail*6},(_,i)=>{const x=i%2?145:1,y=80+Math.floor(i/2)*15;return `M${x} ${y}h8v2h5v6h-3v-4h-10Z`;}).join('')} fill={p.accent} opacity=".3"/>
   <path d={floor} fill={p.light} opacity=".35"/><path d="M10 91h1v26h-1Zm138 77h1v13h-1ZM20 261h1v15h-1Zm123-29h1v28h-1Z" fill={p.light}/>
  </>}
  {theme==='observatory'&&<>
   <path d={Array.from({length:detail*8},(_,i)=>`M${9+i*31%143} ${78+i*23%123}h1v1h-1Z`).join('')} fill={p.light}/>
   <path d="M5 108h2v128H5Zm148 0h2v128h-2ZM0 248h160v1H0Zm8 44h27v1H8Zm117 0h27v1h-27Z" fill={p.accent}/>
   <path d="M57 280h46v2h7v17h-7v2H57v-2h-7v-17h7Zm0 3h-5v14h5v2h46v-2h5v-14h-5v-1H57Z M79 273h2v34h-2ZM43 289h74v2H43Z" fill={p.accent} opacity=".35"/>
  </>}
 </g>;
}
/** Each scene has its own architecture and a quiet center behind the portrait.
 * Material marks are batched paths, with no extra work on a frame. */
export function TapEnvironmentArt({theme,detail}:{theme:ThemeId;detail:number}){
 const p=ENVIRONMENTS[theme];
 return <>
  <rect width="160" height="320" fill={p.sky}/>
  {theme==='classic'&&<g data-scene-detail="classic">
   <path d="M0 253h160v67H0Z" fill={p.floor}/><path d="M0 250h160v4H0Z" fill={p.ink}/>
   <path d="M0 93h27v64H0Z" fill={p.accent}/><path d="M0 96h24v57H0Z" fill={p.light}/><path d="M0 102h19v44H0Z" fill="#d3d7bf"/>
   <path d="M0 136h10v-13h9v23H0Z" fill="#93a28e"/><path d="M10 97h2v54h-2ZM0 119h23v2H0Z" fill={p.ink}/>
   <path d="M134 111h26v46h-26Z" fill={p.ink}/><path d="M137 114h23v40h-23Z" fill={p.light}/><path d="M141 139h6v-9h5v9h8v10h-19Z" fill="#a2b49c"/>
   <path d="M0 243h27v5h-4v24H3v-24H0Z" fill="#9e7a5b"/><path d="M9 220h4v24H9Zm-9 1h8v8H0Zm14-12h10v10H14Zm-1 19h13v7H13Z" fill="#70916e"/>
   {detail>0&&<><path d="M0 270h160v1H0Zm0 25h160v1H0ZM24 254h1v16h-1Zm42 17h1v24h-1Zm54-17h1v16h-1Zm-95 42h1v24h-1Zm76 0h1v24h-1Z" fill={p.accent}/>
    <path d="M134 228h26v5h-26Zm4 5h22v4h-22Zm-4 4h26v6h-26Z" fill="#7e9989"/><path d="M139 229h17v1h-17Zm-2 9h19v1h-19Z" fill={p.light}/></>}
   <Motion><path d="M1 99h2v14H1Zm13 0h3v5h-3Z" fill="#fffdf0"/></Motion>
  </g>}
  {theme==='soda'&&<g data-scene-detail="clouds">
   <path d="M0 194h160v126H0Z" fill="#bedfe4"/><path d="M0 225h160v95H0Z" fill={p.floor}/>
   <Cloud x={-25} y={95} p={p} detail={detail}/><Motion kind="drift"><Cloud x={131} y={138} p={p} detail={detail}/></Motion>
   <path d="M0 212h160v5H0ZM0 217h4v33H0Zm25 0h3v33h-3Zm105 0h3v33h-3Zm26 0h4v33h-4Z" fill={p.ink}/><path d="M0 213h160v1H0Z" fill={p.light}/>
   <path d="M0 248h27v6h-4v22H4v-22H0Zm134 0h26v6h-4v22h-18v-22h-4Z" fill={p.light}/><path d="M0 241h27v7H0Zm134 0h26v7h-26Z" fill="#679e90"/>
   {detail>0&&<><path d="M4 230h7v-6h8v6h5v11H4Zm134 3h6v-8h8v8h6v8h-24Z" fill="#85b596"/><path d="M0 284h160v2H0Zm0 25h160v2H0ZM32 250h2v34h-2Zm94 0h2v34h-2Z" fill={p.accent}/><path d="M5 257h15v2H5Zm134 0h15v2h-15Z" fill={p.accent}/></>}
  </g>}
  {theme==='mint'&&<g data-scene-detail="hammam">
   <path d="M0 0h160v31h-17V20h-18V10H35v10H17v11H0Z M0 31h8v206H0Zm152 0h8v206h-8Z" fill={p.ink}/>
   <path d="M0 31h5v202H0Zm155 0h5v202h-5ZM17 20h16v-8h94v8h16v3h-19v-8H36v8H17Z" fill={p.light}/>
   <path d="M0 236h160v84H0Z" fill={p.floor}/><path d="M0 234h160v4H0Z" fill={p.ink}/>
   <path d="M0 260h160v60H0Z" fill="#8bb5a8"/><path d="M0 260h160v4H0Zm0 0h6v60H0Zm154 0h6v60h-6Z" fill={p.light}/>
   <path d="M0 174h22v5h-4v55H0Zm142 0h18v60h-18v-55h-4v-5Z" fill={p.ink}/><path d="M1 179h14v49H1Zm144 0h14v49h-14Z" fill={p.light}/>
   {detail>0&&<><path d="M0 115h23v52H0Zm137 0h23v52h-23Z" fill={p.accent}/><path d="M5 122h9v4h4v9h-4v4H5v-4H1v-9h4Zm140 0h9v4h4v9h-4v4h-9v-4h-4v-9h4Z" fill={p.light}/><path d="M10 243h140v1H10ZM10 290h36v1H10Zm103-12h32v1h-32Zm-55 25h30v1H58Z" fill={p.light}/></>}
   <Motion kind="water"><path d="M8 274h17v1H8Zm126 21h16v1h-16Z" fill={p.light}/></Motion>
  </g>}
  {theme==='bath'&&<g data-scene-detail="turkish-bath">
   <path d="M0 0h160v245H0Z" fill="#c49f73"/><path d="M0 243h160v77H0Z" fill={p.floor}/>
   <path d="M0 40h160v3H0Zm0 44h160v3H0Zm0 44h160v3H0Zm0 44h160v3H0Zm0 44h160v4H0Z" fill="#a17c56"/>
   <path d="M0 119h25v48H0Z" fill={p.ink}/><path d="M0 123h21v40H0Z" fill="#537a78"/><path d="M10 123h3v40h-3ZM0 144h21v3H0Z" fill={p.light}/>
   <path d="M139 104h15v66h-15Zm-7 66h28v75h-28Z" fill="#655b50"/><path d="M136 178h24v11h-24Zm0 31h24v28h-24Z" fill="#3b4946"/><path d="M140 215h15v17h-15Z" fill="#dcaa6c"/>
   <path d="M0 227h29v7H0Zm0 8h25v19H0Zm0 20h29v7H0Zm134 0h26v8h-26Z" fill={p.ink}/><path d="M0 228h26v3H0Zm0 28h26v3H0Zm137 0h23v3h-23Z" fill={p.light}/>
   {detail>0&&<><path d="M3 48h31v1H3Zm131 44h22v1h-22ZM3 181h17v1H3ZM0 283h160v2H0Zm0 24h160v2H0Zm38-63h2v39h-2Zm82 0h2v39h-2Z" fill={p.light}/><path d="M133 164h7v7h-7Zm10-5h8v12h-8Zm11 3h6v9h-6Z" fill="#8c8b77"/></>}
   <Motion kind="mist"><path d="M145 155h2v-8h-3v-7h3v-9h-2v7h-3v11h3Zm8 0h2v-10h-2v-6h-2v8h2Z" fill={p.light}/></Motion>
  </g>}
  {theme==='night'&&<g data-scene-detail="night-city">
   <path d="M0 180h160v140H0Z" fill="#303952"/><path d="M0 227h160v93H0Z" fill="#354b60"/>
   <path d="M128 81h13v3h5v5h3v12h-3v5h-5v3h-13v-3h-5v-5h-3V89h3v-5h5Z" fill={p.accent}/><path d="M128 83h11v3h-7v5h-3v10h4v4h6v2h-11v-3h-5V89h5Z" fill={p.light}/>
   <path d="M0 218h9v-26h17v16h16v-31h17v24h12v-17h17v27h16v-13h16v-23h18v33h12v-19h10v45H0Z" fill="#4a5575"/>
   <path d="M0 227h160v3H0ZM0 282h160v38H0Z" fill={p.ink}/>
   <path d="M0 270h160v4H0ZM0 274h4v18H0Zm24 0h3v18h-3Zm109 0h3v18h-3Zm23 0h4v18h-4Z" fill="#9b9ba4"/>
   {detail>0&&<><path d="M12 197h4v5h-4Zm33-13h4v5h-4Zm7 11h4v5h-4Zm73-13h4v5h-4Zm8 17h4v5h-4Zm20-2h4v5h-4Z" fill={p.light}/><path d="M4 238h20v1H4Zm117 12h30v1h-30Zm-96 13h20v1H25Zm19-22h11v1H44Zm85-3h12v1h-12Z" fill="#8090a1"/><path d="M15 120h2v2h-2Zm15-30h2v2h-2Zm109 66h2v2h-2Z" fill={p.light}/></>}
   <Motion><Star x={141} y={132} color={p.light}/></Motion>
  </g>}
  {theme==='emerald'&&<g data-scene-detail="crystal-cave">
   <path d="M0 0h160v9H0Zm0 9h21v14h9v22H19v25H9v54H0Zm160 0h-21v14h-9v22h11v25h10v54h9Z M0 257h17v14h17v14h92v-14h17v-14h17v63H0Z" fill={p.ink}/>
   <path d="M0 296h160v24H0Z" fill="#356b5c"/><path d="M0 302h160v2H0Z" fill={p.accent}/>
   <Crystal x={11} y={119} p={p} tall/><Crystal x={151} y={184} p={p}/><Crystal x={22} y={278} p={p}/>
   {detail>0&&<><Crystal x={145} y={264} p={p} tall/><path d="M0 165h11v48H5v42H0Zm160-35h-10v43h5v48h5Z M39 2h10v7h13v7h36V9h13V2h10v10h-14v10H53V12H39Z" fill={p.floor}/><path d="M4 285h23v2H4Zm126-10h28v2h-28Zm-88 26h25v1H42Zm36 10h21v1H78Z" fill={p.accent}/></>}
   <Motion kind="water"><path d="M142 223h2v18h-2Zm-2 18h2v7h-2Zm4 8h8v1h-8Z" fill={p.light}/></Motion>
  </g>}
  {theme==='skyline'&&<g data-scene-detail="pixel-penthouse">
   <path d="M0 0h160v8H0Zm0 8h6v236H0Zm154 0h6v236h-6Z" fill={p.ink}/>
   <Cloud x={-24} y={99} p={p} detail={detail}/><Motion kind="drift"><Cloud x={132} y={64} p={p} detail={detail}/></Motion>
   <path d="M6 218h18v-29h16v21h15v-39h19v42h18v-19h19v-35h18v44h13v-22h12v65H6Z" fill="#8db4c7"/>
   <path d="M6 234h18v-11h24v-22h22v27h17v-13h24v13h18v-24h25v42H6Z" fill="#5c87a3"/>
   <path d="M46 8h4v236h-4Zm65 0h4v236h-4ZM6 241h148v6H6Z" fill={p.ink}/><path d="M47 9h1v229h-1Zm66 0h1v229h-1Z" fill={p.light}/>
   <path d="M0 247h160v73H0Z" fill={p.floor}/><path d="M0 273h160v2H0Zm0 25h160v2H0Zm34-51h2v73h-2Zm90 0h2v73h-2Z" fill={p.accent}/>
   <path d="M0 256h27v7H0Zm0 7h23v22H0Zm134-5h26v7h-26Zm4 7h22v20h-22Z" fill={p.light}/>
   {detail>0&&<><path d="M8 237h4v19H8Zm-8 0h10v8H0Zm12-9h10v12H12Zm127 15h4v15h-4Zm4-9h10v12h-10Z" fill="#5c8d83"/><path d="M7 225h3v4H7Zm24-26h3v4h-3Zm8 24h3v4h-3Zm84-58h3v4h-3Zm12 47h3v4h-3Zm12 9h3v4h-3Z" fill={p.light}/></>}
  </g>}
  {theme==='observatory'&&<g data-scene-detail="pixel-observatory">
   <path d="M0 110V43h9V28h15V15h22V5h68v10h22v13h15v15h9v67h-5V45h-9V31h-15V19h-20V9H49v10H29v12H14v14H5v65Z" fill={p.accent}/>
   <path d="M0 110h6v133H0Zm154 0h6v133h-6ZM0 242h160v78H0Z" fill={p.floor}/><path d="M0 241h160v3H0Z M33 244h2v76h-2Zm92 0h2v76h-2Z" fill={p.accent}/>
   <path data-scene-feature="observatory-stars" d={Array.from({length:detail?12:5},(_,i)=>`M${17+i*43%124} ${77+i*29%142}h1v1h-1Z`).join('')} fill={p.light}/>
   <path d="M111 89h16v-3h13v3h9v6h-9v5h-13v-3h-16Z" fill="#66898a"/><path d="M105 102h11v-3h13v-3h13v-3h12v3h-11v3h-13v3h-13v3h-12Z" fill={p.light}/>
   <path d="M0 128h26v52H0Z" fill={p.accent}/><path d="M2 131h21v45H2Z" fill={p.ink}/>
   <g data-scene-feature="brass-telescope"><path d="M136 200h4v47h-4Zm-3 6h3v9h-3v12h-4v14h-4v6h-3v-9h4v-13h4v-12h3Zm7 0h3v9h3v12h4v14h4v6h-3v-6h-4v-12h-4v-12h-3Z" fill={p.accent}/><path d="M123 184h8v-6h10v-6h10v-6h9v18h-9v6h-10v6h-11v6h-8v-6h-5v-8h6Z" fill={p.ink}/><path d="M124 186h8v-6h10v-6h10v-5h6v12h-9v6h-10v6h-10v6h-5v-6h-4v-4h4Z" fill={p.accent}/><path d="M126 186h6v-4h10v-6h10v-5h4v3h-5v5h-10v6h-9v4h-6Z" fill={p.light}/></g>
   {detail>0&&<><path data-scene-feature="constellation" d="M7 138h2v2H7Zm10 7h2v2h-2ZM9 140h1v5h7v1H9Zm8 8h1v14h-8v-1h7Z" fill={p.accent}/><path d="M0 261h28v4h-4v23H4v-23H0Zm9-13h3v13H9Zm10 0h3v13h-3ZM6 244h17v2H6Z" fill={p.accent}/><path d="M5 286h17v2H5Zm133-16h20v1h-20ZM18 32h3v2h-3Zm122 0h3v2h-3Z" fill={p.light}/></>}
   <Motion><path d="M7 138h2v2H7Zm10 7h2v2h-2Z" fill={p.light}/></Motion>
  </g>}
  {detail>=2&&<><MaterialDetails theme={theme} p={p} detail={detail}/><Motion secondary><Star x={147} y={214} color={p.light}/></Motion></>}
  {detail>=3&&<><path data-scene-feature="dome-inlays" d={Array.from({length:detail*9},(_,i)=>`M${3+i*17%152} ${288+i%5*5}h${i%3+2}v1h-${i%3+2}Z`).join('')} fill={p.accent}/><Motion kind="water" secondary><path d="M8 275h10v1H8Zm133-4h13v1h-13Zm4 9h9v1h-9Z" fill={p.light}/></Motion></>}
  {detail>=4&&<path data-pixel-reflections="" d="M0 297h18v1H0Zm135 4h25v1h-25ZM1 104h2v12H1Zm156 35h2v19h-2Z" fill={p.light}/>}
 </>;
}
