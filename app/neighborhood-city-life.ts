import {NEIGHBORHOOD_BUILDINGS} from './neighborhood-map.ts';
export type CityLifeKind='pigeon'|'duck'|'butterfly'|'smoke'|'steam'|'fountain'|'boat'|'reeds'|'pennant';
export type CityLifeActor={id:string;kind:CityLifeKind;x:number;y:number;detail:number;seed:number};
/** Decorations only: no colliders, income, saves, randomness or extra clocks. */
export const CITY_LIFE_ACTORS:readonly CityLifeActor[]=[
 ...[[580,755],[1120,790],[1515,640],[1950,810],[3430,1380],[3615,1505],[4075,1490],[4560,1580]].map(([x,y],seed):CityLifeActor=>({id:'pigeon-'+seed,kind:'pigeon',x,y,detail:seed<6?1:2,seed})),
 ...[[1510,1840],[1550,1860],[1580,1855],[3950,1880],[3990,1890],[4020,1883]].map(([x,y],seed):CityLifeActor=>({id:'duck-'+seed,kind:'duck',x,y,detail:seed%3===2?2:1,seed})),
 ...[[1400,390],[1835,535],[3765,430],[4135,660],[3510,1455],[80,1525]].map(([x,y],seed):CityLifeActor=>({id:'butterfly-'+seed,kind:'butterfly',x,y,detail:2,seed})),
 ...NEIGHBORHOOD_BUILDINGS.filter((_,i)=>[0,1,8,11,13].includes(i)).map((o,seed):CityLifeActor=>({id:'smoke-'+o.id,kind:'smoke',x:o.x+o.w!-67,y:o.y,detail:seed%2?3:1,seed})),
 {id:'kiosk-steam',kind:'steam',x:900,y:780,detail:1,seed:1},
 {id:'cafe-steam',kind:'steam',x:3522,y:1185,detail:1,seed:2},
 {id:'garden-spray',kind:'fountain',x:1810,y:1080,detail:1,seed:0},
 {id:'square-spray',kind:'fountain',x:4040,y:1160,detail:1,seed:1},
 {id:'river-skiff',kind:'boat',x:2800,y:1905,detail:1,seed:0},
 ...[460,1190,2210,2960,4310,4670].map((x,seed):CityLifeActor=>({id:'reeds-'+seed,kind:'reeds',x,y:1720,detail:2,seed})),
 ...[[865,770],[3495,1180],[3900,1400]].map(([x,y],seed):CityLifeActor=>({id:'pennant-'+seed,kind:'pennant',x,y,detail:2,seed})),
];
export function cityLifePose(a:CityLifeActor,time:number,player:{x:number;y:number},reduced=false){
 const t=reduced?0:Math.max(0,time),q=t+a.seed*1.73;
 let x=a.x,y=a.y,lift=0,turn=1,wing=0,tilt=0,alpha=1,phase=0;
 switch(a.kind){
  case 'pigeon':{
   x+=Math.sin(q*.7)*7;y+=Math.sin(q*.35)*4;
   const dx=x-player.x,dy=y-player.y,d=Math.hypot(dx,dy),flee=reduced?0:Math.max(0,1-d/90);
   x+=dx/(d+22)*flee*60;y+=dy/(d+22)*flee*40;lift=flee*34;
   turn=Math.cos(q*.7)<0?-1:1;wing=flee>.08?Math.sin(q*18)*38:0;tilt=flee<.08&&q%4>2.8?22:0;break;
  }
  case 'duck':x+=Math.sin(t*.18+Math.floor(a.seed/3))*68;y+=Math.sin(q*.45)*7;turn=Math.cos(t*.18+Math.floor(a.seed/3))<0?-1:1;phase=q%3/3;break;
  case 'butterfly':x+=Math.sin(q*.65)*25;y+=Math.sin(q*.41)*12;lift=20+Math.sin(q*1.4)*9;wing=Math.sin(q*12)*.7;alpha=.55+(Math.sin(q*2)+1)*.2;break;
  case 'smoke':phase=(q*.17)%1;lift=448+phase*44;x+=phase*16+Math.sin(q)*3;alpha=(1-phase)*.32;break;
  case 'steam':phase=(q*.5)%1;lift=55+phase*22;x+=Math.sin(q)*3;alpha=(1-phase)*.55;break;
  case 'fountain':phase=(q*1.7)%1;break;
  case 'boat':x+=Math.sin(t*.045)*820;y+=Math.sin(t*.45)*3;turn=Math.cos(t*.045)<0?-1:1;tilt=Math.sin(t*.6)*1.5;phase=q%4/4;break;
  case 'reeds':tilt=Math.sin(q*.9)*3;break;
  case 'pennant':tilt=Math.sin(q*1.5)*4;break;
 }
 return {x,y,lift,turn,wing,tilt,alpha,phase};
}
