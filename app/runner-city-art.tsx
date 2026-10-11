function Barrel({x=0,y=0}: {x?:number;y?:number}) {
  return <g transform={`translate(${x} ${y})`}><path d="M-16-44h32v4h4v36h-4v4h-32v-4h-4v-36h4Z" fill="#754940"/><path d="M-12-43h24v5h5v33H-12Z" fill="#b67e51"/><path d="M-20-34h40v5h-40Zm0 23h40v5h-40Z" fill="#9aa6a1"/><path d="M-11-39h4v10h-4Zm0 16h4v12h-4Z" fill="#e7ba7c"/><path d="M-12-45h24v4h-24Z" fill="#d3a46b"/></g>;
}
function Pedestrian({variant,frame}: {variant:number;frame:number}) {
  const shirt=["#cf826d","#7f9dba","#8d9d73","#b08ca4"][variant%4];
  return <><path d={`M-9-17h7v${frame?17:13}h-7Zm11 0h7v${frame?13:17}H2Z`} fill="#454b5c"/><path d="M-12-43h24v28h-24Z" fill={shirt}/><path d="M-7-57H7v4h4v13H7v4H-7v-4h-4v-13h4Z" fill="#d7b18b"/><path d="M-10-58h20v6h-20Z" fill="#5e4944"/><path d={`M-17-${frame?35:41}h5v17h-5Zm29 ${frame?0:6}h5v17h-5Z`} fill={shirt}/><path d="M-5-46H5v3H-5Z" fill="#a97869"/></>;
}
export function RunnerCitySprites({prefix}: {prefix:string}) {
  return <>
    <g id={`${prefix}-barrier-3`}><Barrel x={-19}/><Barrel x={19}/></g>
    <g id={`${prefix}-cargo-1`}><Barrel x={-18}/><Barrel x={18}/><Barrel y={-44}/></g>
    <g id={`${prefix}-dock-crane`}>
      <path d="M-9-140h18V0H-9Zm-45-144h96v9h-96Z" fill="#ad9265"/><path d="M-4-136h8V-5h-8Zm-37-6h76v4h-76Z" fill="#e4c797"/>
      <path d="M-39-135h3v45h-3Zm-2 44h7v9h-4v-4h-3Z" fill="#3d4f5a"/><path d="M-7-131h14v4H-7Zm0 24H7v4H-7Zm0 24H7v4H-7Zm0 24H7v4H-7Zm0 24H7v4H-7Z" fill="#536674"/>
      <path d="M-19-5h38v5h-38Z" fill="#526572"/>
    </g>
    <g id={`${prefix}-neon-sign`}>
      <path d="M-4-103h8V0H-4ZM-31-112h62v63h-62Z" fill="#384158"/><path d="M-28-109h56v57h-56Z" fill="#806889"/><path d="M-25-106h50v51h-50Z" fill="#30415a"/>
      <path d="M-19-98h8v5h-3v21h3v5h-8Zm30 0h8v31h-8v-5h3v-21h-3Z" fill="#e9a2b4"/><path d="M-3-94h6v5h6v6h-6v6h-6v-6h-6v-6h6Z" fill="#a1d5cf"/>
      <path d="M-12-4h24v4h-24Z" fill="#4f6277"/>
    </g>
    <g id={`${prefix}-bridge-pylon`}>
      <path d="M-14-312h28v16h6V0h-40v-296h6Z" fill="#718993"/><path d="M-9-310h18v13h5V-4H-14v-293h5Z" fill="#c4c8b8"/><path d="M-5-304h5v290h-5Z" fill="#eef0ce"/>
      <path d="M-17-292h34v7h-34Zm-3 101h40v7h-40Zm0 108h40v7h-40Z" fill="#516c7e"/>
      <path d="M-8-292h-5v24h-4v24h-4v24h-4v24h-4v24h-4v24h-4v24h-4v24h-4v24h-4v24h-4V-60h4v-23h4v-24h4v-24h4v-24h4v-24h4v-24h4v-24h4v-24h4v-24h4v-23h5Z" fill="#a9b6ac"/>
      <path d="M10-291h4v29h4v29h4v29h4v29h4v29h4v29h4v29h4v29h4v29h-4v-28h-4v-29h-4v-29h-4v-29h-4v-29h-4v-29h-4v-29h-4v-29h-4Z" fill="#a9b6ac"/>
      <path d="M-23-12h46V0h-46Z" fill="#526f7e"/>
    </g>
    <g id={`${prefix}-boat`}>
      <path d="M-43-18h86v6h-6v6h-8v6h-58v-6h-8v-6h-6Z" fill="#344d69"/><path d="M-39-18h78v5h-78Z" fill="#e0cfaa"/><path d="M-18-42h33v22h-33Z" fill="#e2ddc4"/><path d="M-15-38h26v10h-26Z" fill="#718f9a"/><path d="M-4-56h4v14h-4Z" fill="#526c80"/><path d="M-53 4h43v3h-43Zm62 0h42v3H9Z" fill="#b6d7ca"/>
    </g>
    {Array.from({length:8},(_,variant)=><g key={variant}>
      {[0,1].map(frame=><g key={frame} id={`${prefix}-pedestrian-${variant}-${frame}`}><Pedestrian variant={variant} frame={frame}/></g>)}
    </g>)}
  </>;
}
