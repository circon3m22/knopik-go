import {buildDungeonPlan,type AdventureLevel,type DungeonPlan} from './dungeon-campaign.ts';
export const EXPEDITION_LOCATIONS=[
 {id:'greenhouse',name:'Стеклянные оранжереи',description:'Теплицы, заросшие галереи и зал под стеклянным куполом.',color:'#9bc9a3'},
 {id:'harbor',name:'Ночной грузовой порт',description:'Контейнеры, погрузочные доки и маяк у чёрной воды.',color:'#87bed0'},
] as const;
export type ExpeditionId=typeof EXPEDITION_LOCATIONS[number]['id'];
const grids:Record<ExpeditionId,[number,number][]>= {
 greenhouse:[[0,2],[0,1],[1,1],[1,0],[2,0],[2,1],[3,1],[3,0]],
 harbor:[[0,0],[1,0],[1,1],[2,1],[2,2],[3,2],[3,1],[4,1]],
};
const names:Record<ExpeditionId,string[]>={
 greenhouse:['Служебная теплица','Галерея папоротников','Стеклянный переход','Пальмовая оранжерея','Зал полива','Тропический павильон','Сад на крыше','Большой купол'],
 harbor:['Портовая проходная','Ряды контейнеров','Погрузочный док','Причальная галерея','Морозильный склад','Ремонтный ангар','Дальний пирс','Старый маяк'],
};
export function generateExpeditionDungeon(id:ExpeditionId,segment=0):AdventureLevel{
 const location=EXPEDITION_LOCATIONS.find(l=>l.id===id)!;
 const plan:DungeonPlan={name:location.name,intro:location.description,grid:grids[id],links:grids[id].slice(1).map((_,i)=>[i,i+1]),rooms:names[id].map(n=>segment?`${n} · ${segment+1}`:n),tasks:[],exit:7};
 const level=buildDungeonPlan(plan,id==='greenhouse'?3:8);
 level.id=2000+(id==='harbor'?100:0)+segment;level.location=id;
 level.name=location.name;level.feature='Новый маршрут · тренировка без потери KC';
 level.palette=id==='greenhouse'?{wall:'#527e6b',floor:'#acc8a5',light:'#e1e9bc',dark:'#233e40',accent:'#d5ba7b',water:'#477a76'}:{wall:'#4a6579',floor:'#81939d',light:'#c3d6d5',dark:'#1d3046',accent:'#edbc79',water:'#294a68'};
 level.hazards=[];level.jets=[];level.currents=[];level.barrels=[];level.medkits=[];level.enemies=level.enemies.filter(e=>!e.wave);
 return level;
}
