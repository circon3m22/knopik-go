/** Travel turns the body; weapon aim remains independent. The same inputs are
 * already carried by co-op snapshots, so both clients derive the same pose. */
export function knopikTravelAngle(input:{x:number;y:number},dodgeTime:number,dodgeX:number,dodgeY:number):number|undefined{
  const x=dodgeTime>0?dodgeX:input.x,y=dodgeTime>0?dodgeY:input.y;
  return Number.isFinite(x)&&Number.isFinite(y)&&Math.hypot(x,y)>.1?Math.atan2(y,x):undefined;
}
