import type {AdventureWeapon} from './adventure-levels';
export type DrawnWeapon=Exclude<AdventureWeapon,'fist'>;

/** Shared flat materials: two-pixel contours, cool forged steel, warm walnut
 * and brass. The same master drawing is used in the rack and at the wrist. */
export const WEAPON_MATERIALS={edge:'#182b35',deep:'#304653',steel:'#76949b',face:'#a7bfc0',shine:'#edf1df',wood:'#805c42',grain:'#bd925d',brass:'#d2b477',leather:'#594539',energy:'#87d8db',core:'#d8faf0',indigo:'#626e92'} as const;
const C=WEAPON_MATERIALS;
type Drawing={viewBox:string;paths:readonly (readonly [string,string])[];muzzle?:readonly [number,number]};
export const WEAPON_DRAWINGS:Record<DrawnWeapon,Drawing>={
 pistol:{viewBox:'-14 -23 72 50',muzzle:[52,-7],paths:[
  [C.edge,'M-8-19h46v3h12v4h4V0H24v5H13v9H7v10H-7V6h-5V-9h4Z'],
  [C.steel,'M-6-16h43v3h11v4h3v6H21v5H3v-5H-9v-5h3Z'],
  [C.face,'M-6-16h43v3h8v3H-6Z'],
  [C.shine,'M-5-16h40v2H-5Zm39 4h12v2H34Z'],
  [C.deep,'M-6-8h47v3H-6Zm48-1h9v6h-9ZM13 3h9v9h-9v-3h6V6h-6Z'],
  [C.leather,'M-4 3H6v18H-4Z'],
  [C.wood,'M-3 5h6v14h-6Z'],
  [C.grain,'M-2 6H2v2h-4Zm0 5H2v2h-4Zm0 5H2v2h-4Z'],
  [C.brass,'M6-11h7v3H6Zm17-5h5v2h-5Z'],
  [C.edge,'M0-21h5v3H0Zm36 2h5v3h-5ZM15-10h3v2h-3Z']
 ]},
 sabre:{viewBox:'-20 -44 144 76',paths:[
  [C.edge,'M-16-6H2v-9h4v-4h5v12h14v3h25v-4h28v-6h20v-8h12v-12h4v-6h5v24h-6v10h-12v9H79v5H50v4H25v3H11v12H5v-4H2V7h-18Z'],
  [C.wood,'M-13-3H2v7h-15Z'],
  [C.grain,'M-11-3h2v7h-2Zm5 0h2v7h-2Z'],
  [C.brass,'M5-15h3v10h14v3H8v17H5ZM-17-4h3v9h-3Z'],
  [C.face,'M14-4h37v-4h28v-6h20v-8h12v-12h5v17h-6v10H98v8H78v5H49v4H14Z'],
  [C.shine,'M15-4h36v-3h28v-5h20v-8h13v-9h2v10h-5v10H97v7H77v5H49v3H15Z'],
  [C.steel,'M15 5h34V2h28v-5h20v-7h10v-5h3v8H98v8H78v5H49v4H15Z'],
  [C.deep,'M19 0h27v2H19Zm34-4h18v2H53Z'],
  [C.brass,'M9-3h5v6H9Z']
 ]},
 shotgun:{viewBox:'-28 -22 104 49',muzzle:[70,-5],paths:[
  [C.edge,'M-24-7H0v-9h57v3h12v3h4V3H27v4H12v17H0V8h-10v7h-14Z'],
  [C.wood,'M-21-4H0V5h-11v7h-10ZM3 6h6v15H3Z'],
  [C.grain,'M-19-4h17v3h-17Zm0 4h10v2h-10ZM4 8h2v10H4Z'],
  [C.steel,'M3-13h53v3h13v10H24v4H3Z'],
  [C.face,'M4-13h51v3h11v3H4Z'],
  [C.shine,'M5-13h47v2H5Zm52 4h10v2H57Z'],
  [C.deep,'M58-5h12v5H58ZM15 5h9v6h-9V9h6V7h-6Z'],
  [C.leather,'M26-5h29v9H26Z'],
  [C.grain,'M29-3h3v5h-3Zm7 0h3v5h-3Zm7 0h3v5h-3Zm7 0h2v5h-2Z'],
  [C.brass,'M8-9h8v4H8Z'],
  [C.edge,'M51-18h6v3h-6ZM3-2h20v2H3Z']
 ]},
 launcher:{viewBox:'-24 -28 104 56',muzzle:[73,-4],paths:[
  [C.edge,'M-19-14H0v-7h52v4h17v3h7V5H54v7H23v5H17v9H5V9h-24Z'],
  [C.wood,'M-16-11H0V5h-16ZM8 9h6v14H8Z'],
  [C.grain,'M-15-10h3V3h-3ZM9 11h2v9H9Z'],
  [C.steel,'M3-18h47v4h17v3h6V2H51v7H22V5H3Z'],
  [C.face,'M5-18h43v3h17v4H5Z'],
  [C.shine,'M6-18h40v2H6Zm47 5h12v2H53Z'],
  [C.deep,'M55-9h18V2H55ZM5-7h45v9H5Z'],
  [C.brass,'M17-18h5V7h-5Zm24 0h5V7h-5Z'],
  [C.shine,'M17-17h2V5h-2Zm24 0h2V5h-2Z'],
  [C.edge,'M30-25h18v6H30Zm-49 25h3v7h-3Z'],
  [C.brass,'M33-23h12v3H33Zm-5 16h7v3h-7Z']
 ]},
 arc:{viewBox:'-20 -28 108 57',muzzle:[79,-3],paths:[
  [C.edge,'M-13-12H8v-8h43v5h18v-7h13v14h-4v8h4v14H69V7H44v7H14v12H0V7h-13Z'],
  [C.indigo,'M-10-9H8V4h-18ZM11-17h38v5h20V4H42v7H11Z'],
  [C.steel,'M3 9h8v14H3ZM13-17h34v4H13Z'],
  [C.face,'M-9-9H6v3H-9Zm23-8h32v2H14ZM4 10h3v10H4Z'],
  [C.deep,'M14-10h33V7H14ZM52-9h16V1H52Z'],
  [C.energy,'M17-11h6V7h-6Zm11 0h6V7h-6Zm11 0h6V7h-6ZM71-19h8v9h-8Zm0 21h8v9h-8Z'],
  [C.core,'M18-10h2V5h-2Zm11 0h2V5h-2Zm11 0h2V5h-2ZM72-18h5v2h-5Zm0 22h5v2h-5Z'],
  [C.brass,'M52-6h11v3H52ZM-5-3H2V0h-7Z'],
  [C.edge,'M16 10h22v2H16ZM71-8h5v8h-5Z']
 ]},
 crossbow:{viewBox:'-27 -38 106 76',muzzle:[73,0],paths:[
  [C.edge,'M-22-8h61v-23h-6v-6h12v5h7v11h6v12h5v18h-5v12h-6v11h-7v5H33v-6h6V9H10v13H-5V9h-17Z'],
  [C.wood,'M-19-5h59V5H7v14H-2V5h-17Z'],
  [C.grain,'M-17-5h35v3h-35ZM-14 1H5v2h-19ZM0 8h3v9H0Z'],
  [C.steel,'M38-34h5v5h6v10h6v12h5V7h-5v12h-6v10h-6v5h-5v-4h5V19h5V7h4V-7h-4v-12h-5v-11h-5Z'],
  [C.face,'M40-32h3v7h5v10h5v10h-3v-10h-5v-10h-5Zm8 45h3v7h-6v10h-5v-3h3V17h5Z'],
  [C.brass,'M10-5h6V5h-6Zm28-4h5V9h-5ZM-16-6h4v3h-4Z'],
  [C.deep,'M16-2h47v4H16Z'],
  [C.shine,'M14-1h53v2H14Zm51-4h4v2h4v2h3v2h-3v2h-4v2h-4ZM37-29h2v7h-2Zm-4 7h2v6h-2Zm-4 6h2v6h-2Zm-4 6h2v5h-2Zm-4 6h2v8h-2Zm4 9h2v5h-2Zm4 5h2v6h-2Zm4 6h2v6h-2Zm4 6h2v7h-2Z'],
  [C.brass,'M7-2h7v4H7Z']
 ]},
 rifle:{viewBox:'-31 -27 117 57',muzzle:[80,-4],paths:[
  [C.edge,'M-27-8H2v-7h8v-7h35v9h27v3h10V3H28v7H9v16H-4V10h-7v8h-16Z'],
  [C.wood,'M-24-5H3V6h-8v17h-7V8h-12ZM25 1h24v6H25Z'],
  [C.grain,'M-22-5H0v3h-22Zm0 5h11v2h-11Zm12 10h3v10h-3ZM28 2h17v2H28Z'],
  [C.steel,'M6-10h65v3h8V0H26v7H6Z'],
  [C.face,'M7-10h61v3H7Zm64 4h7v2h-7Z'],
  [C.shine,'M8-10h57v2H8Z'],
  [C.deep,'M10-19h32v7H10ZM10 5h12v7H10v-2h9V7h-9ZM72-5h8V0h-8Z'],
  [C.steel,'M13-19h26v3H13Z'],
  [C.energy,'M12-18h3v5h-3Zm24 0h4v5h-4Z'],
  [C.brass,'M19-20h4v8h-4Zm10 0h4v8h-4ZM8-7h9v3H8Z'],
  [C.edge,'M55-13h5v3h-5ZM-27-4h3v17h-3Z']
 ]}
};

export function DungeonWeaponArtwork({weapon,held=false}:{weapon:DrawnWeapon;held?:boolean}){
 const art=WEAPON_DRAWINGS[weapon],muzzle=art.muzzle;
 return <g data-weapon-art={weapon} data-hunter-weapon={weapon==='crossbow'||weapon==='rifle'?weapon:undefined} shapeRendering="crispEdges">
  {art.paths.map(([fill,d],i)=><path key={i} fill={fill} d={d}/>)}
  {held&&muzzle&&<g data-knopik-muzzle="" display="none" transform={`translate(${muzzle[0]} ${muzzle[1]})`}>
   <path d="M0-3h6v-5h4v4h8v3h5v4h-9v5h-5V4H3v2H0Z" fill={weapon==='arc'?C.energy:weapon==='crossbow'?C.face:C.brass}/>
   <path d="M1-1h9v3h4v2H6V2H1Z" fill={C.shine}/>
  </g>}
 </g>;
}

/** Kept for external artwork callers; all seven weapons share one master now. */
export function DungeonRangedWeapon({weapon,held=false}:{weapon:'shotgun'|'launcher'|'arc'|'crossbow'|'rifle';held?:boolean}){
 return <DungeonWeaponArtwork weapon={weapon} held={held}/>;
}
