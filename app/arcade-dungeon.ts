import {generateRoomGraph} from "./dungeon-generation.ts";
import {buildDungeonPlan,type AdventureLevel,type DungeonPlan} from "./dungeon-campaign.ts";
export function generateArcadeDungeon(seed:number,segment:number):AdventureLevel{
 let state=(seed^Math.imul(segment+1,0x9e3779b9))>>>0;
 const rnd=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296};
 const {grid,links,exit}=generateRoomGraph((seed^Math.imul(segment+1,0x85ebca6b))>>>0,8);
 const zone=Math.floor(rnd()*5),stage=Math.floor(rnd()*4)+1;
 const plan:DungeonPlan={name:"АРКАДА · БЕСКОНЕЧНЫЕ КОМНАТЫ",intro:"Зачищай комнаты. Без наград.",grid,links,rooms:grid.map((_,i)=>`Аркада · зал ${segment*8+i+1}`),layoutSeed:(seed^segment)>>>0,tasks:[],exit};
 const level=buildDungeonPlan(plan,zone*5+stage);
 level.id=1000+segment;level.feature="Тренировка · без наград";
 level.hazards=[];level.jets=[];level.currents=[];level.barrels=[];level.medkits=[];
 level.enemies=level.enemies.filter(e=>!e.wave);
 return level;
}