export type WorldGraphicsMode="fast"|"soft"|"rich"|"ultra"|"cinematic";
export type FpsLimit=30|45|60;
export const sanitizeWorldGraphics=(value:unknown):WorldGraphicsMode=>value==="fast"||value==="rich"||value==="ultra"||value==="cinematic"?value:"soft";
export const sanitizeFpsLimit=(value:unknown):FpsLimit=>value===30||value===45?value:60;
/** Throttle presentation only: game logic and input keep their existing fixed cadence. */
export class FramePaintLimiter {
 private next=0;
 reset(){this.next=0;}
 due(now:number,limit:FpsLimit=60){
  if(!Number.isFinite(now))return false;
  const step=1000/sanitizeFpsLimit(limit);
  if(this.next!==0&&now+1<this.next)return false;
  this.next=this.next===0||now-this.next>step*3?now+step:this.next+step;
  return true;
 }
}
