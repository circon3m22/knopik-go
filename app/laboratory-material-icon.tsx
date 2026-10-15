import {LAB_MATERIALS,type LabMaterial} from "./laboratory-engine";
export function LindenLeafSprite(){return <g data-linden-leaf="" shapeRendering="crispEdges">
 <path d="M6 3h5v3h2V5h3V3h4v3h2v6h-2v4h-3v3h-4v2h-2v-2H8v-2H5v-3H2V8h2V5h2Z" fill="#304a36"/>
 <path d="M7 5h4v4h3V7h2V5h3v3h1v3h-2v4h-3v3h-3v2h-2v-3H7v-3H5V9h2Z" fill="#7eaf6e"/>
 <path d="M8 7h2v4h3V9h3v2h-3v4h-3v2H8v-3H6v-4h2Z" fill="#b5d88d"/>
 <path d="M11 16h2v5h-2Zm2-4h2v4h-2Zm2-3h2v3h-2Zm-6 4h3v2H9Z" fill="#375d41"/>
 <path d="M12 20h2v4h-2Zm-6-9h4v1H6Zm9 2h4v1h-4Z" fill="#e8eeaf"/>
</g>}
export function LaboratoryMaterialIcon({kind}:{kind:LabMaterial}) {const color=LAB_MATERIALS[kind].color;return <svg viewBox="0 0 24 24" aria-hidden="true" shapeRendering="crispEdges">{kind==="leaf"?<LindenLeafSprite/>:kind==="citrus"?<><path d="M6 3h12v3h3v12h-3v3H6v-3H3V6h3Z" fill="#947047"/><path d="M7 5h10v3h3v9h-3v3H7v-3H5V8h2Z" fill={color}/><path d="M9 8h6v3h3v4h-3v3H9v-3H7v-4h2Z" fill="#f4e2a0"/><path d="M11 9h2v8h-2Zm-3 3h9v2H8Z" fill={color}/></>:kind==="pearl"?<><path d="M8 1h8v5h4v12h-4v5H8v-5H4V6h4Z" fill="#385667"/><path d="M9 3h6v5h3v9h-3v4H9v-4H6V8h3Z" fill={color}/><path d="M9 5h3v13H9Z" fill="#e3fff0"/><path d="M15 9h2v7h-2Z" fill="#5ea7b7"/></>:<><path d="M12 1h8v7h-5v3h5v5h-6v7H5v-7h4v-5H5V6h7Z" fill="#514764"/><path d="M14 3h4v3h-5v7h5v1h-6v7H8v-3h3v-9H8V8h6Z" fill={color}/><path d="M13 6h2v4h-2Zm-2 8h2v4h-2Z" fill="#f5e9c8"/></>}</svg>;}
