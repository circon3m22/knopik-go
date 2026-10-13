import { NEIGHBORHOOD_MISSIONS, missionMask, type MissionState, type NeighborhoodMissionId } from "./neighborhood-missions.ts";
export type NeighborhoodProgress = { quest: 0 | 1 | 2 | 3; pebble: boolean; secret: boolean; missions:Record<NeighborhoodMissionId,MissionState>;tracked:NeighborhoodMissionId|"badge"|null };
export function defaultNeighborhoodProgress(): NeighborhoodProgress {
  return {quest:0,pebble:false,secret:false,missions:Object.fromEntries(NEIGHBORHOOD_MISSIONS.map(m=>[m.id,{status:0,steps:0}])) as NeighborhoodProgress["missions"],tracked:null};
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
  if(v.tracked==="badge")result.tracked=result.quest<3?"badge":null;
  else result.tracked=NEIGHBORHOOD_MISSIONS.some(m=>m.id===v.tracked)&&v.tracked&&result.missions[v.tracked].status!==2?v.tracked:null;
  return result;
}
