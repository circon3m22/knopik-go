import type {AdventureLevel} from './adventure-levels';
/** Decorative objects stay outside the authored walking lanes and never change collision. */
export function HunterLevelScenery({level,simple=false}:{level:AdventureLevel;simple?:boolean}){
 const forest=level.zone===6,fort=level.zone===7,p=level.palette;
 return <g data-hunter-environment={level.zone} pointerEvents="none">{level.rooms.map((r,i)=><g key={i} data-room-detail={i}>
  <path d={`M${r.x+34} ${r.y+32}h${r.w-68}v${simple?3:6}h-${r.w-68}Z`} fill={p.accent} opacity=".7"/>
  {!simple&&<>
   {/* Every stage has its own floor inlay and wall plaque, including the original25. */}
   <path d={`M${r.x+78} ${r.y+78}h${r.w-156}v${r.h-156}h-${r.w-156}Z`} fill="none" stroke={p.light} strokeWidth="2" strokeDasharray={level.stage%2?'18 12':'4 12'} opacity=".22"/>
   <g transform={`translate(${r.x+r.w/2} ${r.y+35})`}><path d="M-24-14h48v27h-48Z" fill={p.dark}/><text y="5" textAnchor="middle" fill={p.light} fontSize="15">{level.zone}.{level.stage} / {i+1}</text></g>
   {forest?<>
    {[-1,1].map(side=><g key={side} transform={`translate(${r.x+(side<0?35:r.w-35)} ${r.y+72})`}>
     <path d={`M-10 20h20v${r.h-145}h-20Z`} fill="#4c5940"/>{[0,1,2,3].map(n=><g key={n} transform={`translate(0 ${n*(r.h-170)/4})`}><path d="M-34 13h22V1h24v12h22v22H22v15h-44V35h-12Z" fill="#254d3b"/><path d="M-26 16h19V7H8v12h19v10H13v13h-29V27h-10Z" fill={n%2?'#668b50':'#4d7948'}/><path d="M-5 9H7v9H-5Zm-18 13h13v5h-13Z" fill="#a4b77b"/></g>)}
    </g>)}
    {[0,1,2].map(n=><path key={n} d={`M${r.x+100+n*125} ${r.y+r.h-36}h35v4h-35Zm13-7h9v7h-9Z`} fill="#4b6a46"/>)}
    <g transform={`translate(${r.x+r.w-88} ${r.y+86})`}><path d="M-16-44h32v38h-32Z M-3-6h6v25h-6Z" fill="#3c4936"/><path d="M-12-40h24v29h-24Z" fill="#bda273"/><path d="M-8-33H8v3H-8Zm3 7h10v3H-5Z" fill="#3b5142"/></g>
   </>:fort?<>
    {[0,1,2,3].map(n=><g key={n} transform={`translate(${r.x+90+n*(r.w-180)/3} ${r.y+58})`}><path d="M-19-31h38V3h-38Z" fill="#263c3c"/><path d="M-14-26h28V0h-28Z" fill="#73908a"/><path d="M-3-26h6V0h-6Zm-11 9h28v3h-28Z" fill="#b4c4a8"/></g>)}
    {[-1,1].map(side=><g key={side} transform={`translate(${r.x+(side<0?36:r.w-36)} ${r.y+r.h/2})`}><path d="M-22-76h44v110h-44Z" fill="#284139"/><path d="M-17-70h34V27l-17 14-17-14Z" fill={level.stage%2?'#557450':'#8b684a'}/><path d="M-3-59h6v59h-6Zm-8 20h22v5h-22Z" fill="#d7bd7e"/><path d="M-25-82h50v6h-50Z" fill="#adb99b"/></g>)}
    <path d={`M${r.x+130} ${r.y+r.h-40}h${r.w-260}v9h-${r.w-260}Z`} fill="#4b5c54"/>
   </>:<>
    {level.zone===1?<path d={`M${r.x+42} ${r.y+90}h10v${r.h-180}h-10Zm16 20h5v${r.h-220}h-5Z`} fill="#527c65" opacity=".65"/>:level.zone===2?<g transform={`translate(${r.x+38} ${r.y+135})`}><path d="M-8-38H8V82H-8Z" fill="#855b3e"/><path d="M-4-34H2V78H-4Z" fill="#d6a26d"/><path d="M-14-19h28v5h-28Zm0 62h28v5h-28Z" fill="#b7b599"/><circle cy="-38" r="17" fill="#33433e"/><circle cy="-38" r="12" fill="#d3cfac"/><path d="M-1-39 7-48v12H-1Z" fill="#b86c4f"/></g>:level.zone===3?<g transform={`translate(${r.x+40} ${r.y+r.h/2})`}><path d="M-16-53h32V40h-32Z" fill="#364440"/>{[0,1,2].map(n=><g key={n} transform={`translate(0 ${n*26-42})`}><path d="M-12-4h24v14h-24Z" fill="#8e7c57"/><path d="M-9-1H9v3H-9Zm0 5H5v2H-9Z" fill="#c5b780"/></g>)}</g>:level.zone===4?<g><path d={`M${r.x+35} ${r.y+90}h9v${r.h-180}h-9Z`} fill="#325b65"/>{[0,1,2,3,4].map(n=><path key={n} d={`M${r.x+29} ${r.y+106+n*38}h${n%2?12:20}v3h-${n%2?12:20}Z`} fill="#bfd1b8"/>)}<path d={`M${r.x+48} ${r.y+r.h-63}h${r.w-96}v12h-${r.w-96}Z`} fill="#88b7b1" opacity=".18"/></g>:<g transform={`translate(${r.x+39} ${r.y+100})`}><path d="M-13-30h26V95h-26Z" fill="#33473d"/>{[0,1,2,3].map(n=><g key={n} transform={`translate(0 ${n*29-16})`}><path d="M-9-9H9v18H-9Z" fill="#6b7e77"/><path d="M-6-6H6v12H-6Z" fill="#a9d5c5"/><path d="M-3-4h6v8h-6Z" fill="#d5e9c5"/></g>)}</g>}
    {[0,1,2].map(n=><g key={n} transform={`translate(${r.x+42+n*(r.w-84)/2} ${r.y+r.h-38})`}><path d="M-10-6h20V6h-20Z" fill={p.dark}/><path d="M-7-4H7v3H-7Z" fill={p.accent}/><path d="M-2-12h4v5h-4Z" fill={p.light}/></g>)}
    <path d={`M${r.x+36} ${r.y+70}h7v${r.h-140}h-7Zm${r.w-79} 0h7v${r.h-140}h-7Z`} fill={p.light} opacity=".2"/>
   </>}
  </>}
 </g>)}</g>;
}
