import type { AdventureLevel } from "./adventure-levels";
/** Recessed floor fixtures: readable landmarks without invisible collision bodies. */
export function DungeonLandmark({level,room,prefix}:{level:AdventureLevel;room:number;prefix:string}){
  if(room!==1&&room!==level.exit.room)return null;
  const r=level.rooms[room],p=level.palette,stage=level.stage,cx=r.x+r.w/2,cy=r.y+r.h/2;
  return <g data-dungeon-landmark={`${level.zone}.${stage}.${room}`} pointerEvents="none">
    {level.zone===1?<g transform={`translate(${cx} ${cy-22})`}>
      <path d={`M-${88+stage*7}-42h${176+stage*14}v14h24v66h-31v20h-${164+stage*14}V40h-17v-69h24Z`} fill={p.dark} opacity=".2"/>
      <path d="M-94-28h188v4h-188Zm-10 78h204v3h-204Z" fill={p.light} opacity=".4"/>
      {[0,1,2].map(n=><g key={n} transform={`translate(${-82+n*66} -19)`}><rect width="48" height="32" fill={p.water}/>{[0,1,2,3,4].map(i=><path key={i} d={`M${4+i*9} 3h3v26h-3Z`} fill={p.wall}/>)}<path d="M3 3h42v2H3Z" fill={p.light}/></g>)}
      <path d="M-63 37h29v3h-29Zm50 8h31v3h-31Zm64-12h39v3H51Z" fill="#87a7a0" opacity=".45"/>
    </g>:level.zone===2?<g transform={`translate(${cx} ${cy-26})`}>
      <path d="M-127-43h254v86h-254Z" fill={p.dark} opacity=".18"/><path d="M-114-31h228v62h-228Z" fill="#544440"/>
      {Array.from({length:stage+3},(_,n)=>{const x=-107+n*211/(stage+2);return <g key={n}><path d={`M${x} -25h9v50h-9Z`} fill="#c78751"/><path d={`M${x+3} -22h2v43h-2Z`} fill="#efc37a" opacity=".75"/></g>;})}
      <path d="M-121-37h242v4h-242Zm0 70h242v4h-242Z" fill="#b49a75"/>
      <path d="M-143-57h31v8h-31v14h-8v-22Zm255 0h31v22h-8v-14h-23Z" fill="#d7b78b" opacity=".5"/>
    </g>:level.zone===3?<g transform={`translate(${cx} ${cy-30})`}>
      <path d="M-137-54h274v106h-274Z" fill={p.dark} opacity=".13"/>
      {[-125,121].map(x=><g key={x}><path d={`M${x} -52h4v104h-4Z`} fill="#e0bc71"/>{Array.from({length:5},(_,n)=><path key={n} d={`M${x-4} ${-46+n*20}h12v6h-12Z`} fill="#7e6655"/>)}</g>)}
      {[-38,0,38].map(y=><g key={y}><path d={`M-110 ${y}h220v7h-220Z`} fill="#3e4953"/><path d={`M-107 ${y+1}h214v2h-214Z`} fill="#879795"/></g>)}
      <text y="-68" fontSize="20" textAnchor="middle" fill={p.accent} opacity=".65">{`СЕКТОР А–${stage}`}</text>
    </g>:level.zone===4?<g transform={`translate(${cx} ${cy-30})`}>
      <path d="M-129-61h258v4h-258v99h-4v-103Zm254 4h4v99h-4Zm-251 100h258v4h-258Z" fill="#a7c7bd" opacity=".4"/>
      {[0,1,2,3].map(n=><g key={n} transform={`translate(${-99+n*66} ${stage%2?-34:18})`}><path d="M-13 0h26v3h-26Zm-6 12h23v2H-6Zm-14 11h19v2h-19Z" fill="#97c7c5" opacity=".45"/></g>)}
      <path d="M-17-64h34v6h-34Zm0 105h34v6h-34Z" fill={p.light}/>
      <text y="72" fontSize="18" textAnchor="middle" fill={p.light} opacity=".6">{`ГЛУБИНА ${12+stage*4} М`}</text>
    </g>:<g transform={`translate(${cx} ${cy})`}>
      <ellipse rx={118+stage*5} ry="99" fill={`url(#${prefix}-floor-glow)`} opacity=".65"/>
      {Array.from({length:stage+3},(_,n)=><g key={n} transform={`rotate(${n*360/(stage+3)})`}><path d="M-2-100h4v24h23v4H-2Z" fill={p.accent} opacity=".5"/><path d="M-6-112H6v12H-6Z" fill={p.dark}/><path d="M-3-109H3v6H-3Z" fill="#b1ddda"/></g>)}
      <circle r="76" fill="none" stroke={p.accent} strokeWidth="2" opacity=".35" strokeDasharray="24 9"/>
      <path d="M-15-20h30v5h5v30h-5v5h-30v-5h-5v-30h5Z" fill={p.dark} opacity=".2"/>
    </g>}
  </g>;
}
