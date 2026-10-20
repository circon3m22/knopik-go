import {NEIGHBORHOOD_BOUNDS,NEIGHBORHOOD_BOARDWALKS,NEIGHBORHOOD_SOLIDS} from './neighborhood-map.ts';
/** Immutable broad phase shared by the dog and pedestrians. Expanding the town
 * must not double the number of rectangles tested at every simulation step. */
const CELL=160,columns=Math.ceil(NEIGHBORHOOD_BOUNDS.w/CELL);
const cells=new Map<number,typeof NEIGHBORHOOD_SOLIDS>();
for(const s of NEIGHBORHOOD_SOLIDS)for(let y=Math.floor(s.y/CELL);y<=Math.floor((s.y+s.h)/CELL);y++)for(let x=Math.floor(s.x/CELL);x<=Math.floor((s.x+s.w)/CELL);x++){
 const key=y*columns+x,list=cells.get(key);if(list)list.push(s);else cells.set(key,[s]);
}
const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));
export function neighborhoodCanStand(x:number,y:number,r=13):boolean{
 if(!Number.isFinite(x)||!Number.isFinite(y)||!Number.isFinite(r)||r<0)return false;
 if(x<25+r||x>NEIGHBORHOOD_BOUNDS.w-25-r||y<175+r||y>NEIGHBORHOOD_BOUNDS.h-r)return false;
 if(y>1697-r&&!NEIGHBORHOOD_BOARDWALKS.some(d=>x>d.x+r&&x<d.x+d.w-r&&y<d.y+d.h-r))return false;
 for(let cy=Math.floor((y-r)/CELL);cy<=Math.floor((y+r)/CELL);cy++)for(let cx=Math.floor((x-r)/CELL);cx<=Math.floor((x+r)/CELL);cx++){
  for(const s of cells.get(cy*columns+cx)??[])if(Math.hypot(x-clamp(x,s.x,s.x+s.w),y-clamp(y,s.y,s.y+s.h))<r-.00001)return false;
 }
 return true;
}
