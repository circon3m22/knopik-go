/** Shared 13-frame forward roll; movement/collision retains its existing clock. */
export const KNOPIK_ROLL_DURATION = .21;
export function knopikRollPose(remaining:number,angle:number,reduced=false){
  const progress=Math.max(0,Math.min(1,1-remaining/KNOPIK_ROLL_DURATION));
  const direction=Math.cos(angle)<-.15?-1:1;
  const spin=Math.max(0,Math.min(1,(progress-.08)/.84));
  const turns=reduced?0:Math.round(spin*12)*30*direction;
  const lift=reduced?0:Math.round(Math.sin(progress*Math.PI)*5);
  const squash=reduced?1:progress<.12?.85+progress/.12*.15:progress>.88?1-(progress-.88)/.12*.15:1;
  return {progress,turns,lift,squash,mirror:direction,active:remaining>0};
}
