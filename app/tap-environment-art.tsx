import type {ReactNode} from 'react';
import type {ThemeId} from './cosmetic-engine';
export const ENVIRONMENTS={
 classic:{sky:'#e9d9bc',floor:'#ddc5a1',ink:'#795c49',light:'#fff1d4',accent:'#b58c65',kind:'classic'},
 soda:{sky:'#9bcbdc',floor:'#d8e4d9',ink:'#466f7e',light:'#fff5da',accent:'#79aeb9',kind:'clouds'},
 mint:{sky:'#bfd2c0',floor:'#dddcc4',ink:'#48736b',light:'#f5eed6',accent:'#88b3a0',kind:'hammam'},
 night:{sky:'#27304b',floor:'#344459',ink:'#162238',light:'#f1dba6',accent:'#788ca4',kind:'moon'},
 bath:{sky:'#c9a27f',floor:'#e3cba4',ink:'#78584c',light:'#fff0c8',accent:'#b87c60',kind:'bath'},
 emerald:{sky:'#245545',floor:'#244b40',ink:'#13382f',light:'#d7efb7',accent:'#83bf8c',kind:'crystals'},
 skyline:{sky:'#b2d7e2',floor:'#dce6dc',ink:'#42657b',light:'#fff5dd',accent:'#83a6b5',kind:'penthouse'},
 observatory:{sky:'#182e3e',floor:'#2d444a',ink:'#102330',light:'#f2ddb0',accent:'#b99b66',kind:'observatory'},
} as const;
type Palette=typeof ENVIRONMENTS[ThemeId];
type Paint=readonly [string,string];
function Shapes({paint}:{paint:readonly Paint[]}){return <>{paint.map(([fill,d],i)=><path key={i} fill={fill} d={d}/>)}</>;}
function Motion({kind='glint',secondary=false,children}:{kind?:'glint'|'drift'|'mist'|'water';secondary?:boolean;children:ReactNode}){
 return <g className={'scene-motion scene-'+kind} data-scene-motion={secondary?'secondary':'primary'}>{children}</g>;
}
function Classic({p,detail:d}:{p:Palette;detail:number}){return <g data-scene-detail="classic" data-scene-feature="sunlit-studio">
 <Shapes paint={[
  [p.floor,'M0 241h160v79H0Z'],[p.accent,'M0 233h160v8H0Z'],[p.light,'M0 233h160v2H0Z'],
  ['#c2ac87','M6 73h82v120H6Z'],[p.ink,'M11 77h74v109H11Z'],[p.light,'M14 80h68v102H14Z'],
  ['#b5cfc3','M18 84h60v94H18Z'],['#e4e4c3','M18 141h60v37H18Z'],
  ['#85a68c','M18 155h10v-8h11v8h13v-12h12v9h14v26H18Z'],
  [p.light,'M45 82h4v99h-4ZM15 127h65v4H15ZM7 187h84v5H7Z'],
  ['#d3ab82','M2 71h10v113H2Zm76 0h11v113H78Z'],
  [p.ink,'M109 99h38v42h-38Z'],[p.light,'M112 102h32v36h-32Z'],
  ['#b68259','M117 125h8v-13h6v13h8v8h-22Z'],
  ['#a16e54','M106 208h54v54h-54ZM0 214h39v40H0Z'],
  ['#bb8a67','M109 211h51v46h-51ZM0 217h36v32H0Z'],
  ['#ddba8f','M111 214h49v15h-49ZM0 219h34v6H0Z'],
  ['#6c8d77','M1 190h8v-12h7v11h8v7h-8v12H8v-10H1Zm128 6h6v-10h7v-11h5v16h9v8h-15v14h-9v-11h-4Z'],
  ['#b77e57','M6 204h17v17H6Zm122 6h27v7h-3v17h-23v-17h-7Z'],
 ]}/>
 {d>0&&<Shapes paint={[[p.light,'M4 78h2v95H4Zm79 0h2v95h-2ZM109 212h48v1h-48ZM1 220h30v1H1Z'],['#927251','M0 267h160v1H0Zm0 28h160v1H0Zm34-55h1v27h-1Zm80 0h1v27h-1Zm-48 28h1v27h-1Zm68 28h1v25h-1Z'],['#758777','M111 238h12v13h-12Zm18 0h3v13h-3Zm7 0h10v13h-10Z'],['#eee0ba','M112 239h9v2h-9Zm25 0h7v2h-7Z']]}/>}
 <Motion><path d="M21 90h2v26h-2Zm3 0h7v2h-7Z" fill="#fffbe5"/></Motion>
 </g>;}
function Soda({p,detail:d}:{p:Palette;detail:number}){return <g data-scene-detail="clouds" data-scene-feature="open-cloud-terrace">
 <Shapes paint={[
  ['#cce4df','M0 172h160v66H0Z'],['#b7d7d5','M0 206h160v32H0Z'],
  [p.floor,'M0 238h160v82H0Z'],['#c0d1c8','M0 238h160v6H0Z'],
  [p.light,'M-7 93h10v-7h15v-8h24v6h14v8h13v13H-7Zm113 53h11v-6h12v-9h21v7h16v8h12v12h-72Z'],
  ['#dcece2','M0 105h62v3H0Zm108 53h52v3h-52Z'],
  ['#8bb8bb','M0 222h19v-12h13v7h12v-17h13v21h15v-12h14v14h16v-20h12v11h15v-17h14v23h17v18H0Z'],
  [p.ink,'M0 230h160v5H0ZM8 235h3v26H8Zm31 0h3v26h-3Zm40 0h3v26h-3Zm39 0h3v26h-3Zm31 0h3v26h-3Z'],
  [p.light,'M0 231h160v1H0Z'],
  ['#426e69','M2 242h35v9H2Zm117 0h41v9h-41Z'],
  ['#68947d','M5 232h8v-12h6v10h9v9h7v7H5Zm116 7h8v-12h10v-11h6v17h10v13h-39Z'],
  [p.light,'M3 250h33v24H3Zm115 0h45v24h-45Z'],
  ['#a6b8ac','M7 255h25v2H7Zm113 0h39v2h-39Z'],
  ['#638e91','M126 278h24v9h-24Zm-6 9h38v3h-38Z'],
  ['#b8cbc6','M0 291h160v1H0Zm31-46h1v46h-1Zm99-46h1v46h-1Z'],
 ]}/>
 {d>0&&<Shapes paint={[[p.light,'M34 177h19v2H34Zm63 17h33v2H97ZM2 276h32v2H2Zm114 0h46v2h-46Z'],['#7ba6a6','M4 225h3v3H4Zm46-18h3v4h-3Zm60 10h3v4h-3Zm26-15h3v4h-3Z'],['#94b8ad','M10 238h3v5h-3Zm14-2h3v6h-3Zm106-6h3v8h-3Zm12 4h3v8h-3Z']]}/>}
 <Motion kind="drift"><path d="M87 87h8v-6h11v-5h16v5h12v7h11v10H87Z" fill={p.light}/></Motion>
 </g>;}
function Mint({p,detail:d}:{p:Palette;detail:number}){return <g data-scene-detail="hammam" data-scene-feature="garden-hammam">
 <Shapes paint={[
  ['#a4c2b2','M0 69h160v158H0Z'],[p.floor,'M0 227h160v93H0Z'],
  [p.ink,'M21 72h63v106H21Z'],[p.light,'M24 76h57v98H24Z'],
  ['#c5d8b8','M29 81h47v88H29Z'],['#8fae94','M29 144h9v-16h9v-18h8v27h11v-17h10v49H29Z'],
  [p.light,'M50 79h4v92h-4ZM27 121h51v3H27ZM18 175h70v5H18Z'],
  ['#83ad9c','M0 191h160v37H0Z'],[p.ink,'M0 223h160v5H0Z'],
  [p.light,'M0 194h160v2H0Zm3 7h11v12H3Zm22 0h11v12H25Zm22 0h11v12H47Zm22 0h11v12H69Zm22 0h11v12H91Zm22 0h11v12h-11Zm22 0h11v12h-11Z'],
  ['#638f80','M104 85h9v-8h24v8h9v10h-42ZM0 236h51v7H0Zm121 0h39v7h-39Z'],
  [p.light,'M108 91h34v9h-34ZM0 243h47v14H0Zm125 0h35v14h-35Z'],
  ['#b6c4ac','M0 257h47v7H0Zm125 0h35v7h-35Z'],
  ['#6b9e90','M21 279h118v41H21Z'],[p.light,'M17 276h126v4H17Zm0 4h4v40h-4Zm122 0h4v40h-4Z'],
  ['#a8c3b0','M0 274h17v46H0Zm143 0h17v46h-17Z'],
  ['#a9c7b6','M26 285h108v3H26Zm1 26h34v2H27Zm71-11h36v2H98Z'],
  ['#507e65','M119 152h7v-19h7v-12h6v22h12v9h-16v20h-8v-13h-8Z'],
  ['#a18460','M122 170h24v17h-24Z'],
 ]}/>
 {d>0&&<Shapes paint={[[p.ink,'M9 201h1v12H9Zm22 0h1v12h-1Zm22 0h1v12h-1Zm22 0h1v12h-1Zm22 0h1v12h-1Zm22 0h1v12h-1Zm22 0h1v12h-1Z'],['#c6d7bf','M2 230h49v1H2Zm111 0h48v1h-48ZM3 266h42v1H3Zm124 0h34v1h-34Z'],['#b2ac8c','M31 230h1v45h-1Zm69 0h1v45h-1Z']]}/>}
 <Motion kind="water"><path d="M28 293h23v1H28Zm75 14h29v1h-29Z" fill={p.light}/></Motion>
 </g>;}
function Bath({p,detail:d}:{p:Palette;detail:number}){return <g data-scene-detail="turkish-bath" data-scene-feature="copper-mosaic-room">
 <Shapes paint={[
  ['#b98468','M0 61h160v173H0Z'],[p.floor,'M0 234h160v86H0Z'],
  ['#9b6c57','M17 104h5V91h8V81h11v-8h16v-5h45v5h16v8h11v10h8v13h6v102H17Z'],
  [p.light,'M22 104h5V92h8v-9h11v-7h14v-4h39v4h14v7h11v9h8v12h6v99H22Z'],
  ['#d5ba91','M28 108h5V96h9v-9h15v-7h43v7h15v9h9v12h7v89H28Z'],
  ['#9eaa8f','M34 117h91v80H34Z'],['#6e9386','M34 166h91v31H34Z'],
  ['#e6d4ac','M44 110h13v9H44Zm57 0h13v9h-13ZM70 88h20v5H70Z'],
  ['#775b4c','M0 212h46v7H0Zm117 0h43v7h-43Z'],
  ['#d7ad7a','M0 219h43v22H0Zm120 0h40v22h-40Z'],
  ['#f4ddb0','M0 220h41v4H0Zm122 0h38v4h-38Z'],
  ['#a16c4e','M5 164h27v6h-4v10H10v-10H5Zm124 0h27v6h-4v10h-18v-10h-5Z'],
  ['#e6c18b','M8 165h21v2H8Zm124 0h21v2h-21Z'],
  ['#9b7355','M17 179h3v26h-3Zm123 0h3v26h-3ZM2 254h44v4H2Zm112 0h48v4h-48Z'],
  ['#f1dfba','M0 258h47v13H0Zm113 0h47v13h-47Z'],
  ['#c9ab83','M0 285h160v2H0ZM0 311h160v2H0ZM40 234h2v51h-2ZM118 234h2v51h-2Z'],
  ['#6c8774','M0 101h8v-17h6v-9h5v20h7v9H12v37H5v-27H0Z'],
 ]}/>
 {d>0&&<Shapes paint={[[p.light,'M35 130h7v7h-7Zm16 16h7v7h-7Zm48-16h7v7h-7Zm16 16h7v7h-7ZM38 181h8v1h-8Zm69-6h11v1h-11Z'],['#517d73','M36 152h5v5h-5Zm14-20h5v5h-5Zm51 15h5v5h-5Zm14-21h5v5h-5Z'],['#785e4c','M6 244h27v1H6Zm121 0h29v1h-29ZM68 287h1v24h-1Z']]}/>}
 <Motion kind="mist"><path d="M19 162h3v-8h-4v-8h3v-9h-3v8h-3v11h4Zm121 0h3v-11h-3v-6h-3v9h3Z" fill={p.light}/></Motion>
 </g>;}
function Night({p,detail:d}:{p:Palette;detail:number}){return <g data-scene-detail="night-city" data-scene-feature="rooftop-evening">
 <Shapes paint={[
  ['#3b4561','M0 194h160v52H0Z'],['#44536a','M0 224h160v22H0Z'],
  ['#d6c8a3','M23 73h13v3h6v6h3v14h-3v6h-6v3H23v-3h-6v-6h-3V82h3v-6h6Z'],
  [p.sky,'M30 73h7v4h6v8h4v14h-8v5H28v-4h-6v-6h-3V81h4v-5h7Z'],
  ['#202b42','M0 205h12v-29h18v20h13v-37h17v31h18v-21h12v39h14v-25h16v-24h17v40h23v50H0Z'],
  ['#526176','M0 232h19v-19h20v16h15v-24h16v32h25v-22h19v15h19v-27h27v43H0Z'],
  [p.light,'M15 182h3v5h-3Zm34-15h3v5h-3Zm7 10h3v5h-3Zm29 0h3v5h-3Zm46-10h3v5h-3Zm15 48h3v5h-3Z'],
  [p.ink,'M0 244h160v76H0Z'],[p.floor,'M0 250h160v70H0Z'],
  ['#81919c','M0 234h160v3H0ZM0 236h4v23H0Zm31 0h3v23h-3Zm92 0h3v23h-3Zm34 0h3v23h-3Z'],
  ['#a9b9ba','M0 234h160v1H0Z'],
  ['#1e3042','M0 270h29v7H0Zm130-7h30v7h-30Z'],
  ['#577c72','M2 258h7v-11h7v13h9v10H2Zm132 0h7v-15h7v13h9v8h-25Z'],
  ['#8c6e58','M0 274h28v16H0Zm133-7h27v16h-27Z'],
  ['#bd9970','M2 275h24v2H2Zm133-7h25v2h-25Z'],
  ['#4b5969','M0 300h160v1H0Zm43-50h1v50h-1Zm75-50h1v50h-1Z'],
 ]}/>
 {d>0&&<Shapes paint={[[p.light,'M82 81h1v1h-1Zm49 28h2v2h-2Zm-16-25h1v1h-1Zm-43 39h1v1h-1ZM19 216h2v3h-2Zm37 1h2v3h-2Zm49 7h2v3h-2Zm38-13h2v3h-2Z'],['#7594a1','M9 288h14v1H9Zm127 0h16v1h-16Zm-90-26h17v1H46Zm56-4h15v1h-15Z'],['#3b5369','M0 251h160v2H0Z']]}/>}
 <Motion><path d="M113 94h2v3h3v2h-3v3h-2v-3h-3v-2h3Z" fill={p.light}/></Motion>
 </g>;}
function Emerald({p,detail:d}:{p:Palette;detail:number}){return <g data-scene-detail="crystal-cave" data-scene-feature="underground-lake">
 <Shapes paint={[
  ['#39705a','M13 81h14V65h17v-8h70v10h17v15h16v150H13Z'],
  ['#2d614e','M25 84h13V72h84v15h16v139H25Z'],[p.ink,'M0 0h160v56h-13v31h-13V58h-17V43H42v17H25v28H12v30H0Z'],
  ['#37634f','M0 65h10v48h8v85H9v54H0Zm151-9h9v206h-10v-57h-6V119h7Z'],
  [p.floor,'M0 244h160v76H0Z'],['#518777','M15 259h129v55H15Z'],
  ['#77a992','M18 266h125v3H18Zm16 37h99v2H34Z'],
  ['#163f35','M0 231h22v12h15v13h-8v13H0Zm125-6h22v13h13v37h-28v-13h-12v-13h5Z'],
  ['#89c997','M4 182h6v-14h6v-23h7v12h6v27h-7v11H10v-9H4Zm132 44v-37h7v-21h7v15h6v39h-6v11h-9v-7Z'],
  ['#d7efb7','M16 150h3v33h-4v7h-3v-20h4Zm129 24h3v41h-4v11h-3v-35h4Z'],
  ['#438c68','M21 163h5v18h-5v9h-4v-7h4Zm128 22h5v35h-5v8h-4v-13h4Z'],
  ['#b2dcaa','M7 239h6v-20h6v11h5v19h-6v10h-8v-9H7Zm124 25h6v-13h5v-16h6v22h5v14h-10v8h-9v-7h-3Z'],
  ['#6aab7f','M11 223h3v23h-3Zm129 16h3v27h-3Z'],
  ['#5e8c65','M27 79h8v6h-8Zm83-9h11v6h-11ZM9 213h8v4H9Zm128 31h10v4h-10Z'],
 ]}/>
 {d>0&&<Shapes paint={[[p.ink,'M12 118h5v12h-5ZM142 87h5v23h-5ZM0 289h18v31H0Zm144-2h16v33h-16Z'],['#accf9c','M8 281h12v1H8Zm105-6h21v1h-21Zm-75 21h17v1H30Z'],['#6d9d75','M1 144h8v2H1Zm150-13h10v2h-10ZM18 291h8v2h-8Zm117 15h12v2h-12Z']]}/>}
 <Motion kind="water"><path d="M21 277h24v1H21Zm96 23h18v1h-18Z" fill={p.light}/></Motion>
 </g>;}
function Skyline({p,detail:d}:{p:Palette;detail:number}){return <g data-scene-detail="pixel-penthouse" data-scene-feature="panoramic-lounge">
 <Shapes paint={[
  ['#deebe2','M0 53h160v9H0Z'],['#d8e4da','M0 230h160v90H0Z'],
  ['#94bdca','M5 200h17v-28h17v18h16v-34h18v42h16v-15h13v-45h21v57h18v-27h19v66H5Z'],
  ['#759eb2','M0 216h22v-17h16v23h18v-17h18v26h15v-22h19v21h16v-27h20v16h16v17H0Z'],
  ['#d0e5db','M7 100h9v-7h16v-6h21v6h11v8h15v9H7Zm101-13h9v-5h15v-6h23v9h10v11h-57Z'],
  [p.ink,'M0 62h5v169H0Zm76 0h4v169h-4Zm79 0h5v169h-5ZM0 229h160v5H0Z'],
  [p.light,'M4 62h1v166H4Zm75 0h1v166h-1Zm76 0h1v166h-1ZM0 234h160v4H0Z'],
  ['#aac1c2','M0 269h160v2H0Zm0 28h160v2H0Zm43-59h1v30h-1Zm76-30h1v30h-1Zm-40 31h1v28h-1Z'],
  ['#667b7e','M0 208h30v8H0Zm-1 9h27v33H0Z'],
  ['#91a59a','M0 219h24v28H0Z'],[p.light,'M0 209h29v3H0Z'],
  ['#557f70','M4 197h7v-14h6v-10h5v24h6v11H4Z'],
  ['#bda583','M5 204h19v8H5Z'],
  ['#8faaa8','M114 244h46v22h-46ZM125 264h3v15h-3Zm24 0h3v15h-3Z'],
  [p.light,'M117 246h43v14h-43Z'],
  ['#a9bdb6','M140 242h2v18h-2Zm-21 9h14v6h-14Z'],
  ['#829597','M10 272h26v4H10Zm9 4h3v17h-3Zm-8 17h25v3H11Z'],
 ]}/>
 {d>0&&<Shapes paint={[[p.light,'M26 179h3v5h-3Zm34-17h3v5h-3Zm49-16h3v6h-3Zm8 17h3v5h-3Zm28 14h3v5h-3ZM4 221h16v1H4Z'],['#9fbdc1','M8 226h10v1H8Zm33-8h8v1h-8Zm66 4h11v1h-11Zm30 5h16v1h-16Z'],['#617d7d','M7 194h2v8H7Zm12-9h2v16h-2ZM118 263h39v1h-39Z']]}/>}
 <Motion kind="drift"><path d="M108 118h7v-5h17v-5h13v6h12v9h9v7h-58Z" fill={p.light}/></Motion>
 </g>;}
function Observatory({p,detail:d}:{p:Palette;detail:number}){return <g data-scene-detail="pixel-observatory" data-scene-feature="astronomers-dome">
 <Shapes paint={[
  ['#264452','M0 61h160v151H0Z'],[p.sky,'M12 66h136v144H12Z'],
  [p.accent,'M0 67h9V49h13V35h17V24h20v-7h45v7h20v11h17v14h12v18h7v5h-12V52h-12V39h-17V28h-17v-7H62v7H42v11H26v13H13v20H0Z'],
  ['#795f42','M0 71h8v161H0Zm152 0h8v161h-8ZM79 21h3v190h-3ZM0 210h160v5H0Z'],
  ['#d0bb8a','M5 73h1v135H5Zm150 0h1v135h-1ZM80 25h1v179h-1Z'],
  [p.floor,'M0 215h160v105H0Z'],[p.ink,'M0 211h160v5H0Z'],
  ['#597b7b','M111 91h16v-4h14v4h9v7h-9v5h-14v-3h-16Z'],
  [p.light,'M105 105h13v-3h13v-3h13v-3h13v3h-12v3h-13v3h-13v3h-14Z'],
  [p.accent,'M110 161h39v34h-39Z'],[p.ink,'M113 164h33v28h-33Z'],
  ['#537174','M116 178h8v-8h3v12h13v3h-16v3h-3v-7h-5Z'],
  ['#95764c','M6 249h51v6H6Zm6 6h4v23h-4Zm34 0h4v23h-4ZM121 240h39v7h-39Zm4 7h4v24h-4Zm26 0h4v24h-4Z'],
  ['#d5bd84','M8 250h47v2H8Zm116-9h42v2h-42Z'],
  ['#77827a','M0 293h160v1H0Zm41-77h1v77h-1Zm78-77h1v77h-1Z'],
 ]}/>
 <g data-scene-feature="brass-telescope"><Shapes paint={[
  [p.ink,'M14 220h9v-6h13v-6h12v-6h10v17H47v7H35v6H22v7H12v-6H8v-9h6Z'],
  [p.accent,'M15 222h10v-6h12v-6h12v-5h6v11H45v6H33v7H21v6h-6v-5h-4v-5h4Z'],
  [p.light,'M17 222h8v-4h12v-6h12v-5h4v4H43v6H31v7H17Z'],
  ['#947b58','M25 234h5v32h-5Zm0 3h3v7h-5v12h-5v13h-5v-5h3v-11h4v-12h5Zm5 0h4v9h5v11h5v12h-5v-10h-4v-11h-5Z'],
 ]}/></g>
 <path data-scene-feature="observatory-stars" fill={p.light} d="M23 88h2v2h-2Zm34 22h1v1h-1Zm44 22h2v2h-2Zm38-56h1v1h-1Zm-28 41h1v1h-1Zm-82 23h1v1h-1Z"/>
 {d>0&&<Shapes paint={[[p.accent,'M114 166h1v24h-1Zm30 0h1v24h-1ZM4 73h2v1H4Zm150 0h2v1h-2ZM46 294h66v1H46Z'],['#acc7b0','M117 171h2v2h-2Zm16 14h2v2h-2ZM126 182h1v3h-1Z'],['#1b3038','M0 274h41v3H0Zm120-1h40v3h-40Z']]}/>}
 <Motion><path d="M40 91h2v3h3v2h-3v3h-2v-3h-3v-2h3Z" fill={p.light}/></Motion>
 </g>;}
const DRAWINGS={classic:Classic,soda:Soda,mint:Mint,night:Night,bath:Bath,emerald:Emerald,skyline:Skyline,observatory:Observatory};
const TRIM:Record<ThemeId,string>={
 classic:'M5 75h1v101H5ZM84 75h1v101h-1ZM16 184h65v1H16ZM108 231h50v1h-50ZM109 255h4v4h-4ZM151 255h4v4h-4ZM3 225h3v19H3ZM27 225h3v19h-3ZM112 240h2v9h-2ZM116 240h2v9h-2ZM138 240h2v10h-2Z',
 soda:'M0 106h17v2H0ZM20 102h18v2H20ZM39 105h18v1H39ZM111 155h19v2h-19ZM141 153h18v2h-18ZM8 252h1v18H8ZM30 252h1v18h-1ZM121 252h1v18h-1ZM154 252h1v18h-1Z',
 mint:'M5 201h2v2H5ZM10 208h2v2h-2ZM27 201h2v2h-2ZM32 208h2v2h-2ZM49 201h2v2h-2ZM54 208h2v2h-2ZM71 201h2v2h-2ZM76 208h2v2h-2ZM93 201h2v2h-2ZM98 208h2v2h-2ZM115 201h2v2h-2ZM120 208h2v2h-2ZM137 201h2v2h-2ZM142 208h2v2h-2Z',
 night:'M0 112h12v1H0ZM12 113h14v1H12ZM26 114h20v1H26ZM46 115h22v1H46ZM68 116h25v1H68ZM93 115h26v1H93ZM119 114h21v1h-21ZM140 113h20v1h-20ZM18 177h1v26h-1ZM58 161h1v32h-1ZM135 161h1v38h-1Z',
 bath:'M23 105h1v86h-1ZM137 105h1v86h-1ZM28 95h1v8h-1ZM132 95h1v8h-1ZM42 84h1v8h-1ZM116 84h1v8h-1ZM62 75h35v1H62ZM2 230h37v1H2ZM123 230h35v1h-35ZM13 172h12v1H13ZM136 172h12v1h-12Z',
 emerald:'M3 89h6v2H3ZM10 131h5v2h-5ZM4 198h7v2H4ZM146 114h9v2h-9ZM146 188h5v2h-5ZM18 235h2v9h-2ZM137 238h2v8h-2ZM13 255h13v2H13ZM134 269h10v2h-10Z',
 skyline:'M27 179h1v3h-1ZM29 187h2v2h-2ZM60 173h2v3h-2ZM65 184h2v3h-2ZM67 161h2v3h-2ZM108 149h2v3h-2ZM115 157h2v3h-2ZM111 170h2v3h-2ZM115 181h2v3h-2ZM147 178h2v3h-2ZM152 190h2v3h-2ZM118 247h1v10h-1ZM155 247h1v10h-1Z',
 observatory:'M14 51h1v12h-1ZM27 38h1v10h-1ZM43 27h1v8h-1ZM62 20h17v1H62ZM83 20h18v1H83ZM117 27h1v8h-1ZM135 38h1v10h-1ZM147 51h1v12h-1ZM16 224h2v5h-2ZM36 214h2v4h-2ZM50 207h2v6h-2ZM12 251h2v2h-2ZM48 251h2v2h-2Z',
};
const DETAILS:Record<ThemeId,string>={
 classic:'M4 78h2v35H4ZM84 78h2v36h-2ZM10 182h77v2H10ZM109 213h46v2h-46ZM111 217h17v1h-17ZM141 217h14v1h-14ZM2 219h31v2H2ZM9 205h12v2H9ZM126 211h26v2h-26Z',
 soda:'M12 89h12v2H12ZM26 85h12v2H26ZM43 95h14v2H43ZM123 142h14v2h-14ZM141 139h9v2h-9ZM5 250h28v2H5ZM117 250h41v2h-41ZM127 279h20v2h-20Z',
 mint:'M31 84h10v1H31ZM56 84h16v1H56ZM24 172h53v2H24ZM3 245h39v2H3ZM127 245h31v2h-31ZM23 281h113v2H23ZM26 306h20v1H26ZM114 292h17v1h-17Z',
 night:'M4 115h2v5H4ZM28 118h2v5h-2ZM53 119h2v5h-2ZM79 120h2v5h-2ZM105 119h2v5h-2ZM130 118h2v5h-2ZM154 116h2v5h-2ZM0 235h160v1H0ZM2 275h23v1H2ZM135 269h22v1h-22Z',
 bath:'M29 107h2v70h-2ZM130 107h2v70h-2ZM45 88h1v6h-1ZM115 88h1v6h-1ZM68 79h26v1H68ZM7 165h23v1H7ZM131 165h23v1h-23ZM2 259h40v2H2ZM116 259h42v2h-42Z',
 emerald:'M16 159h2v7h-2ZM11 176h2v5h-2ZM145 182h2v13h-2ZM140 204h2v7h-2ZM11 233h2v8h-2ZM140 253h2v8h-2ZM20 269h24v1H20ZM118 302h15v1h-15Z',
 skyline:'M2 65h1v158H2ZM77 65h1v158h-1ZM157 65h1v158h-1ZM3 235h153v2H3ZM2 210h25v1H2ZM3 220h18v1H3ZM120 246h16v2h-16ZM144 246h15v2h-15Z',
 observatory:'M6 73h1v103H6ZM153 73h1v103h-1ZM23 37h1v10h-1ZM136 37h1v10h-1ZM47 29h8v1H47ZM106 29h8v1h-8ZM113 163h33v1h-33ZM15 222h7v1h-7ZM38 213h7v1h-7ZM12 250h36v1H12Z',
};
const MICRO:Record<ThemeId,string>={
 classic:'M9 137h2v18H9ZM80 139h2v17h-2ZM111 233h44v1h-44ZM3 226h29v1H3ZM4 273h17v1H4ZM129 301h23v1h-23Z',
 soda:'M13 234h1v9h-1ZM17 236h1v8h-1ZM137 232h1v11h-1ZM145 233h1v10h-1ZM5 273h28v1H5ZM118 273h41v1h-41Z',
 mint:'M31 245h1v8h-1ZM13 245h1v8h-1ZM139 245h1v8h-1ZM153 245h1v8h-1ZM35 278h1v2h-1ZM71 278h1v2h-1ZM107 278h1v2h-1Z',
 night:'M13 192h3v4h-3ZM26 191h3v4h-3ZM46 193h3v4h-3ZM61 200h2v4h-2ZM122 190h3v4h-3ZM136 190h3v4h-3ZM149 222h2v4h-2Z',
 bath:'M38 142h3v3h-3ZM44 148h3v3h-3ZM55 130h3v3h-3ZM110 139h3v3h-3ZM115 152h3v3h-3ZM105 162h3v3h-3ZM63 177h4v2h-4ZM94 181h4v2h-4Z',
 emerald:'M28 94h4v1h-4ZM26 106h1v7h-1ZM136 136h3v1h-3ZM138 145h1v9h-1ZM9 216h5v1H9ZM143 231h9v1h-9Z',
 skyline:'M60 210h2v3h-2ZM65 216h2v3h-2ZM94 215h2v3h-2ZM101 220h2v3h-2ZM129 210h2v3h-2ZM136 217h2v3h-2ZM6 231h13v1H6Z',
 observatory:'M120 171h2v2h-2ZM133 183h2v2h-2ZM123 174h1v6h-1ZM124 179h9v1h-9ZM18 216h2v1h-2ZM27 188h1v1h-1ZM63 163h1v1h-1Z',
};
/** Fine work stays inside a material: book spines, tile mosaics, lit windows,
 * rock faces and the observatory sky. Batched once, never generated per frame. */
function FineMaterials({theme,p}:{theme:ThemeId;p:Palette}){
 const points:{x:number;y:number;w:number;h:number}[]=[];
 const patch=(x:number,y:number,cols:number,rows:number,dx:number,dy:number,w=1,h=1)=>{for(let row=0;row<rows;row++)for(let col=0;col<cols;col++)points.push({x:x+col*dx,y:y+row*dy,w,h});};
 if(theme==='classic'){patch(112,239,7,3,6,5);patch(5,274,7,3,23,11,3);}
 if(theme==='soda'){patch(5,278,7,5,24,8,3);patch(9,256,4,2,5,8);}
 if(theme==='mint')patch(4,200,7,6,22,3);
 if(theme==='bath')patch(36,125,7,7,14,9,2);
 if(theme==='night'){patch(46,168,2,6,6,8);patch(123,169,2,7,6,8);patch(3,218,6,3,25,6);}
 if(theme==='emerald'){patch(3,118,3,8,3,13,2);patch(150,123,3,8,3,13,2);}
 if(theme==='skyline'){patch(25,178,2,6,5,7);patch(58,161,3,9,5,7);patch(107,147,3,10,5,7);patch(144,175,2,8,5,7);}
 if(theme==='observatory')for(let i=0;i<43;i++)points.push({x:17+i*37%125,y:76+i*31%121,w:1,h:1});
 const path=(light:boolean)=>points.filter((_,i)=>(i%3!==0)===light).map(q=>'M'+q.x+' '+q.y+'h'+q.w+'v'+q.h+'h-'+q.w+'Z').join('');
 return <g data-scene-feature="fine-material-work"><path d={path(true)} fill={p.light} opacity={theme==='observatory'||theme==='night'?'.7':'.5'}/><path d={path(false)} fill={p.accent} opacity=".65"/></g>;
}
/** Eight authored rooms on the game's original pixel grid. All detail is static,
 * batched by material; only small ambient groups animate on the live screen. */
export function TapEnvironmentArt({theme,detail}:{theme:ThemeId;detail:number}){
 const p=ENVIRONMENTS[theme],Scene=DRAWINGS[theme];
 return <g data-tap-art-revision="rooms-2">
  <rect width="160" height="320" fill={p.sky}/>
  <Scene p={p} detail={detail}/>
  {detail>=1&&<g data-scene-feature="crafted-trim"><path d={TRIM[theme]} fill={p.ink} opacity=".55"/><path d={DETAILS[theme]} fill={p.light}/></g>}
  {detail>=2&&<g data-pixel-material={theme}><path d={MICRO[theme]} fill={p.accent}/><path d={TRIM[theme]} fill={p.light} opacity=".18"/><Motion secondary><path d={theme==='night'||theme==='observatory'?'M141 122h2v2h-2ZM17 150h1v1h-1Z':theme==='emerald'?'M16 166h2v5h-2ZM144 196h2v8h-2Z':'M6 231h11v1H6ZM135 242h13v1h-13Z'} fill={p.light}/></Motion></g>}
  {detail>=3&&<g data-scene-feature="material-inlays"><path d={MICRO[theme]} fill={p.ink} opacity=".2"/><path d="M3 301h12v1H3ZM137 307h20v1h-20Z" fill={p.accent}/><Motion kind="water" secondary><path d="M7 300h9v1H7ZM135 305h13v1h-13Z" fill={p.light}/></Motion></g>}
  {detail>=4&&<g data-pixel-reflections=""><path d={DETAILS[theme]} fill={p.light} opacity=".3"/><path d="M1 262h16v1H1ZM143 271h16v1h-16ZM36 307h15v1H36Z" fill={p.light}/></g>}
  {detail>=4&&<FineMaterials theme={theme} p={p}/>}
 </g>;
}
