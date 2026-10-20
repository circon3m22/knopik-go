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
async function character(id,equipment,width,height){
 const root=parseAdventureSvg(renderToStaticMarkup(h('svg',null,h(AnimatedAdventureKnopik)))).children[0];
 new KnopikAnimator(root).paint({player:{x:0,y:0,hp:3,angle:Math.PI/2},area:'apartment',weapon:'fist',punchTime:0,punchSerial:0,walkDistance:0,moving:false,dodgeTime:0,checkpoint:3,tutorialOpened:true,equipment},true);
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
 character('expedition-explorer',{skin:'explorer',hat:false,mohawk:false,accessory:'goggles'},82,130),
 character('expedition-guide',{skin:'hunter',hat:false,mohawk:false,accessory:'ranger-hood'},39,63),
])).join('');
function scene(height){const portrait=height===640,ground=portrait?454:307,gate=ground-175;
 let bricks='';for(let row=0;row<12;row++)for(let col=0;col<8;col++){const x=col*52+(row%2?-26:0),y=gate-40+row*22;if(x>118&&x<295&&y>gate)continue;bricks+=`M${x} ${y}h45v2h-45Zm0 3h2v13h-2Z`;}
 let stars='';for(let i=0;i<25;i++){const x=9+i*79%343,y=8+i*41%(portrait?252:180);stars+=`M${x} ${y}h2v2h-2Z`;}
 return `<path d="M0 0h360v${height}H0Z" fill="#292a46"/><path d="M0 ${gate-48}h360v${height-gate+48}H0Z" fill="#403b58"/><path d="${stars}" fill="#b7a7c9"/>
 <path d="M0 ${gate-31}h29v-22h31v-16h23v66H0Zm300-18h18v-27h22v14h20v61h-60Z" fill="#514965"/>
 <path d="${bricks}" fill="#665672"/>
 <path d="M126 ${gate+26}h12v-19h18v-15h24v-10h68v10h24v15h18v19h12v149H126Z" fill="#272c3e"/>
 <path d="M138 ${gate+28}h12v-18h20v-13h21v-7h46v7h21v13h20v18h12v136H138Z" fill="#b59468"/>
 <path d="M151 ${gate+34}h11v-17h18v-12h22v-5h24v5h22v12h18v17h11v117H151Z" fill="#6c5b66"/>
 <path d="M161 ${gate+39}h10v-16h18v-10h50v10h18v16h10v112H161Z" fill="#1f2d3d"/>
 <path d="M176 ${gate+42}h9v-15h18v-6h22v6h18v15h9v109h-76Z" fill="#315b66"/>
 <path d="M190 ${gate+51}h8v-14h32v14h8v100h-48Z" fill="#648c88"/>
 <path d="M204 ${gate+54}h20v97h-20Z" fill="#d2c99e"/>
 <path d="M141 ${gate+49}h6v10h-6Zm0 25h6v10h-6Zm0 25h6v10h-6Zm0 25h6v10h-6Zm140-75h6v10h-6Zm0 25h6v10h-6Zm0 25h6v10h-6Zm0 25h6v10h-6Z" fill="#e6ca8d"/>
 <path d="M0 ${ground}h360v${height-ground}H0Z" fill="#454453"/><path d="M0 ${ground}h360v5H0Z" fill="#79717a"/>
 <path d="M150 ${ground-25}h132v10H150Zm-9 10h150v9H141Zm-9 9h168v9H132Zm-9 9h186v9H123Z" fill="#9b8d83"/>
 <path d="M153 ${ground-25}h126v2H153Zm-9 10h144v2H144Zm-9 9h162v2H135Zm-9 9h180v2H126Z" fill="#dbc49a"/>
 <path d="M12 ${ground-74}h20v-86H12Zm-5-86h30v-9H7Zm0 86h30v8H7ZM321 ${ground-28}h18v-102h-18Zm-5-102h28v-8h-28Zm0 102h28v8h-28Z" fill="#292f42"/>
 <path d="M17 ${ground-154}h4v74h-4Zm309 30h4v90h-4Z" fill="#7f7184"/>
 <path d="M8 ${ground-137}h28v8H8v14h-8v-22Zm307 35h30v9h-30v13h-7v-22Z" fill="#c69764"/>
 <path d="M12 ${ground-157}h6v-9h8v9h5v14H12Zm307 35h5v-9h8v9h6v14h-19Z" fill="#e4b971"/>
 <path d="M15 ${ground-153}h6v7h-6Zm307 35h6v7h-6Z" fill="#fff0bf"/>
 <path d="M38 ${ground+1}h86v5H38Zm153-28h47v4h-47Z" fill="#282e3e"/>
 <use href="#expedition-explorer" x="38" y="${ground-130}"/><use href="#expedition-guide" x="193" y="${ground-88}"/>
 <path d="M101 ${ground-48}h34v5h-34v-24h5v19Zm22-30h6v6h-6Z" fill="#d5b984"/>
 <path d="M0 ${portrait?530:326}h360v${portrait?110:34}H0Z" fill="#252b3d"/>
 <use href="#expedition-logo" x="124" y="${portrait?33:17}"/>
 ${text('EXPEDITION',portrait?87:58,5,'#e7c796')}${text('UPDATE',portrait?133:105,2,'#c9b6d3')}
 ${portrait?'':'<path d="M150 123h60v14h-60Z" fill="#292a46"/>'}${text('0.6.0',portrait?157:127,1,'#d4b4cf')}${text('21.10.26',portrait?180:338,2,'#e7d9b9')}
 <path d="M6 ${ground+22}h33v2H6Zm45 12h39v2H51Zm232-8h47v2h-47Z" fill="#a0928b"/>`;
}
function svg(height){return `<svg xmlns="http://www.w3.org/2000/svg" width="${height===640?1080:2160}" height="${height===640?1920:2160}" viewBox="0 0 ${height===640?'360 640':'1080 1080'}" shape-rendering="crispEdges" data-pixel-grid="360" data-release-art="expedition-060" role="img" aria-label="KNOPIK GO EXPEDITION UPDATE 0.6.0 · 21.10.26"><title>KNOPIK GO — EXPEDITION UPDATE — 0.6.0 — 21.10.26</title><defs>${defs}</defs><g${height===640?'':' transform="scale(3)"'}>${scene(height)}</g></svg>`;}
mkdirSync('outputs/announcement',{recursive:true});mkdirSync('public/release-artwork',{recursive:true});
const square=svg(360),portrait=svg(640),target='outputs/announcement/knopik-go-expedition-update-0.6.0';
writeFileSync('public/release-artwork/expedition-060.svg',square);writeFileSync('public/release-artwork/expedition-060-portrait.svg',portrait);
writeFileSync(`${target}.svg`,square);writeFileSync(`${target}-portrait.svg`,portrait);
await sharp(Buffer.from(square)).png({compressionLevel:9}).toFile(`${target}.png`);
await sharp(Buffer.from(square)).resize(1080,1080,{kernel:'nearest'}).png().toFile(`${target}-1080.png`);
await sharp(Buffer.from(portrait)).png({compressionLevel:9}).toFile(`${target}-portrait.png`);
console.log(JSON.stringify({square:`${target}.png`,portrait:`${target}-portrait.png`}));
