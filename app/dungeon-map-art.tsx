import { useId } from "react";
import type { AdventureLevel } from "./adventure-levels";
import type { AdventureView } from "./adventure-engine";
import { MAP_INK, pixelMapBox, PixelMapGoal, PixelMapPlayer } from "./pixel-map-symbols";

export function DungeonMapArt({level,view,player,cleared,gates}:{level:AdventureLevel;view:AdventureView;player:{x:number;y:number;angle?:number};cleared:boolean[];gates:boolean[]}) {
  const id=`plan-${useId().replaceAll(":","")}`,p=level.palette;
  const left=Math.min(...level.rooms.map(r=>r.x))-90,top=Math.min(...level.rooms.map(r=>r.y))-90;
  const width=Math.max(...level.rooms.map(r=>r.x+r.w))-left+90,height=Math.max(...level.rooms.map(r=>r.y+r.h))-top+90;
  const labelSize=Math.min(88,Math.max(52,width*.032));
  const lines=(name:string,roomWidth:number)=>{const limit=Math.max(8,Math.floor((roomWidth-45)/(labelSize*.48))),words=name.split(" "),out:string[]=[];let line="";for(const word of words){if(line&&(line+" "+word).length>limit){out.push(line);line=word;}else line=line?line+" "+word:word;}if(line)out.push(line);return out.length>2?[out[0],out.slice(1).join(" ").slice(0,limit-1)+"…"]:out;};
  return <svg className="dungeon-map atlas-map pixel-atlas" shapeRendering="crispEdges" viewBox={`${left} ${top} ${width} ${height}`} role="img" aria-label={`Карта: ${level.name}. Вы здесь — зал ${view.room+1}. ${view.objective}`}>
    <defs><pattern id={id} width="96" height="64" patternUnits="userSpaceOnUse"><rect width="96" height="64" fill={p.floor}/><path d="M0 0h96v6H0Zm0 58h96v6H0Zm0 0h6v64H0Zm90 0h6v64h-6Z" fill={p.dark}/><path d="M12 10h30v5H12Zm38 34h29v5H50Z" fill={p.light} opacity=".2"/></pattern></defs>
    <rect x={left} y={top} width={width} height={height} fill={MAP_INK}/>
    {level.floors.slice(level.rooms.length).map((f,i)=><g key={i}><rect x={f.x-8} y={f.y-8} width={f.w+16} height={f.h+16} fill={p.wall}/><rect x={f.x} y={f.y} width={f.w} height={f.h} fill={`url(#${id})`}/></g>)}
    {level.rooms.map((r,i)=><g key={i} data-map-room={i}>
      <path d={pixelMapBox(r.x+12,r.y+16,r.w,r.h,16)} fill="#20232e"/>
      <path d={pixelMapBox(r.x,r.y,r.w,r.h,16)} fill={i===view.room?"#f4d889":cleared[i]?"#88b6b0":p.wall}/>
      <path d={pixelMapBox(r.x+12,r.y+12,r.w-24,r.h-24,12)} fill={view.visited[i]?`url(#${id})`:p.dark}/>
      <path d={`M${r.x+24} ${r.y+24}h${r.w-48}v6h-${r.w-48}Zm0 0h6v${r.h-48}h-6Z`} fill={p.light} opacity=".35"/>
      <rect x={r.x+20} y={r.y+76} width={r.w-40} height="142" fill={p.dark}/>
      <text x={r.x+28} y={r.y+57} fill={i===view.room?"#f4d889":p.light} fontSize="52">{String(i+1).padStart(2,"0")}</text>
      <text x={r.x+r.w/2} y={r.y+129} textAnchor="middle" fill={view.visited[i]?"#fff1d1":"#a4b7b3"} fontSize={labelSize}>{lines(level.roomNames[i],r.w).map((line,j)=><tspan key={j} x={r.x+r.w/2} dy={j?labelSize*1.05:0}>{line}</tspan>)}</text>
      {cleared[i]&&<path d={`M${r.x+r.w-68} ${r.y+34}h12v12h12V22h12v36h-36Z`} fill="#b5d9b6"/>}
      {!view.visited[i]&&<text x={r.x+r.w-38} y={r.y+57} fill={p.light} fontSize="52" textAnchor="middle">?</text>}
    </g>)}
    {level.gates.map((g,i)=>!gates[i]&&<g key={i}><rect x={g.x-5} y={g.y-5} width={g.w+10} height={g.h+10} fill="#775442"/>{[0,1,2].map(n=><rect key={n} x={g.axis==="x"?g.x+g.w/2-6:g.x+g.w*(n+1)/4-4} y={g.axis==="y"?g.y+g.h/2-6:g.y+g.h*(n+1)/4-4} width={g.axis==="x"?12:8} height={g.axis==="y"?12:8} fill="#e6a071"/>)}</g>)}
    <g transform={`translate(${level.exit.x} ${level.exit.y})`} data-map-exit=""><path d={pixelMapBox(-36,-36,72,72,8)} fill={MAP_INK}/><rect x="-28" y="-28" width="56" height="56" fill={view.canFinish?"#88b6b0":"#617c7a"}/><path d="M-6-22H6v8h8v8h8V6H6v16H-6V6h-16V-6h8v-8h8Z" fill="#fff1d1"/></g>
    {view.goal&&<g transform={`translate(${view.goal.x} ${view.goal.y})`} data-map-goal=""><PixelMapGoal/></g>}
    <PixelMapPlayer x={player.x} y={player.y} angle={player.angle??-Math.PI/2}/>
  </svg>;
}
