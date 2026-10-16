import type {AdventureLevel} from './adventure-levels';
export function ExpeditionScenery({level,simple=false}:{level:AdventureLevel;simple?:boolean}){
 if(!level.location)return null;
 const greenhouse=level.location==='greenhouse',p=level.palette;
 return <g data-expedition-scenery={level.location} pointerEvents="none">{level.rooms.map((r,i)=><g key={i}>
  <path d={`M${r.x+16} ${r.y+18}h${r.w-32}v12h-${r.w-32}Z`} fill={p.accent}/>
  {!simple&&<>
  {greenhouse?<g>
   <path d={`M${r.x+86} ${r.y+48}h${r.w-172}v52h-${r.w-172}Z`} fill="#c4d8be"/><path d={`M${r.x+90} ${r.y+52}h${r.w-180}v42h-${r.w-180}Z`} fill="#75a9a0"/>
   {[0,1,2,3,4].map(n=><path key={n} d={`M${r.x+90+n*(r.w-180)/5} ${r.y+50}h3v48h-3Z`} fill="#d9e6c5"/>)}
   <path d={`M${r.x+90} ${r.y+100}h${r.w-180}l70 ${r.h*.62}h-${r.w-120}Z`} fill="#e4e9ae" opacity=".15"/>
   {[1,2,3,4].map(n=><path key={n} d={`M${r.x+75} ${r.y+130+n*(r.h-210)/5}h${r.w-150}v2h-${r.w-150}Z`} fill="#5e8b78" opacity=".3"/>)}
  </g>:<g>
   <path d={`M${r.x+90} ${r.y+46}h${r.w-180}v58h-${r.w-180}Z`} fill="#203d5a"/>
   <path d={`M${r.x+100} ${r.y+87}h${r.w-200}v8h-${r.w-200}Z`} fill="#477c94"/>
   <path d={`M${r.x+r.w/2-45} ${r.y+78}h90l-15 14h-59Z M${r.x+r.w/2-20} ${r.y+62}h35v16h-35Z`} fill="#9bafa7"/>
   <path d={`M${r.x+r.w*.68} ${r.y+50}h5v33h-5Zm0 0h60v5h-60Z`} fill="#c19e73"/>
   {[1,2,3,4,5].map(n=><path key={n} d={`M${r.x+70} ${r.y+120+n*(r.h-180)/6}h${r.w-140}v2h-${r.w-140}Z`} fill="#b9c2bb" opacity=".3"/>)}
   <path d={`M${r.x+82} ${r.y+130}h4v${r.h-225}h-4Zm${r.w-168} 0h4v${r.h-225}h-4Z`} fill="#e5c183" opacity=".6"/>
  </g>}
{[0,1].map(side=><g key={side} transform={`translate(${r.x+(side?r.w-65:26)} ${r.y+82})`}>
   {greenhouse?<><path d={`M0 0h39v${r.h-170}H0Z`} fill="#385d51"/>{Array.from({length:4},(_,n)=><g key={n} transform={`translate(18 ${20+n*(r.h-210)/4})`}><path d="M-12 3h26v16h-26Z" fill="#ac805b"/><path d="M-2 6V-18h5V6Z" fill="#3a6346"/><path d="M0-5h-12v-9h5v4h7Zm2-4h12v-10H9v5H2Z" fill={n%2?'#7aaa71':'#4f8c65'}/></g>)}</>:<>{Array.from({length:3},(_,n)=><g key={n} transform={`translate(0 ${n*(r.h-175)/3})`}><path d="M0 8h40v40H0Z" fill="#192c3a"/><path d="M0 0h36v38H0Z" fill={n%2?'#9b6a59':'#557f8d'}/><path d="M5 5h2v28H5Zm10 0h2v28h-2Zm10 0h2v28h-2Z" fill="#c8c1a4" opacity=".6"/></g>)}</>}
  </g>)}
  {greenhouse?<path d={`M${r.x+75} ${r.y+38}h${r.w-150}v3h-${r.w-150}Zm${(r.w-150)/2} 0h3v46h-3Z`} fill="#d5e6ca" opacity=".8"/>:<g transform={`translate(${r.x+r.w/2} ${r.y+72})`}><path d="M-24-12h48v24h-48Z" fill="#263d50"/><path d="M-18-6h8v12h-8Zm28 0h8v12h-8Z" fill="#e6bc74"/><path d="M-5-16H5v34H-5Z" fill="#a1bbc2"/></g>}
  </>}
 </g>)}</g>;
}
