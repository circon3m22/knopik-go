import type { ArcadeDrink } from "./arcade-catalog.ts";
import {adventureLevel} from "./adventure-levels.ts";
import {dungeonIngredientPositions} from "./dungeon-ingredients.ts";

export const LAB_MATERIALS = {
  citrus:{name:"Цедра",where:"ящик у киоска",color:"#efb961"},
  leaf:{name:"Лист липы",where:"клумба в парке",color:"#a8ca83"},
  pearl:{name:"Речной кристалл",where:"камни у набережной",color:"#8bd5dd"},
  spark:{name:"Искра",where:"электрощиток во дворе и сундуки подземелья",color:"#c4a2e4"},
} as const;
export type LabMaterial = keyof typeof LAB_MATERIALS;
export type LabRecipeId = ArcadeDrink | "zhivchik" | "pepsi" | "heal";
export const LAB_RECIPES = [
  {id:"pitbull",name:"Питбуль",subtitle:"Янтарный заряд",requires:null,cost:{citrus:2},color:"#dba557",duration:9000},
  {id:"cocoa",name:"Какао",subtitle:"Тёплый старт",requires:null,cost:{leaf:2},color:"#bb9773",duration:9000},
  {id:"bergamot",name:"Бергамот",subtitle:"Чайный стол",requires:null,cost:{leaf:2,citrus:1},color:"#c7c983",duration:10000},
  {id:"zhivchik",name:"Живчик",subtitle:"Яблочная энергия",requires:null,cost:{citrus:2,leaf:1},color:"#b3e56b",duration:10000},
  {id:"heal",name:"Хилка",subtitle:"Восстанавливающий настой",requires:"zhivchik",cost:{leaf:4,pearl:1},color:"#e8988f",duration:14000},
  {id:"pepsi",name:"Пепси",subtitle:"Формула щита",requires:"heal",cost:{pearl:3,spark:3},color:"#668caf",duration:18000},
  {id:"lime",name:"Лайм",subtitle:"Первая искра вкуса",requires:null,cost:{citrus:2,leaf:2},color:"#bbda78",duration:12000},
  {id:"matcha",name:"Матча",subtitle:"Спокойствие и память",requires:"lime",cost:{leaf:5,pearl:2},color:"#93c5a1",duration:14000},
  {id:"tralalero",name:"Тралалеро",subtitle:"Голос глубокой реки",requires:"matcha",cost:{citrus:4,pearl:4},color:"#8acdde",duration:16000},
  {id:"ballerina",name:"Балерина",subtitle:"Каппучино в ритме",requires:"tralalero",cost:{leaf:5,citrus:3,spark:2},color:"#e4b0bf",duration:18000},
  {id:"bombardiro",name:"Бомбардиро",subtitle:"Арбузный реактор",requires:"ballerina",cost:{citrus:6,pearl:4,spark:4},color:"#e7a17c",duration:20000},
  {id:"verity",name:"Верити",subtitle:"Формула жёлтого глитча",requires:"bombardiro",cost:{leaf:6,pearl:6,spark:6},color:"#ecd97f",duration:22000},
  {id:"espresso",name:"Эспрессо",subtitle:"Секрет двадцати одного",requires:"cocoa",cost:{leaf:3,citrus:2},color:"#b78667",duration:12000},
  {id:"grape",name:"Виноградная газировка",subtitle:"Фиолетовое колесо",requires:"pitbull",cost:{citrus:4,pearl:2},color:"#b698d4",duration:14000},
  {id:"whiteTea",name:"Белый чай",subtitle:"Белый бархат",requires:"bergamot",cost:{leaf:4,pearl:2},color:"#e6deba",duration:14000},
  {id:"ginger",name:"Имбирный эль",subtitle:"Три искры",requires:"espresso",cost:{citrus:4,spark:2},color:"#dfad64",duration:16000},
  {id:"peach",name:"Персиковый лимонад",subtitle:"Восемь отскоков",requires:"lime",cost:{citrus:3,leaf:3},color:"#eda997",duration:12000},
  {id:"currant",name:"Смородиновый энергетик",subtitle:"Разгон до звёзд",requires:"grape",cost:{leaf:3,pearl:2,spark:3},color:"#9f8cc3",duration:18000},
  {id:"hibiscus",name:"Каркаде",subtitle:"Память древних плит",requires:"matcha",cost:{leaf:3,spark:1},color:"#bf7596",duration:13000},
  {id:"tonic",name:"Тоник",subtitle:"Путь реликвий",requires:"lime",cost:{citrus:3,pearl:2},color:"#8fbdaf",duration:14000},
] as const;
export const LAB_SOURCES = [
  {id:"citrus-crate",material:"citrus",x:960,y:812,label:"Собрать цедру",amount:2},
  {id:"linden-leaves",material:"leaf",x:1670,y:620,label:"Собрать листья липы",amount:3},
  {id:"river-crystals",material:"pearl",x:2050,y:1560,label:"Собрать речные кристаллы",amount:2},
  {id:"yard-sparks",material:"spark",x:650,y:1100,label:"Снять заряд с катушки",amount:2},
] as const;
export type LabSourceId = typeof LAB_SOURCES[number]["id"];
export type LabStock = Record<LabMaterial,number>;
export type BrewingJob = {recipe:LabRecipeId;startedAt:number;careMask:number};
export type LaboratoryProgress = {materials:LabStock;unlocked:LabRecipeId[];crafted:number;job:BrewingJob|null;harvested:Partial<Record<LabSourceId,number>>;chests:string[]};
export const LAB_RESPAWN_MS = 180000;
export const defaultLaboratory = ():LaboratoryProgress=>({materials:{citrus:0,leaf:0,pearl:0,spark:0},unlocked:[],crafted:0,job:null,harvested:{},chests:[]});
const integer=(v:unknown,max=Number.MAX_SAFE_INTEGER)=>typeof v==="number"&&Number.isFinite(v)?Math.min(max,Math.max(0,Math.floor(v))):0;
export const labRecipe=(id:LabRecipeId)=>LAB_RECIPES.find(r=>r.id===id)!;
export function sanitizeLaboratory(value:unknown):LaboratoryProgress {
  const p=defaultLaboratory();if(!value||typeof value!=="object")return p;
  const v=value as Partial<LaboratoryProgress>;
  for(const k of Object.keys(LAB_MATERIALS) as LabMaterial[])p.materials[k]=integer(v.materials?.[k],99);
  p.unlocked=LAB_RECIPES.filter(r=>Array.isArray(v.unlocked)&&v.unlocked.includes(r.id)).map(r=>r.id);
  p.crafted=integer(v.crafted,1000000);
  if(v.job&&LAB_RECIPES.some(r=>r.id===v.job?.recipe)&&integer(v.job.startedAt)>0)p.job={recipe:v.job.recipe,startedAt:integer(v.job.startedAt),careMask:integer(v.job.careMask,7)};
  for(const s of LAB_SOURCES){const n=integer(v.harvested?.[s.id]);if(n)p.harvested[s.id]=n;}
  p.chests=Array.isArray(v.chests)?[...new Set(v.chests.filter((s):s is string=>typeof s==="string"&&/^(?:m:)?\d{1,2}:\d{1,2}$/.test(s)))].slice(0,250):[];
  return p;
}
/** Utility buffs are always buyable; only arcade drinks require a first brew. */
export const INSTANT_BUFFS=["zhivchik","pepsi","heal"] as const;
export const canBuyLabDrink=(p:LaboratoryProgress,kind:string)=>INSTANT_BUFFS.some(buff=>buff===kind)||!LAB_RECIPES.some(r=>r.id===kind)||p.unlocked.includes(kind as LabRecipeId);
/** BULB unlocks recipes without affecting stock, ingredients or a brewing job. */
export const unlockAllLabRecipes=(p:LaboratoryProgress):LaboratoryProgress=>({...p,unlocked:LAB_RECIPES.map(r=>r.id)});
export const recipeAvailable=(p:LaboratoryProgress,id:LabRecipeId)=>{const r=labRecipe(id);return !r.requires||p.unlocked.includes(r.requires);};
export function startLaboratoryBrew(p:LaboratoryProgress,id:LabRecipeId,now:number,stock:number):LaboratoryProgress|null {
  const r=LAB_RECIPES.find(r=>r.id===id);if(!r||p.job||!recipeAvailable(p,id)||(!Number.isSafeInteger(stock)||stock<0||stock>=(id==="heal"||id==="pepsi"?3:25))||!Number.isSafeInteger(now)||now<=0)return null;
  const materials={...p.materials};for(const [k,n] of Object.entries(r.cost) as [LabMaterial,number][])if(materials[k]<n)return null;else materials[k]-=n;
  return {...p,materials,job:{recipe:id,startedAt:now,careMask:0}};
}
export function brewPose(job:BrewingJob,now:number) {
  const duration=labRecipe(job.recipe).duration,elapsed=Math.max(0,now-job.startedAt),progress=Math.min(1,elapsed/duration),stage=Math.min(2,Math.floor(progress*3));
  return {progress,stage,local:progress*3-stage,ready:elapsed>=duration,seconds:Math.ceil(Math.max(0,duration-elapsed)/1000)};
}
export function careForBrew(p:LaboratoryProgress,now:number):LaboratoryProgress|null {
  if(!p.job||!Number.isSafeInteger(now)||now<=0)return null;const pose=brewPose(p.job,now);if(pose.ready||pose.local<.35||pose.local>.8||(p.job.careMask&(1<<pose.stage)))return null;
  return {...p,job:{...p.job,careMask:p.job.careMask|(1<<pose.stage)}};
}
export function claimLaboratoryBrew(p:LaboratoryProgress,now:number,stock:number) {
  if(!p.job||!Number.isSafeInteger(now)||now<=0||!Number.isSafeInteger(stock)||stock<0||!brewPose(p.job,now).ready||stock>=(p.job.recipe==="heal"||p.job.recipe==="pepsi"?3:25))return null;
  const recipe=p.job.recipe,materials={...p.materials},perfect=p.job.careMask===7;
  if(perfect){const [kind]=Object.keys(labRecipe(recipe).cost) as LabMaterial[];materials[kind]=Math.min(99,materials[kind]+1);}
  return {recipe,stock:stock+1,perfect,progress:{...p,materials,unlocked:p.unlocked.includes(recipe)?p.unlocked:[...p.unlocked,recipe],crafted:p.crafted+1,job:null} satisfies LaboratoryProgress};
}
export function canHarvest(p:LaboratoryProgress,id:LabSourceId,now:number) {
  const s=LAB_SOURCES.find(s=>s.id===id);return !!s&&p.materials[s.material]<99&&now-(p.harvested[id]??-LAB_RESPAWN_MS)>=LAB_RESPAWN_MS;
}
export function harvestLaboratory(p:LaboratoryProgress,id:LabSourceId,now:number):LaboratoryProgress|null {
  if(!Number.isSafeInteger(now)||now<=0||!canHarvest(p,id,now))return null;const s=LAB_SOURCES.find(s=>s.id===id)!;
  return {...p,materials:{...p.materials,[s.material]:Math.min(99,p.materials[s.material]+s.amount)},harvested:{...p.harvested,[id]:now}};
}
export function collectLaboratoryChest(p:LaboratoryProgress,level:number,room:number):LaboratoryProgress|null {
  if(!Number.isInteger(level)||level<1||level>25||!Number.isInteger(room)||room<0||room>9)return null;
  const key=`${level}:${room}`;if(p.chests.includes(key))return null;
  const kind:LabMaterial=room%2?"pearl":"spark";
  return {...p,chests:[...p.chests,key],materials:{...p.materials,[kind]:Math.min(99,p.materials[kind]+1+Math.floor((level-1)/10))}};
}

/** Story-level floor finds are one-time across deaths, restarts and devices. */
export function collectLaboratoryIngredient(p:LaboratoryProgress,level:number,room:number,material:LabMaterial):LaboratoryProgress|null{
 if(!Number.isInteger(level)||level<1||level>25||!Number.isInteger(room)||room<0||room>9)return null;
 const item=dungeonIngredientPositions(adventureLevel(level)).find(it=>it.room===room&&it.material===material);
 if(!item||p.chests.includes(item.key)||p.materials[material]>=99)return null;
 return {...p,chests:[...p.chests,item.key],materials:{...p.materials,[material]:Math.min(99,p.materials[material]+1)}};
}
