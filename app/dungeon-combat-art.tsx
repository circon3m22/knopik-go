import type { AdventureLevel } from "./adventure-levels";
import { projectAdventureY } from "./adventure-projection";
import type { DungeonSpawn } from "./adventure-levels";

export function DungeonEnemyEquipment({role,boss,zone}:{role?:DungeonSpawn["role"];boss?:boolean;zone:number}){
  return <g>
    {role==="armored"&&<><path d="M-19-80h38v10h-38Z" fill="#303a48"/><path d="M-15-77h30v6h-30Z" fill="#a1b0a8"/><path d="M-18-57h36v22h-36Z" fill="#303a48"/><path d="M-14-54h28v14h-28Z" fill="#7d9599"/><path d="M-2-55h4v17h-4Zm-12 4h3v3h-3Zm24 0h3v3h-3Z" fill="#cad6bd"/></>}
    {role==="stalker"&&<g data-enemy-role="stalker"><path d="M-23-83h46v12h-46Z M-21-58h42v24h-42Z" fill="#284c38"/><path d="M-18-79h36v5h-36Z M-17-54h34v13h-34Z" fill="#7d945d"/><path d="M-14-75h9v3h-9Zm19 0h9v3H5Z" fill="#f1d083"/><path d="M-19-39h38v4h-38Z" fill="#b99c68"/></g>}
    {role==="marksman"&&<g data-enemy-role="marksman"><path d="M-21-83h42v9h-42Z M-17-59h34v24h-34Z" fill="#344953"/><path d="M-17-80h34v4h-34Z M-13-55h26v16h-26Z" fill="#79999b"/><path d="M4-76h14v5H4Z" fill="#dca17b"/><path d="M7-75h8v2H7Z" fill="#fff1c9"/><path d="M-11-51h4v8h-4Zm18 0h4v8H7Z" fill="#e0cc9c"/></g>}
    {role==="charger"&&<><path d="M-17-77h34v5h-34Z" fill="#d97b70"/><path d="M-19-74h7v5h-7Zm31 0h7v5h-7Z" fill="#f4d889"/></>}
    {role==="demolisher"&&<><path d="M-18-41h36v9h-36Z" fill="#34444c"/>{[-11,0,11].map(x=><g key={x} transform={`translate(${x} -40)`}><path d="M-3-5h6v13h-6Z" fill="#b76253"/><path d="M-3-1h6v2h-6Z" fill="#e4cc9b"/></g>)}</>}
    {boss&&<>
      <path d="M-23-56h46v24h-46Z" fill="#303a48"/><path d="M-19-52h38v17h-38Z" fill={zone===2?"#ab805d":zone===3?"#aa7068":zone===4?"#6a979c":zone===5?"#83779b":"#748a76"}/><path d="M-14-49h28v3h-28Z" fill="#cbd6b9"/>
      {zone===4&&<><path d="M-23-92h46v27h-46Z" fill="#456878"/><path d="M-18-87h36v16h-36Z" fill="#a6cfca"/><path d="M-12-83h24v8h-24Z" fill="#283949"/><path d="M-29-79h6v17h-6Zm52 0h6v17h-6Z" fill="#adc8b7"/></>}
      {zone===5&&<><path d="M-21-83h42v8h-42Z" fill="#57476d"/><path d="M-17-81h34v4h-34Z" fill="#a4dedd"/><path d="M-5-55H5v18H-5Z" fill="#a4dedd"/></>}
    </>}
  </g>;
}

export function DungeonHazards({level}:{level:AdventureLevel}){
  const p=level.palette;
  return <g>{level.hazards.map((h,i)=><g key={i} data-dungeon-hazard={i} transform={`translate(${h.x} ${h.y})`}>
    <g data-hazard-body="">
      {h.kind==="steam"?<><rect width={h.w} height={h.h} fill={p.dark}/>{Array.from({length:Math.floor(h.w/14)},(_,n)=><path key={n} d={`M${n*14+4} 4h4v${h.h-8}h-4Z`} fill={p.light}/>)}</>:h.kind==="laser"?<><path d={`M-12-7h17v${h.h+14}h-17Zm${h.w+6} 0h17v${h.h+14}h-17Z`} fill={p.dark}/><path d={`M-9 0h11v${h.h}h-11Zm${h.w+18} 0h11v${h.h}h-11Z`} fill="#8da2ac"/><rect x="-1" y={h.h/2-2} width={h.w+2} height="4" fill="#6f7783" opacity=".4"/></>:h.kind==="mine"?<><path d="M-3 8H2V1h22v7h6v14h-6v5H2v-5h-5Z" fill="#283442"/><path d="M1 9h25v12H1Z" fill="#758779"/><path d="M10 7h6v7h-6Z" fill="#d97b70"/></>:h.kind==="crusher"?<><rect width={h.w} height={h.h} fill={p.dark} opacity=".6"/><path d={`M0-27h${h.w}v23H0Z`} fill="#374351"/><path d={`M5-24h${h.w-10}v13H5Z`} fill="#8c9ca4"/><path d={`M12-20h6v7h-6Zm${h.w-37} 0h6v7h-6Z`} fill="#ccd0b7"/></>:<><rect width={h.w} height={h.h} fill={p.dark}/>{Array.from({length:12},(_,n)=><path key={n} d={`M${8+n%4*21} ${10+Math.floor(n/4)*22}h11v9h-11Z`} fill="#9ca398"/>)}</>}
    </g>
    <g data-hazard-warning="" display="none"><rect x="-8" y="-8" width={h.w+16} height={h.h+16} fill="#efac592e" stroke="#efac59" strokeWidth="3" strokeDasharray="10 5"/><path d={`M${h.w/2-3} ${h.h/2-9}h6v11h-6Zm0 15h6v5h-6Z`} fill="#fff1d1"/></g>
    <g data-hazard-active="" display="none">
      {h.kind==="steam"?<>{[0,1,2,3].map(n=><g key={n} transform={`translate(${12+n*(h.w-24)/4} 0)`} className="dungeon-steam"><path d="M-5-44h12v14h8v31H-9v-23h4Z" fill="#eef1d3" opacity=".8"/><path d="M-2-34h5v23h-5Z" fill="#fff1d1"/></g>)}</>:h.kind==="laser"?<><rect x="-2" y="-6" width={h.w+4} height={h.h+12} fill="#ef887345"/><rect y={h.h/2-4} width={h.w} height="8" fill="#f8b680"/><rect y={h.h/2-1} width={h.w} height="2" fill="#fff1d1"/></>:h.kind==="crusher"?<><rect width={h.w} height={h.h} fill="#303b49"/><rect x="4" y="4" width={h.w-8} height={h.h-14} fill="#8fa1a5"/><path d={`M8 8h${h.w-16}v7H8Z`} fill="#c8d0b9"/><path d={`M8 ${h.h-26}h${h.w-16}v10H8Z`} fill="#d3b071"/></>:h.kind==="spikes"?<>{Array.from({length:12},(_,n)=><g key={n} transform={`translate(${13+n%4*21} ${18+Math.floor(n/4)*22})`}><path d="M-7 3 0-15 7 3Z" fill="#d0d7c4"/><path d="M0-12 4 2H0Z" fill="#6f8590"/></g>)}</>:<circle cx="13" cy="13" r="24" fill="#d97b70" opacity=".6"/>}
    </g>
  </g>)}</g>;
}

export function DungeonInteractiveProps({level}:{level:AdventureLevel}){
  const p=level.palette;
  return <>
    {level.tasks.map((t,i)=><g key={i} data-dungeon-task={i} data-dungeon-prop-y={t.y} transform={`translate(${t.x} ${projectAdventureY(t.y)})`}>
      <ellipse rx="29" ry="11" fill="#17232e" opacity=".35"/>
      {t.kind==="valve"?<><path d="M-7-16H7v18H-7Z" fill="#344453"/><path d="M-29-28h58v12h-58Z" fill="#8d9ca1"/><path d="M-28-27h56v3h-56Z" fill="#bfd3b6"/><circle cy="-32" r="18" fill="#343b44"/><circle cy="-32" r="14" fill="none" stroke={p.accent} strokeWidth="5"/><path d="M-2-46h4v28h-4Zm-12 12h28v4h-28Z" fill={p.accent}/></>:t.kind==="key"?<><path d="M-17-16h34v10h-34Z" fill={p.dark}/><path d="M-12-32h24v19h-24Z" fill="#d3b071"/><path d="M-8-28H8v4H-8Zm3 6h10v4H-5Z" fill="#fff1d1"/><path d="M-5-35H5v4H-5Z" fill="#7f9897"/></>:t.kind==="charge"?<><path d="M-25-12h50v14h-50Z" fill={p.dark}/><path d="M-21-27h42v18h-42Z" fill="#ab6a5c"/><path d="M-19-23h38v3h-38Zm7-7h5v24h-5Zm18 0h5v24H6Z" fill="#d3b071"/><path d="M-4-30h8v16h-8Z" fill="#344453"/><path d="M-2-26h4v7h-4Z" fill="#ed8873"/></>:<><path d="M-24-23h48V1h-48Z" fill={p.dark}/><path d="M-19-52h38v31h-38Z" fill="#a7b6ad"/><path d="M-16-48h32v21h-32Z" fill="#324758"/><path d="M-12-43h22v2h-22Zm0 6h14v2h-14Z" fill={p.accent}/><path d="M-15-17h8v5h-8Zm21 0h8v5H6Z" fill="#88a980"/><path d="M-14-5h28v3h-28Z" fill={p.light}/></>}
      <g data-task-ready=""><path d="M-11-89h22v22H3v6h-6v-6h-8Z" fill={p.dark}/><path d="M-8-86H8v16H-8Z" fill={p.accent}/><text data-task-marker="" x="0" y="-73" textAnchor="middle" fontSize="17" fill={p.dark}>!</text></g>
      <g data-task-done="" display="none"><path d="M-11-64h22v20h-22Z" fill="#344e4e"/><path d="M-7-56h4v4h4v-9h4v13H-7Z" fill="#afcdb0"/></g>
      <g data-task-running="" display="none"><circle data-task-progress="" cy="-31" r="34" fill="none" stroke={p.accent} strokeWidth="4" strokeDasharray="0 214" transform="rotate(-90 0 -31)"/></g>
      <g data-charge-danger="" display="none"><ellipse rx="116" ry="95" fill="#d97b7026" stroke="#e6a071" strokeWidth="3" strokeDasharray="12 6"/></g>
    </g>)}
    {level.medkits.map((k,i)=><g key={i} data-dungeon-medkit={i} data-dungeon-prop-y={k.y} transform={`translate(${k.x} ${projectAdventureY(k.y)})`}><ellipse rx="20" ry="8" fill="#17232e" opacity=".3"/><path d="M-16-23h32V0h-32Z" fill="#416159"/><path d="M-12-20h24v16h-24Z" fill="#b8cba2"/><path d="M-3-18h6v12h-6Zm-4 3H7v6H-7Z" fill="#eff1d3"/><path d="M-5-27H5v5H-5Z" fill="#a7b6ad"/></g>)}
    <g data-dungeon-exit="" data-dungeon-prop-y={level.exit.y} transform={`translate(${level.exit.x} ${projectAdventureY(level.exit.y)})`}><ellipse rx="66" ry="24" fill={p.dark} opacity=".45"/><path d="M-53-65H53V9H-53Z" fill={p.dark}/><path d="M-47-59H47V3H-47Z" fill="#536d77"/><path d="M-35-53H35V-9H-35Z" fill="#273b4b"/>{[-24,-8,8,24].map(x=><path key={x} d={`M${x}-50h4v38h-4Z`} fill="#8d9f9b"/>)}<path d="M-39-6h78v4h-78Z" fill={p.light}/><text y="26" textAnchor="middle" fontSize="15" fill={p.light}>ПОДЪЁМНИК</text><g data-exit-ready="" display="none"><path d="M-8-88H8v8h11L0-58-19-80h11Z" fill="#b5d9b6"/></g></g>
  </>;
}

export function DungeonEffectsArtwork(){return <g aria-hidden="true">
  {Array.from({length:12},(_,i)=><g key={`arc-${i}`} data-dungeon-arc={i} display="none"><path data-arc-outer="" fill="none" stroke="#88c9d1" strokeWidth="7" opacity=".6"/><path data-arc-inner="" fill="none" stroke="#fff1d1" strokeWidth="2"/></g>)}
  {Array.from({length:36},(_,i)=><g key={i} data-dungeon-effect={i} display="none">
    <g data-fx-smoke="" display="none"><path d="M-33-29h22v-13h24v11h23v18h12v27H31v17H10v9H-14V28h-24V10h-10v-22h15Z" fill="#283342"/><path d="M-23-21h17v-10h16v8h15V-7h11V11H18v10H-5v-7h-24V-6h6Z" fill="#67707a" opacity=".8"/></g>
    <g data-fx-fire="" display="none"><path d="M-12-62h25v18h22v-12h11v27h22v19H56v28H36v23H11v15H-13V38h-23V19h-23V-9h15v-22h19v-15h13Z" fill="#e78b69" opacity=".7"/><path d="M-9-44h20v16h18v15h17V9H23v19H6v13H-10V24h-19V7h-16v-19h19v-17h17Z" fill="#efbb69"/><path d="M-7-25H8v12h18V3H11v17H-8V8h-17V-8h18Z" fill="#fff1d1"/></g>
    <ellipse data-fx-ring="" display="none" rx="68" ry="52" fill="none" stroke="#f4d889" strokeWidth="3"/>
    <g data-fx-debris="" display="none">{Array.from({length:8},(_,n)=><g key={n} data-fx-fragment={n}><path d="M-3-3h7v5H1v3h-4Z" fill={n%3===0?"#f4d889":n%3===1?"#9caa9b":"#a67b59"}/></g>)}</g>
    <g data-fx-hit="" display="none"><path d="M-3-25h6v12h-6Zm0 38h6v12h-6Zm-22-16h12v6h-12Zm38 0h12v6H13Z" fill="#f4d889"/><path d="M-4-13H4v9h9V4H4v9H-4V4h-9V-4h9Z" fill="#fff1d1"/></g>
    <g data-fx-dust="" display="none"><path d="M-24-7h14v-6h15v6h17v8h10v8H16v7H-4v-5h-18V4h-10v-9h8Z" fill="#b6ba9b" opacity=".6"/></g>
    <g data-fx-heal="" display="none"><path d="M-4-24H4v12h12v8H4V8H-4V-4h-12v-8h12Z" fill="#b5d9b6"/><path d="M-2-21H2v12h11v2H2V5H-2V-7h-11v-2h11Z" fill="#fff1d1"/></g>
    <g data-fx-shell="" display="none"><path d="M-4-2h8v4h-8Z" fill="#d3b071"/><path d="M-4-2h3v4h-3Z" fill="#fff1d1"/></g>
  </g>)}
</g>;}
