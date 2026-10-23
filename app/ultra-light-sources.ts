import type {LevelRect} from './adventure-levels';
import type {ThemeId} from './cosmetic-engine';
import {HOME_LIGHTS} from './apartment-world';
import type {RoomLight} from './ultra-light-geometry';

/** The floor, illuminated edges and bounced light must share actual emitters. */
export function ultraRoomSources(r:LevelRect,color:string):RoomLight[]{
 return [
  ...[0,1].flatMap(side=>[98,Math.round(r.h*.52),r.h-84].map(y=>({x:side?r.x+r.w-27:r.x+27,y:r.y+y,radius:Math.min(400,r.w*.72),color,strength:.34}))),
  ...[.23,.77].map(f=>({x:Math.round(r.x+r.w*f),y:r.y+16,radius:Math.min(650,Math.max(r.w,r.h)*.76),color:'#d0e8e5',strength:.36})),
 ];
}
export function ultraHomeSources(theme:ThemeId):RoomLight[]{
 const night=theme==='night'||theme==='observatory';
 return [...HOME_LIGHTS.map((l,i)=>({...l,radius:i===6?180:215,color:i===6?'#8ce4cf':'#ffdda0',strength:night?.38:.22})),
  ...(!['mint','bath','observatory'].includes(theme)?[{x:843,y:251,radius:155,color:'#88d5e8',strength:night?.34:.22}]:[])];
}
