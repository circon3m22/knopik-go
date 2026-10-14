import type { StreetPalette } from "./neighborhood-props";
/** Articulated pixel people; each limb is animated independently by travelled distance. */
export function AnimatedNeighborhoodResident({variant=0,p}:{variant?:number;p:StreetPalette}){
  const clothes=["#537d75","#b78277","#8999aa","#b1a16f","#668b9b","#a28398"][variant%6],skin=p.night?"#b6a28e":"#e4c394",hair=variant===2?"#b0b9ae":variant===5?"#975f54":p.wood;
  return <g data-resident-pose="">
    <ellipse rx="20" ry="6" fill={p.shadow} opacity=".4"/>
    <g data-resident-leg="left" transform="translate(-7 -13)"><path d="M-5 0h9v15h-9Z" fill={p.wood}/><path d="M-5 2h3v10h-3Z" fill={p.metal}/><path d="M-7 12H5v6H-7Z" fill={p.ink}/><path d="M-5 13h9v2h-9Z" fill={p.trim}/></g>
    <g data-resident-leg="right" transform="translate(7 -13)"><path d="M-4 0h9v15h-9Z" fill={p.wood}/><path d="M-4 2h3v10h-3Z" fill={p.metal}/><path d="M-5 12H7v6H-5Z" fill={p.ink}/><path d="M-3 13h9v2h-9Z" fill={p.trim}/></g>
    <g data-resident-arm="left" transform="translate(-15 -36)"><path d="M-6 0h9v24h-9Z" fill={p.ink}/><path d="M-4 2h6v14h-6Z" fill={clothes}/><path d="M-5 17h8v8h-8Z" fill={skin}/><path d="M-5 23h3v2h-3Z" fill={p.trim}/>{variant===1&&<g transform="translate(-7 23)"><path d="M-9-2H9v16H-9Z" fill={p.wood}/><path d="M-5-6H5v7H-5Z" fill="none" stroke={p.trim} strokeWidth="2"/><path d="M-6 2H6v9H-6Z" fill={clothes}/></g>}</g>
    <g data-resident-torso=""><path d="M-14-38h28v27h-28Z" fill={p.ink}/><path d="M-11-35h22v21h-22Z" fill={clothes}/><path data-resident-buttons="" d="M-1-33h2v3h-2Zm0 7h2v3h-2Zm0 7h2v3h-2Z" fill={p.trim}/><path d="M-9-35h18v3H-9Z" fill={p.trim} opacity=".45"/>{variant===4&&<><path d="M-13-34h2v18h-2Zm24 0h2v18h-2Z" fill={p.roof}/><path d="M-9-26H9v12H-9Z" fill={p.ink}/><path d="M-3-23h7v7h-7Z" fill={p.waterLight}/></>}</g>
    <g data-resident-head="">
      <g data-resident-view="front"><path d="M-14-73h28v6h5v21h-6v7H-13v-7h-6v-21h5Z" fill={p.ink}/><path d="M-11-67h22v23h-22Z" fill={skin}/><path d="M-8-73H8v3h9v10H-17v-10h9Z" fill={hair}/><path data-resident-eyes="" d="M-7-58h3v4h-3Zm11 0h3v4H4Z" fill={p.ink}/><path d="M-3-51h6v2h-6Zm-2 7h4v2h-4Z" fill={p.wood}/></g>
      <g data-resident-view="back" display="none"><path d="M-14-73h28v6h5v22h-6v7H-13v-7h-6v-22h5Z" fill={p.ink}/><path d="M-11-66h22v23h-22Z" fill={hair}/><path d="M-13-68h26v4h-26Z" fill={p.trim} opacity=".35"/><path d="M-8-43H8v4H-8Z" fill={skin}/></g>
      <g data-resident-view="side" display="none"><path d="M-13-73h25v6h4v12h6v7h-6v8H-9v-5h-8v-22h4Z" fill={p.ink}/><path d="M-8-68h17v14h9v4h-9v7H-8Z" fill={skin}/><path d="M-11-71h22v7H0v14H-13v-14h2Z" fill={hair}/><path d="M7-59h3v4H7Z" fill={p.ink}/><path d="M9-47h5v2H9Z" fill={p.wood}/></g>
      {variant===3&&<><path d="M-17-74h34v7h-34Z" fill={p.metal}/><path d="M-10-78h20v5h-20Z" fill={clothes}/><path d="M-1-75h3v3h-3Z" fill={p.trim}/></>}
      {variant===5&&<><path d="M-19-65h5v27h-5Zm33 0h5v27h-5Z" fill={hair}/><path d="M-19-40h5v3h-5Zm33 0h5v3h-5Z" fill={p.roof}/></>}
    </g>
    <g data-resident-arm="right" transform="translate(15 -36)"><path d="M-3 0h9v24h-9Z" fill={p.ink}/><path d="M-1 2h6v14h-6Z" fill={clothes}/><path d="M-3 17h8v8h-8Z" fill={skin}/>{variant===3&&<path d="M4 24h16v5H4Zm12-3h7v11h-7Z" fill={p.metal}/>}</g>
  </g>;
}
