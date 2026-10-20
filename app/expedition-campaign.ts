import type {DungeonPlan} from './dungeon-campaign';
/** Preserve story IDs/unlocks, but give every route an explorable side chamber.
 * New cells are cardinal, attached to an existing passage, never across a wall. */
export function expeditionPlan(source:DungeonPlan,index:number):DungeonPlan{
 const id=index+1,zone=Math.floor(index/5)+1,stage=index%5+1;
 const grid=source.grid.map(([x,y])=>[x,y] as [number,number]),links=source.links.map(([a,b])=>[a,b] as [number,number]),rooms=[...source.rooms],tasks=source.tasks.map(t=>({...t,depends:t.depends?[...t.depends]:undefined}));
 const occupied=new Set(grid.map(([x,y])=>`${x},${y}`));
 const directions:[[number,number],[number,number],[number,number],[number,number]]=[[1,0],[0,-1],[-1,0],[0,1]];
 const candidates=grid.flatMap(([x,y],from)=>from===source.exit?[]:directions.map(([dx,dy],turn)=>({x:x+dx,y:y+dy,from,turn})).filter(p=>!occupied.has(`${p.x},${p.y}`)));
 const exit=grid[source.exit];
 const branch=id===1?candidates.find(p=>Math.abs(p.x-exit[0])+Math.abs(p.y-exit[1])===1&&p.from!==0)!:candidates[(id*7+stage)%candidates.length],annex=grid.length;
 grid.push([branch.x,branch.y]);links.push([branch.from,annex]);
 if(id===1){for(let i=links.length-1;i>=0;i--)if(links[i].includes(source.exit))links.splice(i,1);links.push([annex,source.exit]);}
 const places=['Архив водоканала','Мастерская манометров','Кладовая разведки','Станция глубиномера','Зал резонаторов','Лесной наблюдатель','Картографический кабинет'];
 rooms.push(places[zone-1]);
 // One extra junction can make a real shortcut, without bypassing a locked arena.
 if(stage%2===1){const other=grid.findIndex(([x,y],i)=>i!==branch.from&&i!==annex&&i!==source.exit&&Math.abs(x-branch.x)+Math.abs(y-branch.y)===1);if(other>=0)links.push([annex,other]);}
 if(id!==1){const survey=stage===3||stage===5;
  tasks.push(survey?{kind:'survey',depends:undefined,room:annex,label:'Начать разведку',goal:'Исследуй все залы маршрута'}:{kind:'repair',depends:undefined,room:annex,label:'Восстановить узел',goal:'Восстанови полевой узел',duration:3.5+zone*.3});
 }
 return {...source,grid,links,rooms,tasks,layoutSeed:0x600000+id*7919,intro:source.intro+(id===1?' В архиве водоканала есть дополнительный путь и припасы.':stage===3||stage===5?' В боковой станции возьми карту разведки и исследуй каждый зал.':' В боковой мастерской восстанови полевой узел: оставайся рядом до завершения ремонта.')};
}
