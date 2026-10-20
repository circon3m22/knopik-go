import type {NeighborhoodObject} from './neighborhood-map';
import type {StreetPalette} from './neighborhood-props';
/** Every material is one SVG path. Windows and wood grain are drawn separately
 * on the pixel grid, then batched: more authored pixels, fewer DOM nodes. */
function paint(){let layer=0;const colors=new Map<string,{fill:string;d:string;layer:number}>();return {
 layer(value:number){layer=value;},
 add(c:string,d:string){const key=layer+':'+c,entry=colors.get(key);if(entry)entry.d+=d;else colors.set(key,{fill:c,d,layer});},
 box(c:string,x:number,y:number,w:number,h:number){this.add(c,`M${Math.round(x)} ${Math.round(y)}h${Math.round(w)}v${Math.round(h)}h-${Math.round(w)}Z`);},
 art(){return [...colors].sort((a,b)=>a[1].layer-b[1].layer).map(([key,{fill,d}])=><path key={key} fill={fill} d={d}/>);}
};}
const hash=(id:string)=>[...id].reduce((s,c)=>(s*31+c.charCodeAt(0))>>>0,7);
export function CityBuilding({object:o,p,detail}:{object:NeighborhoodObject;p:StreetPalette;detail:number}){
 const a=paint(),w=o.w!,h=o.h!,floors=o.floors!,seed=hash(o.id),v=(o.variant??0)%8;
 const walls=p.night?['#72808b','#667f7f','#8a7377','#70806d','#8c6f6b','#647f91','#8c8878','#6d7e80']:['#eddec1','#c3d0ba','#d5a48a','#c6c3a0','#b7826b','#a7c5c9','#ead6ad','#bac5bc'];
 const wall=walls[v],shade=p.night?'#475660':v===4?'#925e50':'#aa9d87',edge=p.night?'#aab4ad':'#f4e7cd',roof=p.night?'#505465':['#a97766','#6e9390','#965e54','#7c8f79'][v%4],roofTop=-h+8,face=-h+76;
 a.add(p.shadow,`M7-6h${w}v18H7Z`);a.box(p.ink,0,face,w,-face);a.box(wall,4,face+5,w-8,-face-11);
 a.box(shade,w-23,face+5,19,-face-11);a.box(shade,4,-27,w-8,20);a.box(edge,4,face+5,w-8,5);
 a.add(p.ink,`M-7 ${face}v-9h7v-25h13v-19h${w-26}v19h13v25h7v9Z`);
 a.add(roof,`M0 ${face-8}v-23h17v-17h${w-34}v17h17v23Z`);a.box(edge,-5,face-2,w+10,4);
 a.box(p.ink,w-70,roofTop-16,26,39);a.box(p.wood,w-67,roofTop-12,20,35);a.box(edge,w-75,roofTop-19,36,5);
 a.box(p.metal,13,face+4,5,-face-12);a.box(edge,13,face+8,2,-face-24);
 // Roof tiles follow the slope and do not float above chimneys or eaves.
 if(detail>0)for(let r=0;r<4;r++){const yy=face-45+r*10,left=r<2?21:5;a.box(p.wood,left,yy,w-left*2,1);for(let c=left+10+(r%2)*13;c<w-left;c+=27)a.box(shade,c,yy,1,9);}
 if(detail>=2){a.box(edge,5,face+14,10,-face-48);a.box(edge,w-37,face+15,11,-face-48);for(let y=face+22;y<-40;y+=22){a.box(shade,5,y,10,1);a.box(shade,w-37,y,11,1);}a.box(p.metal,w-99,roofTop-28,2,33);a.box(p.metal,w-111,roofTop-20,26,2);}
 const columns=Math.max(3,Math.floor(w/80)),pitch=(w-45)/columns,step=(-face-106)/floors;
 for(let row=0;row<floors;row++){
  a.layer(2);const y=Math.round(face+19+row*step);if(detail>0)a.box(edge,24,y-6,w-66,2);
  for(let col=0;col<columns;col++){
   const x=Math.round(25+col*pitch),k=(seed+row*17+col*23)%29,lit=p.night&&k%5!==0,winW=Math.min(43,Math.round(pitch-17)),winH=Math.min(39,Math.floor(step-10));
   a.layer(10);a.box(shade,x-3,y-3,winW+7,winH+8);a.layer(11);a.box(edge,x-2,y-2,winW+4,winH+4);a.layer(12);a.box(p.ink,x,y,winW,winH);
   const glass=lit?['#e7bc83','#dca879','#f4dca6'][k%3]:p.night?'#344c62':'#8baeb0';a.layer(13);a.box(glass,x+3,y+3,winW-6,winH-6);
   if(detail>0){
    // Left and right curtains have different openings in every apartment.
    const curtain=lit?'#b9826a':p.night?'#607080':'#e7d6b4',gap=3+k%6;
    a.layer(14);a.box(curtain,x+3,y+3,gap,winH-7);a.box(curtain,x+winW-8-(k%4),y+3,5+k%4,winH-7);
    a.box(lit?'#fff0c3':p.night?'#7c8f98':'#d0e4dc',x+4,y+4,winW-8,2);
    a.layer(15);a.box(edge,x+Math.floor(winW/2),y+2,2,winH-4);a.box(edge,x+2,y+Math.floor(winH*.57),winW-4,2);
    a.layer(16);a.box(edge,x-5,y+winH+1,winW+10,4);a.box(shade,x-3,y+winH+5,winW+7,2);
   }
   if(detail>=2){
    a.layer(17);
    if(k%4===0){a.box(p.wood,x+5,y+winH-7,15,5);a.add(p.leaf,`M${x+8} ${y+winH-7}v-8h3v-5h3v8h4v5Z`);}
    else if(k%4===1){a.box(lit?'#d5906f':p.wood,x+8,y+winH-12,winW-16,2);a.box(p.roof,x+10,y+winH-18,4,6);a.box(edge,x+17,y+winH-16,3,4);}
    else if(k%4===2){a.box(p.metal,x+8,y+winH-9,12,4);a.box(edge,x+10,y+winH-13,8,4);}
    if(row<floors-1&&k%4===3){a.layer(18);
     a.box(shade,x-8,y+winH+3,winW+16,13);a.box(p.metal,x-8,y+winH+2,winW+16,3);a.box(p.metal,x-8,y+winH+16,winW+16,3);
     for(let rail=0;rail<winW+16;rail+=9)a.box(p.metal,x-8+rail,y+winH+4,2,12);
     a.box(p.wood,x+4,y+winH-1,17,6);a.box(p.leaf,x+7,y+winH-6,13,5);
    }
   }
   if(detail>=3){a.layer(19);a.box(lit?'#fff3cb':'#daeee4',x+10,y+8,2,8);a.box(shade,x-7,y+10,2,winH-13);if(k%3===0)a.box(p.roof,x+winW-13,y+winH-7,4,3);}
  }
 }
 a.layer(5);
 if(detail>0){
  const dx=Math.round(w*.28),dy=face-35;
  if(v%3!==1){a.add(p.ink,`M${dx-24} ${dy+4}v-4h7v-10h8v-8h18v8h8v10h7v4Z`);a.box(wall,dx-17,dy+4,34,25);a.box(p.ink,dx-12,dy+7,24,18);a.box(p.water,dx-9,dy+10,18,12);a.box(edge,dx-1,dy+8,2,17);a.box(edge,dx-21,dy+29,42,3);}
  else{a.box(p.wood,dx-18,dy-3,36,11);a.box(edge,dx-21,dy-7,42,4);a.box(p.ink,dx-11,dy,22,5);}
 }
 if(detail>=2&&v===4){a.layer(3);for(let y=face+22,row=0;y<-32;y+=12,row++){a.box(shade,24,y,w-62,1);for(let x=28+row%2*15;x<w-35;x+=31)a.box(shade,x,y,1,11);}}
 if(detail>=3&&v===5){a.layer(3);for(let x=26;x<w-33;x+=17)a.box(shade,x,face+16,1,-face-49);}
 // A real recessed entrance, two door leaves, stone steps, plaque and intercom.
 a.layer(30);const door=Math.round(w/2);a.box(p.ink,door-31,-66,62,63);a.box(p.wood,door-27,-62,54,56);
 a.box(shade,door-24,-59,22,48);a.box(shade,door+2,-59,22,48);a.box(p.night?'#dab27f':'#93b8b8',door-22,-57,18,22);a.box(p.night?'#dab27f':'#93b8b8',door+4,-57,18,22);
 a.box(edge,door+7,-29,3,10);a.box(p.metal,door-40,-74,80,9);a.box(edge,door-44,-76,88,3);a.box(shade,door-44,-7,88,15);a.box(edge,door-40,-7,80,4);a.box(edge,door-46,3,92,3);
 a.box(p.metal,door+38,-48,10,22);a.box(p.ink,door+41,-45,4,6);if(detail>0){for(let i=0;i<3;i++)a.box(edge,door+41,-36+i*3,4,1);a.box(p.leafDark,door+53,-49,22,14);a.box(edge,door+59,-45,2,6);a.box(edge,door+65,-45,5,2);}
 if(detail>=2){a.layer(3);for(let i=0;i<8;i++){const x=24+(seed+i*43)%(w-55),y=face+15+(seed+i*29)%Math.max(1,-face-45);a.box(shade,x,y,7+i%3*3,1);}a.box(p.wood,door-24,8,48,6);a.box(edge,door-19,10,38,1);}
 if(detail>=4){a.layer(4);for(let i=0;i<55;i++){const x=22+(seed+i*71)%(w-55),y=face+7+(seed+i*37)%Math.max(1,-face-38);if((x>door-40&&x<door+80&&y>-80))continue;a.box(i%2?edge:shade,x,y,2,1);}a.box('#f7ebd3',5,face+10,1,-face-40);}
 return <g data-building={o.id} data-city-material="facade" data-window-count={columns*floors}>{a.art()}{o.home&&<g><path d={`M${door-58}-102h116v16h-116Z`} fill={p.leafDark}/><text x={door} y="-91" textAnchor="middle" fontSize="12" fill="#f5e6c6">ЛИПОВАЯ, 8</text></g>}</g>;
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
  for(const x of[-35,35]){a.add(p.ink,`M${x-17}-34h34v4h5v24h-5v4h-34v-4h-5v-24h5Z`);a.box(p.paving,x-14,-28,28,21);a.box(p.metal,x-1,-28,2,21);a.box(p.metal,x-14,-19,28,2);}
  a.add(v?p.roof:p.leaf,'M-35-20h8v-5h5v-6h5v-6h5v-6h7v5h-3v5h-5v6h-5v6H8v-5H3v-7h-5v-7h-6v-4h9v5h5v6h5v7h6v7h-52ZM11-47h5v7h5v7h5v6h5v6h6v4h-9v-6h-5v-6h-5v-6h-5Z');a.box(p.ink,-19,-51,21,4);a.box(p.metal,8,-58,18,3);a.box(p.metal,15,-55,3,10);if(detail>=2){a.box(p.trim,-12,-20,4,7);a.box(p.ink,-20,-12,10,3);a.box(p.trim,25,-37,22,2);}
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
