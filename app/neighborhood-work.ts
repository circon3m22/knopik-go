import { NEIGHBORHOOD_POINTS, type NeighborhoodPointId } from "./neighborhood-map.ts";
import type { NeighborhoodMissionId } from "./neighborhood-missions.ts";
export type NeighborhoodWorkKind="water"|"repair"|"collect"|"photo"|"handoff"|"food"|"feed"|"search";
export type NeighborhoodWork={kind:NeighborhoodWorkKind;mission:NeighborhoodMissionId|null;step:number;point:NeighborhoodPointId;elapsed:number;duration:number;x:number;y:number;shuttered:boolean};
export const NEIGHBORHOOD_WORK={
  water:{duration:4,label:"Поливаю грядку"},repair:{duration:5,label:"Меняю лампу"},collect:{duration:3.2,label:"Собираю мусор"},photo:{duration:2.8,label:"Делаю снимок"},handoff:{duration:2.5,label:"Передаю посылку"},food:{duration:2.3,label:"Беру корм для Плюша"},feed:{duration:4.2,label:"Кормлю Плюша"},search:{duration:2.6,label:"Поднимаю находку"},
} as const;
export function createNeighborhoodWork(mission:NeighborhoodMissionId,step:number,point:NeighborhoodPointId):NeighborhoodWork{
  const kind:NeighborhoodWorkKind=mission==="garden"?"water":mission==="lights"?"repair":mission==="shore"?"collect":mission==="photos"?"photo":mission==="delivery"?"handoff":point==="kiosk"?"food":"feed";
  const target=NEIGHBORHOOD_POINTS.find(p=>p.id===point)!;
  return {kind,mission,step,point,elapsed:0,duration:NEIGHBORHOOD_WORK[kind].duration,x:target.x,y:target.y,shuttered:false};
}
export function createNeighborhoodFind(point:"badge"|"pebble"|"secret"):NeighborhoodWork{
  const p=NEIGHBORHOOD_POINTS.find(p=>p.id===point)!;return {kind:"search",mission:null,step:0,point,elapsed:0,duration:2.6,x:p.x,y:p.y,shuttered:false};
}
export function neighborhoodWorkLift(action:NeighborhoodWork|null){
  if(action?.kind!=="repair")return 0;
  const p=action.elapsed/action.duration;return 85*Math.max(0,Math.min(1,p/.23,(1-p)/.22));
}
