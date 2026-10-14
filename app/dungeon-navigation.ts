import type { AdventureEngine } from "./adventure-engine";
import { projectAdventureY } from "./adventure-projection.ts";
export type CameraRect={x:number;y:number;w:number;h:number};
/** Find an open route, so the exit arrow does not send Knopik into a wall. */
export function dungeonExitTarget(engine:AdventureEngine){
  const level=engine.levelData,start=engine.room,end=level.exit.room;
  if(start===end)return level.exit;
  const parents=new Map<number,{from:number;gate:number}>(),queue=[start];parents.set(start,{from:-1,gate:-1});
  for(let n=0;n<queue.length&&!parents.has(end);n++)for(let i=0;i<level.gates.length;i++){
    const g=level.gates[i],next=g.from===queue[n]?g.to:g.to===queue[n]?g.from:-1;
    if(next<0||parents.has(next)||!engine.gateOpen(i))continue;
    parents.set(next,{from:queue[n],gate:i});queue.push(next);
  }
  if(!parents.has(end))return level.exit;
  let next=end;while(parents.get(next)!.from!==start)next=parents.get(next)!.from;
  const gate=level.gates[parents.get(next)!.gate],a=level.rooms[start],b=level.rooms[next];
  const dx=b.x+b.w/2-a.x-a.w/2,dy=b.y+b.h/2-a.y-a.h/2,x=gate.x+gate.w/2,y=gate.y+gate.h/2;
  // Continue across a threshold until the engine detects the next room.
  const crossed=(engine.player.x-x)*dx+(engine.player.y-y)*dy>-36*Math.hypot(dx,dy);
  return crossed?{x:x+Math.sign(dx)*120,y:y+Math.sign(dy)*120}:{x,y};
}
export function exitPointerPose(camera:CameraRect,player:{x:number;y:number},target:{x:number;y:number}){
  const left=camera.x+36,right=camera.x+camera.w-36,top=camera.y+Math.min(70,camera.h*.2),bottom=camera.y+camera.h-Math.min(94,camera.h*.23);
  const origin={x:Math.max(left,Math.min(right,player.x)),y:Math.max(top,Math.min(bottom,projectAdventureY(player.y)-28))};
  const tx=target.x,ty=projectAdventureY(target.y)-25,dx=tx-origin.x,dy=ty-origin.y,len=Math.hypot(dx,dy)||1;
  let x=tx-dx/len*48,y=ty-dy/len*48;
  if(tx<left||tx>right||ty<top||ty>bottom){
    const scale=Math.min(dx>0?(right-origin.x)/dx:dx<0?(left-origin.x)/dx:Infinity,dy>0?(bottom-origin.y)/dy:dy<0?(top-origin.y)/dy:Infinity);
    x=origin.x+dx*scale;y=origin.y+dy*scale;
  }
  return {x:Math.max(left,Math.min(right,x)),y:Math.max(top,Math.min(bottom,y)),angle:Math.atan2(dy,dx)*180/Math.PI};
}
