export function RunnerBiomeSprites({ prefix }: { prefix: string }) { return <>
  {(["park","cherry"] as const).flatMap(kind=>[0,1,2].map(variant=><g key={`${kind}-grove-${variant}`} id={`${prefix}-${kind}-grove-${variant}`}>
    {[-186,0,186].map((x,i)=><use key={x} href={`#${prefix}-${kind}-tree-${(i+variant)%3}`} transform={`translate(${x} ${i===1?-12:0}) scale(${i===1?1.09:.96})`} />)}
  </g>))}
  <g id={`${prefix}-office-light`}>
    <path d="M-5-184H5V0H-5Zm-28-188h56v8h-56Z" fill="#344c60" /><path d="M-2-179h3V-4h-3ZM-25-185h20v3h-20Zm30 0h20v3H5Z" fill="#b7dee2" />
    <path d="M-17-174h9v4h-9Zm25 0h9v4H8Z" fill="#85d6da" /><path d="M-12-5h24v5h-24Z" fill="#6d929b" />
  </g>
  <g id={`${prefix}-office-totem`}>
    <path d="M-17-181h34V0h-34Z" fill="#263f58" /><path d="M-13-177h26v141h-26Z" fill="#709fae" /><path d="M-10-169h20v109h-20Z" fill="#183c53" />
    <path d="M-7-162H7v5H-7Zm0 17H7v5H-7Zm0 17H7v5H-7Zm0 17H7v5H-7Zm0 17H7v5H-7ZM-12-34h24v5h-24Z" fill="#8bdfde" />
    <path d="M-27-7h54v7h-54Z" fill="#b5c8cc" /><text y="-41" textAnchor="middle" fontSize="9" fontFamily="Knopik Pixel, monospace" fill="#e3f3d8">ГОУ ТЕХ</text>
  </g>
  <g id={`${prefix}-office-plaza`}>
    <path d="M-99-6h198v10H-99Z" fill="#b6c9c8" /><path d="M-91-6h182v3H-91Z" fill="#eff0d7" />
    <path d="M-47-20h94v14h-94Z" fill="#527d90" /><path d="M-43-19h86v6h-86Z" fill="#94d7da" /><path d="M-34-17h68v2h-68Z" fill="#dcf3e5" />
    <path d="M-29-20v-38h15v-72h11v-34h15v34h15v72h15v38Z" fill="#2c617d" /><path d="M-12-58v-69h9v-32h9v33h7v68Z" fill="#85bdc9" /><path d="M-8-118h3v37h-3Zm13-28h3v69H5Z" fill="#e1f2df" />
    <path d="M-91-30h35v19h-35Zm147 0h35v19H56Z" fill="#47696f" /><path d="M-95-34h43v5h-43Zm147 0h43v5H52Z" fill="#c1d2c3" />
    <path d="M-86-46h23v13h-23Zm147 0h23v13H61Z" fill="#5e987f" /><path d="M-81-45h14v4h-14Zm146 0h14v4H65Z" fill="#b0c99b" />
  </g>
  <g id={`${prefix}-office-link`}>
    <path d="M-230-297h460v53h-460Z" fill="#304d62" /><path d="M-224-291h448v40h-448Z" fill="#7fadb7" />
    <path d="M-215-285h430v27h-430Z" fill="#b5d5d4" /><path d="M-220-297h440v6h-440Zm0 49h440v6h-440Z" fill="#e0e2cf" />
    {[-188,-141,-94,-47,0,47,94,141,188].map(x=><path key={x} d={`M${x}-291h4v40h-4Z`} fill="#4f7186" />)}
    <path d="M-22-281h44v6h-44Zm5 12h34v5h-34Z" fill="#376b7e" />
  </g>
  {[0,1,2].map(variant=><g key={`cherry-${variant}`} id={`${prefix}-cherry-tree-${variant}`}>
    <path d="M-10-185h20V0h-20Zm-21 35h19v11h-19Zm35-18h21v11H4Z" fill="#71504e" /><path d="M-7-169h4V-6h-4Zm10 13h17v4H3Z" fill="#b48475" />
    <path d="M-30-272h60v12h28v16h19v23h13v47H76v23H51v15H-51v-15h-25v-23h-14v-47h13v-23h19v-16h28Z" fill={variant===1?'#bd7e9b':'#c48c9f'} />
    <path d="M-24-259h50v13h29v18h16v27H49v18H18v12H-28v-17h-36v-33h19v-23h21Z" fill="#edb9ba" />
    <path d="M-19-251h21v7h-21Zm29 19h28v8H10Zm-55 20h19v7h-19Zm13 22h16v8h-16Zm47 13h19v6H15Zm39-23h13v6H54Z" fill="#ffe0cb" />
    <path d="M-44-235h3v8h-3Zm33-20h3v7h-3Zm52 51h3v7h-3Z" fill="#cf7796" />
  </g>)}
  <g id={`${prefix}-pond-reeds`}><path d="M-25 0h50v3h-50Z" fill="#285f7088" /><path d="M-12-56h3V0h-3Zm10-17h3V0h-3Zm12 23h3V0h-3Zm-31 32h4v18h-4Zm38-5h4v23h-4Z" fill="#65805b" /><path d="M-15-61h9v14h-9Zm10-19h9v17h-9Zm12 23h9v16H7Z" fill="#aa805c" /></g>
  {[0,1,2].map(variant=><g key={`office-arch-${variant}`} id={`${prefix}-office-arch-${variant}`}>
    <path d="M-36-103h8V0h-8Zm64 0h8V0h-8ZM-43-103h86v12h-86Zm5 22h76v19h-76Z" fill={variant===1?'#657a8c':'#798c92'} />
    <path d="M-31-97h3V-4h-3Zm62 0h3V-4h-3ZM-39-98h78v3h-78Zm4 22h70v3h-70Z" fill="#c6d8d0" />
    <path d="M-30-70h14v4h-14Zm20 0H5v4h-15Zm21 0h18v4H11Z" fill={variant===2?'#d2a96c':'#8fcaca'} />
  </g>)}
  {[0,1,2].map(variant=><g key={`office-low-${variant}`} id={`${prefix}-office-low-${variant}`}>
    <path d="M-42-2h84v5h-84Z" fill="#26364a66" />
    {variant===0?<><path d="M-34-50h12V0h-12Zm56 0h12V0H22ZM-24-34h48v9h-48Z" fill="#647e8c" /><path d="M-31-47h4V-3h-4Zm56 0h4V-3h-4ZM-22-31h44v3h-44Z" fill="#c7d9d0" /></>:variant===1?<><path d="M-40-27h80v27h-80Z" fill="#697f87" /><path d="M-42-31h84v5h-84Z" fill="#c5d1bf" /><path d="M-31-46h18v14h-18Zm23-7h21v21H-8Zm27 9h16v12H19Z" fill="#709479" /><path d="M-25-44h10v4h-10Zm22-7H8v5H-3Z" fill="#b4c59a" /></>:<><path d="M-37-47h74v34h-74Zm7 34h7V0h-7Zm53 0h7V0h-7Z" fill="#758996" /><path d="M-33-43h66v7h-66Zm0 17h66v7h-66Z" fill="#d6d8bd" /><path d="M-31-42h10v5h-10Zm22 0h10v5H-9Zm22 0h10v5H13Z" fill="#b18c71" /></>}
  </g>)}
  <g id={`${prefix}-office-cargo`}><path d="M-31-102h62v102h-62Z" fill="#45647b" /><path d="M-27-98h54v58h-54Z" fill="#92bdc3" /><path d="M-21-91h42v31h-42Z" fill="#2f5968" /><path d="M-11-84h22v6h-22Zm0 12h14v5h-14Z" fill="#b5ddc8" /><path d="M-27-33h36v23h-36Z" fill="#8caeac" /><path d="M15-38h9v27h-9Zm0 22h-9v7h18Z" fill="#d9cfad" /><path d="M-24-103h48v5h-48Z" fill="#c6d8cb" /></g>
  {[0,1,2,3].map(frame=><g id={`${prefix}-china-sahur-${frame}`} key={`china-sahur-${frame}`}><use href={`#${prefix}-sahur-${frame}`} /><path d="M-14-95h6v-5H8v5h6v8h-28Z" fill="#a84943" /><path d="M-11-89h22v3h-22Zm9-8h4v4h-4Z" fill="#eec887" /></g>)}
  {[0,1,2].map(variant => <g key={`china-low-${variant}`} id={`${prefix}-china-low-${variant}`}>
    <path d="M-43-4h86v5h-86Z" fill="#2c313855" />
    <path d="M-35-52h8V0h-8Zm62 0h8V0h-8ZM-43-44h86v13h-86Zm6 21h74v9h-74Z" fill={variant === 2 ? '#638360' : '#9d484b'} />
    <path d="M-32-51h3v48h-3Zm62 0h3v48h-3ZM-41-42h82v3h-82Zm6 22h70v3h-70Z" fill="#edc17c" />
    {variant === 0 ? <path d="M-14-39h28v5h-28Zm5 5h18v14h-18Zm-4 14h26v4h-26Z" fill="#d67157" /> : variant === 1 ? <path d="M-28-42h10v11h-10Zm23 0H5v11H-5Zm23 0h10v11H18Z" fill="#edc17c" /> : <path d="M-22-43h4v29h-4Zm13 0h4v29h-4Zm14 0h4v29H5Zm13 0h4v29h-4Z" fill="#a3b87a" />}
  </g>)}
  {[0,1,2].map(variant => <g key={`china-arch-${variant}`} id={`${prefix}-china-arch-${variant}`}>
    <path d="M-36-103h10V0h-10Zm62 0h10V0H26Z" fill="#9e444b" /><path d="M-32-100h3v97h-3Zm61 0h3v97h-3Z" fill="#e9986c" />
    <path d="M-48-109h10v-8h8v8h60v-8h8v8h10v9h-96Z" fill="#395c59" /><path d="M-41-99h82v11h-82Z" fill="#e2b76d" />
    <path d="M-40-85h80v22h-80Z" fill={variant === 1 ? '#bc7451' : '#a34c50'} /><path d="M-36-81h72v3h-72Zm0 15h72v3h-72Z" fill="#edbd71" />
    {[-22,22].map(x => <g key={x}><path d={`M${x-2}-91h4v11h-4Zm-8 11h20v17h-20Zm4 17h12v4h-12Zm4 4h4v7h-4Z`} fill="#cb5b4b" /><path d={`M${x-3}-77h6v10h-6Z`} fill="#ffcc80" /></g>)}
  </g>)}
  <g id={`${prefix}-china-cart`}>
    <path d="M-39-5h78v6h-78Z" fill="#29303c66" /><path d="M-31-100h62v94h-62Z" fill="#a25c47" /><path d="M-28-96h56v88h-56Z" fill="#d5975b" />
    <path d="M-35-99h70v8h-70Zm4 24h62v6h-62Zm0 24h62v6h-62Zm0 24h62v6h-62Z" fill="#efd093" /><path d="M-24-88h5v15h-5Zm38 0h5v15h-5Zm-22 23h5v15h-5Zm-8 24h5v14h-5Z" fill="#875742" />
    <path d="M-16-92h32v24h-32Z" fill="#9d4349" /><path d="M-7-88H7v4H-7Zm-3 7h20v4h-20Zm7-7h6v18h-6Z" fill="#efc477" />
  </g>
  {[0,1].map(variant => <g key={`china-stall-${variant}`} id={`${prefix}-china-stall-${variant}`}>
    <path d="M-43-99h10v-7h8v7h50v-7h8v7h10v10h-86Z" fill="#456d64" /><path d="M-37-88h74v7h-74Zm7 7h6V0h-6Zm48 0h6V0h-6Z" fill="#af5649" /><path d="M-34-34h68v30h-68Z" fill="#b87c4d" /><path d="M-38-38h76v8h-76Z" fill="#eac78b" />
    {[-20,0,20].map(x => <g key={x}><path d={`M${x-6}-52h12v12h-12Z`} fill={variant ? '#e3d0ab' : '#718d5b'} /><path d={`M${x-4}-73h8v21h-8Z`} fill="#d1694e" /><path d={`M${x-2}-70h4v10h-4Z`} fill="#f3c776" /></g>)}
  </g>)}
  {[0,1,2].map(variant => <g key={`park-tree-${variant}`} id={`${prefix}-park-tree-${variant}`}>
    <path d="M-9-161H9V0H-9Zm-20 69h14v9h-14Zm34-26h17v9H5Z" fill="#775843" /><path d="M-7-142h4V-7h-4Zm-9 53h13v4h-13Z" fill="#b58b58" />
    <path d={variant===1 ? 'M-12-276h24v16h13v22h13v20h13v20h14v21h-14v22h20v21h-21v17H-50v-17h-21v-21h20v-22h-14v-21h14v-20h13v-20h13v-22h13Z' : variant===2 ? 'M-48-245h96v13h23v28h17v50H72v25H45v11H-45v-11h-27v-25h-16v-50h17v-28h23Z' : 'M-27-265h54v12h28v20h17v36h12v44H68v25H38v14H-38v-14h-30v-25h-16v-44h12v-36h17v-20h28Z'} fill={variant===1?'#345b52':'#3e704f'} />
    <path d="M-20-243h41v12h23v18h14v31H25v10H-8v-13h-40v-31h16v-16h12Z" fill="#6b9b61" /><path d="M-14-232h26v6h-26Zm-27 30h14v7h-14Zm38 18h22v8H-3Zm44 26h12v6H41Z" fill="#a6bd70" />
    {variant===2&&<path d="M-29-211h7v8h-7Zm45 16h8v7h-8Zm-2 42h7v7h-7Z" fill="#d99b68" />}
  </g>)}
  {[0,1,2].map(variant => <g key={`park-arch-${variant}`} id={`${prefix}-park-arch-${variant}`}>
    <path d="M-36-104h8V0h-8Zm64 0h8V0h-8Z" fill="#786448" /><path d="M-43-105h86v13h-86Zm5 20h76v22h-76Z" fill="#57754a" />
    <path d="M-31-101h3v97h-3Zm62 0h3v97h-3Z" fill="#c6ac74" /><path d="M-38-110h14v-7h15v8h22v-7h16v8h11v18h-14v8H9v-6h-21v7h-19v-7h-7Z" fill="#73915b" />
    <path d="M-30-103h14v4h-14Zm24-4H8v4H-6Zm25 7h14v4H19Zm-52 26h20v4h-20Zm35-2h22v4H2Z" fill="#a9bc75" />
    {variant===1&&<path d="M-26-97h6v7h-6Zm19-9h7v7h-7Zm29 7h6v7h-6Z" fill="#e2ab9a" />}
    {variant===2&&<path d="M-31-73h62v5h-62Z" fill="#bb995f" />}
  </g>)}
</>; }
