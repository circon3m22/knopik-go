import type {AdventureLevel,LevelRect} from './adventure-levels';
import type {PixelMaterial} from './ultra-pixel-material';
export const zoneFloorMaterial=(zone:number):PixelMaterial=>(['stone','brick','metal','porcelain','crystal','moss','stone'] as const)[(zone-1)%7];
/** Authored architectural relief at the wall, not random marks across combat. */
export function UltraRoomArchitecture({level,room}:{level:AdventureLevel;room:number}){
 const r=level.rooms[room],p=level.palette,stone:string[]=[],shade:string[]=[],trim:string[]=[],metal:string[]=[],plants:string[]=[];
 for(let x=r.x+12,i=0;x<r.x+r.w-20;x+=64,i++){
  stone.push(`M${x} ${r.y-48}h49v32h-49Z`);shade.push(`M${x+3} ${r.y-20}h43v4h-43Zm40-25h6v25h-6Z`);trim.push(`M${x+3} ${r.y-46}h41v2h-41Z`);
  if(level.zone===3||level.zone===5){metal.push(`M${x+14} ${r.y-40}h25v16h-25Zm-4 3h3v10h-3Z`);trim.push(`M${x+18} ${r.y-36}h17v2h-17Zm0 5h10v1h-10Z`);}
  else if(level.zone===6&&i%2===0)plants.push(`M${x+2} ${r.y-44}h4v24h8v5h-9v15h-4v-19h-7v-6h8Zm9 11h7v4h-7Z`);
 }
 for(const x of[r.x-11,r.x+r.w+2]){stone.push(`M${x} ${r.y-58}h9v${r.h+64}h-9Z`);trim.push(`M${x} ${r.y-58}h2v${r.h+58}h-2Z`);for(let y=r.y-41;y<r.y+r.h;y+=27)shade.push(`M${x+1} ${y}h7v2h-7Z`);}
 return <g data-room-detail={room} data-ultra-architecture={level.zone} pointerEvents="none"><path d={stone.join('')} fill={p.wall}/><path d={shade.join('')} fill={p.dark}/><path d={trim.join('')} fill={p.light} opacity=".7"/><path d={metal.join('')} fill={p.dark}/><path d={plants.join('')} fill="#527258"/>
 <path d={`M${r.x-12} ${r.y-62}h${r.w+24}v5h-${r.w+24}Zm0 ${r.h+66}h${r.w+24}v4h-${r.w+24}Z`} fill={p.dark}/><path d={`M${r.x-10} ${r.y-58}h${r.w+20}v2h-${r.w+20}Z`} fill={p.light}/></g>;
}
export function UltraRoomAtmosphere({r,room,zone}:{r:LevelRect;room:number;zone:number}){return <g data-room-detail={room} data-ultra-atmosphere={zone} data-atmosphere-room={room} data-x={r.x} data-y={r.y} data-w={r.w} data-h={r.h} pointerEvents="none"><path data-ultra-motes="" fill={zone===2?'#efb06d':zone===6?'#acb77e':'#d5e1cc'}/><path data-ultra-drift="" fill={zone===2?'#705e55':zone===6?'#64835c':'#719eaa'} opacity=".42"/></g>;}
export function ultraAtmospherePaths(zone:number,r:LevelRect,time:number){
 let motes='',drift='';const n=zone===6?13:zone===2?12:8;
 for(let i=0;i<n;i++){const phase=(time*(zone===2?.4:.16)+i*.173)%1,xx=r.x+32+(i*103+Math.floor(i/3)*37)%Math.max(1,r.w-64);let x=xx,y=r.y+70+phase*(r.h-110);
  if(zone===2){x=r.x+(i%2?r.w-74:74)+Math.sin(phase*5+i)*15;y=r.y+r.h*.38-phase*70;}
  else if(zone===4){x=r.x+28+(i%2)*(r.w-56);y=r.y+90+phase*68;}
  else if(zone===6)x+=Math.sin(phase*7+i)*14;
  else if(zone===0){x=r.x+70+(i*31)%(Math.max(1,r.w*.38));y=r.y+45+phase*120;}
  x=Math.round(x);y=Math.round(y);
  if(zone===6)drift+=`M${x} ${y}h4v-2h3v4h-3v2h-4Z`;
  else if(zone===2&&i%3===0)drift+=`M${x-3} ${y-13}h8v-3h7v7h-5v3h-10Z`;
  else if(zone===4)drift+=`M${x} ${y}h2v${3+phase*5|0}h-2Z`;
  else motes+=`M${x} ${y}h${i%3?1:2}v${zone===2?2:1}h-${i%3?1:2}Z`;
 }
 return {motes,drift};
}
