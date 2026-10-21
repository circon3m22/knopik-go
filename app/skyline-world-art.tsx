import type {ThemeId} from './cosmetic-engine';
import {HOME_ROOMS} from './apartment-world';
import {HOME_MATERIALS} from './apartment-materials';
export {UltraWorldPass} from "./ultra-world-art";
/** Wall-side decor stays outside doors and walkable task geometry. */
export function ApartmentThemeDecor({theme,detail}:{theme:ThemeId;detail:number}){
 const m=HOME_MATERIALS[theme],r=HOME_ROOMS.find(r=>r.id==='living')!;
 return <g data-apartment-edition={theme} transform={`translate(${r.x+32} ${r.y+44})`} pointerEvents="none">
 {theme==='skyline'?<><path d="M0-48h110v10H0Zm8 10h94v42H8Z" fill={m.shade}/><path d="M12-35h86V0H12Z" fill={m.glass}/><path d="M16-32h30L23-3h-7Z" fill={m.shine} opacity=".5"/>{detail>0&&[0,1,2,3,4].map(i=><path key={i} d={`M${20+i*15}-10h8v${-8-i%3*5}h-8Z`} fill={m.mid}/>)}<path d="M-2 5h116v3H-2Z" fill={m.metal}/></>:theme==='observatory'?<><path d="M0-50h104V4H0Z" fill={m.metal}/><path d="M4-46h96V0H4Z" fill="#192b49"/><circle cx="52" cy="-24" r="18" fill="none" stroke={m.light} strokeWidth="1"/><path d="m24-30 19 8 18-15 18 18-21 10M43-22l15 13" fill="none" stroke={m.metal}/><path d="M114-25h8V9h-8Zm4 0-15 34h-5l17-37Zm0 0 18 34h5l-21-37Z" fill={m.metal}/><path d="m100-48 38 17-5 12-39-17Z" fill={m.mid}/></>:<><path d="M0-43h100V1H0Z" fill={m.shade}/><path d="M4-39h92v36H4Z" fill={m.light}/>{theme==='emerald'?<path d="M50-35 70-20 50-5 30-20Z" fill={m.metal}/>:theme==='mint'?<path d="M48-33h5v23h-5Zm-19 4h18v8H29Zm25 5h18v8H54Z" fill={m.fabric}/>:theme==='bath'?<path d="M12-32h76v4H12Zm0 10h76v4H12Zm0 10h76v4H12Z" fill={m.metal}/>:theme==='night'?<><path d="M46-34h13v5h-7v13h7v5H46v-5h-5v-13h5Z" fill={m.metal}/><path d="M18-30h2v2h-2Zm60 15h2v2h-2Z" fill={m.mid}/></>:<path d="M12-20 26-31 44-20 60-32 87-10H12Z" fill={m.fabric}/>}</>}
 {detail>=2&&<path d="M-4 10h118l12 7H8Z" fill={m.shade} opacity=".22"/>}
 </g>;
}
