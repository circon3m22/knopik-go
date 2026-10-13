import { adventureLevel, type AdventureLevel, type AdventureWeapon, type LevelCover } from "./adventure-levels";

function Cover({ level, x, y, w, h, kind }: LevelCover & { level: AdventureLevel }) {
  const p=level.palette, face=kind==="crate"?"#775442":p.wall, front=kind==="pipe"?10:14;
  return <g data-cover-kind={kind} transform={`translate(${x} ${y})`}>
    <rect x="5" y="9" width={w} height={h} fill="#18232c55"/>
    <rect width={w} height={h} fill={p.dark}/><rect x="3" y="3" width={w-6} height={h-front} fill={face}/>
    <path d={`M4 3h${w-8}v4H4Zm0 ${h-front}h${w-8}v3H4Z`} fill={p.light}/>
    <rect x="3" y={h-front+3} width={w-6} height={front-6} fill={kind==="crate"?"#584a42":p.dark}/>
    {kind==="crate" && <g><path d={`M8 11h${w-16}m0 15H8m0 15h${w-16}m0 15H8M12 7v${h-23}m${w-24} 0V7`} fill="none" stroke="#ae8060" strokeWidth="4"/><path d={`M12 10l${w-24} ${h-29}m-${w-24} 0L${w-12} 10`} fill="none" stroke="#d1aa7a" strokeWidth="5"/><rect x={w/2-12} y={h/2-6} width="24" height="16" fill="#e4cc9b"/><path d={`M${w/2-8} ${h/2-2}h16v2h-16m0 4h8`} stroke="#775442" strokeWidth="2"/><path d={`M8 ${h-8}h6v3H8m${w-28} 0h6v3h-6`} fill="#ae8060"/></g>}
    {kind==="tank" && <g><rect x="8" y="10" width={w-16} height={h-32} fill={p.light}/><rect x="14" y="13" width={w-28} height={h-38} fill={p.wall}/><path d={`M8 23h${w-16}v7H8Zm0 ${h-58}h${w-16}v7H8Z`} fill={p.dark}/><circle cx={w/2} cy={h/2} r="14" fill={p.dark}/><circle cx={w/2} cy={h/2} r="10" fill={p.accent}/><path d={`M${w/2-2} ${h/2-8}h4v16h-4Zm-6 6h16v4h-16Z`} fill={p.dark}/><rect x="18" y="8" width="10" height="6" fill={p.accent}/><path d={`M10 ${h-9}h12v4H10m${w-44} 0h12v4h-12`} fill={p.light}/></g>}
    {kind==="pipe" && <g><rect x="4" y="7" width={w-8} height={h-18} fill="#69838b"/><path d={`M4 8h${w-8}v4H4Z`} fill="#a4b7b3"/>{Array.from({length:Math.floor(w/26)},(_,i)=><g key={i}><rect x={12+i*26} y="4" width="6" height={h-7} fill={p.dark}/><rect x={13+i*26} y="5" width="2" height={h-10} fill={p.light}/></g>)}</g>}
    {kind==="pillar" && <g><rect x="8" y="10" width={w-16} height={h-30} fill={p.light}/><rect x="11" y="13" width={w-22} height={h-35} fill={p.wall}/><path d={`M14 18h10v3h-10Zm${w-29} 14h-7v3h7Zm-${w-27} 12h10v3h-10Z`} fill={p.dark}/><path d={`M8 ${h-20}h${w-16}v5H8Z`} fill={p.light}/></g>}
    {kind==="rubble" && <g><path d={`M5 20h10V8h22v6h17V7h${w-59}v${h-25}h-12v10H17V${h-24}H5Z`} fill={p.light}/><path d={`M9 23h18V12h7v12h21v-7h${w-63}v${h-38}H48v12H23v-9H9Z`} fill={p.wall}/><path d={`M16 27h9v11h-9Zm26-8h8v7h-8Zm7 22h13v7H49Z`} fill={p.dark}/><path d={`M29 27l8 8m15-22 7 7`} fill="none" stroke="#b99d8d" strokeWidth="3"/></g>}
    {kind==="barricade" && <g><rect x="6" y="8" width={w-12} height={h-22} fill={p.light}/>{Array.from({length:Math.floor((w-12)/20)},(_,i)=><path key={i} d={`M${10+i*20} 8h8l-6 ${h-22}h-8Z`} fill={p.accent}/>)}<path d={`M9 ${h-11}h12v7H9m${w-42} 0h12v7h-12`} fill={p.wall}/></g>}
    {kind==="breakwater" && <g><rect x="8" y="10" width={w-16} height={h-28} fill={p.light}/><path d={`M12 13h${w-24}v4H12Zm0 ${h-37}h${w-24}v3H12Z`} fill={p.wall}/><path d={`M13 20h5v${h-42}h-5Zm${w-31} 0h5v${h-42}h-5Z`} fill={p.dark}/><path d={`M6 ${h-10}h${w-12}v3H6Z`} fill={p.accent}/></g>}
    {kind==="machine" && <g><rect x="9" y="11" width={w-18} height={h-31} fill={p.dark}/><rect x="14" y="16" width={w-44} height={h-43} fill="#263d45"/><path d={`M18 23h${w-56}v3H18m0 7h${w-62}v3H18`} fill={p.accent}/><rect x={w-25} y="18" width="8" height="8" fill="#88a980"/><rect x={w-25} y="31" width="8" height="8" fill="#b76253"/><path d={`M12 ${h-10}h${w-24}v3H12Z`} fill={p.light}/></g>}
    {[[5,5],[w-8,5],[5,h-front-5],[w-8,h-front-5]].map(([bx,by],i)=><rect key={i} x={bx} y={by} width="3" height="3" fill={p.dark}/>)}
  </g>;
}

function ChamberDetails({ level, index, prefix }: { level: AdventureLevel; index: number; prefix: string }) {
  const r=level.rooms[index],p=level.palette;
  return <g data-room-detail={index}>
    {level.mechanic==="boss" && index===level.rooms.length-1 && <g transform={`translate(240 ${r.y+r.h*.5})`} opacity=".35"><circle r="142" fill="none" stroke={p.dark} strokeWidth="9"/><circle r="130" fill="none" stroke={p.light} strokeWidth="3"/>{Array.from({length:12},(_,n)=><path key={n} d="M-4-144h8v15h-8Z" transform={`rotate(${n*30})`} fill={p.accent}/>)}<path d="M-21-20h12v9h18v-9h12V14H-21Z" fill={p.dark}/><path d="M-14 7h28v3h-28Z" fill={p.accent}/></g>}
    {[0,1].map(side=>{const x=side?r.x+r.w-40:r.x+20;return <g key={side}>
      {[110,r.h*.52,r.h-100].map((offset,n)=><g key={n} transform={`translate(${x} ${r.y+offset})`}><rect x="-11" y="-6" width="26" height="18" fill={p.dark}/><rect x="-7" y="-3" width="18" height="7" fill="#e4cc89"/><path d="M-8 8h20v4H-8Z" fill={p.wall}/><path d={`M${side?-65:-5} 14h70v22h-70Z`} fill="#e4cc890a"/></g>)}
      <path d={`M${x+4} ${r.y+76}v${r.h-134}h-7v-${r.h-134}Z`} fill={p.dark}/><path d={`M${x+2} ${r.y+76}v${r.h-134}h-2v-${r.h-134}Z`} fill={p.light}/>
    </g>;})}
    {[0,1,2].map(n=><g key={n} transform={`translate(${n%2?r.x+r.w-118:r.x+50} ${r.y+140+n*(r.h-220)/3})`}>
      <rect width="58" height="32" fill={p.dark}/><rect x="3" y="3" width="52" height="26" fill={`url(#${prefix}-drain)`}/><path d="M-5 35h67v3H-5Z" fill={p.wall}/>
    </g>)}
    {Array.from({length:6},(_,n)=>{const x=r.x+110+(n*137+index*47)%(r.w-210),y=r.y+84+(n*151+index*31)%(r.h-145);return <g key={n} transform={`translate(${x} ${y})`}><path d="M0 0h24v4h14v8H8v-3H0Z" fill={p.water} opacity=".22"/><path d="M4-8h3v4h7v3h9m-9 0v7h5v4" fill="none" stroke={p.dark} strokeWidth="2" opacity=".45"/><path d="M29 13h5v3h-5Zm-23 7h4v2H6Z" fill={p.light}/></g>;})}
    <g transform={`translate(200 ${r.y+r.h-55})`} opacity=".55"><path d="M0 18h8V6h-5L12-3l9 9h-5v12h8v4H0Zm40 0h8V6h-5l9-9 9 9h-5v12h8v4H40Z" fill={p.light}/></g>
    <rect x="106" y={r.y+10} width="268" height="29" fill={p.dark}/><path d={`M110 ${r.y+12}h3v23h-3m257 0h3v-23h-3Z`} fill={p.accent}/><text x="240" y={r.y+31} textAnchor="middle" className="adventure-map-label adventure-map-light">{`0${index+1} · ${level.roomNames[index]}`}</text>
    {level.mechanic==="barrels" && <g transform={`translate(${r.x+90} ${r.y+r.h-78})`}><path d="M0 0h95v3H0Zm0 0h3v33H0Zm92 0h3v33h-3Zm-92 30h95v3H0Z" fill={p.accent} opacity=".6"/><path d="M12 12h16v2H12Zm9-5v16m23-9h33v3H44Z" fill={p.light}/></g>}
    {level.mechanic==="current" && <g transform={`translate(${r.x+r.w-82} ${r.y+58})`}><rect width="40" height="74" fill={p.dark}/><path d="M8 6h4v60H8m0-50h24m-24 14h15m-15 14h24m-24 14h15" stroke={p.light} strokeWidth="3" fill="none"/><rect x="18" y="44" width="16" height="6" fill={p.accent}/></g>}
  </g>;
}

export function LevelChambers({ id, prefix }: { id: number; prefix: string }) {
  const level=adventureLevel(id),p=level.palette;
  return <g data-level-scenery={id}>
    <defs><pattern id={`${prefix}-level-floor`} width="48" height="48" patternUnits="userSpaceOnUse"><rect width="48" height="48" fill={p.floor}/><path d="M0 0h48v2H0Zm0 24h48v2H0Zm0 0h2v24H0Zm24 24h2v24h-2Z" fill={p.wall}/><path d="M5 5h14v1H5Zm27 26h10v1H32Z" fill={p.light}/><path d="M12 13h3v4h-3Zm24 25h3v4h-3Z" fill={p.dark} opacity=".25"/></pattern><pattern id={`${prefix}-level-brick`} width="64" height="32" patternUnits="userSpaceOnUse"><rect width="64" height="32" fill={p.dark}/><path d="M2 2h58v11H2Zm-28 16h58v11h-58Zm64 0h58v11H38Z" fill={p.wall}/><path d="M3 2h57v2H3Zm36 14h25v2H39Z" fill={p.light} opacity=".4"/></pattern><pattern id={`${prefix}-current`} width="40" height="48" patternUnits="userSpaceOnUse"><rect width="40" height="48" fill={p.water}/><path d="M4 5h17v2H4Zm9 22h26v2H13Zm-9 16h20v2H4Z" fill={p.accent} opacity=".4"/></pattern></defs>
    <defs><pattern id={`${prefix}-drain`} width="10" height="12" patternUnits="userSpaceOnUse"><rect width="10" height="12" fill={p.water}/><rect x="2" width="3" height="12" fill={p.light}/><rect x="5" width="2" height="12" fill={p.wall}/></pattern></defs>
    <rect x={level.bounds.x} width={level.bounds.w} height={level.height} fill="#18232c"/>
    {level.rooms.map((r,i)=><g key={i}>
      <rect x={r.x-12} y={r.y-30} width={r.w+24} height={r.h+45} fill={`url(#${prefix}-level-brick)`}/><rect {...r} width={r.w} height={r.h} fill={`url(#${prefix}-level-floor)`}/>
      <path d={`M${r.x} ${r.y}h${r.w}v6h-${r.w}Z`} fill={p.dark}/><path d={`M${r.x} ${r.y+r.h-5}h${r.w}v5h-${r.w}Z`} fill={p.wall}/>
      <path d={`M${r.x+13} ${r.y+44}h12v${r.h-85}h-12Zm${r.w-38} 0h12v${r.h-85}h-12Z`} fill={p.water}/>
      <path d={`M${r.x+28} ${r.y+16}h55v5h-55v44h-5v-49Zm${r.w-56} 0h-48v5h48v49h5v-54Z`} fill={p.light}/>
      <path d={`M${r.x+41} ${r.y+16}v8m15-8v8m${r.w-126}-8v8`} fill="none" stroke={p.dark} strokeWidth="3"/>
      <ChamberDetails level={level} index={i} prefix={prefix}/>
      {level.mechanic==="steam" && <g><path d={`M${r.x+31} ${r.y+37}h28v8h-28v17h-8V37Z`} fill="#805038"/><path d={`M${r.x+26} ${r.y+46}h9v3h-9Z`} fill={p.accent}/><rect x={r.x+r.w-58} y={r.y+38} width="26" height="14" fill={p.dark}/><path d={`M${r.x+r.w-53} ${r.y+42}h6v7h-6Zm9 0h6v7h-6Z`} fill={p.accent}/></g>}
      {level.mechanic==="barrels" && <g><path d={`M${r.x+39} ${r.y+250}h42v28h-42Z`} fill={p.dark}/><path d={`M${r.x+42} ${r.y+253}h36v3h-36Zm0 8h36v3h-36Zm0 8h36v3h-36Z`} fill={p.light}/><path d={`M${r.x+r.w-74} ${r.y+287}h31v10h-31Z`} fill={p.accent}/></g>}
      {level.mechanic==="current" && <g><path d={`M${r.x+25} ${r.y+40}h26v26h-26Z`} fill={p.dark}/><path d={`M${r.x+33} ${r.y+42}h10v22h-10Z`} fill={p.light}/><path d={`M${r.x+29} ${r.y+49}h18v7h-18Z`} fill={p.accent}/><path d={`M${r.x+r.w-70} ${r.y+43}h25v20h-25Z`} fill={p.dark}/></g>}
      {id===5 && <g><rect x={r.x+35} y={r.y+35} width="30" height="30" fill={p.dark}/><g className="home-machine-gear"><path d={`M${r.x+46} ${r.y+36}h8v6h7v8h-7v7h-8v-7h-7v-8h7Z`} fill={p.accent}/></g><path d={`M${r.x+r.w-64} ${r.y+36}h27v28h-27Z`} fill={p.dark}/><path d={`M${r.x+r.w-57} ${r.y+42}h13v4h-13Zm0 9h13v4h-13Z`} fill={p.accent}/></g>}
    </g>)}
    {level.floors.slice(level.rooms.length).map((r,i)=><g key={i}><rect x={r.x-10} y={r.y} width={r.w+20} height={r.h} fill={`url(#${prefix}-level-brick)`}/><rect {...r} width={r.w} height={r.h} fill={`url(#${prefix}-level-floor)`}/></g>)}
    {level.currents.map((r,i)=><g key={i}><rect x={r.x} y={r.y} width={r.w} height={r.h} fill={`url(#${prefix}-current)`}/>{[0,1,2,3].map(n=><g key={n} transform={`translate(${r.x+35+(n%2)*77} ${r.y+45+Math.floor(n/2)*84}) rotate(${Math.atan2(r.dy,r.dx)*180/Math.PI-90})`}><g className="home-water-flow"><path d="M-4-12h8V8h8L0 20-12 8h8Z" fill={p.light} opacity=".5"/></g></g>)}<path d={`M${r.x} ${r.y}h${r.w}v3h-${r.w}Zm0 ${r.h-3}h${r.w}v3h-${r.w}Z`} fill={p.light}/></g>)}
    {level.jets.map((r,i)=><g key={i}><rect {...r} width={r.w} height={r.h} fill={p.dark}/>{Array.from({length:Math.floor(r.w/12)},(_,n)=><path key={n} d={`M${r.x+n*12+2} ${r.y+4}h5v${r.h-8}h-5Z`} fill={p.light}/>)}<g data-jet={i} display="none"><rect {...r} width={r.w} height={r.h} fill="#dfad6477"/><g data-jet-steam="" display="none"><path d={`M${r.x+14} ${r.y-22}h10v45h-10Zm24-11h13v57h-13Zm32-3h10v60h-10Zm27 7h11v51h-11Z`} fill="#fff1d1" opacity=".75"/></g></g></g>)}
    {level.solids.map((r,i)=><Cover key={i} level={level} {...r}/>)}
    {level.gates.map((r,i)=><g key={i} data-gate={i}><rect x={r.x-4} y={r.y} width={r.w+8} height="12" fill={p.dark}/>{Array.from({length:Math.floor(r.w/20)},(_,n)=><rect key={n} x={r.x+8+n*20} y={r.y-15} width="5" height="35" fill={p.light}/>)}<path d={`M${r.x} ${r.y+1}h${r.w}v3h-${r.w}Z`} fill={p.accent}/></g>)}
    {level.barrels.map((b,i)=><g key={i}><g data-barrel={i} transform={`translate(${b.x} ${b.y})`}><path d="M-13-17H13V12H-13Z" fill="#403c43"/><path d="M-11-15H11V10H-11Z" fill="#b76253"/><path d="M-11-12H11v4H-11Zm0 17H11v4H-11Z" fill="#746875"/><path d="M-8-15H6v2H-8Zm-3 5h3V4h-3Z" fill="#d97b70"/><path d="M-3-5h6v4h4v5H-7v-5h4Z" fill="#e4cc89"/></g><g data-explosion={i} display="none" transform={`translate(${b.x} ${b.y})`}><path d="M-15-82h30v22h27v17h27v25h17v35H61v23H37v24H12v17H-17V58H-42V37H-65V12H-82V-17H-60V-42H-37V-65h22Z" fill="#d97b70" opacity=".65"/><path d="M-12-43h26v15h25v21h10v24H28v21H7v10H-17V27H-38V5H-49V-16h21V-31h16Z" fill="#f4d889"/></g></g>)}
    <text x="240" y={level.height-35} textAnchor="middle" className="adventure-map-label adventure-map-light">{`УРОВЕНЬ ${id} · ${level.name.toUpperCase()}`}</text>
  </g>;
}

export function AdventureWeaponArt({ weapon, icon = false }: { weapon: AdventureWeapon; icon?: boolean }) {
  const drawing=weapon==="fist" ? <g><path d="M1-15h22v19h-4v9H3V4H-2V-8h3Z" fill="#343041"/><path d="M3-13h18V2h-4v9H5V2H0v-8h3Z" fill="#f3e2c0"/><path d="M6-12v11m5-11v11m5-11v11M4 2h13" fill="none" stroke="#a86739" strokeWidth="2"/></g> : weapon==="sabre" ? <g><path d="M-6-4H4v8H-6Z" fill="#775442"/><path d="M3-10h4v6h9v6H7v8H3Z" fill="#e4cc89"/><path d="M10-6h18v-3h15v-4h11v-6h7v9h-6v7h-9v5H28v3H10Z" fill="#343041"/><path d="M12-4h17v-3h15v-4h11v-5h3v5h-5v6h-8v5H29v3H12Z" fill="#a4b7b3"/><path d="M14-4h15v-2h16v-4h9v-3h3v3h-5v5h-9v4H29v2H14Z" fill="#fff1d1"/><path d="M-4-2h6v2h-6Z" fill="#d1aa7a"/></g> : <g><path d="M-4-12h37v15H12v4H6v11H-3V4H-6V-8h2Z" fill="#20232e"/><path d="M-2-10h32v9H11v4H4v12H0V1h-2Z" fill="#69838b"/><path d="M0-10h27v3H0Z" fill="#c7d6ce"/><path d="M1 4h3v11H1Z" fill="#775442"/><path d="M28-8h4v9h-4Z" fill="#263d45"/><path d="M9 3h8v7H9V8h5V5H9Z" fill="#20232e"/></g>;
  return icon ? <svg viewBox={weapon==="sabre"?"-8 -22 74 45":"-10 -20 48 42"} shapeRendering="crispEdges" aria-hidden="true">{drawing}</svg> : drawing;
}
