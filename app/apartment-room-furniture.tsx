import {createContext,useContext,type ReactNode} from "react";
import {HOME_ROOM_OFFSETS,type HomeRoomId} from "./apartment-world";
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
function Prop({x,y,depth=y,children}:{x:number;y:number;depth?:number;children:ReactNode}) {const o=HOME_ROOM_OFFSETS[useContext(FurnitureRoom)];return <g data-home-prop-y={depth+o.y} transform={`translate(${x+o.x} ${projectAdventureY(y+o.y)}) scale(1 .82)`}>{children}</g>;}
export function ApartmentRoomProps({theme,keepsakes,balance=0,drinks=["pitbull","cocoa","bergamot"],brewing=false}:{theme:ThemeId;keepsakes?:NeighborhoodProgress;balance?:number;drinks?:readonly PotionKind[];brewing?:boolean}) {
 const p=APARTMENT_PALETTES[theme],night=theme==="night",spa=theme==="mint",bath=theme==="bath";
 return <HomeMaterialTheme.Provider value={theme}>
 <FurnitureRoom.Provider value="living"><Prop x={492} y={592} depth={998}><ApartmentSofa p={p} bench={spa||bath}/></Prop><Prop x={492} y={592} depth={996}><ApartmentCoffeeTable p={p}/></Prop>
 <Prop x={492} y={592} depth={836}><ApartmentConsole p={p} spa={spa} bath={bath} night={night}/></Prop><Prop x={492} y={592} depth={1126}>{bath?<SaunaStove/>:<ApartmentWardrobe p={p} spa={spa}/>}</Prop>
 <Prop x={492} y={592} depth={858}><ApartmentFloorLamp p={p} night={night}/></Prop><Prop x={492} y={592} depth={818}><g data-home-keepsakes-placement="" transform="translate(-174 -42) scale(.74)"><ApartmentKeepsakes items={keepsakes} night={night}/></g></Prop>
 {spa&&<Prop x={880} y={815}><ApartmentSteam x={0} y={0}/></Prop>}<Prop x={560} y={1094}><HomePlant/></Prop><Prop x={918} y={858}><HomePlant/></Prop>
 </FurnitureRoom.Provider>
 <FurnitureRoom.Provider value="bar"><Prop x={74} y={266}><HomeBarCounter drinks={drinks}/></Prop>{[130,245,360].map(x=><Prop key={x} x={x} y={324}><BarStool/></Prop>)}
 <Prop x={135} y={519}><DrinkTable/></Prop><Prop x={64} y={532}><UpholsteredBench width={105} vertical/></Prop><Prop x={386} y={551}><HomePlant/></Prop><Prop x={402} y={530}><ThemeLamp/></Prop>
 </FurnitureRoom.Provider>
 <FurnitureRoom.Provider value="wardrobe"><Prop x={65} y={783}><HomeWardrobe/></Prop><Prop x={87} y={935}><DressingMirror/></Prop><Prop x={166} y={1056}><UpholsteredBench/></Prop><Prop x={420} y={1078}><HomePlant/></Prop><Prop x={420} y={1014}><ThemeLamp/></Prop>
 </FurnitureRoom.Provider>
 <FurnitureRoom.Provider value="hall"><Prop x={550} y={378}><HallBench/></Prop><Prop x={900} y={380}><CoatTree/></Prop><Prop x={875} y={549}><HomePlant/></Prop><Prop x={872} y={525}><ThemeLamp/></Prop>
 </FurnitureRoom.Provider>
 <FurnitureRoom.Provider value="vault"><Prop x={1214} y={320}><HomeSafe balance={balance}/></Prop>
 <Prop x={1350} y={345} depth={849}><g data-vault-aura-machine=""><VaultAuraMachineArt inWorld/></g></Prop><Prop x={1295} y={497}><VaultDesk/></Prop><Prop x={1046} y={258}><HomePlant/></Prop><Prop x={1365} y={550}><HomePlant/></Prop><Prop x={1285} y={500}><ThemeLamp/></Prop>
 </FurnitureRoom.Provider>
 <FurnitureRoom.Provider value="laboratory"><Prop x={1028} y={803}><LabCabinet/></Prop><Prop x={1137} y={1000}><LabWorkbench active={brewing}/></Prop><Prop x={1060} y={1097}><SmallChest/></Prop><Prop x={1370} y={1090}><HomePlant/></Prop><Prop x={1290} y={1060}><ThemeLamp/></Prop>
 </FurnitureRoom.Provider></HomeMaterialTheme.Provider>;
}
