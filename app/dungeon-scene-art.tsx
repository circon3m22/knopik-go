import { adventureLevel, dungeonZone, type AdventureLevel } from "./adventure-levels";
import { DungeonCover } from "./dungeon-cover-art";
import { DungeonHazards } from "./dungeon-combat-art";
import { DungeonLandmark } from "./dungeon-landmark-art";

function ZoneFixtures({level,room}:{level:AdventureLevel;room:number}){
  const r=level.rooms[room],p=level.palette,seed=level.stage*17+room*11;
  return <g data-room-scenery={room}>
    {[0,1].map(side=>{const x=side?r.x+r.w-27:r.x+27;return <g key={side}>
      <path d={`M${x-4} ${r.y+72}h8v${r.h-147}h-8Z`} fill={p.dark}/><path d={`M${x-2} ${r.y+72}h2v${r.h-147}h-2Z`} fill={p.light} opacity=".6"/>
      {[98,r.h*.52,r.h-84].map((y,i)=><g key={i} transform={`translate(${x} ${r.y+y})`}><ellipse rx="61" ry="43" fill={p.accent} opacity=".055"/><path d="M-13-7h26v20h-26Z" fill={p.dark}/><path d="M-9-3H9v8H-9Z" fill={p.accent}/><path d="M-8-2H5v3H-8Z" fill="#fff1d1"/><path d="M-12 10h24v4h-24Z" fill={p.wall}/>{level.zone===5&&<path d="M-18-13h36v3h-36Zm0 29h36v3h-36Z" fill="#7aadb6"/>}</g>)}
    </g>;})}
    {Array.from({length:8},(_,n)=>{const x=r.x+65+(n*149+seed*9)%(r.w-130),y=r.y+75+(n*117+seed*5)%(r.h-140);return <g key={n} transform={`translate(${x} ${y})`} opacity=".55"><path d="M0 0h8v3h11v-5h3v11h9v3H19V6H8V3H0Z" fill={p.dark}/><path d="M4 20h13v2H4Zm27-5h5v3h-5Z" fill={p.light}/>{level.zone<=2&&<path d="M-10-3h14v3h9v12H-6V7h-9V1h5Z" fill={p.water} opacity=".35"/>}</g>;})}
    {level.zone===1&&<g>
      <path d={`M${r.x+12} ${r.y+12}h${r.w-24}v15h-${r.w-24}Z`} fill="#7c7860"/>
      {Array.from({length:Math.floor(r.w/43)},(_,i)=><path key={i} d={`M${r.x+22+i*43} ${r.y+14}h25v8h-25Z`} fill={i%3?p.wall:p.light} opacity=".6"/>)}
      <path d={`M${r.x+43} ${r.y+r.h-110}h17v5h15v14H${r.x+37}v-12h6Zm${r.w-89} ${-r.h+160}h13v10h-13Z`} fill="#506952"/>
      <g transform={`translate(${r.x+r.w-74} ${r.y+118})`}><path d="M-18-23h36v53h-36Z" fill={p.dark}/><path d="M-13-18h26v40h-26Z" fill={p.water}/><path d="M-8-16h3v36h-3Zm10 0h3v36H2Z" fill={p.light}/><path d="M-4 24h8v15h-8Z" fill="#648a7c" opacity=".5"/></g>
    </g>}
    {level.zone===2&&<g>
      <path d={`M${r.x+54} ${r.y+38}h${r.w-108}v9h-${r.w-108}Z`} fill="#a17954"/><path d={`M${r.x+54} ${r.y+39}h${r.w-108}v2h-${r.w-108}Z`} fill="#e0bb82"/>
      {[r.x+74,r.x+r.w-74].map(x=><g key={x} transform={`translate(${x} ${r.y+r.h*.38})`}><path d="M-14-42h28v11h10v49H14v12h-28V18h-10v-49h10Z" fill="#444348"/><path d="M-10-36h20v9h10V14H10v10h-20V14h-10v-41h10Z" fill="#aa8060"/><path d="M-20-19h40v5h-40Zm0 24h40v5h-40Z" fill="#d5b784"/><circle r="13" fill="#343b44"/><path d="M-9-2H9v4H-9Zm7-7h4V9h-4Z" fill="#efac59"/><path d="M-2-17h4v4h-4Z" fill="#fff1d1"/></g>)}
      <g transform={`translate(${r.x+92} ${r.y+r.h-72})`}><path d="M-32-17h64v35h-64Z" fill={p.dark}/><path d="M-26-11h52v20h-52Z" fill="#bc8152"/><path d="M-22-9h44v4h-44Zm7 5h6v12h-6Zm14 0h6v12H-1Zm14 0h6v12h-6Z" fill="#efac59"/></g>
    </g>}
    {level.zone===3&&<g>
      {[0,1].map(side=><g key={side} transform={`translate(${side?r.x+r.w-112:r.x+54} ${r.y+37})`}><path d="M0 0h58v74H0Z" fill={p.dark}/><path d="M4 4h50v66H4Z" fill="#58616b"/>{[0,1,2].map(n=><g key={n} transform={`translate(7 ${10+n*20})`}><path d="M0 0h44v13H0Z" fill="#2c3340"/><path d="M4 4h23v3H4Zm16 2h4v6h-4Zm10-2h10v4H30Z" fill="#bdc5bb"/></g>)}</g>)}
      <g transform={`translate(${r.x+r.w*.5} ${r.y+r.h-52})`}><path d="M-56-12H56v25H-56Z" fill={p.dark}/><text y="6" textAnchor="middle" fontSize="15" fill={p.accent}>ОГНЕОПАСНО</text></g>
      <path d={`M${r.x+57} ${r.y+136}h5v${r.h-230}h-5Zm${r.w-119} 0h5v${r.h-230}h-5Z`} fill="#c4ab6a" opacity=".7"/>
    </g>}
    {level.zone===4&&<g>
      <path d={`M${r.x+37} ${r.y+56}h6v${r.h-114}h-6Zm${r.w-79} 0h6v${r.h-114}h-6Z`} fill="#31687f"/>
      {[0,1].map(n=><g key={n} transform={`translate(${n?r.x+r.w-79:r.x+57} ${r.y+65})`}><path d="M-14-24h28v77h-28Z" fill={p.dark}/><path d="M-9-19h18v67H-9Z" fill="#609097"/><path d="M-8-8H8v3H-8Zm0 14H8v3H-8Zm0 14H8v3H-8Zm0 14H8v3H-8Z" fill={p.light}/><path d="M-4 17h17v7H-4Z" fill={p.accent}/></g>)}
      <path d={`M${r.x+59} ${r.y+r.h-48}h${r.w-118}v7h-${r.w-118}Z`} fill="#416879"/><path d={`M${r.x+74} ${r.y+r.h-44}h${r.w-148}v2h-${r.w-148}Z`} fill="#b7d9c8" opacity=".45"/>
    </g>}
    {level.zone===5&&<g>
      <path d={`M${r.x+45} ${r.y+48}h${r.w-90}v3h-${r.w-90}v${r.h-92}h-3v-${r.h-92}Zm${r.w-48} 0h3v${r.h-92}h-3Z`} fill="#8dbabd" opacity=".5"/>
      {[0,1].map(n=><g key={n} transform={`translate(${n?r.x+r.w-86:r.x+86} ${r.y+94})`}><path d="M-22-28h44v68h-44Z" fill={p.dark}/><path d="M-17-23h34v55h-34Z" fill="#4b516c"/>{[-12,0,12].map(y=><g key={y}><path d={`M-14 ${y-2}h28v4h-28Z`} fill="#9399bb"/><path d={`M-10 ${y-1}h20v2h-20Z`} fill="#a4dedd"/></g>)}<path d="M-5-30H5v5H-5Zm0 66H5v5H-5Z" fill={p.accent}/></g>)}
      <path d={`M${r.x+r.w*.3} ${r.y+r.h-50}h${r.w*.4}v3h-${r.w*.4}Zm20-13h8v18h-8Zm${r.w*.4-48} 0h8v18h-8Z`} fill={p.accent} opacity=".6"/>
    </g>}
    <g transform={`translate(${r.x+r.w/2} ${r.y+50})`}><path d="M-146-22h292v32h-292Z" fill={p.dark}/><path d="M-141-17h3V4h-3Zm279 0h3V4h-3Z" fill={p.accent}/><text y="0" textAnchor="middle" className="adventure-map-label adventure-map-light" fontSize="17">{`${room+1<10?"0":""}${room+1} · ${level.roomNames[room].toUpperCase()}`}</text></g>
    {level.enemies.some(e=>e.room===room&&e.boss)&&<g transform={`translate(${r.x+r.w/2} ${r.y+r.h*.5})`} opacity=".22"><circle r="156" fill="none" stroke={p.accent} strokeWidth="7"/><circle r="139" fill="none" stroke={p.light} strokeWidth="2"/>{Array.from({length:12},(_,n)=><path key={n} d="M-4-161h8v18h-8Z" transform={`rotate(${n*30})`} fill={p.accent}/>)}<path d="M-22-19h12v9h20v-9h12v33h-44Z" fill={p.accent}/></g>}
  </g>;
}

export function DungeonChambers({id,prefix}:{id:number;prefix:string}){
  const level=adventureLevel(id),p=level.palette,zone=dungeonZone(id);
  return <g data-level-scenery={id}>
    <defs>
      <radialGradient id={`${prefix}-floor-glow`}><stop stopColor={p.accent} stopOpacity=".25"/><stop offset=".45" stopColor={p.accent} stopOpacity=".12"/><stop offset="1" stopColor={p.accent} stopOpacity="0"/></radialGradient>
      <pattern id={`${prefix}-level-floor`} width={level.zone===5?64:48} height="48" patternUnits="userSpaceOnUse"><rect width="64" height="48" fill={p.floor}/><path d="M0 0h64v2H0Zm0 24h64v2H0Zm0 0h2v24H0Zm24 24h2v24h-2Z" fill={p.wall}/><path d="M5 5h14v1H5Zm27 27h11v1H27Z" fill={p.light} opacity=".6"/>{level.zone===5&&<path d="M4 4h50v1H4v15H3V4Zm29 24h17v1H33v12h-1V24Z" fill={p.accent} opacity=".25"/>}</pattern>
      <pattern id={`${prefix}-level-wall`} width="64" height={level.zone>=3?48:32} patternUnits="userSpaceOnUse"><rect width="64" height="48" fill={p.dark}/>{level.zone<=2?<><path d="M2 2h58v11H2Zm-28 16h58v11h-58Zm64 0h58v11H38Z" fill={p.wall}/><path d="M3 2h57v2H3Zm36 14h25v2H39Z" fill={p.light} opacity=".4"/></>:<><path d="M3 3h58v42H3Z" fill={p.wall}/><path d="M6 6h51v2H6Zm0 33h51v2H6Z" fill={p.light} opacity=".4"/><path d="M8 11h3v3H8Zm45 0h3v3h-3Zm-45 22h3v3H8Zm45 0h3v3h-3Z" fill={p.dark}/></>}</pattern>
      <pattern id={`${prefix}-current`} width="40" height="48" patternUnits="userSpaceOnUse"><rect width="40" height="48" fill={p.water}/><path d="M4 5h17v2H4Zm9 22h26v2H13Zm-9 16h20v2H4Z" fill={p.accent} opacity=".35"/></pattern>
    </defs>
    <rect x={level.bounds.x} width={level.bounds.w} height={level.height} fill="#17232e"/>
    {level.rooms.map((r,i)=><rect key={i} x={r.x-16} y={r.y-32} width={r.w+32} height={r.h+48} fill={`url(#${prefix}-level-wall)`}/>)}
    {level.floors.slice(level.rooms.length).map((r,i)=><rect key={i} x={r.x-10} y={r.y-10} width={r.w+20} height={r.h+20} fill={`url(#${prefix}-level-wall)`}/>)}
    {level.floors.map((r,i)=><rect key={i} data-dungeon-floor={i} x={r.x} y={r.y} width={r.w} height={r.h} fill={`url(#${prefix}-level-floor)`}/>)}
    {level.rooms.map((r,i)=><g key={i}><path d={`M${r.x} ${r.y}h${r.w}v7h-${r.w}Z M${r.x} ${r.y+r.h-6}h${r.w}v6h-${r.w}Z`} fill={p.dark}/><path d={`M${r.x} ${r.y+7}h${r.w}v2h-${r.w}Z`} fill={p.light} opacity=".6"/></g>)}
    {level.gates.map((g,i)=>{const a=level.rooms[g.from],b=level.rooms[g.to],cs=g.axis==="x"?[{x:a.x+(a.x<b.x?a.w-8:-8),y:g.y},{x:b.x+(b.x<a.x?b.w-8:-8),y:g.y}]:[{x:g.x,y:a.y+(a.y<b.y?a.h-9:-9)},{x:g.x,y:b.y+(b.y<a.y?b.h-9:-9)}];return <g key={i}>{cs.map((c,n)=><g key={n}><rect x={c.x} y={c.y} width={g.axis==="x"?16:160} height={g.axis==="x"?160:18} fill={`url(#${prefix}-level-floor)`}/><path d={g.axis==="x"?`M${c.x-1} ${c.y-7}h19v7h-19Zm0 167h19v7h-19Z`:`M${c.x-7} ${c.y-4}h7v26h-7Zm167 0h7v26h-7Z`} fill={p.light}/></g>)}</g>;})}
    {level.currents.map((r,i)=><g key={i} data-current-bed={i}><rect x={r.x} y={r.y} width={r.w} height={r.h} fill={`url(#${prefix}-current)`}/><path d={`M${r.x} ${r.y}h${r.w}v3h-${r.w}Zm0 ${r.h-3}h${r.w}v3h-${r.w}Z`} fill={p.light}/>{[0,1,2,3].map(n=><g key={n} transform={`translate(${r.x+38+(n%2)*(r.w-75)} ${r.y+40+Math.floor(n/2)*(r.h-80)}) rotate(${Math.atan2(r.dy,r.dx)*180/Math.PI-90})`}><g className="dungeon-water-flow"><path d="M-3-13h6V7h9L0 20-12 7h9Z" fill={p.light} opacity=".4"/></g></g>)}</g>)}
    {level.rooms.map((r,i)=><g key={i}><DungeonLandmark level={level} room={i} prefix={prefix}/>{[r.x+27,r.x+r.w-27].map(x=><g key={x}>{[98,r.h*.52,r.h-84].map((y,n)=><ellipse key={n} cx={x} cy={r.y+y} rx="93" ry="67" fill={`url(#${prefix}-floor-glow)`}/>)}</g>)}<ZoneFixtures level={level} room={i}/></g>)}
    <DungeonHazards level={level}/>
    {level.solids.map((r,i)=><g key={i} data-dungeon-cover={i}><DungeonCover level={level} {...r}/>{r.breakable&&<path d={`M${r.x+r.w-12} ${r.y+7}h5v5h-5Z`} fill={p.accent}/>}</g>)}
    {level.gates.map((g,i)=><g key={i} data-gate={i} transform={`translate(${g.x} ${g.y})`}><rect x="-4" y="-4" width={g.w+8} height={g.h+8} fill={p.dark}/>{Array.from({length:Math.floor((g.axis==="x"?g.h:g.w)/20)},(_,n)=><rect key={n} x={g.axis==="x"?-3:6+n*20} y={g.axis==="x"?6+n*20:-3} width={g.axis==="x"?18:5} height={g.axis==="x"?5:18} fill={p.light}/>)}<rect width={g.w} height={g.h} fill={p.accent} opacity=".35"/></g>)}
    {level.barrels.map((b,i)=><g key={i} data-barrel={i} transform={`translate(${b.x} ${b.y})`}><path d="M-16 7h34v9h-34Z" fill="#15202c" opacity=".4"/><path d="M-14-21H14V12H-14Z" fill="#34333e"/><path d="M-11-18H11V9H-11Z" fill="#b76253"/><path d="M-11-15H11v4H-11Zm0 18H11v4H-11Z" fill="#8b9295"/><path d="M-9-18h4v15h-4Z" fill="#e49a79"/><path d="M-3-9h6v4h4v5H-7v-5h4Z" fill="#e4cc89"/><path d="M-2-22h5v3h-5Z" fill="#b4c6b9"/></g>)}
    <text x={level.bounds.x+level.bounds.w/2} y={level.height-25} textAnchor="middle" className="adventure-map-label adventure-map-light">{`${zone.name.toUpperCase()} · ${level.stage}/5`}</text>
  </g>;
}
