import type {AdventureLevel} from './adventure-levels';

/** Preserve the authored room graph, but spend screen space on readable nodes
 * rather than the physical size of each chamber. No game coordinates change. */
export function dungeonMapLayout(level:AdventureLevel){
 const xs=[...new Set(level.rooms.map(r=>r.x+r.w/2))].sort((a,b)=>a-b);
 const ys=[...new Set(level.rooms.map(r=>r.y+r.h/2))].sort((a,b)=>a-b);
 const rooms=level.rooms.map(r=>({x:16+xs.indexOf(r.x+r.w/2)*132,y:16+ys.indexOf(r.y+r.h/2)*108,w:116,h:84}));
 const center=(i:number)=>({x:rooms[i].x+58,y:rooms[i].y+42});
 const project=(p:{x:number;y:number})=>{
  const room=level.rooms.findIndex(r=>p.x>=r.x&&p.x<=r.x+r.w&&p.y>=r.y&&p.y<=r.y+r.h);
  if(room>=0){const r=level.rooms[room],n=rooms[room];return {x:n.x+18+Math.max(0,Math.min(1,(p.x-r.x)/r.w))*(n.w-36),y:n.y+29+Math.max(0,Math.min(1,(p.y-r.y)/r.h))*(n.h-43)};}
  // A player in a passage belongs on the connecting line, not in another room.
  let best={x:58,y:42},distance=Infinity;
  for(const gate of level.gates){
   const a=level.rooms[gate.from],b=level.rooms[gate.to],ax=a.x+a.w/2,ay=a.y+a.h/2,dx=b.x+b.w/2-ax,dy=b.y+b.h/2-ay;
   const t=Math.max(0,Math.min(1,((p.x-ax)*dx+(p.y-ay)*dy)/(dx*dx+dy*dy||1)));
   const d=(p.x-ax-dx*t)**2+(p.y-ay-dy*t)**2;
   if(d<distance){distance=d;const na=center(gate.from),nb=center(gate.to);best={x:na.x+(nb.x-na.x)*t,y:na.y+(nb.y-na.y)*t};}
  }
  return best;
 };
 return {rooms,center,project,width:xs.length*132+16,height:ys.length*108+16};
}
