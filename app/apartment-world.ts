export type HomeRoomId = "living" | "hall" | "bar" | "wardrobe" | "vault" | "laboratory";
export const HOME_ROOM_OFFSETS:Record<HomeRoomId,{x:number;y:number}>={bar:{x:0,y:0},living:{x:-40,y:-540},laboratory:{x:-80,y:-540},wardrobe:{x:0,y:-36},hall:{x:-40,y:504},vault:{x:-80,y:504}};
export const HOME_ROOMS = [
  {id:"bar",name:"Бар Кнопика",x:40,y:160,w:424,h:440,accent:"#d6a263",hint:"Коллекция напитков и сны"},
  {id:"living",name:"Гостиная",x:480,y:160,w:424,h:440,accent:"#98bba2",hint:"Два больших окна, диван и твой любимый дом"},
  {id:"laboratory",name:"Лаборатория",x:920,y:160,w:424,h:440,accent:"#83cece",hint:"Собирай ингредиенты и открывай рецепты"},
  {id:"wardrobe",name:"Гардеробная",x:40,y:664,w:424,h:440,accent:"#b799bb",hint:"Примерь вещи и выбери комплект"},
  {id:"hall",name:"Прихожая",x:480,y:664,w:424,h:440,accent:"#b9bf9a",hint:"Входная дверь внизу · выход на улицу без кнопки"},
  {id:"vault",name:"Сейфовая",x:920,y:664,w:424,h:440,accent:"#d8bc76",hint:"Здесь хранятся твои сбережения"},
] as const;
export const HOME_CORRIDORS = [{x:464,y:298,w:16,h:84},{x:904,y:298,w:16,h:84},{x:644,y:600,w:96,h:64},{x:464,y:902,w:16,h:84},{x:904,y:902,w:16,h:84}] as const;
export const HOME_FLOORS=[...HOME_ROOMS,...HOME_CORRIDORS];
export const HOME_CAMERA_WIDTH=420;
export const HOME_BOUNDS={x:16,y:60,w:1352,h:1090};
export const HOME_SPAWN={x:692,y:480};
export const HOME_ENTRY={x:692,y:1032};
export const HOME_LIGHTS=[{x:402,y:530},{x:832,y:1029},{x:1205,y:1004},{x:420,y:978},{x:680,y:302},{x:1210,y:520},{x:1135,y:415}];
const solidGroups:Record<HomeRoomId,readonly {x:number;y:number;w:number;h:number}[]>={
 living:[{x:542,y:930,w:146,h:68},{x:740,y:942,w:88,h:54},{x:532,y:788,w:90,h:48},{x:832,y:788,w:100,h:45},{x:538,y:1062,w:42,h:46},{x:832,y:1034,w:94,h:92}],
 hall:[{x:550,y:330,w:84,h:48},{x:876,y:322,w:55,h:58},{x:845,y:505,w:60,h:44}],
 bar:[{x:74,y:177,w:350,h:89},{x:115,y:296,w:30,h:28},{x:230,y:296,w:30,h:28},{x:345,y:296,w:30,h:28},{x:135,y:477,w:106,h:42},{x:64,y:420,w:42,h:112},{x:357,y:503,w:48,h:48}],
 wardrobe:[{x:65,y:718,w:348,h:65},{x:65,y:805,w:45,h:130},{x:166,y:1014,w:133,h:42}],
 vault:[{x:1140,y:223,w:148,h:97},{x:1295,y:445,w:88,h:52},{x:1025,y:190,w:42,h:68}],
 laboratory:[{x:1028,y:718,w:352,h:85},{x:1137,y:934,w:156,h:66},{x:1027,y:1037,w:62,h:60}],
};
export const HOME_SOLIDS=Object.entries(solidGroups).flatMap(([room,solids])=>{const o=HOME_ROOM_OFFSETS[room as HomeRoomId];return solids.map(s=>({...s,x:s.x+o.x,y:s.y+o.y}));});
export function homeRoomAt(x:number,y:number):typeof HOME_ROOMS[number] {return HOME_ROOMS.find(r=>x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h)??HOME_ROOMS.reduce((best,r)=>Math.hypot(x-r.x-r.w/2,y-r.y-r.h/2)<Math.hypot(x-best.x-best.w/2,y-best.y-best.h/2)?r:best);}
export function homeLightAt(x:number,y:number){return Math.max(0,...HOME_LIGHTS.map(l=>1-Math.hypot(x-l.x,y-l.y)/190));}
