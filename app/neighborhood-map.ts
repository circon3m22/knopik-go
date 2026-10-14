export type WorldRect = { x: number; y: number; w: number; h: number };
import type { NeighborhoodProgress } from "./neighborhood-progress";
export type NeighborhoodObject = {
  id: string; kind: "house" | "tree" | "lamp" | "bench" | "planter" | "kiosk" | "bicycle" | "bin" | "sign" | "car" | "fence" | "hydrant" | "mailbox" | "stone" | "notice" | "fountain" | "utility";
  x: number; y: number; variant?: number; w?: number; h?: number; floors?: number; home?: boolean;
};
export const NEIGHBORHOOD_BOUNDS = { x: 0, y: 0, w: 2400, h: 2050 };
export const NEIGHBORHOOD_SPAWN = { x: 410, y: 655 };
export const NEIGHBORHOOD_BOARDWALK: WorldRect = { x: 1870, y: 1665, w: 220, h: 150 };
export const NEIGHBORHOOD_BUILDINGS: NeighborhoodObject[] = [
  { id: "home", kind: "house", x: 180, y: 570, w: 440, h: 365, floors: 3, variant: 0, home: true },
  { id: "linden-12", kind: "house", x: 755, y: 570, w: 325, h: 360, floors: 4, variant: 1 },
  { id: "linden-6", kind: "house", x: -195, y: 510, w: 290, h: 325, floors: 3, variant: 2 },
  { id: "park-3", kind: "house", x: 2225, y: 630, w: 340, h: 360, floors: 4, variant: 3 },
  { id: "river-4", kind: "house", x: 680, y: 1435, w: 330, h: 335, floors: 3, variant: 2 },
  { id: "river-6", kind: "house", x: 1170, y: 1450, w: 340, h: 370, floors: 4, variant: 3 },
  { id: "river-2", kind: "house", x: 25, y: 1400, w: 310, h: 360, floors: 3, variant: 1 },
  { id: "park-5", kind: "house", x: 2200, y: 1420, w: 350, h: 370, floors: 4, variant: 0 },
];
const parkTrees = [[1280,365],[1430,300],[1620,300],[1830,315],[2050,365],[1230,500],[1360,465],[1920,515],[2105,550],[1330,740],[1790,750],[1960,765],[2110,745]];
const streetTrees = [[105,735],[720,730],[1110,740],[2220,780],[103,1000],[570,1000],[1055,1015],[1600,1030],[2270,1010],[350,1310],[570,1475],[1040,1485],[1580,1475],[2160,1490],[180,1650],[650,1640],[1090,1650],[2280,1650]];
const lamps = [[650,645],[1140,705],[1510,435],[1890,680],[2250,825],[500,815],[470,1205],[1110,1025],[1680,1100],[2140,1240],[570,1650],[1150,1650],[1750,1650],[2150,1650],[1890,1760],[2070,1760]];
export const NEIGHBORHOOD_OBJECTS: NeighborhoodObject[] = [
  ...NEIGHBORHOOD_BUILDINGS,
  ...[...parkTrees,...streetTrees].map(([x,y],i):NeighborhoodObject=>({ id:`tree-${i}`,kind:"tree",x,y,variant:i%4 })),
  ...lamps.map(([x,y],i):NeighborhoodObject=>({id:`lamp-${i}`,kind:"lamp",x,y,variant:i>=14?2:i%2})),
  {id:"park-bench",kind:"bench",x:1555,y:560,variant:0}, {id:"river-bench",kind:"bench",x:1670,y:1635,variant:1},
  {id:"home-bench",kind:"bench",x:535,y:695,variant:0}, {id:"park-bench-2",kind:"bench",x:1925,y:730,variant:1},
  {id:"kiosk",kind:"kiosk",x:865,y:770},
  {id:"home-flowers",kind:"planter",x:285,y:670,variant:0}, {id:"neighbor-flowers",kind:"planter",x:990,y:665,variant:1},
  {id:"park-flowers",kind:"planter",x:1745,y:425,variant:2}, {id:"river-flowers",kind:"planter",x:1520,y:1615,variant:0},
  {id:"bicycle",kind:"bicycle",x:710,y:645}, {id:"bicycle-2",kind:"bicycle",x:1040,y:1420,variant:1},
  {id:"bin-1",kind:"bin",x:1490,y:565},{id:"bin-2",kind:"bin",x:1740,y:1645},
  {id:"park-sign",kind:"sign",x:1320,y:805,variant:0},{id:"river-sign",kind:"sign",x:2120,y:1430,variant:1},
  {id:"run-sign",kind:"sign",x:2260,y:895,variant:2},{id:"mailbox",kind:"mailbox",x:660,y:585},
  {id:"hydrant",kind:"hydrant",x:1180,y:810},
  {id:"car-1",kind:"car",x:235,y:944,variant:0},{id:"car-2",kind:"car",x:930,y:862,variant:1},
  {id:"fence-1",kind:"fence",x:1190,y:375,variant:0},{id:"fence-2",kind:"fence",x:2130,y:375,variant:1},
  {id:"stone-1",kind:"stone",x:1800,y:1670},{id:"stone-2",kind:"stone",x:2210,y:1685},
  {id:"notice-board",kind:"notice",x:1000,y:712},
  {id:"courtyard-fountain",kind:"fountain",x:1810,y:1080},
  {id:"fishing-gear",kind:"utility",x:1585,y:1590,variant:0},
  {id:"garden-tools",kind:"utility",x:2050,y:1390,variant:1},
];
export const NEIGHBORHOOD_LAMPS = NEIGHBORHOOD_OBJECTS.filter(o=>o.kind==="lamp");
export const NEIGHBORHOOD_SOLIDS: WorldRect[] = NEIGHBORHOOD_OBJECTS.flatMap(o=>{
  if(o.kind==="house")return [{x:o.x,y:o.y-o.h!,w:o.w!,h:o.h!}];
  if(o.kind==="tree")return [{x:o.x-11,y:o.y-19,w:22,h:25}];
  if(o.kind==="kiosk")return [{x:o.x-65,y:o.y-94,w:130,h:100}];
  if(o.kind==="bench")return [{x:o.x-58,y:o.y-26,w:116,h:32}];
  if(o.kind==="planter")return [{x:o.x-40,y:o.y-27,w:80,h:35}];
  if(o.kind==="car")return [{x:o.x-88,y:o.y-35,w:176,h:48}];
  if(o.kind==="fence")return [{x:o.x-5,y:o.y-100,w:10,h:125}];
  if(o.kind==="notice")return [{x:o.x-50,y:o.y-23,w:100,h:26}];
  if(o.kind==="fountain")return [{x:o.x-73,y:o.y-35,w:146,h:60}];
  if(o.kind==="utility")return [{x:o.x-28,y:o.y-25,w:56,h:28}];
  if(["lamp","bin","hydrant","mailbox","sign"].includes(o.kind))return [{x:o.x-9,y:o.y-12,w:18,h:18}];
  return [];
}).concat([{x:1740,y:1165,w:275,h:42},{x:1740,y:1245,w:275,h:42},{x:1740,y:1325,w:275,h:42}]);
export const NEIGHBORHOOD_POINTS = [
  {id:"home",x:410,y:600,label:"Вернуться домой"},
  {id:"neighbor",x:585,y:735,label:"Поговорить с соседом"},
  {id:"bench",x:1555,y:600,label:"Посидеть на лавочке"},
  {id:"badge",x:1730,y:550,label:"Посмотреть в траве"},
  {id:"pebble",x:2020,y:1615,label:"Поднять камешек"},
  {id:"secret",x:1410,y:420,label:"Заглянуть под дерево"},
  {id:"kiosk",x:865,y:805,label:"Поговорить с Альбертом"},
  {id:"run",x:2310,y:910,label:"Начать погоню"},
  {id:"river",x:1990,y:1770,label:"Посмотреть на реку"},
  {id:"cat",x:1665,y:1290,label:"Позвать кота"},
  {id:"gardener",x:1880,y:645,label:"Поговорить с садовницей"},
  {id:"caretaker",x:690,y:1045,label:"Поговорить с Дэнисом"},
  {id:"fisher",x:1640,y:1540,label:"Поговорить с Норманом"},
  {id:"photographer",x:1190,y:670,label:"Поговорить с Бобом"},
  {id:"girl",x:1570,y:1100,label:"Поговорить с Оскаром"},
  {id:"bed-one",x:1820,y:1226,label:"Полить грядку с мятой"},
  {id:"bed-two",x:1820,y:1306,label:"Полить цветы"},
  {id:"bed-three",x:1820,y:1386,label:"Полить молодые ростки"},
  {id:"repair-home",x:690,y:645,label:"Заменить лампу у дома"},
  {id:"repair-park",x:1930,y:680,label:"Заменить лампу в парке"},
  {id:"repair-river",x:1790,y:1650,label:"Заменить лампу у реки"},
  {id:"litter-one",x:700,y:1595,label:"Убрать бутылку"},
  {id:"litter-two",x:1230,y:1630,label:"Собрать бумагу"},
  {id:"litter-three",x:1840,y:1590,label:"Поднять банку"},
  {id:"photo-home",x:420,y:710,label:"Снять свой дом"},
  {id:"photo-tree",x:1600,y:420,label:"Снять старую липу"},
  {id:"photo-river",x:1860,y:1560,label:"Снять реку"},
  {id:"notice",x:1000,y:760,label:"Прочитать доску объявлений"},
  {id:"fountain",x:1810,y:1138,label:"Посмотреть на фонтан"},
] as const;
export type NeighborhoodPointId = typeof NEIGHBORHOOD_POINTS[number]["id"];
export function neighborhoodZone(x:number,y:number):string { return y>1510?"Набережная":x>1190&&y<825?"Липовый парк":y>790&&y<1050?"Липовая улица":y>1050?"Соседние дворы":"Двор Кнопика"; }
export function neighborhoodLampOn(id:string,progress?:NeighborhoodProgress){const bit=["lamp-0","lamp-3","lamp-12"].indexOf(id);return bit<0||!progress||!!(progress.missions.lights.steps&(1<<bit));}
export function neighborhoodLight(x:number,y:number,progress?:NeighborhoodProgress):number {
  return Math.max(0,...NEIGHBORHOOD_LAMPS.filter(l=>neighborhoodLampOn(l.id,progress)).map(l=>Math.max(0,1-Math.hypot(x-l.x,(y-l.y)*.82)/140)), Math.max(0,1-Math.hypot(x-410,y-585)/105));
}
/** Cool moonlight in shade; nearby lanterns restore warm fur, including the face. */
export function neighborhoodActorMatrix(light:number):string {
  const t=Math.max(0,Math.min(1,light));
  return `${.43+t*.47} 0 0 0 ${.025+t*.035} 0 ${.49+t*.30} 0 0 ${.035+t*.013} 0 0 ${.67+t*.01} 0 .055 0 0 0 1 0`;
}
