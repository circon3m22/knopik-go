import {UltraObjectRadiance} from './ultra-indirect-art';
import {ultraHomeSources} from './ultra-light-sources';
import type {RoomLight} from './ultra-light-geometry';
import type {LevelRect} from './adventure-levels';
import {HomeArmoryArt} from "./home-armory-art";
import {HOME_ARMORY} from "./home-armory";
import type {WeaponUpgrades} from "./weapon-progression";
import {isPremiumApartment,PremiumLivingFurniture} from "./premium-apartment-art";
import {useGraphicsQuality} from "./use-graphics-quality";
import {LowApartmentProps} from "./quality-world-art";
import {AURA_MACHINE} from "./aura-machine";
import {createContext,useContext,type ReactNode} from "react";
import {HOME_ROOM_OFFSETS,HOME_SOLIDS,HOME_ROOMS,type HomeRoomId} from "./apartment-world";
import { APARTMENT_PALETTES } from "./apartment-artwork";
import { ApartmentSofa, ApartmentCoffeeTable, ApartmentConsole, ApartmentWardrobe, ApartmentFloorLamp, SaunaStove, ApartmentSteam } from "./apartment-furniture";
import { ApartmentKeepsakes } from "./apartment-keepsakes";
import {HomeMaterialTheme} from "./apartment-materials";
import {HomePlant,BarStool,HomeBarCounter,DrinkTable,UpholsteredBench,HomeWardrobe,DressingMirror,HomeSafe,LabCabinet,LabWorkbench,SmallChest,HallBench,CoatTree,VaultDesk,ThemeLamp} from "./apartment-detail-furniture";
import type { ThemeId } from "./cosmetic-engine";
import {VaultAuraMachineArt} from "./aura-artwork";
import type { PotionKind } from "./pixel-artwork";
import type { NeighborhoodProgress } from "./neighborhood-progress";
import { projectAdventureY } from "./adventure-projection";
export {LaboratoryReactor} from "./apartment-detail-furniture";
const FurnitureRoom=createContext<HomeRoomId>("bar");
const FurnitureRadiance=createContext<readonly RoomLight[]|null>(null);
function Prop({x,y,depth=y,world=false,lit,children}:{x:number;y:number;depth?:number;world?:boolean;lit?:LevelRect;children:ReactNode}) {
 const room=useContext(FurnitureRoom),lights=useContext(FurnitureRadiance),o=world?{x:0,y:0}:HOME_ROOM_OFFSETS[room],origin={x:x+o.x,y:y+o.y};
 const target=lights&&lit?{...lit,x:lit.x+origin.x,y:lit.y+origin.y}:undefined,area=target&&HOME_ROOMS.find(r=>target.x+target.w/2>=r.x&&target.x+target.w/2<=r.x+r.w&&target.y+target.h/2>=r.y&&target.y+target.h/2<=r.y+r.h);
 return <g data-home-prop-y={depth+o.y} transform={`translate(${origin.x} ${projectAdventureY(origin.y)}) scale(1 .82)`}>{children}{lights&&target&&area&&<UltraObjectRadiance rect={target} origin={origin} lights={lights.filter(l=>l.x>=area.x&&l.x<=area.x+area.w&&l.y>=area.y&&l.y<=area.y+area.h)} casters={HOME_SOLIDS}/>}</g>;
}
export function ApartmentRoomProps({weaponTier=0,upgrades,theme,keepsakes,balance=0,drinks=["pitbull","cocoa","bergamot"],brewing=false}:{weaponTier?:number;upgrades?:WeaponUpgrades;theme:ThemeId;keepsakes?:NeighborhoodProgress;balance?:number;drinks?:readonly PotionKind[];brewing?:boolean}) {
 const quality=useGraphicsQuality();
 if(quality==="low")return <><LowApartmentProps/><g data-home-prop-y={HOME_ARMORY.y} transform={`translate(${HOME_ARMORY.x} ${projectAdventureY(HOME_ARMORY.y)}) scale(1 .82)`}><HomeArmoryArt low theme={theme} weaponTier={weaponTier} upgrades={upgrades}/></g></>;
 const p=APARTMENT_PALETTES[theme],night=(theme==="night"||theme==="observatory"),spa=theme==="mint",bath=theme==="bath";
 return <HomeMaterialTheme.Provider value={theme}><FurnitureRadiance.Provider value={quality==="ultra"?ultraHomeSources(theme):null}>
 <Prop world x={HOME_ARMORY.x} y={HOME_ARMORY.y}><HomeArmoryArt theme={theme} weaponTier={weaponTier} upgrades={upgrades}/></Prop>
 <FurnitureRoom.Provider value="living"><Prop x={492} y={592} depth={998} lit={{x:50,y:338,w:146,h:68}}>{isPremiumApartment(theme)?<PremiumLivingFurniture theme={theme} kind="sofa"/>:<ApartmentSofa p={p} bench={spa||bath}/>}</Prop><Prop x={492} y={592} depth={996} lit={{x:248,y:350,w:88,h:54}}><ApartmentCoffeeTable p={p}/></Prop>
 <Prop x={492} y={592} depth={836} lit={{x:340,y:196,w:100,h:45}}>{isPremiumApartment(theme)?<PremiumLivingFurniture theme={theme} kind="console"/>:<ApartmentConsole p={p} spa={spa} bath={bath} night={night}/>}</Prop><Prop x={492} y={592} depth={1126} lit={{x:340,y:442,w:94,h:92}}>{bath?<SaunaStove/>:<ApartmentWardrobe p={p} spa={spa}/>}</Prop>
 <Prop x={492} y={592} depth={858}><ApartmentFloorLamp p={p} night={night&&quality!=="ultra"}/></Prop><Prop x={492} y={592} depth={818}><g data-home-keepsakes-placement="" transform="translate(-174 -42) scale(.74)"><ApartmentKeepsakes items={keepsakes} night={night}/></g></Prop>
 {spa&&<Prop x={880} y={815}><ApartmentSteam x={0} y={0}/></Prop>}<Prop x={560} y={1094}><HomePlant/></Prop><Prop x={918} y={858}><HomePlant/></Prop>
 </FurnitureRoom.Provider>
 <FurnitureRoom.Provider value="bar"><Prop x={74} y={266} lit={{x:0,y:-89,w:350,h:89}}><HomeBarCounter drinks={drinks}/></Prop>{[130,245,360].map(x=><Prop key={x} x={x} y={324}><BarStool/></Prop>)}
 <Prop x={135} y={519}><DrinkTable/></Prop><Prop x={64} y={532}><UpholsteredBench width={105} vertical/></Prop><Prop x={386} y={551}><HomePlant/></Prop><Prop x={402} y={530}><ThemeLamp/></Prop>
 </FurnitureRoom.Provider>
 <FurnitureRoom.Provider value="wardrobe"><Prop x={65} y={783} lit={{x:0,y:-65,w:348,h:65}}><HomeWardrobe/></Prop><Prop x={87} y={935}><DressingMirror/></Prop><Prop x={166} y={1056}><UpholsteredBench/></Prop><Prop x={420} y={1078}><HomePlant/></Prop><Prop x={420} y={1014}><ThemeLamp/></Prop>
 </FurnitureRoom.Provider>
 <FurnitureRoom.Provider value="hall"><Prop x={550} y={378} lit={{x:0,y:-48,w:84,h:48}}><HallBench/></Prop><Prop x={900} y={380}><CoatTree/></Prop><Prop x={875} y={549}><HomePlant/></Prop><Prop x={872} y={525}><ThemeLamp/></Prop>
 </FurnitureRoom.Provider>
 <FurnitureRoom.Provider value="vault"><Prop x={1214} y={320} lit={{x:-74,y:-97,w:148,h:97}}><HomeSafe balance={balance}/></Prop>
 <Prop world x={AURA_MACHINE.x} y={AURA_MACHINE.y} depth={AURA_MACHINE.body.y+AURA_MACHINE.body.h/2}><g data-vault-aura-machine=""><rect data-aura-footprint="" x={AURA_MACHINE.body.x-AURA_MACHINE.x} y={AURA_MACHINE.body.y-AURA_MACHINE.y} width={AURA_MACHINE.body.w} height={AURA_MACHINE.body.h} fill="#29233155"/><VaultAuraMachineArt inWorld/></g></Prop><Prop x={1295} y={497}><VaultDesk/></Prop><Prop x={1046} y={258}><HomePlant/></Prop><Prop x={1365} y={550}><HomePlant/></Prop><Prop x={1285} y={500}><ThemeLamp/></Prop>
 </FurnitureRoom.Provider>
 <FurnitureRoom.Provider value="laboratory"><Prop x={1028} y={803} lit={{x:0,y:-85,w:352,h:85}}><LabCabinet/></Prop><Prop x={1137} y={1000} lit={{x:0,y:-66,w:156,h:66}}><LabWorkbench active={brewing}/></Prop><Prop x={1060} y={1097}><SmallChest/></Prop><Prop x={1370} y={1090}><HomePlant/></Prop><Prop x={1290} y={1060}><ThemeLamp/></Prop>
 </FurnitureRoom.Provider></FurnitureRadiance.Provider></HomeMaterialTheme.Provider>;
}
