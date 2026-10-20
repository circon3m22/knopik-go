import { NEIGHBORHOOD_POINTS, type NeighborhoodPointId } from "./neighborhood-map.ts";
export type ResidentRoute={id:string;variant:number;speed:number;path:readonly (readonly [number,number])[]};
export const RESIDENT_ROUTES:readonly ResidentRoute[]=[
  {id:"street-neighbor",variant:0,speed:34,path:[[410,785],[745,785],[745,805],[1100,805]]},
  {id:"street-reader",variant:8,speed:31,path:[[1670,820],[2040,820]]},
  {id:"crossing-student",variant:2,speed:42,path:[[1210,825],[1210,1045],[1510,1055]]},
  {id:"home-stroller",variant:1,speed:29,path:[[170,790],[300,805],[385,815]]},
  {id:"park-walker",variant:7,speed:32,path:[[1370,800],[1370,660],[1460,660],[1460,610],[1690,610]]},
  {id:"park-hat",variant:6,speed:27,path:[[1620,465],[1820,465],[1820,600],[1670,620]]},
  {id:"park-friend",variant:5,speed:35,path:[[1930,605],[2065,625],[2065,770],[1910,800]]},
  {id:"park-jogger",variant:11,speed:48,path:[[1470,700],[1600,700],[1700,690]]},
  {id:"west-courtyard",variant:4,speed:36,path:[[410,1050],[410,1495],[535,1540]]},
  {id:"east-courtyard",variant:1,speed:30,path:[[1585,1125],[1690,1140],[1690,1400],[1625,1505]]},
  {id:"river-stroller",variant:0,speed:28,path:[[370,1580],[1030,1580]]},
  {id:"river-friend",variant:5,speed:33,path:[[1040,1560],[1430,1560],[1640,1510]]},
  {id:"river-reader",variant:8,speed:31,path:[[1540,1505],[1710,1520],[1960,1570],[2080,1590]]},
  {id:"craft-stroller",variant:6,speed:33,path:[[2480,780],[2800,780],[3150,780]]},
  {id:"clock-reader",variant:8,speed:26,path:[[3230,750],[3300,750],[3570,750]]},
  {id:"botanic-walker",variant:7,speed:28,path:[[3750,605],[3830,605],[3980,605]]},
  {id:"garden-student",variant:10,speed:37,path:[[3730,770],[4110,770],[4175,770]]},
  {id:"courtyard-painter",variant:9,speed:31,path:[[3250,1080],[3250,1370],[3320,1500]]},
  {id:"square-walker",variant:1,speed:29,path:[[3680,1120],[3850,1120],[3850,1320]]},
  {id:"river-east-pair",variant:5,speed:32,path:[[3330,1590],[3750,1590],[4250,1590],[4660,1590]]},
  {id:"river-east-reader",variant:2,speed:28,path:[[2530,1580],[2800,1580],[3200,1580]]},
  {id:"pier-visitor",variant:11,speed:32,path:[[3980,1600],[3980,1730]]},
  {id:"east-stroller",variant:0,speed:35,path:[[4250,1050],[4250,1450],[4250,1520]]},
];
export const RESIDENT_HOSTS:readonly {id:NeighborhoodPointId;variant:number}[]=[{id:"neighbor",variant:0},{id:"gardener",variant:1},{id:"caretaker",variant:3},{id:"fisher",variant:2},{id:"photographer",variant:4},{id:"girl",variant:5},{id:"kiosk",variant:6},{id:"bookseller",variant:8},{id:"florist",variant:7},{id:"baker",variant:9}];
export type ResidentState={id:string;variant:number;x:number;y:number;angle:number;moving:boolean;walkDistance:number;waypoint:number;direction:1|-1;rest:number;route?:ResidentRoute;host?:NeighborhoodPointId};
export class NeighborhoodCrowd{
  residents:ResidentState[];
  constructor(){
    const walkers=RESIDENT_ROUTES.map((route,n)=>{
      const segment=n%(route.path.length-1)+1,a=route.path[segment-1],b=route.path[segment],t=(n*.618+.23)%1;
      return {id:route.id,variant:route.variant,x:a[0]+(b[0]-a[0])*t,y:a[1]+(b[1]-a[1])*t,angle:Math.atan2(b[1]-a[1],b[0]-a[0]),moving:true,walkDistance:n*11,waypoint:segment,direction:1 as const,rest:0,route};
    });
    const hosts=RESIDENT_HOSTS.map(h=>{const p=NEIGHBORHOOD_POINTS.find(p=>p.id===h.id)!;return {id:h.id,variant:h.variant,x:p.x,y:p.y,angle:Math.PI/2,moving:false,walkDistance:0,waypoint:0,direction:1 as const,rest:0,host:h.id};});
    this.residents=[...hosts,...walkers];
  }
  step(dt:number,player:{x:number;y:number},canStand:(x:number,y:number,r:number)=>boolean){
    for(const resident of this.residents){const route=resident.route;
      if(!route){if(Math.hypot(player.x-resident.x,player.y-resident.y)<160)resident.angle=Math.atan2(player.y-resident.y,player.x-resident.x);continue;}
      if(resident.rest>0){resident.rest=Math.max(0,resident.rest-dt);resident.moving=false;continue;}
      const goal=route.path[resident.waypoint],dx=goal[0]-resident.x,dy=goal[1]-resident.y,d=Math.hypot(dx,dy),travel=Math.min(d,route.speed*dt);
      if(d>.01){const x=resident.x+dx/d*travel,y=resident.y+dy/d*travel;resident.angle=Math.atan2(dy,dx);resident.moving=canStand(x,y,11);if(resident.moving){resident.x=x;resident.y=y;resident.walkDistance+=travel;}else resident.rest=.5;}
      if(d<route.speed*dt+.01){
        if(resident.waypoint===route.path.length-1){resident.direction=-1;resident.rest=1.1;}else if(resident.waypoint===0){resident.direction=1;resident.rest=1.5;}
        resident.waypoint+=resident.direction;
      }
    }
  }
}
