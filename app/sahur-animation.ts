import type { AdventureEnemy } from "./adventure-engine.ts";
import { adventureFacing, type AdventureFacing } from "./adventure-projection.ts";
const ROWS: Record<AdventureFacing,number> = {left:0,"front-left":1,front:2,"front-right":3,right:4,"back-right":5,back:6,"back-left":7};
const ANGLES: Record<AdventureFacing,number> = {right:0,"front-right":Math.PI/4,front:Math.PI/2,"front-left":Math.PI*3/4,left:Math.PI,"back-left":-Math.PI*3/4,back:-Math.PI/2,"back-right":-Math.PI/4};

export function stableSahurFacing(angle: number, previous?: AdventureFacing): AdventureFacing {
  if(!Number.isFinite(angle))return previous??"front";
  if(previous){const delta=Math.abs(Math.atan2(Math.sin(angle-ANGLES[previous]),Math.cos(angle-ANGLES[previous])));if(delta<Math.PI/180*28)return previous;}
  return adventureFacing(angle);
}
export function sahurAnimationFrame(enemy: AdventureEnemy, facing: AdventureFacing, reducedMotion=false) {
  let row=ROWS[facing]+8,column=0;
  if(enemy.hp>0&&enemy.mode==="windup")column=reducedMotion?0:Math.min(2,Math.floor(3*Math.max(0,1-enemy.timer/Math.max(.001,enemy.windupDuration))));
  else if(enemy.hp>0&&enemy.mode==="recover"&&enemy.attackRecovery){
    const elapsed=Math.max(0,enemy.recoveryDuration-enemy.timer);
    column=reducedMotion?elapsed<(enemy.kind==="gun"?.08:.2)?3:0:elapsed<.08?3:elapsed<(enemy.kind==="gun"?.14:.2)?4:elapsed<.34?5:0;
  } else if(enemy.hp>0&&(enemy.mode==="chase"||enemy.mode==="charge")&&enemy.moving){row=ROWS[facing];column=reducedMotion?0:Math.floor(enemy.walkDistance/5)%6;}
  return {row,column};
}
