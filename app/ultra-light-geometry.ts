import type {LevelRect} from './adventure-levels';
export type PixelLight={x:number;y:number;radius:number;color:string;room:number};
/** Visibility is solved once per geometry revision, not every frame. Rays end
 * at room bounds or the first real obstacle; corner rays retain thin shadows. */
export function lightVisibilityPath(light:Pick<PixelLight,'x'|'y'|'radius'>,room:LevelRect,casters:readonly LevelRect[]):string{
 const boxes=casters.filter(r=>r.x+r.w>=room.x&&r.x<=room.x+room.w&&r.y+r.h>=room.y&&r.y<=room.y+room.h).filter(r=>!(light.x>r.x&&light.x<r.x+r.w&&light.y>r.y&&light.y<r.y+r.h));
 const angles=Array.from({length:48},(_,i)=>i*Math.PI/24);
 for(const r of boxes.slice(0,18))for(const[x,y]of[[r.x,r.y],[r.x+r.w,r.y],[r.x+r.w,r.y+r.h],[r.x,r.y+r.h]]){const a=Math.atan2(y-light.y,x-light.x);angles.push(a-.001,a,a+.001);}
 const hit=(r:LevelRect,dx:number,dy:number)=>{let near=-Infinity,far=Infinity;for(const[v,d,min,max]of[[light.x,dx,r.x,r.x+r.w],[light.y,dy,r.y,r.y+r.h]]){if(Math.abs(d)<1e-8){if(v<min||v>max)return Infinity;}else{const a=(min-v)/d,b=(max-v)/d;near=Math.max(near,Math.min(a,b));far=Math.min(far,Math.max(a,b));}}return far>=Math.max(0,near)?near>=0?near:far:Infinity;};
 const points=angles.sort((a,b)=>a-b).map(a=>{const dx=Math.cos(a),dy=Math.sin(a);let distance=Math.min(light.radius,hit(room,dx,dy));for(const box of boxes)distance=Math.min(distance,hit(box,dx,dy));return `${Math.round((light.x+dx*distance)*2)/2} ${Math.round((light.y+dy*distance)*2)/2}`;});
 return 'M'+points.join('L')+'Z';
}
export function castPixelShadow(r:LevelRect,light:{x:number;y:number},reach=55){
 const x=r.x+r.w/2,y=r.y+r.h,dx=x-light.x,dy=y-light.y,n=Math.max(1,Math.hypot(dx,dy)),sx=Math.round(dx/n*reach),sy=Math.round(dy/n*reach);return `M${r.x} ${y-3}h${r.w}l${sx} ${sy}h-${r.w}Z`;
}
export function dungeonPixelLights(rooms:readonly LevelRect[],color:string):PixelLight[]{return rooms.flatMap((r,room)=>[{x:r.x+27,y:r.y+101,radius:Math.min(340,Math.max(r.w,r.h)*.58),color,room},{x:r.x+r.w-27,y:r.y+r.h*.52+3,radius:Math.min(310,Math.max(r.w,r.h)*.52),color,room}]);}
