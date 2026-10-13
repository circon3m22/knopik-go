export type LevelRect = { x: number; y: number; w: number; h: number };
export type LevelCover = LevelRect & { kind: "pillar" | "rubble" | "pipe" | "tank" | "crate" | "barricade" | "breakwater" | "machine" };
export type AdventureWeapon = "fist" | "sabre" | "pistol";
export const ADVENTURE_WEAPONS = {
  fist: { name: "Кулак", range: 61, cooldown: .36, damage: 1 },
  sabre: { name: "Сабля", range: 96, cooldown: 1.15, damage: 2 },
  pistol: { name: "Пистолет", range: 380, cooldown: .55, damage: 1 },
} as const;
type Spawn = { x: number; y: number; room: number; kind: "bat" | "gun"; boss?: boolean };
export type AdventureLevel = {
  id: number; name: string; feature: string; intro: string; mechanic: "sewer" | "steam" | "barrels" | "current" | "boss";
  rooms: LevelRect[]; roomNames: string[]; solids: LevelCover[]; gates: LevelRect[]; floors: LevelRect[]; enemies: Spawn[];
  jets: (LevelRect & { offset: number })[]; barrels: { x: number; y: number; room: number }[];
  currents: (LevelRect & { dx: number; dy: number })[]; height: number; bounds: { x: number; w: number };
  palette: { wall: string; floor: string; light: string; dark: string; accent: string; water: string };
};
const PALETTES = [
  { wall: "#586566", floor: "#809084", light: "#98ab91", dark: "#343d48", accent: "#c7b593", water: "#263d45" },
  { wall: "#6f6e62", floor: "#979380", light: "#c1b995", dark: "#3e4949", accent: "#dfad64", water: "#405b5c" },
  { wall: "#775442", floor: "#99836b", light: "#c7a37f", dark: "#403c43", accent: "#d97b70", water: "#3d5359" },
  { wall: "#466b75", floor: "#71979a", light: "#a4b7b3", dark: "#263d45", accent: "#88c9d1", water: "#3b758d" },
  { wall: "#665665", floor: "#85767d", light: "#b99d8d", dark: "#343041", accent: "#d97b70", water: "#3d4358" },
];
function level(id: number, name: string, feature: string, intro: string, mechanic: AdventureLevel["mechanic"], sizes: [number, number][], counts: number[], roomNames: string[]): AdventureLevel {
  let top = 72;
  const rooms: LevelRect[] = [];
  for (let i = sizes.length - 1; i >= 0; i--) {
    const [w, h] = sizes[i]; rooms[i] = { x: 240-w/2, y: top, w, h }; top += h + 128 + i % 2 * 32;
  }
  const floors = [...rooms], gates = rooms.slice(0,-1).map(r => ({ x: 160, y: r.y-64, w: 160, h: 12 }));
  rooms.slice(0,-1).forEach((r,i) => floors.push({ x:160,y:rooms[i+1].y+rooms[i+1].h-8,w:160,h:r.y-(rooms[i+1].y+rooms[i+1].h)+16 }));
  const solids: LevelCover[] = [], enemies: Spawn[] = [], jets: AdventureLevel["jets"] = [], barrels: AdventureLevel["barrels"] = [], currents: AdventureLevel["currents"] = [];
  rooms.forEach((r,i) => {
    // Human-sized cover stays readable as chambers grow. A broad spine and
    // side lanes connect every entrance, spawn and combat pocket.
    const add = (kind: LevelCover["kind"], x: number, y: number, w: number, h: number) => solids.push({kind,x,y:r.y+y,w,h});
    const left=r.x+72,right=r.x+r.w-144, upper=Math.round(r.h*.32), lower=Math.round(r.h*.65);
    const flip=i%2===0;
    add("pillar",left,upper,52,60); add("pillar",right,lower,52,60);
    if (mechanic === "steam") {
      add("tank",85,upper,80,108); add("tank",315,lower-30,80,108);
      add("pipe",r.x+28,lower,120,32); add("pipe",r.x+r.w-166,upper+105,138,32);
      add("machine",flip?right-35:left+80,flip?90:r.h-128,84,62);
      jets.push({x:176,y:r.y+Math.round(r.h*.5),w:128,h:26,offset:i*.85});
      if(i>0) jets.push({x:flip?left+20:right-80,y:r.y+lower+85,w:112,h:24,offset:i*.85+1.7});
    } else if (mechanic === "barrels") {
      add("crate",75,upper,92,72); add("crate",325,lower,96,76);
      add("crate",left+90,lower+12,80,100); add("crate",right-100,upper-35,76,112);
      add("barricade",flip?left+40:right-95,flip?105:r.h-110,116,34);
      barrels.push({x:40,y:r.y+120,room:i},{x:440,y:r.y+110,room:i});
      if(i>1) barrels.push({x:flip?left+70:right-25,y:r.y+lower-70,room:i});
    } else if (mechanic === "current") {
      add("breakwater",64,upper-20,100,52); add("breakwater",318,lower,100,52);
      add("breakwater",left+65,lower+30,42,126); add("breakwater",right-40,upper-60,42,126);
      add("pipe",flip?left+20:right-105,flip?100:r.h-116,112,30);
      currents.push({x:112,y:r.y+95,w:256,h:r.h-185,dx:i%2?-.65:.65,dy:-.5});
    } else if (mechanic === "boss") {
      add("machine",72,upper,100,90); add("machine",310,lower,100,90);
      add("pipe",r.x+25,lower+40,128,32); add("barricade",r.x+r.w-165,upper+115,128,34);
      if(i<rooms.length-1) {
        add("tank",flip?left+80:right-100,flip?94:r.h-156,64,90);
        jets.push({x:185,y:r.y+Math.round(r.h*.5),w:110,h:24,offset:i*.7});
      }
    } else {
      add("rubble",85,upper+25,72,60); add("pillar",330,lower,56,72);
      add("pipe",r.x+35,lower+20,108,30); add("rubble",right-70,upper-45,84,54);
      if(i>0) add("barricade",left+80,r.h-112,100,32);
    }
    const positions = [[r.x+58,r.y+98],[r.x+r.w-58,r.y+96],[240,r.y+125],[r.x+58,r.y+r.h-105],[r.x+r.w-58,r.y+r.h-105]];
    for (let n=0;n<counts[i];n++) {
      const [x,y]=positions[n]; const boss=mechanic==="boss" && i===rooms.length-1 && n===2;
      enemies.push({x,y,room:i,kind:!boss && (id>=3 && (n===1 || n===4) || id===2 && i>=2 && n===1 || id===1 && (i===1 && n===1 || i===2 && n===2))?"gun":"bat",boss});
    }
  });
  return {id,name,feature,intro,mechanic,rooms,roomNames,solids,gates,floors,enemies,jets,barrels,currents,height:rooms[0].y+rooms[0].h+80,bounds:{x:-272,w:1024},palette:PALETTES[id-1]};
}
export const ADVENTURE_LEVELS: readonly AdventureLevel[] = [
  level(1,"Под домом","3 просторных зала · трубы и завалы","Три зала под домом. Обходи опоры и завалы, укрывайся от выстрелов и открывай решётки.","sewer",[[760,560],[840,600],[800,620]],[2,2,3],["ПРИЁМНЫЙ ЗАЛ","РЕМОНТНЫЙ УЧАСТОК","ДРЕНАЖНЫЙ УЗЕЛ"]),
  level(2,"Старая насосная","4 зала · резервуары и пар · сабля","Здесь лопнули паровые трубы. Жёлтые полосы предупреждают о выбросе. Ты нашёл саблю: широкий удар по нескольким врагам, но между взмахами нужна пауза.","steam",[[800,600],[720,660],[880,620],[816,700]],[3,3,3,3],["ПОДАЧА ВОДЫ","КОТЕЛЬНЫЙ ЗАЛ","ФИЛЬТРЫ","ГЛАВНЫЙ НАСОС"]),
  level(3,"Склад контрабанды","5 залов · штабеля и взрывные бочки","Сахуры прячут оружие среди ящиков. Пистолет теперь твой. Красные бочки взрываются от попадания — отойди, прежде чем стрелять рядом с ними.","barrels",[[864,620],[768,680],[816,640],[912,700],[864,680]],[3,3,4,4,4],["РАЗГРУЗКА","СОРТИРОВКА","ТАЙНИК","ГРУЗОВОЙ ЗАЛ","АРСЕНАЛ"]),
  level(4,"Затопленный коллектор","6 залов · волнорезы и течение","Вода тормозит шаг и сносит Кнопика. Держись сухих краёв, прячься за волнорезами и пересекай поток рывком. Сахуров здесь больше.","current",[[800,640],[896,700],[752,660],[864,720],[720,680],[912,740]],[3,4,4,4,5,5],["ПЕРВЫЙ ШЛЮЗ","СБРОС ВОДЫ","ОБХОДНОЙ КАНАЛ","РАЗВИЛКА","ЗАТВОРЫ","НИЖНИЙ КОЛЛЕКТОР"]),
  level(5,"Сердце канализации","7 залов · механизмы и вожак Сахуров","Дальше работает главный механизм. Последнюю комнату охраняет вожак: он бьёт по кругу, а потеряв половину здоровья, стреляет веером. Красное кольцо — сигнал для рывка.","boss",[[864,660],[800,700],[912,680],[768,720],[880,700],[816,740],[912,760]],[4,4,4,5,5,5,3],["ПРИВОДЫ","КОМПРЕССОРЫ","СИЛОВОЙ ЗАЛ","РАСПРЕДЕЛИТЕЛЬ","РЕГУЛЯТОРЫ","КАМЕРА ДАВЛЕНИЯ","ЛОГОВО ВОЖАКА"]),
];
export function adventureLevel(id: number) { return ADVENTURE_LEVELS[Math.max(0,Math.min(4,Math.floor(Number.isFinite(id)?id:1)-1))]; }
export function sanitizeCompletedLevel(value: unknown) { return typeof value==="number" && Number.isFinite(value)?Math.max(0,Math.min(5,Math.floor(value))):0; }
export function sanitizeWeaponTier(value: unknown) { return typeof value==="number" && Number.isFinite(value)?Math.max(0,Math.min(2,Math.floor(value))):0; }
