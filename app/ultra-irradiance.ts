import type {LevelRect} from './adventure-levels';
import {lightRayDistance,type LightPoint,type RoomLight} from './ultra-light-geometry.ts';
export type Irradiance={color:string;energy:number;light:RoomLight};
const contains=(p:LightPoint,r:LevelRect)=>p.x>=r.x&&p.x<=r.x+r.w&&p.y>=r.y&&p.y<=r.y+r.h;
/** Static, source-facing Lambert response with segment visibility. Zero work per frame. */
export function incidentRadiance(point:LightPoint,normal:LightPoint,lights:readonly RoomLight[],casters:readonly LevelRect[]):Irradiance|undefined{
 let best:Irradiance|undefined;
 for(const light of lights){
  const dx=light.x-point.x,dy=light.y-point.y,distance=Math.hypot(dx,dy);
  if(distance>=light.radius||distance<.1)continue;
  const facing=normal.x===0&&normal.y===0?1:Math.max(0,(normal.x*dx+normal.y*dy)/distance);
  const energy=light.strength*Math.pow(1-distance/light.radius,1.25)*facing;
  if(energy<.012||best&&best.energy>=energy)continue;
  if(casters.some(r=>!contains(light,r)&&lightRayDistance(light,-dx/distance,-dy/distance,r)<distance-1))continue;
  best={color:light.color,energy,light};
 }
 return best;
}
export type WallBounce={x:number;y:number;nx:number;ny:number;energy:number;color:string;radius:number};
/** Six strongest wall returns, never arbitrary lights in the middle of a room. */
export function wallBounceSamples(room:LevelRect,lights:readonly RoomLight[],casters:readonly LevelRect[],floors?:readonly LevelRect[]):WallBounce[]{
 const r=room,samples:WallBounce[]=[];
 for(const f of [.2,.5,.8])for(const side of [0,1,2,3]){
  const nx=side===0?1:side===1?-1:0,ny=side===2?1:side===3?-1:0;
  const x=side===0?r.x+2:side===1?r.x+r.w-2:r.x+r.w*f,y=side===2?r.y+2:side===3?r.y+r.h-2:r.y+r.h*f;
  if(floors?.some(f=>contains({x:x-nx*4,y:y-ny*4},f)))continue;
  const hit=incidentRadiance({x,y},{x:nx,y:ny},lights,casters);
  if(hit)samples.push({x,y,nx,ny,color:hit.color,energy:Math.min(.24,hit.energy*.9),radius:Math.min(155,Math.min(r.w,r.h)*.33)});
 }
 return samples.sort((a,b)=>b.energy-a.energy).slice(0,6);
}
