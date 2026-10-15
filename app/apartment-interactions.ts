import {AURA_MACHINE} from "./aura-machine.ts";
import type { HomeRoomId } from "./apartment-world.ts";
export type ApartmentDestination = "street" | "bar" | "basement" | "wardrobe" | "vault" | "laboratory" | "computer" | "aura";
export const APARTMENT_DESTINATIONS: readonly {id:ApartmentDestination;room:HomeRoomId;label:string;x:number;y:number;w:number;h:number}[] = [
  {id:"computer",room:"living",label:"Зайти в компьютер",x:698,y:368,w:106,h:85},
  {id:"street",room:"hall",label:"Выйти на улицу",x:632,y:1000,w:120,h:120},
  {id:"basement",room:"hall",label:"Выбрать уровень",x:780,y:654,w:120,h:120},
  {id:"bar",room:"bar",label:"Открыть бар",x:100,y:168,w:290,h:150},
  {id:"wardrobe",room:"wardrobe",label:"Примерить одежду",x:130,y:680,w:250,h:130},
  {id:"aura",room:"vault",label:"Обменять на AURA",...AURA_MACHINE.hotspot},
  {id:"vault",room:"vault",label:"Открыть сейф",x:1070,y:690,w:170,h:158},
  {id:"laboratory",room:"laboratory",label:"Приготовить напиток",x:1035,y:336,w:200,h:150},
];

export function apartmentDestinationAt(x:number,y:number,room:HomeRoomId) {
 const distance=(d:typeof APARTMENT_DESTINATIONS[number])=>Math.hypot(x-Math.max(d.x,Math.min(d.x+d.w,x)),y-Math.max(d.y,Math.min(d.y+d.h,y)));
 return APARTMENT_DESTINATIONS.filter(d=>d.room===room&&distance(d)<(d.id==="aura"?70:100)).sort((a,b)=>distance(a)-distance(b))[0];
}
