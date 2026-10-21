import type {NeighborhoodObject} from './neighborhood-map';
import type {StreetPalette} from './neighborhood-props';
/** Each material/layer pair is one SVG path. Windows and wood grain are drawn separately
 * on the pixel grid, then batched: more authored pixels, fewer DOM nodes. */
function paint(){let layer=0;const colors=new Map<string,{fill:string;d:string;layer:number}>();return {
 layer(value:number){layer=value;},
 add(c:string,d:string){const key=layer+':'+c,entry=colors.get(key);if(entry)entry.d+=d;else colors.set(key,{fill:c,d,layer});},
 box(c:string,x:number,y:number,w:number,h:number){this.add(c,`M${Math.round(x)} ${Math.round(y)}h${Math.round(w)}v${Math.round(h)}h-${Math.round(w)}Z`);},
 art(){return [...colors].sort((a,b)=>a[1].layer-b[1].layer).map(([key,{fill,d}])=><path key={key} fill={fill} d={d}/>);}
};}
const hash=(id:string)=>[...id].reduce((s,c)=>(s*31+c.charCodeAt(0))>>>0,7);
export const EUROPEAN_HOUSE_HEIGHT=430;
export const EUROPEAN_HOUSE_FLOORS=3;
/** Three real storeys: 107px floor pitch and a 96px entrance, against the
 * resident's ~75px height. No extra attic window row or squeezed six-storey grid. */
export function CityBuilding({object:o,p,detail}:{object:NeighborhoodObject;p:StreetPalette;detail:number}){
 const a=paint(),w=o.w!,seed=hash(o.id),v=(o.variant??0)%8,top=-EUROPEAN_HOUSE_HEIGHT+78;
 const wall=(p.night?['#78858e','#718579','#917b74','#838573','#976f63','#6c8594','#a09278','#7b8888']:['#eddfc3','#cad6c1','#e0baa0','#e1ddbd','#c28e72','#bdd2d5','#ead8af','#c9cfc8'])[v];
 const shadow=p.night?'#4b5d68':v===4?'#9a6958':'#b9a88c',stone=p.night?'#aeb8b0':'#f3e7cf',roof=p.night?'#4b5362':v%3===0?'#71858b':v%3===1?'#a17160':'#6e8885';
 const shutter=p.night?'#536a66':['#66887b','#708d78','#9b6b5c','#66838b','#708a78','#6f8a91','#87926e','#6c8385'][v];
 a.add(p.shadow,`M6-5h${w}v17H6Z`);a.box(p.ink,0,top,w,-top);a.layer(1);a.box(wall,4,top+5,w-8,-top-10);a.box(shadow,w-18,top+5,14,-top-12);a.box(shadow,4,-22,w-8,18);
 a.layer(2);a.box(stone,4,top+5,w-8,6);a.box(stone,6,top+12,w-12,3);
 for(const y of[-236,-129]){a.box(shadow,5,y+5,w-10,3);a.box(stone,2,y,w-4,5);}
 for(const x of[7,w-28]){a.box(stone,x,top+20,12,-top-43);if(detail>0)for(let y=top+24;y<-30;y+=18)a.box(shadow,x,y,12,1);}
 if(detail>=2){a.layer(3);if(v===4)for(let row=0,y=top+20;y<-28;y+=12,row++){a.box(shadow,25,y,w-62,1);for(let x=27+row%2*15;x<w-35;x+=31)a.box(shadow,x,y,1,11);}else for(let i=0;i<12;i++)a.box(shadow,26+(seed+i*47)%(w-60),top+20+(seed+i*37)%(-top-50),4+i%4,1);}
 const roofPath=(inset:number)=>{const ys=[top-74+inset,top-57,top-40,top-22,top-4-inset],xs=[65,41,22,8,-5];let d=`M${xs[0]+inset} ${ys[0]}H${w-xs[0]-inset}`;for(let i=1;i<ys.length;i++)d+=`V${ys[i]}H${w-xs[i]-inset}`;d+=`H${xs[4]+inset}`;for(let i=3;i>=0;i--)d+=`V${ys[i+1]}H${xs[i]+inset}`;return d+'Z';};
 a.layer(5);a.add(p.ink,roofPath(0));a.layer(6);a.add(roof,roofPath(4));
 if(detail>0){a.layer(7);for(let row=0;row<6;row++){const y=top-65+row*10,left=Math.max(10,59-row*10);a.box(p.wood,left,y,w-left*2,1);for(let x=left+10+(row%2)*11;x<w-left;x+=23)a.box(shadow,x,y,1,9);}}
 a.layer(8);a.box(p.ink,w-79,top-94,25,34);a.box(p.wood,w-75,top-90,17,30);a.box(stone,w-82,top-96,31,5);a.box(p.metal,-7,top-3,w+14,8);a.box(stone,-8,top-5,w+16,3);a.box(p.metal,w-12,top+9,4,-top-15);a.box(stone,w-12,top+11,1,-top-23);
 let windows=0;
 for(let row=0;row<3;row++)for(let col=0;col<3;col++){
  if(row===2&&col===1)continue;windows++;
  const x=Math.round(26+col*(w-104)/2),y=-328+row*107,ww=52,wh=66,k=(seed+row*17+col*23)%29,lit=p.night&&k%5!==0;
  a.layer(10);a.box(shadow,x-6,y-5,ww+13,wh+14);a.layer(11);a.box(stone,x-3,y-3,ww+6,wh+6);a.layer(12);a.box(p.ink,x,y,ww,wh);
  a.layer(13);a.box(lit?['#edc58b','#dfaf7f','#f4d9a7'][k%3]:p.night?'#354f66':'#92b8ba',x+3,y+3,ww-6,wh-6);
  if(detail>0){a.layer(14);const curtain=lit?'#c39276':p.night?'#66778a':'#d9d0b5',gap=4+k%5;a.box(curtain,x+3,y+3,gap,wh-7);a.box(curtain,x+ww-gap-4,y+3,gap+1,wh-7);a.layer(15);a.box(lit?'#fff0c3':p.night?'#879caa':'#d8ece3',x+5,y+5,ww-10,2);a.box(lit?'#ffe3b0':'#c0d8d2',x+12,y+9,2,15);}
  a.layer(16);a.box(stone,x+25,y+2,2,wh-4);a.box(stone,x+2,y+25,ww-4,2);
  if(detail>=2){a.layer(17);if(k%3===0){a.box(p.wood,x+8,y+wh-7,15,5);a.add(p.leaf,`M${x+12} ${y+wh-7}v-11h3v6h6v3h-6v2Z`);}else if(k%3===1){a.box(p.wood,x+8,y+wh-11,32,2);a.box(p.roof,x+10,y+wh-18,4,7);a.box(stone,x+17,y+wh-16,3,5);}}
  if(v===1||v===2||v===6){a.layer(18);for(const xx of[x-12,x+ww+5]){a.box(p.ink,xx-1,y,9,wh);a.box(shutter,xx,y+2,7,wh-4);if(detail>0)for(let sy=y+8;sy<y+wh-4;sy+=7)a.box(p.leafDark,xx+1,sy,5,1);}}
  a.layer(20);a.box(stone,x-7,y+wh+2,ww+14,4);a.box(shadow,x-5,y+wh+6,ww+10,2);
  if(row===0){a.layer(21);a.add(stone,`M${x-5} ${y-8}v-3h10v-3h12v-3h18v3h12v3h10v3Z`);}
  if(detail>=2&&row===1&&col===1){a.layer(22);a.box(p.metal,x-10,y+wh-8,ww+20,2);a.box(p.metal,x-10,y+wh+13,ww+20,3);for(let rail=0;rail<ww+20;rail+=9)a.box(p.metal,x-10+rail,y+wh-6,2,19);a.box(shadow,x-13,y+wh+16,ww+26,4);}
  if(detail>=3&&row<2&&(col+v)%3===0){a.layer(23);a.box(p.wood,x+6,y+wh+1,35,6);for(let i=0;i<5;i++){a.box(p.leaf,x+8+i*6,y+wh-3-i%2*4,4,6);a.box(i%2?'#d2b3bd':'#e1c996',x+8+i*6,y+wh-6-i%2*4,4,3);}}
 }
 const door=Math.round(w/2);
 a.layer(30);a.box(shadow,door-37,-101,76,103);a.box(stone,door-34,-99,68,98);a.box(p.ink,door-29,-95,58,91);
 a.layer(31);a.box(p.wood,door-25,-91,50,86);a.box(shadow,door-22,-88,20,80);a.box(shadow,door+2,-88,20,80);
 a.layer(32);a.box(p.night?'#e1b780':'#a4c5c2',door-20,-86,16,34);a.box(p.night?'#e1b780':'#a4c5c2',door+4,-86,16,34);a.box(p.wood,door-20,-45,16,28);a.box(p.wood,door+4,-45,16,28);
 a.layer(33);a.box('#dfc48b',door+7,-49,3,10);a.box(stone,door-22,-88,1,77);a.box(p.metal,door+41,-74,10,25);a.box(p.ink,door+44,-71,4,7);if(detail>0)for(let i=0;i<3;i++)a.box(stone,door+44,-60+i*3,4,1);
 a.layer(34);a.box(p.metal,door-42,-104,84,5);a.box(stone,door-45,-107,90,3);a.box(shadow,door-44,-5,88,14);a.box(stone,door-41,-5,82,3);a.box(stone,door-47,5,94,3);a.box(p.wood,door-25,9,50,5);
 if(detail>0){
  a.layer(35);
  // Pots stay against the solid facade, not on the pedestrian route.
  for(const xx of[28,w-47]){a.box(shadow,xx-3,-3,25,6);a.box(p.wood,xx,-21,19,19);a.box(p.roof,xx+2,-18,15,13);a.box(stone,xx-2,-22,23,4);a.box(p.leafDark,xx+4,-39,11,17);a.box(shutter,xx,-32,19,8);a.box(p.leafLight,xx+6,-38,5,9);}
  if(!o.home){a.box(p.leafDark,door+55,-86,24,17);a.box(stone,door+60,-82,2,8);a.box(stone,door+65,-82,7,2);a.box(stone,door+70,-80,2,6);}
 }
 if(detail>=2&&(v===1||v===6)){
  a.layer(36);const side=v===1?12:w-25;
  for(let i=0;i<14;i++){const yy=-38-i*12,xx=side+(i%3-1)*4;a.box(p.leafDark,xx,yy,3,14);a.add(p.leaf,`M${xx-7} ${yy-3}h7v-3h5v8h-5v3h-7Zm11-4h6v-3h5v7h-11Z`);if(detail>=3)a.box(p.leafLight,xx-5,yy-2,5,2);}
 }
 if(detail>=4){a.layer(40);a.box('#f7edda',5,top+14,1,-top-42);a.box(stone,w-20,top+22,1,-top-48);}
 return <g data-building={o.id} data-european-house="townhouse-1" data-floor-count={EUROPEAN_HOUSE_FLOORS} data-city-material="facade" data-window-count={windows}>{a.art()}{o.home&&<><path d={`M${door-56}-122h112v14h-112Z`} fill={p.leafDark}/><text x={door} y="-112" textAnchor="middle" fontSize="11" fill="#f5e6c6">ЛИПОВАЯ, 8</text></>}</g>;
}
export function CityTree({p,variant=0,detail}:{p:StreetPalette;variant?:number;detail:number}){
 const a=paint(),b=paint(),v=variant%6,h=[170,192,164,175,186,155][v],foliage=v===3?(p.night?'#617b70':'#a6b17b'):v===4?(p.night?'#787969':'#b2a373'):p.leaf;
 const widths=[[22,44,59,70,65,47,31],[12,26,41,52,49,35,22],[30,53,70,79,72,55,34],[31,47,62,69,62,44,25],[14,34,53,70,62,49,31],[27,48,64,73,66,47,26]][v],levels=[0,10,24,44,73,105,124];
 const outline=(inset:number)=>{let d=`M${-widths[0]+inset} ${-h+inset}H${widths[0]-inset}`;for(let i=1;i<widths.length;i++)d+=`V${-h+levels[i]}H${widths[i]-inset}`;d+=`V${-h+136-inset}H${-widths[6]+inset}`;for(let i=5;i>=0;i--)d+=`V${-h+levels[i+1]}H${-widths[i]+inset}`;return d+'Z';};
 const widthAt=(y:number)=>{let i=0;while(i<levels.length-1&&levels[i+1]<=y+h)i++;return widths[i]-8;};
 a.add(p.shadow,'M-48-7h96v4h12v11H45v4h-91V8h-13V-3h11Z');a.add(p.ink,'M-12-106h22v89h8V-2h-36v-15h6Z');a.add(v===2?(p.night?'#919d91':'#d6d1b3'):p.wood,'M-8-103H7v88h8v8H-14v-8h6Z');a.add(p.trim,'M-6-85h3v61h-3ZM2-71h2v32H2Z');
 if(detail>0){a.layer(1);a.add(p.ink,'M-7-37h5v2h-5ZM1-58h5v2H1Zm-7 13h3v1h-3ZM1-22h5v2H1Z');a.add(p.wood,'M-3-70h1v24h-1ZM4-43h1v13H4Z');}
 b.add(p.leafDark,outline(0));b.layer(1);b.add(foliage,outline(4));
 b.layer(2);b.add(p.leafDark,`M30 ${-h+65}h18v14h10v21H40v17H12v-10h17V${-h+89}H20v-13h10ZM-36 ${-h+112}h22v8h33v8h-52Z`);
 b.layer(3);for(let i=0;i<7;i++){const y=-h+14+i*14,limit=widthAt(y),x=Math.max(-limit,Math.min(limit-17,-25+i*23%51));b.add(p.leafLight,`M${x} ${y}h14v-3h10v8h-4v6h-17v-4h-8v-4h5Z`);}
 b.layer(4);if(detail>0)for(let i=0;i<(detail>=4?84:detail>=2?42:16);i++){const y=-h+18+(i*19+v*5)%103,limit=widthAt(y),x=-limit+(i*31+v*7)%Math.max(1,limit*2-7);b.add(i%3?p.leafLight:p.leafDark,`M${x} ${y}h${detail>=3?2+i%3:5}v${1+i%2}h-${detail>=3?2+i%3:5}Z`);}
 if(v===3||v===5){b.layer(5);for(let i=0;i<8;i++)b.box(v===5?'#c8917c':'#ddc99c',-25+i*13%55,-h+34+i*17%73,3,3);}
 return <g data-city-material="tree" data-tree-style={v}>{a.art()}<g data-tree-crown="">{b.art()}</g></g>;
}
export function CityLamp({p,variant=0,detail}:{p:StreetPalette;variant?:number;detail:number}){
 const a=paint(),short=variant===2,h=short?55:164;
 a.add(p.shadow,'M-18-2h36v6h-36Z');a.add(p.ink,`M-9-9H9V2H-9Zm4 ${-h+20}h10v${h-26}H-5Z`);a.box(p.metal,-3,-h+22,3,h-32);a.add(p.metal,'M-7-21H7v4H-7Zm1 7H6v3H-6Z');
 if(short){a.box(p.ink,-10,-h-4,20,28);a.box(p.metal,-7,-h,14,21);}else{
  a.add(p.ink,`M-24 ${-h+4}h48v7h-5v23h-38v-23h-5Zm6-7h36v-5H-18Z`);a.box(p.metal,-15,-h+8,30,23);a.box(p.ink,-2,-h-14,4,11);
  if(detail>=2){a.add(p.metal,`M-8 ${-h+34}h16v3H-8ZM-6-86h4v2h-4ZM2-51h2v8H2Z`);a.box(p.trim,-7,-17,2,3);a.box(p.trim,5,-17,2,3);}
 }
 if(detail>=3)a.box(p.trim,-3,-h+37,1,h-70);
 return <g data-city-material="lamp">{a.art()}<path data-lamp-bulb="" d={short?'M-4-52H4v13H-4Z':`M-12 ${-h+11}h24v16h-24Z`} fill={p.night?'#ffe7b6':'#c8d7cb'}/>{!short&&<path d={`M-1 ${-h+9}h2v20h-2Z`} fill={p.ink}/>}</g>;
}
function Furniture({object:o,p,detail}:{object:NeighborhoodObject;p:StreetPalette;detail:number}){
 const a=paint(),v=o.variant??0;
 if(o.kind==='bench'){
  a.add(p.shadow,'M-66-1H66v8H-66Z');a.add(p.ink,'M-55-41h7v40h-7Zm103 0h7v40h-7ZM-65-18H65v12H-65Z');
  for(const y of[-48,-37,-26]){a.box(p.wood,-63,y,126,8);a.box(p.trim,-60,y+1,120,2);if(detail>0){for(const x of[-51,49])a.box(p.metal,x,y+3,2,2);a.box(p.roof,-30+v*4,y+5,29,1);}}
  a.box(p.wood,-63,-16,126,9);a.box(p.trim,-61,-15,122,3);a.add(p.metal,'M-66-34h7v4h-3v16h9v4h-13Zm125 0h7v24H53v-4h9v-16h-3Z');
  if(detail>=2){a.add(p.ink,'M-52-7h4v8h-4Zm100 0h4v8h-4Z');a.add(p.wood,'M-43-13h37v1h-37Zm52 2h31v1H9Z');if(v===2){a.box(p.wood,20,-24,21,8);a.box(p.wall,22,-23,17,5);}}
 }else if(o.kind==='planter'){
  a.add(p.ink,'M-44-25h88v29h-88Z');a.box(p.roof,-40,-20,80,20);a.box(p.trim,-46,-26,92,6);a.box(p.leafDark,-38,-29,76,5);
  for(let i=0;i<7;i++){const x=-31+i*10,y=-38-i%3*5;a.box(p.leaf,x,y,2,-y-25);a.add(p.leafLight,`M${x-4} ${y+5}h5v3h-5Zm5 3h5v3h-5Z`);a.box([p.night?'#b58e92':'#d18f86','#dfc68d','#b4a2ba'][v%3],x-3,y-5,7,6);a.box('#f1d99b',x-1,y-3,2,2);}
  if(detail>=2){for(let x=-34;x<38;x+=15){a.box(p.wood,x,-16,1,12);a.box(p.trim,x+3,-13,7,1);}}
 }else if(o.kind==='bin'){
  a.add(p.shadow,'M-21-2h42v6h-42Z');a.box(p.ink,-18,-48,36,47);a.box(p.metal,-14,-44,28,39);a.box(p.ink,-21,-52,42,8);a.box(p.trim,-17,-51,34,2);for(let x=-10;x<=10;x+=5)a.box(p.ink,x,-39,2,29);a.box(p.wood,-21,-45,42,4);
 }else if(o.kind==='mailbox'){
  a.box(p.ink,-5,-30,10,31);a.box(p.wood,-2,-29,4,27);a.box(p.ink,-25,-68,50,38);a.box(p.leaf,-21,-64,42,30);a.box(p.leafLight,-21,-64,42,3);a.box(p.ink,-16,-57,32,4);a.box(p.trim,-7,-46,14,8);a.add(p.wood,'M-7-46h3v3h3v3h3v-3h3v-3h3v3h-3v3H-4v-3h-3Z');
 }else if(o.kind==='hydrant'){
  a.box(p.ink,-10,-42,20,40);a.box(p.ink,-20,-31,40,10);a.box(p.roof,-6,-40,12,35);a.box(p.roof,-18,-29,36,6);a.box(p.ink,-13,-48,26,7);a.box(p.trim,-10,-46,20,3);a.box(p.trim,-4,-35,2,7);a.box(p.metal,-8,-6,16,3);
 }else if(o.kind==='fence'){
  a.box(p.wood,-5,-107,10,127);a.box(p.trim,-7,-110,14,6);a.box(p.metal,-3,-100,2,116);for(let y=-94;y<15;y+=22){a.box(p.metal,-9,y,18,3);a.box(p.trim,-7,y,3,2);}
 }else if(o.kind==='stone'){
  a.add(p.shadow,'M-28-2h56v7h-56Z');a.add(p.seam,'M-25-10h12v-8h25v6h14V1h-51Z');a.add(p.trim,'M-17-9h10v-5h17v5h11v3h-38Z');if(detail>0)a.add(p.wood,'M-9-6h5v1h-5Zm15 4h8v1H6Z');
 }else if(o.kind==='clock'){
  a.add(p.shadow,'M-27-4h54v10h-54Z');a.box(p.ink,-12,-131,24,134);a.box(p.metal,-8,-128,16,125);a.box(p.trim,-6,-120,3,110);a.add(p.ink,'M-25-166h50v6h6v35h-6v6h-50v-6h-6v-35h6Z');a.box(p.wood,-23,-159,46,34);a.box(p.wall,-19,-155,38,26);a.add(p.ink,'M-1-153h2v12h12v2H-1ZM-17-144h4v2h-4Zm32 0h4v2h-4ZM-1-131h2v3h-2Z');a.box(p.metal,-17,-5,34,6);
 }
 return <g data-city-material={o.kind}>{a.art()}</g>;
}
export function CityVehicle({object:o,p,detail}:{object:NeighborhoodObject;p:StreetPalette;detail:number}){
 const a=paint(),v=o.variant??0;
 if(o.kind==='bicycle'){
  const ring=(x:number,r:number)=>{const y=-18,c=r<16?4:5;return `M${x-r+c} ${y-r}h${2*(r-c)}l${c} ${c}v${2*(r-c)}l-${c} ${c}h-${2*(r-c)}l-${c}-${c}v-${2*(r-c)}Z`;};
  const frame='M-30-18-10-43 8-18H-30M-10-43H20L8-18M20-43 32-18',color=v?p.leaf:p.roof;
  return <g data-city-material="bicycle"><path d="M-53 4H53v3H-53Z" fill={p.shadow} opacity=".3"/>{[-30,32].map(x=><g key={x}>
   <path d={ring(x,20)+ring(x,16)} fill={p.ink} fillRule="evenodd"/><path d={ring(x,16)+ring(x,15)} fill={p.metal} fillRule="evenodd"/>
   <path d={`M${x}-33v30m-15-15h30${detail>0?`M${x-11}-29l22 22m-22 0 22-22`:''}`} fill="none" stroke={p.metal} strokeWidth="1"/><path d={`M${x-2}-20h4v4h-4Z`} fill={p.trim}/>
  </g>)}<path d={frame} fill="none" stroke={p.ink} strokeWidth="5"/><path d={frame} fill="none" stroke={color} strokeWidth="3"/>
   <path d="M-10-43v-9m30 9v-12h12" fill="none" stroke={p.metal} strokeWidth="3"/><path d="M-20-55H-1v4h-19Zm49-2h9v4h-9ZM5-21h6v6H5Z" fill={p.ink}/><path d="M8-18 15-9h7M-39-43h20v2h-20Zm1 0 8 25" fill="none" stroke={p.metal} strokeWidth="2"/>
   {v===1&&<><path d="M26-58h23v17H26Z" fill={p.wood}/><path d="M28-55h19v11H28Z" fill={p.trim}/><path d="M31-54v9m5-9v9m5-9v9M28-50h18" fill="none" stroke={p.wood} strokeWidth="1"/></>}
  </g>;
 }else{
  const color=p.night?['#986f76','#64808c','#7c8271'][v%3]:['#bc7c69','#8bada5','#c0aa72'][v%3];
  a.add(p.shadow,'M-96-3H96v14H-96Z');a.add(p.ink,'M-86-38h172v6h9v32h-9v7H-86V0h-9v-32h9Z');a.add(color,'M-82-34H82v5h8v25h-8v5H-82v-5h-8v-25h8Z');a.add(p.ink,'M-41-62h78v7h17v29H-55v-27h14Z');a.add(p.water,'M-36-57h69v7h16v19H-50v-18h14Z');a.add(p.night?'#344b5d':'#bfd6ca','M-31-54h24v21h-36v-13h12ZM-2-54h31v7h14v14H-2Z');a.box(color,-7,-58,5,31);a.add(p.ink,'M-75-5h23v18h-23Zm127 0h23v18H52Z');a.box(p.metal,-70,0,13,8);a.box(p.metal,57,0,13,8);a.box(p.trim,-87,-10,175,3);a.box('#e5d5aa',-85,-24,12,8);a.box('#b8796d',73,-24,12,8);
  if(detail>0){a.box(p.trim,-29,-21,11,2);a.box(p.trim,17,-21,11,2);a.box(p.wood,-1,-25,1,19);a.box(p.wall,-85,-2,14,2);a.box(p.wall,70,-2,14,2);a.box(p.ink,-88,-17,10,3);a.box(p.trim,65,-31,12,2);}if(detail>=3)a.add('#d8e5ce','M-28-51h12v2h-12Zm15 0h4v2h-4ZM15-51h9v2h-9Z');
 }
 return <g data-city-material={o.kind}>{a.art()}</g>;
}
export function CityPavilion({object:o,p,detail}:{object:NeighborhoodObject;p:StreetPalette;detail:number}){
 const a=paint();
 if(o.kind==='greenhouse'){
  a.add(p.shadow,'M-156-7h312v20h-312Z');a.add(p.ink,'M-154-7v-153h14v-17h25v-20h25v-17H90v17h25v20h25v17h14V-7Z');a.add(p.metal,'M-148-10v-147h14v-17h25v-20h25v-14H84v14h25v20h25v17h14v147Z');
  for(let i=0;i<8;i++){a.layer(0);const x=-139+i*35;a.box(p.night?'#446862':'#a7c8b7',x,-151,30,125);a.layer(1);a.box(p.wood,x+6,-43,18,16);a.box(p.leafDark,x+3,-65-i%3*13,24,22+i%3*13);if(detail>0){a.box(p.leaf,x+6,-95+i%2*13,5,65);a.box(p.leafLight,x+3,-84+i%2*13,18,5);a.box(p.trim,x+1,-148,2,110);if(detail>=2)for(let j=0;j<7;j++){const xx=x+3+j*7%24,yy=-100+j*11%50;a.add(j%2?p.leafLight:p.leaf,`M${xx} ${yy}h5v-2h4v4h-3v2h-6Z`);if(j%3===0)a.box('#dec18e',xx+2,yy+4,3,3);}}}
  a.layer(2);a.add(p.waterLight,'M-126-162h252v-9h-25v-20H-101v20h-25Z');a.layer(3);a.add(p.metal,'M-4-207h8v176h-8ZM-110-177h220v5h-220ZM-148-116h296v5h-296ZM-148-62h296v4h-296Z');a.layer(4);a.box(p.ink,-28,-95,56,88);a.box(p.wood,-24,-90,48,81);a.box(p.water,-20,-86,40,66);a.box(p.metal,-2,-87,4,69);a.box(p.trim,9,-41,3,9);a.box(p.trim,-155,-24,310,17);a.box(p.wood,-155,-7,310,7);if(detail>=2)for(let i=0;i<7;i++)a.box(p.waterLight,-128+i*38,-141,2,40);
 }else if(o.kind==='pergola'){
  a.box(p.shadow,-123,-2,246,12);a.box(p.wood,-112,-144,8,145);a.box(p.wood,104,-144,8,145);a.box(p.trim,-110,-140,2,136);a.box(p.trim,106,-140,2,136);a.box(p.wood,-116,-153,232,12);a.box(p.trim,-122,-157,244,5);for(let x=-105;x<118;x+=22){a.box(p.wood,x,-165,9,38);a.box(p.trim,x,-165,9,3);}a.box(p.wood,-112,-61,224,5);a.box(p.leaf,-120,-155,240,8);if(detail>0)for(let i=0;i<18;i++){const x=-116+i*13,y=-155+i%3*7;a.box(i%2?p.leafLight:p.leaf,x,y,15,7);a.box(p.leaf,x,y+5,5,i%4*8);}if(detail>=2)for(let i=0;i<12;i++)a.box('#ba9ead',-106+i*18,-144+i%2*7,4,9);
 }else{
  const cafe=o.kind==='cafe',w=cafe?190:138,left=-w/2;
  a.box(p.shadow,left-7,-4,w+14,13);a.box(p.ink,left,-102,w,103);a.box(p.wall,left+4,-97,w-8,91);a.box(p.wood,left+14,-83,w-28,52);a.box(p.night?'#d6b58b':'#9cbcb5',left+18,-79,w-36,44);
  if(detail>0){for(let i=0;i<(cafe?7:4);i++){a.box([p.wood,p.leaf,p.roof][i%3],left+24+i*19,-55-i%2*8,12,17+i%2*8);a.box(p.trim,left+26+i*19,-57-i%2*8,8,3);}a.box(p.trim,left+18,-78,w-36,2);a.box(p.wood,left+11,-29,w-22,8);}
  a.box(p.ink,left-6,-110,w+12,29);for(let x=left-2,n=0;x<w/2;x+=16,n++){a.box(n%2?p.roof:p.trim,x,-106,14,19);a.box(n%2?p.wood:p.wall,x,-87,14,5);}a.box(p.wood,-57,-139,114,25);a.box(p.trim,-54,-136,108,2);a.box(p.wood,left+13,-17,w-26,8);
  if(detail>0){a.layer(5);a.box(p.ink,22,-53,15,18);a.box(p.wall,24,-51,11,13);a.box(p.wood,26,-50,7,2);a.box(p.trim,36,-48,5,9);a.box(p.wood,38,-46,2,5);a.add(p.trim,'M-38-43h29v-4h-4v-4h-17v4h-8Z');a.box(p.wood,-28,-49,2,5);a.box(p.wood,-20,-49,2,5);}
  if(cafe){a.box(p.leafDark,64,-11,22,10);a.box(p.leaf,68,-40,12,29);}else{a.box(p.wood,-14,-58,28,15);a.box(p.trim,-10,-55,20,9);}
 }
 return <g data-city-material={o.kind}>{a.art()}{(o.kind==='cafe'||o.kind==='kiosk')&&<text x="0" y="-121" fontSize="13" textAnchor="middle" fill="#f6e6c4">{o.kind==='cafe'?'ТЁПЛЫЙ ХЛЕБ':'У АЛЬБЕРТА'}</text>}</g>;
}
export function CitySmallProp({object:o,p,detail}:{object:NeighborhoodObject;p:StreetPalette;detail:number}){
 if(['bench','planter','bin','mailbox','hydrant','fence','stone','clock'].includes(o.kind))return <Furniture object={o} p={p} detail={detail}/>;
 return null;
}
export function CityFountain({p,detail}:{p:StreetPalette;detail:number}){
 const a=paint();a.add(p.shadow,'M-88-12h176v37H-88Z');a.add(p.ink,'M-64-34H64v7h18v13h8v26h-8v10H64v7H-64v-7h-18V12h-8v-26h8v-13h18Z');a.add(p.seam,'M-60-30H60v7h18v13h7v19H78v10H60v7H-60v-7h-18V9h-7v-19h7v-13h18Z');
 a.layer(1);a.add(p.water,'M-57-23H57v6h16v11H57v8H-57v-8h-16v-11h16Z');a.add(p.waterLight,'M-51-21H51v2h-102Zm-9 13h29v1h-29Zm77 4h32v1H17Z');a.add(p.trim,'M-64-30H64v3H-64Zm-14 9h5v11h-5ZM-59 16H59v3H-59Z');
 a.layer(2);a.add(p.ink,'M-17-72h34v55h-34Z');a.add(p.trim,'M-12-68h24v48h-24Z');a.add(p.seam,'M3-68h9v48H3Z');a.add(p.ink,'M-30-80h60v11h-60Z');a.add(p.water,'M-25-77h50v5h-50Z');a.add(p.waterLight,'M-22-76h44v1h-44Z');
 if(detail>0){a.layer(3);a.add(p.wood,'M-68-4h3v6h-3Zm19 25h2v6h-2Zm28 0h2v6h-2Zm29 0h2v6H8Zm28 0h2v6h-2Zm29-25h3v6h-3Z');a.add(p.trim,'M-10-61h3v30h-3Z');}
 if(detail>=3){a.layer(4);a.add(p.waterLight,'M-44-11h23v1h-23Zm10 4h18v1h-18Zm62-8h17v1H28Z');a.add(p.wood,'M-78-13h5v1h-5Zm99 35h10v1H21Z');}
 return <g data-city-material="fountain">{a.art()}<path className="neighborhood-fountain-water" d="M-2-100h4v26h-4ZM-20-70h3v47h-3Zm37 0h3v47h-3Z" fill={p.waterLight}/></g>;
}
