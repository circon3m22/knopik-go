import type { PotionKind } from "./pixel-artwork";
const I="#343041";
const BOTTLES:Record<Exclude<PotionKind,"food">,{width:number;neck:number;top:number;shoulder:number;light:string;dark:string;cap:string;label:string;foil?:boolean}>={
 espresso:{width:38,neck:14,top:5,shoulder:30,light:'#b78667',dark:'#684639',cap:'#e3c17e',label:'#f6e1bc'},
 grape:{width:40,neck:12,top:3,shoulder:31,light:'#b698d4',dark:'#655482',cap:'#a9c3c9',label:'#eae0ed'},
 whiteTea:{width:42,neck:18,top:8,shoulder:34,light:'#e6deba',dark:'#a99c75',cap:'#729b8e',label:'#fff4d8'},
 ginger:{width:36,neck:12,top:3,shoulder:30,light:'#dfad64',dark:'#997042',cap:'#c4b77e',label:'#eee1bc'},
 peach:{width:44,neck:16,top:8,shoulder:33,light:'#eda997',dark:'#b56d77',cap:'#80ac94',label:'#ffe5c5'},
 currant:{width:34,neck:14,top:4,shoulder:28,light:'#9f8cc3',dark:'#544870',cap:'#d6b77d',label:'#dfd7e9'},
 zhivchik:{width:38,neck:14,top:5,shoulder:31,light:"#b3e56b",dark:"#537b39",cap:"#75a74d",label:"#e5f0c3"},
 heal:{width:48,neck:16,top:8,shoulder:34,light:"#e8988f",dark:"#a64b58",cap:"#b68958",label:"#fff1d1"},
 pepsi:{width:36,neck:12,top:5,shoulder:33,light:"#668caf",dark:"#283e60",cap:"#ba5260",label:"#f0e5cc"},
 pitbull:{width:34,neck:14,top:3,shoulder:28,light:"#e5aa59",dark:"#8a542e",cap:"#b5c5c6",label:"#3d414a"},
 cocoa:{width:46,neck:20,top:14,shoulder:34,light:"#bb9773",dark:"#6e4839",cap:"#dfc79e",label:"#f3e2c0"},
 bergamot:{width:40,neck:16,top:7,shoulder:32,light:"#e5d487",dark:"#aa7a46",cap:"#6f8661",label:"#d9e4c5"},
 lime:{width:46,neck:12,top:9,shoulder:34,light:"#d8e584",dark:"#849945",cap:"#9dba5b",label:"#f7edc8"},
 matcha:{width:42,neck:20,top:9,shoulder:32,light:"#b8cb94",dark:"#4e7a67",cap:"#537d75",label:"#f2e5bf"},
 tralalero:{width:38,neck:12,top:3,shoulder:29,light:"#91d6df",dark:"#39728d",cap:"#b9c6cc",label:"#e1edf0",foil:true},
 ballerina:{width:36,neck:10,top:1,shoulder:35,light:"#e8adc3",dark:"#9f6483",cap:"#e4bf7f",label:"#f5ddde",foil:true},
 bombardiro:{width:44,neck:18,top:10,shoulder:35,light:"#b5c390",dark:"#506b4c",cap:"#8fa079",label:"#dedcb2",foil:true},
 verity:{width:44,neck:14,top:5,shoulder:31,light:"#f2d979",dark:"#b1863b",cap:"#cf765c",label:"#fff1bf",foil:true},
};
function BottleLabel({kind,dark}:{kind:PotionKind;dark:string}){return <g fill={dark}>
 {kind==="espresso"?<><path d="M22 61h19v11h-4v4H26v-4h-4Z"/><path d="M41 62h5v8h-5ZM27 56h2v4h-2Zm7-2h2v6h-2Z" fill="#a37b61"/></>
 :kind==="grape"?<><path d="M23 61h17v5H23Zm4 6h17v5H27Zm3 6h9v5h-9Z" fill="#826898"/><path d="M31 56h9v3h-9Zm5-2h3v7h-3Z" fill="#648b70"/></>
 :kind==="whiteTea"?<><path d="M22 62h20v10h-4v5H26v-5h-4Z" fill="#8eaa92"/><path d="M26 57h3v4h-3Zm9-2h3v6h-3Z" fill="#acb9a0"/></>
 :kind==="ginger"?<><path d="M24 61h17v13H24Z" fill="#d19b59"/><path d="M26 63h3v3h-3Zm9 0h3v3h-3Zm-9 6h3v3h-3Zm9 0h3v3h-3Z"/></>
 :kind==="peach"?<><path d="M22 63h6v-3h11v3h5v10h-5v4H28v-4h-6Z" fill="#d48d80"/><path d="M32 59h4v15h-4Z" fill="#f2bea0"/><path d="M34 55h8v4h-8Z" fill="#7a9d7e"/></>
 :kind==="currant"?<><path d="M30 57h8v6h-4v5h5l-9 11 2-9h-5l3-7Z" fill="#a787c3"/><path d="M20 64h3v4h-3Zm22 6h3v4h-3Z" fill="#6f608d"/></>
 :kind==="heal"?<><path d="M22 57h7v4h6v-4h7v12h-4v4h-4v4h-4v-4h-4v-4h-4Z" fill="#b76253"/><path d="M25 58h4v4h-4Z" fill="#ffd3bb"/></>
 :kind==="zhivchik"?<><path d="M23 59h7v3h4v-3h7v3h3v11h-4v4H24v-4h-4V62h3Z" fill="#75a74d"/><path d="M32 56h7v3h-7Zm1 7h5l-5 7h5l-8 7 2-6h-4Z" fill="#f4d889"/></>
 :kind==="pepsi"?<><path d="M22 59h20v4h4v10h-4v4H22v-4h-4V63h4Z" fill="#fff1d1"/><path d="M22 60h19v4h3v4H20v-4h2Z" fill="#c85e65"/><path d="M20 70h24v3h-4v3H24v-3h-4Z" fill="#447697"/></>
 :kind==="pitbull"?<><path d="M20 61h7v-4h10v4h7v5h-4v8h-6v4h-4v-4h-6v-8h-4Z" fill="#e7c785"/><path d="M25 63h4v4h-4Zm10 0h4v4h-4ZM29 70h6v4h-6Z" fill={I}/></>
 :kind==="cocoa"?<><path d="M22 58h20v17H22Z"/><path d="M24 60h7v6h-7Zm9 0h7v6h-7Zm-9 8h7v5h-7Zm9 0h7v5h-7Z" fill="#a57b55"/></>
 :kind==="bergamot"?<><path d="M31 58h4v17h-4Z" fill="#775442"/><path d="M33 59h9v6h-9Zm-11 6h10v7H22Z" fill="#537d75"/><path d="M25 67h7v2h-7Zm11-6h6v2h-6Z" fill="#a4c78c"/></>
 :kind==="lime"?<><path d="M24 57h16v4h5v12h-5v5H24v-5h-5V61h5Z" fill="#759547"/><path d="M25 60h14v4h3v7h-4v4H26v-4h-4v-7h3Z" fill="#d9e69f"/><path d="M31 60h3v15h-3ZM24 66h17v3H24Z" fill="#91ad55"/></>
 :kind==="matcha"?<><path d="M23 61h19v11h-4v4H27v-4h-4Z" fill="#537d75"/><path d="M23 59h19v4H23Z" fill="#b5d9b6"/><path d="M29 55h3v3h-3Zm7-1h3v4h-3Z" fill="#77996e"/></>
 :kind==="tralalero"?<><path d="M20 67h9v-9h5l5 9h7v7H20Z" fill="#39728d"/><path d="M25 69h4v2h-4Zm13 0h5v2h-5Z" fill="#88b6b0"/></>
 :kind==="ballerina"?<><path d="M23 59h18v10h-3v5H26v-5h-3Z" fill="#955d84"/><path d="M40 60h6v8h-6Z" fill="#e5acb9"/><path d="M26 59h12v3H26Z" fill="#fff1d1"/></>
 :kind==="bombardiro"?<><path d="M29 58h6v7h11v5H35v8h-6v-8H18v-5h11Z" fill="#537751"/><path d="M31 58h2v13h-2Z" fill="#9dab7c"/></>
 :<><path d="M24 58h16v4h4v10h-4v5H24v-5h-4V62h4Z" fill="#eab95b"/><path d="M25 63h4v4h-4Zm11 0h4v4h-4ZM26 70h3v3h8v-3h3v5H26Z" fill={I}/></>}
 </g>;}
export function DetailedPotion({kind,className="buff-icon-image"}:{kind:PotionKind;className?:string}){
 if(kind==="food")return <svg className={`pixel-art pixel-potion ${className}`} viewBox="0 0 64 96" shapeRendering="crispEdges" aria-hidden="true"><path d="M8 52h48v8h-5v19H13V60H8Z" fill={I}/><path d="M13 55h38v7h-4v13H17V62h-4Z" fill="#b76253"/><path d="M15 44h9v-6h12v6h12v11H15Z" fill="#a57b55"/><path d="M16 46h6v5h-6Zm11-5h6v5h-6Zm10 7h8v4h-8Z" fill="#e4cc9b"/><path d="M27 62h10v5h5v6H22v-6h5Z" fill="#fff1d1"/><path d="M20 83h27v3H20Z" fill="#34304133"/></svg>;
 const b=BOTTLES[kind],left=32-b.width/2,right=32+b.width/2,nl=32-b.neck/2,nr=32+b.neck/2,sy=b.shoulder,base=89;
 const shape=`M${nl} ${b.top}H${nr}V${sy-8}h6v4h${right-nr-6}v4h4v${base-sy-7}h-4v7H${left}v-7h-4V${sy}h4v-4h${nl-left-6}v-4h6Z`;
 return <svg className={`pixel-art pixel-potion ${className}`} viewBox="0 0 64 96" shapeRendering="crispEdges" aria-hidden="true">
  <path d={`M${left+1} 90h${b.width-2}v3H${left+1}Z`} fill="#34304133"/>
  <path d={shape} fill={I}/><path d={shape} transform="translate(3 4) scale(.91 .9)" fill="#adbbb4"/>
  <rect x={left+3} y={sy+4} width={b.width-6} height={base-sy-10} fill={b.dark}/><rect x={left+5} y={sy+4} width={b.width-15} height={base-sy-15} fill={b.light}/><rect x={left+8} y={sy+7} width="5" height={base-sy-24} fill="#fff1d1" opacity=".24"/>
  <path d={`M${left+3} ${sy+2}h${b.width-6}v3H${left+3}Zm1 ${base-sy-9}h${b.width-8}v3H${left+4}Z`} fill="#d5dfd0" opacity=".5"/>
  <rect x={nl+2} y={b.top+2} width={b.neck-4} height={sy-b.top-6} fill="#b8ccc0"/><rect x={nl+3} y={b.top+3} width="3" height={sy-b.top-10} fill="#fff1d1"/>
  <rect x={nl-1} y={b.top} width={b.neck+2} height={b.foil?13:9} fill={I}/><rect x={nl+1} y={b.top+2} width={b.neck-2} height={b.foil?9:5} fill={b.cap}/><rect x={nl+2} y={b.top+2} width={Math.max(3,b.neck-5)} height="2" fill="#fff1d1" opacity=".65"/>
  {b.foil&&<path d={`M${nl+1} ${b.top+9}h${b.neck-2}v3H${nl+1}Z`} fill="#d4aa5c"/>}
  <path d={`M${left+3} ${sy+6}h3v15h-3Zm1 20h2v8h-2Z`} fill="#fff1d1"/>
  <path d="M21 52h22v4h4v24h-4v3H21v-3h-4V56h4Z" fill="#34304155"/><path d="M21 53h21v3h4v22h-4v3H21v-3h-3V56h3Z" fill={b.label}/><path d="M22 55h20v2H22Z" fill="#fff1d1" opacity=".65"/>
  <path d={`M${left+6} ${sy+13}h2v2h-2Zm${b.width-15} 4h2v3h-2ZM${left+7} 85h${b.width-14}v1H${left+7}Z`} fill="#fff1d1" opacity=".45"/>
  <BottleLabel kind={kind} dark={b.dark}/><path d="M24 79h3v1h-3Zm5 0h6v1h-6Zm8 0h3v1h-3Z" fill={b.dark}/>
 </svg>;
}
