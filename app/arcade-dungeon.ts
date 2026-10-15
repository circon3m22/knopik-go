import {buildDungeonPlan,type AdventureLevel,type DungeonPlan} from "./dungeon-campaign.ts";
export function generateArcadeDungeon(seed:number,segment:number):AdventureLevel{
 let state=(seed^Math.imul(segment+1,0x9e3779b9))>>>0;
 const rnd=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296};
 const grid:[number,number][]=[[0,0]];
 for(let i=1;i<8;i++){const [x,y]=grid[i-1];grid.push(rnd()<.5?[x+1,y]:[x,y+1]);}
 const zone=Math.floor(rnd()*5),stage=Math.floor(rnd()*4)+1;
 const plan:DungeonPlan={name:"АРКАДА · БЕСКОНЕЧНЫЕ КОМНАТЫ",intro:"Зачищай комнаты. Без наград.",grid,links:grid.slice(1).map((_,i)=>[i,i+1] as [number,number]),rooms:grid.map((_,i)=>`Аркада · зал ${segment*8+i+1}`),tasks:[],exit:7};
 const level=buildDungeonPlan(plan,zone*5+stage);
 level.id=1000+segment;level.feature="Тренировка · без наград";
 level.hazards=[];level.jets=[];level.currents=[];level.barrels=[];level.medkits=[];
 level.enemies=level.enemies.filter(e=>!e.wave);
 return level;
}