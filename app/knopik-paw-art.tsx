import {KNOPIK_FUR} from './knopik-fur';
import {knopikSkinColor,type KnopikSkin} from './knopik-skins';

/** One pixel silhouette for bare-paw combat and interaction. All fur comes
 * from the same skin swatches as the character, never a separate UI palette. */
export function KnopikPawArt({skin='classic'}:{skin?:KnopikSkin}){
 const fur=(color:string)=>knopikSkinColor(color,skin);
 return <g data-knopik-paw={skin}>
  <path fill="#162c36" d="M11 2h4v2h2V2h4v2h2v3h4v2h2v7h-2v2h-2v2h2v8h-2v2H7v-2H5v-8h2v-2H5v-2H3V9h2V7h4V4h2Z"/>
  <path fill={fur(KNOPIK_FUR.fur)} d="M11 4h4v8h-4Zm6 0h4v8h-4ZM5 9h4v7H5Zm18 0h4v7h-4ZM11 16h10v2h2v4h2v6H7v-6h2v-4h2Z"/>
  <path fill={fur(KNOPIK_FUR.light)} d="M11 4h2v4h-2Zm6 0h2v4h-2ZM5 9h2v3H5Zm18 0h2v3h-2ZM11 16h10v2H11Zm-2 2h2v4H9Z"/>
  <path fill={fur(KNOPIK_FUR.dark)} d="M13 10h2v2h-2Zm6 0h2v2h-2ZM7 14h2v2H7Zm18 0h2v2h-2ZM9 26h14v2H9Z"/>
  <path fill={fur(KNOPIK_FUR.cream)} d="M13 18h6v2h2v2h2v4h-6v-2h-2v2H9v-4h2v-2h2Z"/>
  <path fill={fur(KNOPIK_FUR.edge)} d="M13 7h2v3h-2Zm4 0h2v3h-2ZM5 12h2v2H5Zm18 0h2v2h-2ZM13 21h6v3h-6Z"/>
 </g>;
}
