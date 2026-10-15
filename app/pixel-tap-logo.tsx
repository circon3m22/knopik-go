/** A companion title card in the same 5×7 lettering as KNOPIK GO. */
export function PixelTapLogo(){
 const glyphs:Record<string,string[]>={K:["10001","10010","10100","11000","10100","10010","10001"],N:["10001","11001","10101","10011","10001","10001","10001"],O:["01110","10001","10001","10001","10001","10001","01110"],P:["11110","10001","10001","11110","10000","10000","10000"],I:["11111","00100","00100","00100","00100","00100","11111"],T:["11111","00100","00100","00100","00100","00100","00100"],A:["01110","10001","10001","11111","10001","10001","10001"]};
 return <svg className="pixel-tap-logo" viewBox="0 0 62 11" shapeRendering="crispEdges" role="img" aria-label="KNOPIK TAP"><path d="M38 0h24v11H38Z" fill="#8e473d"/>{[..."KNOPIKTAP"].map((c,i)=><g key={i} fill="#fff1d1">{glyphs[c].flatMap((row,y)=>[...row].map((v,x)=>v==="1"?<rect key={`${x}-${y}`} x={(i<6?i*6:41+(i-6)*7)+x} y={y+2} width={1} height={1}/>:null))}</g>)}</svg>;
}
