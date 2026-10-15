export const HOME_DOORWAYS=[
 {id:"bar-living",x:472,y:340,axis:"x",length:84},
 {id:"living-lab",x:912,y:340,axis:"x",length:84},
 {id:"living-hall",x:692,y:664,axis:"y",length:96},
 {id:"wardrobe-hall",x:472,y:944,axis:"x",length:84},
 {id:"hall-vault",x:912,y:944,axis:"x",length:84},
 {id:"exit",x:692,y:1104,axis:"y",length:96},
] as const;
export type HomeDoorId=typeof HOME_DOORWAYS[number]["id"];
export type HomeDoorState={angle:number;sign:number;hold:number};
export const HOME_DOOR_HALF_THICKNESS=6;
export const createHomeDoors=():HomeDoorState[]=>HOME_DOORWAYS.map(()=>({angle:0,sign:1,hold:0}));
export function homeDoorPose(index:number,angle:number){const d=HOME_DOORWAYS[index];return {x:d.axis==="x"?d.x:d.x-d.length/2,y:d.axis==="x"?d.y-d.length/2:d.y,rotation:(d.axis==="x"?90:0)+angle*180/Math.PI};}
/** The same hinged leaf supplies collision, depth, thickness and its moving floor shadow. */
export function homeDoorLeafDistance(index:number,angle:number,x:number,y:number){
 const d=HOME_DOORWAYS[index],p=homeDoorPose(index,angle),a=p.rotation*Math.PI/180,c=Math.cos(a),s=Math.sin(a);
 const t=Math.max(0,Math.min(d.length,(x-p.x)*c+(y-p.y)*s));
 return Math.hypot(x-p.x-c*t,y-p.y-s*t);
}
export function homeDoorBlocks(doors:HomeDoorState[],x:number,y:number,radius:number){
 return HOME_DOORWAYS.some((_,i)=>homeDoorLeafDistance(i,doors[i].angle,x,y)<radius+HOME_DOOR_HALF_THICKNESS-1e-7);
}
export function stepHomeDoors(doors:HomeDoorState[],player:{x:number;y:number},input:{x:number;y:number},dt:number){
 HOME_DOORWAYS.forEach((d,i)=>{
  const s=doors[i],normal=d.axis==="x"?player.x-d.x:player.y-d.y,along=d.axis==="x"?player.y-d.y:player.x-d.x,velocity=d.axis==="x"?input.x:input.y;
  s.hold=Math.max(0,s.hold-dt);
  if(Math.abs(normal)<38&&Math.abs(along)<d.length/2+12&&Math.abs(velocity)>.1&&normal*velocity<0){
   if(Math.abs(s.angle)<.2)s.sign=Math.sign(velocity)*(d.axis==="x"?-1:1);
   s.hold=.85;
  }
  const currentDistance=homeDoorLeafDistance(i,s.angle,player.x,player.y);
  if(Math.abs(s.angle)>.2&&currentDistance<32)s.hold=Math.max(s.hold,.2);
  const target=s.hold>0?s.sign*1.43:0,delta=(target-s.angle)*Math.min(1,dt*18);
  let next=s.angle+Math.max(-.22,Math.min(.22,delta));if(Math.abs(next)<.002)next=0;
  // A leaf cannot rotate into the player, including while returning to the frame.
  const nextDistance=homeDoorLeafDistance(i,next,player.x,player.y);
  if(nextDistance<19.5&&nextDistance<currentDistance){s.hold=Math.max(s.hold,.25);return;}
  s.angle=next;
 });
}
export function homeDoorRenderPose(index:number,angle:number){
 const d=HOME_DOORWAYS[index],p=homeDoorPose(index,angle),a=p.rotation*Math.PI/180,c=Math.cos(a),s=Math.sin(a),t=HOME_DOOR_HALF_THICKNESS;
 const matrix=(cx:number,cy:number,nx:number,ny:number,x:number,y:number)=>`matrix(${cx.toFixed(5)} ${cy.toFixed(5)} ${nx.toFixed(5)} ${ny.toFixed(5)} ${x.toFixed(2)} ${y.toFixed(2)})`;
 const tip={x:p.x+c*d.length,y:p.y+s*d.length},f=(n:number)=>n.toFixed(2);
 const corners=[{x:p.x+s*t,y:p.y-c*t},{x:tip.x+s*t,y:tip.y-c*t},{x:tip.x-s*t,y:tip.y+c*t},{x:p.x-s*t,y:p.y+c*t}];
 const cap=`M${corners.map(q=>`${f(q.x)} ${f(q.y-72)}`).join("L")}Z`;
 const end=s>=0?tip:p,edge=`M${f(end.x+s*t)} ${f(end.y-c*t)}L${f(end.x-s*t)} ${f(end.y+c*t)}L${f(end.x-s*t)} ${f(end.y+c*t-72)}L${f(end.x+s*t)} ${f(end.y-c*t-72)}Z`;
 return {
  leaf: d.axis==="x"?matrix(c,s,-s,c,p.x,p.y):matrix(c,s,0,1,p.x-s*t,p.y+c*t),
  shadow:matrix(c,s,-s,c,p.x+4,p.y+8),
  cap,edge,depth:Math.max(p.y,tip.y)+t,
 };
}
