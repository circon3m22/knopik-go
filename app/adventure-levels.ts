export type LevelRect = { x: number; y: number; w: number; h: number };
export type AdventureWeapon = "fist" | "sabre" | "pistol";
export const ADVENTURE_WEAPONS = {
  fist: { name: "Кулак", range: 61, cooldown: .36, damage: 1 },
  sabre: { name: "Сабля", range: 96, cooldown: 1.15, damage: 2 },
  pistol: { name: "Пистолет", range: 380, cooldown: .55, damage: 1 },
} as const;
type Spawn = { x: number; y: number; room: number; kind: "bat" | "gun"; boss?: boolean };
export type AdventureLevel = {
  id: number; name: string; feature: string; intro: string; mechanic: "sewer" | "steam" | "barrels" | "current" | "boss";
  rooms: LevelRect[]; solids: LevelRect[]; gates: LevelRect[]; floors: LevelRect[]; enemies: Spawn[];
  jets: (LevelRect & { offset: number })[]; barrels: { x: number; y: number; room: number }[];
  currents: (LevelRect & { dx: number; dy: number })[]; height: number;
  palette: { wall: string; floor: string; light: string; dark: string; accent: string; water: string };
};
const PALETTES = [
  { wall: "#586566", floor: "#809084", light: "#98ab91", dark: "#343d48", accent: "#c7b593", water: "#263d45" },
  { wall: "#6f6e62", floor: "#979380", light: "#c1b995", dark: "#3e4949", accent: "#dfad64", water: "#405b5c" },
  { wall: "#775442", floor: "#99836b", light: "#c7a37f", dark: "#403c43", accent: "#d97b70", water: "#3d5359" },
  { wall: "#466b75", floor: "#71979a", light: "#a4b7b3", dark: "#263d45", accent: "#88c9d1", water: "#3b758d" },
  { wall: "#665665", floor: "#85767d", light: "#b99d8d", dark: "#343041", accent: "#d97b70", water: "#3d4358" },
];
const firstRooms = [{ x: 36, y: 944, w: 408, h: 392 }, { x: 36, y: 524, w: 408, h: 352 }, { x: 36, y: 72, w: 408, h: 384 }];
const firstSolids = [{ x: 90, y: 1100, w: 52, h: 56 }, { x: 342, y: 1072, w: 44, h: 80 }, { x: 150, y: 650, w: 50, h: 60 }, { x: 310, y: 708, w: 48, h: 58 }, { x: 92, y: 232, w: 54, h: 64 }, { x: 335, y: 245, w: 52, h: 70 }];
const first: AdventureLevel = {
  id: 1, name: "Под домом", feature: "Знакомство с канализацией", intro: "Три комнаты. Сначала кулаки, уклонение и открывающиеся решётки.", mechanic: "sewer",
  rooms: firstRooms, solids: firstSolids, floors: [...firstRooms, { x: 186, y: 860, w: 108, h: 100 }, { x: 186, y: 440, w: 108, h: 100 }], gates: [{ x: 184, y: 902, w: 112, h: 12 }, { x: 184, y: 482, w: 112, h: 12 }],
  enemies: [{ x:155,y:1030,room:0,kind:"bat" },{ x:330,y:1000,room:0,kind:"bat" },{ x:105,y:590,room:1,kind:"bat" },{ x:355,y:575,room:1,kind:"gun" },{ x:210,y:285,room:2,kind:"bat" },{ x:345,y:380,room:2,kind:"bat" },{ x:240,y:145,room:2,kind:"gun" }],
  jets: [], barrels: [], currents: [], height: 1420, palette: PALETTES[0],
};
function level(id: number, name: string, feature: string, intro: string, mechanic: AdventureLevel["mechanic"], widths: number[], counts: number[]): AdventureLevel {
  const rooms = widths.map((w, i) => ({ x: 240-w/2, y: 72+(widths.length-1-i)*420, w, h: 340 }));
  const floors = [...rooms], gates = rooms.slice(0,-1).map(r => ({ x: 184, y: r.y-42, w: 112, h: 12 }));
  rooms.slice(0,-1).forEach((r,i) => floors.push({ x:186,y:rooms[i+1].y+rooms[i+1].h-8,w:108,h:r.y-(rooms[i+1].y+rooms[i+1].h)+16 }));
  const solids: LevelRect[] = [], enemies: Spawn[] = [], jets: AdventureLevel["jets"] = [], barrels: AdventureLevel["barrels"] = [], currents: AdventureLevel["currents"] = [];
  rooms.forEach((r,i) => {
    // Each room has a different silhouette and cover; the central exits remain walkable.
    const leftX=r.x+35,rightX=r.x+r.w-83;
    if (mechanic === "steam") {
      solids.push({x:leftX,y:r.y+152,w:48,h:73},{x:rightX,y:r.y+94,w:48,h:56});
      jets.push({x:176,y:r.y+145,w:128,h:26,offset:i*.85});
    } else if (mechanic === "barrels") {
      solids.push({x:leftX,y:r.y+172,w:62,h:48},{x:rightX,y:r.y+156,w:48,h:83});
      barrels.push({x:r.x+94,y:r.y+105,room:i},{x:r.x+r.w-98,y:r.y+80,room:i});
    } else if (mechanic === "current") {
      solids.push({x:leftX,y:r.y+180,w:38,h:45},{x:rightX+12,y:r.y+136,w:32,h:72});
      currents.push({x:155,y:r.y+80,w:170,h:192,dx:i%2?-.65:.65,dy:-.5});
    } else {
      solids.push({x:leftX,y:r.y+177,w:42,h:74},{x:rightX,y:r.y+172,w:46,h:48});
      if (i < rooms.length-1) jets.push({x:185,y:r.y+138,w:110,h:24,offset:i*.7});
    }
    const positions = [[r.x+60,r.y+72],[r.x+r.w-60,r.y+68],[240,r.y+105],[r.x+65,r.y+272],[r.x+r.w-60,r.y+276]];
    for (let n=0;n<counts[i];n++) {
      const [x,y]=positions[n]; const boss=mechanic==="boss" && i===rooms.length-1 && n===2;
      enemies.push({x,y,room:i,kind:!boss && (id>=3 && (n===1 || n===4) || id===2 && i>=2 && n===1)?"gun":"bat",boss});
    }
  });
  return {id,name,feature,intro,mechanic,rooms,solids,gates,floors,enemies,jets,barrels,currents,height:rooms[0].y+rooms[0].h+80,palette:PALETTES[id-1]};
}
export const ADVENTURE_LEVELS: readonly AdventureLevel[] = [
  first,
  level(2,"Старая насосная","4 комнаты · паровые выбросы · сабля","Здесь лопнули паровые трубы. Жёлтые полосы предупреждают о выбросе. Ты нашёл саблю: широкий удар по нескольким врагам, но между взмахами нужна пауза.","steam",[384,320,408,352],[3,3,3,3]),
  level(3,"Склад контрабанды","5 комнат · взрывные бочки · пистолет","Сахуры прячут оружие среди ящиков. Пистолет теперь твой. Красные бочки взрываются от попадания — отойди, прежде чем стрелять рядом с ними.","barrels",[408,352,320,408,384],[3,3,4,4,4]),
  level(4,"Затопленный коллектор","6 комнат · течение · узкие проходы","Вода тормозит шаг и сносит Кнопика. Держись сухих краёв, прячься за опорами и пересекай поток рывком. Сахуров здесь больше.","current",[352,408,320,384,288,408],[3,4,4,4,5,5]),
  level(5,"Сердце канализации","7 комнат · давление · вожак Сахуров","Дальше работает главный механизм. Последнюю комнату охраняет вожак: он бьёт по кругу, а потеряв половину здоровья, стреляет веером. Красное кольцо — сигнал для рывка.","boss",[384,352,408,320,384,352,408],[4,4,4,5,5,5,3]),
];
export function adventureLevel(id: number) { return ADVENTURE_LEVELS[Math.max(0,Math.min(4,Math.floor(Number.isFinite(id)?id:1)-1))]; }
export function sanitizeCompletedLevel(value: unknown) { return typeof value==="number" && Number.isFinite(value)?Math.max(0,Math.min(5,Math.floor(value))):0; }
export function sanitizeWeaponTier(value: unknown) { return typeof value==="number" && Number.isFinite(value)?Math.max(0,Math.min(2,Math.floor(value))):0; }
