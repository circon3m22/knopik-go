export type RunnerBuffKind="shield"|"zhivchik"|"magnet"|"flight"|"speed";
export function RunnerBuffIcon({kind}:{kind:RunnerBuffKind}) {
  return <svg viewBox="0 0 32 32" className="pixel-art" aria-hidden="true">
    {kind==="shield"?<>
      <path d="M15 3h2v2h5v2h6v13h-3v4h-4v3h-4v2h-2v-2h-4v-3H7v-4H4V7h6V5h5Z" fill="#182d40"/>
      <path d="M15 5h2v2h5v2h4v10h-3v4h-4v3h-6v-3H9v-4H6V9h4V7h5Z" fill="#e9cd83"/>
      <path d="M15 8h2v2h6v8h-3v4h-4v2h-1v-2h-3v-4H9v-8h6Z" fill="#70a9bf"/>
      <path d="M15 8h2v15h-2v-2h-3v-4h-2v-6h5Z" fill="#b5dedb"/>
      <path d="M12 12h3v3h6v3h-6v-3h-3Z" fill="#f7efd0"/><path d="M23 3h2V1h2v2h2v2h-2v2h-2V5h-2Z" fill="#fff0b5"/>
    </>:kind==="zhivchik"?<>
      <path d="M11 2h10v7h2v3h3v17H6V12h3V9h2Z" fill="#183f3c"/>
      <path d="M12 3h8v4h-8Z" fill="#ecc67b"/><path d="M12 7h8v4h2v3h2v13H8V14h2v-3h2Z" fill="#75b65f"/>
      <path d="M10 14h12v10H10Z" fill="#e8da85"/><path d="M14 15h4v2h2v4h-2v2h-4v-2h-2v-4h2Z" fill="#639657"/>
      <path d="M16 14h2v-2h3v2h-3v2h-2Z" fill="#304f3e"/><path d="M10 11h2v3h-2Zm-1 4h2v8H9Zm4 11h8v2h-8Z" fill="#c3e99a"/>
      <path d="M25 6h2V4h2v2h2v2h-2v2h-2V8h-2Z" fill="#fff0b5"/>
    </>:kind==="magnet"?<>
      <path d="M5 5h9v13h4V5h9v17h-3v4h-4v3h-8v-3H8v-4H5Z" fill="#223449"/>
      <path d="M7 6h5v14h8V6h5v15h-3v3h-4v3h-4v-3h-4v-3H7Z" fill="#e3787d"/>
      <path d="M7 6h5v7H7Zm13 0h5v7h-5Z" fill="#d0e4da"/><path d="M8 6h2v6H8Zm13 0h2v6h-2ZM12 22h8v2h-8Z" fill="#fff1cf"/>
      <path d="M1 14h3v2H1Zm27 0h3v2h-3ZM15 1h2v4h-2Z" fill="#9ce0d1"/>
    </>:kind==="flight"?<>
      <path d="M14 2h4v3h4v5h3v15h-6v-4h-6v4H7V10h3V5h4Z" fill="#433145"/>
      <path d="M14 4h4v3h3v12H11V7h3Z" fill="#ec927c"/><path d="M14 9h4v5h-4Z" fill="#bce3d6"/>
      <path d="M12 22h8v4h-2v4h-4v-4h-2Z" fill="#ffd787"/><path d="M15 22h2v7h-2ZM8 17h3v6H8Zm13 0h3v6h-3Z" fill="#f1c284"/>
    </>:<><path d="M17 2h10l-8 10h6L12 30l3-12H7Z" fill="#30454c"/><path d="M18 4h5l-8 10h6L14 24l3-9h-7Z" fill="#ffe19c"/><path d="M19 4h3l-8 10h3l-4 3h-2Z" fill="#fff2cf"/></>}
  </svg>;
}
