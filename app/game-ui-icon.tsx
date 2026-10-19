import {KnopikPawArt} from "./knopik-paw-art";
import type {KnopikSkin} from "./knopik-skins";
export function GameUiIcon({ kind,skin }: { skin?:KnopikSkin;kind: "street" | "basement" | "bar" | "pause" | "map" | "goal" | "journal" | "interact" }) {
  if(kind==="interact")return <svg viewBox="0 0 32 32" aria-hidden="true" shapeRendering="crispEdges"><KnopikPawArt skin={skin}/></svg>;
  if(kind==="pause"||kind==="map")return <svg viewBox="0 0 32 32" aria-hidden="true" shapeRendering="crispEdges" data-world-hud-icon={kind}>
    {kind==="pause"?<>
      <path fill="#162c36" d="M8 3h4v2h2v22h-2v2H8v-2H6V5h2Zm12 0h4v2h2v22h-2v2h-4v-2h-2V5h2Z"/>
      <path fill="#fffdf1" d="M8 5h4v22H8Zm12 0h4v22h-4Z"/>
      <path fill="#c4d2d0" d="M10 7h2v18h-2Zm12 0h2v18h-2Z"/>
    </>:<>
      <path fill="#162c36" d="M4 3h7v2h10V3h7v2h2v22h-2v2h-7v-2H11v2H4v-2H2V5h2Z"/>
      <path fill="#fffdf1" d="M4 5h5v22H4Zm7 2h10v18H11ZM23 5h5v22h-5Z"/>
      <path fill="#c4d2d0" d="M9 5h2v22H9Zm12 0h2v22h-2Z"/>
      <path fill="#162c36" d="M15 11h2v7h-2Zm0 9h2v2h-2Z"/>
    </>}
  </svg>;
  const paths = {
    street: "M3 10h6V4h12v20H9v-6H3v-3h11l-4 4h4l7-7-7-7h-4l4 4H3Zm21-6h4v20h-4Z",
    basement: "M3 5h26v4H3Zm0 7h6v5h7v5h7v5h6v3H19v-5h-7v-5H5v-5H3Zm16 0h10v4H19Zm5 7h5v3h-5Z",
    bar: "M7 2h7v7h-2v3h4v16H5V12h4V9H7Zm11 12h11v4h-2v5h-3v5h-3v-5h-3v-5Zm2 2v4h5v-4Z",
    goal: "M6 3h3v26H6Zm5 1h16v4h-4v4h4v4H11Zm1 2v8h9v-3h-3V8h3V6Z",
    journal: "M4 4h24v24H4Zm4 4v16h4V8Zm7 0v3h9V8Zm0 6v3h9v-3Zm0 6v3h7v-3Z",
  };
  return <svg viewBox="0 0 32 32" aria-hidden="true" shapeRendering="crispEdges"><path d={paths[kind]} fill="currentColor"/></svg>;
}
