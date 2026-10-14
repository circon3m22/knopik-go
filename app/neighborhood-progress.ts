import { NEIGHBORHOOD_MISSIONS, missionMask, type MissionState, type NeighborhoodMissionId } from "./neighborhood-missions.ts";
export type NeighborhoodProgress = { quest: 0 | 1 | 2 | 3; pebble: boolean; secret: boolean; missions:Record<NeighborhoodMissionId,MissionState>;tracked:NeighborhoodMissionId|"badge"|null;visits:number;offer:NeighborhoodMissionId|null;offerCursor:number };
export function defaultNeighborhoodProgress(): NeighborhoodProgress {
  return {quest:0,pebble:false,secret:false,missions:Object.fromEntries(NEIGHBORHOOD_MISSIONS.map(m=>[m.id,{status:0,steps:0}])) as NeighborhoodProgress["missions"],tracked:null,visits:0,offer:null,offerCursor:0};
}
export function sanitizeNeighborhoodProgress(value: unknown): NeighborhoodProgress {
  const result=defaultNeighborhoodProgress();if (!value || typeof value !== "object") return result;
  const v = value as Partial<NeighborhoodProgress>;
  result.quest=typeof v.quest==="number"&&Number.isFinite(v.quest)?Math.max(0,Math.min(3,Math.floor(v.quest))) as NeighborhoodProgress["quest"]:0;
  result.pebble=v.pebble===true;result.secret=v.secret===true;
  for(const m of NEIGHBORHOOD_MISSIONS){const raw=v.missions?.[m.id];if(!raw||typeof raw!=="object")continue;
    const steps=typeof raw.steps==="number"&&Number.isFinite(raw.steps)?Math.max(0,Math.floor(raw.steps))&missionMask(m.id):0;
    const status=raw.status===2&&steps===missionMask(m.id)?2:raw.status===1||raw.status===2?1:0;
    result.missions[m.id]={status,steps:status===0?0:steps};
  }
  result.visits=typeof v.visits==="number"&&Number.isFinite(v.visits)?Math.max(0,Math.min(1000000,Math.floor(v.visits))):0;
  result.offerCursor=typeof v.offerCursor==="number"&&Number.isFinite(v.offerCursor)?Math.max(0,Math.floor(v.offerCursor))%NEIGHBORHOOD_MISSIONS.length:0;
  result.offer=v.offer&&NEIGHBORHOOD_MISSIONS.some(m=>m.id===v.offer)&&result.missions[v.offer].status===0?v.offer:null;
  if(v.tracked==="badge")result.tracked=result.quest<3?"badge":null;
  else result.tracked=v.tracked&&NEIGHBORHOOD_MISSIONS.some(m=>m.id===v.tracked)&&(result.missions[v.tracked].status===1||result.offer===v.tracked)?v.tracked:null;
  return result;
}
/** One new request per outing, quiet walks in between, and at most two accepted side stories. */
export function beginNeighborhoodVisit(progress:NeighborhoodProgress):NeighborhoodProgress{
  const next=sanitizeNeighborhoodProgress(progress);next.visits=Math.min(1000000,next.visits+1);next.offer=null;
  if(next.visits>1&&next.visits%3!==0&&Object.values(next.missions).filter(m=>m.status===1).length<2){
    for(let n=0;n<NEIGHBORHOOD_MISSIONS.length;n++){const i=(next.offerCursor+n)%NEIGHBORHOOD_MISSIONS.length,id=NEIGHBORHOOD_MISSIONS[i].id;if(next.missions[id].status!==0)continue;next.offer=id;next.offerCursor=(i+1)%NEIGHBORHOOD_MISSIONS.length;break;}
  }
  if(next.tracked&&next.tracked!=="badge"&&next.missions[next.tracked].status===0&&next.offer!==next.tracked)next.tracked=null;
  return next;
}
