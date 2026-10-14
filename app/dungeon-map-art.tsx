import { useId } from "react";
import type { AdventureLevel } from "./adventure-levels";
import type { AdventureView } from "./adventure-engine";

export function DungeonMapArt({level,view,player,cleared,gates}:{level:AdventureLevel;view:AdventureView;player:{x:number;y:number;angle?:number};cleared:boolean[];gates:boolean[]}) {
  const id=`plan-${useId().replaceAll(":","")}`,p=level.palette;
  const left=Math.min(...level.rooms.map(r=>r.x))-90,top=Math.min(...level.rooms.map(r=>r.y))-90;
  const width=Math.max(...level.rooms.map(r=>r.x+r.w))-left+90,height=Math.max(...level.rooms.map(r=>r.y+r.h))-top+90;
  const labelSize=Math.min(88,Math.max(52,width*.032));
  const lines=(name:string,roomWidth:number)=>{const limit=Math.max(8,Math.floor((roomWidth-45)/(labelSize*.48))),words=name.split(" "),out:string[]=[];let line="";for(const word of words){if(line&&(line+" "+word).length>limit){out.push(line);line=word;}else line=line?line+" "+word:word;}if(line)out.push(line);return out.length>2?[out[0],out.slice(1).join(" ").slice(0,limit-1)+"…"]:out;};
  return <svg className="dungeon-map atlas-map" viewBox={`${left} ${top} ${width} ${height}`} role="img" aria-label={`Карта: ${level.name}. Вы здесь — зал ${view.room+1}. ${view.objective}`}>
    <defs><pattern id={id} width="64" height="64" patternUnits="userSpaceOnUse"><path d="M64 0H0v64" fill="none" stroke="#30414f" strokeWidth="2"/></pattern></defs>
    <rect x={left} y={top} width={width} height={height} fill="#101c29"/><rect x={left} y={top} width={width} height={height} fill={`url(#${id})`}/>
    {level.floors.slice(level.rooms.length).map((f,i)=><g key={i}><rect x={f.x-8} y={f.y-8} width={f.w+16} height={f.h+16} fill="#526779"/><rect x={f.x} y={f.y} width={f.w} height={f.h} fill="#233746"/></g>)}
    {level.rooms.map((r,i)=><g key={i} data-map-room={i}>
      <rect x={r.x+10} y={r.y+14} width={r.w} height={r.h} rx="12" fill="#080f18"/>
      <rect x={r.x} y={r.y} width={r.w} height={r.h} rx="12" fill={view.visited[i]?p.dark:"#1a2836"} stroke={i===view.room?"#f5df9c":cleared[i]?"#72baa8":"#536b7f"} strokeWidth={i===view.room?9:5}/>
      <rect x={r.x+14} y={r.y+14} width={r.w-28} height={r.h-28} rx="5" fill="none" stroke={p.light} strokeOpacity={view.visited[i]?.28:.09} strokeWidth="3"/>
      <path d={`M${r.x+20} ${r.y+67}H${r.x+r.w-20}`} stroke="#536b7f" strokeOpacity=".6" strokeWidth="2"/>
      <text x={r.x+28} y={r.y+48} fill={i===view.room?"#f5df9c":"#c5d1d8"} fontSize="52">{String(i+1).padStart(2,"0")}</text>
      <text x={r.x+r.w/2} y={r.y+125} textAnchor="middle" fill={view.visited[i]?"#d7e4e7":"#8599a8"} fontSize={labelSize}>{lines(level.roomNames[i],r.w).map((line,j)=><tspan key={j} x={r.x+r.w/2} dy={j?labelSize*1.05:0}>{line}</tspan>)}</text>
      {cleared[i]&&<path d={`M${r.x+r.w-57} ${r.y+35}l10 11 22-24`} stroke="#83d4b5" strokeWidth="7" fill="none"/>}
      {!view.visited[i]&&<text x={r.x+r.w-38} y={r.y+48} fill="#718596" fontSize="52" textAnchor="middle">?</text>}
    </g>)}
    {level.gates.map((g,i)=>!gates[i]&&<g key={i}><rect x={g.x-5} y={g.y-5} width={g.w+10} height={g.h+10} fill="#d99972" stroke="#392a2b" strokeWidth="5"/><path d={`M${g.x+g.w/2-9} ${g.y+g.h/2-15}v-8h18v8m-23 0h28v24h-28Z`} fill="#352c32" stroke="#f0b48d" strokeWidth="4"/></g>)}
    <g transform={`translate(${level.exit.x} ${level.exit.y})`} data-map-exit=""><rect x="-30" y="-30" width="60" height="60" rx="8" fill={view.canFinish?"#7fd4b5":"#406575"} stroke="#c0eadb" strokeWidth="5"/><path d="M-15 8 0-8 15 8M0-7v25" fill="none" stroke="#eff8e8" strokeWidth="6"/></g>
    {view.goal&&<g transform={`translate(${view.goal.x} ${view.goal.y})`} data-map-goal=""><circle r="49" fill="#efd98b" fillOpacity=".15"/><path d="M0-30 25 0 0 30-25 0Z" fill="#f5df9c" stroke="#715538" strokeWidth="5"/><circle r="6" fill="#574734"/></g>}
    <g transform={`translate(${player.x} ${player.y})`} data-map-player=""><circle r="49" fill="#82d6ef" fillOpacity=".18"/><circle r="29" fill="#152d40" stroke="#d6f0f4" strokeWidth="5"/><path d="M24 0-15-15-6 0-15 15Z" transform={`rotate(${(player.angle??-Math.PI/2)*180/Math.PI})`} fill="#e7fbfc"/></g>
  </svg>;
}
