import type { CosmeticId } from "./cosmetic-engine";
import { WornClothing } from "./knopik-equipment";
export type TapOutfit={accessory:CosmeticId|null;hat:boolean;mohawk:boolean;hatBounce?:number;mohawkSwing?:number};
const INK="#343041";

/** Worn art uses the portrait's own 128 × 144 coordinates. Shop icons have
 * different proportions and must never be positioned over the face with CSS. */
export function TapOutfitArt({outfit,layer}:{outfit:TapOutfit;layer:"behind"|"front"}){
 if(layer==="behind")return <g data-tap-outfit="behind">
  {outfit.accessory==="cape"&&<g data-tap-worn="cape"><path d="M30 112h68v5h10v9h7v11h5v7H8v-7h5v-11h7v-9h10Z" fill={INK}/><path d="M33 116h62v5h10v9h7v10H16v-10h7v-9h10Z" fill="#4b5c90"/><path d="M25 126h12v14H18v-8h7Zm66-5h10v9h8v10H91Z" fill="#6991ad"/><path d="M18 138h19v3H18Zm74 0h18v3H92Z" fill="#b5d9b6"/><path d="M19 132h4v7h-4Zm84 0h4v7h-4Z" fill="#343f68"/></g>}
  <path d="M43 118h42v5h8v7h7v14H28v-14h7v-7h8Z" fill="#a36d40"/><path d="M46 121h36v5h8v7h6v11H32v-11h6v-7h8Z" fill="#d69a5b"/><path d="M51 124h26v5h7v15H44v-15h7Z" fill="#f4e5c7"/><path d="M54 129h20v3h6v12H48v-12h6Z" fill="#fff1d4"/>
 </g>;
 return <g data-tap-outfit="front">
  {outfit.accessory==="bandana"&&<g data-tap-worn="bandana">
   <path d="M34 121h8v5h13v3h18v-3h13v-5h8v11h-8v5H76v6H61v-4H50v-5H40v-5h-6Z" fill={INK}/>
   <path d="M38 124h3v5h14v3h18v-3h14v-5h3v6h-8v5H73v6h-9v-4H52v-5H42v-5h-4Z" fill="#496c86"/>
   <path d="M43 129h12v3h18v-3h10v3H73v3H56v-2H43Z" fill="#88b6b0"/><path d="M63 135h10v5h-7v-2h-3Z" fill="#699caa"/><path d="M68 136h3v3h-3Z" fill="#f4d889"/>
   <path d="M88 126h7v4h5v10h-5v-5h-5v-4h-2Z" fill={INK}/><path d="M91 128h3v4h4v5h-2v-4h-5Z" fill="#699caa"/>
  </g>}
  {outfit.accessory==="charm"&&<g data-tap-worn="charm">
   <path d="M34 122h8v4h13v3h18v-3h13v-4h8v10h-9v5H43v-5h-9Z" fill="#71552e"/><path d="M38 125h3v4h13v3h20v-3h13v-4h3v5h-8v4H46v-4h-8Z" fill="#dbad4d"/><path d="M42 127h12v3h20v-3h12v2H75v3H53v-3H42Z" fill="#ffe39a"/>
   <path d="M59 131h10v11H59Z" fill="#775442"/><path d="M61 133h6v7h-6Z" fill="#f4d889"/><path d="M62 134h4v2h-4Zm0 3h4v2h-4Z" fill="#af7936"/><path d="M61 133h2v6h-2Z" fill="#fff1d1"/><path d="M46 130h2v2h-2Zm34 0h2v2h-2Z" fill="#fff1d1"/>
  </g>}
  {outfit.accessory==="cape"&&<g data-tap-cape-clasp=""><path d="M34 121h8v5h12v3h20v-3h12v-5h8v10H82v5H46v-5H34Z" fill={INK}/><path d="M38 124h3v5h13v3h20v-3h13v-5h3v5H80v4H48v-4H38Z" fill="#6991ad"/><path d="M59 128h10v11H59Z" fill="#775442"/><path d="M62 130h5l-3 3h3l-5 5v-4h-2Z" fill="#f4d889"/></g>}
  {outfit.accessory==="goggles"&&<g data-tap-worn="goggles">
   <path d="M21 56h9v-5h24v6h20v-6h24v5h9v9h-9v7H74v-7H54v7H30v-7h-9Z" fill={INK}/><path d="M23 58h9v-5h20v6h24v-6h20v5h9v5h-9v7H76v-7H52v7H32v-7h-9Z" fill="#b98461"/>
   <path d="M35 56h14v11H35Zm44 0h14v11H79Z" fill="#345875"/><path d="M37 57h10v7H37Zm44 0h10v7H81Z" fill="#69c9d4"/><path d="M38 57h3v6h-3Zm44 0h3v6h-3Z" fill="#d5f5e4"/><path d="M35 68h14v1H35Zm44 0h14v1H79Z" fill="#f4d889"/><path d="M57 59h14v3H57Z" fill="#775442"/><path d="M25 59h3v2h-3Zm75 0h3v2h-3Z" fill="#f4d889"/>
  </g>}
  {outfit.hat&&<g className={outfit.hatBounce?"tap-hat-bounce":""} key={`hat-${outfit.hatBounce}`}><g transform="translate(64 91)"><WornClothing kind="hat" pose="front"/></g></g>}
  {outfit.mohawk&&<g className={outfit.mohawkSwing?"tap-mohawk-swing":""} key={`hair-${outfit.mohawkSwing}`}><g transform="translate(64 185) scale(2.3)"><WornClothing kind="mohawk" pose="front"/></g></g>}
 </g>;
}
