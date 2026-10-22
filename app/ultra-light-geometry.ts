import type {LevelRect} from './adventure-levels';
export type LightPoint={x:number;y:number};
export type RoomLight=LightPoint&{radius:number;color:string;strength:number};
const inside=(p:LightPoint,r:LevelRect)=>p.x>=r.x&&p.x<=r.x+r.w&&p.y>=r.y&&p.y<=r.y+r.h;
/** Ray/AABB slabs. Geometry is baked when a scene mounts, never in the frame loop. */
export function lightRayDistance(p:LightPoint,dx:number,dy:number,r:LevelRect){
 let near=-Infinity,far=Infinity;
 for(const [origin,direction,min,max] of [[p.x,dx,r.x,r.x+r.w],[p.y,dy,r.y,r.y+r.h]]){
  if(Math.abs(direction)<1e-10){if(origin<min||origin>max)return Infinity;continue;}
  const a=(min-origin)/direction,b=(max-origin)/direction;
  near=Math.max(near,Math.min(a,b));far=Math.min(far,Math.max(a,b));
 }
 return far>=Math.max(0,near)?Math.max(0,near):Infinity;
}
/** A bounded visibility fan: light stops at furniture, not at a screen overlay.
 * Lights mounted on an object ignore that object's footprint. */
export function lightVisibility(light:RoomLight,room:LevelRect,solids:readonly LevelRect[]):LightPoint[]{
 const blockers=solids.filter(r=>!inside(light,r)&&r.x<room.x+room.w&&r.x+r.w>room.x&&r.y<room.y+room.h&&r.y+r.h>room.y);
 const angles=Array.from({length:32},(_,i)=>i*Math.PI/16-Math.PI);
 for(const r of [room,...blockers])for(const x of [r.x,r.x+r.w])for(const y of [r.y,r.y+r.h]){
  const angle=Math.atan2(y-light.y,x-light.x);angles.push(angle-.0001,angle,angle+.0001);
 }
 return angles.sort((a,b)=>a-b).map(angle=>{
  const dx=Math.cos(angle),dy=Math.sin(angle);
  // The room boundary is an exit, whereas obstacles use the first entry.
  const tx=dx>0?(room.x+room.w-light.x)/dx:dx<0?(room.x-light.x)/dx:Infinity;
  const ty=dy>0?(room.y+room.h-light.y)/dy:dy<0?(room.y-light.y)/dy:Infinity;
  let distance=Math.min(light.radius,tx,ty);
  for(const r of blockers)distance=Math.min(distance,lightRayDistance(light,dx,dy,r));
  return {x:Math.round((light.x+dx*Math.max(0,distance))*10)/10,y:Math.round((light.y+dy*Math.max(0,distance))*10)/10};
 });
}
export function lightPolygon(points:readonly LightPoint[]){return points.length?'M'+points.map(p=>`${p.x} ${p.y}`).join('L')+'Z':'';}
/** Two nested, short shadows keep the contact point readable on a pixel grid. */
export function objectShadow(r:LevelRect,light:LightPoint,reach=48){
 const cx=r.x+r.w/2,cy=r.y+r.h/2,dist=Math.max(1,Math.hypot(cx-light.x,cy-light.y));
 const dx=Math.round((cx-light.x)/dist*reach),dy=Math.round((cy-light.y)/dist*reach);
 const points=[0,1].flatMap(i=>[0,1].flatMap(x=>[0,1].map(y=>({x:r.x+r.w*x+dx*i,y:r.y+r.h*y+dy*i})))).sort((a,b)=>a.x-b.x||a.y-b.y);
 const cross=(a:LightPoint,b:LightPoint,c:LightPoint)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
 const hull:LightPoint[]=[];
 for(const p of points){while(hull.length>=2&&cross(hull[hull.length-2],hull[hull.length-1],p)<=0)hull.pop();hull.push(p);}
 const lower=hull.length;
 for(let i=points.length-2;i>=0;i--){const p=points[i];while(hull.length>lower&&cross(hull[hull.length-2],hull[hull.length-1],p)<=0)hull.pop();hull.push(p);}
 hull.pop();return lightPolygon(hull);
}
