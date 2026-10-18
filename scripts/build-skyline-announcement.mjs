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
const logo=parseAdventureSvg(renderToStaticMarkup(h(PixelLogo)));logo.setAttribute('color','#1b3c5b');logo.setAttribute('xmlns','http://www.w3.org/2000/svg');logo.setAttribute('width','112');logo.setAttribute('height','22');
const defs=(await Promise.all([
 pixelSymbol('skyline-pixel-logo',serialize(logo),112,22),
 character('skyline-pixel-glacier',{skin:'glacier',hat:false,mohawk:false,accessory:'sky-boots'},76,114),
 character('skyline-pixel-ranger',{skin:'hunter',hat:false,mohawk:false,accessory:'ranger-hood'},56,84),
 character('skyline-pixel-classic',{skin:'classic',hat:true,mohawk:false,accessory:'cape'},56,84),
])).join('');
const cloud=(x,y)=>`<g transform="translate(${x} ${y})"><path d="M0 10h8V5h12V0h24v5h12v8h8v12H-6V15h6Z" fill="#eff7ed"/><path d="M-6 22h70v3H-6Zm10-12h11v3H4Z" fill="#badbe4"/></g>`;
function city(y,near=false){return `<g>${Array.from({length:near?9:13},(_,i)=>{const x=i*(near?46:30)-12,w=near?33:22,height=(near?25:42)+i*19%(near?38:61),top=y-height;return `<path d="M${x} ${top}h${w}v${height}h-${w}Z" fill="${near?'#699ab3':'#9fc5d5'}"/><path d="M${x-2} ${top-3}h${w+4}v3h-${w+4}Z" fill="${near?'#507e9d':'#8ab2c6'}"/>${Array.from({length:Math.floor(height/11)},(_,r)=>`<path d="M${x+4} ${top+5+r*11}h4v4h-4Zm9 0h4v4h-4Z" fill="${(i+r)%3?'#c7e3e5':'#eaf3d9'}"/>`).join('')}`;}).join('')}</g>`;}
const sparkle=(x,y)=>`<path d="M${x} ${y}h2v4h4v2h-4v4h-2v-4h-4v-2h4Z" fill="#f0f9ea"/>`;
function scene(height){const portrait=height===640,ground=portrait?382:294;return `
<rect width="360" height="${height}" fill="#82bddd"/>
<path d="M0 ${portrait?108:72}h360v${portrait?93:63}H0Z" fill="#94c9e2"/><path d="M0 ${portrait?201:135}h360v${portrait?93:63}H0Z" fill="#aed9e8"/><path d="M0 ${portrait?294:198}h360v${height}H0Z" fill="#c8e5e9"/>
${cloud(-9,portrait?174:152)}${cloud(292,portrait?202:183)}${cloud(226,portrait?38:17)}
${city(ground-15)}${city(ground)}
<path d="M0 ${ground}h360v${height-ground}H0Z" fill="#99bfce"/><path d="M0 ${ground}h360v5H0Zm0 9h360v3H0Z" fill="#edf4df"/>
<g fill="#719caf">${Array.from({length:portrait?54:18},(_,i)=>`<path d="M${i%9*44-8} ${ground+18+Math.floor(i/9)*14}h34v2h-34Z"/>`).join('')}</g>
<path d="M17 ${ground-9}h32v7H17Zm4 7h24v16H21Zm290-7h32v7h-32Zm4 7h24v16h-24Z" fill="#4c7b91"/>
<path d="M24 ${ground-31}h7v-9h7v18h8v10H21v-10h3Zm290 0h7v-9h7v18h8v10h-25v-10h3Z" fill="#709f81"/><path d="M26 ${ground-32}h3v10h-3Zm291 0h3v10h-3Z" fill="#b5cf9b"/>
<path d="M70 ${ground-4}h50v4H70Zm74-1h72v5h-72Zm97 1h50v4h-50Z" fill="#618ba0"/>
<use href="#skyline-pixel-ranger" x="66" y="${ground-84}"/><use href="#skyline-pixel-classic" x="242" y="${ground-84}"/><use href="#skyline-pixel-glacier" x="142" y="${ground-114}"/>
${sparkle(130,ground-71)}${sparkle(234,ground-113)}${sparkle(55,portrait?234:201)}
<use href="#skyline-pixel-logo" x="124" y="${portrait?27:20}"/>
${text('SKYLINE',portrait?84:69,6,'#214b6d')}${text('UPDATE',portrait?139:122,3,'#3e7393')}
${portrait?text('0.5.0',174,2,'#3f7190')+text('18.10.26',202,1,'#3f7190'):`<path d="M0 328h360v32H0Z" fill="#254e6e"/>${text('18.10.26',338,2,'#e4f5e9')}${text('0.5.0',154,1,'#3f7190')}`}
${portrait?'<path d="M0 516h360v124H0Z" fill="#527e9b"/><path d="M0 510h360v6H0Z" fill="#719ab0"/>':''}`;}
function svg(height){const portrait=height===640;return `<svg xmlns="http://www.w3.org/2000/svg" width="${portrait?1080:2160}" height="${portrait?1920:2160}" viewBox="0 0 ${portrait?'360 640':'1080 1080'}" shape-rendering="crispEdges" data-pixel-grid="360" data-release-art="skyline-050" role="img" aria-label="KNOPIK GO SKYLINE UPDATE 0.5.0 · 18.10.26"><title>KNOPIK GO — SKYLINE UPDATE — 0.5.0 — 18.10.26</title><defs>${defs}</defs><g${portrait?'':' transform="scale(3)"'}>${scene(height)}</g></svg>`;}
mkdirSync('outputs/announcement',{recursive:true});mkdirSync('public/release-artwork',{recursive:true});
const square=svg(360),portrait=svg(640),target='outputs/announcement/knopik-go-skyline-update-0.5.0';
writeFileSync(`${target}.svg`,square);writeFileSync(`${target}-portrait.svg`,portrait);
writeFileSync('public/release-artwork/skyline-pixel-050.svg',square);writeFileSync('public/release-artwork/skyline-pixel-050-portrait.svg',portrait);
await sharp(Buffer.from(square)).png({compressionLevel:9}).toFile(`${target}.png`);
await sharp(Buffer.from(square)).resize(1080,1080,{kernel:'nearest'}).png().toFile(`${target}-1080.png`);
await sharp(Buffer.from(portrait)).png({compressionLevel:9}).toFile(`${target}-portrait.png`);
console.log(JSON.stringify({square:`${target}.png`,portrait:`${target}-portrait.png`,grid:'360, integer pixel contours, no gradients or embedded raster'}));
