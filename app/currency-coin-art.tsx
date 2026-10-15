/** A shared minted pixel coin: bevel, inset face, stamped letter and a thick rim. */
export function CurrencyCoinArt({currency,className=""}:{currency:"kc"|"aura";className?:string}) {
 const p=currency==="kc"
  ? {edge:"#563523",side:"#855022",rim:"#d39334",light:"#ffe9a5",face:"#efbc53",inset:"#b47829",stamp:"#fff1b0",shadow:"#855125"}
  : {edge:"#30213f",side:"#503164",rim:"#9662c7",light:"#e9cdff",face:"#b68ada",inset:"#6d438f",stamp:"#f4e4ff",shadow:"#54316e"};
 const letter=currency==="kc"?"M10 8h3v6h2v-3h3V8h4v4h-3v3h-3v2h3v3h3v3h-4v-3h-3v-3h-2v6h-3Z":"M13 8h6v3h3v12h-4v-5h-4v5h-4V11h3Zm1 5v2h4v-2Z";
 return <svg className={`pixel-art currency-coin currency-coin-${currency} ${className}`} viewBox="0 0 32 32" shapeRendering="crispEdges" role="img" aria-label={currency==="kc"?"Кнопик Коин":"AURA"}>
  <path d="M9 2h14v2h4v4h3v4h2v10h-2v4h-3v3h-4v2H9v-2H5v-3H2v-4H0V12h2V8h3V4h4Z" fill={p.edge}/>
  <path d="M9 5h14v2h4v4h3v10h-2v4h-3v3h-4v2H9v-2H5v-4H2V12h3V8h4Z" fill={p.side}/>
  <path d="M9 1h13v2h4v4h3v4h2v9h-2v4h-3v3h-4v2H9v-2H5v-4H2v-4H0v-9h2V6h3V3h4Z" fill={p.rim}/>
  <path d="M9 2h13v2h4v4h3v10h-2V9h-3V6h-4V4H9v2H6v3H4v10H2V10h2V7h3V4h2Z" fill={p.light}/>
  <path d="M10 5h11v2h3v3h2v10h-2v3h-3v2H10v-2H7v-3H5V10h2V7h3Z" fill={p.inset}/>
  <path d="M11 6h9v2h3v3h2v8h-2v3h-3v2h-9v-2H8v-3H6v-8h2V8h3Z" fill={p.face}/>
  <path d="M10 6h10v2H10Zm-4 5h2v8H6Zm5 17h10v1H11Z" fill={p.light}/>
  <path data-coin-letter={currency} d={letter} fillRule="evenodd" transform="translate(1 1)" fill={p.shadow}/>
  <path d={letter} fillRule="evenodd" fill={p.stamp}/>
  <path d="M9 2h5v2H9ZM3 8h2v5H3Zm20 18h3v1h-3Z" fill={currency==="kc"?"#fff8d6":"#fff1ff"}/>
  <path d="M5 25h2v3H5Zm4 4h2v2H9Zm12 0h2v2h-2Zm5-4h2v3h-2Z" fill={p.rim}/>
 </svg>;
}
