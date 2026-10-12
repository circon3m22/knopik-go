import { runnerDistrictIndex, RUNNER_DISTRICT_LENGTH, RUNNER_WORLD_CYCLE } from "./runner-districts.ts";

/** Exact interval check; no sampling can accidentally miss a short roof ramp. */
export function runnerHasElevatedTerrain(distance: number, seed = 0, near = -24, far = 600) {
  const start=distance+near,end=distance+far;
  if(!seed) {
    for(let cycle=Math.floor(start/RUNNER_WORLD_CYCLE);cycle<=Math.floor(end/RUNNER_WORLD_CYCLE);cycle++) {
      const base=cycle*RUNNER_WORLD_CYCLE;
      if(end>base+280 && start<base+625)return true;
    }
    return false;
  }
  for(let segment=Math.floor(Math.max(0,start)/RUNNER_DISTRICT_LENGTH);segment<=Math.floor(Math.max(0,end)/RUNNER_DISTRICT_LENGTH);segment++) {
    const base=segment*RUNNER_DISTRICT_LENGTH;
    if(runnerDistrictIndex(base,seed)===0 && end>base+280 && start<base+395)return true;
  }
  return false;
}
