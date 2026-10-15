export const HOME_DOORWAYS=[
 {id:"bar-living",x:472,y:340,axis:"x",length:84},
 {id:"living-lab",x:912,y:340,axis:"x",length:84},
 {id:"living-hall",x:692,y:632,axis:"y",length:96},
 {id:"wardrobe-hall",x:472,y:944,axis:"x",length:84},
 {id:"hall-vault",x:912,y:944,axis:"x",length:84},
 {id:"exit",x:692,y:1104,axis:"y",length:96},
] as const;
export type HomeDoorId=typeof HOME_DOORWAYS[number]["id"];
export type HomeDoorState={angle:number;sign:number;hold:number};
export const createHomeDoors=():HomeDoorState[]=>HOME_DOORWAYS.map(()=>({angle:0,sign:1,hold:0}));
export function stepHomeDoors(doors:HomeDoorState[],player:{x:number;y:number},input:{x:number;y:number},dt:number){
 HOME_DOORWAYS.forEach((d,i)=>{const s=doors[i],normal=d.axis==="x"?player.x-d.x:player.y-d.y,along=d.axis==="x"?player.y-d.y:player.x-d.x,velocity=d.axis==="x"?input.x:input.y;
  s.hold=Math.max(0,s.hold-dt);
  if(Math.abs(normal)<74&&Math.abs(along)<d.length/2+12&&Math.abs(velocity)>.1&&normal*velocity<0){if(Math.abs(s.angle)<.2)s.sign=Math.sign(velocity)*(d.axis==="x"?-1:1);s.hold=.85;}
  if(Math.abs(normal)<27&&Math.abs(along)<d.length/2+18&&Math.abs(s.angle)>.2)s.hold=Math.max(s.hold,.2);
  const target=s.hold>0?s.sign*1.43:0;s.angle+=(target-s.angle)*Math.min(1,dt*18);if(Math.abs(s.angle)<.002)s.angle=0;
 });
}
export function homeDoorBlocks(doors:HomeDoorState[],x:number,y:number,radius:number){return HOME_DOORWAYS.some((d,i)=>{if(Math.abs(doors[i].angle)>.74)return false;const normal=d.axis==="x"?x-d.x:y-d.y,along=d.axis==="x"?y-d.y:x-d.x;return Math.abs(normal)<radius+3&&Math.abs(along)<d.length/2+radius;});}
export function homeDoorPose(index:number,angle:number){const d=HOME_DOORWAYS[index];return {x:d.axis==="x"?d.x:d.x-d.length/2,y:d.axis==="x"?d.y-d.length/2:d.y,rotation:(d.axis==="x"?90:0)+angle*180/Math.PI};}
