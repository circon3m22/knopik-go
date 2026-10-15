export const HOMECOMING_DURATION=4.9;
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
export function homecomingFrame(time:number){
 const t=Number.isFinite(time)?Math.max(0,time):0;
 return {black:clamp(t/.9),logo:Math.min(clamp((t-1.25)/.7),clamp((4.4-t)/.7))};
}
