import type { HomeRoomId } from "./apartment-world.ts";
export type ApartmentDestination = "street" | "bar" | "basement" | "wardrobe" | "vault" | "laboratory" | "computer";
export const APARTMENT_DESTINATIONS: readonly {id:ApartmentDestination;room:HomeRoomId;label:string;x:number;y:number;w:number;h:number}[] = [
  {id:"computer",room:"living",label:"Зайти в компьютер",x:698,y:368,w:106,h:85},
  {id:"street",room:"hall",label:"Выйти на улицу",x:632,y:1000,w:120,h:120},
  {id:"basement",room:"hall",label:"Выбрать уровень",x:780,y:654,w:120,h:120},
  {id:"bar",room:"bar",label:"Открыть бар",x:100,y:168,w:290,h:150},
  {id:"wardrobe",room:"wardrobe",label:"Примерить одежду",x:130,y:680,w:250,h:130},
  {id:"vault",room:"vault",label:"Открыть сейф",x:1040,y:690,w:190,h:160},
  {id:"laboratory",room:"laboratory",label:"Приготовить напиток",x:1035,y:336,w:200,h:150},
];
