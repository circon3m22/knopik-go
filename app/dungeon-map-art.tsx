import type {AdventureLevel} from './adventure-levels';
import type {AdventureView} from './adventure-engine';
import {pixelMapBox,PixelMapGoal,PixelMapPlayer} from './pixel-map-symbols';
import {dungeonMapLayout} from './dungeon-map-layout';

export function DungeonMapArt({level,view,player,partner,cleared,gates,selectedRoom=view.room,onSelectRoom}:{level:AdventureLevel;view:AdventureView;partner?:{x:number;y:number;name:string};player:{x:number;y:number;angle?:number};cleared:boolean[];gates:boolean[];selectedRoom?:number;onSelectRoom?:(room:number)=>void}){
 const map=dungeonMapLayout(level),position=map.project(player),goal=view.goal&&map.project(view.goal),exit=map.project(level.exit),friend=partner&&map.project(partner);
 return <svg className="dungeon-map atlas-map pixel-atlas" viewBox={`0 0 ${map.width} ${map.height}`} shapeRendering="crispEdges" role={onSelectRoom?'group':'img'} aria-label={`Карта: ${level.name}. Вы здесь — зал ${view.room+1}. ${view.objective}`}>
  <rect width={map.width} height={map.height} fill="#142a35"/>
  {level.gates.map((gate,i)=>{const a=map.center(gate.from),b=map.center(gate.to),x=(a.x+b.x)/2,y=(a.y+b.y)/2;return <g key={i} data-map-gate={i} data-open={gates[i]?'true':'false'}>
   <path d={`M${a.x} ${a.y}H${b.x}V${b.y}`} fill="none" stroke="#223e4a" strokeWidth="14"/>
   <path d={`M${a.x} ${a.y}H${b.x}V${b.y}`} fill="none" stroke={gates[i]?'#709b8a':'#b48c60'} strokeWidth="4" strokeDasharray={gates[i]?undefined:'4 4'}/>
   {!gates[i]&&<g transform={`translate(${x} ${y})`}><path d="M-7-5H7V7H-7Z" fill="#b48c60"/><path d="M-4-9H4v5H2v-3H-2v3H-4Z" fill="#e5c696"/><path d="M-1-1H1V3H-1Z" fill="#1b313c"/></g>}
  </g>;})}
  {map.rooms.map((room,i)=>{const current=i===view.room,selected=i===selectedRoom,visited=view.visited[i];return <g key={i} data-map-room={i} data-selected={selected?'true':'false'} role={onSelectRoom?'button':undefined} tabIndex={onSelectRoom?0:undefined} aria-label={`Зал ${i+1}: ${level.roomNames[i]}. ${current?'Вы здесь. ':''}${cleared[i]?'Зачищен':visited?'Исследован':'Не исследован'}`} aria-pressed={onSelectRoom?selected:undefined} onClick={()=>onSelectRoom?.(i)} onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();onSelectRoom?.(i);}}}>
   <title>{level.roomNames[i]}</title>
   <path d={pixelMapBox(room.x,room.y,room.w,room.h,6)} fill={selected?'#d4e7cb':current?'#92c2b4':cleared[i]?'#628f7e':'#49606c'}/>
   <path d={pixelMapBox(room.x+2,room.y+2,room.w-4,room.h-4,6)} fill={current?'#294d53':cleared[i]?'#294a45':'#1c343f'}/>
   <path d={`M${room.x+10} ${room.y+26}h${room.w-20}v1h-${room.w-20}Z`} fill={current?'#8abca7':'#47616b'}/>
   <text x={room.x+12} y={room.y+19} fontSize="16" fill={selected?'#eff4dc':'#a9c3bb'}>{String(i+1).padStart(2,'0')}</text>
   <text x={room.x+room.w-12} y={room.y+18} textAnchor="end" fontSize="10" fill="#b2c8ba">{current?'ВЫ ЗДЕСЬ':cleared[i]?'ПРОЙДЕН':visited?'ОТКРЫТ':'?'}</text>
   <path d={`M${room.x+12} ${room.y+room.h-10}h${room.w-24}v1h-${room.w-24}Z`} fill="#324d57"/>
  </g>;})}
  {goal&&<g data-map-goal="" transform={`translate(${goal.x} ${goal.y})`}><g transform="scale(.23)"><PixelMapGoal/></g></g>}
  <g data-map-exit="" transform={`translate(${exit.x} ${exit.y})`}><path d="M-10-10H10V10H-10Z" fill="#152a35"/><path d="M-8-8H8V8H-8Z" fill="#91b9a2"/><path d="M-4 5V-5H4V5H2V-3H-2V5Z" fill="#17313c"/><path d="M-1-9H1v-4h3L0-17-4-13h3Z" fill="#e5d9a5"/></g>
  {partner&&friend&&<g data-map-partner="" transform={`translate(${friend.x} ${friend.y})`} aria-label={`Напарник: ${partner.name}`}><path d="M-9-7h18V7H-9Z" fill="#17313b" stroke="#9dcfc4" strokeWidth="2"/><text y="4" textAnchor="middle" fontSize="13" fill="#e5f1d7">2</text></g>}
  <PixelMapPlayer x={position.x} y={position.y} angle={player.angle??-Math.PI/2} scale={.22}/>
 </svg>;
}
