import type {PotionKind} from "./pixel-artwork";
/** Use the same prerequisites as the existing games, and explain every disabled drink. */
export function barDrinkBlock(kind:PotionKind,count:number,wallet:number,resting:boolean,busy:boolean):string|undefined {
 if(count<1)return "Нет в запасе";
 if(busy)return "Кнопик занят";
 if(kind==="pitbull"||kind==="cocoa"||kind==="bergamot"){
  if(resting)return "Кнопик отдыхает";
  if(wallet<1)return "Нужны KC для игры";
 }
 return undefined;
}
