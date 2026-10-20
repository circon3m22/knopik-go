import '../tests/helpers/tsx-loader.mjs';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {writeFileSync,mkdirSync} from 'node:fs';
import sharp from 'sharp';
import {parseAdventureSvg} from '../tests/helpers/adventure-svg-dom.mjs';
const {AnimatedAdventureKnopik}=await import('../app/knopik-adventure-art.tsx');
const {KnopikAnimator}=await import('../app/knopik-adventure-animation.ts');
const {PixelLogo}=await import('../app/pixel-artwork.tsx');
const h=React.createElement;
const escape=s=>String(s).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const serialize=n=>`<${n.tag}${[...n.attrs].map(([k,v])=>` ${k}="${escape(v)}"`).join('')}>${escape(n.textContent)}${n.children.map(serialize).join('')}</${n.tag}>`;
/** Bake the game's own SVG actors onto an integer grid, then encode the pixels
 * as SVG runs. No embedded bitmap, antialiased edge, gradient or external art. */
async function pixelSymbol(id,source,width,height){
 const {data,info}=await sharp(Buffer.from(source)).trim().resize(width,height,{fit:'contain',position:'bottom',kernel:'nearest',background:'#00000000'}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const colors=new Map();
 for(let y=0;y<info.height;y++)for(let x=0;x<info.width;){const at=(y*info.width+x)*4;if(data[at+3]<128){x++;continue;}const color='#'+[data[at],data[at+1],data[at+2]].map(n=>n.toString(16).padStart(2,'0')).join('');let end=x+1;while(end<info.width){const p=(y*info.width+end)*4;if(data[p+3]<128||data[p]!==data[at]||data[p+1]!==data[at+1]||data[p+2]!==data[at+2])break;end++;}colors.set(color,(colors.get(color)??'')+`M${x} ${y}h${end-x}v1h-${end-x}Z`);x=end;}
 return `<g id="${id}">${[...colors].map(([fill,d])=>`<path fill="${fill}" d="${d}"/>`).join('')}</g>`;
}
async function character(id,equipment,width,height,angle=Math.PI/2,moving=false){
 const root=parseAdventureSvg(renderToStaticMarkup(h('svg',null,h(AnimatedAdventureKnopik)))).children[0];
 new KnopikAnimator(root).paint({player:{x:0,y:0,hp:3,angle},area:'apartment',weapon:'fist',punchTime:0,punchSerial:0,walkDistance:28,moving,dodgeTime:0,checkpoint:3,tutorialOpened:true,equipment},true);
 const prune=n=>{for(const c of [...n.children]){if(c.getAttribute('display')==='none')c.remove();else prune(c);}};prune(root);
 return pixelSymbol(id,`<svg xmlns="http://www.w3.org/2000/svg" width="110" height="174" viewBox="-55 -164 110 174" shape-rendering="crispEdges">${serialize(root)}</svg>`,width,height);
}
const glyphs={Y:['10001','10001','01010','00100','00100','00100','00100'],L:['10000','10000','10000','10000','10000','10000','11111'],I:['11111','00100','00100','00100','00100','00100','11111'],K:['10001','10010','10100','11000','10100','10010','10001'],H:['10001','10001','10001','11111','10001','10001','10001'],N:['10001','11001','11001','10101','10011','10011','10001'],'4':['00010','00110','01010','10010','11111','00010','00010'],'8':['01110','10001','10001','01110','10001','10001','01110'],'7':['11111','00001','00010','00100','01000','01000','01000'],
 A:['01110','10001','10001','11111','10001','10001','10001'],C:['01111','10000','10000','10000','10000','10000','01111'],D:['11110','10001','10001','10001','10001','10001','11110'],E:['11111','10000','10000','11110','10000','10000','11111'],G:['01111','10000','10000','10111','10001','10001','01111'],M:['10001','11011','10101','10101','10001','10001','10001'],P:['11110','10001','10001','11110','10000','10000','10000'],R:['11110','10001','10001','11110','10100','10010','10001'],S:['01111','10000','10000','01110','00001','00001','11110'],T:['11111','00100','00100','00100','00100','00100','00100'],U:['10001','10001','10001','10001','10001','10001','01110'],
 '0':['01110','10001','10011','10101','11001','10001','01110'],'1':['00100','01100','00100','00100','00100','00100','01110'],'2':['01110','10001','00001','00010','00100','01000','11111'],'3':['11110','00001','00001','01110','00001','00001','11110'],'5':['11111','10000','10000','11110','00001','00001','11110'],'6':['00110','01000','10000','11110','10001','10001','01110'],'.':['0','0','0','0','0','1','1'],' ':Array(7).fill('000')};
function text(value,y,size,fill,tracking=1){const width=([...value].reduce((n,c)=>n+glyphs[c][0].length,0)+(value.length-1)*tracking)*size;let x=Math.floor((360-width)/2),path='';for(const c of value){glyphs[c].forEach((row,r)=>[...row].forEach((v,col)=>{if(v==='1')path+=`M${x+col*size} ${y+r*size}h${size}v${size}h-${size}Z`;}));x+=(glyphs[c][0].length+tracking)*size;}return `<path aria-label="${value}" fill="${fill}" d="${path}"/>`;}
glyphs.O=['01110','10001','10001','10001','10001','10001','01110'];
glyphs.X=['10001','10001','01010','00100','01010','10001','10001'];
const logo=parseAdventureSvg(renderToStaticMarkup(h(PixelLogo)));logo.setAttribute('color','#f1dcaf');logo.setAttribute('xmlns','http://www.w3.org/2000/svg');logo.setAttribute('width','112');logo.setAttribute('height','22');
const defs=(await Promise.all([
 pixelSymbol('expedition-logo',serialize(logo),112,22),
 character('expedition-explorer',{skin:'explorer',hat:false,mohawk:false,accessory:'bandana'},92,140,Math.PI/4,true),
 character('expedition-guide',{skin:'hunter',hat:false,mohawk:false,accessory:'ranger-hood'},55,83,Math.PI/2),
])).join('');
const path=(d,fill,extra='')=>`<path d="${d}" fill="${fill}" ${extra}/>`;
function arch(x,y,w,h){return `M${x} ${y+h}V${y+52}h7V${y+32}h12V${y+17}h16V${y+6}h18V${y}h${w-106}v6h18v11h16v15h12v20h7v${h-52}Z`;}
function spill(top,width,y,bottom,bottomWidth,end,steps=10){let d=`M${top} ${y}`,right=top+width;for(let i=1;i<=steps;i++){const next=Math.round(top+(bottom-top)*i/steps),ny=Math.round(y+(end-y)*i/steps);d+=`V${ny}H${next}`;}d+=`H${bottom+bottomWidth}`;for(let i=steps-1;i>=0;i--){right=Math.round(top+width+(bottom+bottomWidth-top-width)*i/steps);d+=`V${Math.round(y+(end-y)*i/steps)}H${right}`;}return d+'Z';}
function scene(height){const portrait=height===640,ground=portrait?414:313,top=portrait?204:148,gateHeight=ground-top-17;
 let stars='',far='',masonry='',runes='',floor='';
 for(let i=0;i<33;i++){const x=9+i*79%343,y=8+i*47%(portrait?263:172);stars+=`M${x} ${y}h${i%7===0?2:1}v2h-${i%7===0?2:1}Z`;}
 for(let i=0;i<13;i++){const x=i*31-16,h=25+i*23%67,y=ground-94-h;far+=`M${x} ${y}h16v-9h8v9h5v${h+15}h-29Z`;}
 for(let row=0;row<8;row++)for(const side of[0,1]){const x=side?305:3+(row%2?0:-14),y=top+11+row*23;masonry+=`M${x} ${y}h46v2h-46Zm2 3h2v15h-2Z`;}
 for(let i=0;i<5;i++){const y=top+64+i*17;runes+=`M78 ${y}h5v7h-5Zm${i%2?3:0} 10h5v3h-5ZM${227} ${y}h5v7h-5Zm-3 10h5v3h-5Z`;}
 for(let row=0;row<(portrait?12:4);row++)for(let n=0;n<6;n++){const x=n*67-18+(row%2?22:0),y=ground+12+row*18;floor+=`M${x} ${y}h${24+(n*11+row*7)%25}v2h-${24+(n*11+row*7)%25}Z`;}
 let art=path(`M0 0h360v${height}H0Z`,'#20263e')+path(`M0 ${top-28}h360v${height-top+28}H0Z`,'#30374d')+path(stars,'#a297b7')+path(far,'#41465f');
 art+=path(`M0 ${top-4}h18v-21h18v-16h23v${ground-top+41}H0ZM302 ${top-12}h20v-29h17v18h21v${ground-top+23}h-58Z`,'#232c40');
 art+=path(`M0 ${top+21}h48v${ground-top-21}H0ZM315 ${top+11}h45v${ground-top-11}h-45Z`,'#544962')+path(masonry,'#7a667a');
 art+=path(arch(57,top-8,198,gateHeight+25),'#20263a')+path(arch(65,top,182,gateHeight),'#88697a')+path(arch(71,top+5,170,gateHeight-5),'#dfb479')+path(arch(77,top+11,158,gateHeight-11),'#6e5d71');
 art+=path(arch(86,top+17,140,gateHeight-17),'#1e394a')+path(arch(94,top+23,124,gateHeight-23),'#2d5d69')+path(arch(103,top+30,106,gateHeight-30),'#41828a')+path(arch(112,top+39,88,gateHeight-39),'#80b7ad')+path(arch(121,top+48,70,gateHeight-48),'#b8d5bc')+path(arch(132,top+58,48,gateHeight-58),'#e9e8bb');
 art+=path(runes,'#f7d5a1')+path(`M146 ${top-4}h20v17h-20Z`,'#4a485c')+path(`M153 ${top-1}h6v3h3v5h-3v3h-6V7h-3V2h3Z`,'#f9dc9f');
 art+=path(`M0 ${ground-2}h360v${height-ground+2}H0Z`,'#333a4d');
 art+=path(spill(106,103,ground-20,27,284,portrait?521:329),'#414e5a')+path(spill(124,66,ground-18,70,199,portrait?500:327),'#59696a')+path(spill(139,32,ground-17,110,130,portrait?466:325),'#8a9382');
 for(let n=0;n<5;n++){const x=104-n*8,y=ground-27+n*7,w=108+n*16;art+=path(`M${x} ${y}h${w}v7h-${w}Z`,n%2?'#736c78':'#897e83')+path(`M${x} ${y}h${w}v2h-${w}Z`,'#d6bc99');}
 art+=path(floor,'#6d6d7b');
 // Broken foreground columns, hanging ivy and tiny hot pixels frame the open gateway.
 art+=path(`M19 ${ground-4}h18V${top+43}H19Zm-7-7h32v10H12ZM315 ${ground-3}h16V${top+64}h-16Zm-6-8h29v9h-29Z`,'#192b3c');
 art+=path(`M23 ${top+51}h4v${ground-top-66}h-4ZM319 ${top+72}h3v${ground-top-85}h-3Z`,'#78808a');
 art+=path(`M9 ${top+40}h37v8H9ZM305 ${top+63}h37v8h-37Z`,'#a58976')+path(`M9 ${top+40}h37v2H9ZM305 ${top+63}h37v2h-37Z`,'#e6c99b');
 art+=path(`M5 ${top+23}h9v-8h7v13h9v9H13v21H6V38H0v-8h5ZM337 ${top+45}h9v-9h7v17h7v9h-16v21h-7Z`,'#446969');
 art+=path(`M10 ${top+27}h6v5h-6Zm-4 17h6v4H6ZM343 ${top+50}h6v5h-6Zm-5 18h6v4h-6Z`,'#7f9b7d');
 const smallBase=ground-22,heroBase=ground+3;
 art+=path(`M93 ${smallBase}h53v4H93ZM212 ${heroBase-1}h93v5h-93Z`,'#1b2c3c');
 art+=`<use href="#expedition-guide" x="92" y="${smallBase-83}"/><use href="#expedition-explorer" x="210" y="${heroBase-140}"/>`;
 // A hand-drawn lantern and route sheet give the explorers a purpose.
 art+=path(`M204 ${heroBase-63}h8v4h-8Zm1 4h6v7h-6Zm-5 7h16v22h-16Z`,'#293744')+path(`M203 ${heroBase-49}h10v14h-10Z`,'#ddad70')+path(`M205 ${heroBase-47}h5v10h-5Z`,'#fff0be');
 art+=path(`M128 ${smallBase-33}h23v16h-23Z`,'#e6d0a7')+path(`M132 ${smallBase-29}h6v2h6v5h-3v-3h-9Z`,'#668d86');
 art+=path(`M45 ${ground-21}h24v6H45v10H32v-8h6v-8h7ZM302 ${ground+4}h24v5h-24Zm7 5h13v6h-13Z`,'#6f6879')+path(`M45 ${ground-21}h24v2H45ZM302 ${ground+4}h24v2h-24Z`,'#b9a096');
 let sparks='';for(let i=0;i<16;i++){const x=58+i*47%211,y=top+40+i*29%Math.max(40,gateHeight-39);sparks+=`M${x} ${y}h${i%4?1:2}v2h-${i%4?1:2}Z`;}
 art+=path(sparks,'#f2d2a0');
 const logoY=portrait?27:16,titleY=portrait?76:54;
 art+=`<use href="#expedition-logo" x="124" y="${logoY}"/>`+text('EXPEDITION',titleY+2,5,'#151e30')+text('EXPEDITION',titleY,5,'#eace9c');
 const updateY=titleY+43;
 art+=path(`M58 ${updateY+9}h54v1H58Zm190 0h54v1h-54ZM113 ${updateY+7}h3v5h-3Zm131 0h3v5h-3Z`,'#927d99')+text('UPDATE',updateY,3,'#bfb0d1');
 art+=text('0.6.0',portrait?148:126,2,'#cec1cc');
 if(portrait){art+=text('21.10.26',173,2,'#dfc89e')+path('M0 525h360v115H0Z','#202b3c')+path('M24 525h312v1H24Z','#665e71');}
 else{art+=path('M0 331h360v29H0Z','#202b3c')+path('M24 331h312v1H24Z','#665e71')+text('21.10.26',340,2,'#dfc89e');}
 return art;
}

function svg(height){return `<svg xmlns="http://www.w3.org/2000/svg" width="${height===640?1080:2160}" height="${height===640?1920:2160}" viewBox="0 0 ${height===640?'360 640':'1080 1080'}" shape-rendering="crispEdges" data-pixel-grid="360" data-art-revision="vault-2" data-release-art="expedition-060" role="img" aria-label="KNOPIK GO EXPEDITION UPDATE 0.6.0 · 21.10.26"><title>KNOPIK GO — EXPEDITION UPDATE — 0.6.0 — 21.10.26</title><defs>${defs}</defs><g${height===640?'':' transform="scale(3)"'}>${scene(height)}</g></svg>`;}
mkdirSync('outputs/announcement',{recursive:true});mkdirSync('public/release-artwork',{recursive:true});
const square=svg(360),portrait=svg(640),target='outputs/announcement/knopik-go-expedition-update-0.6.0';
writeFileSync('public/release-artwork/expedition-060.svg',square);writeFileSync('public/release-artwork/expedition-060-portrait.svg',portrait);
writeFileSync(`${target}.svg`,square);writeFileSync(`${target}-portrait.svg`,portrait);
await sharp(Buffer.from(square)).png({compressionLevel:9}).toFile(`${target}.png`);
await sharp(Buffer.from(square)).resize(1080,1080,{kernel:'nearest'}).png().toFile(`${target}-1080.png`);
await sharp(Buffer.from(portrait)).png({compressionLevel:9}).toFile(`${target}-portrait.png`);
console.log(JSON.stringify({square:`${target}.png`,portrait:`${target}-portrait.png`}));
