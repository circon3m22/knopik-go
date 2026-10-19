/** Pixel status symbols stay legible without relying on a font's glyph coverage. */
export function DungeonStatusIcon({state}:{state:'locked'|'next'|'done'}){
 const path=state==='locked'?'M5 1h6v2H5ZM3 3h2v5H3Zm8 0h2v5h-2ZM1 8h14v7H1Zm6 2v3h2v-3Z':state==='done'?'M1 7h3v3h3V7h3V4h3V1h3v6h-3v3h-3v3H7v3H4v-3H1Z':'M8 1h3v3h3v3h2v3h-2v3h-3v3H8v-3h3v-3H0V7h11V4H8Z';
 return <svg data-dungeon-status={state} viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" shapeRendering="crispEdges"><path d={path} fill="currentColor" fillRule="evenodd"/></svg>;
}
