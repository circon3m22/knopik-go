import type {AdventureLevel} from "./adventure-levels.ts";
import type {LabMaterial} from "./laboratory-engine.ts";
export type DungeonIngredient={key:string;level:number;room:number;material:LabMaterial;x:number;y:number};
const MATERIALS:readonly LabMaterial[]=["citrus","leaf","pearl","spark"];
const near=(x:number,y:number,rect:{x:number;y:number;w:number;h:number},gap:number)=>x>=rect.x-gap&&x<=rect.x+rect.w+gap&&y>=rect.y-gap&&y<=rect.y+rect.h+gap;
/** Deterministic, unobstructed floor items; no edits to existing room layouts or hazards. */
export function dungeonIngredientPositions(level:AdventureLevel):DungeonIngredient[]{
 if(level.id<1||level.id>35||"abyss" in level)return [];
 const count=1+level.id%3,rooms=level.rooms;
 const result:DungeonIngredient[]=[];
 for(let slot=0;slot<count;slot++){
  const room=(level.id+slot*2)%rooms.length;
  // Avoid repeating the same room when a small floor has only four chambers.
  const unique=Array.from({length:rooms.length},(_,i)=>(room+i)%rooms.length).find(i=>!result.some(p=>p.room===i));
  if(unique===undefined)continue;
  const r=rooms[unique],cx=r.x+r.w/2,cy=r.y+r.h/2;
  const offsets=[[.23,.23],[.77,.23],[.23,.77],[.77,.77],[.35,.4],[.65,.6],[.2,.5],[.8,.5],[.5,.23],[.5,.77],[.35,.7],[.65,.3]];
  const candidates=offsets.map(([a,b])=>({x:r.x+r.w*a,y:r.y+r.h*b}));
  const free=(x:number,y:number)=>
   !level.solids.some(s=>near(x,y,s,42))&&
   !level.gates.some(g=>near(x,y,g,40))&&
   !level.hazards.some(h=>near(x,y,h,36))&&
   !level.tasks.some(t=>Math.hypot(t.x-x,t.y-y)<75)&&
   !level.barrels.some(b=>Math.hypot(b.x-x,b.y-y)<56)&&
   !level.medkits.some(m=>Math.hypot(m.x-x,m.y-y)<48)&&
   Math.hypot(level.exit.x-x,level.exit.y-y)>90&&
   Math.hypot(r.x+r.w-96-x,r.y+r.h-56-y)>68;
  const loc=candidates.find(p=>free(p.x,p.y))??{x:cx,y:cy};
  const material=MATERIALS[(level.id+slot-1)%MATERIALS.length];
  result.push({key:`m:${level.id}:${unique}`,level:level.id,room:unique,material,x:Math.round(loc.x),y:Math.round(loc.y)});
 }
 return result;
}
