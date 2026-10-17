export type TeaTileState='closed'|'leaf'|'unpicked'|'mine'|'triggered';
export function TeaTileArtwork({state}:{state:TeaTileState}){
 const leaf=state==='leaf'||state==='unpicked',mine=state==='mine'||state==='triggered',triggered=state==='triggered';
 return <svg viewBox="0 0 48 48" shapeRendering="crispEdges" aria-hidden="true">
  <path d="M4 1h40v3h3v40h-3v3H4v-3H1V4h3Z" fill={triggered?'#ffb79d':'#162f2b'}/>
  <path d="M5 4h38v39H5Z" fill={mine?'#754852':leaf?'#49755a':'#36584e'}/>
  <path d="M5 4h38v4H5ZM5 8h4v31H5Z" fill={mine?'#d29694':leaf?'#bdd194':'#91ac8a'}/>
  <path d="M9 39h34v4H9Zm30-31h4v31h-4Z" fill={mine?'#4a333f':'#203e36'}/>
  <path d="M10 10h28v27H10Z" fill={mine?'#9c6270':leaf?'#719a6c':'#426b59'}/>
  {leaf?<><path d="M12 25v-9h5v-4h16v6h-3v9h-5v5H14v-7Z" fill={state==='leaf'?'#e1df9c':'#9bb881'}/><path d="M13 32h4v-4h5v-4h5v-5h4v-4" stroke="#3b6450" strokeWidth="3" fill="none"/><path d="M17 18v6m6-9v4m5 7h-5" stroke="#96af75" strokeWidth="2"/>{state==='leaf'&&<path d="M33 29h3v3h3v3h-3v3h-3v-3h-3v-3h3Z" fill="#fff0bd"/>}</>:mine?<><path d="M16 16h16v16H16Zm-5 6h26v5H11Zm11-11h5v26h-5Z" fill="#302f39"/><path d="M15 12h4v5h-4Zm15 1h4v4h-4Zm-17 18h5v5h-5Zm18-1h4v5h-4Z" fill="#302f39"/><path d="M19 18h7v4h-7Z" fill={triggered?'#ffe1a2':'#e1a7a1'}/><path d="M27 26h4v4h-4Z" fill="#673e4b"/></>:<><path d="M15 13h18v4H15Zm0 5h18v16H15Z" fill="#294b40"/><path d="M18 17h12v12H18Z" fill="#6c9271"/><path d="M21 20h6v6h-6Z" fill="#b1bb86"/><path d="M18 31h12v3H18Z" fill="#91a37a"/></>}
 </svg>;
}
export function TeaGardenArtwork(){
 return <svg className="tea-garden-art" viewBox="0 0 320 320" preserveAspectRatio="none" shapeRendering="crispEdges" aria-hidden="true"><path d="M8 0h304v8h8v304h-8v8H8v-8H0V8h8Z" fill="#152f2b"/><path d="M8 8h304v304H8Z" fill="#6d8564"/><path d="M12 12h296v296H12Z" fill="#263f35"/><path d="M18 18h284v284H18Z" fill="#355545"/><path d="M18 18h284v4H18ZM18 22h4v276h-4Z" fill="#9ca477"/><path d="M22 298h280v4H22Zm276-276h4v276h-4Z" fill="#122e29"/>{[0,1,2,3].map(i=><g key={i} transform={`translate(${i%2?288:8} ${i>1?288:8})`}><path d="M0 0h16v16H0Z" fill="#bfaa74"/><path d="M4 4h8v8H4Z" fill="#566b4f"/></g>)}</svg>;
}
