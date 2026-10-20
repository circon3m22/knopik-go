import type {StreetPalette} from './neighborhood-props';
import {getVisualProfile} from './graphics-quality';
const PEOPLE=[
 {coat:'#648e80',shade:'#3c645e',hair:'#6c4a3d',skin:'#dfb68d',pants:'#5d626b'},
 {coat:'#ba8378',shade:'#895e61',hair:'#5b4038',skin:'#e7c5a2',pants:'#5c6a71'},
 {coat:'#8b9eaf',shade:'#60788e',hair:'#c1c2b5',skin:'#d7ad8b',pants:'#625d6b'},
 {coat:'#ab9c69',shade:'#776c51',hair:'#54423c',skin:'#bd8c6f',pants:'#586875'},
 {coat:'#719aa6',shade:'#486d7c',hair:'#4b3d39',skin:'#e1b998',pants:'#696b72'},
 {coat:'#a78baf',shade:'#755e86',hair:'#9b6250',skin:'#e9c9a5',pants:'#5e6876'},
 {coat:'#c99d73',shade:'#956e53',hair:'#483a35',skin:'#ba8e72',pants:'#576b65'},
 {coat:'#779c8e',shade:'#4d716a',hair:'#bcb6a6',skin:'#e6c29b',pants:'#6d6875'},
 {coat:'#93859f',shade:'#675974',hair:'#674a40',skin:'#e4bd97',pants:'#5b6673'},
 {coat:'#b7a487',shade:'#88775d',hair:'#494039',skin:'#c7997d',pants:'#526e75'},
 {coat:'#9aaac0',shade:'#6c7d96',hair:'#a36953',skin:'#ebc9a5',pants:'#6b6472'},
 {coat:'#be8b71',shade:'#91644f',hair:'#54423d',skin:'#d9ad8d',pants:'#576d67'},
] as const;
/** Distinct neighbors, front/back/profile heads, clothes with real seams and
 * personal objects. The existing rig still animates every arm and leg. */
export function AnimatedNeighborhoodResident({variant=0,p}:{variant?:number;p:StreetPalette}){
 const v=variant%PEOPLE.length,c=PEOPLE[v],detail=getVisualProfile().detail,skin=c.skin,trim='#e7dac0',short=v===5||v===10,hat=v===3||v===6,glasses=v===2||v===8,beard=v===0||v===8,coat=v===1||v===8||v===9;
 if(detail===0)return <g data-resident-pose="" data-resident-style={v}><path d="M-16-2h32v5h-32Z" fill={p.shadow}/><path d="M-10-15h8v19h-8Zm12 0h8v19H2Z" fill={c.pants}/><path d="M-12 1h12v4h-12Zm14 0h12v4H2Z" fill={p.ink}/><g data-resident-torso=""><path d="M-15-38h30v25h-30Z" fill={c.coat}/><path d="M-18-21h6v9h-6Zm30 0h6v9h-6Z" fill={skin}/></g><g data-resident-head="">{(['front','back','side'] as const).map(view=><g key={view} data-resident-view={view} display={view==='front'?'inline':'none'}><path d="M-12-70h24v30h-24Z" fill={view==='back'?c.hair:skin}/><path d="M-12-70h24v7h-24Z" fill={c.hair}/>{view!=='back'&&<path d={view==='side'?'M7-58h3v4H7Z':'M-7-58h3v4h-3Zm11 0h3v4H4Z'} fill={p.ink}/>}</g>)}</g></g>;
 const face=(back=false,side=false)=><>
  <path d={side?'M-12-72h23v5h5v12h5v7h-6v8H-9v-5h-7v-21h4Z':'M-12-72h24v5h5v21h-5v7h-24v-7h-5v-21h5Z'} fill={p.ink}/>
  <path d={side?'M-8-66H9v13h8v4H9v6H-8Z':'M-10-66h20v22h-20Z'} fill={back?c.hair:skin}/>
  {!back&&detail>0&&<path d={side?'M-8-63h3v19h-3Zm14 11h5v2H6Z':'M-10-62h3v14h-3Zm3 15h14v3H-7ZM7-61h3v14H7Z'} fill={v===3||v===6||v===9?'#a97e67':'#c4997d'}/>}
  <path d={side?'M-11-70h21v6H0v13h-12v-13h1Z':v===7?'M-12-70h24v10h-4v-5H-4v5h-8Z':v===5?'M-12-70h24v9H8v-3H0v3H-12Z':'M-11-70h22v8H4v-3H-6v4h-5Z'} fill={c.hair}/>
  {detail>=2&&<path d={side?'M-9-68h13v1H-9Zm-2 3h1v9h-1Z':'M-8-68H7v1H-8ZM-11-65h2v4h-2Z'} fill={v===2||v===7?'#dad5c0':'#8d6953'}/>}
  {!back&&<>
   <path data-resident-eyes="" d={side?'M7-59h3v4H7Z':'M-7-58h3v4h-3Zm11 0h3v4H4Z'} fill={p.ink}/>
   <path d={side?'M10-51h5v2h-5Z':'M-1-53h3v4h-3Zm-3 7h8v1h-8Z'} fill="#b67e68"/>
   {beard&&<path d={side?'M3-47h10v7H0v-5h3Z':'M-9-49h3v3H6v-3h3v9H-9Z'} fill={c.hair}/>}
   {glasses&&<path d={side?'M1-61h11v7H4v-5H1Z':'M-10-61h9v7h-9Zm12 0h9v7H2Zm-3 2h3v2h-3Z'} fill="none" stroke={p.ink} strokeWidth="1"/>}
   {detail>=2&&<path d={side?'M5-64h5v1H5Z':'M-8-63h6v1h-6Zm10 0h6v1H2Z'} fill={c.hair}/>}
  </>}
  {hat&&<><path d="M-17-71h34v5h-34Z" fill={c.shade}/><path d={v===6?'M-12-79h24v8h-24Z':'M-10-77h20v7h-20Z'} fill={c.coat}/><path d="M-9-73H9v2H-9Z" fill={trim}/></>}
  {(v===1||v===5||v===10)&&!side&&<path d={v===1?'M-15-63h4v25h-4Zm26 0h4v25h-4ZM9-75h8v6H9Z':'M-15-62h4v24h-7v-6h3Zm26 0h4v24h-4Z'} fill={c.hair}/>}
  {back&&<path d="M-7-44H7v4H-7Z" fill={skin}/>}
 </>;
 return <g data-resident-pose="" data-resident-style={v}>
  <path d="M-17-2h34v3h5v3h-5v2h-34V4h-5V1h5Z" fill={p.shadow} opacity=".35"/>
  {[-1,1].map((side,i)=><g key={side} data-resident-leg={i?'right':'left'} transform={`translate(${side*7} -13)`}><path d="M-5-2H5v17H-5Z" fill={p.ink}/><path d="M-3-1H3v14H-3Z" fill={c.pants}/>{detail>0&&<path d="M-2 0h1v10h-1Z" fill={c.shade}/>}<path d="M-6 12H6v6H-6Z" fill={p.ink}/><path d="M-4 13H4v2H-4Z" fill={v%3===0?trim:c.coat}/></g>)}
  <g data-resident-arm="left" transform="translate(-15 -36)"><path d="M-5 0H4v25H-5Z" fill={p.ink}/><path d="M-3 2H3v15H-3Z" fill={c.shade}/><path d="M-4 17H3v7H-4Z" fill={skin}/>{detail>0&&<path d="M-3 14H3v3H-3Z" fill={c.coat}/>} {(v===1||v===6)&&<g transform="translate(-6 23)"><path d="M-10-3h20v17h-20Z" fill={p.wood}/><path d="M-6-7H6v7H-6Z" fill="none" stroke={trim} strokeWidth="2"/><path d="M-7 1H7v10H-7Z" fill={v===6?trim:c.coat}/><path d="M-4 1h1v10h-1Z" fill={c.shade}/></g>}</g>
  <g data-resident-torso=""><path d={`M-14-38h28v${coat?32:27}h-28Z`} fill={p.ink}/><path d={`M-11-35h22v${coat?26:21}h-22Z`} fill={c.coat}/><path d={`M7-35h4v${coat?26:21}H7Z`} fill={c.shade}/><path d="M-7-37H7v7H-7Z" fill={skin}/><path d={v===4?'M-8-35h5v4H3v-4h5v6H-8Z':'M-8-36h5v4H0v3h-4Zm11 0h5v4l-4 3H0v-3h3Z'} fill={trim}/>
   {detail>0&&<><path data-resident-buttons="" d="M0-27h2v2H0Zm0 6h2v2H0Zm0 6h2v2H0Z" fill={trim}/><path d="M-8-23h5v1h-5Zm11 0h5v1H3Z" fill={c.shade}/></>}
   {v===4&&<><path d="M-12-34h3v20h-3Zm21 0h3v20H9Z" fill={p.wood}/><path d="M-8-25H9v11H-8Z" fill={p.ink}/><path d="M-3-23h7v7h-7Z" fill={p.waterLight}/></>}
   {v===7&&<><path d="M-9-29H9v16H-9Z" fill={p.wood}/><path d="M-6-27H6v3H-6Z" fill={trim}/></>}
   {v===9&&<><path d="M-8-30H8v22H-8Z" fill={trim}/><path d="M-4-21H4v6H-4Z" fill={c.shade}/></>}
   {v===8&&<><path d="M-12-33h5v24h-5Zm19 0h5v24H7Z" fill={c.shade}/><path d="M-5-25H5v12H-5Z" fill={p.wood}/><path d="M-4-25H4v2H-4Z" fill={trim}/></>}
   {detail>=2&&<><path d="M-10-31h2v8h-2ZM5-18h3v1H5ZM-9-15h5v1h-5Z" fill={c.shade}/><path d="M-8-24h4v1h-4ZM5-32h2v5H5Z" fill={trim} opacity=".5"/></>}
   {short&&<path d="M-11-19h22v5h-22Z" fill={c.shade}/>}
  </g>
  <g data-resident-head=""><g data-resident-view="front">{face()}</g><g data-resident-view="back" display="none">{face(true)}</g><g data-resident-view="side" display="none">{face(false,true)}</g></g>
  <g data-resident-arm="right" transform="translate(15 -36)"><path d="M-4 0H5v25H-4Z" fill={p.ink}/><path d="M-3 2H3v15H-3Z" fill={c.coat}/><path d="M-3 17H4v7H-3Z" fill={skin}/>{detail>0&&<path d="M-3 14H3v3H-3Z" fill={c.shade}/>} {v===3&&<path d="M2 23h15v4H2Zm12-4h7v11h-7Z" fill={p.metal}/>} {v===10&&<><path d="M2 24h14v3H2Z" fill={p.ink}/><path d="M12 22h4v14h-4Z" fill={p.wood}/></>}</g>
 </g>;
}
