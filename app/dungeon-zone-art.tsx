import {DUNGEON_ZONES} from './adventure-levels';
const brick=Array.from({length:14},(_,row)=>Array.from({length:8},(_,col)=>`M${col*24+(row%2?-12:0)} ${row*12}h21v9h-21Z`).join('')).join('');
function Pine({x,y,size=1,color}:{x:number;y:number;size?:number;color:string}){return <g transform={`translate(${x} ${y}) scale(${size})`} fill={color}><path d="M-2 0h4v-9h12v-5h-4v-6H6v-6H3v-8h-6v8h-3v6h-4v6h-4v5h12Z"/></g>;}
function Water({color}:{color:string}){return <path fill={color} d="M0 128h160v14H0Zm8 22h27v2H8Zm49-3h45v2H57Zm64 8h34v2h-34ZM0 164h18v2H0Zm36-4h41v2H36Zm61 9h49v2H97ZM12 180h45v2H12Zm60-4h30v2H72Zm48 10h40v2h-40Z"/>;}
/** Authored zone silhouettes on a 160px grid; shared brickwork is batched.
 * These are menu illustrations, never another copy of the game renderer. */
export function DungeonZoneBackdrop({zone}:{zone:number}){
 const p=DUNGEON_ZONES[Math.max(0,Math.min(6,zone-1))].palette;
 return <svg className="dungeon-zone-art" viewBox="0 0 160 300" preserveAspectRatio="xMidYMin slice" shapeRendering="crispEdges" aria-hidden="true" data-zone-art={zone}>
  <path d="M0 0h160v300H0Z" fill={p.dark}/>
  {zone<=5&&<><path d={brick} fill={p.wall}/><path d="M0 112h160v7H0Zm0 60h160v8H0Z" fill={p.dark}/></>}
  {zone===1&&<>
   <path d="M0 0h160v10H0Z" fill="#354851"/>
   {[10,61,112].map(x=><g key={x} transform={`translate(${x} 27)`}><path d="M0 90V22h5V11h8V5h8V0h10v5h8v6h8v11h5v68Z" fill={p.dark}/><path d="M5 90V24h5V14h8V9h16v5h8v10h5v66h-7V28h-5V19H18v9h-5v62Z" fill={p.light}/><path d="M13 89V29h5v-9h17v9h5v60Z" fill="#18333b"/><path d="M4 27h8v3H4Zm0 19h8v3H4Zm37-19h7v3h-7Zm0 19h7v3h-7Z" fill={p.wall}/></g>)}
   <Water color={p.water}/><path d="M0 120h160v5H0Zm0 14h160v2H0Zm24 14h27v2H24Zm71-9h26v2H95Z" fill="#7eaaa1"/>
   <path d="M5 4h8v71h19v7H5Zm9 61h19v7H14Z" fill="#7b755c"/><path d="M7 5h2v72h21v2H7Z" fill="#c5b788"/>
  </>}
  {zone===2&&<>
   <path d="M18 0h9v105h27v9H18Zm112 0h11v116h-30v-9h19Z" fill="#a3693d"/><path d="M20 0h3v109h29v2H20Zm112 0h3v109h-19v2h16Z" fill="#e1ac6b"/>
   <path d="M51 29h58v7h8v13h6v69H37V49h6V36h8Z" fill="#27343c"/><path d="M53 33h54v7h7v12h5v62H41V52h6V40h6Z" fill="#a87a51"/><path d="M53 34h54v4H53ZM44 53h72v4H44Z" fill="#ecc389"/>
   <path d="M54 62h52v40H54Z" fill="#333138"/><path d="M59 85h7V73h7v9h8V68h7v18h10v10H59Z" fill="#df8d47"/><path d="M67 86h8v-9h5v9h9v10H67Z" fill="#f8d492"/>
   <path d="M54 106h52v4H54Zm5-86h42v8H59Z" fill="#50666b"/><path d="M62 17h36v6H62Z" fill="#bdc4a7"/>
   {[6,143].map(x=><g key={x}><path d={`M${x} 50h10v13h-10Z M${x-2} 54h14v5h-14Z`} fill="#d2b278"/></g>)}
   <path d="M0 125h160v5H0Zm12 14h27v4H12Zm70-4h34v4H82Zm53 11h25v3h-25Z" fill="#6f5a49"/>
  </>}
  {zone===3&&<>
   <path d="M43 23h74v99H43Z" fill="#273840"/><path d="M47 27h66v91H47Z" fill="#83908a"/><path d="M53 33h54v85H53Z" fill="#354850"/><path d="M56 38h48v4H56Zm0 13h48v4H56Zm0 13h48v4H56Zm0 13h48v4H56Zm0 13h48v4H56Z" fill="#61757b"/><path d="M65 36h4v79h-4Zm27 0h4v79h-4Z" fill="#a0b3ae"/>
   {[4,126].map((x,i)=><g key={x}><path d={`M${x} 78h30v43h-30Z`} fill="#473b38"/><path d={`M${x+3} 81h24v36h-24Z`} fill="#a1724e"/><path d={`M${x+4} 83h22v3h-22Zm2 14h18v3h-18Zm-2 16h22v3h-22Z`} fill="#d1a673"/><path d={`M${x+11} 79h5v40h-5Z`} fill="#52636a"/><path d={`M${x+14} 0h2v${i?65:48}h-2Z`} fill="#a7aaa0"/></g>)}
   <path d="M60 13h40v9H60Z" fill="#28343d"/><path d="M64 16h32v3H64Z" fill="#d49969"/><path d="M0 125h160v9H0Z" fill="#3d4b50"/><path d="M7 126h10v5H7Zm20 0h10v5H27Zm20 0h10v5H47Zm20 0h10v5H67Zm20 0h10v5H87Zm20 0h10v5h-10Zm20 0h10v5h-10Zm20 0h10v5h-10Z" fill="#c4b184"/>
  </>}
  {zone===4&&<>
   <path d="M49 21h65v101H49Z" fill="#244752"/><path d="M54 26h55v95H54Z" fill="#73969a"/><path d="M59 29h45v92H59Z" fill="#2e5661"/><path d="M64 30h5v91h-5Zm15 0h5v91h-5Zm15 0h5v91h-5Z" fill="#abc1b0"/>
   <Water color="#396f75"/><path d="M0 133h160v3H0Zm3 11h43v2H3Zm65-5h42v2H68Zm53 12h30v2h-30Z" fill="#86b7ac"/>
   <path d="M0 111h64v9H0Zm98 0h62v9H98Z" fill="#a7b6a2"/><path d="M0 117h62v4H0Zm100 0h60v4h-60Z" fill="#465c64"/><path d="M9 77h6v34H9Zm28 0h6v34h-6Zm79 0h6v34h-6Zm28 0h6v34h-6ZM0 77h57v4H0Zm103 0h57v4h-57Z" fill="#c7c8a3"/>
   <path d="M16 10h8v38h-8v18h20v8H8V39h8Z" fill="#648e8d"/><path d="M74 45h15v15H74Z" fill="#273b43"/><path d="M80 48h3v9h-3Zm-3 3h9v3h-9Z" fill="#c9c798"/>
  </>}
  {zone===5&&<>
   <path d="M52 20h56v14h8v82H44V34h8Z" fill="#2b3148"/><path d="M58 27h44v9h7v72H51V36h7Z" fill="#746f98"/><path d="M63 35h34v64H63Z" fill="#b3d0bc"/><path d="M69 40h22v54H69Z" fill="#74bfc1"/><path d="M76 44h8v45h-8Z" fill="#e1f0cd"/>
   {[11,123].map(x=><g key={x}><path d={`M${x} 45h26v73h-26Z`} fill="#30354a"/><path d={`M${x+4} 48h18v67h-18Z`} fill="#7392a1"/>{[55,67,79,91,103].map(y=><path key={y} d={`M${x+1} ${y}h24v5h-24Z`} fill="#b7cfbd"/>)}</g>)}
   <path d="M0 126h160v7H0Zm31-91h11v-8h9v4h-5v8H31Zm78 62h13v4h-9v8h-10v-4h6ZM13 20h4v8h-4Zm-2 3h8v2h-8Zm130-6h3v7h-3Zm-2 2h7v3h-7Z" fill="#94d6cd"/>
  </>}
  {zone===6&&<>
   <path d="M0 0h160v153H0Z" fill="#203e3e"/><path d="M0 34h160v12H0v-2h26v-9h33v7h26v-12h28v8h47v9H0Z" fill="#335951"/>
   {[[-2,107,.9],[21,95,1.2],[48,119,1.7],[80,92,1],[103,124,1.8],[143,108,1.4],[165,121,1.7]].map(([x,y,size],i)=><Pine key={i} x={x} y={y} size={size} color={i%2?'#497052':'#2d503e'}/>)}
   <path d="M62 60h33v10H62Zm3 10h4v57h-4Zm23 0h4v57h-4ZM61 56h36v4H61Zm8 19h19v4H69Zm0 13h19v4H69Zm0 13h19v4H69Zm-5-66h31v21H64Z" fill="#9b9467"/><path d="M61 36h37v4H61Zm4 6h29v12H65Z" fill="#243d37"/>
   <path d="M0 135h160v18H0Zm0 13h20v-6h34v7h42v-8h40v5h24v11H0Z" fill="#527751"/><path d="M7 126h3v8H7Zm27 8h3v7h-3Zm85-8h3v7h-3Zm25 10h3v8h-3Z" fill="#b8bd83"/>
  </>}
  {zone===7&&<>
   <path d="M0 0h160v150H0Z" fill="#263f49"/><path d="M118 8h18v4h4v18h-4v4h-18v-4h-4V12h4Z" fill="#c9cead"/>
   <path d="M42 66h78v65H42Z" fill="#6e7d78"/><path d="M46 71h70v60H46Z" fill="#87948a"/><path d="M0 34h15V24h16v10h15v96H0Zm115 0h15V24h15v10h15v96h-45Z" fill="#506866"/><path d="M5 43h35v83H5Zm116 0h38v83h-38Z" fill="#8a998d"/>
   <path d="M60 131V86h5v-8h30v8h5v45Z" fill="#243b43"/><path d="M66 87h28v42H66Z" fill="#4c655e"/><path d="M69 86h3v43h-3Zm9 0h3v43h-3Zm9 0h3v43h-3ZM66 97h28v3H66Zm0 14h28v3H66Z" fill="#b3ba9d"/>
   <path d="M12 55h8v19h-8Zm17 0h6v19h-6Zm96 0h8v19h-8Zm17 0h8v19h-8Z" fill="#2f454d"/><path d="M7 81h31v3H7Zm0 20h31v3H7Zm115-20h35v3h-35Zm0 20h35v3h-35Z" fill="#536d69"/>
   <path d="M51 60h8v17h-8Zm50 0h8v17h-8Z" fill="#d8b97d"/><path d="M0 132h160v10H0Zm37 10h88v6H37Z" fill="#526a65"/>
   <Pine x={6} y={150} size={1.5} color="#1d3637"/><Pine x={155} y={151} size={1.7} color="#1d3637"/>
  </>}
  {zone===1&&<><path d="M17 37h7v3h-7Zm46-13h8v3h-8Zm64 14h10v3h-10ZM0 97h7v9H0Zm49-14h6v14h-6Zm51 10h6v12h-6Z" fill="#698d65"/><path d="M25 53h2v7h-2Zm50 14h2v6h-2Zm52-15h2v7h-2Z" fill="#9bbba9"/><path d="M36 121h16v2H36Zm48 7h23v2H84Zm39-5h13v2h-13Z" fill="#b6cab2"/></>}
  {zone===2&&<><path d="M55 43h3v3h-3Zm47 0h3v3h-3Zm-47 69h3v3h-3Zm47 0h3v3h-3ZM21 16h7v3h-7Zm0 18h7v3h-7Zm111-18h10v3h-10Zm0 18h10v3h-10Z" fill="#f1cb8d"/><path d="M64 13h4v-7h5V0h4v9h-5v8h-8Zm24 4h5V9h6v-8h4v11h-6v9h-9Z" fill="#b6b9a0"/><path d="M10 121h12v3H10Zm128 0h13v3h-13Z" fill="#d9a46d"/></>}
  {zone===3&&<><path d="M8 46h20v6H8Zm125 7h18v6h-18Z" fill="#a75c51"/><path d="M10 47h4v4h-4Zm127 7h4v4h-4Z" fill="#f1d496"/><path d="M49 31h3v3h-3Zm59 0h3v3h-3Zm-59 82h3v3h-3Zm59 0h3v3h-3ZM13 88h3v4h-3Zm9 14h3v4h-3Zm110-13h3v4h-3Zm12 15h3v4h-3Z" fill="#d7c9a6"/><path d="M68 57h23v5H68Z" fill="#d1b778"/></>}
  {zone===4&&<><path d="M65 32h2v79h-2Zm15 0h2v79h-2Zm15 0h2v79h-2Z" fill="#d1dbc3"/><path d="M7 54h8v3H7Zm14 22h4v4h-4Zm109-23h12v3h-12ZM40 152h27v2H40Zm55 4h16v2H95Z" fill="#a4c6b5"/><path d="M57 22h4v3h-4Zm45 0h4v3h-4ZM6 101h6v2H6Zm141 0h7v2h-7Z" fill="#d5cd92"/></>}
  {zone===5&&<><path d="M58 31h4v3h-4Zm40 0h4v3h-4Zm-40 71h4v3h-4Zm40 0h4v3h-4ZM5 38h10v3H5Zm138 4h12v3h-12Z" fill="#dde9c9"/><path d="M66 98h28v3H66Zm-6 8h40v2H60Z" fill="#d9c897"/><path d="M5 119h5v3H5Zm143 0h5v3h-5Z" fill="#a2d9d1"/></>}
  {zone===6&&<><path d="M59 34h40v5H59Zm5-8h30v6H64Zm6-6h19v6H70Zm7-5h5v6h-5Z" fill="#7c8e62"/><path d="M68 41h22v2H68Zm-4 20h31v2H64Zm3 10h2v53h-2Zm21 0h2v53h-2Z" fill="#c3be89"/><path d="M26 77h2v17h-2Zm22 16h3v23h-3Zm53 0h3v28h-3Zm43-8h2v19h-2Z" fill="#76966c"/><path d="M5 132h9v3H5Zm28-5h7v3h-7Zm90 8h9v3h-9Zm21-6h7v3h-7Z" fill="#cfb17d"/><path d="M10 135h2v5h-2Zm26-5h2v5h-2Zm90 8h2v5h-2Zm22-6h2v5h-2Z" fill="#e0d5a1"/><path d="M19 47h2v2h-2Zm32-9h2v2h-2Zm65 20h2v2h-2Zm27-21h2v2h-2Z" fill="#b4c38e"/></>}
  {zone===7&&<><path d="M5 51h35v1H5Zm0 11h6v1H5Zm16 0h19v1H21Zm-16 12h35v1H5Zm0 16h35v1H5Zm0 21h35v1H5Zm6-68h1v7h-1Zm18 32h1v6h-1ZM121 51h37v1h-37Zm0 24h37v1h-37Zm0 16h37v1h-37Zm0 21h37v1h-37Zm12-68h1v7h-1Zm13 33h1v12h-1Z" fill="#405957"/><path d="M49 85h5v28h-5Zm57 0h5v28h-5Z" fill="#ae7150"/><path d="M50 86h2v21h-2Zm57 0h2v21h-2ZM13 57h3v13h-3Zm113 0h3v13h-3Z" fill="#e0c48d"/><path d="M64 76h31v2H64Zm2 56h30v2H66Z" fill="#ced1b3"/></>}
  <path d="M0 168h160v132H0Z" fill={p.dark}/><path d="M0 169h160v1H0ZM0 292h160v8H0Z" fill={p.wall}/>
 </svg>;
}
