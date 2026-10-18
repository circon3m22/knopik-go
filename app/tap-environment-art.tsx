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
function Mosaic({p,detail}:{p:Palette;detail:number}){
 const tiles=Array.from({length:detail?16:4},(_,i)=>{const x=i%2?147:8,y=72+Math.floor(i/2)*17;return `M${x} ${y}h5v3h3v5h-3v3h-5v-3h-3v-5h3Z`;}).join('');
 return <g><path d={tiles} fill={p.accent}/>{detail>=2&&<path d="M6 75h2v2H6Zm141 34h2v2h-2ZM6 177h2v2H6Zm141 34h2v2h-2Z" fill={p.light}/>}</g>;
}
function MarbleColumns({p,warm=false,detail}:{p:Palette;warm?:boolean;detail:number}){
 return <g>{[false,true].map(right=><g key={String(right)} transform={right?'translate(160 0) scale(-1 1)':undefined}>
  <path d="M0 0h37v5h-8v7h-7v8h-6v10H8v202h9v8H0Z" fill={p.ink}/>
  <path d="M0 5h28v6h-7v8h-7v10H6v195h6v6H0Z" fill={p.light}/>
  <path d="M2 35h4v182H2ZM0 224h20v5H0Zm0 10h25v6H0Z" fill={p.accent}/>
  <path d="M11 47h7v-4h8v4h6v41H11Z" fill={p.ink}/>
  <path d="M15 49h5v-3h4v3h4v34H15Z" fill={warm?'#c48d56':p.accent}/>
  <path d="M16 51h3v28h-3Z" fill={p.light}/>
  {detail>0&&<path d="M1 92h3v2H3v16H1Zm1 30h2v11H2v8H0v-2h2ZM1 175h3v2H2v20H0v-2h1Z" fill={p.floor}/>}
  {detail>=2&&<path d="M0 29h8v2H0Zm0 187h8v2H0ZM13 85h17v2H13Z" fill={p.light}/>}
 </g>)}</g>;
}
function TiledFloor({p,detail}:{p:Palette;detail:number}){
 const tiles=(parity:number)=>Array.from({length:24},(_,i)=>i%2===parity?`M${i%6*28-3} ${253+Math.floor(i/6)*17}h24v13h-24Z`:'').join('');
 return <g><path d="M0 247h160v73H0Z" fill={p.floor}/><path d="M0 245h160v4H0Z" fill={p.ink}/>
  {detail>0&&<><path d={tiles(0)} fill={p.accent}/><path d={tiles(1)} fill={p.light}/></>}
  {detail>=2&&<path d={Array.from({length:24},(_,i)=>`M${i%6*28+1} ${256+Math.floor(i/6)*17}h14v1h-14Z`).join('')} fill={p.floor}/>}
  <path d="M48 301h64v4H48Zm7-7h50v7H55Zm8-8h34v8H63Z" fill={p.ink}/><path d="M66 287h28v3H66Z" fill={p.light}/>
 </g>;
}

/** Stepped geometry on the original grid. At low/medium only one small cluster
 * animates; tiled materials share paths instead of creating a node per tile. */
export function TapEnvironmentArt({theme,detail}:{theme:ThemeId;detail:number}){
 const p=ENVIRONMENTS[theme];
 return <>
  <rect width="160" height="320" fill={p.sky}/>
  {theme==='classic'&&<g data-scene-detail="classic">
   <path d="M0 284h160v36H0Z" fill={p.floor}/>
   {detail>0&&<><path d="M0 286h160v2H0ZM0 300h160v1H0Zm0 15h160v1H0ZM24 288h1v12h-1Zm48 13h1v14h-1Zm48-13h1v12h-1Z" fill={p.accent}/>
    <path d="M3 290h17v1H3Zm28 14h27v1H31Zm73-14h31v1h-31Zm32 16h18v1h-18Z" fill={p.light}/>
    <path d="M9 92h2v2H9Zm138 35h2v2h-2ZM12 214h1v3h-1Zm133 35h2v1h-2Z" fill={p.accent}/></>}
   <Motion><Star x={15} y={105} color={p.light}/><path d="M24 117h2v2h-2Z" fill={p.light}/></Motion>
   <Star x={141} y={231} color={p.light}/>
   {detail>=2&&<Motion secondary><path d="M144 161h2v2h-2Zm-6 11h1v1h-1Z" fill={p.light}/></Motion>}
  </g>}
  {theme==='soda'&&<g data-scene-detail="clouds">
   <path d="M0 210h160v110H0Z" fill={p.accent}/><path d="M0 265h160v55H0Z" fill={p.floor}/>
   {[[1,30],[123,61],[-22,178],[122,252]].slice(0,detail?4:2).map(([x,y],i)=><Cloud key={i} x={x} y={y} p={p} detail={detail}/>)}
   <Motion kind="drift"><Cloud x={136} y={101} p={p} detail={detail}/></Motion>
   <path d="M0 307h23v-9h22v7h26v7h32v-8h28v-7h29v23H0Z" fill={p.light}/><path d="M0 317h160v3H0Z" fill={p.accent}/>
   {detail>0&&<path d="M9 129h2v2H9Zm139 53h3v3h-3ZM8 240h2v2H8Zm131 49h3v3h-3Z" fill={p.light}/>}
   {detail>=2&&<Motion kind="drift" secondary><Cloud x={-24} y={231} p={p} detail={detail}/></Motion>}
  </g>}
  {(theme==='mint'||theme==='bath')&&<g data-scene-detail={theme==='mint'?'hammam':'turkish-bath'}>
   <MarbleColumns p={p} warm={theme==='bath'} detail={detail}/><Mosaic p={p} detail={detail}/><TiledFloor p={p} detail={detail}/>
   {theme==='mint'?<>
    <path d="M0 202h23v5h-4v29H0Zm141 0h19v34h-19v-29h-4v-5Z" fill={p.ink}/>
    <path d="M2 207h14v25H2Zm142 0h14v25h-14Z" fill={p.light}/><path d="M3 210h12v2H3Zm141 0h12v2h-12Z" fill={p.accent}/>
    <Motion kind="mist"><path d="M12 193h2v-9h3v-7h-2v-8h-2v9h2v5h-3Zm7 6h2v-8h2v-6h-2v7h-2Z" fill={p.light}/></Motion>
   </>:<>
    <path d="M10 97h2v8h7v4h3v25H6v-25h3v-4h1Zm140 0h-2v8h-7v4h-3v25h16v-25h-3v-4h-1Z" fill={p.ink}/>
    <path d="M9 111h10v18H9Zm132 0h10v18h-10Z" fill={p.light}/><path d="M13 111h2v18h-2Zm132 0h2v18h-2Z" fill={p.accent}/>
    <Motion kind="mist"><path d="M141 204h3v-10h-2v-7h3v-10h-2v8h-3v11h2v6h-1Zm9 8h2v-9h-2v-8h-2v10h2Z" fill={p.light}/></Motion>
   </>}
   {detail>=2&&<Motion kind="water" secondary><path d="M4 243h14v1H4Zm138 0h16v1h-16ZM4 251h10v1H4Zm142 0h12v1h-12Z" fill={p.light}/></Motion>}
  </g>}
  {theme==='night'&&<g data-scene-detail="night-city">
   <path d="M0 171h160v70H0Z" fill="#303452"/><path d="M0 222h160v98H0Z" fill={p.floor}/>
   <path d="M126 79h13v3h6v5h3v13h-3v5h-6v3h-13v-3h-6v-5h-3V87h3v-5h6Z" fill={p.accent}/>
   <path d="M126 81h11v3h-5v5h-4v10h4v5h6v2h-12v-3h-5v-5h-2V88h3v-5h4Z" fill={p.light}/>
   {detail>0&&<path d="M123 88h2v2h-2Zm-1 7h2v2h-2Zm6 5h2v2h-2Z" fill="#d2bc9b"/>}
   <path d="M0 216h10v-17h13v10h15v-22h14v29h15v-12h18v8h19v-23h14v18h17v-16h15v25h10v45H0Z" fill="#42486a"/>
   <path d="M0 255h9v-38h17v24h12v-12h21v39h27v-25h18v12h21v-37h21v31h14v71H0Z" fill={p.ink}/>
   <path d="M0 289h160v31H0Z" fill="#242d48"/>
   {detail>0&&<><path d="M2 224h3v5H2Zm13 0h3v5h-3Zm113 2h3v5h-3Zm9 10h3v5h-3ZM3 258h3v5H3Zm10 12h3v5h-3Zm131-12h3v5h-3Z" fill={p.light}/>
    <path d="M0 216h26v2H0Zm125 0h21v2h-21ZM5 296h12v2H5Zm12 7h20v1H17Zm112-7h15v2h-15Zm-6 10h25v1h-25Z" fill={p.accent}/>
    <path d="M9 121h1v1H9Zm23-28h2v2h-2Zm107 65h1v1h-1ZM17 176h2v2h-2Zm130 29h1v1h-1Z" fill={p.light}/></>}
   <Motion><Star x={143} y={134} color={p.light}/><path d="M133 123h1v1h-1Z" fill={p.light}/></Motion>
   {detail>=2&&<Motion kind="drift" secondary><path d="M0 111h13v3h14v3H0Zm3 9h17v2H3Z" fill={p.accent}/></Motion>}
  </g>}
  {theme==='emerald'&&<g data-scene-detail="crystal-cave">
   <path d="M0 0h160v6H0Zm0 6h20v11h9v16h-8v17H10v32H0Zm160 0h-20v11h-9v16h8v17h11v32h10ZM0 265h15v9h17v13h19v8h58v-8h19v-13h17v-9h15v55H0Z" fill={p.ink}/>
   {detail>0&&<path d="M0 152h8v28h-3v41H0Zm160 22h-8v21h4v45h4ZM31 0h8v7h10v6h13v6h36v-6h13V7h10V0h8v9h-10v7h-13v7H54v-7H41V9H31Z" fill={p.floor}/>}
   {[[11,94],[149,167],[8,237],[151,268],[43,303],[119,306]].slice(0,detail?6:3).map(([x,y],i)=><Crystal key={i} x={x} y={y} p={p} tall={i%2===0}/>)}
   {detail>0&&<path d="M4 115h7v2H4Zm143 73h11v2h-11ZM3 243h14v2H3Zm137 31h19v2h-19ZM22 288h10v2H22Zm103 7h13v1h-13Z" fill={p.accent}/>}
   <Motion><path d="M144 144h2v19h-2Zm-2 0h2v5h-2Zm4 18h3v2h-3Z" fill={p.light}/></Motion>
   {detail>=2&&<Motion kind="mist" secondary><Star x={13} y={207} color={p.light}/><path d="M8 221h2v2H8Z" fill={p.light}/></Motion>}
  </g>}
  {theme==='skyline'&&<g data-scene-detail="pixel-penthouse">
   <path d="M0 0h160v8H0Zm0 8h9v236H0Zm151 0h9v236h-9Z" fill={p.ink}/>
   <Cloud x={18} y={31} p={p} detail={detail}/><Motion kind="drift"><Cloud x={135} y={99} p={p} detail={detail}/></Motion>
   <path d="M9 212h14v-21h15v11h14v-34h15v44h18v-27h13v13h20v-32h15v31h18v47H9Z" fill={p.accent}/>
   <path d="M9 226h18v-17h16v15h14v-22h20v24h15v-14h17v-10h24v19h18v23H9Z" fill="#7197ae"/>
   <path d="M8 241h144v5H8Zm32-233h4v235h-4Zm77 0h4v235h-4Z" fill={p.ink}/><path d="M10 9h2v230h-2Zm35 0h1v230h-1Zm77 0h1v230h-1Z" fill={p.light}/>
   <path d="M0 246h160v74H0Z" fill={p.floor}/><path d="M0 276h160v2H0Zm0 25h160v1H0Zm35-55h2v74h-2Zm85 0h2v74h-2Z" fill={p.accent}/>
   <path d="M0 270h26v6h-4v19H4v-19H0Zm134-5h26v6h-4v24h-18v-24h-4Z" fill={p.light}/>
   <path d="M5 277h15v3H5Zm134-5h15v3h-15ZM10 268v-13H6v-7h5v7h4v13Zm134-5v-14h-4v-6h5v7h5v13Z" fill="#527e77"/>
   {detail>0&&<path d="M15 217h3v4h-3Zm9 11h3v4h-3Zm27-17h3v4h-3Zm76 11h3v4h-3Zm9-12h3v4h-3Zm10 20h3v4h-3Z" fill={p.light}/>}
   {detail>=2&&<Motion secondary><path d="M127 217h2v3h-2Zm9 3h2v3h-2Zm9 5h2v3h-2Z" fill={p.light}/></Motion>}
  </g>}
  {theme==='observatory'&&<g data-scene-detail="pixel-observatory">
   <path d="M25 0h110v7h12v13h13v238H0V20h13V7h12Z" fill={p.ink}/>
   <path d="M33 0h94v9h13v14h11v210H9V23h11V9h13Z" fill={p.sky}/>
   <path d="M0 97V44h8V27h12V14h14V6h19V0h54v6h19v8h14v13h12v17h8v53h-5V46h-8V30h-12V18h-14v-8h-18V5H57v5H39v8H25v12H13v16H5v51Z" fill={p.accent}/>
   <path d="M3 46h2v45H3Zm152 0h2v45h-2ZM17 27h3v55h4v75h-3V84h-4Zm123 0h3v57h-4v73h-3V82h4Z" fill={p.light}/>
   <path d="M0 234h160v6H0Zm0 6h160v80H0Z" fill={p.floor}/><path d="M0 236h160v2H0Zm0 59h160v2H0ZM26 240h2v80h-2Zm105 0h2v80h-2Z" fill={p.accent}/>
   <path d="M111 82h10v-3h13v3h10v4h6v8h-6v4h-11v3h-12v-3h-11v-4h-6v-7h7Z" fill="#507c7e"/>
   {detail>0&&<><path d="M119 81h14v3h8v5h-4v5h-15v-3h-6v-6h3Z" fill={p.accent}/>
    <path d="M106 94h12v-2h11v-2h13v-3h9v3h-8v3h-13v2h-12v2h-12Z" fill={p.light}/></>}
   <path data-scene-feature="observatory-stars" d={Array.from({length:detail?12:5},(_,i)=>`M${18+i*43%124} ${76+i*29%142}h1v1h-1Z`).join('')} fill={p.light}/>
   {detail>0&&<path data-scene-feature="constellation" d="M31 84h2v2h-2Zm2 2h1v5h6v1h-7Zm7 5h2v2h-2Zm2 2h1v7h-1Zm-1 7h3v2h-3Z" fill="#658c89"/>}
   <path d="M2 120h28v56H2Z" fill={p.accent}/><path d="M4 123h23v50H4Z" fill={p.ink}/>
   {detail>0&&<path d="M8 129h2v2H8Zm10 5h3v3h-3Zm-9 13h2v2h-2Zm10 12h2v2h-2ZM8 165h14v1H8Z" fill={p.accent}/>}
   {detail>0&&<path d="M10 131h1v3h8v1h-9Zm8 6h1v10h-8v-1h7Zm-7 12h1v9h8v1h-9Z" fill="#658c89"/>}
   <Motion><path d="M8 129h2v2H8Zm10 5h3v3h-3Zm1 25h2v2h-2Z" fill={p.light}/></Motion>
   <g data-scene-feature="brass-telescope" transform="translate(0 -36)">
    <path d="M135 181h5v48h-5Zm-1 9h-4v13h-4v12h-4v14h4v-12h4v-12h4Zm7 0h4v13h4v12h4v14h-4v-12h-4v-12h-4Z" fill={p.accent}/>
    {detail>0&&<><path d="M135 184h2v40h-2Zm-7 22h2v10h-2Zm19 0h2v10h-2Z" fill={p.light}/>
     <path d="M129 164h14v21h-14Z" fill={p.ink}/><path d="M132 166h9v15h-9Z" fill={p.accent}/></>}
    <path d="M123 157h8v-6h9v-6h9v-5h9v18h-7v5h-9v6h-9v5h-10v-5h-5v-8h5Z" fill={p.ink}/>
    <path d="M124 159h8v-6h9v-6h9v-4h6v12h-7v5h-9v6h-9v5h-6v-5h-4v-4h3Z" fill={p.accent}/>
    {detail>0&&<path d="M126 159h6v-4h9v-6h9v-4h4v3h-5v5h-9v6h-8v4h-6Z" fill={p.light}/>}
    <path d="M151 146h4v8h-4Zm-17 25h5v3h-5Z" fill="#719b9b"/>
    {detail>0&&<path d="M147 149h2v8h-2Zm-10 5h2v10h-2ZM134 168h5v2h-5Z" fill="#6c674e"/>}
   </g>
   <path d="M0 242h31v4h-4v27H4v-27H0Z" fill={p.accent}/><path d="M2 242h26v2H2Zm5 7h18v2H7Z" fill={p.light}/>
   {detail>0&&<><path d="M7 234h18v4H7Zm3-12h3v12h-3Zm9 2h3v10h-3Z" fill={p.ink}/>
    <path d="M6 220h16v2H6Zm-3 5h25v2H3Zm4 5h15v2H7Zm7-16h2v20h-2Z" fill={p.accent}/>
    <path d="M12 219h4v3h-4Zm6 9h3v3h-3Z" fill={p.light}/></>}
   {detail>=2&&<Motion secondary><path d="M151 146h2v4h-2Zm-3 5h2v2h-2Z" fill={p.light}/><Star x={146} y={112} color={p.light}/></Motion>}
   {detail>=3&&<path data-scene-feature="dome-inlays" d="M12 91h5v2h-5Zm0 8h3v2h-3Zm131-8h5v2h-5Zm2 8h3v2h-3ZM7 281h15v1H7Zm131 0h16v1h-16Z" fill={p.light}/>}
  </g>}
  {detail>=2&&<g data-pixel-detail="" fill={theme==='classic'?p.accent:p.light}>{Array.from({length:detail*12},(_,i)=>{const stars=theme==='night'||theme==='observatory',x=stars?8+i*37%145:i%2===0?7+i*7%19:134+i*11%19,y=stars?78+i*47%137:18+i*47%282,w=stars?i%4===0?2:1:i%4?2:4;return <path key={i} d={`M${x} ${y}h${w}v1h-${w}Z`}/>;})}</g>}
  {detail>=3&&<g data-pixel-light="" fill={p.accent}>{Array.from({length:detail*6},(_,i)=>{const x=4+i*17%150,y=300+i%4*4;return <path key={i} d={`M${x} ${y}h5v1h-5Z`}/>;})}</g>}
  {detail>=3&&<Motion kind="water" secondary><path d="M8 275h10v1H8Zm133-4h13v1h-13Zm4 9h9v1h-9Z" fill={p.light}/></Motion>}
 </>;
}
