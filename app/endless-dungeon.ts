import {buildDungeonPlan,DUNGEON_ZONES,type AdventureLevel,type DungeonPlan,type TaskSpec} from "./dungeon-campaign.ts";
export const ABYSS_ANOMALIES=[
 {id:"overload",name:"Перегрузка",description:"Ловушки срабатывают чаще. Пульты отключают опасные участки."},
 {id:"hunt",name:"Охота",description:"Больше рывковых Сахуров. Они быстрее обходят укрытия."},
 {id:"collapse",name:"Хрупкие опоры",description:"Взрывоопасные бочки и разрушаемые укрытия. Используй цепные взрывы."},
 {id:"tide",name:"Глубинное течение",description:"Потоки сносят к ловушкам. Закрой вентили, чтобы осушить зал."},
] as const;
export type EndlessLevel=AdventureLevel&{abyss:{seed:number;floor:number;anomaly:typeof ABYSS_ANOMALIES[number];boss:boolean;reward:number}};
export function abyssRandom(seed:number){let n=seed>>>0;return()=>{n+=0x6D2B79F5;let t=n;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
const ROOM_NAMES=[
 ["Глухая арка","Кирпичный отвод","Дренажный узел","Старый водосброс","Забытая насосная","Соляной тупик","Боковой слив"],
 ["Медный байпас","Паровая камера","Топочный привод","Сброс давления","Старый конденсатор","Сухой радиатор","Запасной котёл"],
 ["Грузовой отсек","Цепная кладовая","Пороховой узел","Зал боеприпасов","Разбитый конвейер","Оружейный тайник","Разгрузочная петля"],
 ["Мокрая галерея","Шлюз глубины","Подводный пульт","Затопленный мост","Резервный затвор","Водяная ниша","Дальний акведук"],
 ["Кабельный пролом","Импульсный узел","Ионная камера","Зал трансформаторов","Тихий реактор","Энергетический обход","Резервная катушка"],
];
const BOSS_NAMES=["Архивный Страж","Медный Исполин","Комендант Глубины","Приливный Палач","Нулевой Разряд"];
export function generateEndlessDungeon(seed:number,floor:number):EndlessLevel {
 const depth=Math.max(1,Math.min(Number.MAX_SAFE_INTEGER-26,Math.floor(Number.isFinite(floor)?floor:1)));
 const random=abyssRandom((seed^Math.imul(depth,0x9e3779b1)^Math.imul(Math.floor(depth/0x100000000),0x85ebca6b))>>>0);
 const zone=(depth-1+Math.floor((depth-1)/5))%5+1,boss=depth%5===0;
 const anomaly=ABYSS_ANOMALIES[Math.floor(random()*ABYSS_ANOMALIES.length)];
 const grid:[number,number][]=[[0,0]],links:[number,number][]=[];
 const occupied=new Set(["0,0"]),directions=[[1,0],[-1,0],[0,1],[0,-1]];
 const target=6+Math.floor(random()*3);
 for(let i=1;i<target;i++){
   let from=i-1;
   let choices=directions.filter(([x,y])=>!occupied.has(`${grid[from][0]+x},${grid[from][1]+y}`));
   if(!choices.length){from=grid.findIndex(([gx,gy])=>directions.some(([x,y])=>!occupied.has(`${gx+x},${gy+y}`)));choices=directions.filter(([x,y])=>!occupied.has(`${grid[from][0]+x},${grid[from][1]+y}`));}
   // Force a sideways passage even if the first random steps were vertical.
   if(i===target-1&&!links.some(([a,b])=>grid[a][0]!==grid[b][0]))choices=choices.filter(([x])=>x!==0);
   const [dx,dy]=choices[Math.floor(random()*choices.length)]??[1,0];
   const point:[number,number]=[grid[from][0]+dx,grid[from][1]+dy];grid.push(point);occupied.add(point.join(","));links.push([from,i]);
 }
 const exit=grid.length-1;
 // A side branch requires returning to a junction; the lift is never the ingredient room.
 const from=1,branch=directions.find(([dx,dy])=>!occupied.has(`${grid[from][0]+dx},${grid[from][1]+dy}`));
 let resourceRoom=2;
 if(branch){resourceRoom=grid.length;grid.push([grid[from][0]+branch[0],grid[from][1]+branch[1]]);links.push([from,resourceRoom]);}
 for(let a=0;a<grid.length;a++)for(let b=a+1;b<grid.length;b++)if(a!==exit&&b!==exit&&Math.abs(grid[a][0]-grid[b][0])+Math.abs(grid[a][1]-grid[b][1])===1&&!links.some(l=>l[0]===a&&l[1]===b)&&random()<.65)links.push([a,b]);
 const tasks:TaskSpec[]=[{kind:"key",room:resourceRoom,label:"Забрать глубинный элемент",goal:"Найди элемент в боковом ответвлении"},{kind:"relay",room:1,label:"Запитать глубинный подъёмник",goal:"Верни элемент к распределителю",depends:[0]}];
 const taskRoom=links.find(([,to])=>to===exit)?.[0]??exit-1;
 if(depth%3===0)tasks.push({kind:"hold",room:taskRoom,label:"Стабилизировать узел",goal:"Защити узел от двух волн",depends:[1],duration:9+Math.min(5,Math.floor(depth/10))});
 else tasks.push({kind:anomaly.id==="collapse"?"charge":"valve",room:taskRoom,label:anomaly.id==="collapse"?"Подорвать опору":"Перекрыть глубинный вентиль",goal:anomaly.id==="collapse"?"Расчисти опору зарядом":"Отключи опасный участок",depends:[1]});
 const rooms=grid.map((_,i)=>i===0?"Спуск в Бездну":i===exit?boss?BOSS_NAMES[zone-1]:"Глубинный подъёмник":i===resourceRoom?"Тайник глубинного элемента":ROOM_NAMES[zone-1][(i+Math.floor(random()*7))%7]);
 const plan:DungeonPlan={layoutSeed:(seed^Math.imul(depth,773))>>>0,name:`${DUNGEON_ZONES[zone-1].name} · глубина ${depth}`,intro:anomaly.description,grid,links,rooms,tasks,exit,lock:tasks.length-1,boss};
 const built=buildDungeonPlan(plan,(zone-1)*5+(boss?4:1+Math.floor(random()*3)));
 built.id=35+depth;built.feature=boss?`Босс: ${BOSS_NAMES[zone-1]}`:`${anomaly.name} · ${built.rooms.length} залов`;
 built.enemies=built.enemies.filter(e=>e.room!==0||e.wave||Math.abs(e.x-built.spawn.x)>60).map((e,i)=>({...e,role:!e.boss&&!e.wave&&anomaly.id==="hunt"&&i%3===0?"charger":e.role}));
 // Bound active actors as layouts grow; retain every boss and scripted wave.
 while(built.enemies.length>36){const index=built.enemies.findLastIndex(e=>!e.boss&&!e.wave&&built.enemies.filter(n=>n.room===e.room&&!n.wave).length>1);if(index<0)break;built.enemies.splice(index,1);}
 if(anomaly.id==="overload")built.hazards.forEach(h=>{h.period=Math.max(3.2,h.period*.8);});
 if(anomaly.id==="collapse")for(const [i,r]of built.rooms.entries()){
   built.barrels.push({x:r.x+r.w/2-115,y:r.y+r.h-115,room:i});
   built.solids.push({kind:"crate",x:r.x+r.w*.6,y:r.y+r.h-145,w:48,h:42,breakable:true});
 }
 if(anomaly.id==="tide")for(const [i,r]of built.rooms.entries()){
   const disabledBy=built.tasks.findIndex(t=>t.room===i&&(t.kind==="valve"||t.kind==="relay"));
   built.currents.push({x:r.x+195,y:r.y+158,w:r.w-340,h:r.h-250,dx:i%2?-.65:.65,dy:.2,disabledBy:disabledBy>=0?disabledBy:2});
 }
 return {...built,abyss:{seed:seed>>>0,floor:depth,anomaly,boss,reward:Math.min(40,8+Math.floor(depth/2)+(boss?10:0))}};
}
