/** Four fixed armor segments leave the portrait clear; only their energy cells shimmer. */
export function TapPixelShield(){
 return <svg className="pixel-shield-border" viewBox="0 0 128 128" shapeRendering="crispEdges" aria-hidden="true">
  {[0,90,180,270].map(angle=><g className="shield-panel" key={angle} transform={`rotate(${angle} 64 64)`}>
   <path fill="#293c50" d="M60 2H40v4H24v8H14v10H6v16H2v20h10V42h4V28h8v-8h6v-6h14v-2h16Z"/>
   <path fill="#46778a" d="M58 5H41v4H27v8H17v10H9v14H5v17h4V41h4V27h8v-6h6v-8h14V9h17Z"/>
   <path fill="#a2d7d1" d="M42 6h16v2H42Zm-14 4h12v2H28Zm-10 8h8v2h-8Zm-8 10h2v12h-2ZM6 42h2v16H6Z"/>
   <path fill="#293c50" d="M27 10h14v8H31v6h-7v7h-8V17h11Z"/>
   <path className="shield-pixel-body" fill="#4ca7b5" d="M28 13h10v3h-9v6h-7v6h-3V19h9Z"/>
   <path className="shield-pixel-glint" fill="#d9fff0" d="M29 13h8v2h-8Zm-8 7h5v2h-3v5h-2Z"/>
   <path fill="#c1cbb6" d="M42 3h3v3h-3ZM3 42h3v3H3Z"/>
   <path fill="#293c50" d="M62 2h4v8h-4Z"/>
   <path className="shield-pixel-glint" fill="#8fdfcc" d="M63 3h2v5h-2Z"/>
  </g>)}
  <g className="shield-emblem">
   <path fill="#293c50" d="M58 112h12v3h3v8h-3v3h-3v2h-6v-2h-3v-3h-3v-8h3Z"/>
   <path fill="#87c9c0" d="M59 115h10v2h2v5h-3v3h-3v1h-2v-1h-3v-3h-3v-5h2Z"/>
   <path fill="#e4f4d9" d="M60 116h8v2h-8Z"/>
   <path fill="#315d72" d="M61 119h2v3h2v-3h2v4h-2v1h-2v-1h-2Z"/>
  </g>
 </svg>;
}
