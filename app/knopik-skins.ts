import {KNOPIK_FUR} from "./knopik-fur.ts";
export const KNOPIK_SKINS={
 hunter:{name:"Кнопик-охотник",price:79,copy:"Дымчатая шерсть, янтарные глаза, светлая грудь и лесные отметины."},
 classic:{name:"Классический Кнопик",price:0,copy:"Рыжая шерсть и знакомая улыбка."},
 "shiba-white":{name:"Белая сиба-ину",price:49,copy:"Снежная шерсть, серебристые тени и кремовая мордочка."},
 "shiba-black":{name:"Чёрная сиба-ину",price:49,copy:"Угольная шерсть, светлые щёки и золотистые подпалины."},
} as const;
export type KnopikSkin=keyof typeof KNOPIK_SKINS;
export const PAID_KNOPIK_SKINS=["shiba-white","shiba-black","hunter"] as const;
export function isKnopikSkin(value:unknown):value is KnopikSkin{return typeof value==="string"&&Object.hasOwn(KNOPIK_SKINS,value);}
export function sanitizeOwnedSkins(value:unknown):KnopikSkin[]{return ["classic",...new Set(Array.isArray(value)?value.filter((s):s is Exclude<KnopikSkin,"classic">=>isKnopikSkin(s)&&s!=="classic"):[])];}
export function purchaseKnopikSkin(owned:readonly KnopikSkin[],aura:number,skin:KnopikSkin){
 if(!isKnopikSkin(skin)||!Number.isSafeInteger(aura)||aura<0)return null;
 if(owned.includes(skin))return {ownedSkins:[...owned],activeSkin:skin,auraCoins:aura};
 const price=KNOPIK_SKINS[skin].price;if(aura<price)return null;
 return {ownedSkins:[...owned,skin],activeSkin:skin,auraCoins:aura-price};
}
const PALETTES:Record<KnopikSkin,typeof KNOPIK_FUR>={
 hunter:{edge:"#283333",dark:"#434c49",fur:"#707c70",warm:"#8b9680",light:"#a9b29a",cream:"#d0c7a8",ivory:"#ebe3c8",shade:"#999e85",eye:KNOPIK_FUR.eye},
 classic:KNOPIK_FUR,
 "shiba-white":{edge:"#89969b",dark:"#bec8ca",fur:"#e2e8e7",warm:"#eef0eb",light:"#fafbf5",cream:"#f0eadc",ivory:"#fffdf5",shade:"#cbd3cf",eye:KNOPIK_FUR.eye},
 "shiba-black":{edge:"#17212b",dark:"#252f3a",fur:"#36414d",warm:"#46515d",light:"#5c6873",cream:"#dfbc89",ivory:"#f6e8cf",shade:"#b79a73",eye:KNOPIK_FUR.eye},
};
type Swatch=keyof typeof KNOPIK_FUR;
const EYES={
 hunter:{rim:"#69734d",outline:"#25372d",iris:"#b48a3f",light:"#e1b65e",pupil:"#1f3029",shine:"#fff4ce",glint:"#efd58b",lid:"#485e3e",tired:"#344837"},
 classic:{rim:"#a6754b",outline:"#342923",iris:"#734624",light:"#986134",pupil:"#241f21",shine:"#e9f1e8",glint:"#b38a5b",lid:"#42352e",tired:"#48372d"},
 "shiba-white":{rim:"#bec8ca",outline:"#28313b",iris:"#566572",light:"#81929b",pupil:"#17212b",shine:"#fffdf5",glint:"#b4c8cc",lid:"#4a5963",tired:"#394751"},
 "shiba-black":{rim:"#252f3a",outline:"#141b24",iris:"#946435",light:"#d6a558",pupil:"#171d25",shine:"#fff4d7",glint:"#f1ce83",lid:"#bf9864",tired:"#1c2631"},
} as const;
export const knopikEyePalette=(skin:KnopikSkin="classic")=>EYES[skin];
const COLORS=new Map<string,Swatch>(Object.entries(KNOPIK_FUR).filter(([key])=>key!=="eye").map(([key,value])=>[value,key as Swatch]));
for(const [color,key] of Object.entries({"#a86739":"edge","#a36d40":"edge","#e5b076":"warm","#d0904c":"dark","#bf7b3e":"dark","#e7af70":"light","#dfa268":"warm","#f4d1a0":"cream","#fff0d2":"ivory","#e9d3ac":"cream","#e5ad73":"fur","#f1d6aa":"cream","#cd9e69":"shade","#dcc9a7":"shade","#f4e5c7":"cream","#f1cc98":"cream","#dbc196":"shade","#b9a17e":"shade","#baa381":"shade"}))COLORS.set(color,key as Swatch);
export function knopikSkinColor(color:string,skin:KnopikSkin="classic"){
 if(skin==="classic")return color;const key=COLORS.get(color.toLowerCase());return key?PALETTES[skin][key]:color;
}
/** Cache only fur swatches once. Literal SVG fills also work in Canvas/WebGL. */
export class KnopikSkinPainter{
 private nodes:{node:Element;color:string}[]=[];
 private current:KnopikSkin|null=null;
 private symbols:Element[]=[];
 private marks:Element[]=[];
 constructor(root:Element|null,resolve?:(id:string)=>Element|null){
  const seen=new Set<Element>();
  const collect=(part:Element)=>{
   if(seen.has(part))return;seen.add(part);this.marks.push(...Array.from(part.querySelectorAll("[data-hunter-mark]")));
   for(const node of Array.from(part.querySelectorAll("[fill]"))){const color=node.getAttribute("data-knopik-base-fill")??node.getAttribute("fill")??"";if(COLORS.has(color.toLowerCase())){node.setAttribute("data-knopik-base-fill",color);this.nodes.push({node,color});}}
   if(resolve)for(const use of Array.from(part.querySelectorAll("use"))){const href=use.getAttribute("href")??use.getAttribute("xlink:href");if(href?.startsWith("#")){const symbol=resolve(href.slice(1));if(symbol&&!seen.has(symbol)){this.symbols.push(symbol);collect(symbol);}}}
  };if(root)collect(root);
 }
 paint(value:unknown){const skin=isKnopikSkin(value)?value:"classic";if(this.current===skin)return;this.current=skin;for(const mark of this.marks)mark.setAttribute("display",skin==="hunter"?"inline":"none");for(const symbol of this.symbols)symbol.setAttribute("data-knopik-skin",skin);for(const {node,color} of this.nodes){const fill=knopikSkinColor(color,skin);if(node.getAttribute("fill")!==fill)node.setAttribute("fill",fill);}}
}
