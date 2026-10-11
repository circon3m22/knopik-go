export function runnerFenceVariant(district: number, variant: number) { return district === 1 ? 4 + variant % 4 : variant % 4; }
export function runnerArchVariant(district: number, variant: number) { return district === 1 ? 4 + variant % 2 : district === 5 ? 6 : district === 3 ? 3 : district === 2 ? 1 : 1 + variant % 2; }
export function RunnerBarrierSprites({prefix}:{prefix:string}) { return <>
  {Array.from({length:8},(_,variant)=><g id={`${prefix}-fence-${variant}`} key={`f-${variant}`}>
    <path d="M-44-2h88v5h-88Z" fill="#26324955" />
    {variant===4 ? <use href={`#${prefix}-fence`} /> : variant===5 ? <>
      <path d="M-43-38h86v6h-86Zm0 21h86v6h-86Z" fill="#795a43" />
      {[-36,-18,0,18,36].map(x=><g key={x}><path d={`M${x-5}-48h3v-8h4v8h3V0h-10Z`} fill="#a67d50" /><path d={`M${x-3}-45h3V-3h-3Z`} fill="#e5c08a" /></g>)}
    </> : variant===6 ? <>
      <path d="M-41-31h5v-13h10v-9h16v-5H8v5h17v8h12v11h5v28h-84Z" fill="#355b49" />
      <path d="M-36-28h5v-12h12v-8h19v-5h8v7h15v10h12v11h3v16h-74Z" fill="#66946a" />
      <path d="M-27-36h12v4h-12Zm16-10H5v4h-16Zm25 8h12v5H14Zm-36 18h17v4h-17Zm25-5h15v4H3Z" fill="#a5c984" />
      <path d="M-42-8h84v8h-84Z" fill="#90734e" />
    </> : variant===7 ? <>
      <path d="M-40-30h80v27h-80Z" fill="#826752" /><path d="M-37-26h74v21h-74Z" fill="#be9870" /><path d="M-42-32h84v7h-84Z" fill="#e0bb86" />
      {[-24,0,24].map((x,i)=><g key={x}><path d={`M${x-8}-43h16v13h-16Zm4-12h8v17h-8Z`} fill="#538357" /><path d={`M${x-6}-54h12v9h-12Z`} fill={['#e0a1b3','#eed493','#afafd5'][i]} /><path d={`M${x-2}-51h4v4h-4Z`} fill="#ffe2a7" /></g>)}
    </> : variant===1 ? <>
      {[-26,0,26].map(x=><g key={x}><path d={`M${x-11}-6h22v6h-22Zm4-7h14v7h-14Zm3-22h8v22h-8Zm2-21h4v21h-4Z`} fill="#ba574b" /><path d={`M${x-4}-48h8v11h-8Zm-3 20h14v9h-14Z`} fill="#fff0d4" /><path d={`M${x-10}-6h20v3h-20Z`} fill="#4d4550" /></g>)}
    </> : variant===3 ? <>
      <path d="M-41-46h82v39h-82Z" fill="#954b4b" /><path d="M-38-43h76v33h-76Z" fill="#db7960" /><path d="M-37-42h74v5h-74Zm0 14h74v4h-74Z" fill="#f4b78a" />
      <path d="M-26-37h15v22h-15Zm37 0h15v22H11Z" fill="#fff0d2" /><path d="M-43-8h86v8h-86Z" fill="#6a5053" />
    </> : <>
      <path d="M-37-56h8v56h-8Zm66 0h8v56h-8Z" fill="#59626b" /><path d="M-33-53h3v49h-3Zm66 0h3v49h-3Z" fill="#c0c8c0" />
      <path d="M-43-47h86v22h-86Z" fill={variant===2?'#95564e':'#af5553'} /><path d="M-41-44h82v5h-82Z" fill="#f2a88a" />
      {[-36,-12,12].map(x=><path key={x} d={`M${x}-42h12v4h4v8h-12v-4h-4Z`} fill="#fff0d2" />)}
      <path d="M-43-26h86v3h-86Zm4 22h18v4h-18Zm60 0h18v4H21Z" fill="#4c5260" />
      {variant===2&&<path d="M-25-23h3v20h-3Zm12 0h3v20h-3Zm12 0h3v20h-3Zm12 0h3v20h-3Zm12 0h3v20h-3Z" fill="#8d9694" />}
    </>}
  </g>)}
  {Array.from({length:7},(_,variant)=><g id={`${prefix}-arch-${variant}`} key={`a-${variant}`}>
    {variant===0 ? <use href={`#${prefix}-arch`} /> : <>
      <path d="M-36-104h8V0h-8Zm64 0h8V0h-8Z" fill={variant>=4?'#715d49':'#455368'} />
      <path d="M-33-102h3V-3h-3Zm64 0h3V-3h-3Z" fill={variant>=4?'#c5a47c':'#a6b2b4'} />
      <path d="M-41-103h82v42h-82Z" fill={['#647b79','#647987','#af5553','#48435d','#9a715c','#47735c','#3e536d'][variant]} />
      <path d="M-38-100h76v5h-76Zm0 34h76v5h-76Z" fill={variant===3?'#b292da':variant===6?'#91dedc':'#d7c5a5'} />
      {variant===2 ? [-32,-8,16].map(x=><path key={x} d={`M${x}-92h12v5h5v14h-12v-5h-5Z`} fill="#fff0d2" />) : variant===4 ? [-32,-12,8,28].map(x=><path key={x} d={`M${x}-94h10v33h-10Z`} fill="#e5c3a3" />) : variant===5 ? <path d="M-36-93h14v10h-14Zm12 8h15v9h-15Zm21-10h13v11H-3Zm13 12h13v13H10Zm17-12h12v15H27Z" fill="#7fa977" /> : variant===6 ? <path d="M-35-91h70v6h-70Zm0 11h70v6h-70Z" fill="#88b8cd" /> : <path d="M-32-87h64v8h-64Z" fill={variant===3?'#90ded7':'#3b5066'} />}
      <path d="M-41-60h82v7h-82Z" fill={variant===3?'#e8a7c1':'#d1a76e'} />
      <path d="M-39-7h15v7h-15Zm63 0h15v7H24Z" fill="#40485a" />
    </>}
  </g>)}
</>; }
