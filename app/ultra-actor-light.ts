import type {LevelRect} from './adventure-levels';
import {lightRayDistance,lightFloorExit,type LightPoint,type RoomLight} from './ultra-light-geometry.ts';
export type ActorEmitter=RoomLight&{height?:number};
export type ActorRadiance={matrix:string;color:string;opacity:string;dx:string;dy:string};
const contains=(p:LightPoint,r:LevelRect)=>p.x>=r.x&&p.x<=r.x+r.w&&p.y>=r.y&&p.y<=r.y+r.h;
const colors=new Map<string,readonly number[]>();
function rgb(color:string){let value=colors.get(color);if(!value){value=[1,3,5].map(i=>parseInt(color.slice(i,i+2),16)/255);colors.set(color,value);}return value;}
/** Character-local lighting: occluded direct color, a directional inner pixel rim,
 * and a bounded exposure. The black outlines retain their contrast. */
export function actorRadiance(point:LightPoint,lights:readonly ActorEmitter[],casters:readonly LevelRect[],night:boolean,sun=false,dead=false,floors?:readonly LevelRect[]):ActorRadiance{
 const ambientRed=night?.58:.84,ambientGreen=night?.65:.88,ambientBlue=night?.77:.94;
 let red=ambientRed,green=ambientGreen,blue=ambientBlue,best=0,dx=-1,dy=-1,color='#b9d5ec';
 for(const l of lights){
  const x=l.x-point.x,y=l.y-point.y,d=Math.hypot(x,y),distance=Math.hypot(d,(l.height??45)-45);
  if(distance>=l.radius)continue;
  const visible=(sx:number)=>{const source={x:sx,y:l.y},vx=point.x-sx,vy=point.y-l.y,length=Math.hypot(vx,vy);return length<.1||(!floors||lightFloorExit(source,vx/length,vy/length,floors,length)>=length-.1)&&!casters.some(r=>!contains(source,r)&&lightRayDistance(source,vx/length,vy/length,r)<length-2);};
  const visibility=l.aperture?(visible(l.x)?.56:0)+(visible(l.x-l.aperture*.36)?.22:0)+(visible(l.x+l.aperture*.36)?.22:0):visible(l.x)?1:0;
  if(!visibility)continue;
  const power=l.strength*Math.pow(1-distance/l.radius,1.3)*visibility,c=rgb(l.color);
  red+=power*c[0]*1.25;green+=power*c[1]*1.25;blue+=power*c[2]*1.25;
  if(power>best){best=power;color=l.color;dx=x;dy=y*.82-(l.height??45)+45;}
 }
 if(sun){
  const blocked=casters.some(r=>lightRayDistance(point,-.84,-.54,r)<640);
  if(!blocked){red+=.17;green+=.12;blue+=.035;if(best<.23){best=.23;color='#ffe2ac';dx=-84;dy=-54;}}
 }
 // A soft exposure shoulder keeps fur/cloth shading when several lights overlap.
 const exposure=(v:number,ambient:number)=>{const span=1.08-ambient;return (ambient+span*(1-Math.exp(-Math.max(0,v-ambient)/span))).toFixed(3);},offset=(v:number)=>Math.abs(v)<.28?'0':v<0?'2':'-2',length=Math.max(1,Math.hypot(dx,dy));
 return {matrix:`${exposure(red,ambientRed)} 0 0 0 0 0 ${exposure(green,ambientGreen)} 0 0 0 0 0 ${exposure(blue,ambientBlue)} 0 0 0 0 0 1 0`,color,opacity:(dead?0:Math.min(.62,best*1.9)).toFixed(3),dx:offset(dx/length),dy:offset(dy/length)};
}
