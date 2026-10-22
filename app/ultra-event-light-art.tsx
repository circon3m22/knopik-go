/** Six recycled local light sources, shared by every campaign and the home. */
export function UltraEventLightArt({prefix}:{prefix:string}){
 return <g data-ultra-event-lights="layered-3" transform="scale(1 .82)" pointerEvents="none"><defs>
  {['#ffca86','#87e2ed','#9ee4bd'].map((color,i)=><radialGradient key={i} id={`${prefix}-event-${i}`}><stop stopColor="#fff3d3" stopOpacity=".65"/><stop offset=".18" stopColor={color} stopOpacity=".46"/><stop offset=".56" stopColor={color} stopOpacity=".16"/><stop offset="1" stopColor={color} stopOpacity="0"/></radialGradient>)}
 </defs>{Array.from({length:6},(_,i)=>{const clip=`${prefix}-event-clip-${i}`;return <g key={i} data-ultra-event-light={i} display="none" clipPath={`url(#${clip})`}>
  <defs><clipPath id={clip} clipPathUnits="userSpaceOnUse"><path data-ultra-event-clip=""/></clipPath></defs>
  <g data-ultra-event-body=""><ellipse data-ultra-event-halo="" data-light-warm={`url(#${prefix}-event-0)`} data-light-cold={`url(#${prefix}-event-1)`} data-light-heal={`url(#${prefix}-event-2)`} rx="96" ry="82"/><ellipse data-ultra-event-core="" rx="34" ry="14" fill="#fff0c5" opacity=".28"/></g>
 </g>;})}</g>;
}
