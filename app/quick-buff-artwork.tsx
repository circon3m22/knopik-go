export function QuickBuffArtwork({ kind }: { kind: "food" | "zhivchik" | "pepsi" | "heal" }) {
  return <svg className="pixel-art pixel-potion quick-buff-art" viewBox="0 0 64 76" shapeRendering="crispEdges" aria-hidden="true">
    <path d="M10 65h44v4H10Z" fill="#34304122"/>
    {kind === "food" ? <g>
      <path d="M12 28h9v-7h10v5h12v-5h10v9h5v11H8V30h4Z" fill="#775442"/>
      <path d="M13 30h10v7H13Zm13-5h7v9h-7Zm12 4h9v7h-9Zm10-5h7v9h-7Z" fill="#ae8060"/><path d="M15 31h4v2h-4Zm13-3h3v3h-3Zm13 2h4v3h-4Z" fill="#d1aa7a"/>
      <path d="M5 36h54v8h-4v17h-5v5H14v-5H9V44H5Z" fill="#343041"/><path d="M8 39h48v4h-4v16h-4v4H16v-4h-4V43H8Z" fill="#b76253"/><path d="M12 43h40v4H12Z" fill="#d97b70"/>
      <path d="M28 49h8v4h5v5H23v-5h5Z" fill="#fff1d1"/><path d="M21 48h4v4h-4Zm17 0h4v4h-4Zm-12-3h4v4h-4Zm8 0h4v4h-4Z" fill="#fff1d1"/>
    </g> : kind === "zhivchik" ? <g>
      <path d="M30 12h4v7h-4Z" fill="#775442"/><path d="M34 12h12v5H34v5h-5V12Z" fill="#537d75"/>
      <path d="M17 22h12v4h6v-4h12v4h7v8h4v18h-5v8h-7v5H18v-5h-7v-8H7V34h4v-8h6Z" fill="#343041"/>
      <path d="M18 25h9v4h10v-4h9v4h5v8h4v13h-5v8h-6v4H20v-4h-6v-8h-4V37h4v-8h4Z" fill="#88a980"/><path d="M18 28h9v4h-7v5h-4v8h-4v-8h4v-5h2Z" fill="#cfdfba"/>
      <path d="M34 31h10l-8 12h8L27 59l5-13h-8Z" fill="#f4d889"/><path d="M37 33h4l-9 12h-4Z" fill="#fff1d1"/>
    </g> : kind === "heal" ? <g>
      <path d="M23 6h18v14h-3v6h9v6h7v28h-5v6H15v-6h-5V32h7v-6h9v-6h-3Z" fill="#343041"/>
      <path d="M26 8h12v10H26Z" fill="#775442"/><path d="M26 8h12v3H26Z" fill="#d1aa7a"/>
      <path d="M29 20h6v9h10v6h6v23h-5v5H18v-5h-5V35h6v-6h10Z" fill="#c7d6ce"/>
      <path d="M16 39h32v18h-5v4H21v-4h-5Z" fill="#b76253"/><path d="M16 37h32v13H16Z" fill="#d97b70"/>
      <path d="M18 34h27v4H18v15h-3V38h3Z" fill="#fff1d1"/>
      <path d="M23 39h18v3h4v14h-4v4H23v-4h-4V42h4Z" fill="#fff1d1"/>
      <path d="M23 43h6v3h6v-3h6v9h-3v3h-3v3h-6v-3h-3v-3h-3Z" fill="#b76253"/>
      <path d="M24 44h4v3h-4Z" fill="#e99b8e"/><path d="M30 23h2v5h-2ZM45 34h3v4h-3Z" fill="#fff1d1"/>
    </g> : <g>
      <path d="M16 14h32v5h4v42h-4v5H16v-5h-4V19h4Z" fill="#343041"/><path d="M18 17h28v5h3v36h-3v5H18v-5h-3V22h3Z" fill="#587f9c"/>
      <path d="M18 17h28v5H18Zm0 42h28v4H18Z" fill="#c7d6ce"/><path d="M22 18h15v2H22Z" fill="#746875"/><path d="M18 23h4v34h-4Z" fill="#88b6b0"/>
      <path d="M22 30h20v5h4v12h-4v5H22v-5h-4V35h4Z" fill="#fff1d1"/><path d="M22 31h19v4h4v6H20v-6h2Z" fill="#b76253"/><path d="M21 43h23v4h-4v4H24v-4h-3Z" fill="#537d75"/>
      <path d="M37 46h16v15h-4v5h-8v-5h-4Z" fill="#343041"/><path d="M39 48h12v11h-3v4h-6v-4h-3Z" fill="#f4d889"/><path d="M42 49h3v10h-3Z" fill="#fff1d1"/>
    </g>}
  </svg>;
}
