import type {ThemeId} from './cosmetic-engine';
import {HOME_ROOMS} from './apartment-world';
import {HOME_MATERIALS} from './apartment-materials';

export const isPremiumApartment=(theme:ThemeId)=>theme==='skyline'||theme==='observatory';

/** Authored architecture; all geometry stays outside walkways and door leaves. */
export function PremiumApartmentWindows({theme,simple=false}:{theme:ThemeId;simple?:boolean}){
 const m=HOME_MATERIALS[theme],skyline=theme==='skyline';
 return <g data-home-big-window="" data-home-edition={theme} data-home-edition-window={skyline?'panoramic-city':'planetarium'}>
  {skyline?<g transform="translate(496 52)">
   <path d="M-4-7h400v112H-4Z" fill={m.shade}/><path d="M0-3h392v104H0Z" fill={m.light}/><path d="M5 2h382v94H5Z" fill="#a4d6e4"/>
   <path d="M5 58h382v38H5Z" fill="#c4e3e8"/><path d="M5 81h22V56h25v16h29V47h26v30h34V62h32v19h33V40h28v36h28V54h27v23h28V35h30v36h27v-9h43v34H5Z" fill="#7faabf"/>
   <path d="M5 91h43V75h28v11h35V65h26v23h31V71h36v20h37V78h31v10h36V61h29v22h50v13H5Z" fill="#4e7e9b"/>
   <path data-home-sun="" d="M30 11h18v4h5v17h-5v5H30v-5h-5V15h5Z" fill="#fff0c1"/>
   <path d="M74 14h31v4h12v7H62v-6h12Zm166-5h34v5h13v7h-61v-7h14Z" fill="#f1faf1"/>
   <path d="M124 0h5v98h-5Zm133 0h5v98h-5ZM0 97h392v9H0Z" fill={m.shade}/><path d="M126 2h2v92h-2Zm133 0h2v92h-2ZM0 98h392v2H0Z" fill={m.shine}/>
   {!simple&&<><path d="M9 6h55L12 88H9Zm171 0h17l-56 87h-17Zm137 0h25l-57 87h-25Z" fill="#f3ffff" opacity=".2"/>
    <path d="M30 62h5v6h-5Zm56-9h5v6h-5Zm60 16h5v6h-5Zm65-23h5v6h-5Zm56 14h5v6h-5Zm58-19h5v6h-5Zm21 35h5v6h-5Z" fill="#e6f7e5"/>
    <path d="M-8 106h408v9H-8Z" fill={m.shade}/><path d="M-8 106h408v3H-8Z" fill={m.light}/></>}
  </g>:<g transform="translate(496 48)">
   <path d="M0 104V39h17V22h27V9h41V0h222v9h41v13h27v17h17v65Z" fill={m.metal}/>
   <path d="M7 98V43h17V27h28V15h39V7h210v8h39v12h28v16h17v55Z" fill="#101f31"/>
   <path d="M64 16h4v82h-4Zm129-9h5v91h-5Zm131 9h4v82h-4ZM8 92h376v6H8Z" fill={m.shade}/>
   <path data-home-moon="" d="M302 31h17v4h-8v14h8v4h-17v-4h-5V35h5Z" fill={m.shine}/>
   <path d="M31 52h3v3h-3Zm68-26h3v3h-3Zm41 34h3v3h-3Zm89-24h3v3h-3Zm123 32h3v3h-3Zm-100 7h3v3h-3Z" fill="#deebd6"/>
   <path d="M115 39h26v6h8v16h-8v6h-26v-6h-8V45h8Z" fill="#5b8f99"/><path d="M100 59h19v-3h16v-4h18v-4h10v5h-10v4h-17v4h-16v3h-20Z" fill={m.metal}/>
   {!simple&&<><path d="M231 36h2v15h19v2h-21Zm20 17h2v14h15v2h-17Z" fill="#516d86"/><path d="M231 35h4v4h-4Zm19 16h4v4h-4Zm16 15h4v4h-4Z" fill={m.shine}/>
    <path d="M18 103h356v7H18Z" fill={m.light}/><path d="M22 104h348v2H22Z" fill={m.shine}/>
    <path d="M19 24h13v2H19Zm33-15h20v2H52Zm267 0h20v2h-20Zm39 15h13v2h-13Z" fill={m.shine}/></>}
  </g>}
 </g>;
}

export function PremiumFloorTile({theme}:{theme:ThemeId}){
 const m=HOME_MATERIALS[theme];
 return theme==='skyline'?<>
  <path d="M0 0h96v40H0Z" fill="#c6d9dc"/><path d="M0 0h96v2H0ZM0 0h2v40H0Zm48 0h2v40h-2Z" fill="#8cabb8"/>
  <path d="M4 4h40v1H5v31H4Zm48 0h40v1H53v31h-1Z" fill="#eff5e9"/><path d="M10 32h29v1H10Zm48-20h25v1H58Z" fill="#b5cbd1"/>
 </>:<>
  <path d="M0 0h96v40H0Z" fill="#283c51"/><path d="M0 0h96v2H0ZM0 0h2v40H0Zm48 0h2v40h-2Z" fill={m.shade}/>
  <path d="M22 9h4v8h8v4h-8v8h-4v-8h-8v-4h8Zm48 10h2v4h4v2h-4v4h-2v-4h-4v-2h4Z" fill={m.metal} opacity=".38"/>
  <path d="M5 4h37v1H6v30H5Zm48 0h37v1H54v30h-1Z" fill={m.mid} opacity=".4"/>
 </>;
}

export function PremiumWallTile({theme}:{theme:ThemeId}){
 const m=HOME_MATERIALS[theme];return <>
  <path d="M0 0h32v40H0Z" fill={theme==='skyline'?'#d9e4df':'#24384b'}/>
  <path d="M0 0h2v40H0ZM0 0h32v2H0Z" fill={m.shade}/>
  {theme==='skyline'?<path d="M5 4h22v1H6v30H5Zm0 32h22v2H5Z" fill={m.shine}/>:<><path d="M4 0h2v40H4Zm22 0h2v40h-2Z" fill={m.metal}/><path d="M13 12h6v2h3v6h-3v2h-6v-2h-3v-6h3Z" fill={m.mid}/></>}
 </>;
}

export function PremiumRoomDecor({theme,simple=false}:{theme:ThemeId;simple?:boolean}){
 const m=HOME_MATERIALS[theme],skyline=theme==='skyline';
 return <g data-home-edition-rooms={theme}>
  {HOME_ROOMS.map((r,i)=><g key={r.id} data-home-edition-room={r.id}>
   <path d={`M${r.x+12} ${r.y+14}h${r.w-24}v3h-${r.w-24}Zm0 0h3v${r.h-28}h-3Zm${r.w-27} 0h3v${r.h-28}h-3Z`} fill={m.metal} opacity=".5"/>
   {r.id!=='living'&&<g transform={`translate(${r.x+35} ${r.y===160?78:r.y-40})`}>
    <path d="M0-12h72v40H0Z" fill={m.shade}/><path d="M3-9h66v34H3Z" fill={m.mid}/>
    <path d={skyline?'M7 17h10V7h8v10h9V2h9v15h8V9h13v13H7Z':'M12 0h3v3h-3Zm21 8h3v3h-3Zm21-11h3v3h-3ZM15 3h2v6h16v2H15Zm21 5h2V0h16v-2H36Z'} fill={m.shine}/>
    {!simple&&<path d={`M7-5h${18+i*3}v2H7Zm0 31h57v2H7Z`} fill={m.metal}/>}</g>}
  </g>)}
  {!simple&&<g data-home-edition-floor="" transform="translate(694 302)" fill="none" stroke={m.metal} strokeWidth="2" opacity=".45">
   <path d={skyline?'M-76-38H76V38H-76ZM-65-28H65V28H-65Z M0-38v76M-76 0H76':'M-60-27h20v-15h80v15h20v54H40v15h-80V27h-20Z M-81 0H81M0-56V56 M-14-14h28v28h-28Z'}/>
  </g>}
 </g>;
}

/** Same physical sofa/console footprints, different furniture rather than recolors. */
export function PremiumLivingFurniture({theme,kind}:{theme:ThemeId;kind:'sofa'|'console'}){
 const m=HOME_MATERIALS[theme],skyline=theme==='skyline';
 return <g data-home-edition-furniture={`${theme}-${kind}`}>
  {kind==='sofa'?<>
   <path d="M48 399h153v15H48Z" fill="#16243033"/><path d="M58 393h8v15h-8Zm119 0h8v15h-8Z" fill={m.metal}/>
   <path d="M51 334h143v66H51Z" fill={m.shade}/><path d="M56 336h133v26H56Z" fill={skyline?'#e7ece1':'#406477'}/><path d="M59 338h126v4H59Z" fill={m.shine}/>
   <path d="M55 364h65v27H55Zm69 0h65v27h-65Z" fill={skyline?'#bcd3d4':'#507286'}/><path d="M58 365h58v3H58Zm69 0h58v3h-58Z" fill={m.light}/>
   <path d="M48 349h13v46H48Zm135 0h13v46h-13Z M58 392h129v8H58Z" fill={skyline?'#f0f3e8':m.body}/><path d="M51 350h7v3h-7Zm135 0h7v3h-7ZM59 395h126v2H59Z" fill={m.metal}/>
   <path d={skyline?'M70 345h28v26H70Zm76 0h28v26h-28Z':'M69 344h30v28H69Zm78 0h27v28h-27Z'} fill={skyline?'#5c8e9e':m.shade}/>
   <path d={skyline?'M73 347h22v3H73Zm76 0h22v3h-22Z':'M81 347h4v7h7v4h-7v7h-4v-7h-7v-4h7Zm76 4h7v7h-7Z'} fill={m.metal}/>
  </>:<>
   <path d="M339 233h104v13H339Z" fill="#16243033"/><path d="M343 198h96v39h-96Z" fill={m.shade}/><path d="M346 201h90v31h-90Z" fill={m.body}/><path d="M340 195h102v8H340Z" fill={m.light}/>
   <path d="M350 212h35v14h-35Zm40 0h40v14h-40Z" fill={m.glass}/><path d="M354 215h22v2h-22Zm43 0h26v2h-26Z" fill={m.shine}/>
   {skyline?<><path d="M353 145h77v43h-77Z" fill={m.shade}/><path d="M357 149h69v34h-69Z" fill="#204257"/><path d="M364 170h17v-8h15v5h20v9h-52Z" fill="#7cbdc6"/><path d="M361 152h61v2h-61Z M387 188h11v7h-11Z" fill={m.metal}/></>:<>
    <path d="M364 186h54v8h-54Zm24-48h6v49h-6Z" fill={m.metal}/><path d="M368 150h47v3h-47Zm-5 13h58v3h-58Zm6 14h46v3h-46Z" fill={m.light}/>
    <path d="M380 145h23v26h-23Z" fill="#648d9e"/><path d="M383 146h17v3h-17Z" fill={m.shine}/><path d="M365 149h7v7h-7Zm45 12h9v9h-9Zm-39 14h6v6h-6Z" fill={m.metal}/>
   </>}
  </>}
 </g>;
}
